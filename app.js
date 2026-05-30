const qs = (s, root=document) => root.querySelector(s);
const qsa = (s, root=document) => [...root.querySelectorAll(s)];
const storeKey = 'absensi_web_pro_data_v1';
const user = JSON.parse(localStorage.getItem('absensi_user') || '{"username":"Demo","role":"Admin"}');
const todayIso = new Date().toISOString().slice(0,10);

const seed = {
  settings: { schoolName:'SMK Contoh Mandiri', schoolYear:'2025/2026', semester:'Genap' },
  classes: [
    {id:'X TKJ', name:'X TKJ', homeroom:'Wali Kelas X TKJ', major:'Teknik Komputer dan Jaringan'},
    {id:'XI TKJ', name:'XI TKJ', homeroom:'Wali Kelas XI TKJ', major:'Teknik Komputer dan Jaringan'},
    {id:'XII TKJ', name:'XII TKJ', homeroom:'Wali Kelas XII TKJ', major:'Teknik Komputer dan Jaringan'}
  ],
  students: [
    {nisn:'010001', name:'Andi Saputra', className:'X TKJ', gender:'Laki-laki', address:'Tounsaru'},
    {nisn:'010002', name:'Bella Lestari', className:'X TKJ', gender:'Perempuan', address:'Tondano'},
    {nisn:'010003', name:'Citra Mamonto', className:'X TKJ', gender:'Perempuan', address:'Koya'},
    {nisn:'010004', name:'Dimas Rompas', className:'X TKJ', gender:'Laki-laki', address:'Kawangkoan'},
    {nisn:'020001', name:'Eka Sanger', className:'XI TKJ', gender:'Perempuan', address:'Remboken'},
    {nisn:'020002', name:'Farel Tampi', className:'XI TKJ', gender:'Laki-laki', address:'Tomohon'},
    {nisn:'030001', name:'Gita Lumowa', className:'XII TKJ', gender:'Perempuan', address:'Manado'},
    {nisn:'030002', name:'Hendra Kawatu', className:'XII TKJ', gender:'Laki-laki', address:'Langowan'}
  ],
  teachers: [
    {id:'G001', name:'Admin Sekolah', username:'admin', role:'Admin', contact:'admin@sekolah.sch.id'},
    {id:'G002', name:'Wali Kelas X TKJ', username:'walixtkj', role:'Guru/Wali Kelas', contact:'0812-0000-0001'},
    {id:'G003', name:'Kepala Sekolah', username:'kepsek', role:'Kepala Sekolah', contact:'0812-0000-0002'}
  ],
  attendance: {}
};
let data = load();

