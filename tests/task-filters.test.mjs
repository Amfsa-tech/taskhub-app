import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const root=path.resolve(import.meta.dirname,'..');
function load(file) {const module={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(name=>load(name.slice(2)+'.ts'),module,module.exports);return module.exports;}
const module={exports:load('lib/task-filters.ts')};
const {emptyTaskFilters,historyStatus,matchesTaskFilters,taskCategoryOptions,pendingType,dateRangeError}=module.exports;
const a={_id:'a',status:'completed',createdAt:'2026-11-20T23:00:00Z',mainCategory:{_id:'campus',displayName:'Campus Tasks'}};
const b={_id:'b',status:'closed',createdAt:'2026-11-23T12:00:00Z',mainCategory:{_id:'remote',displayName:'Remote Tasks'}};
test('history combines status OR choices with category AND inclusive Nigeria calendar dates',()=>{
 const f={...emptyTaskFilters(),statuses:['completed','closed'],categories:['campus'],from:'2026-11-21',to:'2026-11-21'};
 assert.equal(matchesTaskFilters(a,f),true);assert.equal(matchesTaskFilters(b,f),false);
 assert.equal(matchesTaskFilters({...a,createdAt:'2026-11-21T23:00:00Z'},f),false);
 assert.equal(matchesTaskFilters({...a,createdAt:'2026-11-21T22:59:59Z'},f),true);
 assert.equal(matchesTaskFilters({...a,createdAt:undefined},f),false);
 assert.equal(matchesTaskFilters({...a,createdAt:'broken'},f),false);
 assert.equal(matchesTaskFilters(a,emptyTaskFilters()),true);
 assert.ok(dateRangeError({...f,from:'2026-11-22',to:'2026-11-21'}));
});
test('rejected offers never look completed; expired offers remain closed and submitted work stays current',()=>{
 assert.equal(historyStatus({status:'rejected',bidType:'custom',task:a}),'not-selected');
 assert.equal(historyStatus({status:'pending',bidType:'invitation',task:b}),'closed');
 assert.equal(historyStatus({status:'accepted',bidType:'custom',task:a}),'completed');
 assert.equal(historyStatus({...a,status:'awaiting-confirmation'}),null);
 assert.equal(historyStatus({...a,status:'assigned'}),null);
 assert.equal(historyStatus({status:'pending',bidType:'custom',task:{status:'open',deadline:'2026-11-21'}},Date.parse('2026-11-21T23:00:00Z')),'closed');
 assert.equal(historyStatus({status:'pending',task:{...a,status:'assigned'}}),'not-selected');
});
test('pending type and category options use actual records, never raw category IDs',()=>{
 assert.equal(pendingType({invitedByUser:true}),'invitation');assert.equal(pendingType({bidType:'invite'}),'invitation');assert.equal(pendingType({bidType:'fixed'}),'bid');
 assert.equal(matchesTaskFilters({status:'pending',bidType:'fixed',task:a},{...emptyTaskFilters(),types:['invitation']}),false);
 assert.deepEqual(taskCategoryOptions([a,a,b,{mainCategory:'012345678901234567890123'}]).map(x=>x.label),['Campus Tasks','Remote Tasks']);
});


test('new deadline fields keep waiting offers current and label selection expiry separately',()=>{
 const task={status:'open',deadline:'2026-11-21',biddingClosed:true,bidSelectionEndsAt:'2026-11-24T12:00:00Z'};
 assert.equal(historyStatus(task,Date.parse('2026-11-23')),null);
 assert.equal(historyStatus({status:'pending',task},Date.parse('2026-11-23')),null);
 assert.equal(historyStatus({status:'rejected',closedReason:'bid_selection_expired',task}),'expired');
 assert.equal(historyStatus({status:'rejected',task}),'not-selected');
});
