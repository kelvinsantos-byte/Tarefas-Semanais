// ── Toggle ─────────────────────────────────────────────────
function toggleTask(e,id,completed){
  e.stopPropagation();
  const newStatus=completed?'done':'todo';
  const upd={completed,status:newStatus};
  upd.completedAt = completed ? fmtD(new Date()) : null;
  db.collection('tasks').doc(id).update(upd)
    .then(()=>{
      const t=allTasks.find(t=>t.id===id);
      if(t){t.completed=completed;t.status=newStatus;t.completedAt=upd.completedAt;}
      renderCurrentView();
      showToast(completed?'✓ Concluída!':'Reaberta');
    });
}

// ── CRUD ───────────────────────────────────────────────────
function saveTask(){
  const title=document.getElementById('tTitle').value.trim();
  if(!title){showToast('⚠ Informe o título');return;}
  const id=document.getElementById('editId').value;
  const dueDate=document.getElementById('tDue').value||'';
  // auto date = dueDate or today
  const date=dueDate||today();
  const d=new Date(date+'T12:00:00');
  const completed=activeStatus==='done';
  const data={
    title, date, dueDate,
    category:activeCat, status:activeStatus, completed,
    reminderDays:activeRem||null,
    notes:document.getElementById('tNotes').value.trim(),
    weekNum:isoWeek(d), year:d.getFullYear(),
    updatedAt:firebase.firestore.FieldValue.serverTimestamp()
  };
  const op=id
    ?db.collection('tasks').doc(id).update(data)
    :(data.createdAt=firebase.firestore.FieldValue.serverTimestamp(),db.collection('tasks').add(data));
  op.then(()=>{
    closeModal(); loadAllTasks();
    showToast(id?'✓ Atualizado!':'✓ Tarefa criada!');
    schedRem({...data,title});
  });
}

function delTask(){
  const id=document.getElementById('editId').value;
  if(!id||!confirm('Excluir esta tarefa?'))return;
  db.collection('tasks').doc(id).delete()
    .then(()=>{closeModal();loadAllTasks();showToast('Tarefa excluída');});
}

// ── Modal ──────────────────────────────────────────────────
function openAdd(ds,status){
  document.getElementById('modalTit').textContent='Nova tarefa';
  document.getElementById('editId').value='';
  document.getElementById('tTitle').value='';
  dpSetValue(ds||'');
  document.getElementById('tNotes').value='';
  document.getElementById('delBtn').style.display='none';
  setStatus(status||'todo'); setCat('tarefas'); setRem('');
  document.getElementById('taskModal').style.display='flex';
  setTimeout(()=>document.getElementById('tTitle').focus(),80);
}
function openEdit(t){
  document.getElementById('modalTit').textContent='Editar tarefa';
  document.getElementById('editId').value=t.id;
  document.getElementById('tTitle').value=t.title;
  dpSetValue(t.dueDate||t.date||'');
  document.getElementById('tNotes').value=t.notes||'';
  document.getElementById('delBtn').style.display='flex';
  setStatus(getStatus(t)); setCat(t.category||'tarefas'); setRem(t.reminderDays||'');
  document.getElementById('taskModal').style.display='flex';
}
function closeModal(){
  document.getElementById('taskModal').style.display='none';
  dpCloseCal();
}
function dpCloseCal(){
  const cal=document.getElementById('dpCal');
  if(cal) cal.remove();
  document.removeEventListener('click',dpOutsideClick);
}
function closeModalOut(e){if(e.target===e.currentTarget)closeModal();}

function selStatus(el){document.querySelectorAll('#statusChips .chip').forEach(c=>c.className='chip');el.classList.add(`sel-${el.dataset.s}`);activeStatus=el.dataset.s;}
function setStatus(v){document.querySelectorAll('#statusChips .chip').forEach(c=>{c.className='chip';if(c.dataset.s===v)c.classList.add(`sel-${v}`);});activeStatus=v;}
function selCat(el){document.querySelectorAll('#catChips .cat-chip').forEach(c=>c.className='cat-chip');el.classList.add(`sel-${el.dataset.c}`);activeCat=el.dataset.c;}
function setCat(v){document.querySelectorAll('#catChips .cat-chip').forEach(c=>{c.className='cat-chip';if(c.dataset.c===v)c.classList.add(`sel-${v}`);});activeCat=v;}
function selRem(el){document.querySelectorAll('.rem-chip').forEach(c=>c.classList.remove('sel'));el.classList.add('sel');activeRem=el.dataset.r;}
function setRem(v){document.querySelectorAll('.rem-chip').forEach(c=>{c.classList.toggle('sel',c.dataset.r===v);});activeRem=v;}

