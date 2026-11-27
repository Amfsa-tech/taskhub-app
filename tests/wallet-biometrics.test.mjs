import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import React from 'react';
import { act, create } from 'react-test-renderer';
import ts from 'typescript';

const require = createRequire(import.meta.url);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
function load(file, mocks) {
  const code = ts.transpileModule(readFileSync(path.join(import.meta.dirname, '..', file), 'utf8'), {
    fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => name in mocks ? mocks[name] : require(name), module, module.exports);
  return module.exports;
}
const local = { credentialId: 'device-credential', accountId: 'alice', accountType: 'user' };
function biometricFixture({ credential = local, active = true, available = true, success = true, error, statusError } = {}) {
  const calls = [];
  class Native {
    constructor(options) { calls.push(['native', options]); }
    async isSensorAvailable() { return { available }; }
    async simplePrompt(options) { calls.push(['prompt', options]); if (error) throw error; return { success }; }
  }
  const { confirmWalletFundingBiometrics: confirm, confirmWalletWithdrawalBiometrics: withdraw } = load('lib/auth/biometrics.ts', {
    'expo-crypto': {},
    'expo-secure-store': { getItemAsync: async () => credential ? JSON.stringify(credential) : null },
    'react-native': { Platform: { OS: 'ios' }, NativeModules: { ReactNativeBiometrics: {} } },
    'react-native-biometrics': Native,
    '@/lib/api/client': { api: { get: async () => {
      calls.push(['status']); if (statusError) throw statusError;
      return { data: { devices: active ? [{ credentialId: local.credentialId }] : [] } };
    } } },
  });
  return { confirm, withdraw, calls };
}

test('funding checks biometrics only for the enrolled account and active device', async () => {
  for (const options of [{ credential: null }, { credential: { ...local, accountId: 'bob' } }, { credential: { ...local, accountType: 'tasker' } }, { active: false }]) {
    const f = biometricFixture(options);
    assert.equal(await f.confirm('alice', 'user'), true);
    assert.equal(f.calls.some(([name]) => name === 'prompt'), false);
  }
  const f = biometricFixture();
  assert.equal(await f.confirm('alice', 'user'), true);
  assert.deepEqual(f.calls.map(([name]) => name), ['status', 'native', 'prompt']);
  assert.equal(f.calls[1][1].allowDeviceCredentials, false);
});

test('cancellation, lockout, missing sensor and failed status checks never authorize funding', async () => {
  assert.equal(await biometricFixture({ success: false }).confirm('alice', 'user'), false);
  await assert.rejects(biometricFixture({ available: false }).confirm('alice', 'user'), /unavailable/);
  await assert.rejects(biometricFixture({ error: new Error('Locked out') }).confirm('alice', 'user'), /Locked out/);
  const f = biometricFixture({ statusError: new Error('Offline') });
  await assert.rejects(f.confirm('alice', 'user'), /Offline/);
  assert.equal(f.calls.some(([name]) => name === 'prompt'), false);
});

test('withdrawal uses the same account and device enrollment rules with its own prompt', async () => {
  const f = biometricFixture({ credential: { ...local, accountType: 'tasker' } });
  assert.equal(await f.withdraw('alice', 'tasker'), true);
  assert.equal(f.calls.at(-1)[1].promptMessage, 'Confirm withdrawal');
  const cancelled = biometricFixture({ credential: { ...local, accountType: 'tasker' }, success: false });
  assert.equal(await cancelled.withdraw('alice', 'tasker'), false);
  const disabled = biometricFixture({ credential: { ...local, accountType: 'tasker' }, active: false });
  assert.equal(await disabled.withdraw('alice', 'tasker'), true);
  assert.equal(disabled.calls.some(([name]) => name === 'prompt'), false);
});

const rn = {
  View: 'View', Text: 'Text', TextInput: 'TextInput', Pressable: 'Pressable', Modal: 'Modal',
  ScrollView: 'ScrollView', ActivityIndicator: 'ActivityIndicator',
  Platform: { OS: 'android' }, StyleSheet: { create: value => value },
  AppState: { addEventListener: () => ({ remove() {} }) },
};
const safeArea = { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) };
async function walletFixture(platform = 'android') {
  const calls = [], alerts = [];
  const storage = new Map();
  let account = { user: { _id: 'alice' }, accountType: 'user' }, scope = 'alice', authorize = async () => true, checkout = async () => {};
  const query = () => ({ data: { data: {} } });
  const { default: Wallet } = load('app/wallet.tsx', {
    'react-native': { ...rn, Platform: { OS: platform }, Alert: { alert: (...args) => alerts.push(args) } },
    'react-native-safe-area-context': safeArea,
    '@react-native-async-storage/async-storage': { getItem: async key => storage.get(key) ?? null, setItem: async (key, value) => { storage.set(key, value); calls.push('save'); } },
    '@tanstack/react-query': { useQueryClient: () => ({ invalidateQueries: async () => {} }) },
    'expo-router': { useRouter: () => ({}) }, 'expo-status-bar': { StatusBar: 'StatusBar' },
    'expo-web-browser': { openBrowserAsync: async () => { calls.push('checkout'); return checkout(); } },
    '@/components/taskhub/fund-wallet-modal': { FundWalletModal: 'FundWalletModal' },
    '@/components/taskhub/screen-header': { ScreenHeader: 'ScreenHeader' },
    '@/components/taskhub/support-contact': { SupportContactModal: 'SupportContactModal' },
    '@/lib/mobile-web-handoff': {}, '@/lib/config': { STELLAR_WALLET_ENABLED: false },
    '@/lib/auth/auth-context': { useAuth: () => account },
    '@/lib/auth/biometrics': { confirmWalletFundingBiometrics: async (...args) => { calls.push('biometrics'); return authorize(...args); } },
    '@/lib/api/queries': { useTaskerBalance: query, useTaskerTransactions: query, useWalletBalance: query, useWalletTransactions: query },
    '@/lib/api/tasks': { formatNaira: String, formatShortDate: String },
    '@/lib/api/wallet': { verifyFunding: async () => { calls.push('verify'); return { data: { transactionStatus: 'pending' } }; }, initializeFunding: async amount => {
      calls.push(['initialize', amount]); return { data: { authorizationUrl: 'https://checkout.example', reference: 'payment' } };
    } },
    '@/lib/support-context': { getSupportScope: () => scope, clearSupportIssue() {}, recordSupportIssue() {}, makeSupportIssue: () => ({}) },
  });
  let tree;
  await act(async () => { tree = create(React.createElement(Wallet)); });
  await act(async () => tree.root.findAllByType('Pressable')[0].props.onPress());
  const modal = () => tree.root.findByType('FundWalletModal');
  return {
    tree, calls, alerts, modal, Wallet, storage,
    checkout: fn => { checkout = fn; },
    submit: async amount => {
      let request;
      await act(async () => { request = modal().props.onSubmit(amount); });
      await act(async () => { if (platform === 'ios') modal().props.onDismiss(); await request; });
    },
    authorize: fn => { authorize = fn; },
    switchAccount: () => { account = { user: { _id: 'bob' }, accountType: 'user' }; scope = 'bob'; },
    close: async () => act(async () => tree.unmount()),
  };
}

