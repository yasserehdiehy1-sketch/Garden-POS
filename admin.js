const $ = id => document.getElementById(id);
let token = localStorage.getItem('adminToken') || '';
let currentUser = localStorage.getItem('adminUser') || '';
let currentRole = localStorage.getItem('adminRole') || '';
let currentTab = 'orders';

if (token) showApp();

// ════════════════════════ AUTH ════════════════════════
$('loginBtn').onclick = async () => {
  const user = $('loginUser').value.trim();
  const pass = $('loginPass').value;
  $('loginError').textContent = '';
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass })
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    token = data.token;
    currentUser = data.username;
    currentRole = data.role;
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', currentUser);
    localStorage.setItem('adminRole', currentRole);
    showApp();
  } catch {
    $('loginError').textContent = 'بيانات الدخول غير صحيحة';
  }
};

function showApp() {
  $('loginScreen').style.display = 'none';
  $('appScreen').style.display = 'grid';
  $('currentUser').textContent = `${currentUser} (${roleAr(currentRole)})`;

  // إخفاء عناصر admin للـ Cashier/Secretary
  if (currentRole !== 'Admin') {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    document.querySelector('.nav-btn[data-tab="users"]')?.remove();
  }

  switchTab('orders');
  loadOrders();
  setInterval(loadOrders, 3000);
}

function roleAr(r) {
  return { Admin: 'مدير', Cashier: 'كاشير', Secretary: 'سكرتيرة' }[r] || r;
}

$('logoutBtn').onclick = () => {
  ['adminToken', 'adminUser', 'adminRole'].forEach(k => localStorage.removeItem(k));
  location.reload();
};

// ════════════════════════ TABS ════════════════════════
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.onclick = () => switchTab(btn.dataset.tab);
});

function switchTab(name) {
  currentTab = name;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.id === `tab-${name}`));
  if (name === 'orders') loadOrders();
  if (name === 'tables') loadTables();
  if (name === 'menu') loadMenuAdmin();
  if (name === 'reports') loadReports();
  if (name === 'qr') loadQRs();
  if (name === 'users') loadUsers();
}

// ════════════════════════ API helper ════════════════════════
async function api(path, opts = {}) {
  if (!opts.headers) opts.headers = {};
  if (!(opts.body instanceof FormData))
    opts.headers['Content-Type'] = 'application/json';
  opts.headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(path, opts);
  if (res.status === 401) { $('logoutBtn').click(); throw new Error(); }
  return res;
}

// ════════════════════════ ORDERS ════════════════════════
async function loadOrders() {
  try {
    const res = await api('/api/orders');
    const orders = await res.json();
    const container = $('ordersGrid');
    if (orders.length === 0) {
      container.innerHTML = '<p class="empty-msg">لا توجد طلبات نشطة</p>';
      return;
    }
    container.innerHTML = '';
    orders.forEach(o => {
      const card = document.createElement('div');
      card.className = 'order-card';
      const canPay = currentRole === 'Admin' || currentRole === 'Cashier';
      card.innerHTML = `
        <div class="order-card-header">
          <span class="table">طاولة ${o.tableNumber}</span>
          <span class="status-badge status-${o.status}">${arabicStatus(o.status)}</span>
        </div>
        <div class="items">
          ${o.items.map(i => `
            <div class="item-row">
              <span>${i.quantity} × ${i.itemName}</span>
              <span>${i.quantity * i.unitPrice} ج.م</span>
            </div>
          `).join('')}
        </div>
        <div class="total">${o.totalAmount} ج.م</div>
        ${canPay ? `<button class="pay-btn" data-id="${o.id}">💵 تحصيل الدفع</button>` : ''}
      `;
      container.appendChild(card);
    });
    container.querySelectorAll('.pay-btn').forEach(btn => {
      btn.onclick = () => payOrder(btn.dataset.id);
    });
  } catch (e) {}
}

function arabicStatus(s) {
  return { Pending:'جديد', Preparing:'قيد التحضير', Ready:'جاهز', Served:'تم التقديم', Paid:'مدفوع' }[s] || s;
}

