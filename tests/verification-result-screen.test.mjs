import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import React from 'react';
import {act,create} from 'react-test-renderer';
import ts from 'typescript';
const require=createRequire(import.meta.url),root=path.resolve(import.meta.dirname,'..');
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
function load(relative,mocks={},cache=new Map()) {
  if(cache.has(relative))return cache.get(relative);
  const code=ts.transpileModule(readFileSync(path.join(root,relative),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const module={exports:{}};
  new Function('require','module','exports',code)(name=>name in mocks?mocks[name]:name.endsWith('.svg')?{__esModule:true,default:'Icon'}:name.startsWith('@/')?load(name.slice(2)+'.ts',mocks,cache):require(name),module,module.exports);
  cache.set(relative,module.exports);return module.exports;
}


async function mountScreen(t,{platformReturn='cancel',statuses=[{status:'approved',isVerified:true}],networkError=false}={}) {
  t.mock.timers.enable({apis:['setTimeout','Date'],now:0});
  const record={data:{success:true,data:{status:'not_started',isVerified:false}},isLoading:false,isError:false,isRefetching:false};
  record.refetch=async()=>({data:record.data});
  // Deliberately stale; the screen must wait for the primary KYC result.
  const account={data:{data:{isVerified:true}},isLoading:false,isError:false,isRefetching:false,refetch:async()=>({})};
  let calls=0,profileRefreshes=0;const listeners=new Set(),alerts=[];
  const auth={accountType:'tasker',refreshProfile:async()=>{profileRefreshes++}};
  const subscribers=new Set();
  const subscribe=fn=>{subscribers.add(fn);return()=>subscribers.delete(fn)};
  const client={setQueryData(key,update){const target=key[0]==='kyc'?record:account;target.data=typeof update==='function'?update(target.data):update;for(const fn of [...subscribers])fn();}};
  const mocks={
    'react-native':{View:'View',Text:'Text',Pressable:'Pressable',ScrollView:'ScrollView',ActivityIndicator:'ActivityIndicator',StyleSheet:{create:v=>v},AppState:{addEventListener:(_,fn)=>{listeners.add(fn);return{remove:()=>listeners.delete(fn)}}},Alert:{alert:(...args)=>alerts.push(args)}},
    '@expo/vector-icons':{Ionicons:'Icon'},'expo-router':{useRouter:()=>({replace(){}})},'expo-status-bar':{StatusBar:'StatusBar'},
    'react-native-safe-area-context':{useSafeAreaInsets:()=>({bottom:0})},'expo-web-browser':{openBrowserAsync:async()=>({type:platformReturn})},
    '@tanstack/react-query':{useQueryClient:()=>client,useMutation:options=>({isPending:false,mutate:async()=>{try{await options.onSuccess(await options.mutationFn())}catch(error){options.onError(error)}}})},
    '@/components/taskhub/screen-header':{ScreenHeader:()=>null},'@/components/taskhub/support-contact':{SupportContactButton:()=>React.createElement('Text',{},'Contact Support')},
    '@/lib/api/queries':{useVerificationStatus:()=>{React.useSyncExternalStore(subscribe,()=>account.data);return account},useKycStatus:()=>{React.useSyncExternalStore(subscribe,()=>record.data);return record},queryKeys:{kycStatus:()=>['kyc','status'],verificationStatus:()=>['verification-status']}},
    '@/lib/auth/auth-context':{useAuth:()=>auth},
    '@/lib/api/kyc':{createDiditKycSession:async()=>({data:{url:'https://verification.example.invalid/session'}}),getKycStatus:async signal=>{
      assert.equal(signal.aborted,false);calls++;if(networkError)throw Error('offline');return{data:statuses[Math.min(calls-1,statuses.length-1)]};
    }},
  };
  const Screen=load('app/nin-verification.tsx',mocks).default;
  let renderer;await act(async()=>{renderer=create(React.createElement(Screen))});
  const text=()=>JSON.stringify(renderer.toJSON());
  assert.doesNotMatch(text(),/Identity Verified/);
  const button=name=>renderer.root.findAllByType('Pressable').find(node=>node.findAllByType('Text').some(text=>text.props.children===name));
  const start=()=>act(async()=>button('Start verification').props.onPress());
  return{renderer,text,button,start,record,account,alerts,calls:()=>calls,profileRefreshes:()=>profileRefreshes,appState:state=>act(async()=>{for(const fn of [...listeners])fn(state)})};
}
for(const status of ['approved','under_review','rejected'])test(`mobile uses primary backend ${status} after hosted capture closes`,async t=>{
  const message='The document could not be read.';
  const fixture=await mountScreen(t,{statuses:[{status,isVerified:status==='approved',message,resubmissionAllowed:false}]});
  await fixture.start();
  assert.match(fixture.text(),status==='approved'?/Identity Verified/:status==='under_review'?/Your verification is under review/:/The document could not be read/);
  assert.equal(fixture.profileRefreshes(),status==='approved'?1:0);
  assert.equal(fixture.button('Try again'),undefined);
  await act(async()=>t.mock.timers.tick(180000));assert.equal(fixture.calls(),1);
  await act(async()=>fixture.renderer.unmount());
});
test('mobile shows submitted while pending, then duplicate support without retry even if permission is contradictory',async t=>{
  const fixture=await mountScreen(t,{statuses:[{status:'pending',isVerified:false},{status:'rejected',isVerified:false,decisionCode:'duplicate_identity',isDuplicate:true,resubmissionAllowed:true,message:'This identity is already linked to another account.'}]});
  await fixture.start();assert.match(fixture.text(),/Verification submitted. Checking your result/);assert.doesNotMatch(fixture.text(),/Identity Verified/);
  await act(async()=>t.mock.timers.tick(4000));assert.match(fixture.text(),/This identity is already linked/);assert.match(fixture.text(),/Contact Support/);assert.equal(fixture.button('Try again'),undefined);
  assert.equal(fixture.record.data.data.isVerified,false);
  await act(async()=>fixture.renderer.unmount());
});
for(const networkError of [false,true])test(networkError?'mobile network failure stays processing':'mobile stops checking after 90 seconds',async t=>{
  const fixture=await mountScreen(t,{networkError,statuses:[{status:'in_progress',isVerified:false}]});
  await fixture.start();if(!networkError)await act(async()=>t.mock.timers.tick(90000));
  assert.match(fixture.text(),/Your verification is still processing. You can refresh this page later./);assert.doesNotMatch(fixture.text(),/Identity Verified/);assert.equal(fixture.button('Try again'),undefined);
  const count=fixture.calls();await act(async()=>t.mock.timers.tick(90000));assert.equal(fixture.calls(),count);
  await act(async()=>fixture.renderer.unmount());
});
test('Android waits for return from the browser before checking',async t=>{
  const fixture=await mountScreen(t,{platformReturn:'opened',statuses:[{status:'under_review',isVerified:false}]});
  await fixture.start();assert.equal(fixture.calls(),0);
  await fixture.appState('background');assert.equal(fixture.calls(),0);
  await fixture.appState('active');assert.equal(fixture.calls(),1);assert.match(fixture.text(),/Your verification is under review/);
  await act(async()=>fixture.renderer.unmount());
});
test('unmounting the mobile verification screen cancels subsequent checks',async t=>{
  const fixture=await mountScreen(t,{statuses:[{status:'pending',isVerified:false}]});await fixture.start();assert.equal(fixture.calls(),1);
  await act(async()=>fixture.renderer.unmount());await act(async()=>t.mock.timers.tick(180000));assert.equal(fixture.calls(),1);
});
