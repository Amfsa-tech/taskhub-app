import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url),root=path.resolve(import.meta.dirname,'..');
function load(file,mocks) {const module={exports:{}};const code=ts.transpileModule(readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;new Function('require','module','exports',code)(name=>{if(name in mocks)return mocks[name];if(name.startsWith('@/')){const target=['.ts','.tsx'].map(ext=>name.slice(2)+ext).find(candidate=>existsSync(path.join(root,candidate)));return load(target,mocks);}return require(name);},module,module.exports);return module.exports;}
test('own-bid history retains closed offers and later pages while pending lists exclude expired work',async()=>{
 const calls=[];
 const closed={_id:'expired-task',status:'open',deadline:'2020-01-01',title:'Closed historical offer'};
 const finished={_id:'finished-task',status:'completed',title:'Other completed task'};
 const open={_id:'open-task',status:'open',title:'Available work'};
 const records=[{_id:'closed-bid',status:'pending',bidType:'custom',task:closed},{_id:'lost-bid',status:'rejected',bidType:'custom',task:finished},{_id:'open-bid',status:'pending',bidType:'custom',task:open}];
 const request=async url=>{calls.push(url);const query=new URL(url,'https://example.invalid').searchParams;const rows=query.get('status')?records.filter(bid=>bid.status===query.get('status')):records;return {bids:(query.get('page')==='2'?rows.slice(1):rows.slice(0,1)).map(bid=>({...bid})),totalPages:2};};
 const getTask=async id=>{if(id===closed._id)throw new Error('Historical task is no longer public');return {...(id===open._id?open:finished),mainCategory:{_id:'remote',displayName:'Remote Tasks'}};};
 const api=load('lib/api/bids.ts',{'./client':{api:{get:request}},'./tasks':{getTaskById:async id=>({task:await getTask(id)})}});const fetchHistory=async()=> (await api.getTaskerBids()).bids;const fetchPending=async()=> (await api.getTaskerBids({status:'pending'})).bids;
 const history=await fetchHistory();assert.equal(history.length,3);assert.equal(calls.some(url=>url.includes('page=2')),true);
 const {historyStatus}=load('lib/task-filters.ts',{});assert.equal(historyStatus(history.find(bid=>bid._id==='closed-bid')),'closed');assert.equal(historyStatus(history.find(bid=>bid._id==='lost-bid')),'not-selected');
 const pending=await fetchPending();assert.deepEqual(pending.map(bid=>bid._id),['open-bid']);assert.equal(calls.some(url=>new URL(url,'https://example.invalid').searchParams.get('status')==='pending'),true);
});