async function payOrder(id) {
  if (!confirm('تأكيد تحصيل الدفع؟')) return;
  try {
    await api(`/api/orders/${id}/pay`, { method: 'POST' });
    loadOrders();
    loadTables();
  } catch (e) {}
}

// ════════════════════════ TABLES ════════════════════════
async function loadTables() {
  try {
    const res = await fetch('/api/tables');
    const tables = await res.json();
    const container = $('tablesGrid');
    container.innerHTML = '';
    tables.forEach(t => {
      const div = document.createElement('div');
      div.className = 'table-tile ' + t.status.toLowerCase();
      div.innerHTML = `<div>${t.number}</div><small>${t.status === 'Free' ? 'فارغة' : 'مشغولة'}</small>`;
      container.appendChild(div);
    });
  } catch (e) {}
}

// ════════════════════════ MENU ADMIN ════════════════════════
async function loadMenuAdmin() {
  try {
    const res = await api('/api/menu/all');
    const cats = await res.json();
    const container = $('menuAdmin');
    container.innerHTML = '';
    cats.forEach(cat => {
      const card = document.createElement('div');
      card.className = 'cat-admin';
      card.innerHTML = `
        <h3>${cat.icon} ${cat.name}</h3>
        ${cat.items.map(i => `
          <div class="menu-item-row">
            <span>${i.name} — <strong style="color:var(--gold)">${i.price} ج.م</strong></span>
            <div class="item-actions">
              ${currentRole === 'Admin' ? `<button class="delete" data-id="${i.id}">حذف</button>` : ''}
            </div>
          </div>
        `).join('')}
      `;
      container.appendChild(card);
    });
    container.querySelectorAll('.delete').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('حذف الصنف؟')) return;
        await api('/api/menu/items/' + btn.dataset.id, { method: 'DELETE' });
        loadMenuAdmin();
      };
    });
  } catch (e) {}
}

// ════════════════════════ ITEM MODAL ════════════════════════
$('addItemBtn').onclick = async () => {
  $('itemModalTitle').textContent = 'إضافة صنف';
  $('itemId').value = '';
  $('itemName').value = '';
  $('itemDesc').value = '';
  $('itemPrice').value = '';
  $('itemImage').value = '';
  $('imagePreview').innerHTML = '';

  const res = await api('/api/menu/all');
  const cats = await res.json();
  $('itemCategory').innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  $('itemModal').classList.add('show');
};

$('cancelItemBtn').onclick = () => $('itemModal').classList.remove('show');

$('itemImage').onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    $('imagePreview').innerHTML = `<img src="${ev.target.result}">`;
  };
  reader.readAsDataURL(file);
};

$('saveItemBtn').onclick = async () => {
  const name = $('itemName').value.trim();
  const desc = $('itemDesc').value.trim();
  const price = parseFloat($('itemPrice').value);
  const categoryId = parseInt($('itemCategory').value);
  if (!name || !price || price <= 0) { alert('أكمل البيانات'); return; }

  $('saveItemBtn').disabled = true;
  $('saveItemBtn').textContent = 'جاري الحفظ...';

  try {
    // 1. رفع الصورة إن وجدت
    let imageUrl = '';
    const file = $('itemImage').files[0];
    if (file) {
      const fd = new FormData();
      fd.append('file', file);
      const upRes = await api('/api/upload', { method: 'POST', body: fd });
      if (!upRes.ok) throw new Error('upload failed');
      imageUrl = (await upRes.json()).url;
    }

    // 2. حفظ الصنف
    await api('/api/menu/items', {
      method: 'POST',
      body: JSON.stringify({
        name, description: desc, price, categoryId,
        imageUrl, isAvailable: true
      })
    });
    $('itemModal').classList.remove('show');
    loadMenuAdmin();
  } catch (e) {
    alert('حدث خطأ أثناء الحفظ');
  } finally {
    $('saveItemBtn').disabled = false;
    $('saveItemBtn').textContent = 'حفظ';
  }
};

