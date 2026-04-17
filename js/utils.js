// ── State ──────────────────────────────────────────────────
let db=null, allTasks=[], wOffset=0;
let activeCat='tarefas', activeStatus='todo', activeRem='';
let calYear=new Date().getFullYear(), calMonth_=new Date().getMonth();
let selectedCalDate='', currentView='kanban'; // initialized in launchApp
let dragTask=null, dragSource=null;

const DAYS=['Seg','Ter','Qua','Qui','Sex'];
const DAYS_FULL=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const MONTHS=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const CATS={reuniao:'Reunião',alinhamentos:'Alinhamentos',tarefas:'Tarefas',urgente:'Urgente',outro:'Outro'};
const STATUS_LABELS={todo:'A fazer',doing:'Em andamento',review:'Em revisão',done:'Concluído'};

// ── Helpers ────────────────────────────────────────────────
function isoWeek(d){
  const dt=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
  const day=dt.getUTCDay()||7; dt.setUTCDate(dt.getUTCDate()+4-day);
  const y0=new Date(Date.UTC(dt.getUTCFullYear(),0,1));
  return Math.ceil(((dt-y0)/86400000+1)/7);
}
function weekDays(off=0){
  const t=new Date(),dow=t.getDay()||7;
  const mon=new Date(t); mon.setDate(t.getDate()-dow+1+off*7);
  return Array.from({length:5},(_,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);return d;});
}
function fmtD(d){
  // Use local date to avoid UTC timezone shift
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,'0');
  const day=String(d.getDate()).padStart(2,'0');
  return y+'-'+m+'-'+day;
}
function today(){return fmtD(new Date());}
function ptDate(d){return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// Due date status relative to today
function dueStatus(dueStr){
  if(!dueStr) return null;
  const due=new Date(dueStr+'T12:00'), now=new Date();
  now.setHours(0,0,0,0);
  const diff=Math.round((due-now)/86400000);
  if(diff<0) return {cls:'overdue',txt:`${Math.abs(diff)}d atraso`};
  if(diff===0) return {cls:'soon',txt:'Vence hoje'};
  if(diff<=3) return {cls:'soon',txt:`${diff}d restantes`};
  return {cls:'ok',txt:`${diff}d restantes`};
}
