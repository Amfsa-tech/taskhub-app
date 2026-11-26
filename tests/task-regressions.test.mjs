import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url),root=path.resolve(import.meta.dirname,'..');
function load(file,mocks={}){
 const module={exports:{}}; const code=ts.transpileModule(readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
 new Function('require','module','exports',code)(name=>{
  if(name in mocks)return mocks[name];
  if(name.startsWith('@/')){const base=name.slice(2);const file=['.ts','.tsx'].map(ext=>base+ext).find(file=>existsSync(path.join(root,file)));return load(file,mocks);}
  return require(name);
 },module,module.exports);return module.exports;
}
const life=load('lib/task-lifecycle.ts'),{isUrgent}=load('lib/task-urgency.ts'),{taskerShareContent}=load('lib/tasker-share.ts');
test('a single current invitation survives duplicate endpoints, confirmed consent never becomes another Accept action',()=>{
 const task={_id:'task-1',status:'open'};
 const original={_id:'bid-1',task,status:'pending',invitedByUser:true,taskerConfirmed:false};
 const confirmed={...original,taskerConfirmed:true};
 const current=life.uniqueTaskerOffers([original,confirmed,{...original,_id:'legacy-duplicate'}]);
 assert.equal(current.length,1);assert.equal(current[0].taskerConfirmed,true);assert.equal(life.invitationNeedsResponse(current[0]),false);
 const patched=life.confirmHireInData({bids:[original,{...original,_id:'legacy-duplicate'}]},'bid-1','task-1');
 assert.equal(patched.bids.every(bid=>bid.taskerConfirmed),true);
 assert.equal(original.taskerConfirmed,false,'cached source remains immutable');
 for(const status of ['assigned','in-progress','awaiting-confirmation','completed','closed','cancelled'])assert.equal(life.invitationNeedsResponse({...original,task:{...task,status}}),false,status);
});
test('acceptance and escrow stay reached when work starts and submitted work remains active until approval',()=>{
 for(const status of ['assigned','in-progress','awaiting-confirmation','completed']){
  const stages=life.taskMilestones({status});assert.equal(stages.accepted,true,status);assert.equal(stages.secured,true,status);
 }
 assert.equal(life.taskMilestones({status:'assigned'}).started,false);
 assert.equal(life.taskMilestones({status:'awaiting-confirmation'}).submitted,true);
 assert.equal(life.taskMilestones({status:'awaiting-confirmation'}).completed,false);
 assert.equal(life.taskMilestones({status:'completed'}).completed,true);
});
test('urgent means explicit urgent tag or an open deadline within 72 hours, never expired or completed',()=>{
 const now=Date.parse('2026-11-25T12:00:00Z');const task=hours=>({status:'open',deadline:new Date(now+hours*3600000).toISOString()});
 assert.equal(isUrgent(task(72),now),true);assert.equal(isUrgent(task(72.001),now),false);assert.equal(isUrgent(task(60),now),true);
 assert.equal(isUrgent(task(-1),now),false);assert.equal(isUrgent({...task(1),status:'completed',tags:['urgent']},now),false);
 assert.equal(isUrgent({status:'open',tags:['Urgent']},now),true);assert.equal(isUrgent({...task(-1),tags:['urgent']},now),false);
 assert.equal(isUrgent({status:'open',deadline:'2026-11-28'},now),false,'date-only means the end of that day in Nigeria');
});
test('profile sharing describes real services, omits raw IDs and em dashes from copy, and includes a direct link',()=>{
 const id='507f1f77bcf86cd799439011';const data=taskerShareContent({firstName:'Ada',lastName:'Okafor',subCategories:[{displayName:'Content writing'},{name:id}]},id);
 assert.match(data.title,/Hire Ada Okafor/);assert.match(data.text,/Content writing/);assert.doesNotMatch(data.text,/(View .*on TaskHub|tasker ID|507f1f77|\u2014)/i);assert.match(data.url,/\/taskers\/507f1f77bcf86cd799439011$/);
 assert.match(taskerShareContent({firstName:'Ada',subCategories:[],services:['Editing']},id).text,/Editing/);
 assert.doesNotMatch(taskerShareContent({fullName:id,services:[id]},id).title,/507f1f77/);
});
test('nudge sends one real chat reminder, reports failure, and never fabricates success or changes task status',async()=>{
 const calls=[];const state={task:{_id:'task-1',status:'assigned',title:'Write content'},fail:false};
 const native=path.basename(root)==='taskhub-app';
 const getTask=async()=>native?{task:state.task}:state.task;
 const create=async data=>{calls.push(['conversation',data]);return native?{conversation:{_id:'chat-1'}}:{_id:'chat-1'};};
 const send=async(id,text)=>{calls.push(['message',id,typeof text==='string'?text:text.get('text')]);if(state.fail)throw Error('Please slow down');};
 const mocks={
  './tasks':native?{getTaskById:getTask}:{tasksApi:{getTask}},
  './bids':native?{getTaskerBids:async()=>({bids:[{_id:'bid-1',task:state.task,status:'pending',taskerConfirmed:true}]})}:{bidsApi:{getMyBids:async()=>[{_id:'bid-1',task:state.task,status:'pending',taskerConfirmed:true}]}},
  './chat':native?{createOrGetConversation:create,sendMessage:send}:{chatApi:{createConversation:create,sendMessage:send}},
 };
 const {nudgeCustomer}=load('lib/api/task-nudge.ts',mocks);
 await nudgeCustomer('task-1');assert.equal(calls.length,2);assert.match(calls[1][2],/ready to start/);assert.equal(state.task.status,'assigned');
 state.task.status='awaiting-confirmation';await nudgeCustomer('task-1');assert.match(calls.at(-1)[2],/review it and confirm completion/);
 state.fail=true;await assert.rejects(()=>nudgeCustomer('task-1'),/Please slow down/);
 state.task.status='closed';const before=calls.length;await assert.rejects(()=>nudgeCustomer('task-1'),/no longer active/);assert.equal(calls.length,before);
});

test('quick shortcuts require real child services and resolve both string and populated parents',()=>{
 const {categoryShortcut}=load('lib/category-shortcuts.ts');
 const mains=['campus_tasks','local_services','errands_deliveries','remote_tasks'].map((name,i)=>({_id:String(i),name,displayName:name}));
 const categories=[...mains,...mains.filter(main=>main.name!=='errands_deliveries').map((main,i)=>({_id:'child-'+main._id,name:'Service',displayName:'Service',parentCategory:i%2?main._id:{_id:main._id}}))];
 assert.equal(categoryShortcut(categories,'campus')._id,'0');assert.equal(categoryShortcut(categories,'local')._id,'1');assert.equal(categoryShortcut(categories,'remote')._id,'3');assert.equal(categoryShortcut(categories,'errands'),undefined);
 categories.push({_id:'delivery-service',name:'Delivery',displayName:'Delivery',parentCategory:'2'});assert.equal(categoryShortcut(categories,'errands')._id,'2');
});
test('native timeline checks acceptance and payment even when optional event timestamps are absent',()=>{
 const {buildTimeline}=load('lib/task-timeline.ts');
 for(const status of ['assigned','in-progress','awaiting-confirmation','completed']){
  const timeline=buildTimeline({status,createdAt:'2026-11-25T12:00:00Z'});
  assert.equal(timeline.find(row=>row.title==='Tasker hired').status,'checked');assert.equal(timeline.find(row=>row.title==='Payment secured').status,'checked');
 }
});

test('history pagination retains older submitted work rather than depending on notifications or a recent-post limit',async()=>{
 const native=path.basename(root)==='taskhub-app';const calls=[];
 const request=async(url)=>{calls.push(url);const parsed=new URL(url,'https://example.invalid'),status=parsed.searchParams.get('status')||'awaiting-confirmation',page=Number(parsed.searchParams.get('page')||1);return{tasks:[{_id:`${status}-${page}`,status,title:page===2?'Older submitted work':'Recent work'}],totalPages:2,currentPage:page};};
 const module=load('lib/api/tasks.ts',{'./client':{api:{get:request}},'@/lib/api':{apiData:request}});
 const tasks=native?(await module.getUserTasks({status:'awaiting-confirmation'})).tasks:await module.tasksApi.getUserTasks({status:'in-progress'});
 assert.ok(tasks.some(task=>task.title==='Older submitted work'&&task.status==='awaiting-confirmation'));
 assert.ok(calls.some(url=>new URL(url,'https://example.invalid').searchParams.get('page')==='2'));
 assert.equal(tasks.some(task=>task.status==='open'),false);
});

test('in-progress cache transitions merge the same task into one current review card',()=>{
 const source=readFileSync(path.join(root,'lib/api/queries.ts'),'utf8');const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const module={exports:{}};
 new Function('require','module','exports',code)(name=>name==='@tanstack/react-query'?{useQueries:()=>[{data:{tasks:[{_id:'task-1',status:'assigned'}]}},{data:{tasks:[]}},{data:{tasks:[{_id:'task-1',status:'awaiting-confirmation'}]}}]}:{},module,module.exports);
 const {tasks}=module.exports.useUserTasksByStatuses(['assigned','in-progress','awaiting-confirmation']);assert.equal(tasks.length,1);assert.equal(tasks[0].status,'awaiting-confirmation');
});
