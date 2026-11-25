// Small, self-contained illustrations keep the activity choices available offline.
const text = (x,y,value,size=20,color='#234235') => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size}" font-weight="700" fill="${color}">${value}</text>`;
const rect = (x,y,w,h,fill,r=10) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;
const circle = (x,y,r,fill) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const tile = (x,letter,fill='#fff') => rect(x,17,62,58,fill)+text(x+31,57,letter,31);
const apple = (x,y,s=1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 1C-18-13-23 7-15 21C-9 32-2 25 0 26C8 30 17 25 20 12C23-1 12-12 0 1Z" fill="#eb795b"/><path d="M0 0Q-1-9 5-13" fill="none" stroke="#587250" stroke-width="4"/><ellipse cx="9" cy="-8" rx="9" ry="4" fill="#6e9c64" transform="rotate(-25 9 -8)"/></g>`;
const face = (x,smile=true) => circle(x,43,25,'#f5c86e')+circle(x-8,39,2.5,'#394a3c')+circle(x+8,39,2.5,'#394a3c')+`<path d="M${x-9} ${smile?49:56}Q${x} ${smile?61:44} ${x+9} ${smile?49:56}" fill="none" stroke="#394a3c" stroke-width="3" stroke-linecap="round"/>`;
const house = (x,y,s=1) => `<g transform="translate(${x} ${y}) scale(${s})">${rect(0,16,48,35,'#f1be65',3)}<path d="M-5 19L24-5L53 19Z" fill="#db795f"/>${rect(19,29,12,22,'#fff5df',2)}${rect(5,25,9,9,'#fff5df',1)}</g>`;
const book = (x,y) => `<g transform="translate(${x} ${y})"><path d="M0 0Q22-8 42 2V52Q22 42 0 50ZM42 2Q62-8 84 0V50Q63 42 42 52Z" fill="#fff" stroke="#5685ac" stroke-width="3"/><path d="M42 3V50M8 13L32 15M8 25L32 27M53 15L76 13M53 27L76 25" stroke="#91b4ce" stroke-width="3"/></g>`;
const dog = (x,y,s=1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-16-9L-27-21L-28 7L-15 12M16-9L27-21L28 7L15 12" fill="#ad7551"/>${rect(-21,-14,42,43,'#c99266',15)}${circle(-7,1,2.4,'#304336')}${circle(7,1,2.4,'#304336')}${rect(-12,8,24,16,'#f4d9b6',8)}${circle(0,11,4,'#304336')}</g>`;
const runner = `<g stroke="#4c7e9c" stroke-width="7" stroke-linecap="round" fill="none"><path d="M113 38L101 57L81 58M110 42L129 51L142 40M101 57L120 70L139 71M101 57L98 76L80 83"/></g>${circle(119,25,9,'#e8b371')}`;
const art = {
  'i/y': tile(32,'i','#fff')+text(120,55,'?',25,'#7f957d')+tile(146,'y','#f6d68c'),
  'ei/ey': tile(32,'ei')+text(120,55,'?',25,'#7f957d')+tile(146,'ey','#f6d68c'),
  'ng/nk': tile(32,'ng')+text(120,55,'?',25,'#7f957d')+tile(146,'nk','#f6d68c'),
  'tvöfaldur samhljóði': tile(32,'t')+text(120,55,'→',26,'#7f957d')+tile(146,'tt','#f6d68c'),
  samheiti: face(60)+text(120,52,'≈',31,'#50748e')+face(180)+text(60,88,'glaður',14)+text(180,88,'kátur',14),
  andheiti: house(28,17,1.05)+text(120,55,'↔',28,'#50748e')+house(162,39,.62)+text(55,88,'stór',14)+text(177,88,'lítill',14),
  'orð og skýring': book(25,21)+rect(133,24,88,42,'#fff')+text(177,52,'bók',24)+`<path d="M111 43H127M122 38L128 43L122 48" fill="none" stroke="#50748e" stroke-width="3"/>`,
  orðflokkar: dog(45,45,.82)+runner+circle(192,44,23,'#719bb6')+text(45,90,'hlutur',13)+text(115,99,'gera',13)+text(192,90,'lýsing',13),
  kyn: dog(44,36,.62)+book(90,19)+house(184,21,.65)+text(44,86,'hann',17)+text(126,86,'hún',17)+text(201,86,'það',17),
  tala: apple(47,38,1.1)+text(108,56,'→',28,'#50748e')+apple(151,39,.7)+apple(182,39,.7)+apple(213,39,.7)+text(47,90,'einn',15)+text(181,90,'margir',15),
  tíð: rect(22,19,83,62,'#fff')+rect(22,19,83,18,'#91b4ce',5)+text(64,62,'í gær',17)+text(120,55,'→',24,'#50748e')+rect(137,19,83,62,'#fff')+rect(137,19,83,18,'#e6b760',5)+text(178,62,'núna',17),
  fall: dog(119,43,.8)+rect(9,3,68,27,'#fff')+text(43,22,'hér er',13)+rect(163,3,68,27,'#fff')+text(197,22,'um',13)+rect(9,67,68,27,'#fff')+text(43,86,'frá',13)+rect(163,67,68,27,'#fff')+text(197,86,'til',13)
};
export const EXERCISES = [
  {id:'i/y',title:'i, í, y eða ý',group:'Stafsetning',tone:'gold',short:'Hvaða staf vantar?',help:'Veldu stafinn sem vantar í orðið.',example:'f_sk ur'.replace(' ',''),answer:'i',result:'fiskur'},
  {id:'ei/ey',title:'ei eða ey',group:'Stafsetning',tone:'gold',short:'Tvær leiðir að sama hljóði',help:'Veldu ei eða ey til að klára orðið.',example:'__ra',answer:'ey',result:'eyra'},
  {id:'ng/nk',title:'ng eða nk',group:'Stafsetning',tone:'gold',short:'Kláraðu orðið',help:'Veldu ng eða nk til að klára orðið.',example:'ba__i',answer:'nk',result:'banki'},
  {id:'tvöfaldur samhljóði',title:'Einn eða tveir stafir',group:'Stafsetning',tone:'gold',short:'t eða tt? l eða ll?',help:'Veldu einn eða tvo eins samhljóða til að klára orðið.',example:'Ég set ha_ á höfuðið.',answer:'tt',result:'Ég set hatt á höfuðið.'},
  {id:'samheiti',title:'Samheiti',group:'Orðaforði',tone:'blue',short:'Orð með svipaða merkingu',help:'Finndu orð sem merkir það sama eða næstum það sama.',example:'glaður',answer:'kátur',result:'Glaður og kátur hafa svipaða merkingu.'},
  {id:'andheiti',title:'Andheiti',group:'Orðaforði',tone:'blue',short:'Orð með andstæða merkingu',help:'Finndu orð með andstæða merkingu.',example:'stór',answer:'lítill',result:'Stór og lítill eru andheiti.'},
  {id:'orð og skýring',title:'Orð og skýring',group:'Orðaforði',tone:'blue',short:'Hvaða orð passar?',help:'Lestu skýringuna og veldu orðið sem passar.',example:'Hlutur með síðum og texta',answer:'bók',result:'Bók er hlutur með síðum og texta.'},
  {id:'orðflokkar',title:'Orðflokkar',group:'Málfræði',tone:'rose',short:'Hlutur, athöfn eða lýsing',help:'Nafnorð nefna hluti, verur og hugmyndir. Sagnorð segja hvað gerist. Lýsingarorð lýsa.',example:'fallegur',answer:'lýsingarorð',result:'Fallegur er lýsingarorð. Orðið lýsir því hvernig eitthvað er.'},
  {id:'kyn',title:'Kyn orða',group:'Málfræði',tone:'rose',short:'Hann, hún eða það',help:'Hann: karlkyn. Hún: kvenkyn. Það: hvorugkyn.',example:'bók',answer:'kvenkyn',result:'Bók er kvenkyn. Við segjum: hún, bókin.'},
  {id:'tala',title:'Einn eða margir',group:'Málfræði',tone:'rose',short:'Eintala og fleirtala',help:'Eintala merkir einn eða eitt. Fleirtala merkir fleiri en einn eða eitt.',example:'tveir hundar',answer:'fleirtala',result:'Hundar er fleirtala. Hundarnir eru fleiri en einn.'},
  {id:'tíð',title:'Núna eða áður',group:'Málfræði',tone:'rose',short:'Nútíð og þátíð',help:'Nútíð segir frá því sem gerist núna. Þátíð segir frá því sem gerðist áður.',example:'Ég fór í skólann.',answer:'þátíð',result:'Fór er í þátíð. Það gerðist áður.'},
  {id:'fall',title:'Föll orða',group:'Málfræði',tone:'rose',short:'Hér er · um · frá · til',help:'Hér er: nefnifall. Um: þolfall. Frá: þágufall. Til: eignarfall.',example:'frá hundi',answer:'þágufall',result:'Frá hundi: orðið hundi er í þágufalli.'}
];
export const getExercise = id => EXERCISES.find(e=>e.id===id);
export function illustration(id) {return `<svg class="activity-art" viewBox="0 0 240 106" aria-hidden="true" focusable="false">${art[id]||''}</svg>`;}
