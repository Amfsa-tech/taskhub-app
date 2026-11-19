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
function load(file, mocks = {}, cache = new Map()) {
  if (cache.has(file)) return cache.get(file);
  const code = ts.transpileModule(readFileSync(path.join(root, file), 'utf8'), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => {
    if (name in mocks) return mocks[name];
    if (name.startsWith('@/') || name.startsWith('.')) {
      const relative = name.startsWith('@/') ? name.slice(2) : path.join(path.dirname(file), name);
      const source = ['.ts', '.tsx'].map(extension => relative + extension).find(candidate => existsSync(path.join(root, candidate)));
      if (source) return load(source, mocks, cache);
    }
    return require(name);
  }, module, module.exports);
  cache.set(file, module.exports); return module.exports;
}
const referral = { referralCode: 'TK7M2QP9', referralLink: 'https://api.example.invalid/r/TK7M2QP9', shareMessage: 'Join me on TaskHub! https://api.example.invalid/r/TK7M2QP9', accountType: 'User', totalReferrals: 7, userReferrals: 4, taskerReferrals: 3 };

test('mobile referral API uses the authenticated client and rejects incomplete counts', async () => {
  const signal = new AbortController().signal;
  const { getMyReferrals } = load('lib/api/referrals.ts', { './client': { api: { get: async (url, options) => {
    assert.equal(url, '/api/referrals/me'); assert.equal(options.signal, signal); return { status: 'success', data: referral };
  } } } });
  assert.deepEqual(await getMyReferrals(signal), referral);
  const { parseMyReferrals } = load('lib/referrals.ts');
  for (const payload of [null, {}, { ...referral, totalReferrals: undefined }, { ...referral, taskerReferrals: -1 }]) assert.throws(() => parseMyReferrals(payload), /Could not load/);
});

test('referral queries cannot reuse a different account or role and stop when signed out', async () => {
  let accountType = 'user', user = { _id: 'alice' }, options;
  const { useMyReferrals } = load('hooks/use-my-referrals.ts', {
    '@/lib/auth/auth-context': { useAuth: () => ({ user, accountType }) },
    '@/lib/api/referrals': { getMyReferrals: async () => referral },
    '@tanstack/react-query': { useQuery: config => { options = config; return { data: referral }; } },
  });
  useMyReferrals(); assert.deepEqual(options.queryKey, ['referrals', 'me', 'user', 'alice']);
  assert.deepEqual(await options.queryFn({}), referral);
  user = { _id: 'bob' }; useMyReferrals(); assert.equal(options.queryKey[3], 'bob');
  accountType = 'tasker'; useMyReferrals(); assert.equal(options.queryKey[2], 'tasker');
  await assert.rejects(() => options.queryFn({}), /for this profile/);
  user = null; accountType = null; assert.equal(useMyReferrals().data, undefined); assert.equal(options.enabled, false);
});

test('copy uses the profile link, native sharing uses exact shareMessage, and missing messages cannot share', async () => {
  let copied, shared, tree;
  const { ReferralActions } = load('components/taskhub/referral-actions.tsx', {
    'expo-clipboard': { setStringAsync: async value => { copied = value; return true; } },
    'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable', StyleSheet: { create: value => value }, Alert: { alert() {} }, Share: { share: async payload => { shared = payload; } } },
  });
  await act(async () => { tree = create(React.createElement(ReferralActions, { link: referral.referralLink })); });
  let buttons = tree.root.findAllByType('Pressable');
  assert.equal(buttons[0].props.disabled, false); assert.equal(buttons[1].props.disabled, true);
  await act(async () => { buttons[0].props.onPress(); }); assert.equal(copied, referral.referralLink);
  assert.match(JSON.stringify(tree.toJSON()), /Link copied/);
  await act(async () => { tree.update(React.createElement(ReferralActions, { link: referral.referralLink, message: referral.shareMessage })); });
  buttons = tree.root.findAllByType('Pressable');
  await act(async () => { buttons[1].props.onPress(); }); assert.deepEqual(shared, { message: referral.shareMessage });
  await act(async () => { tree.update(React.createElement(ReferralActions, { link: 'https://example.invalid/new', message: referral.shareMessage })); });
  assert.doesNotMatch(JSON.stringify(tree.toJSON()), /Link copied/);
  await act(async () => { tree.unmount(); });
});

test('native referral screen shows real counts and errors with a retry action', async () => {
  let query = { data: referral }, retries = 0, tree;
  const { default: Screen } = load('app/referrals.tsx', {
    'expo-router': { useRouter: () => ({ replace() {}, push() {} }) },
    'expo-status-bar': { StatusBar: () => null },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 0 }) },
    'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView', StyleSheet: { create: value => value } },
    '@/components/taskhub/screen-header': { ScreenHeader: () => null },
    '@/components/taskhub/referral-actions': { ReferralActions: () => null },
    '@/lib/auth/auth-context': { useAuth: () => ({ user: { _id: 'alice' }, isBootstrapping: false }) },
    '@/hooks/use-my-referrals': { useMyReferrals: () => ({ ...query, refetch: () => { retries++; } }) },
  });
  await act(async () => { tree = create(React.createElement(Screen)); });
  let texts = tree.root.findAllByType('Text').map(node => node.props.children);
  for (const expected of ['7', '4', '3', 'Total referred', 'Users', 'Taskers', referral.referralCode]) assert.ok(texts.includes(expected));
  query = { isError: true, error: new Error('Please try again in a minute.') };
  await act(async () => { tree.update(React.createElement(Screen)); });
  assert.match(JSON.stringify(tree.toJSON()), /Please try again in a minute/);
  assert.doesNotMatch(JSON.stringify(tree.toJSON()), /Total referred/);
  await act(async () => { tree.root.findAllByType('Pressable')[0].props.onPress(); }); assert.equal(retries, 1);
  await act(async () => { tree.unmount(); });
});

test('signup deep link preserves the referral code and code errors use backend explanations', () => {
  const { default: SignupLink } = load('app/signup.tsx', { 'expo-router': { Redirect: 'Redirect', useLocalSearchParams: () => ({ ref: 'TK7M2QP9' }) } });
  const route = SignupLink().props.href;
  assert.equal(route.pathname, '/create-account'); assert.equal(route.params.ref, 'TK7M2QP9'); assert.equal(route.params.chooseRole, 'true');
  assert.equal(JSON.parse(readFileSync(path.join(root, 'app.json'), 'utf8')).expo.scheme, 'taskhubapp');
  const { referralCodeValue, referralFieldError } = load('lib/referral-code.ts');
  assert.equal(referralCodeValue(' tk7m2qp9 '), 'TK7M2QP9'); assert.equal(referralCodeValue(''), '');
  for (const code of ['INVALID_REFERRAL_CODE', 'SELF_REFERRAL']) assert.equal(referralFieldError({ body: { code, message: 'Use another code.' } }), 'Use another code.');
  assert.equal(referralFieldError({ body: { code: 'OTHER' } }), undefined);
});
