import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
function load(file,mocks={}) {
  const module={exports:{}};
  const source=readFileSync(new URL('../'+file,import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  new Function('require','module','exports',code)(name=>name in mocks?mocks[name]:name.startsWith('@/lib/')?load(name.slice(2)+'.ts',mocks):require(name),module,module.exports);
  return module.exports;
}
const deadline=load('lib/task-deadline.ts');
test('Nigeria calendar deadlines close at the exact boundary across client timezones',()=>{
  const task={status:'open',deadline:'2026-11-21'};
  const at=Date.parse('2026-11-21T22:59:59.999Z');
  assert.equal(deadline.taskIsAvailable(task,at-1),true);
  assert.equal(deadline.taskIsAvailable(task,at),false);
  assert.equal(deadline.withTaskDeadline(task,at).status,'closed');
  assert.equal(task.status,'open','projection must not mutate server/cache data');
  assert.equal(deadline.taskIsAvailable({status:'open'}),true);
  assert.equal(deadline.taskIsAvailable({status:'open',deadline:'broken'}),false);
  for(const status of ['assigned','in-progress','awaiting-confirmation','completed']) assert.equal(deadline.withTaskDeadline({...task,status},at+1000).status,status);
});
test('reopening ends exactly 30 days after closure and timers use the earliest open deadline',()=>{
  const at=Date.parse('2026-11-21T22:59:59.999Z'),task={status:'closed',deadline:'2026-11-21'};
  assert.equal(deadline.canReopenTask(task,at+30*86400000-1),true);
  assert.equal(deadline.canReopenTask(task,at+30*86400000),false);
  assert.equal(deadline.canReopenTask({...task,status:'cancelled'},at+1),false);
  assert.equal(deadline.nextTaskExpiryDelay({pages:[{tasks:[{status:'open',deadline:new Date(at+1000).toISOString()},{status:'assigned',deadline:new Date(at+1).toISOString()}]}]},at),1010);
  assert.equal(deadline.nextTaskExpiryDelay([task],at),false);
  assert.equal(deadline.nextTaskExpiryDelay([{...task,status:'open'}],at+1),1000,'foreground resume must revisit an already elapsed deadline');
});
const native=!process.cwd().endsWith('task-hub-webapp');
function harness() {
  const state={task:{_id:'task-1',status:'open',deadline:new Date(Date.now()+86400000).toISOString()},calls:[]};
  const request=async(url,options={})=>{
    state.calls.push({url,...options});
    if(url.includes('payment-summary'))return{summary:{taskId:'task-1',canConfirm:true}};
    if(url==='/api/bids/offer-1')return{bid:{task:{_id:'task-1'}}};
    if(url.includes('/user/tasks'))return{tasks:[state.task],totalPages:1};
    if(url.includes('/feed')||url==='/api/tasks')return state.pagedFeed
      ? url.includes('cursor=next') ? {tasks:[{...state.task,_id:'fresh',deadline:new Date(Date.now()+86400000).toISOString()}],pagination:{hasNextPage:false}}
      : {tasks:[state.task],pagination:{hasNextPage:true,nextCursor:'next'}} : {tasks:[state.task]};
    return{task:state.task,bid:{_id:'offer-1'}};
  };
  const api={};for(const method of ['get','post','put','patch','delete'])api[method]=(url,body)=>request(url,{method:method.toUpperCase(),body});
  const tasksModule=load('lib/api/tasks.ts',{'@/lib/task-deadline':deadline,'./client':{api},'@/lib/api':{apiData:request}});
  const tasks=native?tasksModule:tasksModule.tasksApi;
  const bidsModule=load('lib/api/bids.ts',{'@/lib/task-deadline':deadline,'./client':{api},'./tasks':tasks,'@/lib/api/tasks':{tasksApi:tasks},'@/lib/api':{apiData:request}});
  return{state,tasks,bids:native?bidsModule:bidsModule.bidsApi};
}
test('expired legacy Open tasks disappear from discovery and cannot trigger hiring or bids',async()=>{
  const {state,tasks,bids}=harness();
  state.task.deadline=new Date(Date.now()-1000).toISOString();
  assert.equal((await tasks.getTaskerFeed()).tasks.length,0);
  const detail=native?(await tasks.getTaskById('task-1')).task:await tasks.getTask('task-1');
  assert.equal(detail.status,'closed');
  assert.equal(detail.serverStatus,'open');
  const actions=[()=>tasks.updateTask('task-1',{deadline:null}),()=>bids.createBid({taskId:'task-1',message:'Ready'}),()=>native?bids.sendHireRequest({taskId:'task-1'}):bids.sendHireRequest('task-1','tasker-1'),()=>bids.acceptBid('offer-1'),()=>native?bids.respondToHireRequest('offer-1','accept'):bids.acceptInvitation('offer-1')];
  for(const action of actions)await assert.rejects(action,/closed/);
  assert.equal(state.calls.filter(call=>call.method==='POST').length,0);
  const summary=native?(await bids.getBidPaymentSummary('offer-1')).summary:await bids.getPaymentSummary('offer-1');
  assert.equal(summary.canConfirm,false);
  const closed=native?(await tasks.getUserTasks({status:'closed'})).tasks:await tasks.getUserTasks({status:'closed'});
  assert.equal(closed.length,1);assert.equal(closed[0].status,'closed');
  const open=native?(await tasks.getUserTasks({status:'open'})).tasks:await tasks.getUserTasks({status:'open'});
  assert.equal(open.length,0);
});
test('current tasks permit a single mutation, and reopening legacy escrow does not charge it again',async()=>{
  const {state,tasks,bids}=harness();
  await bids.acceptBid('offer-1');
  assert.equal(state.calls.filter(call=>call.method==='POST').length,1);
  state.calls=[];state.task.deadline=new Date(Date.now()-1000).toISOString();
  await tasks.reopenTask('task-1');
  assert.equal(state.calls.filter(call=>call.method==='POST').length,0);
  assert.equal(state.calls.at(-1).method,'PUT');
  state.task.deadline=new Date(Date.now()-31*86400000).toISOString();state.calls=[];
  await assert.rejects(()=>tasks.reopenTask('task-1'),/30-day/);
  assert.equal(state.calls.length,1,'expired grace period only reads task status');
});

test('an expired-only page does not conceal available jobs on later pages',async()=>{
 const {state,tasks}=harness();state.task.deadline=new Date(Date.now()-1000).toISOString();state.pagedFeed=true;
 const feed=await tasks.getTaskerFeed();assert.deepEqual(feed.tasks.map(task=>task._id),['fresh']);assert.equal(state.calls.length,2);
});


test('server-open tasks retain the choice window without accepting new bids', async () => {
  const {state,tasks,bids}=harness();
  state.task={...state.task,deadline:new Date(Date.now()-1000).toISOString(),biddingClosed:true,bidSelectionEndsAt:new Date(Date.now()+48*3600000).toISOString()};
  const detail=native?(await tasks.getTaskById('task-1')).task:await tasks.getTask('task-1');
  assert.equal(detail.status,'open');
  assert.equal(deadline.taskIsAvailable(detail),false);
  assert.equal(deadline.canSelectOffer(detail),true);
  assert.match(deadline.biddingNotice(detail,true),/Choose an offer by .*Nigeria time/);
  assert.equal(deadline.biddingNotice(detail,false),'Bidding ended');
  assert.equal((await tasks.getTaskerFeed()).tasks.length,0);
  await bids.acceptBid('offer-1');
  assert.equal(state.calls.filter(call=>call.url.endsWith('/accept')&&call.method==='POST').length,1);
  await assert.rejects(()=>bids.createBid({taskId:'task-1',message:'Ready'}),/closed/);
  const summary=native?(await bids.getBidPaymentSummary('offer-1')).summary:await bids.getPaymentSummary('offer-1');
  assert.equal(summary.canConfirm,true);
  state.task.bidSelectionEndsAt=new Date(Date.now()-1).toISOString();
  await assert.rejects(()=>bids.acceptBid('offer-1'),error=>error.data?.code==='BID_SELECTION_EXPIRED');
  assert.equal(deadline.canReopenTask(state.task),false,'only a server-closed task may be reopened');
  await assert.rejects(()=>tasks.reopenTask('task-1'),/Only closed tasks/);
});
test('create, edit and reopen send calendar dates without a timezone shift',async()=>{
  const {state,tasks}=harness();
  const chosen='2026-12-10';
  await tasks.createTask({title:'Task',deadline:chosen});
  let body=state.calls.at(-1).body;
  assert.equal((typeof body==='string'?JSON.parse(body):body).deadline,chosen);
  await tasks.updateTask('task-1',{deadline:chosen});
  body=state.calls.at(-1).body;
  assert.equal((typeof body==='string'?JSON.parse(body):body).deadline,chosen);
  state.task={...state.task,status:'closed',biddingClosed:true,deadline:new Date(Date.now()-1000).toISOString()};
  await tasks.reopenTask('task-1',chosen);
  const last=state.calls.at(-1);body=last.body;
  assert.equal(last.method,'POST');
  assert.match(last.url,/reopen$/);
  assert.equal((typeof body==='string'?JSON.parse(body):body).deadline,chosen);
  assert.equal(deadline.taskDeadlineDate('2026-12-10T22:59:59.999Z'),chosen);
});


test('deadline labels use the Nigeria calendar day rather than device-local midnight',()=>{
 assert.equal(deadline.taskDeadlineLabel('2026-11-26T22:59:59.999Z'),'26 Nov 2026');
 assert.equal(deadline.taskDeadlineLabel('2026-11-26'),'26 Nov 2026');
 assert.equal(deadline.taskDeadlineLabel(null),'No bidding deadline');
});
