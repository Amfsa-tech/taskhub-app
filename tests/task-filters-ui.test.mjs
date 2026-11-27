import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {act,create} from 'react-test-renderer';
const require=createRequire(import.meta.url),root=path.resolve(import.meta.dirname,'..');
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
function load(file,mocks={},cache=new Map()) {
 if(cache.has(file))return cache.get(file);const module={exports:{}};
 const code=ts.transpileModule(readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
 new Function('require','module','exports',code)(name=>{
  if(name in mocks)return mocks[name];if(/\.(svg|png)$/.test(name))return {__esModule:true,default:'Icon'};
  if(name.startsWith('@/')){const target=['.ts','.tsx'].map(ext=>name.slice(2)+ext).find(candidate=>existsSync(path.join(root,candidate)));return load(target,mocks,cache);}return require(name);
 },module,module.exports);cache.set(file,module.exports);return module.exports;
}
const native={View:'View',Text:'Text',Pressable:'Pressable',ScrollView:'ScrollView',TextInput:'TextInput',ActivityIndicator:'Spinner',RefreshControl:'Refresh',Platform:{OS:'android'},Keyboard:{dismiss(){}},StyleSheet:{create:x=>x},Dimensions:{get:()=>({width:390})},Alert:{alert(){}},Modal:({visible,children})=>visible?React.createElement('Modal',null,children):null,FlatList:({data,renderItem,ListEmptyComponent,ListHeaderComponent})=>React.createElement('List',null,ListHeaderComponent,data.length?data.map((item,index)=>React.createElement(React.Fragment,{key:index},renderItem({item,index}))):ListEmptyComponent)};
const base={'react-native':native,'@expo/vector-icons':{Ionicons:'Icon',MaterialCommunityIcons:'Icon'},'react-native-safe-area-context':{useSafeAreaInsets:()=>({top:0,bottom:0})},'@react-native-community/datetimepicker':{__esModule:true,default:'DatePicker'},'expo-status-bar':{StatusBar:'StatusBar'},'expo-image':{Image:'Image'}};
const textOf=tree=>tree.root.findAll(node=>node.type==='Text').map(node=>node.children.filter(child=>typeof child==='string').join('')).join('\n');
const control=(tree,label)=>tree.root.findAll(node=>node.type==='Pressable'&&(node.props.accessibilityLabel===label||node.findAll(child=>child.type==='Text').some(child=>child.children.join('')===label)))[0];
const press=async(tree,label)=>{const node=control(tree,label);assert.ok(node,label);await act(async()=>node.props.onPress());};
test('native filters apply drafts explicitly, cancel unsaved choices, retain applied choices and clear them',async()=>{
 const {TaskFilters}=load('components/taskhub/task-filters.tsx',base);const {emptyTaskFilters}=load('lib/task-filters.ts');let value;
 function Fixture(){const [filters,set]=React.useState(emptyTaskFilters);value=filters;return React.createElement(TaskFilters,{value:filters,onChange:set,statuses:[{value:'completed',label:'Completed'},{value:'closed',label:'Closed'}]});}
 let tree;await act(async()=>{tree=create(React.createElement(Fixture));});
 await press(tree,'Status');await press(tree,'Completed');assert.deepEqual(value.statuses,[]);
 await press(tree,'Close filters');await press(tree,'Status');assert.equal(control(tree,'Completed').props.accessibilityState.checked,false);
 await press(tree,'Completed');await press(tree,'Closed');await press(tree,'Apply filters');assert.deepEqual(value.statuses,['completed','closed']);
 await press(tree,'Status, 2 selected');assert.equal(control(tree,'Completed').props.accessibilityState.checked,true);
 await press(tree,'Reset selection');await press(tree,'Close filters');assert.deepEqual(value.statuses,['completed','closed']);
 await press(tree,'Date range');await press(tree,'Start date');await act(async()=>tree.root.findByType('DatePicker').props.onChange({type:'set'},new Date('2026-11-25T12:00:00')));
 await press(tree,'End date');await act(async()=>tree.root.findByType('DatePicker').props.onChange({type:'set'},new Date('2026-11-21T12:00:00')));
 assert.equal(control(tree,'Apply filters').props.disabled,true);assert.match(textOf(tree),/end date must be on or after/);await press(tree,'Close filters');
 await press(tree,'Clear filters');assert.deepEqual(value,emptyTaskFilters());await act(async()=>tree.unmount());
});
test('native customer pages expose two current tabs and keep completed/closed/cancelled records in history',async()=>{
 let role='user';const routes=[];
 const records=[{_id:'open',title:'Current request',status:'open'},{_id:'work',title:'Awaiting review',status:'awaiting-confirmation'},{_id:'done',title:'Finished request',status:'completed'},{_id:'closed',title:'Expired request',status:'closed'},{_id:'cancelled',title:'Cancelled request',status:'cancelled'}].map(task=>({...task,budget:1000,createdAt:'2026-11-24T12:00:00Z'}));
 const query=tasks=>({data:{tasks},isLoading:false,isError:false,isRefetching:false,refetch:async()=>{}});
 const card=({task})=>React.createElement('Text',null,task.title);
 const mocks={...base,'expo-router':{useRouter:()=>({push:value=>routes.push(value),replace:value=>routes.push(value),back(){},canGoBack:()=>true})},'@/lib/auth/auth-context':{useAuth:()=>({accountType:role})},'@/hooks/use-new-post':{useNewPost:()=>()=>{}},'@tanstack/react-query':{useQueryClient:()=>({invalidateQueries(){}}),useMutation:()=>({isPending:false})},'@/components/taskhub/hire-again-modal':{HireAgainModal:()=>null},'@/components/taskhub/rate-tasker-modal':{RateTaskerModal:()=>null},'@/components/taskhub/task-card':{TaskCard:card,InProgressTaskCard:card,CompletedTaskCard:card},'@/lib/api/task-nudge':{},'@/lib/api/chat':{},'@/lib/api/bids':{},'@/lib/api/tasks':{formatNaira:v=>String(v),formatRelativeTime:()=>'',formatShortDate:()=>'',formatLongDate:()=>'',taskToCard:t=>t,taskToInProgressCard:t=>t,taskToCompletedCard:t=>({...t,tasker:{name:'Recorded tasker'}})},'@/lib/api/queries':{queryKeys:{},useUserTasks:params=>query(records.filter(task=>task.status===params.status)),useUserTasksByStatuses:()=>({...query([]),tasks:records.filter(task=>task._id==='work')}),useTaskerTasks:()=>query(records.filter(task=>task._id==='work'||task._id==='done')),useTaskerBids:()=>({data:{bids:[{_id:'offer',status:'pending',bidType:'custom',amount:1000,task:records[0]}]}})}};
 const Screen=load('components/taskhub/tasks-screen.tsx',mocks).default;let tree;
 await act(async()=>{tree=create(React.createElement(Screen));});assert.deepEqual(tree.root.findAll(node=>node.props.accessibilityRole==='tab').map(node=>node.findByType('Text').children.join('')),['Posted','In progress']);assert.ok(!textOf(tree).includes('Finished request'));await press(tree,'Task history');assert.equal(routes.at(-1),'/task-history');await act(async()=>tree.unmount());
 await act(async()=>{tree=create(React.createElement(Screen,{history:true}));});assert.match(textOf(tree),/Finished request/);assert.match(textOf(tree),/Expired request/);assert.match(textOf(tree),/Cancelled request/);assert.ok(!textOf(tree).includes('Awaiting review'));assert.equal(tree.root.findAll(node=>node.props.accessibilityRole==='tab').length,0);await act(async()=>tree.unmount());
 role='tasker';await act(async()=>{tree=create(React.createElement(Screen));});assert.match(textOf(tree),/Pending/);assert.ok(!textOf(tree).includes('Awaiting review'));await press(tree,'In progress');assert.match(textOf(tree),/Awaiting review/);assert.ok(!textOf(tree).includes('Finished request'));await act(async()=>tree.unmount());
});
