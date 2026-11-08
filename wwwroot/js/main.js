// ==========================================================
// GardenPOS — Customer Menu
// ==========================================================

const params = new URLSearchParams(location.search);
const tableNumber = parseInt(params.get('table') || '1');
document.getElementById('tableLabel').textContent = `طاولة رقم ${tableNumber}`;

let menu = [];
let cart = JSON.parse(localStorage.getItem(`cart_${tableNumber}`) || '{}');

const $ = id => document.getElementById(id);

// --- Emoji helper ---
function getEmoji(name) {
  const n = name.toLowerCase();
  if (n.includes('شاي')) return '🍵';
  if (n.includes('قهوة') || n.includes('إسبريسو')) return '☕';
  if (n.includes('نسكافيه') || n.includes('كابتشينو')) return '☕';
  if (n.includes('برتقال') || n.includes('ليمون')) return '🍊';
  if (n.includes('كوكتيل')) return '🍹';
  if (n.includes('مياه')) return '💧';
  if (n.includes('بيبسي')) return '🥤';
  if (n.includes('ريد بُل')) return '⚡';
  if (n.includes('برجر')) return '🍔';
  if (n.includes('بيتزا')) return '🍕';
  if (n.includes('شاورما')) return '🌯';
  if (n.includes('بطاطس')) return '🍟';
  if (n.includes('ناجتس')) return '🍗';
  if (n.includes('بلايستيشن')) return '🎮';
  if (n.includes('بلياردو')) return '🎱';
  if (n.includes('تذاكر')) return '🎫';
  if (n.includes('كرة')) return '⚽';
  return '🍽️';
}

// --- Fetch menu ---
async function loadMenu() {
  try {
    const res = await fetch('/api/menu');
    menu = await res.json();
    renderCategories();
    renderMenu(menu[0]?.id);
  } catch (e) {
    $('menu').innerHTML = '<p class="empty-msg">حدث خطأ في تحميل المنيو</p>';
  }
}

// --- Render categories ---
let activeCategoryId = null;
function renderCategories() {
  const container = $('categories');
  container.innerHTML = '';
  menu.forEach((cat, i) => {
    const btn = document.createElement('button');
    btn.className = 'cat-btn' + (i === 0 ? ' active' : '');
    btn.innerHTML = `<span>${cat.icon}</span><span>${cat.name}</span>`;
    btn.onclick = () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMenu(cat.id);
    };
    container.appendChild(btn);
    if (i === 0) activeCategoryId = cat.id;
  });
}

// --- Render menu ---
function renderMenu(categoryId) {
  const cat = menu.find(c => c.id === categoryId);
  if (!cat) return;
  const container = $('menu');
  container.innerHTML = '';
  cat.items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'menu-item';
    el.innerHTML = `
      <div class="item-emoji">${getEmoji(item.name)}</div>
      <div class="item-name">${item.name}</div>
      <div class="item-desc">${item.description || ''}</div>
      <div class="item-price">${item.price} ج.م</div>
    `;
    el.onclick = () => addToCart(item);
    container.appendChild(el);
  });
}

// --- Cart ---
function addToCart(item) {
  const key = String(item.id);
  if (!cart[key]) cart[key] = { item, qty: 0 };
  cart[key].qty++;
  saveCart();
  updateCartUI();
  showToast(`✓ ${item.name}`);
}

function removeFromCart(itemId) {
  const key = String(itemId);
  if (!cart[key]) return;
  cart[key].qty--;
  if (cart[key].qty <= 0) delete cart[key];
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem(`cart_${tableNumber}`, JSON.stringify(cart));
}

function updateCartUI() {
  const items = Object.values(cart);
  const count = items.reduce((s, x) => s + x.qty, 0);
  const total = items.reduce((s, x) => s + x.item.price * x.qty, 0);

  $('cartCount').textContent = count;
  $('cartCount').classList.toggle('hidden', count === 0);
  $('cartTotal').textContent = total + ' ج.م';

  const container = $('cartItems');
  if (items.length === 0) {
    container.innerHTML = '<p class="empty-msg">السلة فارغة</p>';
    $('checkoutBtn').disabled = true;
    return;
  }
  $('checkoutBtn').disabled = false;
  container.innerHTML = '';
  items.forEach(({ item, qty }) => {
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${item.price} ج.م × ${qty}</div>
      </div>
      <div class="qty-controls">
        <button class="qty-btn" data-action="minus">−</button>
        <span class="qty-num">${qty}</span>
        <button class="qty-btn" data-action="plus">+</button>
      </div>
    `;
    el.querySelector('[data-action="minus"]').onclick = () => removeFromCart(item.id);
    el.querySelector('[data-action="plus"]').onclick = () => addToCart(item);
    container.appendChild(el);
  });
}

// --- Open/close cart ---
$('cartFab').onclick = () => {
  $('cartDrawer').classList.add('show');
  $('overlay').classList.add('show');
};
$('closeCart').onclick = closeCart;
$('overlay').onclick = closeCart;
function closeCart() {
  $('cartDrawer').classList.remove('show');
  $('overlay').classList.remove('show');
}

// --- Checkout ---
$('checkoutBtn').onclick = async () => {
  const items = Object.values(cart);
  if (items.length === 0) return;
  $('checkoutBtn').disabled = true;
  $('checkoutBtn').textContent = 'جاري الإرسال...';
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableNumber,
        items: items.map(x => ({ menuItemId: x.item.id, quantity: x.qty }))
      })
    });
    if (!res.ok) throw new Error();
    cart = {};
    saveCart();
    updateCartUI();
    closeCart();
    showToast('✓ تم إرسال طلبك للمطبخ');
  } catch (e) {
    showToast('حدث خطأ، حاول مرة أخرى', true);
    $('checkoutBtn').disabled = false;
    $('checkoutBtn').textContent = 'إرسال الطلب';
  }
};

// --- Toast ---
let toastTimer;
function showToast(msg, isError = false) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.toggle('error', isError);
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2000);
}

// --- Init ---
updateCartUI();
loadMenu();

function renderMenu(categoryId) {
  const cat = menu.find(c => c.id === categoryId);
  if (!cat) return;
  const container = $('menu');
  container.innerHTML = '';
  cat.items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'menu-item';
    const visual = item.imageUrl
      ? `<img class="item-image" src="${item.imageUrl}" alt="${item.name}">`
      : `<div class="item-emoji">${getEmoji(item.name)}</div>`;
    el.innerHTML = `
      ${visual}
      <div class="item-name">${item.name}</div>
      <div class="item-desc">${item.description || ''}</div>
      <div class="item-price">${item.price} ج.م</div>
    `;
    el.onclick = () => addToCart(item);
    container.appendChild(el);
  });
}