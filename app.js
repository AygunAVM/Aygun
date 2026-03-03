// ─── GLOBAL STATE ────────────────────────────────────────────────
let allProducts = [];
let basket = JSON.parse(localStorage.getItem('aygun_basket')) || [];
let discountAmount = 0;
let discountType = 'TRY';
let currentUser = JSON.parse(localStorage.getItem('aygun_user')) || null;
let selectedPriceTypes = ['dk']; // default seçili fiyat tipi

// ─── VERSİYON (JSON metadata'dan gelir) ─────────────────────────
let currentVersion = 'Yükleniyor...';

// ─── GİRİŞ ──────────────────────────────────────────────────────
async function checkAuth() {
  const u = document.getElementById('user-input').value.trim().toLowerCase();
  const p = document.getElementById('pass-input').value.trim();
  const errEl = document.getElementById('login-err');

  if (!u || !p) {
    errEl.style.display = 'block';
    errEl.textContent = 'E-mail ve şifre boş bırakılamaz.';
    return;
  }

  try {
    const res = await fetch('data/kullanicilar.json?t=' + Date.now());
    const users = await res.json();
    const user = users.find(x => x.Email.toLowerCase() === u && x.Sifre === p);

    if (user) {
      currentUser = user;
      if (document.getElementById('remember-me').checked) {
        localStorage.setItem('aygun_user', JSON.stringify(user));
      }
      errEl.style.display = 'none';
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('app-content').style.display = 'block';
      loadData();
    } else {
      errEl.style.display = 'block';
      errEl.textContent = 'E-mail veya şifre hatalı!';
    }
  } catch (e) {
    errEl.style.display = 'block';
    errEl.textContent = 'Bağlantı hatası, tekrar deneyin.';
  }
}

// Enter tuşu ile giriş
document.addEventListener('DOMContentLoaded', () => {
  const passInput = document.getElementById('pass-input');
  if (passInput) {
    passInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') checkAuth();
    });
  }

  // Mevcut kullanıcı varsa otomatik giriş
  if (currentUser) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';
    loadData();
  }

  // Fiyat tipi chip'leri
  document.querySelectorAll('.price-type-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('checked');
      const val = chip.dataset.type;
      if (chip.classList.contains('checked')) {
        if (!selectedPriceTypes.includes(val)) selectedPriceTypes.push(val);
      } else {
        selectedPriceTypes = selectedPriceTypes.filter(x => x !== val);
      }
    });
  });
});

// ─── DATA YÜKLEMESİ ─────────────────────────────────────────────
async function loadData() {
  try {
    const res = await fetch('data/urunler.json?v=' + Date.now());
    const json = await res.json();
    allProducts = Array.isArray(json.data) ? json.data : json;

    // Versiyon JSON'daki metadata'dan alınır
    if (json.metadata && json.metadata.v) {
      currentVersion = json.metadata.v;
    }
    const vTag = document.getElementById('v-tag');
    if (vTag) vTag.innerText = currentVersion;

    checkChanges(json);
    renderTable(allProducts);
    updateCartUI();
  } catch (e) {
    console.error(e);
    alert('Ürün listesi yüklenemedi');
  }
}

// ─── FİLTRE ─────────────────────────────────────────────────────
function filterData() {
  const val = normalizeText(document.getElementById('search').value.trim());
  const keywords = val.split(' ').filter(k => k.length > 0);

  const filtered = allProducts.filter(u => {
    const rowText = normalizeText(Object.values(u).join(' '));
    return keywords.every(kw => rowText.includes(kw));
  });
  renderTable(filtered);
}

function normalizeText(str) {
  return str
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/İ/g, 'i').replace(/Ğ/g, 'g').replace(/Ü/g, 'u')
    .replace(/Ş/g, 's').replace(/Ö/g, 'o').replace(/Ç/g, 'c');
}

