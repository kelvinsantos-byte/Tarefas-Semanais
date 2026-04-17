// ══════════════════════════════════════════════════
// WEEKLY
// ══════════════════════════════════════════════════
function refreshWeeklyHdr(){
  const days=weekDays(wOffset), wn=isoWeek(days[0]);
  document.getElementById('wRange').textContent=`${ptDate(days[0])} — ${ptDate(days[4])}`;
  document.getElementById('wSub').textContent=`Semana ${wn} de ${days[0].getFullYear()}`;
  document.getElementById('todayPill').style.display=wOffset!==0?'inline-block':'none';
}
function chWeek(d){wOffset+=d;refreshWeeklyHdr();renderWeekly();}
function goToday(){wOffset=0;refreshWeeklyHdr();renderWeekly();}

function renderWeekly(){
  const days=weekDays(wOffset);
  const start=fmtD(days[0]),end=fmtD(days[4]);
  // tasks that have dueDate OR date in this week
  const wTasks=allTasks.filter(t=>{
    const d=t.dueDate||t.date||'';
    return d>=start&&d<=end;
  });
  const total=wTasks.length, done=wTasks.filter(t=>t.completed).length;
  const overdue=wTasks.filter(t=>!t.completed&&(t.dueDate||t.date||'')<=today()&&(t.dueDate||t.date||'')>=start).length;
  const pend=total-done;
  const pct=total?Math.round(done/total*100):0;
  document.getElementById('sTotal').textContent=total;
  document.getElementById('sDone').textContent=done;
  document.getElementById('sLate').textContent=overdue;
  document.getElementById('sPend').textContent=pend;
  document.getElementById('pFill').style.width=pct+'%';
  document.getElementById('pLbl').textContent=`${pct}% concluído`;

  const grid=document.getElementById('wgrid');
  grid.innerHTML='';
  days.forEach((date,i)=>{
    const ds=fmtD(date);
    const dt=allTasks.filter(t=>(t.dueDate||t.date||'')===ds);
    const done2=dt.filter(t=>t.completed).length;
    const overdueCount=dt.filter(t=>!t.completed&&ds<today()).length;
    const pct2=dt.length?Math.round(done2/dt.length*100):0;
    const isT=ds===today();
    const col=document.createElement('div');
    col.className='day-col'+(isT?' today':'')+(overdueCount>0?' has-overdue':'');
    col.innerHTML=`
      <div class="day-hdr">
        <div class="day-top">
          <div><div class="day-dow">${DAYS[i]}</div><div class="day-num">${date.getDate()}</div></div>
          ${isT?'<div class="td-dot"></div>':''}
        </div>
        <div class="day-meta">
          ${dt.length?`${done2}/${dt.length}`:'sem tarefas'}
          ${overdueCount>0?`<span class="overdue-badge">${overdueCount} atrasada${overdueCount>1?'s':''}</span>`:''}
        </div>
        ${dt.length?`<div class="day-prog"><div class="day-prog-fill" style="width:${pct2}%"></div></div>`:''}
      </div>
      <div class="day-body" id="wd-${ds}"></div>
      <button class="day-add" onclick="openAdd('${ds}',null)">
        <svg viewBox="0 0 24 24" stroke-width="2"><path d="M12 4v16m8-8H4"/></svg> adicionar
      </button>`;
    grid.appendChild(col);
    const body=document.getElementById(`wd-${ds}`);
    if(!dt.length){
      body.innerHTML=`<div class="day-empty"><div class="empty-ring"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bg5)" stroke-width="2"><path d="M12 4v16m8-8H4"/></svg></div>Vazio</div>`;
    } else {
      dt.forEach(t=>{
        const overdue2=!t.completed&&ds<today();
        const ds2=dueStatus(t.dueDate||t.date);
        const el=document.createElement('div');
        el.className='w-task'+(t.completed?' done':'')+(overdue2?' overdue':'');
        el.innerHTML=`
          <div class="w-chk ${t.completed?'on':''}" onclick="toggleTask(event,'${t.id}',${!t.completed})">
            <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
          </div>
          <div class="w-task-info">
            <div class="w-task-title">${esc(t.title)}</div>
            ${ds2?`<div class="w-task-due ${ds2.cls}"><svg viewBox="0 0 24 24" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/></svg>${ds2.txt}</div>`:''}
          </div>`;
        el.addEventListener('click',e=>{if(!e.target.closest('.w-chk'))openEdit(t);});
        body.appendChild(el);
      });
    }
  });
}
