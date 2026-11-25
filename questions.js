export function shuffle(items, rng=Math.random) {
  const result=[...items];
  for(let i=result.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
function question(prompt,subject,choices,answer,solution=answer,explanation='') {
  return {prompt,subject,choices:[...new Set(choices)],answer,solution,explanation,speech:`${prompt} ${subject}`};
}
export function spellingPattern(word,exercise,singleTarget) {
  const regex={'i/y':/[iíyý]/,'ei/ey':/ei|ey/,'ng/nk':/ng|nk/,'tvöfaldur samhljóði':/([bcdfghjklmnpqrstvxzþð])\1/}[exercise];
  const match=exercise==='tvöfaldur samhljóði'&&singleTarget ? Object.assign([singleTarget],{index:word.indexOf(singleTarget)}) : word.match(regex);
  if(!match) return null;
  const answer=match[0];
  const choices={'i/y':['i','í','y','ý'],'ei/ey':['ei','ey'],'ng/nk':['ng','nk'],'tvöfaldur samhljóði':[answer[0],answer[0].repeat(2)]}[exercise];
  return {pattern:word.slice(0,match.index)+'_'+word.slice(match.index+answer.length),answer,choices};
}
// Exclude known synonyms from the distractors, including synonyms in other levels.
function equivalentWords(word,data) {
  const related=new Set([word]);
  const pairs=Object.values(data.VOCAB_SYNONYMS).flat();
  let changed=true;
  while(changed){changed=false;for(const [a,b] of pairs){if(related.has(a)||related.has(b)){if(!related.has(a)||!related.has(b))changed=true;related.add(a);related.add(b);}}}
  return related;
}
function choicesFor(answer, pool, data, source='') {
  const excluded=equivalentWords(answer,data);excluded.add(source);
  return shuffle([answer,...shuffle([...new Set(pool)].filter(x=>!excluded.has(x))).slice(0,2)]);
}
export function buildQuestionBank(data,exercise,level) {
  if(data.SPELLING_EXERCISES.includes(exercise)) {
    return data.SPELLING_WORDS[exercise][level].flatMap(word=>{
      const part=spellingPattern(word,exercise,data.SPELLING_SINGLE_TARGETS?.[word]);if(!part)return [];
      const context=data.SPELLING_CONTEXTS?.[word];
      const subject=part.pattern;
      const solution=word;
      const q=question('Hvaða staf eða stafi vantar?',subject,part.choices,part.answer,solution,'Skoðaðu hvernig orðið er skrifað.');
      q.context=context ? context.replace('{word}',part.pattern) : '';
      q.speech=context ? context.replace('{word}',word) : `Hvaða staf eða stafi vantar í orðið ${word}?`;
      return [q];
    });
  }
  const vocab={samheiti:'VOCAB_SYNONYMS',andheiti:'VOCAB_ANTONYMS','orð og skýring':'VOCAB_DEFS'}[exercise];
  if(vocab) {
    const items=data[vocab][level];
    return items.map(([word,answer])=>{
      if(exercise==='samheiti'&&data.SYNONYM_CHOICES?.[word])return question('Hvaða orð merkir næstum það sama?',word,shuffle(data.SYNONYM_CHOICES[word]),answer,answer,`${word} og ${answer} hafa svipaða merkingu.`);
      if(exercise==='orð og skýring')return question('Hvaða orð passar við skýringuna?',answer,choicesFor(word,items.map(x=>x[0]),data),word,word,`${word}: ${answer}.`);
      return question(exercise==='samheiti'?'Hvaða orð hefur svipaða merkingu?':'Hvaða orð hefur andstæða merkingu?',word,choicesFor(answer,items.map(x=>x[1]),data,word),answer,answer,`${word} ${exercise==='samheiti'?'≈':'↔'} ${answer}`);
    });
  }
  const specs={
    orðflokkar:['WORD_CLASSES','Í hvaða orðflokki er orðið?',['nafnorð','sagnorð','lýsingarorð']],
    kyn:['GENDER_DATA','Hvaða kyn er orðið?',['karlkyn','kvenkyn','hvorugkyn']],
    tala:['NUMBER_DATA','Eintala eða fleirtala?',['eintala','fleirtala']],
    tíð:['TENSE_DATA','Nútíð eða þátíð?',['nútíð','þátíð']],
    fall:['CASE_DATA','Í hvaða falli er nafnorðið?',['nefnifall','þolfall','þágufall','eignarfall']]
  };
  if(!specs[exercise])return [];
  const [key,prompt,choices]=specs[exercise];
  const explanations={nafnorð:'Nafnorð nefna hluti, verur og hugmyndir.',sagnorð:'Sagnorð segja hvað einhver gerir eða hvað gerist.',lýsingarorð:'Lýsingarorð lýsa því hvernig eitthvað er.',karlkyn:'Hann: karlkyn.',kvenkyn:'Hún: kvenkyn.',hvorugkyn:'Það: hvorugkyn.',eintala:'Einn eða eitt: eintala.',fleirtala:'Fleiri en einn eða eitt: fleirtala.',nútíð:'Það gerist núna.',þátíð:'Það gerðist áður.',nefnifall:'Hjálparorð: hér er.',þolfall:'Hjálparorð: um.',þágufall:'Hjálparorð: frá.',eignarfall:'Hjálparorð: til.'};
  return data[key][level].map(([word,answer])=>question(prompt,word,choices,answer,answer,explanations[answer]));
}
