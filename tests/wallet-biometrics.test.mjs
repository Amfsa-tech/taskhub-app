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
  const { confirmWalletFundingBiometrics: confirm } = load('lib/auth/biometrics.ts', {
    'expo-crypto': {},
    'expo-secure-store': { getItemAsync: async () => credential ? JSON.stringify(credential) : null },
    'react-native': { Platform: { OS: 'ios' }, NativeModules: { ReactNativeBiometrics: {} } },
    'react-native-biometrics': Native,
    '@/lib/api/client': { api: { get: async () => {
      calls.push(['status']); if (statusError) throw statusError;
      return { data: { devices: active ? [{ credentialId: local.credentialId }] : [] } };
    } } },
  });
  return { confirm, calls };
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

const rn = {
  View: 'View', Text: 'Text', TextInput: 'TextInput', Pressable: 'Pressable', Modal: 'Modal',
  ScrollView: 'ScrollView', ActivityIndicator: 'ActivityIndicator',
  Platform: { OS: 'android' }, StyleSheet: { create: value => value },
  AppState: { addEventListener: () => ({ remove() {} }) },
};
const safeArea = { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) };
async function walletFixture() {
  const calls = [], alerts = [];
  let account = { user: { _id: 'alice' }, accountType: 'user' }, scope = 'alice', authorize = async () => true;
  const query = () => ({ data: { data: {} } });
  const { default: Wallet } = load('app/wallet.tsx', {
    'react-native': { ...rn, Alert: { alert: (...args) => alerts.push(args) } },
    'react-native-safe-area-context': safeArea,
    '@react-native-async-storage/async-storage': { getItem: async () => null, setItem: async () => calls.push('save') },
    '@tanstack/react-query': { useQueryClient: () => ({ invalidateQueries: async () => {} }) },
    'expo-router': { useRouter: () => ({}) }, 'expo-status-bar': { StatusBar: 'StatusBar' },
    'expo-web-browser': { openBrowserAsync: async () => calls.push('checkout') },
    '@/components/taskhub/fund-wallet-modal': { FundWalletModal: 'FundWalletModal' },
    '@/components/taskhub/screen-header': { ScreenHeader: 'ScreenHeader' },
    '@/components/taskhub/support-contact': { SupportContactModal: 'SupportContactModal' },
    '@/lib/mobile-web-handoff': {}, '@/lib/config': { STELLAR_WALLET_ENABLED: false },
    '@/lib/auth/auth-context': { useAuth: () => account },
    '@/lib/auth/biometrics': { confirmWalletFundingBiometrics: async (...args) => { calls.push('biometrics'); return authorize(...args); } },
    '@/lib/api/queries': { useTaskerBalance: query, useTaskerTransactions: query, useWalletBalance: query, useWalletTransactions: query },
    '@/lib/api/tasks': { formatNaira: String, formatShortDate: String },
    '@/lib/api/wallet': { initializeFunding: async amount => {
      calls.push(['initialize', amount]); return { data: { authorizationUrl: 'https://checkout.example', reference: 'payment' } };
    } },
    '@/lib/support-context': { getSupportScope: () => scope, clearSupportIssue() {}, recordSupportIssue() {}, makeSupportIssue: () => ({}) },
  });
  let tree;
  await act(async () => { tree = create(React.createElement(Wallet)); });
  const modal = () => tree.root.findByType('FundWalletModal');
  return {
    tree, calls, alerts, modal, Wallet,
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
  await act(async () => { resolve(true); await Promise.all([first, second]); });
  assert.deepEqual(f.calls, ['biometrics', ['initialize', 2000], 'save', 'checkout']);
  assert.equal(f.modal().props.pending, false);
  await f.close();
});

test('cancelled or failed confirmation keeps funding open and supports a fresh retry', async () => {
  const f = await walletFixture();
  await act(async () => f.tree.root.findAllByType('Pressable')[0].props.onPress());
  f.authorize(async () => false);
  await act(async () => f.modal().props.onSubmit(1500));
  assert.equal(f.modal().props.visible, true);
  assert.deepEqual(f.calls, ['biometrics']);
  f.authorize(async () => { throw new Error('Try biometrics again'); });
  await act(async () => f.modal().props.onSubmit(1500));
  assert.equal(f.alerts[0][0], 'Payment not started');
  assert.equal(f.modal().props.visible, true);
  f.authorize(async () => true);
  await act(async () => f.modal().props.onSubmit(1500));
  assert.equal(f.calls.filter(value => Array.isArray(value)).length, 1);
  assert.equal(f.calls.at(-1), 'checkout');
  await f.close();
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
  let closed = 0;
  const props = { visible: true, onClose() { closed += 1; }, onSubmit: amount => submitted.push(amount) };
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
  await act(async () => tree.unmount());
});
