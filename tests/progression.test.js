import test from 'node:test';
import assert from 'node:assert/strict';
import {STAGES,ROUND_LENGTH,createProgress,taskProgress,stageComplete,unlockedStage,recordMistake,recordResult} from '../progression.js';
import {EXERCISES} from '../exercises.js';
const finish=(p,id,correct=10,extra={})=>recordResult(p,id,{correct,total:ROUND_LENGTH,bankLevel:STAGES.find(s=>s.exercises.includes(id)).bankLevel,...extra});
function masterStage(p,stage){for(const id of stage.exercises)for(let i=0;i<3;i++)finish(p,id);}
test('all 12 exercises belong to exactly one ordered stage',()=>{
 const ids=STAGES.flatMap(s=>s.exercises);assert.equal(ids.length,12);assert.equal(new Set(ids).size,12);assert.deepEqual(new Set(ids),new Set(EXERCISES.map(e=>e.id)));
});
test('only stage 1 opens initially and locked results cannot unlock later work',()=>{
 const p=createProgress();assert.equal(unlockedStage(p),1);for(const s of STAGES.slice(1))for(const id of s.exercises){assert.equal(finish(p,id).counted,false);assert.equal(recordMistake(p,id),false);}assert.deepEqual(p.tasks,{});
});
test('three perfect results must be consecutive within the same exercise',()=>{
 const p=createProgress();finish(p,'andheiti');finish(p,'andheiti');finish(p,'samheiti');
 assert.equal(taskProgress(p,'andheiti').streak,2);finish(p,'andheiti',9);assert.equal(taskProgress(p,'andheiti').streak,0);assert.equal(taskProgress(p,'samheiti').streak,1);
 finish(p,'andheiti');finish(p,'andheiti');assert.equal(taskProgress(p,'andheiti').mastered,false);assert.equal(finish(p,'andheiti').newlyMastered,true);
 assert.deepEqual(taskProgress(p,'andheiti'),{streak:3,mastered:true});assert.equal(unlockedStage(p),1);
});
test('a mistake resets immediately and stays reset after closing and reloading',()=>{
 const p=createProgress();finish(p,'andheiti');finish(p,'andheiti');finish(p,'samheiti');recordMistake(p,'andheiti');
 const restored=JSON.parse(JSON.stringify(p));assert.equal(taskProgress(restored,'andheiti').streak,0);assert.equal(taskProgress(restored,'samheiti').streak,1);
});
test('short, incomplete, invalid, and wrong-difficulty attempts do not count',()=>{
 const p=createProgress();for(const extra of [{total:5,correct:5},{completed:false},{bankLevel:'Erfitt'},{correct:11},{correct:9.5},{total:0,correct:0}])assert.equal(finish(p,'andheiti',10,extra).counted,false);
 assert.deepEqual(p.tasks,{});
});
test('next stage requires every previous task, and earned stages stay open',()=>{
 const p=createProgress();const first=STAGES[0];for(const id of first.exercises.slice(0,-1))for(let i=0;i<3;i++)finish(p,id);
 assert.equal(unlockedStage(p),1);const final=first.exercises.at(-1);finish(p,final);finish(p,final);assert.equal(unlockedStage(p),1);assert.equal(finish(p,final).newlyUnlocked,true);assert.equal(unlockedStage(p),2);
 recordMistake(p,first.exercises[0]);finish(p,first.exercises[0],0);assert.equal(unlockedStage(p),2);assert.equal(stageComplete(p,first),true);
 masterStage(p,STAGES[1]);assert.equal(unlockedStage(p),3);masterStage(p,STAGES[2]);assert.ok(STAGES.every(s=>stageComplete(p,s)));
});
test('student progress records are independent and JSON-safe',()=>{
 const alice=createProgress(),bob=createProgress();masterStage(alice,STAGES[0]);assert.equal(unlockedStage(bob),1);assert.equal(unlockedStage(JSON.parse(JSON.stringify(alice))),2);
});