test('Continue to Payment waits for confirmation and ignores duplicate taps', async () => {
  const f = await walletFixture();
  let resolve;
  f.authorize(() => new Promise(done => { resolve = done; }));
  let first, second;
  await act(async () => { first = f.modal().props.onSubmit(2000); second = f.modal().props.onSubmit(2000); });
  assert.equal(f.modal().props.pending, true);
  assert.deepEqual(f.calls, ['biometrics']);
  await act(async () => { resolve(true); });
  await act(async () => { await Promise.all([first, second]); });
  assert.deepEqual(f.calls, ['biometrics', ['initialize', 2000], 'save', 'checkout']);
  assert.equal(f.modal().props.pending, false);
  await f.close();
});

test('cancelled or failed confirmation keeps funding open and supports a fresh retry', async () => {
  const f = await walletFixture();
  await act(async () => f.tree.root.findAllByType('Pressable')[0].props.onPress());
  f.authorize(async () => false);
  await f.submit(1500);
  assert.equal(f.modal().props.visible, true);
  assert.deepEqual(f.calls, ['biometrics']);
  f.authorize(async () => { throw new Error('Try biometrics again'); });
  await f.submit(1500);
  assert.equal(f.alerts[0][0], 'Payment not started');
  assert.equal(f.modal().props.visible, true);
  f.authorize(async () => true);
  await f.submit(1500);
  assert.equal(f.calls.filter(value => Array.isArray(value)).length, 1);
  assert.equal(f.calls.at(-1), 'checkout');
  await f.close();
});

