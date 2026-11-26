import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

test('push reminders open bids and refunds prefer the wallet over the related task', () => {
  const previous=process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;
  process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID='test-app';
  try {
    const routes=[],module={exports:{}};let click;
    const code=ts.transpileModule(readFileSync(new URL('../lib/push.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
    const mocks={'expo-router':{router:{push:value=>routes.push(value)}},'react-native':{},'react-native-onesignal':{OneSignal:{initialize(){},Notifications:{requestPermission(){},addEventListener(type,listener){click=listener;}}}}};
    new Function('require','module','exports',code)(name=>mocks[name],module,module.exports);
    module.exports.initPush();
    for(const data of [{type:'bid_selection_reminder',taskId:'task-1'},{action:'view_task_bids',taskId:'task-1'},{type:'bid_expired',taskId:'task-1',bidId:'bid-1'},{type:'escrow_refund',taskId:'task-1'},{action:'view_wallet',taskId:'task-1'}]) click({notification:{additionalData:data}});
    assert.deepEqual(routes,[{pathname:'/task-details',params:{id:'task-1',tab:'bids'}},{pathname:'/task-details',params:{id:'task-1',tab:'bids'}},{pathname:'/task-details',params:{id:'task-1'}},'/wallet','/wallet']);
  } finally {if(previous===undefined)delete process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;else process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID=previous;}
});
