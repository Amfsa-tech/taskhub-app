import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import React from 'react';
import { act, create } from 'react-test-renderer';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '..');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function load(relative, mocks, cache = new Map()) {
  if (cache.has(relative)) return cache.get(relative);
  const javascript = ts.transpileModule(readFileSync(path.join(root, relative), 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', javascript)((name) => {
    if (name in mocks) return mocks[name];
    if (name.endsWith('.svg')) return { __esModule: true, default: 'Icon' };
    if (name.startsWith('@/')) return load(name.slice(2) + (name.includes('PostTaskContext') || name.includes('support-contact') && name.includes('components/') ? '.tsx' : '.ts'), mocks, cache);
    return require(name);
  }, module, module.exports);
  cache.set(relative, module.exports);
  return module.exports;
}

function harness() {
  const links = [];
  const alerts = [];
  const routes = [];
  const storage = new Map();
  let rejectLink = false;
  const router = { push: value => routes.push(['push', value]), replace: value => routes.push(['replace', value]) };
  const queryClient = { refetchQueries: async () => {}, invalidateQueries: async () => {} };
  const categories = ['campus_tasks', 'local_services', 'errands_deliveries', 'digital_remote'].map((name, index) => ({ _id: `category-${index}`, name, displayName: name }));
  const categoriesQuery = { data: { categories }, isError: false, isLoading: false };
  const balanceQuery = { data: { data: { availableBalance: 1000 }, transactions: [] }, isLoading: false, isError: false };
  const mocks = {
    'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView', Modal: 'Modal', RefreshControl: 'RefreshControl', ActivityIndicator: 'ActivityIndicator',
      Platform: { OS: 'android' }, AppState: { addEventListener: () => ({ remove() {} }) }, StyleSheet: { create: value => value },
      Alert: { alert: (...args) => alerts.push(args) }, Linking: { openURL: async url => { links.push(url); if (rejectLink) throw new Error('Unavailable'); } } },
    'expo-router': { useRouter: () => router },
    'expo-status-bar': { StatusBar: 'StatusBar' },
    'expo-image': { Image: 'Image' },
    'expo-web-browser': {},
    '@expo/vector-icons': { Ionicons: 'Icon', MaterialCommunityIcons: 'Icon' },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
    '@tanstack/react-query': { useQueryClient: () => queryClient },
    '@react-native-async-storage/async-storage': { __esModule: true, default: { getItem: async key => storage.get(key) ?? null, removeItem: async key => storage.delete(key) } },
    '@/lib/auth/auth-context': { useAuth: () => ({ accountType: 'user', user: { _id: 'test-user', fullName: 'Test Person', isEmailVerified: true } }) },
    '@/lib/api/queries': { useNotifications: () => ({}), useNearbyTaskers: () => ({}), useCategories: () => categoriesQuery,
      useWalletBalance: () => balanceQuery, useWalletTransactions: () => balanceQuery, useTaskerBalance: () => balanceQuery, useTaskerTransactions: () => balanceQuery },
    '@/lib/api/tasks': { formatNaira: value => `N${value}`, formatShortDate: () => '', formatRelativeTime: () => '', locationLabel: () => '' },
    '@/lib/api/wallet': { verifyFunding: async () => ({ data: { transactionStatus: 'failed' } }) },
    '@/lib/config': { STELLAR_WALLET_ENABLED: false },
    '@/components/taskhub/active-tasks': { ActiveTasks: () => null },
    '@/components/taskhub/screen-header': { ScreenHeader: () => null },
    '@/components/taskhub/fund-wallet-modal': { FundWalletModal: () => null },
  };
  const cache = new Map();
  return { links, alerts, routes, storage, categories, categoriesQuery, load: file => load(file, mocks, cache), failLink: value => { rejectLink = value; } };
}

test('support chooser routes Chat with Us to WhatsApp and Call Us to the dialer, with retry and payment context', async () => {
  const h = harness();
  const { SupportContactButton } = h.load('components/taskhub/support-contact.tsx');
  let renderer;
  await act(async () => { renderer = create(React.createElement(SupportContactButton, { message: 'Payment reference: test-ref & retry' })); });
  const trigger = () => renderer.root.findByProps({ accessibilityLabel: 'Contact Support' });
  const modal = () => renderer.root.findByType('Modal');
  const options = () => renderer.root.findAllByProps({ accessibilityRole: 'link' });
  await act(async () => trigger().props.onPress());
  assert.equal(modal().props.visible, true);
  h.failLink(true);
  await act(async () => options()[0].props.onPress());
  assert.equal(modal().props.visible, true);
  assert.equal(h.alerts[0][0], 'Could not open WhatsApp');
  h.failLink(false);
  await act(async () => options()[0].props.onPress());
  assert.equal(modal().props.visible, false);
  await act(async () => trigger().props.onPress());
  await act(async () => options()[1].props.onPress());
  assert.equal(modal().props.visible, false);
  assert.deepEqual(h.links.slice(0, 2).map(url => new URL(url).pathname), ['/2349124638396', '/2349124638396']);
  assert.equal(h.links[2], 'tel:+2347075979682');
  assert.ok(h.links.slice(0, 2).every(url => new URL(url).searchParams.get('text') === 'Payment reference: test-ref & retry'));
  assert.equal(new URL(h.links[2]).search, '');
  await act(async () => trigger().props.onPress());
  await act(async () => modal().props.onRequestClose());
  assert.equal(modal().props.visible, false);
  await act(async () => renderer.unmount());
});

