// ════ HISTÓRICO VIEW ══════════════════════════════════════════
let activeHistWeek = null; // {wn, yr}

function renderHistView(){
  // Build week map from completed tasks
  const map = {};
  allTasks.filter(t => t.completed).forEach(t => {
    // Use completedAt week if available, else task week
    let wn = t.weekNum, yr = t.year;
    if(t.completedAt){
      const d = new Date(t.completedAt+'T12:00');
      wn = isoWeek(d); yr = d.getFullYear();
    }
    const k = `${yr}-${String(wn).padStart(2,'0')}`;
    if(!map[k]) map[k]={wn,yr,tasks:[]};
    map[k].tasks.push(t);
  });

  const sorted = Object.values(map).sort((a,b) =>
    b.yr!==a.yr ? (b.yr||0)-(a.yr||0) : (b.wn||0)-(a.wn||0)
  );

  const cwn = isoWeek(new Date()), cyr = new Date().getFullYear();
  const chips = document.getElementById('histWeekChips');
  const content = document.getElementById('histContent');

  if(!sorted.length){
    chips.innerHTML = '<span style="font-size:12px;color:var(--text3)">Nenhuma tarefa concluída ainda</span>';
    content.innerHTML = '';
    return;
  }

  // Auto-select current week or most recent
  if(!activeHistWeek){
    const curr = sorted.find(w=>w.wn===cwn&&w.yr===cyr);
    activeHistWeek = curr || sorted[0];
  }

  chips.innerHTML = sorted.map(w => {
    const isCurr = w.wn===cwn && w.yr===cyr;
    const isActive = activeHistWeek && w.wn===activeHistWeek.wn && w.yr===activeHistWeek.yr;
    return `<button class="hist-wk-chip${isActive?' active':''}${isCurr?' curr-wk':''}"
      onclick="selectHistWeek(${w.wn},${w.yr})">
      Sem ${w.wn}${isCurr?' ·atual':''}
    </button>`;
  }).join('');

  renderHistContent(map);
}

function selectHistWeek(wn, yr){
  activeHistWeek = {wn, yr};
  renderHistView();
}

function renderHistContent(map){
  if(!activeHistWeek){ return; }
  const k = `${activeHistWeek.yr}-${String(activeHistWeek.wn).padStart(2,'0')}`;
  const week = map[k];
  const content = document.getElementById('histContent');
  if(!week){content.innerHTML='';return;}

  const tasks = week.tasks;
  const total = tasks.length;
  const onTime = tasks.filter(t => {
    if(!t.dueDate || !t.completedAt) return false;
    return t.completedAt <= t.dueDate;
  }).length;
  const late = tasks.filter(t => {
    if(!t.dueDate || !t.completedAt) return false;
    return t.completedAt > t.dueDate;
  }).length;
  const noDue = total - onTime - late;
  const pctOnTime = total ? Math.round(onTime/total*100) : 0;
  const pctLate   = total ? Math.round(late/total*100)   : 0;

  // Get week date range
  const cwn=isoWeek(new Date()), cyr=new Date().getFullYear();
  const wkOffset = (activeHistWeek.wn-cwn)+(activeHistWeek.yr-cyr)*52;
  const wkDays = weekDays(wkOffset);
  const rangeStr = `${ptDate(wkDays[0])} — ${ptDate(wkDays[4])}`;

  content.innerHTML = `
    <div style="font-size:11px;color:var(--text3);margin-bottom:12px">
      Semana ${activeHistWeek.wn} · ${activeHistWeek.yr} &nbsp;·&nbsp; ${rangeStr}
    </div>
    <div class="hist-gerencial">
      <div class="ger-card">
        <div class="ger-val" style="color:var(--green)">${onTime}</div>
        <div class="ger-lbl">No prazo</div>
        <div class="ger-bar"><div class="ger-bar-fill" style="width:${pctOnTime}%;background:var(--green)"></div></div>
      </div>
      <div class="ger-card">
        <div class="ger-val" style="color:var(--red)">${late}</div>
        <div class="ger-lbl">Com atraso</div>
        <div class="ger-bar"><div class="ger-bar-fill" style="width:${pctLate}%;background:var(--red)"></div></div>
      </div>
      <div class="ger-card">
        <div class="ger-val">${total}</div>
        <div class="ger-lbl">Total concluídas</div>
        <div class="ger-bar"><div class="ger-bar-fill" style="width:100%;background:var(--blue)"></div></div>
      </div>
    </div>
    <div class="hist-tasks-hdr">Atividades concluídas</div>
    ${tasks.sort((a,b)=>(b.completedAt||'').localeCompare(a.completedAt||'')).map(t => {
      let badge='', badgeClass='badge-nodue';
      if(t.dueDate && t.completedAt){
        if(t.completedAt <= t.dueDate){
          badge='No prazo'; badgeClass='badge-ontime';
        } else {
          const diff = Math.round((new Date(t.completedAt+'T12:00')-new Date(t.dueDate+'T12:00'))/86400000);
          badge=diff+'d atraso'; badgeClass='badge-late';
        }
      }
      const catLabel = CATS[t.category]||'Tarefas';
      const catClass = 'tag-'+(t.category||'tarefas');
      const completedStr = t.completedAt
        ? new Date(t.completedAt+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})
        : '';
      return `<div class="hist-task-row">
        <div style="flex:1;min-width:0">
          <div class="hist-task-title">${esc(t.title)}</div>
          <div style="margin-top:3px"><span class="tag ${catClass}">${catLabel}</span></div>
        </div>
        ${badge?`<span class="hist-task-badge ${badgeClass}">${badge}</span>`:''}
        ${completedStr?`<div class="hist-task-date">✓ ${completedStr}</div>`:''}
      </div>`;
    }).join('')}
  `;
}
// ════ FIM HISTÓRICO ════════════════════════════════════════════