// ─── TABLO RENDER ────────────────────────────────────────────────
function renderTable(data) {
  const list = document.getElementById('product-list');
  list.innerHTML = '';
  const frag = document.createDocumentFragment();

  data.forEach((u, idx) => {
    // Orijinal index bul
    const origIdx = allProducts.indexOf(u);
    const tr = document.createElement('tr');

    const stokClass = u.Stok === 0 ? 'stok-kritik' : u.Stok > 10 ? 'stok-bol' : 'stok-orta';
    const desc = u.Açıklama || '';

    tr.innerHTML = `
      <td><button class="add-btn haptic-btn" onclick="addToBasket(${origIdx})">＋</button></td>
      <td>
        <span class="product-name">${u.Ürün}</span>
        ${desc ? `<span class="product-desc">${desc}</span>` : ''}
      </td>
      <td class="${stokClass}">${u.Stok}</td>
      <td class="td-price">${fmt(u['Diğer Kartlar'])}</td>
      <td class="td-price">${fmt(u['4T AWM'])}</td>
      <td class="td-price">${fmt(u['Tek Çekim'])}</td>
      <td class="td-price">${fmt(u.Nakit)}</td>
      <td style="font-size:0.70rem; color:#64748b; max-width:80px;">${u.Kod}</td>
      <td class="td-gam">${u['Ürün Gamı'] || '-'}</td>
      <td class="td-marka">${u.Marka || '-'}</td>
    `;
    frag.appendChild(tr);
  });

  list.appendChild(frag);
}

function fmt(val) {
  if (val === undefined || val === null || val === '') return '-';
  const n = parseFloat(val);
  if (isNaN(n)) return val;
  return n.toLocaleString('tr-TR') + ' ₺';
}

// ─── SEPET ──────────────────────────────────────────────────────
function addToBasket(idx) {
  const p = allProducts[idx];
  basket.push({
    urun: p.Ürün,
    stok: p.Stok,
    dk: parseFloat(p['Diğer Kartlar']) || 0,
    awm: parseFloat(p['4T AWM']) || 0,
    tek: parseFloat(p['Tek Çekim']) || 0,
    nakit: parseFloat(p.Nakit) || 0,
    aciklama: p.Açıklama || '-'
  });
  saveBasket();

  // Buton animasyon feedback
  const btns = document.querySelectorAll('.add-btn');
  // Küçük pulse efekti için cart-count güncellenir yukarıda
}

function saveBasket() {
  localStorage.setItem('aygun_basket', JSON.stringify(basket));
  updateCartUI();
}

function removeFromBasket(i) {
  basket.splice(i, 1);
  saveBasket();
}

function clearBasket() {
  if (confirm('Sepeti tamamen temizlemek istiyor musunuz?')) {
    basket = [];
    discountAmount = 0;
    document.getElementById('discount-input').value = '';
    saveBasket();
  }
}

function applyDiscount() {
  discountAmount = parseFloat(document.getElementById('discount-input').value) || 0;
  discountType = document.getElementById('discount-type').value;
  updateCartUI();
}

