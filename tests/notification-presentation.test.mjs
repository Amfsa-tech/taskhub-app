import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { act, create } from 'react-test-renderer';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const { QueryClient, QueryClientProvider } = require('@tanstack/react-query');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('mobile notifications keep routing metadata out of the UI and open the intended task or chat', async () => {
  const notice = { _id: 'notice-1', title: 'New Hire Request', message: 'You received a hire request for Content Writing.', type: 'hire_request', read: true, createdAt: new Date().toISOString(), metadata: { taskId: 'raw-task-identifier', bidId: 'raw-bid-identifier', action: 'view_chat' } };
  const routes = [];
  const mocks = {
    'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView', ActivityIndicator: 'ActivityIndicator', StyleSheet: { create: x => x } },
    'expo-router': { useRouter: () => ({ push: route => routes.push(route) }) },
    'expo-status-bar': { StatusBar: 'StatusBar' },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
    '@/components/taskhub/screen-header': { ScreenHeader: 'ScreenHeader' },
    '@/lib/api/queries': { useNotifications: () => ({ data: { data: { notifications: [notice], unreadCount: 0 } } }) },
    '@/lib/api/notifications': { formatRelativeTime: () => 'just now' },
  };
  const code = ts.transpileModule(readFileSync(new URL('../app/notifications.tsx', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => {
    if (name in mocks) return mocks[name];
    if (name.endsWith('.svg')) return { __esModule: true, default: 'Icon' };
    return require(name);
  }, module, module.exports);
  const Screen = module.exports.default, client = new QueryClient();
  let renderer;
  const view = () => React.createElement(QueryClientProvider, { client }, React.createElement(Screen));
  await act(async () => { renderer = create(view()); });
  assert.doesNotMatch(JSON.stringify(renderer.toJSON()), /view_chat|raw-task-identifier|raw-bid-identifier|hire_request/);
  await act(async () => renderer.root.findByType('Pressable').props.onPress());
  assert.deepEqual(routes.at(-1), { pathname: '/task-details', params: { id: 'raw-task-identifier' } });
  notice.metadata.conversationId = 'chat-1';
  await act(async () => renderer.update(view()));
  await act(async () => renderer.root.findByType('Pressable').props.onPress());
  assert.deepEqual(routes.at(-1), { pathname: '/chat', params: { id: 'chat-1' } });
  await act(async () => renderer.unmount());
});
