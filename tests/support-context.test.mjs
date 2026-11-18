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


test('biometric enrollment stores the verified credential and signs the exact server challenge', async () => {
  const calls = [];
  const storage = new Map();
  let keysExist = false;
  let revoked = false;
  class ApiError extends Error {
    constructor(code) { super(code); this.code = code; }
  }
  class Biometrics {
    async isSensorAvailable() { return { available: true, biometryType: 'FaceID' }; }
    async biometricKeysExist() { return { keysExist }; }
    async createKeys() { keysExist = true; return { publicKey: 'device-public-key' }; }
    async deleteKeys() { keysExist = false; }
    async createSignature(request) {
      assert.equal(request.payload, 'server-challenge');
      return { success: true, signature: 'device-signature' };
    }
  }
  const { startBiometricEnrollment, confirmBiometricEnrollment, readBiometricCredential, loginWithBiometrics } = load('lib/auth/biometrics.ts', {
    'expo-crypto': { randomUUID: () => 'install-id' },
    'expo-secure-store': {
      getItemAsync: async (key) => storage.get(key) ?? null,
      setItemAsync: async (key, value) => storage.set(key, value),
      deleteItemAsync: async (key) => storage.delete(key),
    },
    'react-native': { NativeModules: { ReactNativeBiometrics: {} }, Platform: { OS: 'ios' } },
    'react-native-biometrics': { default: Biometrics },
    '@/lib/api/client': { ApiError, api: {
      async post(path, body, options) {
        const action = path.replace('/api/auth/biometrics/', '');
        calls.push({ action, body, options });
        if (revoked) throw new ApiError('BIOMETRIC_NOT_AVAILABLE');
        if (action === 'enroll') return { data: { challengeId: 'email-challenge' } };
        if (action === 'enroll/verify') return { data: { credentialId: 'verified-credential' } };
        if (action === 'challenge') return { data: { challengeId: 'login-challenge', challenge: 'server-challenge' } };
        return { token: 'new-session', user_type: 'tasker' };
      },
    } },
  });
  const enrollment = await startBiometricEnrollment();
  assert.equal(await readBiometricCredential(), null);
  assert.deepEqual(calls[0].body, { publicKey: 'device-public-key', deviceId: 'install-id', deviceName: 'iPhone', platform: 'ios', biometryType: 'face_id' });
  await confirmBiometricEnrollment(enrollment.challengeId, '04219', { accountId: 'test-profile', accountType: 'tasker', label: enrollment.label });
  assert.deepEqual(calls[1].body, { challengeId: 'email-challenge', code: '04219' });
  assert.equal((await readBiometricCredential()).credentialId, 'verified-credential');
  assert.equal((await loginWithBiometrics()).token, 'new-session');
  assert.deepEqual(calls[2].body, { credentialId: 'verified-credential' });
  assert.deepEqual(calls[3].body, { credentialId: 'verified-credential', challengeId: 'login-challenge', signature: 'device-signature' });
  assert.equal(calls[3].options.auth, false);
  revoked = true;
  await assert.rejects(loginWithBiometrics(), { code: 'BIOMETRIC_NOT_AVAILABLE' });
  assert.equal(await readBiometricCredential(), null);
  assert.equal(keysExist, false);
});

test('an incorrect payout PIN is surfaced after one request without refreshing the session', async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  const originalStorage = globalThis.localStorage;
  const originalBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  const storage = new Map([['token', 'test-session']]);
  globalThis.window = { location: { hostname: 'localhost' } };
  globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, removeItem: (key) => storage.delete(key) };
  process.env.NEXT_PUBLIC_API_BASE_URL = 'https://example.invalid';
  const requests = [];
  let refreshes = 0;
  const context = load('lib/support-context.ts');
  const client = load(mobile ? 'lib/api/client.ts' : 'lib/api.ts', {
    '@/lib/support-context': context,
    '@/lib/config': { API_BASE_URL: 'https://example.invalid' },
    'next/navigation': { redirect() {} },
  });
  if (mobile) {
    client.setApiToken('test-session');
    client.setAuthRefreshHandler(async () => { refreshes++; return 'new-token'; });
  }
  globalThis.fetch = async (url) => {
    requests.push(url);
    return new Response(JSON.stringify({
      code: 'INCORRECT_PIN',
      message: 'Incorrect transaction PIN',
      attemptsRemaining: 4,
    }), { status: 401 });
  };
  try {
    const request = mobile ? client.apiRequest : client.apiData;
    await assert.rejects(request('/api/wallet/withdraw', { method: 'POST' }), (error) => {
      assert.equal((mobile ? error.body : error.data).attemptsRemaining, 4);
      return error.status === 401;
    });
    assert.equal(requests.length, 1);
    assert.equal(refreshes, 0);
    assert.equal(storage.get('token'), 'test-session');
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.window = originalWindow;
    globalThis.localStorage = originalStorage;
    if (originalBase == null) delete process.env.NEXT_PUBLIC_API_BASE_URL;
    else process.env.NEXT_PUBLIC_API_BASE_URL = originalBase;
  }
});

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