// ─── SEPET UI ────────────────────────────────────────────────────
function updateCartUI() {
  const countEl = document.getElementById('cart-count');
  if (countEl) countEl.innerText = basket.length;

  const tableArea = document.getElementById('cart-table-area');
  if (!tableArea) return;

  if (basket.length === 0) {
    tableArea.innerHTML = `
      <div class="empty-cart">
        <span class="empty-cart-icon">🛒</span>
        Sepetiniz boş
      </div>`;
    return;
  }

  const calcDisc = (total) =>
    discountType === 'TRY' ? discountAmount : total * discountAmount / 100;

  let tDK = 0, tAWM = 0, tTek = 0, tNak = 0;
  basket.forEach(i => { tDK += i.dk; tAWM += i.awm; tTek += i.tek; tNak += i.nakit; });

  let rows = '';
  basket.forEach((item, idx) => {
    const stokStyle = item.stok === 0 ? ' class="cart-stok-0"' : '';
    rows += `<tr>
      <td><span class="product-name" style="font-size:0.78rem">${item.urun}</span></td>
      <td${stokStyle}>${item.stok}</td>
      <td style="font-size:0.70rem; color:#64748b; max-width:100px; word-break:break-word;">${item.aciklama}</td>
      <td class="cart-price">${fmt(item.dk)}</td>
      <td class="cart-price">${fmt(item.awm)}</td>
      <td class="cart-price">${fmt(item.tek)}</td>
      <td class="cart-price">${fmt(item.nakit)}</td>
      <td><button class="remove-btn haptic-btn" onclick="removeFromBasket(${idx})">✕</button></td>
    </tr>`;
  });

  let discRow = '';
  if (discountAmount > 0) {
    const dDK = calcDisc(tDK), dAWM = calcDisc(tAWM), dTek = calcDisc(tTek), dNak = calcDisc(tNak);
    discRow = `<tr class="discount-row">
      <td colspan="3" style="text-align:right; font-size:0.72rem;">
        🏷️ İndirim ${discountType === 'PERCENT' ? '%' + discountAmount : fmt(discountAmount)}
      </td>
      <td class="cart-price">−${fmt(dDK)}</td>
      <td class="cart-price">−${fmt(dAWM)}</td>
      <td class="cart-price">−${fmt(dTek)}</td>
      <td class="cart-price">−${fmt(dNak)}</td>
      <td></td>
    </tr>`;
  }

  const netDK  = tDK  - calcDisc(tDK);
  const netAWM = tAWM - calcDisc(tAWM);
  const netTek = tTek - calcDisc(tTek);
  const netNak = tNak - calcDisc(tNak);

  const totalRow = `<tr class="total-row">
    <td colspan="3" style="text-align:right;">NET TOPLAM</td>
    <td class="cart-price">${fmt(netDK)}</td>
    <td class="cart-price">${fmt(netAWM)}</td>
    <td class="cart-price">${fmt(netTek)}</td>
    <td class="cart-price">${fmt(netNak)}</td>
    <td></td>
  </tr>`;

  tableArea.innerHTML = `
    <table class="cart-table">
      <thead>
        <tr>
          <th>Ürün</th>
          <th>Stok</th>
          <th>Açıklama</th>
          <th>D.Kart</th>
          <th>4T AWM</th>
          <th>Tek Çekim</th>
          <th>Nakit</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        ${discRow}
        ${totalRow}
      </tbody>
    </table>`;
}

// ─── SEPET TOGGLE ───────────────────────────────────────────────
function toggleCart() {
  const m = document.getElementById('cart-modal');
  if (!m) return;
  const isOpen = m.classList.contains('open');
  if (isOpen) {
    m.classList.remove('open');
    m.style.display = 'none';
  } else {
    m.style.display = 'flex';
    m.classList.add('open');
    updateCartUI();
  }
}

// ─── WHATSAPP TEKLİF ────────────────────────────────────────────
function finalizeProposal() {
  if (basket.length === 0) { alert('Sepet boş!'); return; }

  const phone = document.getElementById('cust-phone').value.trim();
  if (!phone || phone.length !== 11 || !phone.startsWith('0')) {
    alert('Geçerli bir telefon giriniz (0 ile başlayan 11 hane)');
    return;
  }

  const custName = document.getElementById('cust-name').value.trim() || '—';
  const extraNote = document.getElementById('extra-info').value.trim();
  const userEmail = currentUser ? currentUser.Email : '—';

  // Geçerlilik tarihi: bugün + 3 gün
  const geçerlilik = new Date();
  geçerlilik.setDate(geçerlilik.getDate() + 3);
  const gelDate = geçerlilik.toISOString().split('T')[0];

  const calcDisc = (t) => discountType === 'TRY' ? discountAmount : t * discountAmount / 100;

  let tDK = 0, tAWM = 0, tTek = 0, tNak = 0;
  basket.forEach(i => { tDK += i.dk; tAWM += i.awm; tTek += i.tek; tNak += i.nakit; });

  const netDK  = tDK  - calcDisc(tDK);
  const netAWM = tAWM - calcDisc(tAWM);
  const netTek = tTek - calcDisc(tTek);
  const netNak = tNak - calcDisc(tNak);

  const urunList = basket.map(i => `  • ${i.urun}`).join('\n');

  let odemeLines = '';
  if (selectedPriceTypes.includes('awm'))  odemeLines += `4T AWM: ${fmt(netAWM)}\n`;
  if (selectedPriceTypes.includes('dk'))   odemeLines += `D. Kart: ${fmt(netDK)}\n`;
  if (selectedPriceTypes.includes('tek'))  odemeLines += `Tek Çekim: ${fmt(netTek)}\n`;
  if (selectedPriceTypes.includes('nakit')) odemeLines += `Nakit: ${fmt(netNak)}\n`;

  if (!odemeLines) odemeLines = `D. Kart: ${fmt(netDK)}\n`;

  const discountNote = discountAmount > 0
    ? `( ${discountType === 'PERCENT' ? '%' + discountAmount : fmt(discountAmount)} indirim uygulanmıştır )\n`
    : '';

  const noteSection = extraNote ? `\nNot: ${extraNote}` : '';

  const msg =
    `*aygün® TEKLİF*\n` +
    `━━━━━━━━━━━━━━━\n` +
    `Müşteri: ${custName}\n` +
    `Teklif veren: ${userEmail}\n` +
    `Telefon: ${phone}\n` +
    `Geçerlilik: ${gelDate}\n\n` +
    `*Ürünler:*\n${urunList}\n\n` +
    `*Ödeme Seçenekleri:*\n${odemeLines}` +
    `${discountNote}` +
    `${noteSection}\n` +
    `> Satış beklenmektedir.`;

  // WhatsApp numarası: 0 yerine 90 ile başla
  const waPhone = '9' + phone; // 0532... → 90532...
  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');
}

