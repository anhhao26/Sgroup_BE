 // ========== 1. Khai báo biến toàn cục ==========
 const API_BASE = 'http://localhost:3000/api';
 let accessToken = null;
 let currentUser = null;          // { id, username, email, role }
 let currentPage = 1;
 const LIMIT = 5;                 // số poll hiển thị mỗi trang

 // ========== 2. Helpers ==========
 // Lưu / Lấy token vào localStorage
 function saveToken(token) {
   localStorage.setItem('accessToken', token);
   accessToken = token;
 }
 function loadToken() {
   const t = localStorage.getItem('accessToken');
   accessToken = t ? t : null;
 }
 function removeToken() {
   localStorage.removeItem('accessToken');
   accessToken = null;
 }

 // Chuyển ISO string sang định dạng "dd/MM/yyyy HH:mm"
 function formatDate(isoString) {
   if (!isoString) return '';
   const d = new Date(isoString);
   const day   = String(d.getDate()).padStart(2, '0');
   const month = String(d.getMonth() + 1).padStart(2, '0');
   const year  = d.getFullYear();
   const hour  = String(d.getHours()).padStart(2, '0');
   const min   = String(d.getMinutes()).padStart(2, '0');
   return `${day}/${month}/${year} ${hour}:${min}`;
 }

 // Tạo các header chung (Authorization)
 function getAuthHeaders() {
   return {
     'Content-Type': 'application/json',
     'Authorization': 'Bearer ' + accessToken
   };
 }

 // Xử lý lỗi chung từ fetch
 async function handleFetchRes(response) {
   if (!response.ok) {
     let errMsg = 'Lỗi khi gọi API';
     try {
       const j = await response.json();
       if (j.message) errMsg = j.message;
     } catch (e) { /* ignore */ }
     throw new Error(errMsg);
   }
   return response.json();
 }

 // ========== 3. DOM Elements ==========
 // Sections
 const loginSection             = document.getElementById('login-section');
 const registerSection          = document.getElementById('register-section');
 const pollsListSection         = document.getElementById('polls-list-section');
 const pollDetailSection        = document.getElementById('poll-detail-section');
 const adminPollFormSection     = document.getElementById('admin-poll-form-section');

 // Login form
 const loginForm      = document.getElementById('login-form');
 const loginUsername  = document.getElementById('login-username');
 const loginPassword  = document.getElementById('login-password');
 const loginError     = document.getElementById('login-error');
 const showRegisterLink = document.getElementById('show-register-link');

 // Register form
 const registerForm      = document.getElementById('register-form');
 const registerUsername  = document.getElementById('register-username');
 const registerEmail     = document.getElementById('register-email');
 const registerPassword  = document.getElementById('register-password');
 const registerError     = document.getElementById('register-error');
 const showLoginLink     = document.getElementById('show-login-link');

 // User info (ở header) & logout
 const userInfoDiv    = document.getElementById('user-info');
 const usernameDisplay= document.getElementById('username-display');
 const roleDisplay    = document.getElementById('role-display');
 const logoutBtn      = document.getElementById('logout-btn');

 // Polls list
 const pollsTableBody         = document.querySelector('#polls-table tbody');
 const pollsError             = document.getElementById('polls-error');
 const prevPageBtn            = document.getElementById('prev-page-btn');
 const nextPageBtn            = document.getElementById('next-page-btn');
 const currentPageSpan        = document.getElementById('current-page');
 const showCreatePollBtn      = document.getElementById('show-create-poll-btn');

 // Admin Poll form
 const adminPollForm          = document.getElementById('admin-poll-form');
 const formTitleEl            = document.getElementById('form-title');
 const editPollIdInput        = document.getElementById('edit-poll-id');
 const pollTitleInput         = document.getElementById('poll-title-input');
 const pollDescInput          = document.getElementById('poll-desc-input');
 const optionsInputGroup      = document.getElementById('options-input-group');
 const addOptionBtn           = document.getElementById('add-option-btn');
 const pollExpiresInput       = document.getElementById('poll-expires-input');
 const submitPollBtn          = document.getElementById('submit-poll-btn');
 const cancelPollBtn          = document.getElementById('cancel-poll-btn');
 const adminPollError         = document.getElementById('admin-poll-error');

 // Poll detail
 const backToListBtn         = document.getElementById('back-to-list-btn');
 const detailTitle           = document.getElementById('detail-title');
 const detailCreator         = document.getElementById('detail-creator');
 const detailCreatedAt       = document.getElementById('detail-createdAt');
 const detailLocked          = document.getElementById('detail-locked');
 const detailDesc            = document.getElementById('detail-description');
 const optionsContainer      = document.getElementById('options-container');
 const detailTotal           = document.getElementById('detail-total-votes');
 const detailError           = document.getElementById('detail-error');
 const voteActionsDiv        = document.getElementById('vote-actions');
 let pieChartInstance        = null;

 // ========== 4. Hàm Khởi tạo (Init) ==========
 window.addEventListener('DOMContentLoaded', () => {
   loadToken();
   if (accessToken) {
     // Nếu đã có token, gọi API /users/me để lấy thông tin user
     fetchUserProfile()
       .then(() => {
         showSection('polls-list');
         fetchPolls(currentPage);
       })
       .catch(() => {
         // Nếu token không hợp lệ, xóa và quay về login
         removeToken();
         showSection('login');
       });
   } else {
     showSection('login');
   }
 });

 // Hiện / ẩn section theo tên: 'login', 'register', 'polls-list', 'poll-detail', 'admin-form'
 function showSection(name) {
   loginSection.classList.add('hidden');
   registerSection.classList.add('hidden');
   pollsListSection.classList.add('hidden');
   pollDetailSection.classList.add('hidden');
   adminPollFormSection.classList.add('hidden');
   userInfoDiv.classList.add('hidden');

   if (name === 'login') {
     loginSection.classList.remove('hidden');
   } else if (name === 'register') {
     registerSection.classList.remove('hidden');
   } else if (name === 'polls-list') {
     pollsListSection.classList.remove('hidden');
     userInfoDiv.classList.remove('hidden');
   } else if (name === 'poll-detail') {
     pollDetailSection.classList.remove('hidden');
     userInfoDiv.classList.remove('hidden');
   } else if (name === 'admin-form') {
     pollsListSection.classList.remove('hidden');
     adminPollFormSection.classList.remove('hidden');
     userInfoDiv.classList.remove('hidden');
   }
 }

 // ========== 5. Chuyển giữa Login ↔ Register ==========
 // Khi bấm “Đăng ký” từ Login → sang Register
 showRegisterLink.addEventListener('click', (e) => {
   e.preventDefault();
   loginError.textContent = '';
   showSection('register');
 });
 // Khi bấm “Đăng nhập” từ Register → sang Login
 showLoginLink.addEventListener('click', (e) => {
   e.preventDefault();
   registerError.textContent = '';
   showSection('login');
 });

 // ========== 6. Đăng ký (POST /api/auth/register) ==========
 registerForm.addEventListener('submit', async (e) => {
   e.preventDefault();
   registerError.textContent = '';
   const username = registerUsername.value.trim();
   const email    = registerEmail.value.trim();
   const password = registerPassword.value.trim();

   if (!username || !email || !password) {
     registerError.textContent = 'Vui lòng điền đầy đủ thông tin.';
     return;
   }

   try {
     const resp = await fetch(API_BASE + '/auth/register', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ username, email, password })
     });
     await handleFetchRes(resp);
     // Sau khi đăng ký thành công, chuyển về Login
     alert('Đăng ký thành công! Vui lòng đăng nhập.');
     registerUsername.value = '';
     registerEmail.value = '';
     registerPassword.value = '';
     showSection('login');
   } catch (err) {
     registerError.textContent = err.message;
   }
 });

 // ========== 7. Đăng nhập / Logout ==========
 loginForm.addEventListener('submit', async (e) => {
   e.preventDefault();
   loginError.textContent = '';
   const username = loginUsername.value.trim();
   const password = loginPassword.value.trim();
   if (!username || !password) {
     loginError.textContent = 'Vui lòng nhập username và password.';
     return;
   }

   try {
     const resp = await fetch(API_BASE + '/auth/login', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ username, password })
     });
     const data = await handleFetchRes(resp);
     // Lưu token vào localStorage
     saveToken(data.data.accessToken);

     // Lấy profile
     await fetchUserProfile();

     // Chuyển sang trang danh sách Poll
     showSection('polls-list');
     fetchPolls(1);
   } catch (err) {
     loginError.textContent = err.message;
   }
 });

 logoutBtn.addEventListener('click', async (e) => {
   e.preventDefault();
   try {
     // Gọi API logout để xóa refreshToken (cookie) ở server
     await fetch(API_BASE + '/auth/logout', {
       method: 'POST',
       headers: getAuthHeaders()
     });
   } catch (_) {
     // Bỏ qua lỗi
   }
   removeToken();
   currentUser = null;
   loginUsername.value = '';
   loginPassword.value = '';
   showSection('login');
 });

 // Lấy thông tin user (GET /api/users/me)
 async function fetchUserProfile() {
   const resp = await fetch(API_BASE + '/users/me', {
     headers: getAuthHeaders()
   });
   const data = await handleFetchRes(resp);
   currentUser = data.data.user; // { id, username, email, role }
   usernameDisplay.textContent = currentUser.username;
   roleDisplay.textContent = currentUser.role;

   // Nếu là admin, hiển thị nút Create Poll
   if (currentUser.role === 'admin') {
     showCreatePollBtn.classList.remove('hidden');
     document.querySelectorAll('.admin-btn').forEach(el => el.classList.remove('hidden'));
   }
 }

 // ========== 8. Danh sách Poll (GET /api/polls?page=&limit=) ==========
 async function fetchPolls(page) {
   pollsError.textContent = '';
   pollsTableBody.innerHTML = '';
   currentPage = page;
   currentPageSpan.textContent = currentPage;

   try {
     const resp = await fetch(`${API_BASE}/polls?page=${page}&limit=${LIMIT}`, {
       headers: getAuthHeaders()
     });
     const data = await handleFetchRes(resp);
     const polls = data.data.polls; // mảng poll cơ bản
     const total = data.data.total;
     const totalPages = Math.ceil(total / LIMIT);

     // Chặn Prev / Next
     prevPageBtn.disabled = (page <= 1);
     nextPageBtn.disabled = (page >= totalPages);

     // Hiển thị each poll vào table
     if (polls.length === 0) {
       const tr = document.createElement('tr');
       tr.innerHTML = '<td colspan="6" style="text-align:center">Không có poll nào</td>';
       pollsTableBody.appendChild(tr);
     } else {
       polls.forEach(poll => {
         const tr = document.createElement('tr');

         // Nếu admin → hiển thị thêm Edit/Delete
         let adminActionsHtml = '';
         if (currentUser.role === 'admin') {
           adminActionsHtml = `
             <button class="edit-poll-btn" data-id="${poll.id}">Edit</button>
             <button class="delete-poll-btn" data-id="${poll.id}">Delete</button>
           `;
         }

         tr.innerHTML = `
           <td>${poll.title}</td>
           <td>${poll.creator.username}</td>
           <td>${formatDate(poll.createdAt)}</td>
           <td>${poll.isLocked ? 'Yes' : 'No'}</td>
           <td>${poll.votesCount}</td>
           <td>
             <button class="view-btn" data-id="${poll.id}">View</button>
             ${adminActionsHtml}
           </td>
         `;
         pollsTableBody.appendChild(tr);
       });
     }
   } catch (err) {
     pollsError.textContent = err.message;
   }
 }

 // Prev / Next page
 prevPageBtn.addEventListener('click', () => {
   if (currentPage > 1) fetchPolls(currentPage - 1);
 });
 nextPageBtn.addEventListener('click', () => {
   fetchPolls(currentPage + 1);
 });

 // Show form Create Poll khi bấm nút (admin)
 showCreatePollBtn.addEventListener('click', () => {
   openAdminForm('create');
 });

 // Reset & hiển thị form cho Create hoặc Edit
 function openAdminForm(mode, pollData = null) {
   adminPollError.textContent = '';
   optionsInputGroup.innerHTML = '';

   if (mode === 'create') {
     formTitleEl.textContent = 'Tạo Poll mới';
     submitPollBtn.textContent = 'Create Poll';
     editPollIdInput.value = '';
     pollTitleInput.value = '';
     pollDescInput.value = '';
     pollExpiresInput.value = '';
     // Mặc định tạo 2 option trống
     addOptionInput();
     addOptionInput();
   } else if (mode === 'edit' && pollData) {
     formTitleEl.textContent = 'Chỉnh sửa Poll';
     submitPollBtn.textContent = 'Update Poll';
     editPollIdInput.value = pollData.id;
     pollTitleInput.value = pollData.title;
     pollDescInput.value = pollData.description || '';
     if (pollData.expiresAt) {
       // Chuyển ISO → định dạng "YYYY-MM-DDThh:mm"
       const dt = new Date(pollData.expiresAt);
       const yyyy = dt.getFullYear();
       const mm = String(dt.getMonth() + 1).padStart(2, '0');
       const dd = String(dt.getDate()).padStart(2, '0');
       const hh = String(dt.getHours()).padStart(2, '0');
       const mi = String(dt.getMinutes()).padStart(2, '0');
       pollExpiresInput.value = `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
     } else {
       pollExpiresInput.value = '';
     }
     // Hiển thị option sẵn có
     pollData.options.forEach((opt, idx) => {
       addOptionInput(opt.text, opt.id);
     });
   }

   showSection('admin-form');
 }

 // Tạo một input mới cho option (admin)
 function addOptionInput(text = '', optId = '') {
   const idx = optionsInputGroup.children.length + 1;
   const div = document.createElement('div');
   div.className = 'form-group';
   div.innerHTML = `
     <label>Option ${idx}:</label>
     <input type="text" class="poll-option-input" data-opt-id="${optId}" value="${text}" required>
     <button type="button" class="remove-option-btn">x</button>
   `;
   optionsInputGroup.appendChild(div);

   // Bắt sự kiện xóa option này
   div.querySelector('.remove-option-btn').addEventListener('click', () => {
     optionsInputGroup.removeChild(div);
     // Đánh lại nhãn Option
     reindexOptionLabels();
   });
 }

 // Đánh lại nhãn “Option 1, Option 2, ...” sau khi xóa
 function reindexOptionLabels() {
   const groups = optionsInputGroup.querySelectorAll('.form-group');
   groups.forEach((g, i) => {
     g.querySelector('label').textContent = `Option ${i + 1}:`;
   });
 }

 addOptionBtn.addEventListener('click', () => {
   addOptionInput();
 });

 cancelPollBtn.addEventListener('click', () => {
   showSection('polls-list');
 });

 // Xử lý submit form để Create / Update Poll
 adminPollForm.addEventListener('submit', async (e) => {
   e.preventDefault();
   adminPollError.textContent = '';

   const isEdit = !!editPollIdInput.value;
   const title = pollTitleInput.value.trim();
   const description = pollDescInput.value.trim();
   const expiresValue = pollExpiresInput.value;
   const expiresAt = expiresValue ? new Date(expiresValue).toISOString() : null;

   // Thu thập tất cả option (chỉ lấy text, bỏ optId khi tạo mới)
   const optionInputs = optionsInputGroup.querySelectorAll('.poll-option-input');
   const optionTexts = [];
   optionInputs.forEach(inp => {
     const txt = inp.value.trim();
     if (txt) optionTexts.push(txt);
   });

   if (!title || optionTexts.length < 2) {
     adminPollError.textContent = 'Title và ít nhất 2 options là bắt buộc.';
     return;
   }

   try {
     if (!isEdit) {
       // Tạo Poll mới
       const body = { title, description, options: optionTexts };
       if (expiresAt) body.expiresAt = expiresAt;
       const resp = await fetch(API_BASE + '/polls', {
         method: 'POST',
         headers: getAuthHeaders(),
         body: JSON.stringify(body)
       });
       await handleFetchRes(resp);
     } else {
       // Update Poll
       const pollId = editPollIdInput.value;
       const body = { title, description };
       if (expiresAt) body.expiresAt = expiresAt;
       else body.expiresAt = null;

       const resp = await fetch(`${API_BASE}/polls/${pollId}`, {
         method: 'PUT',
         headers: getAuthHeaders(),
         body: JSON.stringify(body)
       });
       await handleFetchRes(resp);
     }

     // Quay lại list và reload
     showSection('polls-list');
     fetchPolls(currentPage);
   } catch (err) {
     adminPollError.textContent = err.message;
   }
 });

 // Delegate sự kiện Edit / Delete trong bảng polls
 pollsTableBody.addEventListener('click', async (e) => {
   // View Details
   if (e.target.classList.contains('view-btn')) {
     const pollId = e.target.dataset.id;
     showPollDetail(pollId);
     return;
   }

   // Edit Poll (admin)
   if (e.target.classList.contains('edit-poll-btn')) {
     const pollId = e.target.dataset.id;
     // Lấy chi tiết poll để prefill
     try {
       const resp = await fetch(`${API_BASE}/polls/${pollId}`, {
         headers: getAuthHeaders()
       });
       const data = await handleFetchRes(resp);
       const pollData = data.data; // chứa { id, title, description, options[], expiresAt, ... }
       openAdminForm('edit', pollData);
     } catch (err) {
       alert('Không thể load poll để edit: ' + err.message);
     }
     return;
   }

   // Delete Poll (admin)
   if (e.target.classList.contains('delete-poll-btn')) {
     const pollId = e.target.dataset.id;
     if (!confirm('Bạn có chắc muốn xóa poll này?')) return;
     try {
       const resp = await fetch(`${API_BASE}/polls/${pollId}`, {
         method: 'DELETE',
         headers: getAuthHeaders()
       });
       await handleFetchRes(resp);
       // Reload lại danh sách
       fetchPolls(currentPage);
     } catch (err) {
       alert('Xóa poll thất bại: ' + err.message);
     }
     return;
   }
 });

 // ========== 9. Chi tiết Poll (GET /api/polls/:id) ==========
 async function showPollDetail(pollId) {
   detailError.textContent = '';
   optionsContainer.innerHTML = '';
   detailTitle.textContent = 'Loading...';
   detailCreator.textContent = '';
   detailCreatedAt.textContent = '';
   detailLocked.textContent = '';
   detailDesc.textContent = '';
   detailTotal.textContent = 'Total votes: 0';
   voteActionsDiv.innerHTML = '';
   if (pieChartInstance) {
     pieChartInstance.destroy();
     pieChartInstance = null;
   }

   showSection('poll-detail');

   try {
     const resp = await fetch(`${API_BASE}/polls/${pollId}`, { headers: getAuthHeaders() });
     const data = await handleFetchRes(resp);
     const poll = data.data;
     /*
       poll = {
         id, title, description, options: [ { id, text, votes, userVote } ],
         creator: { id, username }, isLocked, createdAt, expiresAt, totalVotes
       }
     */

     // 1. Header
     detailTitle.textContent = poll.title;
     detailCreator.textContent = poll.creator.username;
     detailCreatedAt.textContent = formatDate(poll.createdAt);
     if (poll.isLocked) {
       detailLocked.textContent = ' (LOCKED)';
       detailLocked.classList.add('locked');
     } else {
       detailLocked.textContent = '';
       detailLocked.classList.remove('locked');
     }

     // 2. Description
     detailDesc.textContent = poll.description || '';

     // 3. Options & Progress Bars
     const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
     detailTotal.textContent = `Total votes: ${totalVotes}`;

     poll.options.forEach(opt => {
       // Tính % (nếu totalVotes = 0, set 0%)
       const pct = totalVotes > 0 ? ((opt.votes / totalVotes) * 100).toFixed(2) : '0.00';

       // Tạo phần tử DOM cho option
       const optDiv = document.createElement('div');
       optDiv.className = 'option-item';

       // Label text + số votes + %
       const label = document.createElement('div');
       label.className = 'option-label';
       label.innerHTML = `
         <span>${opt.text}</span>
         <span>${pct}% (${opt.votes} votes)</span>
       `;

       // Progress bar
       const barContainer = document.createElement('div');
       barContainer.className = 'progress-bar-container';
       const bar = document.createElement('div');
       bar.className = 'progress-bar';
       // gán width sau 50ms để có hiệu ứng
       setTimeout(() => { bar.style.width = `${pct}%`; }, 50);
       barContainer.appendChild(bar);

       // Thêm vào optDiv
       optDiv.appendChild(label);
       optDiv.appendChild(barContainer);
       optionsContainer.appendChild(optDiv);
     });

     // 4. Vẽ Pie Chart (Chart.js)
     renderPieChart('detail-pie-chart', poll.options);

     // 5. Vote / Unvote Buttons
     voteActionsDiv.innerHTML = ''; // reset
     // Nếu poll đã khóa hoặc hết hạn, không cho vote/unvote
     const now = new Date();
     const expired = poll.expiresAt ? (new Date(poll.expiresAt) < now) : false;
     if (poll.isLocked || expired) {
       const p = document.createElement('p');
       p.className = 'info-message';
       p.textContent = poll.isLocked
         ? 'This poll is locked. You cannot vote or unvote.'
         : 'This poll has expired. You cannot vote or unvote.';
       voteActionsDiv.appendChild(p);
       return;
     }

     // Kiểm tra xem currentUser đã vote chưa
     let userVotedOptId = null;
     poll.options.forEach(opt => {
       if (opt.userVote.some(u => u.userId === currentUser.id)) {
         userVotedOptId = opt.id;
       }
     });

     if (userVotedOptId) {
       // Nếu đã vote → chỉ hiển thị nút Unvote
       const btnUnvote = document.createElement('button');
       btnUnvote.textContent = 'Unvote';
       btnUnvote.addEventListener('click', () => {
         unvote(poll.id);
       });
       voteActionsDiv.appendChild(btnUnvote);
     } else {
       // Chưa vote → hiển thị dropdown chọn option và nút Vote
       const select = document.createElement('select');
       select.id = 'vote-select';
       poll.options.forEach(opt => {
         const optionEl = document.createElement('option');
         optionEl.value = opt.id;
         optionEl.textContent = opt.text;
         select.appendChild(optionEl);
       });
       const btnVote = document.createElement('button');
       btnVote.textContent = 'Vote';
       btnVote.addEventListener('click', () => {
         const selectedOptId = document.getElementById('vote-select').value;
         vote(poll.id, selectedOptId);
       });
       voteActionsDiv.appendChild(select);
       voteActionsDiv.appendChild(btnVote);
     }
   } catch (err) {
     detailError.textContent = err.message;
   }
 }

 backToListBtn.addEventListener('click', () => {
   showSection('polls-list');
   fetchPolls(currentPage);
 });

 // Vẽ Pie Chart từ một mảng các option
 function renderPieChart(canvasId, options) {
   const ctx = document.getElementById(canvasId).getContext('2d');
   if (pieChartInstance) pieChartInstance.destroy();

   const labels = options.map(o => o.text);
   const values = options.map(o => o.votes);
   const bgColors = [
     '#4CAF50','#FF9800','#9C27B0','#FFC107','#03A9F4','#E91E63','#8BC34A','#FF5722'
   ];
   const colors = labels.map((_, i) => bgColors[i % bgColors.length]);

   pieChartInstance = new Chart(ctx, {
     type: 'pie',
     data: {
       labels,
       datasets: [{
         data: values,
         backgroundColor: colors,
         borderColor: '#fff',
         borderWidth: 1
       }]
     },
     options: {
       responsive: true,
       plugins: {
         legend: {
           position: 'right',
           labels: { boxWidth: 12, padding: 12 }
         }
       }
     }
   });
 }

 // ========== 10. Vote / Unvote ==========
 async function vote(pollId, optId) {
   detailError.textContent = '';
   try {
     await fetch(`${API_BASE}/polls/${pollId}/vote/${optId}`, {
       method: 'POST',
       headers: getAuthHeaders()
     }).then(r => handleFetchRes(r));

     // Load lại detail sau khi vote
     showPollDetail(pollId);
   } catch (err) {
     detailError.textContent = err.message;
   }
 }

 async function unvote(pollId) {
   detailError.textContent = '';
   try {
     await fetch(`${API_BASE}/polls/${pollId}/unvote`, {
       method: 'DELETE',
       headers: getAuthHeaders()
     }).then(r => handleFetchRes(r));

     // Load lại detail sau khi unvote
     showPollDetail(pollId);
   } catch (err) {
     detailError.textContent = err.message;
   }
 }
