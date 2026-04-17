// ══════════════════════════════════════════════════
// KANBAN + DRAG & DROP
// ══════════════════════════════════════════════════
function renderKanban(){
  const board=document.getElementById('kanbanBoard');
  const cols=[
    {id:'todo',   label:'A fazer',       dot:'var(--text3)'},
    {id:'doing',  label:'Em andamento',  dot:'var(--amber)'},
    {id:'review', label:'Em revisão',    dot:'var(--blue)'},
    {id:'done',   label:'Concluído',     dot:'var(--green)'},
  ];
  board.innerHTML='';
  // Current week range for filtering "done" column
  const kwDays=weekDays(0), kwStart=fmtD(kwDays[0]), kwEnd=fmtD(kwDays[4]);
  cols.forEach(col=>{
    let tasks=allTasks.filter(t=>getStatus(t)===col.id);
    // Concluído: only show tasks completed this week (or no completedAt yet)
    if(col.id==='done'){
      tasks=tasks.filter(t=>!t.completedAt || (t.completedAt>=kwStart && t.completedAt<=kwEnd));
    }
    const colEl=document.createElement('div');
    colEl.className=`k-col k-${col.id}`;
    colEl.innerHTML=`
      <div class="k-col-hdr">
        <div class="k-col-title"><div class="k-col-dot" style="background:${col.dot}"></div>${col.label}</div>
        <span class="k-col-count">${tasks.length}</span>
      </div>
      <div class="k-col-body" id="kcol-${col.id}" data-col="${col.id}">
        ${tasks.length===0?'<div class="k-empty">Arraste tarefas aqui</div>':''}
      </div>`;
    board.appendChild(colEl);

    const body=document.getElementById(`kcol-${col.id}`);
    // Drop zone events
    body.addEventListener('dragover',e=>{
      e.preventDefault();
      body.classList.add('drag-over');
      // placeholder
      const existing=body.querySelector('.k-placeholder');
      if(!existing){
        const ph=document.createElement('div');
        ph.className='k-placeholder';
        body.appendChild(ph);
      }
    });
    body.addEventListener('dragleave',e=>{
      if(!body.contains(e.relatedTarget)){
        body.classList.remove('drag-over');
        body.querySelector('.k-placeholder')?.remove();
      }
    });
    body.addEventListener('drop',e=>{
      e.preventDefault();
      body.classList.remove('drag-over');
      body.querySelector('.k-placeholder')?.remove();
      if(dragTask && dragTask.id){
        const taskId=dragTask.id;
        const newStatus=col.id;
        const completed=newStatus==='done';
        dragTask=null;
        const dropData = {status:newStatus, completed};
        if(newStatus==='done') dropData.completedAt = fmtD(new Date());
        else dropData.completedAt = null;
        db.collection('tasks').doc(taskId).update(dropData)
          .then(()=>{
            const t=allTasks.find(t=>t.id===taskId);
            if(t){t.status=newStatus;t.completed=completed;t.completedAt=dropData.completedAt;}
            renderKanban();
            showToast(`→ ${STATUS_LABELS[newStatus]}`);
          });
      } else {
        dragTask=null;
      }
    });

    tasks.forEach(t=>body.appendChild(buildKCard(t)));

    const addBtn=document.createElement('button');
    addBtn.className='k-add-btn';
    addBtn.innerHTML='<svg viewBox="0 0 24 24" stroke-width="2"><path d="M12 4v16m8-8H4"/></svg> Nova tarefa';
    addBtn.onclick=()=>openAdd(null,col.id);
    colEl.appendChild(addBtn);
  });
}

function getStatus(t){
  if(t.status) return t.status;
  return t.completed?'done':'todo';
}

function buildKCard(t){
  const el=document.createElement('div');
  const st=getStatus(t);
  el.className='k-card'+(st==='done'?' done-card':'');
  el.draggable=true;
  el.dataset.id=t.id;

  el.addEventListener('dragstart',e=>{
    dragTask=t;
    el.classList.add('dragging');
    e.dataTransfer.effectAllowed='move';
  });
  el.addEventListener('dragend',()=>el.classList.remove('dragging'));

  const ds=t.completed ? null : dueStatus(t.dueDate); // hide atraso when done
  el.innerHTML=`
    <div class="k-card-top">
      <div class="k-card-title">${esc(t.title)}</div>
    </div>
    <div class="k-card-meta">
      <span class="tag tag-${t.category||'tarefas'}">${CATS[t.category]||'Tarefas'}</span>
      ${ds?`<span class="k-card-due ${ds.cls}"><svg viewBox="0 0 24 24" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/></svg>${ds.txt}</span>`:''}
      ${t.notes?`<span style="font-size:10px;color:var(--text3)">📝</span>`:''}
    </div>
    ${t.completedAt?`<div class="k-card-completed"><svg viewBox="0 0 24 24" stroke-width="1.75"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>Concluído em ${new Date(t.completedAt+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})}</div>`:''}`;
  el.addEventListener('click',e=>{if(!e.target.closest('.k-mv'))openEdit(t);});
  return el;
}
