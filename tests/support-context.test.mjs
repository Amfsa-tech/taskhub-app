import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '..');
const mobile = true;
function load(file, mocks = {}) {
  const compiled = ts.transpileModule(readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const loadedModule = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => mocks[name] ?? require(name), loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

test('request failures produce identity-aware readable support drafts without changing request results', async () => {
  const savedFetch = globalThis.fetch;
  const savedWindow = globalThis.window;
  const savedStorage = globalThis.localStorage;
  const savedBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  const context = load('lib/support-context.ts');
  const scope = context.supportScope('test-user', '/wallet');
  context.setSupportScope(scope);
  globalThis.window = { location: { hostname: 'localhost' } };
  const storage = new Map([['token', 'test-session']]);
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  process.env.NEXT_PUBLIC_API_BASE_URL = 'https://example.invalid';
  const calls = [];
  let resultStatus = 503;
  let release;
  try {
    globalThis.fetch = async (url, options) => {
      calls.push({ url, options });
      return new Response(JSON.stringify(resultStatus === 200 ? { status: 'success', value: 42 } : { message: 'INTERNAL_SERVER_ERROR {token: secret} Something went wrong' }), { status: resultStatus, headers: { 'Content-Type': 'application/json' } });
    };
    const client = load(mobile ? 'lib/api/client.ts' : 'lib/api.ts', {
      '@/lib/support-context': context,
      '@/lib/config': { API_BASE_URL: 'https://example.invalid' },
      'next/navigation': { redirect() {} },
    });
    if (mobile) client.setApiToken('test-session');
    const request = mobile ? client.apiRequest : client.apiData;
    const endpoint = '/api/wallet/user/fund';
    await assert.rejects(request(endpoint, { method: 'POST' }), error => error.status === 503);
    assert.equal(calls[0].options.headers.Authorization, 'Bearer test-session');
    assert.equal(calls[0].options.method, 'POST');
    const message = context.buildSupportMessage({ fullName: 'Test Person', emailAddress: 'test@example.invalid' }, context.currentSupportIssue(context.getSupportSnapshot(), scope));
    assert.match(message, /my name is Test Person/);
    assert.match(message, /test@example.invalid/);
    assert.match(message, /payment checkout could not be started/);
    assert.doesNotMatch(message, /INTERNAL_SERVER_ERROR|secret|token|Something went wrong|503/);
    resultStatus = 200;
    assert.deepEqual(await request('/api/wallet/user/balance'), { status: 'success', value: 42 });
    assert.ok(context.getSupportSnapshot(), 'an unrelated successful request must not clear the failure');
    assert.deepEqual(await request(endpoint, { method: 'POST' }), { status: 'success', value: 42 });
    assert.equal(context.getSupportSnapshot(), null, 'successful retry clears the matching failure');

    globalThis.fetch = () => new Promise(resolve => { release = resolve; });
    const oldRequest = request(endpoint, { method: 'POST' });
    context.setSupportScope('other-user:/profile');
    release(new Response(JSON.stringify({ message: 'Unexpected error' }), { status: 503, headers: { 'Content-Type': 'application/json' } }));
    await assert.rejects(oldRequest);
    assert.equal(context.getSupportSnapshot(), null, 'late results cannot leak into a different account or screen');

    context.setSupportScope(scope);
    let attempts = 0;
    globalThis.fetch = async url => {
      if (String(url).endsWith('/api/auth/refresh')) {
        context.setSupportScope('other-user:/profile');
        return new Response(JSON.stringify({ token: 'test-refreshed-session', user_type: 'user' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      attempts++;
      return new Response(JSON.stringify({ message: 'Unavailable' }), { status: attempts === 1 ? 401 : 503, headers: { 'Content-Type': 'application/json' } });
    };
    if (mobile) client.setAuthRefreshHandler(async () => { context.setSupportScope('other-user:/profile'); return 'test-refreshed-session'; });
    await assert.rejects(request(endpoint, { method: 'POST' }), error => error.status === 503);
    assert.equal(attempts, 2, 'the authenticated request still retries after refresh');
    assert.equal(context.getSupportSnapshot(), null, 'a retry retains the original support scope across session refresh');
  } finally {
    globalThis.fetch = savedFetch;
    if (savedWindow === undefined) delete globalThis.window; else globalThis.window = savedWindow;
    if (savedStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = savedStorage;
    if (savedBase === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL; else process.env.NEXT_PUBLIC_API_BASE_URL = savedBase;
  }
});

test('expected onboarding, background notifications and cancelled requests do not replace real issues', () => {
  const context = load('lib/support-context.ts');
  const scope = 'test-user:/wallet';
  context.setSupportScope(scope);
  const issue = context.makeSupportIssue('withdrawal', new Error('INSUFFICIENT_FUNDS'));
  context.recordSupportIssue(issue);
  context.captureSupportRequest('/api/auth/switch-mode', 'POST', { body: { code: 'counterpart_not_found' } }, scope);
  context.captureSupportRequest('/api/notifications', 'GET', new Error('Unavailable'), scope);
  context.captureSupportRequest('/api/tasks', 'GET', { name: 'AbortError' }, scope);
  assert.equal(context.getSupportSnapshot().issue, issue);
  assert.match(context.buildSupportMessage({ firstName: 'Ada', lastName: 'Okafor', email: 'ada@example.invalid' }, issue), /Ada Okafor[\s\S]*ada@example.invalid[\s\S]*balance was too low/);
  assert.equal(context.currentSupportIssue(context.getSupportSnapshot(), 'test-user:/profile'), undefined);
  context.setSupportScope('guest:/home');
  assert.equal(context.getSupportSnapshot(), null);
});