test('iOS waits for native sheet dismissal before presenting checkout and ignores duplicate completion', async () => {
  const f = await walletFixture('ios'); let request, finishCheckout;
  f.checkout(() => new Promise(resolve => { finishCheckout = resolve; }));
  await act(async () => { request = f.modal().props.onSubmit(1000); });
  assert.equal(f.modal().props.visible, false);
  assert.equal(f.modal().props.pending, true);
  assert.deepEqual(f.calls, ['biometrics', ['initialize', 1000], 'save']);
  await act(async () => { f.modal().props.onDismiss(); f.modal().props.onDismiss(); });
  assert.equal(f.calls.filter(value => value === 'checkout').length, 1);
  const resume = f.tree.root.findAllByType('Pressable').find(node => node.findAllByType('Text').some(text => text.props.children === 'Return to payment'));
  assert.equal(resume.props.disabled, true);
  await act(async () => resume.props.onPress());
  assert.equal(f.calls.filter(value => value === 'checkout').length, 1);
  await act(async () => { finishCheckout({ type: 'cancel' }); await request; });
  assert.equal(f.modal().props.pending, false);
  assert.equal(f.tree.root.findAllByType('Pressable')[0].props.disabled, false);
  assert.equal(f.calls.at(-1), 'verify');
  await f.close();
});

test('failed browser presentation keeps the saved checkout and allows retry without another funding request', async () => {
  const f = await walletFixture('ios');
  f.checkout(async () => { throw new Error('Cannot present browser'); });
  await f.submit(1000);
  assert.equal(f.alerts.at(-1)[0], 'Could not open payment');
  assert.equal(f.modal().props.pending, false);
  assert.equal(f.storage.size, 1);
  f.checkout(async () => ({ type: 'cancel' }));
  const resume = f.tree.root.findAllByType('Pressable').find(node => node.findAllByType('Text').some(text => text.props.children === 'Return to payment'));
  assert.equal(resume.props.disabled, false);
  await act(async () => resume.props.onPress());
  assert.equal(f.calls.filter(value => Array.isArray(value)).length, 1);
  assert.equal(f.calls.filter(value => value === 'checkout').length, 2);
  await f.close();
});

test('leaving the wallet while the funding sheet dismisses never opens a late browser', async () => {
  const f = await walletFixture('ios'); let request;
  await act(async () => { request = f.modal().props.onSubmit(1000); });
  await f.close();
  await request;
  assert.equal(f.calls.includes('checkout'), false);
});

test('a biometric result cannot start payment after switching accounts or leaving the wallet', async () => {
  for (const leave of ['switch', 'unmount']) {
    const f = await walletFixture(); let resolve, pending;
    f.authorize(() => new Promise(done => { resolve = done; }));
    await act(async () => { pending = f.modal().props.onSubmit(1000); });
    if (leave === 'switch') {
      f.switchAccount(); await act(async () => f.tree.update(React.createElement(f.Wallet)));
    } else await f.close();
    await act(async () => { resolve(true); await pending; });
    assert.deepEqual(f.calls, ['biometrics']);
    if (leave === 'switch') await f.close();
  }
});

