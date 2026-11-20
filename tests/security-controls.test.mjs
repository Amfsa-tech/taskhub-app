import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { act, create } from 'react-test-renderer';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const require = createRequire(import.meta.url), root = path.resolve(import.meta.dirname, '..');
function load(file, mocks = {}, cache = new Map()) {
  if (cache.has(file)) return cache.get(file);
  const code = ts.transpileModule(readFileSync(path.join(root, file), 'utf8'), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => {
    if (name in mocks) return mocks[name];
    if (name.startsWith('@/')) {
      const target = ['.ts', '.tsx'].map(ext => name.slice(2) + ext).find(candidate => existsSync(path.join(root, candidate)));
      return load(target, mocks, cache);
    }
    return require(name);
  }, module, module.exports);
  cache.set(file, module.exports); return module.exports;
}



test('mobile protected requests get fresh tokens and preserve CAPTCHA rejection details', async () => {
  const originalKey=process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY, originalFetch=globalThis.fetch;
  process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY='test-site-key';
  const broker=load('lib/captcha.ts');let count=0;const requests=[];
  const unregister=broker.registerCaptchaRequester(async()=>`fresh-${++count}`);
  const client=load('lib/api/client.ts',{'@/lib/config':{API_BASE_URL:'https://example.test'},'@/lib/captcha':broker,'@/lib/support-context':{getSupportScope:()=>'',captureSupportRequest(){},clearSupportIssue(){}}});
  try{
    globalThis.fetch=async(url,options)=>{requests.push(options);return new Response(JSON.stringify(requests.length===1?{code:'CAPTCHA_FAILED',message:'Please try again.'}:{status:'success'}),{status:requests.length===1?403:200,headers:{'Content-Type':'application/json'}})};
    await assert.rejects(client.api.post('/api/auth/user-login',{}, {auth:false}),reason=>reason.code==='CAPTCHA_FAILED');
    await client.api.post('/api/auth/user-login',{}, {auth:false});
    assert.equal(requests.length,2);assert.equal(requests[0].headers['cf-turnstile-response'],'fresh-1');assert.equal(requests[1].headers['cf-turnstile-response'],'fresh-2');
    delete process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY;await client.api.post('/api/auth/user-login',{}, {auth:false});assert.equal(count,2);
  }finally{unregister();globalThis.fetch=originalFetch;if(originalKey===undefined)delete process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY;else process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY=originalKey;}
});

test('mobile server errors retain Error ID from both response body and header', async () => {
  const client=load('lib/api/client.ts',{'@/lib/config':{API_BASE_URL:'https://example.test'},'@/lib/support-context':{getSupportScope:()=>'',captureSupportRequest(){},clearSupportIssue(){}}});
  const reason=new client.ApiError('Could not load',500,{requestId:'request-789'});assert.equal(reason.requestId,'request-789');assert.match(reason.message,/Error ID: request-789/);
  const originalFetch=globalThis.fetch;
  try{globalThis.fetch=async()=>new Response(JSON.stringify({message:'Could not load'}),{status:500,headers:{'Content-Type':'application/json','X-Request-ID':'header-id'}});await assert.rejects(client.api.get('/api/auth/user'),error=>error.requestId==='header-id'&&error.message.includes('Error ID: header-id'));}finally{globalThis.fetch=originalFetch;}
});

test('data export opens the native file sheet only after success and deletes the temporary file', async () => {
  const files=[],shares=[],requests=[];let response={status:'success',data:{account:{fullName:'Example User'}}};let failure=false;
  class File {exists=false;uri='file:///temporary-export.json';constructor(){files.push(this)}create(){this.exists=true}write(value){this.content=value}delete(){this.exists=false;this.deleted=true}}
  const {DownloadMyData}=load('components/taskhub/download-my-data.tsx',{
    'react-native':{ActivityIndicator:'ActivityIndicator',Pressable:'Pressable',Text:'Text',View:'View',StyleSheet:{create:x=>x}},'@expo/vector-icons':{Ionicons:'Icon'},
    '@/lib/auth/auth-context':{useAuth:()=>({accountType:'user',user:{_id:'user-1'}})},
    '@/lib/api/client':{api:{get:async(url,options)=>{requests.push({url,options});if(failure)throw new Error('Try later. Error ID: export-id');return response}}},
    'expo-file-system':{File,Paths:{cache:'file:///cache/'}},'expo-sharing':{isAvailableAsync:async()=>true,shareAsync:async(uri,options)=>shares.push({uri,options})},
  });
  let renderer;await act(async()=>{renderer=create(React.createElement(DownloadMyData))});
  await act(async()=>{renderer.root.findByType('Pressable').props.onPress();await new Promise(resolve=>setImmediate(resolve));});
  assert.equal(requests[0].url,'/api/auth/my-data');assert.equal(requests[0].options.cache,'no-store');assert.equal(shares.length,1);assert.equal(shares[0].options.mimeType,'application/json');assert.equal(files[0].deleted,true);assert.deepEqual(JSON.parse(files[0].content),response);
  failure=true;
  await act(async()=>{renderer.root.findByType('Pressable').props.onPress();await new Promise(resolve=>setImmediate(resolve));});
  assert.equal(shares.length,1);assert.equal(files.length,1);assert.match(renderer.root.findByProps({accessibilityRole:'alert'}).props.children,/Error ID: export-id/);
  await act(async()=>renderer.unmount());
});

