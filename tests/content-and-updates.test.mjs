import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { act, create } from 'react-test-renderer';
const require = createRequire(import.meta.url), root = path.resolve(import.meta.dirname, '..');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
function load(file, mocks = {}, cache = new Map()) {
 if (cache.has(file)) return cache.get(file);
 const module = { exports: {} };
 const code = ts.transpileModule(readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
 new Function('require','module','exports',code)(name => {
  if (name in mocks) return mocks[name];
  if (name.endsWith('.svg')) return {__esModule:true,default:'Logo'};
  if (name.startsWith('@/') || name.startsWith('.')) {
   const base = name.startsWith('@/') ? name.slice(2) : path.join(path.dirname(file), name);
   const target = ['.ts','.tsx'].map(ext=>base+ext).find(candidate=>existsSync(path.join(root,candidate)));
   return load(target,mocks,cache);
  }
  return require(name);
 }, module, module.exports); cache.set(file,module.exports); return module.exports;
}
const native = { View:'View', Text:'Text', Pressable:'Pressable', ScrollView:'ScrollView', ActivityIndicator:'Spinner', TextInput:'Input', Platform:{OS:'android'}, StyleSheet:{create:value=>value}, Modal:({visible,children})=>visible?React.createElement('Modal',null,children):null };
const baseMocks = {'@/lib/api/client':{ApiError:class extends Error{}},'react-native':native,'@expo/vector-icons':{Ionicons:'Icon'},'expo-linear-gradient':{LinearGradient:'Gradient'},'react-native-safe-area-context':{useSafeAreaInsets:()=>({top:0,bottom:0})}};
const textOf = tree => JSON.stringify(tree.toJSON());
const press = async (tree,label) => { const control=tree.root.findAll(node=>node.type==='Pressable' && (node.props.accessibilityLabel===label || node.findAll(child => child.type === 'Text').some(child => child.children.join('') === label)))[0]; assert.ok(control,label); await act(async()=>control.props.onPress()); };

test('task cards use saved service, complete address and exact posted date without inferring remote from missing data',()=>{
 const p=load('lib/task-presentation.ts');
 const task={mainCategory:{displayName:'Campus Tasks'},subCategory:{displayName:'Printing'},location:{address:'Main gate',city:'Ibadan',state:'Oyo'}};
 assert.equal(p.taskCategoryLabel(task),'Printing'); assert.equal(p.taskLocationLabel(task),'Main gate, Ibadan, Oyo');
 assert.equal(p.taskLocationLabel({mainCategory:{name:'local_services'}}),'Location not provided');
 assert.equal(p.taskLocationLabel({mainCategory:{name:'digital_remote'}}),'Remote');
 assert.equal(p.taskCategoryLabel({mainCategory:'012345678901234567890123'}),'Category not provided');
 assert.match(p.taskPostedDate('2026-08-21T12:00:00Z'),/21 Aug 2026/);
 assert.equal(p.taskPostedDate('broken'),'Posting date unavailable');
 assert.equal(p.taskLocationLabel({...task,location:{address:'Main gate, Ibadan',city:'Ibadan'}}),'Main gate, Ibadan');
});
test('email hints mask short and malformed values as well as normal addresses',()=>{
 const {maskEmail}=load('lib/mask-email.ts');
 for(const email of ['a@example.com','ab@example.com','someone@example.com','bad']) {assert.notEqual(maskEmail(email),email);assert.match(maskEmail(email),/\*\*\*/);}
});
test('OTP defaults to masked email, toggles, and remasks when the address changes',async()=>{
 let params={email:'someone@example.com'};
 const Otp=load('app/otp.tsx',{...baseMocks,'expo-router':{useLocalSearchParams:()=>params,useRouter:()=>({})},'expo-status-bar':{StatusBar:'Status'},'@/components/taskhub/captcha-notice':{CaptchaNotice:()=>null},'@/components/icons/arrow-left':{ArrowLeft:'Arrow'},'@/components/icons/headset':{Headset:'Help'},'@/lib/auth/auth-context':{useAuth:()=>({})},'@/lib/auth/auth-api':{},'@/lib/auth/pending-email-login':{},'@tanstack/react-query':{useMutation:()=>({isPending:false})}}).default;
 let tree; await act(async()=>{tree=create(React.createElement(Otp));});
 assert.ok(!textOf(tree).includes(params.email)); await press(tree,'Show email address'); assert.ok(textOf(tree).includes(params.email));
 await press(tree,'Hide email address'); assert.ok(!textOf(tree).includes(params.email));
 await press(tree,'Show email address'); params={email:'different@example.com'};await act(async()=>tree.update(React.createElement(Otp)));assert.ok(!textOf(tree).includes(params.email));
 await act(async()=>tree.unmount());
});
test('Android relies on Play availability, including an update already in progress, and rejects unknown status',async()=>{
 for(const status of [1,2,3,0]) {
  const {checkStoreUpdate}=load('lib/store-updates.android.ts',{'react-native-device-info':{default:{getVersion:()=> '1.0.9',getBundleId:()=> 'com.taskhub.connect'}},'sp-react-native-in-app-updates/src/InAppUpdates.android':{default:class{async checkNeedsUpdate(options){assert.equal(options.customVersionComparator('10','1.0.9'),1);return {other:{updateAvailability:status}};}}}});
  if(status===0) await assert.rejects(checkStoreUpdate());else {const result=await checkStoreUpdate();assert.equal(result.available,status!==1);assert.match(result.storeUrl,/id=com.taskhub.connect/);}
 }
});
test('iOS checks the exact bundle and store version, refuses missing listings and failed lookups',async()=>{
 const prior=globalThis.fetch;
 try {
  const {checkStoreUpdate}=load('lib/store-updates.ios.ts',{'react-native-device-info':{default:{getVersion:()=> '1.9.0',getBundleId:()=> 'com.amfsatech.taskhub'}}});
  for(const version of ['1.10.0','1.9.0','1.8.5']) {
   globalThis.fetch=async url=>{assert.match(url,/bundleId=com.amfsatech.taskhub/);return {ok:true,json:async()=>({results:[{bundleId:'com.amfsatech.taskhub',version,trackViewUrl:'https://apps.apple.com/ng/app/id123'}]})};};
   assert.equal((await checkStoreUpdate()).available,version==='1.10.0');
  }
  globalThis.fetch=async()=>({ok:true,json:async()=>({results:[]})});await assert.rejects(checkStoreUpdate());
  globalThis.fetch=async()=>({ok:false});await assert.rejects(checkStoreUpdate());
 } finally {globalThis.fetch=prior;}
});
test('Settings update flow shows real loading/results, opens the returned store link and recovers from errors',async()=>{
 let resolve, reject, calls=0; const links=[];
 const {StoreUpdateCheck}=load('components/taskhub/store-update-check.tsx',{...baseMocks,'react-native':{...native,Linking:{openURL:async url=>links.push(url)}},'@/lib/store-updates':{storeName:'Play Store',checkStoreUpdate:()=>{calls++;return new Promise((yes,no)=>{resolve=yes;reject=no;});}}});
 let tree;await act(async()=>{tree=create(React.createElement(StoreUpdateCheck));});
 await press(tree,'Check for updates');assert.match(textOf(tree),/Checking for store updates/);
 await press(tree,'Check for updates');assert.equal(calls,1);
 await act(async()=>resolve({available:true,storeUrl:'https://play.google.com/store/apps/details?id=com.taskhub.connect'}));assert.match(textOf(tree),/New update available/);
 await press(tree,'Update from Store');assert.equal(links.length,1);
 await press(tree,'Close');await press(tree,'Check for updates');await act(async()=>resolve({available:false,storeUrl:'https://play.google.com'}));assert.match(textOf(tree),/up to date/);
 await press(tree,'Close');await press(tree,'Check for updates');await act(async()=>reject(new Error('offline')));assert.match(textOf(tree),/Unable to check/);
 await press(tree,'Try again');await press(tree,'Cancel');await act(async()=>resolve({available:true,storeUrl:'https://play.google.com'}));assert.ok(!textOf(tree).includes('New update available'));
 await act(async()=>tree.unmount());
});
