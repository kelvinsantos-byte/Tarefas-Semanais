// ══════════════════════════════════════════════════
// AGENDA
// ══════════════════════════════════════════════════
function renderCal(){
  document.getElementById('calMonth').textContent=`${MONTHS[calMonth_]} ${calYear}`;
  const grid=document.getElementById('calGrid');
  grid.innerHTML='';
  ['Se','Te','Qu','Qu','Se','Sá','Do'].forEach(d=>{const el=document.createElement('div');el.className='cal-dow';el.textContent=d;grid.appendChild(el);});
  const first=new Date(calYear,calMonth_,1);
  const startDow=(first.getDay()+6)%7; // Mon=0
  const dim=new Date(calYear,calMonth_+1,0).getDate();
  const prev=new Date(calYear,calMonth_,0).getDate();
  const taskDates=new Set(allTasks.map(t=>t.dueDate||t.date).filter(Boolean));
  const overdueDates=new Set(allTasks.filter(t=>!t.completed&&t.dueDate&&t.dueDate<today()).map(t=>t.dueDate));
  for(let i=0;i<startDow;i++) addCalDay(grid,new Date(calYear,calMonth_-1,prev-startDow+1+i),true,taskDates,overdueDates);
  for(let d=1;d<=dim;d++) addCalDay(grid,new Date(calYear,calMonth_,d),false,taskDates,overdueDates);
  const total=startDow+dim, rows=Math.ceil(total/7), rem=rows*7-total;
  for(let d=1;d<=rem;d++) addCalDay(grid,new Date(calYear,calMonth_+1,d),true,taskDates,overdueDates);
}
function addCalDay(grid,date,other,taskDates,overdueDates){
  const el=document.createElement('div'), ds=fmtD(date);
  el.className='cal-day'+(other?' other-month':'')+(ds===today()?' today':'')+(ds===selectedCalDate?' selected':'')+(overdueDates.has(ds)?' has-overdue':taskDates.has(ds)?' has-tasks':'');
  el.textContent=date.getDate();
  el.onclick=()=>{selectedCalDate=ds;renderCal();renderAgenda();};
  grid.appendChild(el);
}
function calPrev(){calMonth_--;if(calMonth_<0){calMonth_=11;calYear--;}renderCal();}
function calNext(){calMonth_++;if(calMonth_>11){calMonth_=0;calYear++;}renderCal();}

function renderAgenda(){
  const list=document.getElementById('agendaList');
  const start=new Date(selectedCalDate+'T12:00');
  const dates=Array.from({length:14},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d;});
  list.innerHTML=''; let hasAny=false;
  dates.forEach(date=>{
    const ds=fmtD(date);
    const dt=allTasks.filter(t=>(t.dueDate||t.date)===ds)
      .sort((a,b)=>(a.dueDate||'').localeCompare(b.dueDate||''));
    if(!dt.length) return;
    hasAny=true;
    const diff=Math.round((date-new Date(today()+'T12:00'))/86400000);
    const rel=diff===0?'Hoje':diff===1?'Amanhã':diff===-1?'Ontem':diff>0?`Em ${diff} dias`:`${Math.abs(diff)} dias atrás`;
    const isT=ds===today();
    const hdr=document.createElement('div');
    hdr.className='agenda-date-hdr';
    hdr.innerHTML=`
      <div class="agenda-date-num${isT?' today':''}">${date.getDate()}</div>
      <div class="agenda-date-info"><div class="dow">${DAYS_FULL[date.getDay()]}, ${MONTHS[date.getMonth()]}</div><div class="rel">${rel}</div></div>
      <div class="agenda-sep"></div>
      <button class="agenda-add-btn" onclick="openAdd('${ds}',null)"><svg viewBox="0 0 24 24" stroke-width="2"><path d="M12 4v16m8-8H4"/></svg></button>`;
    list.appendChild(hdr);
    dt.forEach(t=>{
      const ds2=dueStatus(t.dueDate);
      const isOverdue=t.dueDate&&t.dueDate<today()&&!t.completed;
      const el=document.createElement('div');
      el.className='a-task'+(t.completed?' done':'')+(isOverdue?' overdue-task':'');
      el.innerHTML=`
        <div class="a-chk ${t.completed?'on':''}" onclick="toggleTask(event,'${t.id}',${!t.completed})">
          <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
        </div>
        <div class="a-info">
          <div class="a-title">${esc(t.title)}</div>
          <div class="a-meta">
            <span class="tag tag-${t.category||'tarefas'}">${CATS[t.category]||'Tarefas'}</span>
            ${ds2?`<span class="a-due ${ds2.cls}"><svg viewBox="0 0 24 24" stroke-width="1.75"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/></svg>${ds2.txt}</span>`:''}
            <span style="font-size:10px;color:var(--text3)">${STATUS_LABELS[getStatus(t)]}</span>
          </div>
        </div>`;
      el.addEventListener('click',e=>{if(!e.target.closest('.a-chk'))openEdit(t);});
      list.appendChild(el);
    });
  });
  if(!hasAny) list.innerHTML=`<div class="a-no-tasks"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/></svg>Nenhuma tarefa neste período.</div>`;
}