test('the embedded challenge accepts tokens only from the trusted security page', async () => {
  const tokens=[];
  const Challenge=load('components/taskhub/turnstile-challenge.tsx',{
    'react-native':{ActivityIndicator:'ActivityIndicator',Pressable:'Pressable',Text:'Text',View:'View'},'react-native-webview':{WebView:'WebView'},
  }).default;
  let renderer;await act(async()=>{renderer=create(React.createElement(Challenge,{onToken:token=>tokens.push(token)}))});
  const view=renderer.root.findByType('WebView');assert.equal(view.props.source.uri,'https://www.ngtaskhub.com/security-check');
  view.props.onMessage({nativeEvent:{url:'https://other.example/security-check',data:JSON.stringify({type:'turnstile-token',token:'bad'})}});
  view.props.onMessage({nativeEvent:{url:'https://www.ngtaskhub.com/security-check',data:JSON.stringify({type:'turnstile-token',token:'good'})}});
  assert.deepEqual(tokens,['good']);assert.equal(view.props.onShouldStartLoadWithRequest({url:'https://other.example/'}),false);
  await act(async()=>renderer.unmount());
});


test('mobile security modal is on demand, cancellation releases the request and no token is cached', async () => {
  const originalKey=process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY;process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY='public-test-key';
  const broker=load('lib/captcha.ts');
  const Fake=props=>React.createElement('Challenge',props);
  const {CaptchaProvider}=load('components/taskhub/captcha-provider.tsx',{
    react:{...React,lazy:()=>Fake},'@/lib/captcha':broker,
    'react-native':{Modal:'Modal',ActivityIndicator:'ActivityIndicator',Pressable:'Pressable',Text:'Text',View:'View',StyleSheet:{create:x=>x}},
  });
  let renderer;
  try{
    await act(async()=>{renderer=create(React.createElement(CaptchaProvider))});
    assert.equal(renderer.root.findByType('Modal').props.visible,false);assert.equal(renderer.root.findAllByType('Challenge').length,0);
    let first;await act(async()=>{first=broker.requestCaptchaToken()});
    assert.equal(renderer.root.findByType('Modal').props.visible,true);
    const cancelled=assert.rejects(first,/cancelled/);
    await act(async()=>renderer.root.findByType('Pressable').props.onPress());await cancelled;
    let second;await act(async()=>{second=broker.requestCaptchaToken()});
    await act(async()=>renderer.root.findByType('Challenge').props.onToken('new-token'));
    assert.equal(await second,'new-token');assert.equal(renderer.root.findByType('Modal').props.visible,false);
    let third;await act(async()=>{third=broker.requestCaptchaToken()});const closed=assert.rejects(third,/closed/);
    await act(async()=>renderer.unmount());renderer=null;await closed;
    await assert.rejects(broker.requestCaptchaToken(),/not ready/);
  }finally{if(renderer)await act(async()=>renderer.unmount());if(originalKey===undefined)delete process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY;else process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY=originalKey;}
});

test('leaving Settings aborts an export and never shares a late response', async () => {
  let resolveRequest,signal;let shares=0;
  const {DownloadMyData}=load('components/taskhub/download-my-data.tsx',{
    'react-native':{ActivityIndicator:'ActivityIndicator',Pressable:'Pressable',Text:'Text',View:'View',StyleSheet:{create:x=>x}},'@expo/vector-icons':{Ionicons:'Icon'},
    '@/lib/auth/auth-context':{useAuth:()=>({accountType:'tasker',user:{_id:'tasker-1'}})},
    '@/lib/api/client':{api:{get:(_url,options)=>{signal=options.signal;return new Promise(resolve=>{resolveRequest=resolve})}}},
    'expo-sharing':{isAvailableAsync:async()=>true,shareAsync:async()=>shares++},
  });
  let renderer;await act(async()=>{renderer=create(React.createElement(DownloadMyData))});
  await act(async()=>renderer.root.findByType('Pressable').props.onPress());
  await act(async()=>renderer.unmount());assert.equal(signal.aborted,true);
  await act(async()=>{resolveRequest({status:'success',data:{account:{fullName:'Former account'}}});await new Promise(resolve=>setImmediate(resolve));});
  assert.equal(shares,0);
});
