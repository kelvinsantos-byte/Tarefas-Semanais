// ── Firebase ───────────────────────────────────────────────
// ── Firebase config hardcoded ──
const FIREBASE_CFG = {
  apiKey:        "AIzaSyBVlO4CbKSOFD6s3WyIwLtnq6JoqqdvF8I",
  authDomain:    "tarefas-semanais-f9c75.firebaseapp.com",
  projectId:     "tarefas-semanais-f9c75",
  storageBucket: "tarefas-semanais-f9c75.firebasestorage.app"
};

function initFB(cfg){firebase.apps.forEach(a=>a.delete());firebase.initializeApp(cfg);db=firebase.firestore();}

window.addEventListener('DOMContentLoaded',()=>{
  initFB(FIREBASE_CFG);
  launchApp();
  if('Notification'in window&&Notification.permission==='default')
    document.getElementById('notifBar').style.display='flex';
});

function launchApp(){
  selectedCalDate = today(); // set now that fmtD is available
  // Show splash briefly
  const splash = document.getElementById('splashEl');
  if(splash){ splash.style.display='flex'; setTimeout(()=>{splash.style.display='none';},1600); }
  document.getElementById('appEl').style.display='flex';
  const wn=isoWeek(new Date()), days=weekDays(0);
  document.getElementById('wkNum').textContent=wn;
  document.getElementById('wkYear').textContent=days[0].getFullYear();
  loadAllTasks();
  loadNotes();
}

// ── Load ───────────────────────────────────────────────────
function loadAllTasks(){
  if(!db) return;
  db.collection('tasks').orderBy('createdAt','desc').get()
    .then(snap=>{
      allTasks=snap.docs.map(d=>({id:d.id,...d.data()}));
      renderCurrentView();
      checkReminders();
    })
    .catch(()=>{
      document.getElementById('kanbanBoard').innerHTML=`<div class="err" style="min-width:300px"><strong>Erro ao carregar dados.</strong><br>Firestore → Regras → <code>allow read, write: if true;</code></div>`;
    });
}

function renderCurrentView(){
  if(currentView==='kanban') renderKanban();
  if(currentView==='agenda'){renderCal();renderAgenda();}
  if(currentView==='weekly'){refreshWeeklyHdr();renderWeekly();}
  if(currentView==='notes') renderNotesList();
  if(currentView==='hist') renderHistView();
}

// ── View switch ────────────────────────────────────────────
const VIEW_ORDER = ['kanban','agenda','weekly','notes','hist'];
function switchView(v){
  if(v === currentView) return;
  const oldIdx = VIEW_ORDER.indexOf(currentView);
  const newIdx = VIEW_ORDER.indexOf(v);
  const goRight = newIdx > oldIdx;

  const oldEl = document.getElementById('view-'+currentView);
  const newEl = document.getElementById('view-'+v);

  // animate out old view
  if(oldEl && oldEl.classList.contains('active')){
    oldEl.classList.add(goRight ? 'slide-out-left' : 'slide-out-right');
    setTimeout(()=>{ oldEl.classList.remove('active','slide-out-left','slide-out-right'); },260);
  }

  currentView = v;

  // animate in new view
  newEl.classList.add('active', goRight ? 'slide-in-right' : 'slide-in-left');
  setTimeout(()=>{ newEl.classList.remove('slide-in-right','slide-in-left'); },300);

  // update top tabs
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.toggle('active',t.dataset.view===v));
  // update bottom tabs
  document.querySelectorAll('.bot-tab').forEach(t=>t.classList.toggle('active',t.dataset.view===v));

  renderCurrentView();
}