test('each home category resets the previous draft and opens its services directly; Wallet is one tap away', async () => {
  const h = harness();
  const { PostTaskProvider, usePostTask } = h.load('context/PostTaskContext.tsx');
  const Home = h.load('app/(main)/home.tsx').default;
  const { useNewPost } = h.load('hooks/use-new-post.ts');
  let draft;
  let startNewPost;
  function Probe() { draft = usePostTask(); startNewPost = useNewPost(); return null; }
  let renderer;
  await act(async () => { renderer = create(React.createElement(PostTaskProvider, null, React.createElement(Home), React.createElement(Probe))); });
  for (const [index, label] of ['Campus', 'Local', 'Errands', 'Remote'].entries()) {
    await act(async () => draft.patch({ title: 'Old draft', budget: '7500', subCategories: [{ _id: 'old-service' }], university: { id: 'old', name: 'Old Campus' } }));
    const shortcut = renderer.root.findByProps({ accessibilityLabel: `Post a ${label} task` });
    assert.equal(shortcut.props.disabled, false);
    await act(async () => shortcut.props.onPress());
    assert.deepEqual(h.routes.at(-1), ['push', '/post-service']);
    assert.equal(draft.draft.mainCategory._id, h.categories[index]._id);
    assert.equal(draft.draft.title, '');
    assert.equal(draft.draft.budget, '');
    assert.deepEqual(draft.draft.subCategories, []);
    assert.equal(draft.draft.university, null);
  }
  await act(async () => renderer.root.findByProps({ accessibilityLabel: 'Open Wallet' }).props.onPress());
  assert.deepEqual(h.routes.at(-1), ['push', '/wallet']);
  await act(async () => startNewPost({ replace: true }));
  assert.deepEqual(h.routes.at(-1), ['replace', '/post-category']);
  assert.equal(draft.draft.mainCategory, null);
  await act(async () => renderer.unmount());
});

test('failed wallet payment offers the same support chooser with the original reference', async () => {
  const h = harness();
  h.storage.set('@taskhub/pending-wallet-funding:test-user', JSON.stringify({ reference: 'test-funding-reference', amount: 1000, authorizationUrl: 'https://example.invalid/checkout' }));
  const Wallet = h.load('app/wallet.tsx').default;
  let renderer;
  await act(async () => { renderer = create(React.createElement(Wallet)); });
  const check = renderer.root.findAllByType('Pressable').find(node => node.findAllByType('Text').some(text => text.props.children === 'Check payment status'));
  assert.ok(check);
  await act(async () => { await check.props.onPress(); });
  const alert = h.alerts.find(item => item[0] === 'Payment not completed');
  assert.ok(alert);
  await act(async () => alert[2].find(button => button.text === 'Contact Support').onPress());
  assert.equal(renderer.root.findByType('Modal').props.visible, true);
  await act(async () => renderer.root.findAllByProps({ accessibilityRole: 'link' })[0].props.onPress());
  assert.equal(new URL(h.links[0]).pathname, '/2349124638396');
  assert.match(new URL(h.links[0]).searchParams.get('text'), /test-funding-reference/);
  await act(async () => renderer.unmount());
});


test('all app support links obey the designated chat and call numbers', () => {
  const h = harness();
  const { SUPPORT_PHONE_NUMBERS, getSupportContactUrl } = h.load('lib/support-contact.ts');
  assert.equal(SUPPORT_PHONE_NUMBERS[0].actionLabel, 'Chat with Us');
  assert.equal(getSupportContactUrl(SUPPORT_PHONE_NUMBERS[0]).split('?')[0], 'https://wa.me/2349124638396');
  assert.equal(SUPPORT_PHONE_NUMBERS[1].actionLabel, 'Call Us');
  assert.equal(getSupportContactUrl(SUPPORT_PHONE_NUMBERS[1], 'Payment issue'), 'tel:+2347075979682');
  function check(directory) {
    for (const item of readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, item.name);
      if (item.isDirectory()) check(file);
      else if (/\.tsx?$/.test(file)) assert.doesNotMatch(readFileSync(file, 'utf8'), /tel:\+?2349124638396|wa\.me\/2347075979682/, file);
    }
  }
  for (const directory of ['app', 'components', 'lib']) check(path.join(root, directory));
});
