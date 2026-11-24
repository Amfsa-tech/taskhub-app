import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { act, create } from 'react-test-renderer';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const require = createRequire(import.meta.url);
const { QueryClient, QueryClientProvider } = require('@tanstack/react-query');
function load(file, mocks) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => {
    if (name in mocks) return mocks[name];
    if (/\.(png|svg)$/.test(name)) return { __esModule: true, default: 'Icon' };
    return require(name);
  }, module, module.exports);
  return module.exports.default;
}
function harness() {
  const summary = { taskTitle: 'Content writing', total: 1000, taskAmount: 1000, platformFee: 100, feeRate: .1, alreadyHeld: 1000, additionalCharge: 0, refundDue: 0, walletBalance: 0, sufficientBalance: true, canConfirm: true, tasker: { firstName: 'Ada' } };
  const state = { summary, refreshed: 0, charged: 0, fail: false, alerts: [], routes: [] };
  const draft = { title: 'Write content', description: 'A detailed task description for the writer', budget: '1000', location: 'Heritage Mall', mainCategory: { name: 'local_services' }, subCategories: [], images: [], tags: [], isBiddingEnabled: true, biddingDeadline: '', university: null };
  const mocks = {
    'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView', TextInput: 'TextInput', Switch: 'Switch', KeyboardAvoidingView: 'KeyboardAvoidingView', ActivityIndicator: 'ActivityIndicator', Platform: { OS: 'android' }, StyleSheet: { create: x => x }, Alert: { alert: (...args) => state.alerts.push(args) } },
    'expo-router': { useRouter: () => ({ back() {}, push: x => state.routes.push(x), replace() {} }), useLocalSearchParams: () => ({ bidId: 'offer-1' }) },
    'expo-status-bar': { StatusBar: 'StatusBar' }, 'expo-image': { Image: 'Image' }, '@expo/vector-icons': { Ionicons: 'Icon' },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
    'react-native-keyboard-controller': { KeyboardAwareScrollView: 'ScrollView' },
    '@react-native-community/datetimepicker': { __esModule: true, default: 'DateTimePicker' },
    '@/components/taskhub/primary-button': { PrimaryButton: props => React.createElement('PrimaryButton', props) },
    '@/components/taskhub/steps-header': { StepsHeader: 'StepsHeader' },
    '@/lib/api/bids': { acceptBid: async () => { state.charged++; if (state.fail) throw new Error('Request changed. Refresh status.'); return {}; } },
    '@/lib/api/queries': { usePaymentSummary: () => ({ data: { summary: state.summary }, refetch: async () => { state.refreshed++; } }) },
    '@/lib/api/tasks': { formatNaira: x => `₦${x.toLocaleString()}` },
    '@/lib/api/categories': { isCampusCategory: () => false }, '@/lib/image-picker': { pickImages: async () => [] },
    '@/lib/auth/auth-context': { useAuth: () => ({ user: {} }) },
    '@/context/PostTaskContext': { usePostTask: () => ({ draft, patch: changes => Object.assign(draft, changes) }) },
  };
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
  const render = async file => {
    const Screen = load(file, mocks);
    let renderer;
    await act(async () => { renderer = create(React.createElement(QueryClientProvider, { client }, React.createElement(Screen))); });
    return { renderer, update: async () => act(async () => renderer.update(React.createElement(QueryClientProvider, { client }, React.createElement(Screen)))) };
  };
  return { state, draft, render };
}
const text = renderer => JSON.stringify(renderer.toJSON());

test('mobile confirms a fully escrow-funded hire even with a zero wallet', async () => {
  const h = harness(), { renderer } = await h.render('app/task-agreement.tsx');
  assert.match(text(renderer), /Task escrow/);
  assert.match(text(renderer), /No additional wallet payment/);
  const button = renderer.root.findByType('PrimaryButton');
  assert.equal(button.props.label, 'Confirm hire using escrow');
  assert.equal(button.props.disabled, false);
  await act(async () => { button.props.onPress(); });
  assert.equal(h.state.charged, 1);
  assert.match(text(renderer), /Tasker Hired Successfully/);
  await act(async () => renderer.unmount());
});

test('mobile shows only the additional charge and preserves refund information', async () => {
  const h = harness();
  Object.assign(h.state.summary, { total: 1250, additionalCharge: 250, walletBalance: 100, sufficientBalance: false });
  const { renderer, update } = await h.render('app/task-agreement.tsx');
  assert.equal(renderer.root.findByType('PrimaryButton').props.label, 'Fund Wallet');
  assert.match(text(renderer), /₦150/);
  Object.assign(h.state.summary, { total: 700, additionalCharge: 0, refundDue: 300, sufficientBalance: true });
  await update();
  assert.match(text(renderer), /Refund to wallet/);
  assert.match(text(renderer), /₦300/);
  await act(async () => renderer.unmount());
});

