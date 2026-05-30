document.getElementById('loginForm').addEventListener('submit', function(e){
  e.preventDefault();
  const username = document.getElementById('username').value.trim() || 'user';
  const role = document.getElementById('role').value;
  localStorage.setItem('absensi_user', JSON.stringify({username, role, loginAt:new Date().toISOString()}));
  window.location.href = 'dashboard.html';
});
