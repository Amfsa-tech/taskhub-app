import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import React from 'react';
import { act, create } from 'react-test-renderer';
import ts from 'typescript';
const require = createRequire(import.meta.url), root = path.resolve(import.meta.dirname, '..');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
function load(file, mocks, cache = new Map()) {
  if (cache.has(file)) return cache.get(file);
  const code = ts.transpileModule(readFileSync(path.join(root, file), 'utf8'), { fileName: file, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => {
    if (name in mocks) return mocks[name];
    if (name.endsWith('.svg')) return { __esModule: true, default: 'Icon' };
    if (name.startsWith('@/')) {
      const file = ['.ts', '.tsx'].map(ext => name.slice(2) + ext).find(file => existsSync(path.join(root, file)));
      return load(file, mocks, cache);
    }
    return require(name);
  }, module, module.exports);
  cache.set(file, module.exports); return module.exports;
}

test('mobile Home and Profile show the same live score and ring, navigate correctly, and hide at 100%', async () => {
  let user = { _id: 'tasker-1', firstName: 'Ada', emailAddress: 'ada@example.invalid' }, status, tree;
  const routes = [], options = [];
  const query = () => ({ data: {}, isLoading: false });
  const mocks = {
    'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView', RefreshControl: 'RefreshControl', ActivityIndicator: 'ActivityIndicator', Alert: {}, StyleSheet: { create: value => value, absoluteFill: {} } },
    'react-native-svg': { __esModule: true, default: 'Svg', Circle: 'Circle' },
    'expo-router': { useRouter: () => ({ push: route => routes.push(route) }) },
    'expo-image': { Image: 'Image' }, 'expo-status-bar': { StatusBar: 'StatusBar' },
    '@expo/vector-icons': { MaterialCommunityIcons: 'Icon' },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
    '@tanstack/react-query': { useQuery: config => { options.push(config); return { data: status ? { data: status } : undefined }; }, useMutation: () => ({}), useQueryClient: () => ({}) },
    '@/lib/auth/auth-context': { useAuth: () => ({ user, accountType: 'tasker', isBootstrapping: false }) },
    '@/lib/api/client': { ApiError: class extends Error {} },
    '@/lib/api/kyc': { getKycStatus: async () => ({ data: status }) },
    '@/lib/api/queries': { queryKeys: { kycStatus: () => ['kycStatus'] }, useCategories: query, useNearbyTaskers: query, useNotifications: query, useTaskerBalance: query, useTaskerBids: query, useTaskerFeed: query, useTaskerTasks: query, useTaskerTransactions: query },
    '@/lib/api/tasks': { formatNaira: String, formatRelativeTime: () => '', locationLabel: () => '' },
    '@/hooks/use-new-post': { useNewPost: () => ({}) },
    '@/components/taskhub/referral-card': { ReferralCard: () => null },
    '@/components/taskhub/recent-tasks': { RecentTasks: () => null },
  };
  const cache = new Map();
  const Home = load('app/(main)/home.tsx', mocks, cache).default;
  const Profile = load('app/(main)/profile.tsx', mocks, cache).default;
  for (const score of [0, 25, 50, 75, 100]) {
    const keys = ['profilePhoto', 'servicesSelected', 'portfolioAdded', 'identityVerified'];
    user = { ...user, profileCompletion: { score, factors: Object.fromEntries(keys.map((key, index) => [key, index < score / 25])) } };
    await act(async () => { tree = create(React.createElement(React.Fragment, {}, React.createElement(Home), React.createElement(Profile))); });
    const rings = tree.root.findAllByProps({ accessibilityRole: 'progressbar' });
    assert.equal(rings.length, score === 100 ? 0 : 2);
    for (const ring of rings) {
      assert.equal(ring.props.accessibilityValue.now, score);
      assert.deepEqual(ring.findByType('Text').props.children, [score, '%']);
      assert.ok(Math.abs(ring.findAllByType('Circle')[1].props.strokeDashoffset - 2 * Math.PI * 22 * (1 - score / 100)) < 0.0001);
    }
    if (score < 100) {
      await act(async () => { tree.root.findAll(node => node.type === 'Pressable' && node.props.accessibilityLabel?.startsWith('Complete Verification'))[0].props.onPress(); });
      assert.equal(routes.at(-1), ['/edit-profile', '/tasker-services', '/tasker-portfolio', '/select-verification'][score / 25]);
    }
    await act(async () => { tree.unmount(); });
  }
  status = { status: 'rejected', isVerified: false };
  await act(async () => { tree = create(React.createElement(React.Fragment, {}, React.createElement(Home), React.createElement(Profile))); });
  assert.deepEqual(tree.root.findAllByProps({ accessibilityRole: 'progressbar' }).map(node => node.props.accessibilityValue.now), [75, 75]);
  assert.equal(options.every(query => query.enabled === true && !query.refetchInterval), true);
  await act(async () => { tree.unmount(); });
});