test('funding amount and dismissal are locked while confirmation is pending', async () => {
  const { FundWalletModal } = load('components/taskhub/fund-wallet-modal.tsx', { 'react-native': rn, 'react-native-safe-area-context': safeArea });
  let tree; const submitted = [];
  let closed = 0, dismissed = 0;
  const props = { visible: true, onClose() { closed += 1; }, onDismiss() { dismissed += 1; }, onSubmit: amount => submitted.push(amount) };
  await act(async () => { tree = create(React.createElement(FundWalletModal, props)); });
  const input = () => tree.root.findByType('TextInput');
  await act(async () => input().props.onChangeText('2000'));
  await act(async () => tree.update(React.createElement(FundWalletModal, { ...props, pending: true })));
  assert.equal(input().props.value, '2000');
  assert.equal(input().props.editable, false);
  tree.root.findByType('Modal').props.onRequestClose();
  assert.equal(closed, 0);
  const preset = tree.root.findAllByType('Pressable').find(node => node.props.onPress?.toString().includes('setAmount'));
  assert.equal(preset.props.disabled, true);
  tree.root.findByType('Modal').props.onDismiss();
  assert.equal(dismissed, 1);
  await act(async () => tree.unmount());
});

const { QueryClient, QueryClientProvider } = require('@tanstack/react-query');
const settle = async () => act(async () => { await new Promise(resolve => setTimeout(resolve, 15)); });
async function withdrawalFixture() {
  const calls = [], alerts = [];
  let auth = { accountType: 'tasker', user: { _id: 'alice' } }, scope = 'alice', authorize = async () => true;
  let request = async payload => ({ data: { amount: payload.amount } });
  class ApiError extends Error { constructor(message, code) { super(message); this.code = code; } }
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: Infinity } } });
  const { default: Withdraw } = load('app/withdraw.tsx', {
    'react-native': { ...rn, KeyboardAvoidingView: 'KeyboardAvoidingView', Alert: { alert: (...args) => alerts.push(args) } },
    'react-native-safe-area-context': safeArea,
    'react-native-keyboard-controller': { KeyboardAwareScrollView: 'ScrollView' },
    '@expo/vector-icons': { Ionicons: 'Icon' },
    '@tanstack/react-query': require('@tanstack/react-query'),
    'expo-router': { useRouter: () => ({ back() {}, push() {} }) }, 'expo-status-bar': { StatusBar: 'StatusBar' },
    '@/components/taskhub/screen-header': { ScreenHeader: 'ScreenHeader' },
    '@/components/taskhub/support-contact': { SupportContactButton: 'SupportContactButton' },
    '@/lib/api/client': { ApiError }, '@/lib/config': { STELLAR_WALLET_ENABLED: false },
    '@/lib/auth/auth-context': { useAuth: () => auth },
    '@/lib/auth/biometrics': { confirmWalletWithdrawalBiometrics: async (...args) => { calls.push('biometrics'); return authorize(...args); } },
    '@/lib/api/queries': {
      useTaskerBalance: () => ({ data: { data: { availableToWithdraw: 5000 } } }),
      useTaskerBankAccount: () => ({ data: { data: null } }),
      useSavedBankAccounts: () => ({ data: { data: [{ _id: 'bank', accountName: 'Alice', bankName: 'Bank', accountNumber: '0000000000' }] } }),
    },
    '@/lib/api/tasks': { formatNaira: String },
    '@/lib/api/wallet': { requestWithdrawal: async payload => { calls.push(payload); return request(payload); } },
    '@/lib/support-context': { getSupportScope: () => scope, makeSupportIssue: () => ({}) },
  });
  const content = () => React.createElement(QueryClientProvider, { client }, React.createElement(Withdraw));
  let tree;
  await act(async () => { tree = create(content()); });
  await act(async () => tree.root.findByType('TextInput').props.onChangeText('1500'));
  const button = () => tree.root.findByProps({ accessibilityLabel: 'Request withdrawal' });
  return {
    tree, button, calls, alerts, ApiError,
    authorize: fn => { authorize = fn; }, request: fn => { request = fn; },
    submit: async () => { await act(async () => button().props.onPress()); await settle(); },
    switchAccount: async () => {
      auth = { accountType: 'tasker', user: { _id: 'bob' } }; scope = 'bob';
      await act(async () => tree.update(content()));
    },
    close: async () => { await act(async () => tree.unmount()); client.clear(); },
  };
}

