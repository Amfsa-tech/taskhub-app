import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import React from 'react';
import { create, act } from 'react-test-renderer';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '..');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function loadModule(relative, mocks) {
  const filename = path.join(root, relative);
  const source = readFileSync(filename, 'utf8');
  const javascript = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', javascript)((name) => {
    if (mocks[name]) return mocks[name];
    if (name === './role-session') return loadModule('lib/auth/role-session.ts', mocks);
    return require(name);
  }, module, module.exports);
  return module.exports;
}

async function mountAuth(sourceRole) {
  const targetRole = sourceRole === 'tasker' ? 'user' : 'tasker';
  const sourceUser = { _id: sourceRole + '-id', emailAddress: 'source@example.invalid' };
  let stored = { token: 'test-source-session', accountType: sourceRole, user: sourceUser };
  let activeToken;
  let started = false;
  let profileShouldFail = true;
  let returnedRole = targetRole;
  const events = [];
  let lastPayload;
  class ApiError extends Error {
    constructor(message, status, body) { super(message); this.status = status; this.code = body?.code; this.body = body; }
  }
  const response = () => ({ accessToken: 'test-target-session', userType: returnedRole, refreshToken: 'test-refresh-session' });
  const mocks = {
    'react-native': { Platform: { OS: 'android' } },
    'expo-apple-authentication': {},
    '@/lib/api/client': {
      ApiError,
      setApiToken(value) { activeToken = value; if (started) events.push('activate'); },
      setAuthRefreshHandler() {},
    },
    '@/lib/push': { watchPushSubscriptionId() { return () => {}; } },
    '@/lib/query-client': { queryClient: { async cancelQueries() { events.push('cancel'); }, removeQueries() { events.push('clear-cache'); } } },
    './apple': {}, './google': {},
    './storage': {
      async loadSession() { return stored; }, async loadRefreshToken() { return null; },
      async saveSession(session) { events.push('persist'); stored = session; },
      async saveUser() {}, async saveTokens() {}, async clearSession() { stored = null; },
    },
    './auth-api': {
      async getProfile(role) {
        if (started) {
          events.push('profile:' + role);
          assert.equal(activeToken, 'test-target-session');
          assert.equal(stored.accountType, targetRole);
          if (profileShouldFail) { profileShouldFail = false; throw new Error('Temporary profile failure'); }
        }
        return { user: { ...sourceUser, _id: role + '-id' } };
      },
      async createLinkedRole(payload) { events.push('create'); lastPayload = payload; assert.equal(activeToken, 'test-source-session'); return response(); },
      async linkAccountAndSwitch(email, password) { events.push('link'); lastPayload = { email, password }; assert.equal(activeToken, 'test-source-session'); return response(); },
      async switchAccountMode() { throw new ApiError('Missing role', 404, { code: 'counterpart_not_found' }); },
    },
  };
  const { AuthProvider, useAuth } = loadModule('lib/auth/auth-context.tsx', mocks);
  let auth;
  function Harness() { auth = useAuth(); return null; }
  let renderer;
  await act(async () => { renderer = create(React.createElement(AuthProvider, null, React.createElement(Harness))); });
  started = true;
  return {
    get auth() { return auth; }, get stored() { return stored; }, get payload() { return lastPayload; },
    events, targetRole,
    wrongRole() { returnedRole = sourceRole; },
    async close() { await act(async () => renderer.unmount()); },
  };
}

for (const sourceRole of ['tasker', 'user']) for (const action of ['create', 'link']) {
  test(`mobile ${sourceRole} -> ${sourceRole === 'tasker' ? 'user' : 'tasker'} ${action}: durable handoff and profile retry`, async () => {
    const fixture = await mountAuth(sourceRole);
    try {
      const target = fixture.targetRole;
      await act(async () => {
        const request = action === 'link'
          ? fixture.auth.linkRoleAndSwitch(' Linked@Example.Invalid ', 'test-password')
          : fixture.auth.createRoleAndSwitch({ user_type: target, fullName: 'Test Person', country: 'Nigeria', ...(target === 'tasker' ? { mainCategories: ['category-id'], subCategories: ['service-id'] } : {}) });
        await assert.rejects(request, /Temporary profile failure/);
      });
      assert.equal(fixture.auth.accountType, target);
      assert.equal(fixture.stored.accountType, target);
      assert.equal(fixture.auth.user, null);
      await act(async () => fixture.auth.refreshProfile());
      assert.equal(fixture.auth.user._id, target + '-id');
      assert.equal(fixture.events.filter((event) => event === action).length, 1);
      assert.ok(fixture.events.indexOf('persist') < fixture.events.indexOf('activate'));
      assert.ok(fixture.events.indexOf('activate') < fixture.events.indexOf('profile:' + target));
      if (action === 'link') assert.deepEqual(fixture.payload, { email: 'linked@example.invalid', password: 'test-password' });
      else assert.equal(fixture.payload.user_type, target);
    } finally { await fixture.close(); }
  });
}

for (const source of ['tasker', 'user']) test(`mobile linking rejects a wrong-role response for ${source}`, async () => {
  const fixture = await mountAuth(source);
  try {
    fixture.wrongRole();
    await act(async () => { await assert.rejects(fixture.auth.linkRoleAndSwitch('test@example.invalid', 'test-password'), /valid session/); });
    assert.equal(fixture.auth.accountType, source);
    assert.equal(fixture.stored.accountType, source);
    assert.equal(fixture.events.includes('persist'), false);
  } finally { await fixture.close(); }
});

test('missing Tasker role still permits linking without requiring onboarding metadata first', async () => {
  const fixture = await mountAuth('user');
  try {
    let outcome;
    await act(async () => { outcome = await fixture.auth.switchMode(); });
    assert.equal(outcome.kind, 'role-creation-required');
    assert.equal(fixture.auth.accountType, 'user');
    assert.equal(fixture.events.some((event) => event.startsWith('profile:')), false);
  } finally { await fixture.close(); }
});