// ─── DEĞİŞİKLİK KONTROLÜ ────────────────────────────────────────
function checkChanges(json) {
  const storageKey = 'last_json_' + (currentUser ? currentUser.Email : 'guest');
  const last = JSON.parse(localStorage.getItem(storageKey)) || {};
  const changes = [];

  if (last.data && Array.isArray(json.data)) {
    json.data.forEach(p => {
      const old = last.data.find(x => x.Kod === p.Kod);
      if (!old) return;

      const fields = ['Nakit', 'Tek Çekim', '4T AWM', 'Diğer Kartlar', 'Stok', 'Açıklama'];
      fields.forEach(f => {
        if (old[f] !== p[f]) {
          let note = '';
          if (f === 'Stok') {
            const diff = p[f] - old[f];
            note = `Stok ${diff > 0 ? diff + ' arttı' : Math.abs(diff) + ' azaldı'} (${old[f]} → ${p[f]})`;
          } else if (f === 'Açıklama') {
            note = `Açıklama güncellendi`;
          } else {
            const diff = parseFloat(p[f]) - parseFloat(old[f]);
            note = `${f} ${diff > 0 ? '+' + diff + ' arttı' : Math.abs(diff) + ' ₺ azaldı'} (${old[f]} → ${p[f]})`;
          }
          changes.push(`${p.Ürün}: ${note}`);
        }
      });
    });
  }

  // Eski kayıtları sil, yeni versiyonu kaydet
  localStorage.setItem(storageKey, JSON.stringify(json));

  if (changes.length === 0) return;

  // Birikmiş popup sayısını kontrol et (max 2)
  const seenKey = 'seen_versions_' + (currentUser ? currentUser.Email : 'guest');
  const seenVersions = JSON.parse(localStorage.getItem(seenKey)) || [];

  const vKey = json.metadata ? json.metadata.v : 'unknown';
  if (seenVersions.includes(vKey)) return; // Bu versiyonu zaten gördü

  // Max 2 versiyon tut
  seenVersions.push(vKey);
  if (seenVersions.length > 2) seenVersions.shift();
  localStorage.setItem(seenKey, JSON.stringify(seenVersions));

  // Popup göster
  const listEl = document.getElementById('change-list');
  listEl.innerHTML = changes.map(c =>
    `<div class="change-item"><span class="change-dot"></span><span>${c}</span></div>`
  ).join('');

  const popup = document.getElementById('change-popup');
  popup.style.display = 'flex';
  popup.classList.add('open');
}

function closeChangePopup() {
  const popup = document.getElementById('change-popup');
  popup.style.display = 'none';
  popup.classList.remove('open');
}