test('withdrawal waits for fresh biometrics, freezes the draft and blocks duplicate taps', async () => {
  const f = await withdrawalFixture(); let resolve;
  f.authorize(() => new Promise(done => { resolve = done; }));
  await act(async () => { const press = f.button().props.onPress; press(); press(); }); await settle();
  assert.deepEqual(f.calls, ['biometrics']);
  assert.equal(f.button().props.disabled, true);
  assert.equal(f.tree.root.findByType('TextInput').props.editable, false);
  await act(async () => resolve(true)); await settle();
  assert.equal(f.calls.length, 2);
  assert.equal(f.calls[1].amount, 1500);
  assert.equal(f.calls[1].bankId, 'bank');
  assert.equal(f.alerts[0][0], 'Request submitted');
  await f.close();
});

test('cancelled and failed withdrawal biometrics preserve the draft and permit retry', async () => {
  const f = await withdrawalFixture();
  f.authorize(async () => false); await f.submit();
  assert.deepEqual(f.calls, ['biometrics']); assert.equal(f.alerts.length, 0);
  assert.equal(f.tree.root.findByType('TextInput').props.value, '1500');
  assert.equal(f.button().props.disabled, false);
  f.authorize(async () => { throw new Error('Biometrics is unavailable'); }); await f.submit();
  assert.equal(f.calls.length, 2);
  assert.ok(f.tree.root.findAllByType('Text').some(node => node.props.children === 'Biometrics is unavailable'));
  f.authorize(async () => true); await f.submit();
  assert.equal(f.calls.filter(value => typeof value === 'object').length, 1);
  await f.close();
});

test('biometrics supplements the server transaction PIN and checks again on a valid PIN retry', async () => {
  const f = await withdrawalFixture();
  f.request(async payload => {
    if (!payload.pin) throw new f.ApiError('Transaction PIN is required', 'PIN_REQUIRED');
    return { data: { amount: payload.amount } };
  });
  await f.submit();
  const pin = () => f.tree.root.findByProps({ accessibilityLabel: 'Transaction PIN' });
  assert.equal(pin().props.value, '');
  await f.submit(); assert.equal(f.calls.length, 2);
  await act(async () => pin().props.onChangeText('1234'));
  await f.submit();
  assert.equal(f.calls.filter(value => value === 'biometrics').length, 2);
  assert.equal(f.calls.at(-1).pin, '1234');
  assert.equal(f.alerts.at(-1)[0], 'Request submitted');
  await f.close();
});

test('late withdrawal confirmation cannot submit after leaving or switching tasker accounts', async () => {
  for (const leave of ['switch', 'unmount']) {
    const f = await withdrawalFixture(); let resolve;
    f.authorize(() => new Promise(done => { resolve = done; })); await f.submit();
    if (leave === 'switch') await f.switchAccount(); else await f.close();
    await act(async () => resolve(true)); await settle();
    assert.deepEqual(f.calls, ['biometrics']); assert.equal(f.alerts.length, 0);
    if (leave === 'switch') await f.close();
  }
});
