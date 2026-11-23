import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import React from 'react';
import { act, create } from 'react-test-renderer';
import ts from 'typescript';
const require = createRequire(import.meta.url), root = path.resolve(import.meta.dirname, '..');
const { QueryClient, QueryClientProvider } = require('@tanstack/react-query');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
function load(file, mocks, cache = new Map()) {
  if (cache.has(file)) return cache.get(file);
  const code = ts.transpileModule(readFileSync(path.join(root, file), 'utf8'), { fileName: file, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => {
    if (name in mocks) return mocks[name];
    if (name.startsWith('@/') || name.startsWith('.')) {
      const relative = name.startsWith('@/') ? name.slice(2) : path.join(path.dirname(file), name);
      return load(['.ts', '.tsx'].map(ext => relative + ext).find(file => existsSync(path.join(root, file))), mocks, cache);
    }
    return require(name);
  }, module, module.exports);
  cache.set(file, module.exports); return module.exports;
}
const settle = async () => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 15)); }); };
const press = async node => { await act(async () => { node.props.onPress(); }); await settle(); };
function fixture(label = 'fingerprint', platform = 'ios') {
  let user = { _id: 'alice', emailAddress: 'alice@example.invalid' }, accountType = 'tasker', local = null;
  let start = async () => ({ challengeId: 'challenge-1', label }), signIn = async () => null;
  const confirmed = [], routes = [], calls = [], inputEvents = [];
  class ApiError extends Error { constructor(message, code) { super(message); this.code = code; } }
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  const mocks = {
    'react-native': { View: 'View', Text: 'Text', TextInput: 'TextInput', Pressable: 'Pressable', Switch: 'Switch', Modal: 'Modal', ScrollView: 'ScrollView', KeyboardAvoidingView: 'KeyboardAvoidingView', ActivityIndicator: 'ActivityIndicator', Platform: { OS: platform }, StyleSheet: { create: value => value, absoluteFill: {}, absoluteFillObject: {}, hairlineWidth: 1 } },
    '@expo/vector-icons': { MaterialCommunityIcons: 'Icon' }, 'expo-symbols': { SymbolView: 'SymbolView' },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 20, bottom: 20 }) },
    'expo-router': { useRouter: () => ({ push: route => routes.push(route), replace: route => routes.push(route) }), useFocusEffect: callback => React.useEffect(callback, [callback]) },
    '@/lib/auth/auth-context': { useAuth: () => ({ user, accountType, signInWithBiometrics: async () => { calls.push('sign-in'); return signIn(); } }) },
    '@/lib/api/client': { ApiError }, '@/lib/auth/pending-email-login': { setPendingBiometricLogin() {} },
    '@/lib/auth/biometrics': {
      biometricBridgeAvailable: () => true,
      getDeviceBiometricStatus: async () => ({ available: true, label, local }),
      getBiometricStatus: async () => ({ data: { devices: local ? [{ credentialId: local.credentialId }] : [] } }),
      startBiometricEnrollment: async () => { calls.push('start'); return start(); },
      confirmBiometricEnrollment: async (challengeId, code, profile) => {
        confirmed.push({ challengeId, code, profile });
        if (code === '00000') throw new Error('That code is incorrect. Please try again.');
        local = { credentialId: 'credential-1', ...profile };
      },
      disableBiometrics: async () => { local = null; },
      readBiometricCredential: async () => ({ credentialId: 'credential-1', accountId: 'alice', accountType, label }),
    },
  };
  const cache = new Map();
  const mount = async file => {
    const Component = Object.values(load(file, mocks, cache))[0];
    let tree; const element = () => React.createElement(QueryClientProvider, { client }, React.createElement(Component));
    await act(async () => { tree = create(element(), { createNodeMock: element => element.type === 'TextInput' ? { focus: () => inputEvents.push('focus'), blur: () => inputEvents.push('blur') } : null }); }); await settle();
    return { tree, rerender: async () => { await act(async () => tree.update(element())); await settle(); }, finish: async () => { await act(async () => tree.unmount()); client.clear(); } };
  };
  return { mount, confirmed, calls, routes, client, ApiError, inputEvents, setStart: value => { start = value; }, setLogin: value => { signIn = value; }, switchAccount: () => { user = { _id: 'bob', emailAddress: 'bob@example.invalid' }; accountType = 'user'; } };
}
const button = (tree, text) => tree.root.findAllByType('Pressable').find(node => node.findAllByType('Text').some(child => child.props.children === text));

