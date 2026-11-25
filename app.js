import {EXERCISES,getExercise,illustration} from './exercises.js';
import {buildQuestionBank,shuffle} from './questions.js';

const APP_NAME='Íslenskuæfingar';
const TEACHER_PASSWORD='11112222';
const SESSION_OPTIONS=[5,10,15,20];
const STORAGE_KEY='islenska_aefing_pwa_v2';
const emptyDb=()=>({sessions:[],high_scores:{},goals:{},students:[],last_student:'',settings:{}});
let db=loadDb(),dataset=null,deferredPrompt=null,view='loading',voice=null;
let storageWarning=false;
const state={exercise:'',level:db.settings.level||'Létt',roundLen:db.settings.roundLen||5,student:'',guest:false,sessionQuestions:[],qIndex:0,correct:0,incorrect:0,answered:false,startTime:0};
const app=document.getElementById('app');
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function loadDb(){
  try{
    const raw=JSON.parse(localStorage.getItem(STORAGE_KEY))||{};
    const sessions=Array.isArray(raw.sessions)?raw.sessions:[];
    const students=[...new Set([...(Array.isArray(raw.students)?raw.students:[]),...sessions.map(s=>s.student)].filter(s=>typeof s==='string'&&s.trim()))].sort((a,b)=>a.localeCompare(b,'is'));
    return {...emptyDb(),...raw,sessions,students,last_student:students.includes(raw.last_student)?raw.last_student:'',settings:raw.settings||{}};
  }catch{return emptyDb();}
}
function saveDb(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(db));}catch{storageWarning=true;}}
function sortedStudents(){return [...new Set(db.students||[])].sort((a,b)=>a.localeCompare(b,'is'));}
function addStudent(name){const clean=String(name||'').trim();if(!clean)return false;db.students=[...new Set([...db.students,clean])];db.last_student=clean;saveDb();return true;}
function getAllExercises(){return dataset.ALL_EXERCISES;}
function focusHeading(){document.querySelector('[data-focus]')?.focus({preventScroll:true});window.scrollTo(0,0);}
function stopSpeech(){window.speechSynthesis?.cancel();}
function speak(text){if(!voice)return;stopSpeech();const utterance=new SpeechSynthesisUtterance(text);utterance.voice=voice;utterance.lang='is-IS';utterance.rate=.85;window.speechSynthesis.speak(utterance);}
function refreshVoices(){
  voice=window.speechSynthesis?.getVoices().find(v=>/^is(?:-|$)/i.test(v.lang))||null;
  document.querySelectorAll('[data-speak]').forEach(b=>{b.disabled=!voice;b.title=voice?'Lesa upp á íslensku':'Íslensk rödd er ekki tiltæk í þessum vafra';});
  document.querySelectorAll('[data-voice-note]').forEach(n=>{n.hidden=Boolean(voice);});
}
function bindSpeech(){document.querySelectorAll('[data-speak]').forEach(b=>b.onclick=()=>speak(b.dataset.speak));refreshVoices();}
function readButton(text,label='Lesa upp'){return `<button class="btn read-btn" type="button" data-speak="${esc(text)}" aria-label="${esc(label)}"><span aria-hidden="true">◖))</span> ${esc(label)}</button>`;}
window.speechSynthesis?.addEventListener('voiceschanged',refreshVoices);
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;if(view==='home')showInstallButton();});
window.addEventListener('appinstalled',()=>{deferredPrompt=null;document.getElementById('installBtn')?.remove();});
function showInstallButton(){const slot=document.getElementById('installSlot');if(slot){slot.innerHTML='<button id="installBtn" class="btn" type="button">Setja upp app</button>';document.getElementById('installBtn').onclick=installApp;}}
async function installApp(){if(!deferredPrompt)return;await deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;document.getElementById('installBtn')?.remove();}
async function init(){
  try{
    const response=await fetch('./data.json');if(!response.ok)throw new Error('data');dataset=await response.json();
    if(!dataset.LEVELS.includes(state.level))state.level=dataset.LEVELS[0];
    if(!SESSION_OPTIONS.includes(state.roundLen))state.roundLen=5;
    renderMain();
    if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }catch{app.innerHTML='<main class="screen error-card"><h1>Æfingarnar náðust ekki</h1><p>Athugaðu nettenginguna og reyndu aftur.</p><button class="btn primary" id="retryBtn">Reyna aftur</button></main>';document.getElementById('retryBtn').onclick=init;}
}
function renderMain(){
  view='home';stopSpeech();const names=sortedStudents();
  app.innerHTML=`<main class="screen home-screen">
    <header class="topbar"><a class="brand" href="./" aria-label="Íslenskuæfingar, forsíða"><span class="brand-icon" aria-hidden="true">Í</span><span>${APP_NAME}<small>Smá skref. Meiri færni.</small></span></a><nav class="row" aria-label="Aðgerðir"><span id="installSlot"></span><button id="teacherBtn" class="btn quiet">Kennari</button></nav></header>
    <section class="welcome"><div><p class="eyebrow">LESA · SKILJA · ÆFA</p><h1 data-focus tabindex="-1">Hvað viltu æfa?</h1><p class="muted">Veldu spjald og skoðaðu dæmi.</p></div>
      <div class="student-bar"><label for="studentSelect">Hver ert þú?</label><select id="studentSelect"><option value="">Æfa án nafns</option>${names.map(n=>`<option value="${esc(n)}" ${n===db.last_student?'selected':''}>${esc(n)}</option>`).join('')}</select><details id="newStudentDetails"><summary>Bæta við nafni</summary><form id="studentForm"><label for="newStudent">Nafn eða gælunafn</label><div class="row"><input id="newStudent" type="text" maxlength="60" autocomplete="off" required><button id="addStudentBtn" class="btn primary">Bæta við</button></div></form></details></div>
    </section>
    <div class="activity-grid" aria-label="Veldu verkefni">${EXERCISES.map(e=>`<button type="button" class="activity-card ${e.tone}" data-exercise="${esc(e.id)}" aria-label="${esc(e.title)}: ${esc(e.short)}" aria-haspopup="dialog"><span class="card-category">${e.group}</span>${illustration(e.id)}<span class="activity-title">${e.title}</span><span class="activity-description">${e.short}</span><span class="card-arrow" aria-hidden="true"><svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 16L16 4M5 4H16V15"/></svg></span></button>`).join('')}</div>
    <footer class="home-footer"><span>12 verkefni · 3 erfiðleikastig · Stuttar æfingalotur</span><span>Framvinda vistast á þessu tæki.</span></footer>
    ${storageWarning?'<p class="notice" role="status">Vafrinn gat ekki vistað framvinduna. Þú getur samt æft.</p>':''}
    <dialog id="setupDialog" aria-labelledby="setupTitle"></dialog>
  </main>`;
  document.getElementById('teacherBtn').onclick=teacherLogin;
  document.getElementById('studentSelect').onchange=e=>{db.last_student=e.target.value;saveDb();};
  document.getElementById('studentForm').onsubmit=e=>{e.preventDefault();const name=document.getElementById('newStudent').value.trim();if(addStudent(name)){renderMain();document.getElementById('studentSelect').focus();}};
  document.querySelectorAll('[data-exercise]').forEach(b=>b.onclick=()=>showSetup(b.dataset.exercise));
  if(deferredPrompt)showInstallButton();
}
function showSetup(id){
  stopSpeech();state.exercise=id;const e=getExercise(id),dialog=document.getElementById('setupDialog');
  dialog.innerHTML=`<div class="setup-header"><span class="eyebrow">${e.group}</span><button class="btn quiet close-btn" id="closeSetup" aria-label="Loka og velja annað verkefni">✕</button></div>
    <div class="setup-intro ${e.tone}">${illustration(id)}<h2 id="setupTitle">${e.title}</h2><p>${e.help}</p>${readButton(`${e.title}. ${e.help}. Dæmi: ${e.result}.`,'Lesa leiðbeiningar')}</div>
    <div class="example-box"><span class="eyebrow">DÆMI · EKKI METIÐ</span><div class="example-line"><strong>${esc(e.example)}</strong><span aria-hidden="true">→</span><span class="example-answer">${esc(e.answer)}</span></div><p>${esc(e.result)}</p></div>
    <fieldset><legend>Veldu erfiðleika</legend><div class="segmented">${dataset.LEVELS.map((l,i)=>`<label><input type="radio" name="level" value="${l}" ${l===state.level?'checked':''}><span><span class="level-dots" aria-hidden="true">${'●'.repeat(i+1)}</span>${l}</span></label>`).join('')}</div></fieldset>
    <fieldset><legend>Hvað viltu margar spurningar?</legend><div class="segmented lengths">${SESSION_OPTIONS.map(n=>`<label><input type="radio" name="roundLen" value="${n}" ${n===state.roundLen?'checked':''}><span>${n}</span></label>`).join('')}</div></fieldset>
    <p class="voice-note muted" data-voice-note>Íslenskur upplestur er ekki tiltækur í þessum vafra.</p>
    <button class="btn primary start-btn" id="startBtn">Byrja æfingu <span aria-hidden="true">→</span></button>`;
  document.getElementById('closeSetup').onclick=()=>{stopSpeech();dialog.close();};
  dialog.oncancel=stopSpeech;dialog.onclose=()=>document.querySelector(`[data-exercise="${CSS.escape(id)}"]`)?.focus();
  dialog.querySelectorAll('[name="level"]').forEach(r=>r.onchange=()=>{state.level=r.value;});
  dialog.querySelectorAll('[name="roundLen"]').forEach(r=>r.onchange=()=>{state.roundLen=Number(r.value);});
  document.getElementById('startBtn').onclick=()=>startSession();bindSpeech();dialog.showModal();
}
function startSession(repeat=false){
  stopSpeech();
  if(!repeat){state.student=document.getElementById('studentSelect').value;state.guest=!state.student;}
  const bank=buildQuestionBank(dataset,state.exercise,state.level);
  if(!bank.length)return;
  db.settings={level:state.level,roundLen:state.roundLen};saveDb();
  state.sessionQuestions=shuffle(bank).slice(0,state.roundLen).map(q=>({...q,choices:shuffle(q.choices)}));
  state.qIndex=0;state.correct=0;state.incorrect=0;state.startTime=Date.now();
  document.getElementById('setupDialog')?.close();renderSession();
}
function renderSession(){
  view='session';state.answered=false;state.currentQuestion=state.sessionQuestions[state.qIndex];const q=state.currentQuestion,e=getExercise(state.exercise);
  app.innerHTML=`<main class="screen session-wrap"><header class="session-header"><button class="btn quiet" id="homeBtn">← Velja verkefni</button><div class="session-name">${esc(e.title)}<small>${state.level}${state.student?' · '+esc(state.student):''}</small></div><span class="question-count">${state.qIndex+1} / ${state.sessionQuestions.length}</span></header>
    <div class="progress-track" role="progressbar" aria-label="Loknar spurningar" aria-valuenow="${state.qIndex}" aria-valuemin="0" aria-valuemax="${state.sessionQuestions.length}">${state.sessionQuestions.map((_,i)=>`<span class="${i<state.qIndex?'done':i===state.qIndex?'current':''}"></span>`).join('')}</div>
    <section class="card prompt-card"><p class="eyebrow">VELDU EITT SVAR</p><h1 class="question-prompt" data-focus tabindex="-1">${esc(q.prompt)}</h1><div class="question-subject">${esc(q.subject)}</div>${q.context?`<p class="question-context">${esc(q.context)}</p>`:''}${readButton(q.speech+' '+q.choices.map((c,i)=>`Valkostur ${['eitt','tvö','þrjú','fjögur'][i]}: ${c}.`).join(' '))}<div class="choices">${q.choices.map((c,i)=>`<button class="choice" data-choice="${esc(c)}"><span class="choice-key" aria-hidden="true">${i+1}</span><span>${esc(c)}</span><span class="choice-mark" aria-hidden="true"></span></button>`).join('')}</div>
    <details class="help-box"><summary>Hjálp · Hvernig geri ég þetta?</summary><p>${esc(e.help)}</p></details></section>
    <section class="feedback-panel" aria-label="Endurgjöf"><div id="feedback" role="status" aria-live="polite" aria-atomic="true"><p class="muted">Skoðaðu vel. Þú hefur nægan tíma.</p></div><button class="btn primary next-btn" id="nextBtn" hidden>Næsta <span aria-hidden="true">→</span></button></section>
    <p class="voice-note muted" data-voice-note>Íslenskur upplestur er ekki tiltækur í þessum vafra.</p>
  </main>`;
  document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>submitChoice(b.dataset.choice));
  document.getElementById('nextBtn').onclick=nextQuestion;
  document.getElementById('homeBtn').onclick=()=>{if(state.qIndex||state.answered){if(!confirm('Hætta í þessari lotu? Ólokin lota vistast ekki.'))return;}renderMain();focusHeading();};
  bindSpeech();focusHeading();
}
function submitChoice(choice){
  if(state.answered||!state.currentQuestion.choices.includes(choice))return;
  stopSpeech();state.answered=true;const q=state.currentQuestion,correct=choice===q.answer;
  if(correct)state.correct++;else state.incorrect++;
  document.querySelectorAll('[data-choice]').forEach(b=>{b.disabled=true;if(b.dataset.choice===q.answer){b.classList.add('correct');b.querySelector('.choice-mark').textContent='✓';}else if(b.dataset.choice===choice){b.classList.add('wrong');b.querySelector('.choice-mark').textContent='✕';}});
  const fb=document.getElementById('feedback');fb.className=`feedback ${correct?'good':'review'}`;
  fb.innerHTML=`<strong>${correct?'✓ Rétt!':'Skoðum þetta saman'}</strong><p>${correct?'Rétt svar':'Rétt svar er'}: <b>${esc(q.solution)}</b></p><p class="feedback-explanation">${esc(q.explanation)}</p>`;
  const next=document.getElementById('nextBtn');next.hidden=false;next.innerHTML=`${state.qIndex===state.sessionQuestions.length-1?'Sjá niðurstöðu':'Næsta'} <span aria-hidden="true">→</span>`;
  next.focus({preventScroll:true});
}
function nextQuestion(){if(!state.answered)return;stopSpeech();state.qIndex++;if(state.qIndex>=state.sessionQuestions.length)endSession();else renderSession();}
function endSession(){
  if(view!=='session')return;view='result';
  const elapsedSeconds=Math.max((Date.now()-state.startTime)/1000,1),correctPerMin=state.correct/(elapsedSeconds/60),accuracy=100*state.correct/state.sessionQuestions.length;
  if(!state.guest){
    const key=`${state.student}|${state.exercise}|${state.level}`;db.high_scores[key]=Math.max(db.high_scores[key]||0,correctPerMin);
    db.sessions.push({timestamp:new Date().toISOString().slice(0,19).replace('T',' '),student:state.student,exercise:state.exercise,level:state.level,round_len:state.sessionQuestions.length,correct:state.correct,incorrect:state.incorrect,accuracy:Number(accuracy.toFixed(1)),correct_per_min:Number(correctPerMin.toFixed(2)),elapsed_seconds:Number(elapsedSeconds.toFixed(1))});saveDb();
  }
  app.innerHTML=`<main class="screen result-screen"><div class="result-icon" aria-hidden="true">✓</div><p class="eyebrow">LOTA LOKIÐ</p><h1 data-focus tabindex="-1">Vel gert að æfa!</h1><p class="muted">${esc(getExercise(state.exercise).title)} · ${state.level}</p><div class="result-score"><strong>${state.correct}<span> / ${state.sessionQuestions.length}</span></strong><p>rétt svör</p></div><p>${state.incorrect?`Þú getur æft aftur og haldið áfram að læra.`:'Þú svaraðir öllum spurningunum rétt.'}</p><div class="result-actions"><button class="btn primary" id="againBtn">Æfa aftur ↻</button><button class="btn" id="chooseBtn">Velja annað verkefni →</button></div><p class="muted">${storageWarning?'Framvindan gat ekki vistast í vafranum.':state.guest?'Þú æfðir án nafns. Þessi lota var ekki vistuð.':'Framvindan þín er vistuð á þessu tæki.'}</p></main>`;
  document.getElementById('againBtn').onclick=()=>startSession(true);document.getElementById('chooseBtn').onclick=()=>{renderMain();focusHeading();};focusHeading();
}
function teacherLogin(){const pw=prompt('Sláðu inn lykilorð kennara:');if(pw===null)return;if(pw!==TEACHER_PASSWORD){alert('Rangt lykilorð.');return;}view='teacher';renderTeacherArea();}
window.addEventListener('keydown',e=>{if(view!=='session'||e.altKey||e.ctrlKey||e.metaKey||!['1','2','3','4'].includes(e.key)||!e.target.closest('.session-wrap'))return;if(state.answered)return;const q=state.currentQuestion;const choice=q.choices[Number(e.key)-1];if(choice){e.preventDefault();submitChoice(choice);}});
function renderTeacherArea() {
  const app = document.getElementById("app");
  const students = sortedStudents();
  const defaultStudent = students[0] || "";
  const defaultExercise = getAllExercises()[0];
  app.innerHTML = `
    <div class="screen">
      <div class="topbar">
        <div><h1>Kennarasvæði</h1><p class="muted">Gögn vistast í þessum vafra. Tími lotu inniheldur lestur endurgjafar.</p></div>
        <div class="row">
          <button id="exportBtn" class="btn secondary">Flytja út CSV</button>
          <button id="resetBtn" class="btn warn">Eyða öllum gögnum</button>
          <button id="backBtn" class="btn">Til baka</button>
        </div>
      </div>

      <div class="tabs">
        <button class="tab active" data-tab="sessions">Lotur</button>
        <button class="tab" data-tab="progress">Framvinda</button>
        <button class="tab" data-tab="goals">Markmið</button>
      </div>

      <section id="tab-sessions" class="tab-pane card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Dagsetning</th><th>Nemandi</th><th>Æfing</th><th>Stig</th><th>Rétt</th><th>Rangt</th><th>Rétt/mín</th><th>Nákvæmni</th></tr></thead>
            <tbody>
              ${[...db.sessions].reverse().map(s => `<tr><td>${esc(s.timestamp)}</td><td>${esc(s.student)}</td><td>${esc(s.exercise)}</td><td>${esc(s.level)}</td><td>${s.correct}</td><td>${s.incorrect}</td><td>${s.correct_per_min}</td><td>${s.accuracy}%</td></tr>`).join("") || `<tr><td colspan="8">Engin gögn enn.</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>

      <section id="tab-progress" class="tab-pane card hidden">
        <div class="row" style="margin-bottom:12px">
          <select id="progressStudent" aria-label="Nemandi">${students.map(s => `<option ${s===defaultStudent?'selected':''}>${esc(s)}</option>`).join("")}</select>
          <select id="progressExercise" aria-label="Æfing">${getAllExercises().map(s => `<option ${s===defaultExercise?'selected':''}>${esc(s)}</option>`).join("")}</select>
          <button id="showProgressBtn" class="btn secondary">Sýna</button>
        </div>
        <div id="progressBox" class="notice"></div>
      </section>

      <section id="tab-goals" class="tab-pane card hidden">
        <div class="grid teacher-goals">
          <div>
            <div class="field"><label for="goalStudent">Nemandi</label><select id="goalStudent">${students.map(s => `<option>${esc(s)}</option>`).join("")}</select></div>
            <div class="field"><label for="goalExercise">Æfing</label><select id="goalExercise">${getAllExercises().map(s => `<option>${esc(s)}</option>`).join("")}</select></div>
            <div class="field"><label for="goalValue">Markmið rétt/mín</label><input id="goalValue" type="number" step="0.1" min="0"></div>
            <button id="saveGoalBtn" class="btn primary">Vista markmið</button>
          </div>
          <div>
            <h3>Skráð markmið</h3>
            <div id="goalList" class="goal-list notice"></div>
          </div>
        </div>
      </section>
    </div>
  `;
  document.getElementById("backBtn").onclick = renderMain;
  document.getElementById("resetBtn").onclick = () => {
    if (confirm("Ertu viss um að þú viljir eyða öllum gögnum á þessu tæki?")) {
      db = emptyDb();
      saveDb();
      renderTeacherArea();
    }
  };
  document.getElementById("exportBtn").onclick = exportCSV;
  document.querySelectorAll(".tab").forEach(tab => tab.onclick = () => switchTab(tab.dataset.tab));
  document.getElementById("showProgressBtn").onclick = showProgress;
  document.getElementById("saveGoalBtn").onclick = saveGoal;
  showProgress();
  refreshGoals();
}

function switchTab(tabName) {
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tabName));
  document.querySelectorAll(".tab-pane").forEach(p => p.classList.add("hidden"));
  document.getElementById(`tab-${tabName}`).classList.remove("hidden");
}
function showProgress() {
  const studentSel = document.getElementById("progressStudent");
  const exSel = document.getElementById("progressExercise");
  const box = document.getElementById("progressBox");
  if (!studentSel || !exSel) return;
  const student = studentSel.value;
  const exercise = exSel.value;
  const sessions = db.sessions.filter(s => s.student === student && s.exercise === exercise);
  if (!sessions.length) {
    box.textContent = "Engin gögn fyrir þetta val.";
    return;
  }
  const best = Math.max(...sessions.map(s => s.correct_per_min));
  const avg = sessions.reduce((a, s) => a + s.correct_per_min, 0) / sessions.length;
  const acc = sessions.reduce((a, s) => a + s.accuracy, 0) / sessions.length;
  const recent = sessions.slice(-12).map(s => `${s.timestamp} | ${s.level} | Rétt ${s.correct} | Rangt ${s.incorrect} | Rétt/mín ${s.correct_per_min} | ${s.accuracy}%`).join("\n");
  box.innerHTML = `
    <div class="kpi">
      <div class="card"><b>Fjöldi lota</b><br>${sessions.length}</div>
      <div class="card"><b>Best rétt/mín</b><br>${best.toFixed(2)}</div>
      <div class="card"><b>Meðaltal rétt/mín</b><br>${avg.toFixed(2)}</div>
      <div class="card"><b>Meðalnákvæmni</b><br>${acc.toFixed(1)}%</div>
    </div>
    <div style="margin-top:14px;white-space:pre-wrap">${esc(recent)}</div>`;
}
function refreshGoals() {
  const el = document.getElementById("goalList");
  if (!el) return;
  const keys = Object.keys(db.goals);
  el.textContent = keys.length ? keys.map(k => `${k.replace("|", " — ")}: ${db.goals[k]} rétt/mín`).join("\n") : "Engin markmið skráð.";
}
function saveGoal() {
  const student = document.getElementById("goalStudent").value;
  const exercise = document.getElementById("goalExercise").value;
  const val = parseFloat(document.getElementById("goalValue").value.replace(",", "."));
  if (!student || !exercise || !Number.isFinite(val) || val < 0) {
    alert("Veldu nemanda og sláðu inn markmið sem er 0 eða hærra.");
    return;
  }
  db.goals[`${student}|${exercise}`] = val;
  saveDb();
  refreshGoals();
  alert("Markmið vistað.");
}
function exportCSV() {
  const rows = [["timestamp","student","exercise","level","correct","incorrect","correct_per_min","accuracy"]];
  db.sessions.forEach(s => rows.push([s.timestamp,s.student,s.exercise,s.level,s.correct,s.incorrect,s.correct_per_min,s.accuracy]));
  const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF",csv], {type:"text/csv;charset=utf-8;"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "islensku_aefing_gogn.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

init();
