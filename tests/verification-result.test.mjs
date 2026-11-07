import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const module={exports:{}};
new Function('module','exports',ts.transpileModule(readFileSync(new URL('../lib/verification-result.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(module,module.exports);
const {pollVerificationResult}=module.exports;
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
for(const terminal of ['approved','rejected','under_review'])test(`pending and in_progress continue until backend ${terminal}, then stop`,async t=>{
  t.mock.timers.enable({apis:['setTimeout','Date'],now:0});
  const statuses=['pending','in_progress',terminal],updates=[],settled=[];let count=0;
  pollVerificationResult({fetchStatus:async()=>({status:statuses[count++],isVerified:terminal==='approved'&&count===3}),onStatus:s=>updates.push(s.status),onSettled:s=>settled.push(s)});
  await flush();assert.deepEqual(updates,['pending']);
  t.mock.timers.tick(3999);await flush();assert.equal(count,1);
  t.mock.timers.tick(1);await flush();assert.equal(count,2);
  t.mock.timers.tick(4000);await flush();assert.equal(settled[0].status,terminal);
  t.mock.timers.tick(180000);await flush();assert.equal(count,3);assert.equal(settled.length,1);
});
test('network failure yields processing without inventing a decision',async t=>{
  t.mock.timers.enable({apis:['setTimeout','Date'],now:0});const updates=[],settled=[];let calls=0;
  pollVerificationResult({fetchStatus:async()=>{calls++;throw Error('offline')},onStatus:s=>updates.push(s),onSettled:s=>settled.push(s)});
  await flush();t.mock.timers.tick(180000);await flush();
  assert.deepEqual(updates,[]);assert.deepEqual(settled,[null]);assert.equal(calls,1);
});
test('90-second deadline aborts a hung request and ignores its late approval',async t=>{
  t.mock.timers.enable({apis:['setTimeout','Date'],now:0});let resolve,signal;const updates=[],settled=[];
  pollVerificationResult({fetchStatus:s=>{signal=s;return new Promise(r=>resolve=r)},onStatus:s=>updates.push(s),onSettled:s=>settled.push(s)});
  t.mock.timers.tick(89999);await flush();assert.deepEqual(settled,[]);
  t.mock.timers.tick(1);await flush();assert.equal(signal.aborted,true);assert.deepEqual(settled,[null]);
  resolve({status:'approved',isVerified:true});await flush();assert.deepEqual(updates,[]);assert.deepEqual(settled,[null]);
});
test('unmount cancellation stops requests, timers and result callbacks',async t=>{
  t.mock.timers.enable({apis:['setTimeout','Date'],now:0});let resolve,signal;const settled=[];
  const cancel=pollVerificationResult({fetchStatus:s=>{signal=s;return new Promise(r=>resolve=r)},onStatus:()=>assert.fail('late status'),onSettled:s=>settled.push(s)});
  cancel();assert.equal(signal.aborted,true);resolve({status:'approved',isVerified:true});await flush();
  t.mock.timers.tick(180000);await flush();assert.deepEqual(settled,[]);
});
