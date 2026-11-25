// Stages are a teaching sequence; completion is tracked separately for each student.
export const REQUIRED_STREAK=3;
export const ROUND_LENGTH=10;
export const PROGRESSION_VERSION=1;
export const STAGES=[
  {id:1,title:'Orð og merking',description:'Byrjum á orðum og fjölda.',bankLevel:'Létt',exercises:['andheiti','samheiti','tala']},
  {id:2,title:'Skiljum málið',description:'Orðskýringar og grunnmálfræði.',bankLevel:'Miðlungs',exercises:['orð og skýring','kyn','orðflokkar','tíð']},
  {id:3,title:'Stafir og föll',description:'Stafsetning og beygingar.',bankLevel:'Erfitt',exercises:['i/y','ei/ey','ng/nk','tvöfaldur samhljóði','fall']}
];
export const stageForExercise=id=>STAGES.find(s=>s.exercises.includes(id));
export const createProgress=()=>({version:PROGRESSION_VERSION,tasks:{}});
export function taskProgress(progress,id){
  const task=progress?.tasks?.[id];
  const mastered=task?.mastered===true;
  return {streak:mastered?REQUIRED_STREAK:Math.max(0,Math.min(REQUIRED_STREAK-1,Number.isInteger(task?.streak)?task.streak:0)),mastered};
}
export const stageComplete=(progress,stage)=>stage.exercises.every(id=>taskProgress(progress,id).mastered);
export function unlockedStage(progress){
  for(const stage of STAGES)if(!stageComplete(progress,stage))return stage.id;
  return STAGES.length;
}
export const completedTasks=(progress,stage)=>stage.exercises.filter(id=>taskProgress(progress,id).mastered).length;
function eligible(progress,id){const stage=stageForExercise(id);return stage&&stage.id<=unlockedStage(progress);}
export function recordMistake(progress,id){
  if(!eligible(progress,id))return false;
  const old=taskProgress(progress,id);
  if(old.mastered)return false; // An earned skill stays complete, even during later practice.
  progress.tasks??={};progress.tasks[id]={streak:0,mastered:false};
  return old.streak!==0;
}
export function recordResult(progress,id,{correct,total,bankLevel,completed=true}){
  const stage=stageForExercise(id);
  if(!stage||!eligible(progress,id)||!completed||total!==ROUND_LENGTH||bankLevel!==stage.bankLevel||!Number.isInteger(correct)||correct<0||correct>total)return {counted:false};
  const before=unlockedStage(progress),old=taskProgress(progress,id);
  if(old.mastered)return {counted:true,alreadyMastered:true,streak:REQUIRED_STREAK,mastered:true,newlyMastered:false,unlocked:before,newlyUnlocked:false};
  const streak=correct===total?Math.min(REQUIRED_STREAK,old.streak+1):0;
  const mastered=streak===REQUIRED_STREAK;
  progress.tasks??={};progress.tasks[id]={streak,mastered};
  const after=unlockedStage(progress);
  return {counted:true,streak,mastered,newlyMastered:mastered,unlocked:after,newlyUnlocked:after>before};
}
