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
    if (name.startsWith('@/lib/task-') || name === '@/lib/use-task-urgency') return load(name.slice(2) + '.ts', mocks);
    if (name === '@/components/taskhub/tasks-screen') return { __esModule: true, default: load('components/taskhub/tasks-screen.tsx', mocks) };
    if (name === '@/components/taskhub/task-filters') return { TaskFilters: () => null };
    if (name === '@/components/taskhub/urgent-badge') return load('components/taskhub/urgent-badge.tsx', mocks);
    if (/\.(png|svg)$/.test(name)) return { __esModule: true, default: 'Icon' };
    return require(name);
  }, module, module.exports);
  return module.exports.default || module.exports;
}
function harness(platform = 'android') {
  const summary = { taskTitle: 'Content writing', total: 1000, taskAmount: 1000, platformFee: 100, feeRate: .1, alreadyHeld: 1000, additionalCharge: 0, refundDue: 0, walletBalance: 0, sufficientBalance: true, canConfirm: true, tasker: { firstName: 'Ada' } };
  const state = { summary, refreshed: 0, charged: 0, fail: false, alerts: [], routes: [] };
  const draft = { title: 'Write content', description: 'A detailed task description for the writer', budget: '1000', location: 'Heritage Mall', mainCategory: { name: 'local_services' }, subCategories: [], images: [], tags: [], isBiddingEnabled: true, biddingDeadline: '', university: null };
  const mocks = {
    'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView', TextInput: 'TextInput', Switch: 'Switch', KeyboardAvoidingView: 'KeyboardAvoidingView', ActivityIndicator: 'ActivityIndicator', Platform: { OS: platform }, StyleSheet: { create: x => x }, Alert: { alert: (...args) => state.alerts.push(args) } },
    'expo-router': { useRouter: () => ({ back() {}, push: x => state.routes.push(x), replace: x => state.routes.push(x) }), useLocalSearchParams: () => ({ bidId: 'offer-1' }) },
    'expo-status-bar': { StatusBar: 'StatusBar' }, 'expo-image': { Image: 'Image' }, '@expo/vector-icons': { Ionicons: 'Icon' },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
    'react-native-keyboard-controller': { KeyboardAwareScrollView: 'ScrollView' },
    '@react-native-community/datetimepicker': { __esModule: true, default: 'DateTimePicker' },
    '@/components/taskhub/primary-button': { PrimaryButton: props => React.createElement('PrimaryButton', props) },
    '@/components/taskhub/steps-header': { StepsHeader: 'StepsHeader' },
    '@/lib/api/bids': { acceptBid: async () => { state.charged++; if (state.fail) throw state.fail instanceof Error ? state.fail : new Error('Request changed. Refresh status.'); return {}; } },
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

test('one deadline tap exposes the calendar on both platforms and keeps date selection and cancellation correct', async () => {
  for (const platform of ['ios', 'android']) {
    const h = harness(platform), { renderer } = await h.render('app/post-details.tsx');
    const open = () => renderer.root.findByProps({ accessibilityLabel: 'Bidding deadline' }).props.onPress();
    await act(async () => open());
    let picker = renderer.root.findByType('DateTimePicker');
    assert.equal(picker.props.display, platform === 'ios' ? 'inline' : 'calendar');
    await act(async () => picker.props.onChange({ type: 'dismissed' }));
    assert.equal(h.draft.biddingDeadline, '');
    await act(async () => open());
    picker = renderer.root.findByType('DateTimePicker');
    await act(async () => picker.props.onChange({ type: 'set' }, new Date(2026, 11, 3)));
    assert.equal(h.draft.biddingDeadline, '2026-12-03');
    assert.equal(renderer.root.findAllByType('DateTimePicker').length, 0);
    await act(async () => renderer.unmount());
  }
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
  Object.assign(task,{deadline:new Date(Date.now()-1000).toISOString(),biddingClosed:true,bidSelectionEndsAt:new Date(Date.now()+48*3600000).toISOString()});
  await act(async()=>renderer.update(view()));
  assert.match(labels(),/Choose an offer by/);
  const confirm=renderer.root.findAllByType('Pressable').find(node=>node.findAllByType('Text').some(text=>text.children.join('')==='Confirm Hire'));
  assert.ok(confirm && !confirm.props.disabled,'existing confirmed offers remain selectable after bidding ends');
  task.bidSelectionEndsAt=new Date(Date.now()-1000).toISOString();
  await act(async()=>renderer.update(view()));
  assert.equal(renderer.root.findAllByType('Pressable').filter(node=>!node.props.disabled&&node.findAllByType('Text').some(text=>text.children.join('')==='Confirm Hire')).length,0);
  await act(async () => renderer.unmount());
});

test('submitted work remains in the customer In Progress tab and opens review without a notification',async()=>{
 const routes=[],queried=[];const task={_id:'task-review',title:'Content writing',budget:1000,status:'awaiting-confirmation',createdAt:'2026-11-25T12:00:00Z'};
 const native={View:'View',Text:'Text',Pressable:'Pressable',ScrollView:'ScrollView',TextInput:'TextInput',Image:'Image',RefreshControl:'RefreshControl',ActivityIndicator:'Spinner',Modal:()=>null,FlatList:'FlatList',Dimensions:{get:()=>({width:390})},StyleSheet:{create:x=>x},Alert:{alert(){}}};
 const mocks={
  'react-native':native,'expo-router':{useRouter:()=>({push:value=>routes.push(value)})},'expo-status-bar':{StatusBar:'StatusBar'},'expo-image':{Image:'Image'},'@expo/vector-icons':{Ionicons:'Icon',MaterialCommunityIcons:'Icon'},
  'react-native-safe-area-context':{useSafeAreaInsets:()=>({top:0,bottom:0})},'@/lib/auth/auth-context':{useAuth:()=>({accountType:'user'})},'@/hooks/use-new-post':{useNewPost:()=>()=>{}},
  '@/components/taskhub/rate-tasker-modal':{RateTaskerModal:()=>null},'@/components/taskhub/hire-again-modal':{HireAgainModal:()=>null},'@/lib/api/task-nudge':{},'@/lib/api/chat':{},'@/lib/api/bids':{},
  '@/lib/api/queries':{queryKeys:{},useUserTasks:()=>({data:{tasks:[]}}),useUserTasksByStatuses:statuses=>{queried.push(statuses);return{tasks:[task]};}},
 };
 mocks['@/lib/api/tasks']=load('lib/api/tasks.ts',{'./client':{api:{}}});
 mocks['@/components/taskhub/task-card']=load('components/taskhub/task-card.tsx',mocks);
 const Screen=load('app/(main)/tasks.tsx',mocks);const client=new QueryClient();let renderer;
 await act(async()=>{renderer=create(React.createElement(QueryClientProvider,{client},React.createElement(Screen)));});
 assert.ok(queried.some(statuses=>statuses.includes('awaiting-confirmation')));
 const labels=()=>renderer.root.findAllByType('Text').map(node=>node.children.join('')).join('\n');
 assert.match(labels(),/Awaiting Your Review/);const review=renderer.root.findAllByType('Pressable').find(node=>node.findAllByType('Text').some(text=>text.children.join('')==='Review Work'));
 await act(async()=>review.props.onPress());assert.deepEqual(routes.at(-1),{pathname:'/track-task',params:{id:'task-review'}});
 await act(async()=>renderer.unmount());client.clear();
});
test('urgent badge updates when the final 72 hours begin and disappears at the deadline without a network request',async(t)=>{
 const now=Date.parse('2026-11-25T12:00:00Z');t.mock.timers.enable({apis:['Date','setTimeout'],now});
 const Badge=load('components/taskhub/urgent-badge.tsx',{'react-native':{View:'View',Text:'Text',StyleSheet:{create:x=>x}}}).UrgentBadge;
 const task={status:'open',deadline:new Date(now+72*3600000+1000).toISOString()};let renderer;
 await act(async()=>{renderer=create(React.createElement(Badge,{task}));});assert.equal(renderer.toJSON(),null);
 await act(async()=>t.mock.timers.tick(1020));assert.match(JSON.stringify(renderer.toJSON()),/Urgent/);
 await act(async()=>t.mock.timers.tick(72*3600000));assert.equal(renderer.toJSON(),null);
 await act(async()=>renderer.unmount());t.mock.timers.reset();
});


test('mobile server selection-expired response refreshes state and offers reopening', async()=>{
 const h=harness();h.state.summary.taskId='task-1';
 h.state.fail=Object.assign(new Error('Choose an offer time has ended. Reopen the task.'),{status:400,body:{code:'BID_SELECTION_EXPIRED'}});
 const {renderer}=await h.render('app/task-agreement.tsx');
 await act(async()=>renderer.root.findByType('PrimaryButton').props.onPress());
 assert.equal(h.state.refreshed,1);
 const alert=h.state.alerts.at(-1);assert.equal(alert[0],'Offer selection ended');
 const reopen=alert[2].find(button=>button.text==='Reopen task');assert.ok(reopen);
 await act(async()=>reopen.onPress());
 assert.deepEqual(h.state.routes.at(-1),{pathname:'/task-details',params:{id:'task-1'}});
 assert.equal(h.state.charged,1,'never automatically retry acceptance');
 await act(async()=>renderer.unmount());
});