test('mobile disables confirmation while consent is pending and refreshes after a rejected hire', async () => {
  const h = harness();
  Object.assign(h.state.summary, { canConfirm: false, blockingReason: 'Waiting for tasker acceptance.' });
  const { renderer, update } = await h.render('app/task-agreement.tsx');
  assert.equal(renderer.root.findByType('PrimaryButton').props.disabled, true);
  assert.match(text(renderer), /Waiting for tasker acceptance/);
  h.state.summary.canConfirm = true; h.state.fail = true;
  await update();
  await act(async () => { renderer.root.findByType('PrimaryButton').props.onPress(); });
  assert.equal(h.state.refreshed, 1);
  assert.match(h.state.alerts[0][1], /Request changed/);
  assert.doesNotMatch(text(renderer), /Tasker Hired Successfully/);
  await act(async () => renderer.unmount());
});

test('mobile task creation needs only one free-form address input', async () => {
  const h = harness(), { renderer, update } = await h.render('app/post-details.tsx');
  assert.equal(renderer.root.findAllByProps({ accessibilityLabel: 'City' }).length, 0);
  assert.equal(renderer.root.findAllByProps({ accessibilityLabel: 'State' }).length, 0);
  const input = renderer.root.findByProps({ accessibilityLabel: 'Task address' });
  await act(async () => input.props.onChangeText('Àgbàlá #2 / beside St. Mary’s 🏠'));
  await update();
  assert.equal(h.draft.location, 'Àgbàlá #2 / beside St. Mary’s 🏠');
  assert.equal(renderer.root.findByType('PrimaryButton').props.disabled, false);
  await act(async () => input.props.onChangeText('  '));
  await update();
  assert.equal(renderer.root.findByType('PrimaryButton').props.disabled, true);
  await act(async () => renderer.unmount());
});

test('mobile separates hire requests from bid counts and waits for confirmed consent', async () => {
  const tasker = { _id: 'tasker-1', firstName: 'Ada', lastName: 'Okafor' };
  const hire = { _id: 'hire-1', tasker, amount: 1000, status: 'pending', invitedByUser: true, taskerConfirmed: false };
  const task = { _id: 'task-1', title: 'Write content', status: 'open', budget: 1000, bids: [1, 2, 3].map(i => ({ ...hire, _id: `bid-${i}`, invitedByUser: false })), hireRequests: [hire] };
  // Extend the normal screen fixtures with task-detail dependencies.
  const native = { View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView', TextInput: 'TextInput', KeyboardAvoidingView: 'KeyboardAvoidingView', ActivityIndicator: 'ActivityIndicator', Modal: ({ visible, children }) => visible ? children : null, StyleSheet: { create: x => x }, Dimensions: { get: () => ({ width: 390 }) } };
  const mocks = {
    'react-native': native, 'expo-image': { Image: 'Image' }, 'expo-status-bar': { StatusBar: 'StatusBar' },
    'expo-router': { useRouter: () => ({}), useLocalSearchParams: () => ({ id: 'task-1' }) },
    '@expo/vector-icons': { Ionicons: 'Icon', MaterialCommunityIcons: 'Icon' },
    '@react-native-community/datetimepicker': { __esModule: true, default: 'DateTimePicker' },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
    '@/lib/auth/auth-context': { useAuth: () => ({ accountType: 'user', user: {} }) },
    '@/lib/api/queries': { useTask: () => ({ data: { task } }), useTaskMatches: () => ({ data: { matches: [] } }), useTaskerBids: () => ({ data: { bids: [] } }) },
    '@/lib/api/tasks': { formatNaira: x => `₦${x}`, locationLabel: () => 'Heritage Mall', statusLabel: x => x },
    '@/lib/api/bids': {}, '@/lib/api/chat': {},
    '@/components/taskhub/invite-to-bid-modal': { InviteToBidModal: () => null },
    '@/components/taskhub/ready-to-hire-modal': { ReadyToHireModal: () => null },
    '@/components/taskhub/task-actions-modal': { TaskActionsModal: () => null },
  };
  const Screen = load('app/task-details.tsx', mocks);
  const client = new QueryClient();
  const view = () => React.createElement(QueryClientProvider, { client }, React.createElement(Screen));
  let renderer;
  await act(async () => { renderer = create(view()); });
  const labels = () => renderer.root.findAllByType('Text').map(node => node.children.join('')).join('\n');
  assert.match(labels(), /Bids \(3\)/);
  assert.match(labels(), /Hire requests \(1\)/);
  assert.match(labels(), /Awaiting response/);
  const waiting = renderer.root.findAllByType('Pressable').filter(node => node.props.disabled === true);
  assert.ok(waiting.length > 0);
  hire.taskerConfirmed = true;
  await act(async () => renderer.update(view()));
  assert.match(labels(), /Confirm Hire/);
  await act(async () => renderer.unmount());
});
