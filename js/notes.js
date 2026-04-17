// ════ NOTAS ════════════════════════════════════════
let allNotes = [], activeNoteId = null, noteSaveTimer = null;

function renderNotesList(){
  const list = document.getElementById('notesList');
  if(!list) return;
  if(!allNotes.length){
    list.innerHTML = '<div class="note-empty-sidebar">Nenhuma nota ainda</div>';
    showNoteEditor(false); return;
  }
  list.innerHTML = allNotes
    .sort((a,b) => (b.updatedAt||'').localeCompare(a.updatedAt||''))
    .map(n => `
      <div class="note-item${n.id===activeNoteId?' active':''}" onclick="openNote('${n.id}')">
        <div class="note-item-title">${esc(n.title||'Sem título')}</div>
        <div class="note-item-preview">${esc((n.body||'').substring(0,50)||'Nota vazia...')}</div>
        <div class="note-item-date">${n.updatedAt ? new Date(n.updatedAt).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}) : ''}</div>
      </div>`).join('');
  if(activeNoteId){
    const note = allNotes.find(n=>n.id===activeNoteId);
    if(note) fillNoteEditor(note);
    else showNoteEditor(false);
  }
}

function loadNotes(){
  if(!db) return;
  db.collection('notes').orderBy('updatedAt','desc').get()
    .then(snap => {
      allNotes = snap.docs.map(d=>({id:d.id,...d.data()}));
      renderNotesList();
    }).catch(()=>{});
}

function newNote(){
  const note = {
    title: '',
    body: '',
    updatedAt: new Date().toISOString(),
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  db.collection('notes').add(note).then(ref => {
    const n = {...note, id: ref.id, updatedAt: new Date().toISOString()};
    allNotes.unshift(n);
    activeNoteId = ref.id;
    renderNotesList();
    showNoteEditor(true);
    fillNoteEditor(n);
    setTimeout(()=>document.getElementById('noteTitleInput').focus(), 80);
  });
}

function openNote(id){
  activeNoteId = id;
  const note = allNotes.find(n=>n.id===id);
  if(!note) return;
  showNoteEditor(true);
  fillNoteEditor(note);
  renderNotesList();
}

function fillNoteEditor(note){
  document.getElementById('noteTitleInput').value = note.title||'';
  document.getElementById('noteBodyInput').value  = note.body||'';
  document.getElementById('noteSaveIndicator').textContent = '';
}

function showNoteEditor(show){
  const empty   = document.getElementById('notesEmpty');
  const content = document.getElementById('noteEditorContent');
  if(empty)   empty.style.display   = show ? 'none' : 'flex';
  if(content) content.style.display = show ? 'flex' : 'none';
}

function schedNoteSave(){
  document.getElementById('noteSaveIndicator').textContent = 'Salvando...';
  clearTimeout(noteSaveTimer);
  noteSaveTimer = setTimeout(saveActiveNote, 900);
}

function saveActiveNote(){
  if(!activeNoteId) return;
  const title = document.getElementById('noteTitleInput').value;
  const body  = document.getElementById('noteBodyInput').value;
  const updatedAt = new Date().toISOString();
  db.collection('notes').doc(activeNoteId).update({title, body, updatedAt})
    .then(()=>{
      const n = allNotes.find(n=>n.id===activeNoteId);
      if(n){n.title=title;n.body=body;n.updatedAt=updatedAt;}
      document.getElementById('noteSaveIndicator').textContent = '✓ Salvo';
      setTimeout(()=>{ const el=document.getElementById('noteSaveIndicator'); if(el) el.textContent=''; }, 2000);
      renderNotesList();
    });
}

function deleteNote(){
  if(!activeNoteId || !confirm('Excluir esta nota?')) return;
  db.collection('notes').doc(activeNoteId).delete().then(()=>{
    allNotes = allNotes.filter(n=>n.id!==activeNoteId);
    activeNoteId = null;
    showNoteEditor(false);
    renderNotesList();
    showToast('Nota excluída');
  });
}
// ════ FIM NOTAS ════════════════════════════════════