// ════════════════════════ REPORTS ════════════════════════
async function loadReports() {
  try {
    const res = await api('/api/reports/daily');
    const r = await res.json();
    $('reportContent').innerHTML = `
      <div class="report-card">
        <div class="report-stat"><span>إجمالي الإيرادات</span><strong>${r.totalRevenue} ج.م</strong></div>
        <div class="report-stat"><span>عدد الطلبات المدفوعة</span><strong>${r.totalOrders}</strong></div>
      </div>
      <div class="report-card">
        <h3 style="margin-bottom:16px">🔥 الأكثر مبيعاً</h3>
        ${r.topItems.map(i => `
          <div class="report-stat"><span>${i.name} (${i.qty})</span><strong>${i.revenue} ج.م</strong></div>
        `).join('') || '<p class="empty-msg">لا توجد بيانات</p>'}
      </div>
    `;
  } catch (e) {}
}

// ════════════════════════ QR ════════════════════════
async function loadQRs() {
  try {
    const res = await fetch('/api/tables');
    const tables = await res.json();
    const container = $('qrGrid');
    container.innerHTML = '';
    tables.forEach(t => {
      const div = document.createElement('div');
      div.className = 'qr-item';
      div.innerHTML = `<img src="/api/qr/${t.number}"><p>طاولة ${t.number}</p>`;
      container.appendChild(div);
    });
  } catch (e) {}
}

// ════════════════════════ USERS ════════════════════════
async function loadUsers() {
  try {
    const res = await api('/api/users');
    const users = await res.json();
    const container = $('usersList');
    container.innerHTML = '';
    users.forEach(u => {
      const row = document.createElement('div');
      row.className = 'user-row';
      row.innerHTML = `
        <div>
          <strong>${u.username}</strong>
          <span class="role-badge role-${u.role}">${roleAr(u.role)}</span>
          ${u.isActive ? '' : '<span style="color:var(--danger)"> (معطّل)</span>'}
        </div>
        <div class="item-actions">
          <button class="edit" data-action="pass" data-id="${u.id}">كلمة السر</button>
          <button class="edit" data-action="toggle" data-id="${u.id}">${u.isActive ? 'تعطيل' : 'تنشيط'}</button>
          <button class="delete" data-action="delete" data-id="${u.id}">حذف</button>
        </div>
      `;
      container.appendChild(row);
    });

    container.querySelectorAll('button').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        if (action === 'pass') {
          const p = prompt('كلمة السر الجديدة (4 أحرف على الأقل):');
          if (!p || p.length < 4) return;
          await api(`/api/users/${id}/password`, {
            method: 'PUT',
            body: JSON.stringify({ password: p })
          });
          alert('تم تحديث كلمة السر');
        } else if (action === 'toggle') {
          await api(`/api/users/${id}/toggle`, { method: 'PUT' });
          loadUsers();
        } else if (action === 'delete') {
          if (!confirm('حذف المستخدم نهائيًا؟')) return;
          await api(`/api/users/${id}`, { method: 'DELETE' });
          loadUsers();
        }
      };
    });
  } catch (e) {}
}

$('addUserBtn').onclick = () => {
  $('newUserName').value = '';
  $('newUserPass').value = '';
  $('newUserRole').value = 'Cashier';
  $('userModal').classList.add('show');
};

$('cancelUserBtn').onclick = () => $('userModal').classList.remove('show');

$('saveUserBtn').onclick = async () => {
  const username = $('newUserName').value.trim();
  const password = $('newUserPass').value;
  const role = $('newUserRole').value;
  if (!username || !password || password.length < 4) {
    alert('أكمل البيانات (كلمة السر 4 أحرف على الأقل)');
    return;
  }
  try {
    const res = await api('/api/users', {
      method: 'POST',
      body: JSON.stringify({ username, password, role })
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.message || 'حدث خطأ');
      return;
    }
    $('userModal').classList.remove('show');
    loadUsers();
  } catch (e) {
    alert('حدث خطأ');
  }
};