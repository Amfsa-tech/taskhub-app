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

test('duplicate and fraud decisions stop polling and require explicit retry permission',()=>{
  const {verificationRetryBlocked,verificationPollInterval,verificationMessage}=load('lib/verification-status.ts');
  for(const status of [{decisionCode:'duplicate_identity'},{isDuplicate:true},{isFraudFlagged:true}]) {
    assert.equal(verificationRetryBlocked(status),true);
    assert.equal(verificationRetryBlocked({...status,resubmissionAllowed:false}),true);
    assert.equal(verificationRetryBlocked({...status,resubmissionAllowed:true}),false);
    assert.equal(verificationPollInterval({...status,status:'under_review'}),false);
  }
  assert.equal(verificationPollInterval({status:'under_review'}),5000);
  assert.equal(verificationPollInterval({status:'approved'}),false);
  assert.equal(verificationRetryBlocked({resubmissionAllowed:false}),false);
  assert.equal(verificationMessage({message:'Contact the team about your identity.'}),'Contact the team about your identity.');
});

test('mobile duplicate state replaces loading and blocks both existing and newly revoked verification attempts',async()=>{
  let creates=0;const alerts=[],opened=[];let stopped=false;
  const blocked={isVerified:false,decisionCode:'duplicate_identity',message:'Your identity is linked to another account. Contact support.',isDuplicate:true,isFraudFlagged:true,resubmissionAllowed:false};
  const account={data:{data:blocked},isLoading:true,isError:false,refetch:async()=>({data:{data:blocked}})};
  const record={data:{data:{status:'under_review'}},isLoading:true,isError:false,refetch:async()=>({})};
  const mocks={
    'react-native':{View:'View',Text:'Text',Pressable:'Pressable',ScrollView:'ScrollView',ActivityIndicator:'ActivityIndicator',StyleSheet:{create:v=>v},AppState:{addEventListener:()=>({remove(){}})},Alert:{alert:(...args)=>alerts.push(args)}},
    '@expo/vector-icons':{Ionicons:'Icon'},'expo-router':{useRouter:()=>({replace(){},push(){}})},'expo-status-bar':{StatusBar:'StatusBar'},
    'react-native-safe-area-context':{useSafeAreaInsets:()=>({bottom:0})},'expo-web-browser':{openBrowserAsync:async url=>opened.push(url)},
    '@tanstack/react-query':{useMutation:options=>({isPending:false,mutate:async()=>{try{const result=await options.mutationFn();await options.onSuccess(result)}catch(error){options.onError(error)}}})},
    '@/components/taskhub/screen-header':{ScreenHeader:()=>null},'@/components/taskhub/support-contact':{SupportContactButton:()=>React.createElement('Text',{},'Contact Support')},
    '@/lib/api/queries':{useVerificationStatus:()=>account,useKycStatus:stop=>{stopped=stop;return record}},
    '@/lib/auth/auth-context':{useAuth:()=>({accountType:'tasker'})},
    '@/lib/api/kyc':{createDiditKycSession:async()=>{creates++;return{data:{url:'https://verification.example.invalid/session'}}}},
  };
  const Screen=load('app/nin-verification.tsx',mocks).default;
  let renderer;await act(async()=>{renderer=create(React.createElement(Screen))});
  assert.equal(stopped,true);
  assert.equal(renderer.root.findAllByType('ActivityIndicator').length,0);
  assert.equal(renderer.root.findByProps({accessibilityRole:'alert'}).props.children,blocked.message);
  const retry=()=>renderer.root.findAllByType('Pressable').find(node=>node.findAllByType('Text').some(text=>text.props.children==='Try again'));
  assert.equal(retry(),undefined);
  account.isLoading=false;record.isLoading=false;account.data={data:{...blocked,resubmissionAllowed:true}};
  await act(async()=>renderer.update(React.createElement(Screen)));
  assert.ok(retry());
  await act(async()=>retry().props.onPress());
  assert.equal(creates,0);assert.equal(alerts.at(-1)[1],blocked.message);
  account.refetch=async()=>({data:{data:{...blocked,resubmissionAllowed:true}}});
  await act(async()=>renderer.update(React.createElement(Screen)));
  await act(async()=>retry().props.onPress());
  assert.equal(creates,1);assert.deepEqual(opened,['https://verification.example.invalid/session']);
  await act(async()=>renderer.unmount());
  const Settings=load('app/settings.tsx',mocks).default;
  await act(async()=>{renderer=create(React.createElement(Settings))});
  const campaign=renderer.root.findAllByType('Pressable').find(node=>node.findAllByType('Text').some(text=>text.props.children==='Brand Campaign'));
  assert.ok(campaign);
  await act(async()=>campaign.props.onPress());
  assert.equal(opened.at(-1),'https://www.ngtaskhub.com/brand-campaign');
  await act(async()=>renderer.unmount());
});
