// ── Toast ──────────────────────────────────────────────────
let _tt;
function showToast(msg){
  const el=document.getElementById('toast');
  el.textContent=msg;el.style.display='block';
  clearTimeout(_tt);_tt=setTimeout(()=>{el.style.display='none';},2600);
}

// ── Keyboard ───────────────────────────────────────────────
document.addEventListener('keydown',e=>{
  const inInput=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName);
  const inModal=document.getElementById('taskModal').style.display!=='none';
  if(e.key==='Escape'){closeModal();closeHist();dpCloseCal();}
  if(!inInput&&!inModal){
    if(e.key==='n'||e.key==='N') openAdd(null,null);
    if(e.key==='1') switchView('kanban');
    if(e.key==='2') switchView('agenda');
    if(e.key==='3') switchView('weekly');
    if(e.key==='4') switchView('notes');
    if(e.key==='5') switchView('hist');
    if(e.key==='h'||e.key==='H') openHistory();
    if(currentView==='weekly'){
      if(e.key==='ArrowLeft') chWeek(-1);
      if(e.key==='ArrowRight') chWeek(1);
      if(e.key==='t'||e.key==='T') goToday();
    }
  }
});

// PWA Manifest
(function(){
  const manifest = {
    name: "WorkTrack — Inteligência Operacional",
    short_name: "WorkTrack",
    description: "Controle de atividades semanais",
    start_url: "./",
    display: "standalone",
    background_color: "#0A0A0A",
    theme_color: "#0A0A0A",
    orientation: "portrait-primary",
    icons: [
      { src: "https://res.cloudinary.com/doo0fzoef/image/upload/v1775095045/Intelig%C3%AAncia_Metal_rkkbgd.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
    ]
  };
  const blob = new Blob([JSON.stringify(manifest)], {type:'application/manifest+json'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('link');
  link.rel = 'manifest'; link.href = url;
  document.head.appendChild(link);
})();