// ── History ────────────────────────────────────────────────
function openHistory(){
  document.getElementById('histOv').style.display='flex';
  const map={};
  allTasks.forEach(t=>{
    const k=`${t.year||2024}-${String(t.weekNum||1).padStart(2,'0')}`;
    if(!map[k])map[k]={wn:t.weekNum,yr:t.year,tasks:[],dates:[]};
    map[k].tasks.push(t); map[k].dates.push(t.date);
  });
  const sorted=Object.values(map).sort((a,b)=>b.yr!==a.yr?(b.yr||0)-(a.yr||0):(b.wn||0)-(a.wn||0));
  const cwn=isoWeek(new Date()),cyr=new Date().getFullYear();
  if(!sorted.length){
    document.getElementById('histList').innerHTML='<p style="color:var(--text3);font-size:12px;text-align:center;padding:2rem">Nenhum registro ainda.</p>';
    return;
  }
  document.getElementById('histList').innerHTML=sorted.map(w=>{
    const done=w.tasks.filter(t=>t.completed).length;
    const pct=Math.round(done/w.tasks.length*100);
    const curr=w.wn===cwn&&w.yr===cyr;
    const mn=w.dates.filter(Boolean).sort()[0], mx=w.dates.filter(Boolean).sort().at(-1);
    const rng=mn?`${ptDate(new Date(mn+'T12:00'))} — ${ptDate(new Date(mx+'T12:00'))}`:'';
    return `<div class="hw${curr?' curr':''}" onclick="jumpWeek(${w.wn},${w.yr})">
      <h3>Semana ${w.wn} · ${w.yr}${curr?'<span class="curr-badge">atual</span>':''}</h3>
      <div class="hw-date">${rng}</div>
      <div class="hw-stats"><span class="hw-stat"><strong>${w.tasks.length}</strong> tarefas</span><span class="hw-stat"><strong>${done}</strong> concluídas</span><span class="hw-stat"><strong>${pct}%</strong></span></div>
      <div class="hw-prog"><div class="hw-prog-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');
}
function jumpWeek(wn,yr){
  closeHist();
  wOffset=(wn-isoWeek(new Date()))+(yr-new Date().getFullYear())*52;
  switchView('weekly'); refreshWeeklyHdr(); renderWeekly();
}
function closeHist(){document.getElementById('histOv').style.display='none';}
function closeHistOut(e){if(e.target===document.getElementById('histOv'))closeHist();}

// ── Reminders ──────────────────────────────────────────────
function schedRem(t){
  if(!t.reminderDays||!t.dueDate||Notification.permission!=='granted') return;
  const due=new Date(t.dueDate+'T09:00:00');
  const alertAt=new Date(due.getTime()-Number(t.reminderDays)*86400000);
  const delay=alertAt-new Date();
  if(delay<=0) return;
  setTimeout(()=>new Notification('WorkTrack — Lembrete',{body:`"${t.title}" vence em ${t.reminderDays} dia(s)`}),delay);
}
function checkReminders(){
  if(Notification.permission!=='granted') return;
  const now=new Date();
  allTasks.filter(t=>t.reminderDays&&t.dueDate&&!t.completed).forEach(t=>{
    const due=new Date(t.dueDate+'T09:00:00');
    const alertAt=new Date(due.getTime()-Number(t.reminderDays)*86400000);
    const delay=alertAt-now;
    if(delay>0&&delay<86400000) {
      setTimeout(()=>new Notification('WorkTrack — Lembrete',{body:`"${t.title}" vence em ${t.reminderDays} dia(s)`}),delay);
    }
  });
}
function enableNotif(){
  Notification.requestPermission().then(p=>{
    if(p==='granted'){
      document.getElementById('notifBar').style.display='none';
      showToast('✓ Notificações ativadas!');
      new Notification('WorkTrack',{body:'Você receberá lembretes das suas tarefas.'});
    } else showToast('Permissão negada');
  });
}
