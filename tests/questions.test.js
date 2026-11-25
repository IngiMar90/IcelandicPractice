import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildQuestionBank,spellingPattern} from '../questions.js';
import {EXERCISES} from '../exercises.js';
const data=JSON.parse(readFileSync(new URL('../data.json',import.meta.url)));
test('all 36 banks have meaningful, unique answer choices and a correct answer',()=>{
  assert.deepEqual(EXERCISES.map(e=>e.id),data.ALL_EXERCISES);
  for(const exercise of data.ALL_EXERCISES)for(const level of data.LEVELS){
    const bank=buildQuestionBank(data,exercise,level);
    assert.equal(bank.length,30,`${exercise} ${level}`);
    for(const q of bank){assert.ok(q.subject&&q.prompt&&q.answer);assert.ok(q.choices.length>=2);assert.equal(q.choices.filter(c=>c===q.answer).length,1);assert.equal(new Set(q.choices).size,q.choices.length);assert.ok(q.choices.every(Boolean));}
  }
});
test('each word class is practised on every level',()=>{
  for(const level of data.LEVELS){const bank=buildQuestionBank(data,'orðflokkar',level);for(const type of ['nafnorð','sagnorð','lýsingarorð'])assert.equal(bank.filter(q=>q.answer===type).length,10);}
});
test('number and case are clear for nouns with multiple possible forms',()=>{
  for(const level of data.LEVELS){
    const number=buildQuestionBank(data,'tala',level);
    assert.ok(!number.some(q=>['hús','tré','skór','borð','blóm','verkefni','dæmi','sjónarmið','viðhorf'].includes(q.subject)));
    const cases=buildQuestionBank(data,'fall',level);
    assert.ok(cases.filter(q=>q.answer==='nefnifall').every(q=>q.subject.startsWith('hér er ')));
  }
});
test('spelling distractors never contain the empty string or the full unmasked word',()=>{
  assert.deepEqual(spellingPattern('hattur','tvöfaldur samhljóði').choices,['t','tt']);
  for(const category of data.SPELLING_EXERCISES)for(const level of data.LEVELS)for(const word of data.SPELLING_WORDS[category][level]){
    const p=spellingPattern(word,category,data.SPELLING_SINGLE_TARGETS?.[word]);assert.ok(p,word);assert.equal(p.pattern.replace('_',p.answer),word);assert.notEqual(p.pattern,word);
  }
});
test('known synonymous alternatives are not marked as wrong',()=>{
  for(let i=0;i<10;i++)for(const level of data.LEVELS)for(const q of buildQuestionBank(data,'samheiti',level)){
    assert.ok(!q.choices.includes(q.subject));
    for(const [a,b] of Object.values(data.VOCAB_SYNONYMS).flat())if(a===q.answer)assert.ok(!q.choices.includes(b),`${q.subject} has synonymous choices ${q.answer}, ${b}`);
  }
});

test('single and double consonants both occur on every level',()=>{
  for(const level of data.LEVELS){const bank=buildQuestionBank(data,'tvöfaldur samhljóði',level);assert.equal(bank.filter(q=>q.answer.length===1).length,15);assert.equal(bank.filter(q=>q.answer.length===2).length,15);}
});
