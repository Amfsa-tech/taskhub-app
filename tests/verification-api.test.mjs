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


test('mobile KYC adapter uses the authenticated primary endpoint and rejects inconsistent verified flags',async()=>{
  let payload,endpoint;
  const {getKycStatus}=load('lib/api/kyc.ts',{'./client':{api:{get:async url=>{endpoint=url;return payload}}}});
  for(const status of ['pending','in_progress','under_review','rejected','approved']){
    payload={status:'success',data:{status,isVerified:true,message:'Backend explanation',resubmissionAllowed:false}};
    const result=await getKycStatus();assert.equal(endpoint,'/api/v1/kyc/verification-status');
    assert.equal(result.data.status,status);assert.equal(result.data.isVerified,status==='approved');assert.equal(result.data.message,payload.data.message);
  }
  payload={data:{status:'approved',isVerified:true,isDuplicate:true,decisionCode:'duplicate_identity'}};
  assert.equal((await getKycStatus()).data.isVerified,false);
  payload={status:'success',data:{isVerified:true}};
  await assert.rejects(()=>getKycStatus(),/status is unavailable/);
});
test('Tasker feature gates share the primary KYC query rather than trusting the legacy account flag',async()=>{
  let accountType='tasker',primaryCalls=0,legacyCalls=0;
  const code=ts.transpileModule(readFileSync(path.join(root,'lib/api/queries.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const module={exports:{}};
  new Function('require','module','exports',code)(name=>{
    if(name==='@tanstack/react-query')return{useQuery:options=>options};
    if(name==='@/lib/auth/auth-context')return{useAuth:()=>({accountType})};
    if(name==='./kyc')return{getKycStatus:async()=>{primaryCalls++;return{data:{status:'rejected',isVerified:false}}}};
    if(name==='@/lib/auth/auth-api')return{getVerificationStatus:async()=>{legacyCalls++;return{data:{isVerified:true}}}};
    return{};
  },module,module.exports);
  const {useVerificationStatus,queryKeys}=module.exports;
  let query=useVerificationStatus();
  assert.deepEqual(query.queryKey,queryKeys.kycStatus());assert.equal((await query.queryFn({})).data.isVerified,false);
  assert.equal(primaryCalls,1);assert.equal(legacyCalls,0);
  accountType='user';query=useVerificationStatus();assert.deepEqual(query.queryKey,queryKeys.verificationStatus());
  await query.queryFn({});assert.equal(legacyCalls,1);
  accountType=null;assert.equal(useVerificationStatus().enabled,false);
});