function load(){
  const raw = localStorage.getItem(storeKey);
  if(!raw){ localStorage.setItem(storeKey, JSON.stringify(seed)); return structuredClone(seed); }
  try { return JSON.parse(raw); } catch { localStorage.setItem(storeKey, JSON.stringify(seed)); return structuredClone(seed); }
}
function save(){ localStorage.setItem(storeKey, JSON.stringify(data)); }
function toast(msg='Data berhasil disimpan.'){ const t=qs('#toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200); }
function formatDate(iso){ if(!iso) return '-'; return new Date(iso+'T00:00:00').toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'}); }
function getKey(date, className){ return `${date}__${className}`; }
function countStatuses(records){ const base={Hadir:0,Izin:0,Sakit:0,Alfa:0,Terlambat:0}; records.forEach(r=>base[r.status]=(base[r.status]||0)+1); return base; }
function studentsByClass(cls){ return data.students.filter(s=>s.className===cls).sort((a,b)=>a.name.localeCompare(b.name)); }
function attendanceRecords(date, cls){
  const key = getKey(date, cls);
  const saved = data.attendance[key] || {};
  return studentsByClass(cls).map(s => ({nisn:s.nisn, name:s.name, className:cls, status:saved[s.nisn]?.status || 'Hadir', note:saved[s.nisn]?.note || ''}));
}

function init(){
  qs('#userText').textContent = user.username || 'User';
  qs('#roleText').textContent = user.role || 'Admin';
  const now = new Date();
  qs('#todayName').textContent = now.toLocaleDateString('id-ID',{weekday:'long'});
  qs('#todayDate').textContent = now.toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'});
  setupNav(); setupModals(); setupForms(); setupFilters(); populateOptions(); renderAll(); applyRoleAccess();
  qs('#attendanceDate').value = todayIso;
  qs('#reportStart').value = todayIso; qs('#reportEnd').value = todayIso;
  qs('#logoutBtn').onclick = () => { localStorage.removeItem('absensi_user'); window.location.href='index.html'; };
  qs('#menuBtn').onclick = () => qs('#sidebar').classList.toggle('show');
  qs('#saveAttendance').onclick = saveAttendance;
  qs('#exportCsv').onclick = exportCsv;
  qs('#printReport').onclick = () => window.print();
  qs('#saveSettings').onclick = saveSettings;
}
function setupNav(){
  qsa('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>{
    qsa('.nav-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
    qsa('.page').forEach(p=>p.classList.remove('active')); qs(`#page-${btn.dataset.page}`).classList.add('active');
    qs('#pageTitle').textContent = btn.textContent.trim(); qs('#sidebar').classList.remove('show');
    if(btn.dataset.page==='laporan') renderReport();
  }));
}
function applyRoleAccess(){
  const role = user.role || 'Admin';
  if(role === 'Kepala Sekolah' || role === 'Siswa/Orang Tua'){
    qsa('[data-page="siswa"],[data-page="guru"],[data-page="kelas"],[data-page="absensi"],[data-page="pengaturan"]').forEach(b=>b.style.display='none');
    qsa('[data-open], .mini-btn, #saveAttendance, #saveSettings').forEach(b=>b.disabled=true);
  }
  if(role === 'Guru/Wali Kelas'){
    qsa('[data-page="guru"],[data-page="pengaturan"]').forEach(b=>b.style.display='none');
  }
}
function populateOptions(){
  const opts = data.classes.map(c=>`<option value="${c.name}">${c.name}</option>`).join('');
  ['filterStudentClass','attendanceClass','studentClass','adminStudentClass','reportClass'].forEach(id=>{
    const el=qs('#'+id); if(!el) return;
    const all = (id==='filterStudentClass'||id==='reportClass') ? '<option value="">Semua Kelas</option>' : '';
    el.innerHTML = all + opts;
  });
}
function renderAll(){ populateOptions(); renderDashboard(); renderAdminStudents(); renderStudents(); renderTeachers(); renderClasses(); renderAttendance(); renderReport(); renderSettings(); }
function renderDashboard(){
  const records = attendanceRecords(todayIso, data.classes[0]?.name || 'X TKJ');
  const counts = countStatuses(records);
  qs('#statsGrid').innerHTML = [ ['Hadir',counts.Hadir], ['Izin',counts.Izin], ['Sakit',counts.Sakit], ['Alfa',counts.Alfa] ].map(([k,v])=>`<article class="stat-card"><b>${v}</b><span>${k}</span></article>`).join('');
  const recent = Object.keys(data.attendance).slice(-5).reverse();
  qs('#recentActivity').innerHTML = recent.length ? recent.map(k=>{const [date,cls]=k.split('__'); const c=countStatuses(Object.values(data.attendance[k])); return `<div class="activity-item"><strong>${cls} - ${formatDate(date)}</strong><span>Hadir ${c.Hadir||0}, Izin ${c.Izin||0}, Sakit ${c.Sakit||0}, Alfa ${c.Alfa||0}, Terlambat ${c.Terlambat||0}</span></div>`}).join('') : '<p class="empty">Belum ada aktivitas absensi tersimpan.</p>';
}
function renderAdminStudents(){
  const rowsEl = qs('#adminStudentRows');
  if(!rowsEl) return;
  const q = (qs('#adminSearchStudent')?.value || '').toLowerCase();
  const rows = data.students
    .filter(s => [s.nisn, s.name, s.className].join(' ').toLowerCase().includes(q))
    .sort((a,b)=>a.name.localeCompare(b.name));
  qs('#adminStudentTotal').textContent = `${data.students.length} Siswa`;
  rowsEl.innerHTML = rows.length ? rows.map(s=>`<tr><td>${s.nisn}</td><td>${s.name}</td><td>${s.className}</td><td><div class="table-actions"><button class="mini-btn" onclick="adminEditStudent('${s.nisn}')">Edit</button><button class="mini-btn danger" onclick="deleteStudent('${s.nisn}')">Hapus</button></div></td></tr>`).join('') : '<tr><td colspan="4" class="empty">Data siswa tidak ditemukan.</td></tr>';
}
function resetAdminStudentForm(){
  const form = qs('#adminStudentForm'); if(!form) return;
  form.reset(); qs('#adminStudentEdit').value=''; qs('#adminStudentSubmit').textContent='Tambah Siswa';
}
function saveStudentRecord(item, old=''){
  const nisnDuplicate = data.students.some(s => s.nisn === item.nisn && s.nisn !== old);
  if(nisnDuplicate){ toast('NISN sudah terdaftar. Gunakan NISN lain.'); return false; }
  data.students = old ? data.students.map(s=>s.nisn===old?item:s) : [...data.students,item];
  save(); renderAll(); return true;
}
function renderStudents(){
  const q = (qs('#searchStudent').value || '').toLowerCase(); const cls = qs('#filterStudentClass').value;
  const rows = data.students.filter(s=>(!cls||s.className===cls) && [s.nisn,s.name,s.className].join(' ').toLowerCase().includes(q));
  qs('#studentRows').innerHTML = rows.length ? rows.map(s=>`<tr><td>${s.nisn}</td><td>${s.name}</td><td>${s.className}</td><td>${s.gender}</td><td>${s.address}</td><td><div class="table-actions"><button class="mini-btn" onclick="editStudent('${s.nisn}')">Edit</button><button class="mini-btn danger" onclick="deleteStudent('${s.nisn}')">Hapus</button></div></td></tr>`).join('') : '<tr><td colspan="6" class="empty">Data siswa tidak ditemukan.</td></tr>';
}
function renderTeachers(){
  qs('#teacherRows').innerHTML = data.teachers.map(t=>`<tr><td>${t.id}</td><td>${t.name}</td><td>${t.username}</td><td>${t.role}</td><td>${t.contact||'-'}</td><td><div class="table-actions"><button class="mini-btn" onclick="editTeacher('${t.id}')">Edit</button><button class="mini-btn danger" onclick="deleteTeacher('${t.id}')">Hapus</button></div></td></tr>`).join('');
}
function renderClasses(){
  qs('#classCards').innerHTML = data.classes.map(c=>{ const total=studentsByClass(c.name).length; return `<article class="class-card"><h3>${c.name}</h3><p>${c.major}<br>Wali Kelas: <b>${c.homeroom}</b></p><div class="badge-row"><span class="badge">${total} Siswa</span><span class="badge">Aktif</span></div><div class="table-actions"><button class="mini-btn" onclick="editClass('${c.id}')">Edit</button><button class="mini-btn danger" onclick="deleteClass('${c.id}')">Hapus</button></div></article>` }).join('');
}
function renderAttendance(){
  const date = qs('#attendanceDate').value || todayIso; const cls = qs('#attendanceClass').value || data.classes[0]?.name; const term=(qs('#attendanceSearch').value||'').toLowerCase();
  const records = attendanceRecords(date, cls).filter(r=>[r.nisn,r.name].join(' ').toLowerCase().includes(term));
  const counts = countStatuses(attendanceRecords(date, cls));
  qs('#attendanceStats').innerHTML = ['Hadir','Izin','Sakit','Alfa'].map(k=>`<article class="stat-card"><b>${counts[k]||0}</b><span>${k}</span></article>`).join('');
  qs('#attendanceRows').innerHTML = records.length ? records.map(r=>`<tr data-nisn="${r.nisn}"><td>${r.nisn}</td><td>${r.name}</td><td><select class="status-select"><option ${r.status==='Hadir'?'selected':''}>Hadir</option><option ${r.status==='Izin'?'selected':''}>Izin</option><option ${r.status==='Sakit'?'selected':''}>Sakit</option><option ${r.status==='Alfa'?'selected':''}>Alfa</option><option ${r.status==='Terlambat'?'selected':''}>Terlambat</option></select></td><td><input class="note-input" value="${r.note}" placeholder="Keterangan opsional" /></td></tr>`).join('') : '<tr><td colspan="4" class="empty">Tidak ada siswa pada kelas ini.</td></tr>';
  qsa('.status-select').forEach(el=>el.onchange=()=>updateAttendanceStatsLive());
}
function updateAttendanceStatsLive(){ const rows=qsa('#attendanceRows tr[data-nisn]').map(tr=>({status:qs('.status-select',tr).value})); const c=countStatuses(rows); qs('#attendanceStats').innerHTML = ['Hadir','Izin','Sakit','Alfa'].map(k=>`<article class="stat-card"><b>${c[k]||0}</b><span>${k}</span></article>`).join(''); }
function saveAttendance(){
  const date=qs('#attendanceDate').value || todayIso; const cls=qs('#attendanceClass').value; const key=getKey(date,cls); data.attendance[key]={};
  qsa('#attendanceRows tr[data-nisn]').forEach(tr=>{ const nisn=tr.dataset.nisn; data.attendance[key][nisn]={status:qs('.status-select',tr).value,note:qs('.note-input',tr).value.trim()}; });
  save(); renderAll(); toast('Absensi berhasil disimpan.');
}
function renderReport(){
  const start=qs('#reportStart').value || todayIso, end=qs('#reportEnd').value || todayIso, cls=qs('#reportClass').value, type=qs('#reportType').value;
  const keys = Object.keys(data.attendance).filter(k=>{ const [d,c]=k.split('__'); return d>=start && d<=end && (!cls||c===cls); }).sort();
  if(type==='summary'){
    qs('#reportHead').innerHTML='<tr><th>Tanggal</th><th>Kelas</th><th>Hadir</th><th>Izin</th><th>Sakit</th><th>Alfa</th><th>Terlambat</th><th>Jumlah</th></tr>';
    qs('#reportRows').innerHTML = keys.length ? keys.map(k=>{const [d,c]=k.split('__'); const vals=Object.values(data.attendance[k]); const n=countStatuses(vals); return `<tr><td>${formatDate(d)}</td><td>${c}</td><td>${n.Hadir||0}</td><td>${n.Izin||0}</td><td>${n.Sakit||0}</td><td>${n.Alfa||0}</td><td>${n.Terlambat||0}</td><td>${vals.length}</td></tr>`}).join('') : '<tr><td colspan="8" class="empty">Belum ada laporan pada filter ini.</td></tr>';
  } else {
    qs('#reportHead').innerHTML='<tr><th>Tanggal</th><th>Kelas</th><th>NISN</th><th>Nama Siswa</th><th>Status</th><th>Keterangan</th></tr>';
    const rows=[]; keys.forEach(k=>{const [d,c]=k.split('__'); Object.entries(data.attendance[k]).forEach(([nisn,v])=>{ const s=data.students.find(x=>x.nisn===nisn); rows.push(`<tr><td>${formatDate(d)}</td><td>${c}</td><td>${nisn}</td><td>${s?.name||'-'}</td><td>${v.status}</td><td>${v.note||'-'}</td></tr>`); }); });
    qs('#reportRows').innerHTML = rows.length ? rows.join('') : '<tr><td colspan="6" class="empty">Belum ada detail laporan pada filter ini.</td></tr>';
  }
}
function renderSettings(){ qs('#schoolName').value=data.settings.schoolName; qs('#schoolYear').value=data.settings.schoolYear; qs('#semester').value=data.settings.semester; }
function saveSettings(){ data.settings={schoolName:qs('#schoolName').value, schoolYear:qs('#schoolYear').value, semester:qs('#semester').value}; save(); toast('Pengaturan berhasil disimpan.'); }
function setupFilters(){ ['searchStudent','filterStudentClass'].forEach(id=>qs('#'+id).addEventListener('input',renderStudents)); if(qs('#adminSearchStudent')) qs('#adminSearchStudent').addEventListener('input',renderAdminStudents); if(qs('#resetStudentForm')) qs('#resetStudentForm').addEventListener('click',resetAdminStudentForm); ['attendanceDate','attendanceClass','attendanceSearch'].forEach(id=>qs('#'+id).addEventListener('input',renderAttendance)); ['reportStart','reportEnd','reportClass','reportType'].forEach(id=>qs('#'+id).addEventListener('input',renderReport)); }
function setupModals(){ qsa('[data-open]').forEach(b=>b.onclick=()=>openModal(b.dataset.open)); qsa('[data-close]').forEach(b=>b.onclick=closeModals); qs('#overlay').onclick=closeModals; }
function openModal(id){ qs('#overlay').classList.add('show'); qs('#'+id).classList.add('show'); }
function closeModals(){ qs('#overlay').classList.remove('show'); qsa('.modal').forEach(m=>m.classList.remove('show')); qsa('.modal form').forEach(f=>f.reset()); ['studentEdit','teacherEdit','classEdit'].forEach(id=>qs('#'+id).value=''); }
function setupForms(){
  qs('#studentForm').onsubmit=e=>{ e.preventDefault(); const old=qs('#studentEdit').value; const item={nisn:qs('#studentNisn').value.trim(),name:qs('#studentName').value.trim(),className:qs('#studentClass').value,gender:qs('#studentGender').value,address:qs('#studentAddress').value.trim()}; if(saveStudentRecord(item, old)){ closeModals(); toast('Data siswa berhasil disimpan.'); } };
  if(qs('#adminStudentForm')) qs('#adminStudentForm').onsubmit=e=>{ e.preventDefault(); const old=qs('#adminStudentEdit').value; const item={nisn:qs('#adminStudentNisn').value.trim(),name:qs('#adminStudentName').value.trim(),className:qs('#adminStudentClass').value,gender:qs('#adminStudentGender').value,address:qs('#adminStudentAddress').value.trim()}; if(saveStudentRecord(item, old)){ resetAdminStudentForm(); toast(old ? 'Data siswa berhasil diperbarui.' : 'Siswa baru berhasil ditambahkan.'); } };
  qs('#teacherForm').onsubmit=e=>{ e.preventDefault(); const old=qs('#teacherEdit').value; const item={id:qs('#teacherId').value.trim(),name:qs('#teacherName').value.trim(),username:qs('#teacherUsername').value.trim(),role:qs('#teacherRole').value,contact:qs('#teacherContact').value.trim()}; data.teachers = old ? data.teachers.map(t=>t.id===old?item:t) : [...data.teachers,item]; save(); closeModals(); renderAll(); toast('Data guru berhasil disimpan.'); };
  qs('#classForm').onsubmit=e=>{ e.preventDefault(); const old=qs('#classEdit').value; const name=qs('#className').value.trim(); const item={id:old||name,name,homeroom:qs('#classHomeroom').value.trim(),major:qs('#classMajor').value.trim()}; data.classes = old ? data.classes.map(c=>c.id===old?item:c) : [...data.classes,item]; save(); closeModals(); renderAll(); toast('Data kelas berhasil disimpan.'); };
}
window.editStudent = nisn => { const s=data.students.find(x=>x.nisn===nisn); if(!s) return; qs('#studentEdit').value=s.nisn; qs('#studentNisn').value=s.nisn; qs('#studentName').value=s.name; qs('#studentClass').value=s.className; qs('#studentGender').value=s.gender; qs('#studentAddress').value=s.address; openModal('studentModal'); };
window.adminEditStudent = nisn => { const s=data.students.find(x=>x.nisn===nisn); if(!s) return; qs('#adminStudentEdit').value=s.nisn; qs('#adminStudentNisn').value=s.nisn; qs('#adminStudentName').value=s.name; qs('#adminStudentClass').value=s.className; qs('#adminStudentGender').value=s.gender; qs('#adminStudentAddress').value=s.address; qs('#adminStudentSubmit').textContent='Simpan Perubahan'; document.querySelector('[data-page="admin"]')?.click(); window.scrollTo({top:0,behavior:'smooth'}); };
window.deleteStudent = nisn => { if(confirm('Hapus data siswa ini?')){ data.students=data.students.filter(s=>s.nisn!==nisn); save(); renderAll(); toast('Data siswa dihapus.'); } };
window.editTeacher = id => { const t=data.teachers.find(x=>x.id===id); if(!t) return; qs('#teacherEdit').value=t.id; qs('#teacherId').value=t.id; qs('#teacherName').value=t.name; qs('#teacherUsername').value=t.username; qs('#teacherRole').value=t.role; qs('#teacherContact').value=t.contact; openModal('teacherModal'); };
window.deleteTeacher = id => { if(confirm('Hapus data guru ini?')){ data.teachers=data.teachers.filter(t=>t.id!==id); save(); renderAll(); toast('Data guru dihapus.'); } };
window.editClass = id => { const c=data.classes.find(x=>x.id===id); if(!c) return; qs('#classEdit').value=c.id; qs('#className').value=c.name; qs('#classHomeroom').value=c.homeroom; qs('#classMajor').value=c.major; openModal('classModal'); };
window.deleteClass = id => { if(confirm('Hapus data kelas ini?')){ data.classes=data.classes.filter(c=>c.id!==id); save(); renderAll(); toast('Data kelas dihapus.'); } };
function exportCsv(){
  const rows=[...qs('#reportTable').rows].map(row=>[...row.cells].map(c=>'"'+c.textContent.replace(/"/g,'""')+'"').join(','));
  const blob=new Blob([rows.join('\n')],{type:'text/csv;charset=utf-8;'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='laporan_absensi.csv'; a.click(); URL.revokeObjectURL(a.href);
}
init();
