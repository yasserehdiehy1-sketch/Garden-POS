const $ = id => document.getElementById(id);
let lastData = '';

const getToken = () => localStorage.getItem('token') || localStorage.getItem('kitchenToken') || '';

async function loadOrders() {
  try {
    const res = await fetch('/api/orders/public');
    if (!res.ok) return;
    const orders = await res.json();
    
    // ⚡ الفلترة الذكية: المطبخ يعرض فقط الطلبات الجديدة (Pending) أو التي قيد التحضير (Preparing)
    // أول ما الطلب يصبح Ready (جاهز) أو Served (تم التقديم)، يختفي فوراً من شاشة المطبخ!
    const kitchenActiveOrders = orders.filter(o => {
        const s = (o.status || '').toLowerCase();
        return s === 'pending' || s === 'preparing';
    });

    const str = JSON.stringify(kitchenActiveOrders);
    if (str === lastData) return;
    lastData = str;
    render(kitchenActiveOrders);
  } catch (e) { console.error(e); }
}

function render(orders) {
  let pending = 0, preparing = 0;
  
  orders.forEach(o => {
    const status = (o.status || '').toLowerCase();
    if (status === 'pending') pending++;
    else if (status === 'preparing') preparing++;
  });
  
  // تحديث العدادات العلوية الحقيقية لشاشتك
  if ($('statPending')) $('statPending').textContent = pending;
  if ($('statPreparing')) $('statPreparing').textContent = preparing;
  if ($('statReady')) $('statReady').textContent = 0; // يصفر الجاهز لأنهم اختفوا للمطبخ

  const container = $('orders') || document.querySelector('.k-grid');
  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = '<div class="empty" style="grid-column:1/-1; text-align:center; padding:80px; font-size:20px; color:#444;">لا توجد طلبات معلقة في المطبخ حالياً ✨</div>';
    return;
  }
  
  container.innerHTML = '';
  orders.forEach(order => {
    const card = document.createElement('div');
    const currentStatus = (order.status || '').toLowerCase();
    card.className = 'order-card ' + currentStatus;
    
    // تفعيل ألوان الحواف النيون الفاخرة بتاعتك ديناميكياً
    if (currentStatus === 'preparing') {
        card.style.borderColor = '#FFB800';
        card.style.boxShadow = '0 0 20px rgba(255, 184, 0, 0.2)';
    } else {
        card.style.borderColor = '#ff5757';
        card.style.boxShadow = '0 0 20px rgba(255, 87, 87, 0.2)';
    }

    const time = order.createdAt 
      ? new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      : '--:--';
      
    const orderItems = order.items || order.Items || [];
    const tableNum = order.tableNumber || order.TableNumber || 0;

    // توليد الأزرار بناء على الدورة الذكية اللي طلبتها
    let actionBtnHtml = '';
    if (currentStatus === 'pending') {
        actionBtnHtml = `<button class="action-btn start" style="background: #FFB800; color: #000;" data-id="${order.id}" data-status="Preparing">◀ بدء التحضير</button>`;
    } else if (currentStatus === 'preparing') {
        actionBtnHtml = `<button class="action-btn ready" style="background: #4ade80; color: #000;" data-id="${order.id}" data-status="Ready">⚙ جاري التنفيذ... (اضغط ليجهز ويختفي)</button>`;
    }

    card.innerHTML = `
      <div class="order-header">
        <span class="table-num">طاولة ${tableNum}</span>
        <span class="order-time">${time}</span>
      </div>
      <div class="order-items">
        ${orderItems.map(i => `
          <div class="order-item">
            <span class="qty">${i.quantity || i.Quantity || 1}</span>
            <span class="name">${i.itemName || i.ItemName || ''}</span>
          </div>
        `).join('')}
      </div>
      ${order.customerNote || order.CustomerNote ? `<div class="order-note">📝 ${order.customerNote || order.CustomerNote}</div>` : ''}
      <div class="order-actions">
        ${actionBtnHtml}
      </div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll('.action-btn').forEach(btn => {
    btn.onclick = () => updateStatus(btn.dataset.id, btn.dataset.status);
  });
}

async function updateStatus(id, status) {
  try {
    // ⚡ تعديل الإرسال الهام: إرسال الحالة داخل كائن {} ليطابق طلب الـ Record في الـ Controller ويقبل التعديل فوراً
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
      },
      body: JSON.stringify({ status: status }) 
    });
    
    if (res.ok) {
        lastData = ''; // إجبار المتصفح على مسح الكاش القديم
        loadOrders(); // تحديث فوري سحري
    }
  } catch (e) { console.error(e); }
}

loadOrders();
setInterval(loadOrders, 2000);
