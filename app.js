
const APP_NAME = "Íslenskuæfing PWA";
const TEACHER_PASSWORD = "11112222";
const SESSION_OPTIONS = [5, 10, 15, 20];
const STORAGE_KEY = "islenska_aefing_pwa_v2";

let db = loadDb();
let dataset = null;
let deferredPrompt = null;

const state = {
  sessionQuestions: [],
  qIndex: 0,
  correct: 0,
  incorrect: 0,
  startTime: 0,
  currentQuestion: null,
  student: "",
  exercise: "",
  level: "",
  roundLen: 10,
};

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  renderMain();
});

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  renderMain();
});

async function init() {
  const res = await fetch("data.json");
  dataset = await res.json();
  if ("serviceWorker" in navigator) {
    try { await navigator.serviceWorker.register("./sw.js"); } catch (e) {}
  }
  renderMain();
}

function loadDb() {
  const fallback = { sessions: [], high_scores: {}, goals: {}, students: [], last_student: "" };
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    const sessions = Array.isArray(raw.sessions) ? raw.sessions : [];
    const inferredStudents = [...new Set(sessions.map(s => s.student).filter(Boolean))];
    const savedStudents = Array.isArray(raw.students) ? raw.students.filter(Boolean) : [];
    const students = [...new Set([...savedStudents, ...inferredStudents])].sort((a,b)=>a.localeCompare(b,'is'));
    const lastStudent = raw.last_student && students.includes(raw.last_student) ? raw.last_student : (students[0] || "");
    return {
      sessions,
      high_scores: raw.high_scores || {},
      goals: raw.goals || {},
      students,
      last_student: lastStudent,
    };
  } catch {
    return fallback;
  }
}
function saveDb() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}
function sortedStudents() {
  return [...new Set((db.students || []).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'is'));
}
function addStudent(name) {
  const clean = String(name || "").trim();
  if (!clean) return false;
  db.students = sortedStudents().concat(clean).filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>a.localeCompare(b,'is'));
  db.last_student = clean;
  saveDb();
  return true;
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function seededRandom(seedStr) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function() {
    h += 0x6D2B79F5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function choiceQuestion(prompt, choices, answer, meta) {
  return { prompt, choices, answer, meta };
}

function titleCaseExerciseInfo() {
  return `
    <ul class="exercise-list">
      <li><b>Stafsetning</b>: i/y, ei/ey, ng/nk, tvöfaldur samhljóði</li>
      <li><b>Orðaforði</b>: samheiti, andheiti, orð og skýring</li>
      <li><b>Málfræði</b>: orðflokkar, kyn, tala, tíð og fall</li>
    </ul>
    <p class="meta">Öll svör eru nú með smellivalkostum. Hver lota dregur án endurtekninga úr 30 dæma banka á valda stiginu.</p>`;
}

function getAllExercises() {
  return dataset.ALL_EXERCISES;
}

function renderMain() {
  const app = document.getElementById("app");
  const exercises = getAllExercises();
  const studentNames = sortedStudents();
  const selectedStudent = db.last_student && studentNames.includes(db.last_student) ? db.last_student : (studentNames[0] || "");
  const installButton = deferredPrompt ? `<button id="installBtn" class="btn secondary">Setja upp app</button>` : "";
  app.innerHTML = `
    <div class="screen">
      <div class="topbar">
        <div>
          <h1>${APP_NAME}</h1>
          <div class="install-hint">Virkar í Chrome og má setja upp sem app á Chromebook, Windows og síma.</div>
        </div>
        <div class="row">
          ${installButton}
          <button id="teacherBtn" class="btn secondary">Kennari</button>
        </div>
      </div>

      <div class="grid main-grid">
        <section class="card">
          <h2>Stillingar</h2>
          <div class="field">
            <label for="studentSelect">Velja nemanda</label>
            <select id="studentSelect">
              <option value="">Veldu nemanda</option>
              ${studentNames.map(name => `<option value="${esc(name)}" ${name===selectedStudent?'selected':''}>${esc(name)}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label for="newStudent">Eða búa til nýjan nemanda</label>
            <div class="row">
              <input id="newStudent" type="text" placeholder="Nýtt nafn nemanda">
              <button id="addStudentBtn" class="btn secondary" type="button">Nýr</button>
            </div>
          </div>
          <div class="field">
            <label for="exercise">Flokkur</label>
            <select id="exercise">${exercises.map(x => `<option>${esc(x)}</option>`).join("")}</select>
          </div>
          <div class="field">
            <label for="level">Erfiðleiki</label>
            <select id="level">${dataset.LEVELS.map(x => `<option>${esc(x)}</option>`).join("")}</select>
          </div>
          <div class="field">
            <label for="roundLen">Fjöldi spurninga í lotu</label>
            <select id="roundLen">${SESSION_OPTIONS.map(n => `<option value="${n}" ${n===10?'selected':''}>${n}</option>`).join("")}</select>
          </div>
          <div class="row">
            <button id="startBtn" class="btn primary">Byrja lotu</button>
          </div>
          ${studentNames.length ? `<div class="notice" style="margin-top:14px">Skráðir nemendur á þessu tæki: ${studentNames.map(esc).join(", ")}</div>` : ""}
        </section>

        <section class="card">
          <h2>Um æfingarnar</h2>
          ${titleCaseExerciseInfo()}
          <div class="notice" style="margin-top:14px">
            <b>Gögn:</b> Gögn og met vistast í vafranum á þessu tæki. Ef þú vilt sameiginleg gögn milli tækja þarf síðar að tengja við netgagnagrunn.
          </div>
        </section>
      </div>
    </div>
  `;
  document.getElementById("startBtn").onclick = startSession;
  document.getElementById("teacherBtn").onclick = teacherLogin;
  document.getElementById("addStudentBtn").onclick = () => {
    const input = document.getElementById("newStudent");
    const name = input.value.trim();
    if (!name) {
      alert("Sláðu inn nafn nemanda.");
      return;
    }
    addStudent(name);
    renderMain();
  };
  if (deferredPrompt) {
    document.getElementById("installBtn").onclick = installApp;
  }
}

async function installApp() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  renderMain();
}

function teacherLogin() {
  const pw = prompt("Sláðu inn lykilorð kennara:");
  if (pw === null) return;
  if (pw !== TEACHER_PASSWORD) {
    alert("Rangt lykilorð.");
    return;
  }
  renderTeacherArea();
}

function buildChoices(correct, pool, seed) {
  const others = pool.filter(x => x !== correct);
  const rng = seededRandom(seed);
  const distractors = [];
  while (distractors.length < 2 && others.length) {
    const pick = others[Math.floor(rng() * others.length)];
    if (!distractors.includes(pick)) distractors.push(pick);
  }
  return shuffle([...distractors, correct], rng);
}

function makeSpellingPattern(word, exercise) {
  if (exercise === "i/y") {
    for (const target of ["í", "i", "y", "ý"]) {
      const idx = word.indexOf(target);
      if (idx !== -1) return [word.slice(0, idx) + "_" + word.slice(idx + 1), target, ["i", "í", "y", "ý"]];
    }
  }
  if (exercise === "ei/ey") {
    for (const target of ["ei", "ey"]) {
      const idx = word.indexOf(target);
      if (idx !== -1) return [word.slice(0, idx) + "__" + word.slice(idx + 2), target, ["ei", "ey"]];
    }
  }
  if (exercise === "ng/nk") {
    for (const target of ["ng", "nk"]) {
      const idx = word.indexOf(target);
      if (idx !== -1) return [word.slice(0, idx) + "__" + word.slice(idx + 2), target, ["ng", "nk"]];
    }
  }
  if (exercise === "tvöfaldur samhljóði") {
    const match = word.match(/([bcdfghjklmnpqrstvxzþð])\1/);
    if (match) {
      const target = match[0];
      const single = target[0];
      const otherDoubleMap = {ll:"nn", nn:"ll", pp:"tt", tt:"pp", kk:"mm", mm:"kk", ss:"rr", rr:"ss", gg:"ll", ff:"nn", bb:"ll", dd:"nn"};
      const otherDouble = otherDoubleMap[target] || (target !== "nn" ? "nn" : "ll");
      const idx = match.index;
      return [word.slice(0, idx) + "__" + word.slice(idx + 2), target, shuffle([target, single, otherDouble], seededRandom(word))];
    }
  }
  return [word, "", [""]];
}

function makeSpellingBank(exercise, level) {
  return dataset.SPELLING_WORDS[exercise][level].slice(0, 30).map((word, i) => {
    const [pattern, answer, choices] = makeSpellingPattern(word, exercise);
    const rng = seededRandom(`${exercise}|${level}|${i+1}`);
    return choiceQuestion(`Veldu hvaða bókstafur eða bókstafir passa í orðið: ${pattern}`, shuffle(choices, rng), answer, `${exercise}|${level}|${word}|${i+1}`);
  });
}
function makeVocabBank(type, level) {
  if (type === "samheiti") {
    const items = dataset.VOCAB_SYNONYMS[level].slice(0, 30);
    const pool = items.map(x => x[1]);
    return items.map(([word, ans], i) => choiceQuestion(`Hvaða orð er samheiti við „${word}“?`, buildChoices(ans, pool, `syn|${level}|${i}`), ans, `syn|${level}|${word}|${i+1}`));
  }
  if (type === "andheiti") {
    const items = dataset.VOCAB_ANTONYMS[level].slice(0, 30);
    const pool = items.map(x => x[1]);
    return items.map(([word, ans], i) => choiceQuestion(`Hvaða orð er andheiti við „${word}“?`, buildChoices(ans, pool, `ant|${level}|${i}`), ans, `ant|${level}|${word}|${i+1}`));
  }
  const items = dataset.VOCAB_DEFS[level].slice(0, 30);
  const pool = items.map(x => x[0]);
  return items.map(([word, definition], i) => choiceQuestion(`Hvaða orð passar við skýringuna: „${definition}“?`, buildChoices(word, pool, `def|${level}|${i}`), word, `def|${level}|${word}|${i+1}`));
}
function makeFixedChoiceBank(items, promptTemplate, choices, prefix, level) {
  return items.slice(0, 30).map(([thing, ans], i) => choiceQuestion(promptTemplate.replace("{thing}", thing), [...choices], ans, `${prefix}|${level}|${thing}|${i+1}`));
}
function buildQuestionBank(exercise, level) {
  if (dataset.SPELLING_EXERCISES.includes(exercise)) return makeSpellingBank(exercise, level);
  if (dataset.VOCAB_EXERCISES.includes(exercise)) return makeVocabBank(exercise, level);
  if (exercise === "orðflokkar") return makeFixedChoiceBank(dataset.WORD_CLASSES[level], "Hvaða orðflokkur er orðið „{thing}“?", ["nafnorð","sagnorð","lýsingarorð"], "wc", level);
  if (exercise === "kyn") return makeFixedChoiceBank(dataset.GENDER_DATA[level], "Hvaða kyn er orðið „{thing}“?", ["karlkyn","kvenkyn","hvorugkyn"], "gender", level);
  if (exercise === "tala") return makeFixedChoiceBank(dataset.NUMBER_DATA[level], "Er orðið „{thing}“ í eintölu eða fleirtölu?", ["eintala","fleirtala"], "number", level);
  if (exercise === "tíð") return makeFixedChoiceBank(dataset.TENSE_DATA[level], "Í hvaða tíð er þetta: „{thing}“?", ["nútíð","þátíð"], "tense", level);
  if (exercise === "fall") return makeFixedChoiceBank(dataset.CASE_DATA[level], "Hvaða fall sést hér: „{thing}“?", ["nefnifall","þolfall","þágufall","eignarfall"], "case", level);
  return [];
}

function startSession() {
  const selected = document.getElementById("studentSelect").value.trim();
  const typed = document.getElementById("newStudent")?.value.trim() || "";
  const student = typed || selected;
  const exercise = document.getElementById("exercise").value;
  const level = document.getElementById("level").value;
  const roundLen = Number(document.getElementById("roundLen").value);
  if (!student) {
    alert("Veldu eða búðu til nemanda.");
    return;
  }
  addStudent(student);
  const bank = buildQuestionBank(exercise, level);
  if (roundLen > bank.length) {
    alert(`Það eru bara ${bank.length} dæmi á þessu stigi.`);
    return;
  }
  state.student = student;
  state.exercise = exercise;
  state.level = level;
  state.roundLen = roundLen;
  state.sessionQuestions = shuffle(bank).slice(0, roundLen);
  state.qIndex = 0;
  state.correct = 0;
  state.incorrect = 0;
  state.startTime = Date.now();
  renderSession();
}
function renderSession() {
  const app = document.getElementById("app");
  const q = state.sessionQuestions[state.qIndex];
  state.currentQuestion = q;
  const elapsed = Math.max((Date.now() - state.startTime) / 60000, 1/60);
  const cpm = state.correct / elapsed;
  app.innerHTML = `
    <div class="session-wrap screen">
      <section class="card header-card">
        <div>
          <h2>${esc(state.student)} • ${esc(state.exercise)} • ${esc(state.level)}</h2>
          <div class="statline">Spurning ${state.qIndex + 1}/${state.roundLen}</div>
        </div>
        <div class="statline">Rétt: ${state.correct} &nbsp; Rangt: ${state.incorrect} &nbsp; Rétt/mín: ${cpm.toFixed(1)}</div>
      </section>

      <section class="card prompt-card">
        <div class="prompt">${esc(q.prompt)}</div>
        <div class="choices">
          ${q.choices.map((choice, idx) => `<button class="choice" data-choice="${esc(choice)}">${esc(choice)}</button>`).join("")}
        </div>
      </section>

      <section class="card center" style="min-height:90px">
        <div class="feedback" id="feedback"></div>
      </section>
    </div>
  `;
  document.querySelectorAll(".choice").forEach(btn => btn.onclick = () => submitChoice(btn.dataset.choice));
}
function submitChoice(choice) {
  const q = state.currentQuestion;
  const buttons = [...document.querySelectorAll(".choice")];
  buttons.forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.choice === q.answer) btn.classList.add("correct");
    else if (btn.dataset.choice === choice) btn.classList.add("wrong");
  });
  const fb = document.getElementById("feedback");
  if (choice === q.answer) {
    state.correct += 1;
    fb.textContent = "Rétt svar!";
    fb.style.color = "#2e8b57";
  } else {
    state.incorrect += 1;
    fb.textContent = `Rangt svar. Rétt svar er: ${q.answer}`;
    fb.style.color = "#b22222";
  }
  setTimeout(nextQuestion, 900);
}
function nextQuestion() {
  state.qIndex += 1;
  if (state.qIndex >= state.roundLen) return endSession();
  renderSession();
}
function endSession() {
  const elapsedSeconds = Math.max((Date.now() - state.startTime) / 1000, 1);
  const correctPerMin = state.correct / (elapsedSeconds / 60);
  const accuracy = (state.correct / Math.max(state.correct + state.incorrect, 1)) * 100;
  const key = `${state.student}|${state.exercise}|${state.level}`;
  const oldBest = db.high_scores[key] || 0;
  const newRecord = correctPerMin > oldBest;
  if (newRecord) db.high_scores[key] = correctPerMin;
  db.sessions.push({
    timestamp: new Date().toISOString().slice(0,19).replace("T"," "),
    student: state.student,
    exercise: state.exercise,
    level: state.level,
    round_len: state.roundLen,
    correct: state.correct,
    incorrect: state.incorrect,
    accuracy: Number(accuracy.toFixed(1)),
    correct_per_min: Number(correctPerMin.toFixed(2)),
    elapsed_seconds: Number(elapsedSeconds.toFixed(1))
  });
  saveDb();
  const goalKey = `${state.student}|${state.exercise}`;
  const goal = db.goals[goalKey];
  const goalLine = goal ? `\nMarkmið í þessari æfingu: ${goal} rétt/mín.` : "";
  alert(`Lota búin!\n\nRétt svör: ${state.correct}\nRöng svör: ${state.incorrect}\nNákvæmni: ${accuracy.toFixed(1)}%\nRétt á mínútu: ${correctPerMin.toFixed(2)}\n${newRecord ? `\nNÝTT MET! Fyrra met var ${oldBest.toFixed(2)} rétt á mínútu.` : `\nBest hjá þér í þessari æfingu: ${oldBest.toFixed(2)} rétt á mínútu.`}${goalLine}`);
  renderMain();
}

function renderTeacherArea() {
  const app = document.getElementById("app");
  const students = sortedStudents();
  const defaultStudent = students[0] || "";
  const defaultExercise = getAllExercises()[0];
  app.innerHTML = `
    <div class="screen">
      <div class="topbar">
        <h1>Kennarasvæði</h1>
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
          <select id="progressStudent">${students.map(s => `<option ${s===defaultStudent?'selected':''}>${esc(s)}</option>`).join("")}</select>
          <select id="progressExercise">${getAllExercises().map(s => `<option ${s===defaultExercise?'selected':''}>${esc(s)}</option>`).join("")}</select>
          <button id="showProgressBtn" class="btn secondary">Sýna</button>
        </div>
        <div id="progressBox" class="notice"></div>
      </section>

      <section id="tab-goals" class="tab-pane card hidden">
        <div class="grid" style="grid-template-columns:1fr 1fr;align-items:start">
          <div>
            <div class="field"><label>Nemandi</label><select id="goalStudent">${students.map(s => `<option>${esc(s)}</option>`).join("")}</select></div>
            <div class="field"><label>Æfing</label><select id="goalExercise">${getAllExercises().map(s => `<option>${esc(s)}</option>`).join("")}</select></div>
            <div class="field"><label>Markmið rétt/mín</label><input id="goalValue" type="number" step="0.1" min="0"></div>
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
      db = { sessions: [], high_scores: {}, goals: {} };
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
  if (Number.isNaN(val)) {
    alert("Sláðu inn tölu fyrir markmið.");
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
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "islensku_aefing_gogn.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

init();
