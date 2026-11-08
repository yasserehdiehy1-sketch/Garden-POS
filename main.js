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
async function sendOrder() {
    const items = Object.values(cart);
    if (items.length === 0) return;
    
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'جاري الإرسال...';
    }

    // تجهيز البيانات بالملي لتطابق الـ CreateOrderRequest في السيرفر
    const orderData = {
        tableNumber: parseInt(tableNumber) || 1, 
        note: document.getElementById('customer-note')?.value || '', 
        items: items.map(x => ({
            menuItemId: x.item.id,
            quantity: x.qty,
            note: ''
        }))
    };

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (!res.ok) throw new Error();

        // ⚡ لقط رقم الأوردر المرجّع من السيرفر بنجاح وحفظه فوراً لتتبعه تلقائياً
        try {
            const resData = await res.json();
            if (resData && resData.id) {
                localStorage.setItem('last_order_id', resData.id);
            }
        } catch (err) {}

        cart = {}; 
        saveCart();
        updateCartUI();
        closeCart();
        showToast(' تم إرسال طلبك للمطبخ بنجاح!');
    } catch (e) {
        showToast(' حدث خطأ، حاول مرة أخرى', true);
    } finally {
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = 'إرسال الطلب';
        }
    }
}

if ($('checkoutBtn')) {
    $('checkoutBtn').onclick = sendOrder;
}

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

// --- Render menu ---
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

// --- Init ---
updateCartUI();
loadMenu();

// --- ⚡ تتبع حالة الطلب وتنبيه الزبون تلقائياً عبر دالة الطاولة المفتوحة ---
function trackOrderStatus() {
    const lastOrderId = localStorage.getItem('last_order_id');
    if (!lastOrderId) return;

    // الاستعلام من دالة الطاولة العامة المفتوحة بدون حماية
    fetch(`/api/orders/table/${tableNumber}`)
        .then(res => {
            if (res.ok) return res.json();
        })
        .then(activeOrders => {
            if (!activeOrders) return;
            
            // البحث عن أوردر الزبون الحالي داخل قائمة الطلبات النشطة للطاولة
            const myOrder = activeOrders.find(o => o.id == lastOrderId);
            
            // 💡 الفكرة العبقرية: لو المطبخ عمل الطلب "جاهز وسلّمه" (Served) أو الكاشير قفله، 
            // الطلب هيختفي من قائمة الطلبات النشطة للطاولة، وده معناه إن الأكل جِهِز فوراً!
            if (!myOrder) {
                let statusBox = document.getElementById('order-status-alert');
                if (!statusBox) {
                    statusBox = document.createElement('div');
                    statusBox.id = 'order-status-alert';
                    statusBox.style.cssText = "position: fixed; top: 20px; left: 20px; right: 20px; background: linear-gradient(135deg, #4ade80, #22c55e); color: #000; padding: 16px; border-radius: 12px; font-weight: 900; text-align: center; font-size: 18px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 9999; font-family: 'Cairo', sans-serif; animation: slideIn 0.3s;";
                    document.body.appendChild(statusBox);
                }
                statusBox.innerHTML = `🔔 طلبك رقم (#${lastOrderId}) أصبح جاهزاً الآن! تفضل باستلامه من البار.`;
                
                // إيقاف التتبع بعد النجاح عشان الصندوق يثبت والزبون يفرح بيه
                localStorage.removeItem('last_order_id'); 
            }
        })
        .catch(err => console.error(err));
}

// تشغيل الفحص اللحظي كل 4 ثوانٍ تلقائياً
setInterval(trackOrderStatus, 4000);
