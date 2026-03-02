/* ================================
   GLOBALS
================================ */
let allProducts = [];
let previousProducts = JSON.parse(localStorage.getItem("prev_products")) || [];
let basket = JSON.parse(localStorage.getItem("basket")) || [];
let discountAmount = 0;
let discountType = "TRY";

/* ================================
   TOGGLE CART (HATA FIX)
================================ */
function toggleCart() {
  const modal = document.getElementById("cart-modal");
  modal.style.display = modal.style.display === "flex" ? "none" : "flex";
}

/* ================================
   LOGIN
================================ */
async function checkAuth() {
  const u = document.getElementById("user-input").value.trim().toLowerCase();
  const p = document.getElementById("pass-input").value.trim();
  const remember = document.getElementById("remember-me").checked;

  const res = await fetch("data/kullanicilar.json?" + Date.now());
  const users = await res.json();
  const user = users.find(
    x => x.Email.toLowerCase() === u && x.Sifre === p
  );

  if (user) {
    if (remember) localStorage.setItem("user", JSON.stringify(user));
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("app-content").style.display = "block";
    loadData();
  } else {
    document.getElementById("login-err").style.display = "block";
  }
}

/* ================================
   LOAD DATA + VERSION CHECK
================================ */
async function loadData() {
  const res = await fetch("data/urunler.json?" + Date.now());
  const json = await res.json();

  allProducts = json.data;
  document.getElementById("v-tag").innerText = json.metadata.v;

  checkChanges(allProducts);
  renderTable(allProducts);
  updateCartUI();
}

/* ================================
   CHANGE DETECTION SYSTEM
================================ */
function checkChanges(newData) {
  if (!previousProducts.length) {
    localStorage.setItem("prev_products", JSON.stringify(newData));
    return;
  }

  let changes = [];

  newData.forEach(newItem => {
    const old = previousProducts.find(x => x.Kod === newItem.Kod);
    if (!old) return;

    let msg = `• ${newItem["Ürün"]}\n`;

    if (old.Stok !== newItem.Stok)
      msg += `  Stok: ${old.Stok} → ${newItem.Stok}\n`;

    if (old.Nakit !== newItem.Nakit)
      msg += `  Nakit: ${old.Nakit} → ${newItem.Nakit}\n`;

    if (old["Tek Çekim"] !== newItem["Tek Çekim"])
      msg += `  Tek Çekim: ${old["Tek Çekim"]} → ${newItem["Tek Çekim"]}\n`;

    if (msg !== `• ${newItem["Ürün"]}\n`)
      changes.push(msg);
  });

  if (changes.length) showChangePopup(changes.slice(0, 10));

  localStorage.setItem("prev_products", JSON.stringify(newData));
}

function showChangePopup(list) {
  let history = JSON.parse(localStorage.getItem("change_history")) || [];
  history.push(list.join("\n"));
  if (history.length > 2) history.shift();
  localStorage.setItem("change_history", JSON.stringify(history));

  alert("GÜNCELLEME VAR:\n\n" + list.join("\n"));
}

/* ================================
   FILTER
================================ */
function filterData() {
  const val = document.getElementById("search").value.toLowerCase().trim();
  const keys = val.split(" ").filter(x => x);
  const filtered = allProducts.filter(p => {
    const row = Object.values(p).join(" ").toLowerCase();
    return keys.every(k => row.includes(k));
  });
  renderTable(filtered);
}

/* ================================
   TABLE RENDER
================================ */
function renderTable(data) {
  const list = document.getElementById("product-list");

  list.innerHTML = data.map((u, i) => `
<tr>
<td><button onclick="addToBasket(${i})">+</button></td>
<td><b>${u["Ürün"]}</b></td>
<td>${u.Stok}</td>
<td>${u["Diğer Kartlar"]}</td>
<td>${u["4T AWM"]}</td>
<td>${u["Tek Çekim"]}</td>
<td>${u.Nakit}</td>
<td style="white-space:nowrap;overflow:auto;">${u.Açıklama || ""}</td>
<td>${u.Kod}</td>
<td class="small">${u["Ürün Gamı"] || ""}</td>
<td class="small">${u.Marka || ""}</td>
</tr>
`).join("");
}

/* ================================
   BASKET SYSTEM
================================ */
function addToBasket(index) {
  basket.push(allProducts[index]);
  localStorage.setItem("basket", JSON.stringify(basket));
  updateCartUI();
}

function clearBasket() {
  basket = [];
  localStorage.setItem("basket", JSON.stringify(basket));
  updateCartUI();
}

function updateCartUI() {
  document.getElementById("cart-count").innerText = basket.length;

  const container = document.getElementById("cart-items");
  if (!container) return;

  if (!basket.length) {
    container.innerHTML = "<p style='padding:20px'>Sepet boş</p>";
    return;
  }

  let html = `
  <div class="cart-table-wrapper">
  <table class="cart-table">
  <thead>
  <tr>
  <th>Ürün</th>
  <th>Stok</th>
  <th>D.Kart</th>
  <th>4T</th>
  <th>Tek</th>
  <th>Nakit</th>
  <th>Sil</th>
  </tr>
  </thead>
  <tbody>`;

  basket.forEach((item, i) => {
    html += `
<tr>
<td>${item["Ürün"]}</td>
<td>${item.Stok}</td>
<td>${item["Diğer Kartlar"]}</td>
<td>${item["4T AWM"]}</td>
<td>${item["Tek Çekim"]}</td>
<td>${item.Nakit}</td>
<td><button onclick="removeItem(${i})">✕</button></td>
</tr>`;
  });

  html += "</tbody></table></div>";
  container.innerHTML = html;
}

function removeItem(i) {
  basket.splice(i, 1);
  localStorage.setItem("basket", JSON.stringify(basket));
  updateCartUI();
}

/* ================================
   WHATSAPP VALIDATION
================================ */
function finalizeProposal() {
  let phone = document.getElementById("cust-phone").value.trim();
  if (!/^05\d{9}$/.test(phone)) {
    alert("Telefon 05XXXXXXXXX formatında olmalı");
    return;
  }
  phone = "90" + phone.substring(1);

  let msg = "Aygün AVM Teklif\n\n";
  basket.forEach(i => msg += i["Ürün"] + "\n");

  window.open("https://wa.me/" + phone + "?text=" + encodeURIComponent(msg));
}

/* ================================
   AUTO LOGIN
================================ */
window.onload = () => {
  const user = localStorage.getItem("user");
  if (user) {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("app-content").style.display = "block";
    loadData();
  }
};
