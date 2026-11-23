import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '..');
function load(file, mocks = {}, cache = new Map()) {
  if (cache.has(file)) return cache.get(file);
  const code = ts.transpileModule(readFileSync(path.join(root, file), 'utf8'), {
    fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => {
    if (name in mocks) return mocks[name];
    if (name.startsWith('@/') || name.startsWith('.')) {
      const relative = name.startsWith('@/') ? name.slice(2) : path.join(path.dirname(file), name);
      const source = ['.ts', '.tsx'].map(ext => relative + ext).find(candidate => existsSync(path.join(root, candidate)));
      if (source) return load(source, mocks, cache);
    }
    return require(name);
  }, module, module.exports);
  cache.set(file, module.exports);
  return module.exports;
}

const endpoints = ['/api/tasks', '/api/bids', '/api/bids/invite', '/api/bids/hire-request',
  '/api/chat/conversations', '/api/chat/conversations/conversation-1/messages', '/api/tasks/report'];

test('per-account rate limits retain the server message and session without refreshing or replaying any action', async () => {
  const original = { fetch: globalThis.fetch, window: globalThis.window, localStorage: globalThis.localStorage };
  const storage = new Map([['token', 'test-session'], ['userType', 'user']]);
  globalThis.window = { location: { hostname: 'www.ngtaskhub.com', pathname: '/home', href: '/home' } };
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  const mocks = {
    '@/lib/config': { API_BASE_URL: 'https://api.example.invalid' },
    '@/lib/support-context': { getSupportScope: () => '', captureSupportRequest() {}, clearSupportIssue() {} },
  };
  const client = load('lib/api/client.ts', mocks);
  let refreshes = 0;
  client.setApiToken('test-session');
  client.setAuthRefreshHandler(async () => { refreshes++; return null; });
  try {
    for (const endpoint of endpoints) {
      const requests = [];
      const message = endpoint.endsWith('/messages') ? 'You are sending messages too quickly. Please slow down.' : 'You have reached the limit for this action. Please try again later.';
      globalThis.fetch = async (url, options) => {
        requests.push({ url, options });
        return new Response(JSON.stringify({ status: 'error', code: 'rate_limit_exceeded', message }), {
          status: 429, headers: { 'Content-Type': 'application/json', 'RateLimit-Reset': '60' },
        });
      };
      await assert.rejects(client.apiRequest(endpoint, { method: 'POST', body: {} }), error => {
        assert.ok(error instanceof client.ApiError);
        assert.equal(error.status, 429);
        assert.equal(error.message, message);
        assert.equal(error.body.code, 'rate_limit_exceeded');
        return true;
      });
      assert.equal(requests.length, 1);
      assert.equal(requests[0].options.headers.Authorization, 'Bearer test-session');
      assert.equal(refreshes, 0);
      assert.equal(storage.get('token'), 'test-session');
      assert.equal(globalThis.window.location.href, '/home');
      assert.equal(client.getApiToken(), 'test-session');
    }
  } finally {
    client.setApiToken(null); client.setAuthRefreshHandler(null);
    globalThis.fetch = original.fetch;
    globalThis.window = original.window;
    globalThis.localStorage = original.localStorage;
  }
});
