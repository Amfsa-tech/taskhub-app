import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import ts from 'typescript';
import React from 'react';
import { act, create } from 'react-test-renderer';

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '..');
function load(file, mocks = {}, cache = new Map()) {
  if (cache.has(file)) return cache.get(file);
  const code = ts.transpileModule(readFileSync(path.join(root, file), 'utf8'), {
    fileName: file, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => {
    if (name in mocks) return mocks[name];
    if (name.endsWith('.svg')) return { __esModule: true, default: 'Icon' };
    if (name.startsWith('@/') || name.startsWith('.')) {
      const relative = name.startsWith('@/') ? name.slice(2) : path.join(path.dirname(file), name);
      const source = ['.ts', '.tsx'].map(ext => relative + ext).find(candidate => existsSync(path.join(root, candidate)));
      if (source) return load(source, mocks, cache);
    }
    return require(name);
  }, module, module.exports);
  cache.set(file, module.exports);
  return module.exports;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { QueryClient, QueryClientProvider } = require('@tanstack/react-query');
const settle = async () => { await act(async () => new Promise(resolve => setTimeout(resolve, 20))); };

test('mobile chat retains a rate-limited draft, displays the backend message and clears it only after a successful resend', async () => {
  const previousFetch = globalThis.fetch, previousFrame = globalThis.requestAnimationFrame;
  const message = 'You are sending messages too quickly. Please slow down.';
  const alerts = [], requests = [];
  let tree, succeed = false;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const mocks = {
    'react-native': { View:'View', Text:'Text', TextInput:'TextInput', Pressable:'Pressable', ScrollView:'ScrollView',
      KeyboardAvoidingView:'KeyboardAvoidingView', ActivityIndicator:'ActivityIndicator', Platform:{OS:'ios'},
      StyleSheet:{create:value=>value}, Alert:{alert:(...args)=>alerts.push(args)},
      AppState:{addEventListener:()=>({remove(){}})}, Linking:{} },
    'expo-image':{Image:'Image'}, 'expo-document-picker':{}, 'expo-status-bar':{StatusBar:'StatusBar'},
    'expo-router':{useRouter:()=>({push(){}}),useLocalSearchParams:()=>({id:'conversation-1',name:'Test Person'})},
    'react-native-safe-area-context':{useSafeAreaInsets:()=>({top:0,bottom:0})},
    '@/lib/api/queries':{useInfiniteMessages:()=>({data:{pages:[]}})},
    '@/components/taskhub/screen-header':{ScreenHeader:'ScreenHeader'},
    '@/lib/image-picker':{pickImages:async()=>[]},
    '@/lib/auth/auth-context':{useAuth:()=>({accountType:'user'})},
    '@/lib/config':{API_BASE_URL:'https://api.example.invalid'},
    '@/lib/support-context':{getSupportScope:()=>'',captureSupportRequest(){},clearSupportIssue(){}},
  };
  const cache = new Map();
  const chat = load('lib/api/chat.ts',mocks,cache);
  mocks['@/lib/api/chat']={...chat,markConversationRead:async()=>{},updateChatPresence:async()=>{}};
  const Chat = load('app/chat.tsx',mocks,cache).default;
  globalThis.requestAnimationFrame = callback => {callback();return 0;};
  globalThis.fetch = async (url,options) => {
    requests.push({url,options});
    return new Response(JSON.stringify(succeed?{status:'success',message:{_id:'message-1'}}:{status:'error',code:'rate_limit_exceeded',message}),{status:succeed?200:429});
  };
  try {
    await act(async()=>{tree=create(React.createElement(QueryClientProvider,{client},React.createElement(Chat)))});
    const input=()=>tree.root.findByType('TextInput');
    await act(async()=>input().props.onChangeText('  Please keep this draft  '));
    await act(async()=>input().props.onSubmitEditing());await settle();
    assert.equal(requests.length,1);
    assert.equal(input().props.value,'  Please keep this draft  ');
    assert.deepEqual(alerts.at(-1),['Message not sent',message]);
    assert.equal(requests[0].options.body.get('text'),'Please keep this draft');
    // Waiting or rerendering never auto-resends the rejected message.
    await settle();assert.equal(requests.length,1);
    succeed=true;await act(async()=>input().props.onSubmitEditing());await settle();
    assert.equal(requests.length,2);assert.equal(input().props.value,'');
  } finally {
    if(tree)await act(async()=>tree.unmount());client.clear();
    globalThis.fetch=previousFetch;globalThis.requestAnimationFrame=previousFrame;
  }
});


test('a rejected invitation keeps the note and never displays a false sent confirmation', async () => {
  const closeCalls = [];
  let tree, fail = true;
  const mocks = {
    'react-native': { Modal:'Modal', Pressable:'Pressable', Text:'Text', TextInput:'TextInput', View:'View', StyleSheet:{create:value=>value} },
    'react-native-safe-area-context': { useSafeAreaInsets:()=>({bottom:0}) },
  };
  const { InviteToBidModal } = load('components/taskhub/invite-to-bid-modal.tsx', mocks);
  const onSend = async () => {
    if(fail)throw new Error('You have sent too many invitations. Please try again later.');
    closeCalls.push('closed after success');
  };
  try {
    await act(async()=>{tree=create(React.createElement(InviteToBidModal,{visible:true,taskerName:'Test Tasker',onClose:()=>closeCalls.push('closed'),onSend}))});
    const input=()=>tree.root.findByType('TextInput');
    await act(async()=>input().props.onChangeText('Please help with my task.'));
    // Select the innermost Pressable containing the Send Invite label.
    const button=()=>tree.root.findAllByType('Pressable').filter(node=>node.findAllByType('Text').some(text=>text.props.children==='Send Invite')).at(-1);
    await act(async()=>button().props.onPress());
    assert.equal(input().props.value,'Please help with my task.');
    assert.equal(button().props.disabled,false);
    assert.equal(tree.root.findAllByType('Text').some(text=>text.props.children==='Invite sent'),false);
    assert.deepEqual(closeCalls,[]);
    fail=false;await act(async()=>button().props.onPress());
    assert.deepEqual(closeCalls,['closed after success']);
  } finally {if(tree)await act(async()=>tree.unmount());}
});
