// ════ CUSTOM DATEPICKER ════
let dpYear=new Date().getFullYear(), dpMonth=new Date().getMonth(), dpValue='';

function toggleDp(){
  let cal=document.getElementById('dpCal');
  if(cal){
    // already open — close
    cal.remove();
    document.removeEventListener('click',dpOutsideClick);
    return;
  }
  // build calendar and append to body
  if(dpValue){const d=new Date(dpValue+'T12:00');dpYear=d.getFullYear();dpMonth=d.getMonth();}
  else{dpYear=new Date().getFullYear();dpMonth=new Date().getMonth();}
  cal=document.createElement('div');
  cal.id='dpCal';
  cal.className='dp-cal';
  cal.innerHTML=`
    <div class="dp-nav">
      <button class="dp-nav-btn" type="button" onclick="dpMove(-1)">&#8249;</button>
      <span class="dp-month-lbl" id="dpMonthLbl"></span>
      <button class="dp-nav-btn" type="button" onclick="dpMove(1)">&#8250;</button>
    </div>
    <div class="dp-grid-header">
      <span class="dp-wk-lbl">Nº</span>
      <span>Se</span><span>Te</span><span>Qu</span><span>Qu</span><span>Se</span><span>Sá</span><span>Do</span>
    </div>
    <div id="dpGrid"></div>
    <div class="dp-footer">
      <button class="dp-clear-btn" type="button" onclick="dpClear()">Limpar</button>
      <button class="dp-today-btn" type="button" onclick="dpSelectToday()">Hoje</button>
    </div>`;
  document.body.appendChild(cal);
  // position it
  const inp=document.getElementById('dpInput');
  const rect=inp.getBoundingClientRect();
  cal.style.top=(rect.bottom+window.scrollY+6)+'px';
  cal.style.left=(rect.left+window.scrollX)+'px';
  renderDp();
  // adjust if overflows right
  const calW=cal.offsetWidth||270;
  if(rect.left+calW>window.innerWidth-8){
    cal.style.left=Math.max(8, window.innerWidth-calW-8)+'px';
  }
  setTimeout(()=>document.addEventListener('click',dpOutsideClick),10);
}
function dpOutsideClick(e){
  const cal=document.getElementById('dpCal');
  const wrap=document.getElementById('dpWrap');
  if(cal && !cal.contains(e.target) && !wrap.contains(e.target)){
    cal.remove();
    document.removeEventListener('click',dpOutsideClick);
  }
}
function dpMove(dir){dpMonth+=dir;if(dpMonth>11){dpMonth=0;dpYear++;}else if(dpMonth<0){dpMonth=11;dpYear--;}renderDp();}

function renderDp(){
  document.getElementById('dpMonthLbl').textContent=MONTHS[dpMonth]+' '+dpYear;
  const grid=document.getElementById('dpGrid');
  grid.innerHTML='';
  const first=new Date(dpYear,dpMonth,1);
  const startDow=(first.getDay()+6)%7; // 0=Mon...6=Sun
  const dim=new Date(dpYear,dpMonth+1,0).getDate();
  const prev=new Date(dpYear,dpMonth,0).getDate();
  // build 6 rows max
  const cells=[];
  for(let i=0;i<startDow;i++) cells.push({d:new Date(dpYear,dpMonth-1,prev-startDow+1+i),other:true});
  for(let d=1;d<=dim;d++) cells.push({d:new Date(dpYear,dpMonth,d),other:false});
  const rows=Math.ceil(cells.length/7);
  for(let i=0;i<rows*7-cells.length;i++) cells.push({d:new Date(dpYear,dpMonth+1,i+1),other:true});
  for(let r=0;r<rows;r++){
    const row=document.createElement('div'); row.className='dp-row';
    // ISO week is defined by the Thursday — use Thursday of this row
    const thursday=new Date(cells[r*7].d);
    thursday.setDate(thursday.getDate()+3); // Monday+3 = Thursday
    const wn=isoWeek(thursday);
    const wnEl=document.createElement('div'); wnEl.className='dp-week-num'; wnEl.textContent=wn;
    row.appendChild(wnEl);
    for(let c=0;c<7;c++){
      const {d,other}=cells[r*7+c];
      const ds=fmtD(d);
      const el=document.createElement('div');
      el.className='dp-day'+(other?' other-month':'')+(ds===today()?' today':'')+(ds===dpValue?' selected':'');
      el.textContent=d.getDate();
      el.onclick=(e)=>{e.stopPropagation();dpSelect(ds);};
      row.appendChild(el);
    }
    grid.appendChild(row);
  }
}
function dpSelect(ds){
  dpValue=ds;
  document.getElementById('tDue').value=ds;
  const d=new Date(ds+'T12:00');
  const wn=isoWeek(d);
  document.getElementById('dpDisplay').textContent=
    d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})+' · Sem '+wn;
  document.getElementById('dpInput').classList.add('has-val');
  dpCloseCal();
}
function dpClear(){
  dpValue='';
  document.getElementById('tDue').value='';
  document.getElementById('dpDisplay').textContent='Selecionar data';
  document.getElementById('dpInput').classList.remove('has-val');
  dpCloseCal();
}
function dpSelectToday(){dpSelect(today());}
function dpSetValue(v){
  if(v){dpSelect(v);}else{dpValue='';document.getElementById('tDue').value='';document.getElementById('dpDisplay').textContent='Selecionar data';document.getElementById('dpInput').classList.remove('has-val');}
}
