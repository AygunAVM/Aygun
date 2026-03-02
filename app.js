let allProducts=[], basket=JSON.parse(localStorage.getItem('aygun_basket'))||[], discountAmount=0, discountType='TRY';
let currentUser=JSON.parse(localStorage.getItem('aygun_user'))||null;

function getIstanbulVersion(){
  const now=new Date();
  const d=String(now.getDate()).padStart(2,'0');
  const m=String(now.getMonth()+1).padStart(2,'0');
  const y=String(now.getFullYear());
  const h=String(now.getHours()).padStart(2,'0');
  const min=String(now.getMinutes()).padStart(2,'0');
  return `V2 ${d}.${m}.${y} ${h}:${min}`;
}

// --- GİRİŞ ---
async function checkAuth(){
  const u=document.getElementById('user-input').value.trim().toLowerCase();
  const p=document.getElementById('pass-input').value.trim();
  if(!u||!p){alert("Bilgi eksik"); return;}
  try{
    const res=await fetch('data/kullanicilar.json?t='+Date.now());
    const users=await res.json();
    const user=users.find(x=>x.Email.toLowerCase()===u && x.Sifre===p);
    if(user){
      currentUser=user;
      if(document.getElementById('remember-me').checked)
        localStorage.setItem('aygun_user',JSON.stringify(user));
      document.getElementById('login-screen').style.display='none';
      document.getElementById('app-content').style.display='block';
      loadData();
    }else document.getElementById('login-err').style.display='block';
  }catch(e){alert("Kullanıcı listesi yüklenemedi");}
}

// --- DATA ---
async function loadData(){
  try{
    const res=await fetch('data/urunler.json?v='+Date.now());
    const json=await res.json();
    allProducts=Array.isArray(json.data)?json.data:json;
    document.getElementById('v-tag').innerText=getIstanbulVersion();
    renderTable(allProducts);
    updateUI();
  }catch(e){console.error(e); alert("Ürün listesi yüklenemedi");}
}

// --- FILTER ---
function filterData(){
  const val=document.getElementById('search').value.toLowerCase().trim();
  const keywords=val.split(" ").filter(k=>k.length>0);
  const filtered=allProducts.filter(u=>{
    const rowText=Object.values(u).join(" ").toLowerCase();
    return keywords.every(kw=>rowText.includes(kw));
  });
  renderTable(filtered);
}

// --- TABLE ---
function renderTable(data){
  const list=document.getElementById('product-list');
  list.innerHTML='';
  const frag=document.createDocumentFragment();
  data.forEach((u,idx)=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td><button class="add-btn haptic-btn" onclick="addToBasket(${idx})">+</button></td>
      <td><b>${u.Ürün}</b><br><span class="product-desc">${u.Açıklama||''}</span></td>
      <td>${u.Stok}</td>
      <td>${u['Diğer Kartlar']}</td><td>${u['4T AWM']}</td>
      <td>${u['Tek Çekim']}</td><td>${u.Nakit}</td>
      <td>${u.Açıklama||'-'}</td><td>${u.Kod}</td>
      <td style="font-size:11px;">${u['Ürün Gamı']}</td>
      <td style="font-size:11px;">${u.Marka}</td>`;
    frag.appendChild(tr);
  });
  list.appendChild(frag);
}

// --- SEPET ---
function addToBasket(idx){
  const p=allProducts[idx];
  basket.push({
    urun:p.Ürün,stok:p.Stok,
    dk:p['Diğer Kartlar'],awm:p['4T AWM'],tek:p['Tek Çekim'],nakit:p.Nakit,
    aciklama:p.Açıklama||'-'
  });
  save();
}
function save(){ localStorage.setItem('aygun_basket',JSON.stringify(basket)); updateUI(); }
function removeFromBasket(i){ basket.splice(i,1); save(); }
function clearBasket(){ if(confirm("Sepeti temizle?")){ basket=[]; discountAmount=0; save(); } }
function applyDiscount(){ discountAmount=parseFloat(document.getElementById('discount-input').value)||0; discountType=document.getElementById('discount-type').value; updateUI(); }

// SEPET ARAYÜZ
function updateUI(){
  const cont=document.getElementById('cart-items');
  const cartCount=document.getElementById('cart-count');
  if(cartCount) cartCount.innerText=basket.length;
  if(!cont) return;
  if(basket.length===0){ cont.innerHTML="<p style='text-align:center; padding:40px; color:#94a3b8;'>Sepetiniz boş</p>"; return; }

  let tDK=0,tAWM=0,tTek=0,tNak=0;
  let html=`<table style="width:100%; border-collapse:collapse;">
  <thead><tr style="background:#f8fafc;">
    <th>Ürün</th><th>Stok</th><th>D.Kart</th><th>4T AWM</th><th>TekÇekim</th><th>Nakit</th><th>Açıklama</th><th>✕</th>
  </tr></thead><tbody>`;

  basket.forEach((i,idx)=>{
    tDK+=i.dk; tAWM+=i.awm; tTek+=i.tek; tNak+=i.nakit;
    html+=`<tr>
      <td><b>${i.urun}</b></td>
      <td>${i.stok}</td>
      <td>${i.dk}</td><td>${i.awm}</td><td>${i.tek}</td><td>${i.nakit}</td>
      <td><small>${i.aciklama}</small></td>
      <td><button class="haptic-btn" onclick="removeFromBasket(${idx})" style="color:red;">✕</button></td>
    </tr>`;
  });

  const calcD=t=>discountType==='TRY'?discountAmount: t*discountAmount/100;
  if(discountAmount>0){
    html+=`<tr style="color:red; font-weight:bold; background:#fff5f5;">
      <td colspan="2" align="right">İndirim:</td>
      <td>-${calcD(tDK)}</td><td>-${calcD(tAWM)}</td><td>-${calcD(tTek)}</td><td>-${calcD(tNak)}</td>
      <td colspan="2"></td></tr>`;
  }
  html+=`<tr style="background:var(--primary); color:white; font-weight:bold;">
    <td colspan="2" align="right">NET TOPLAM:</td>
    <td>${tDK-calcD(tDK)}</td><td>${tAWM-calcD(tAWM)}</td><td>${tTek-calcD(tTek)}</td><td>${tNak-calcD(tNak)}</td>
    <td colspan="2"></td></tr></tbody></table>`;
  cont.innerHTML=html;
}

// --- SEPET TOGGLE ---
function toggleCart(){ const m=document.getElementById('cart-modal'); if(m) m.style.display=m.style.display==='flex'?'none':'flex'; }
