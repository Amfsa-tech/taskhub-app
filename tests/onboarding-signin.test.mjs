import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {act,create} from 'react-test-renderer';
const require=createRequire(import.meta.url);
const {QueryClient,QueryClientProvider}=require('@tanstack/react-query');
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
function harness(params={}) {
  const routes=[],calls=[];
  class ApiError extends Error{constructor(){super('This is a Tasker account. Select Tasker above and sign in again.');this.code='ACCOUNT_ROLE_MISMATCH';}}
  const native={View:'View',Text:'Text',Pressable:'Pressable',TextInput:'TextInput',ScrollView:'ScrollView',KeyboardAvoidingView:'View',ActivityIndicator:'Spinner',FlatList:'FlatList',Dimensions:{get:()=>({width:390})},StyleSheet:{create:x=>x},Platform:{OS:'android'},Alert:{alert(){}}};
  const mocks={
    'react-native':native,'expo-image':{Image:'Image'},'expo-status-bar':{StatusBar:'StatusBar'},'expo-apple-authentication':{},
    'expo-router':{useLocalSearchParams:()=>params,useRouter:()=>({replace:value=>routes.push(value),push:value=>routes.push(value),back(){}})},
    'react-native-safe-area-context':{useSafeAreaInsets:()=>({top:0,bottom:0})},'react-native-keyboard-controller':{KeyboardAwareScrollView:'ScrollView'},
    '@/components/taskhub/biometric-login-button':{BiometricLoginButton:()=>null},'@/components/taskhub/captcha-notice':{CaptchaNotice:()=>null},
    '@/lib/auth/apple':{isAppleSignInAvailable:async()=>false},'@/lib/auth/google':{},'@/lib/auth/pending-email-login':{},
    '@/lib/api/client':{ApiError},'@/lib/auth/auth-context':{useAuth:()=>({signIn:async(type,credentials)=>{calls.push({type,credentials});if(type!=='tasker')throw new ApiError();}})},
  };
  function load(file) {
    const module={exports:{}};const code=ts.transpileModule(readFileSync(new URL('../'+file,import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
    new Function('require','module','exports',code)(name=>{
      if(name in mocks)return mocks[name];
      if(name==='@/components/taskhub/account-type-selector')return load('components/taskhub/account-type-selector.tsx');
      if(name.startsWith('@/components/icons/'))return new Proxy({},{get:()=>()=>null});
      if(/\.(png|svg)$/.test(name))return 1;
      return require(name);
    },module,module.exports);return module.exports;
  }
  return{load,routes,calls};
}
test('Get Started immediately leaves the first intro slide and duplicate taps navigate once',async()=>{
  const h=harness(),Screen=h.load('app/onboarding.tsx').default;let renderer;
  await act(async()=>{renderer=create(React.createElement(Screen));});
  const button=renderer.root.findAllByType('Pressable').find(node=>node.findAllByType('Text').some(text=>text.children.join('').includes('Get Started')));
  await act(async()=>{button.props.onPress();button.props.onPress();});
  assert.deepEqual(h.routes,['/purpose']);await act(async()=>renderer.unmount());
});
test('login reached without purpose selection has both roles and recovers from wrong role without losing credentials',async()=>{
  const h=harness(),Screen=h.load('app/login-form.tsx').default;let renderer;
  const client=new QueryClient({defaultOptions:{mutations:{retry:false}}});
  await act(async()=>{renderer=create(React.createElement(QueryClientProvider,{client},React.createElement(Screen)));});
  const email=renderer.root.findByProps({placeholder:'you@example.com'}),password=renderer.root.findByProps({placeholder:'Enter password'});
  await act(async()=>{email.props.onChangeText('ada@example.invalid');password.props.onChangeText('password-test');});
  const login=()=>renderer.root.findAllByType('Pressable').find(node=>node.findAllByType('Text').some(text=>text.children.join('')==='Login'));
  await act(async()=>{login().props.onPress();await new Promise(resolve=>setTimeout(resolve,10));});
  assert.equal(renderer.root.findByProps({accessibilityLabel:'Tasker account'}).props.accessibilityState.checked,true);
  assert.equal(email.props.value,'ada@example.invalid');assert.equal(password.props.value,'password-test');
  assert.match(JSON.stringify(renderer.toJSON()),/Tasker sign-in is now selected/);
  await act(async()=>{login().props.onPress();await new Promise(resolve=>setTimeout(resolve,10));});
  assert.deepEqual(h.calls.map(call=>call.type),['user','tasker']);assert.deepEqual(h.routes,['/home']);
  await act(async()=>renderer.unmount());client.clear();
});
test('a tasker deep link starts with the Tasker radio selected and can switch before signing in',async()=>{
 const h=harness({type:'tasker'}),Screen=h.load('app/login-form.tsx').default;let renderer;const client=new QueryClient();
 await act(async()=>{renderer=create(React.createElement(QueryClientProvider,{client},React.createElement(Screen)));});
 assert.equal(renderer.root.findByProps({accessibilityLabel:'Tasker account'}).props.accessibilityState.checked,true);
 await act(async()=>renderer.root.findByProps({accessibilityLabel:'User account'}).props.onPress());
 assert.equal(renderer.root.findByProps({accessibilityLabel:'User account'}).props.accessibilityState.checked,true);
 await act(async()=>renderer.unmount());client.clear();
});