test('fingerprint setup is a modal with five digits, keeps errors inside, and enables only after confirmation', async () => {
  const f = fixture(); const { tree, finish } = await f.mount('components/taskhub/biometric-setting.tsx');
  assert.equal(tree.root.findByType('Modal').props.visible, false);
  assert.equal(tree.root.findAllByType('TextInput').length, 0);
  await act(async () => tree.root.findByType('Switch').props.onValueChange(true)); await settle();
  const modal = tree.root.findByType('Modal'); assert.equal(modal.props.visible, true);
  assert.ok(JSON.stringify(modal.toJSON?.() ?? tree.toJSON()).includes('Set up fingerprint sign-in'));
  assert.equal(tree.root.findByType('Switch').props.value, false);
  const input = tree.root.findByType('TextInput'); assert.equal(input.parent.parent.findAllByType('TextInput').length, 1);
  assert.equal(input.props.autoComplete, 'one-time-code');
  assert.equal(button(tree, 'Enable fingerprint').props.disabled, true);
  await act(async () => input.props.onChangeText('00000'));
  await press(button(tree, 'Enable fingerprint'));
  assert.match(tree.root.findByProps({ accessibilityRole: 'alert' }).props.children, /code is incorrect/);
  assert.equal(tree.root.findByType('Modal').props.visible, true);
  await act(async () => input.props.onChangeText('04a219'));
  assert.equal(tree.root.findByType('TextInput').props.value, '04219');
  await press(button(tree, 'Enable fingerprint'));
  assert.equal(f.confirmed.at(-1).code, '04219');
  assert.equal(f.confirmed.at(-1).profile.accountId, 'alice');
  assert.equal(tree.root.findByType('Switch').props.value, true);
  assert.equal(tree.root.findAllByType('TextInput').length, 0);
  await press(button(tree, 'Done')); assert.equal(tree.root.findByType('Modal').props.visible, false);
  await finish();
});

test('Face ID gets its own symbol and cancelling clears the code; another account never sees the previous draft', async () => {
  const f = fixture('Face ID'); const { tree, finish, rerender } = await f.mount('components/taskhub/biometric-setting.tsx');
  await act(async () => tree.root.findByType('Switch').props.onValueChange(true)); await settle();
  assert.equal(tree.root.findByType('SymbolView').props.name, 'faceid');
  await act(async () => tree.root.findByType('TextInput').props.onChangeText('04219'));
  await press(button(tree, 'Not now'));
  assert.equal(tree.root.findByType('Modal').props.visible, false);
  assert.equal(tree.root.findAllByType('TextInput').length, 0);
  await act(async () => tree.root.findByType('Switch').props.onValueChange(true)); await settle();
  assert.equal(tree.root.findByType('TextInput').props.value, '');
  f.switchAccount(); await rerender();
  assert.equal(tree.root.findByType('Modal').props.visible, false);
  assert.equal(tree.root.findAllByType('TextInput').length, 0);
  await finish();
});

test('setup failures offer retry inside the dialog without a loose field under Settings', async () => {
  const f = fixture(); f.setStart(async () => { throw new Error('Could not send your email code.'); });
  const { tree, finish } = await f.mount('components/taskhub/biometric-setting.tsx');
  await act(async () => tree.root.findByType('Switch').props.onValueChange(true)); await settle();
  assert.equal(tree.root.findByType('Modal').props.visible, true);
  assert.equal(tree.root.findAllByType('TextInput').length, 0);
  assert.match(tree.root.findByProps({ accessibilityRole: 'alert' }).props.children, /Could not send/);
  f.setStart(async () => ({ challengeId: 'new-challenge', label: 'fingerprint' }));
  await press(button(tree, 'Try again')); assert.equal(tree.root.findByType('TextInput').props.value, '');
  await finish();
});

test('sign-in invokes biometric authentication directly, native cancellation stays quiet, and failures use the dialog', async () => {
  const f = fixture(); const { tree, finish } = await f.mount('components/taskhub/biometric-login-button.tsx');
  const trigger = () => tree.root.findByProps({ accessibilityLabel: 'Sign in with fingerprint' });
  await press(trigger()); assert.equal(f.calls.filter(value => value === 'sign-in').length, 1);
  assert.equal(tree.root.findByType('Modal').props.visible, false); assert.deepEqual(f.routes, []);
  f.setLogin(async () => { throw new Error('Please try the fingerprint check again.'); });
  await press(trigger()); assert.equal(tree.root.findByType('Modal').props.visible, true);
  await press(button(tree, 'Use password instead')); assert.equal(tree.root.findByType('Modal').props.visible, false);
  f.setLogin(async () => ({ _id: 'alice' })); await press(trigger()); assert.deepEqual(f.routes, ['/home']);
  await finish();
});


test('Android code entry hides native composing text, shows each digit once and refocuses when tapped', async () => {
  const f=fixture('fingerprint','android');const {tree,finish}=await f.mount('components/taskhub/biometric-setting.tsx');
  await act(async()=>tree.root.findByType('Switch').props.onValueChange(true));await settle();
  assert.equal(tree.root.findByType('KeyboardAvoidingView').props.behavior,'height');
  const input=()=>tree.root.findByType('TextInput');
  assert.equal(input().props.style.opacity,0);assert.equal(input().props.inputMode,'numeric');assert.equal(input().props.autoCorrect,false);
  const row=()=>tree.root.findByProps({testID:'biometric-code-entry'});
  await press(row());assert.equal(f.inputEvents.at(-1),'focus');
  await act(async()=>input().props.onChangeText('62830'));
  assert.deepEqual(row().findAllByType('Text').map(node=>node.props.children),['6','2','8','3','0']);
  await act(async()=>input().props.onChangeText('6283'));
  assert.deepEqual(row().findAllByType('Text').map(node=>node.props.children),['6','2','8','3','']);
  assert.equal(button(tree,'Enable fingerprint').props.disabled,true);
  await act(async()=>input().props.onChangeText('04219'));
  await press(button(tree,'Enable fingerprint'));
  assert.equal(f.inputEvents.at(-1),'blur');assert.equal(f.confirmed.at(-1).code,'04219');
  await finish();
});
