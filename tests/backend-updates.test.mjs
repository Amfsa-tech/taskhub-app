import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import ts from 'typescript';
const require = createRequire(import.meta.url), root = path.resolve(import.meta.dirname, '..');
function load(file, mocks = {}) {
  const code = ts.transpileModule(readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  new Function('require','module','exports',code)(name => name in mocks ? mocks[name] : require(name), module, module.exports);
  return module.exports;
}

test('pending and in-progress sessions can resume while final decisions still block', () => {
  const { verificationRetryBlocked } = load('lib/verification-status.ts');
  for (const status of ['pending','in_progress','not_started']) assert.equal(verificationRetryBlocked({status}), false);
  for (const status of ['approved','under_review']) assert.equal(verificationRetryBlocked({status}), true);
  assert.equal(verificationRetryBlocked({status:'rejected',resubmissionAllowed:false}), true);
  assert.equal(verificationRetryBlocked({status:'rejected',resubmissionAllowed:true}), false);
  assert.equal(verificationRetryBlocked({status:'rejected',isDuplicate:true,resubmissionAllowed:false}), true);
});

test('provider switches have no retained cache or polling and launch always rechecks', async () => {
  let config, calls = 0;
  let latest = { data: { anyEnabled: true, providers: [{key:'qoreid',enabled:true}] } };
  const { useKycProviders } = load('hooks/use-kyc-providers.ts', {
    react: { useCallback: callback => callback },
    '@tanstack/react-query': { useQuery: options => { config=options; return { refetch: async () => { calls++; return latest; } }; } },
    '@/lib/api/kyc': { getKycProviders: () => {} },
    '@/lib/kyc-providers': { kycProviderEnabled: (data, key) => data?.anyEnabled && data.providers.some(provider => provider.key === key && provider.enabled) },
  });
  const hook = useKycProviders();
  assert.equal(config.staleTime, 0); assert.equal(config.gcTime, 0); assert.equal(config.refetchOnMount, 'always'); assert.equal(config.refetchInterval, false);
  await hook.checkEnabled('qoreid'); latest = {data:{anyEnabled:false,providers:[]}};
  await assert.rejects(hook.checkEnabled('qoreid'), /unavailable/); assert.equal(calls, 2);
});

test('nullable balances display unknown without hiding a legitimate zero', () => {
  const { formatBalance } = load('lib/money.ts');
  assert.equal(formatBalance(null), 'N/A'); assert.equal(formatBalance(undefined), 'N/A'); assert.equal(formatBalance(null,0), 'N/A');
  assert.equal(formatBalance(0,0), '₦0.00'); assert.equal(formatBalance(20,123456), '₦1,234.56');
});

test('a task-conflict response refreshes state and never repeats the payment action', async () => {
  const requests = [], keys = [], originalFetch = globalThis.fetch;
  const { refreshChangedTask, TASK_CHANGED_MESSAGE } = load('lib/task-conflict.ts');
  const client = load('lib/api/client.ts', {
    '@/lib/config': { API_BASE_URL: 'https://example.test' },
    '@/lib/support-context': { getSupportScope: () => 'account-1', captureSupportRequest() {}, clearSupportIssue() {} },
    '@/lib/query-client': { queryClient: { invalidateQueries: async ({queryKey}) => { keys.push(queryKey); } } },
    '@/lib/task-conflict': { refreshChangedTask, TASK_CHANGED_MESSAGE },
  });
  try {
    globalThis.fetch = async (url, options) => { requests.push({url,options}); return new Response(JSON.stringify({code:'TASK_STATE_CHANGED',message:'Changed'}), {status:409}); };
    client.setApiToken('example-session');
    await assert.rejects(client.api.patch('/api/tasks/task-1/status', {status:'completed'}), error => error.status===409 && error.code==='TASK_STATE_CHANGED' && error.message===TASK_CHANGED_MESSAGE);
    assert.equal(requests.length,1); assert.deepEqual(keys,[['tasks']]);
  } finally { globalThis.fetch=originalFetch; }
});
