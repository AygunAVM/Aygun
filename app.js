let products=[],basket=[],version="V2 2026.03.02 15:28";

window.onload=()=>{
  document.getElementById('version').innerText="Versiyon: "+version;
  loadProducts();
}

function login(){
  const email=document.getElementById('email').value.trim();
  const pass=document.getElementById('password').value.trim();
  const remember=document.getElementById('remember').checked;
  if(email && pass){
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-panel').classList.remove('hidden');
  }else alert("E-mail ve şifre gerekli!");
}

async function loadProducts(){
  const res=await fetch('data/urunler.json?v='+Date.now());
  const json=await res.json();
  products=json.data;
  renderProducts();
}

function renderProducts(){
  const tbody=document.getElementById('product-body');
  tbody.innerHTML="";
  products.forEach(p=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${p.Ürün}<span class="desc">${p.Açıklama}</span></td>
      <td>${p.Stok}</td>
      <td>${p["Diğer Kartlar"]}</td>
      <td>${p["4T AWM"]}</td>
      <td>${p["Tek Çekim"]}</td>
      <td>${p["Nakit"]}</td>
      <td>${p.Açıklama}</td>
      <td>${p.Kod}</td>
      <td style="font-size:11px">${p["Ürün Gamı"]}</td>
      <td style="font-size:11px">${p.Marka}</td>
      <td><button class="btn" onclick='addToCart(${JSON.stringify(p)})'>Ekle</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function addToCart(item){
  basket.push({...item,discount:0});
  renderCart();
}

function renderCart(){
  const tbody=document.getElementById('cart-body');
  tbody.innerHTML="";
  let sumDK=0,sum4T=0,sumTek=0,sumNakit=0;
  basket.forEach((b,i)=>{
    sumDK+=b["Diğer Kartlar"]-b.discount;
    sum4T+=b["4T AWM"]-b.discount;
    sumTek+=b["Tek Çekim"]-b.discount;
    sumNakit+=b["Nakit"]-b.discount;
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${b.Ürün}</td>
      <td>${b.Stok}</td>
      <td>${b["Diğer Kartlar"]} ${b.discount?'<span class="red">-'+b.discount+'</span>':''}</td>
      <td>${b["4T AWM"]} ${b.discount?'<span class="red">-'+b.discount+'</span>':''}</td>
      <td>${b["Tek Çekim"]} ${b.discount?'<span class="red">-'+b.discount+'</span>':''}</td>
      <td>${b["Nakit"]} ${b.discount?'<span class="red">-'+b.discount+'</span>':''}</td>
      <td>${b.Açıklama}</td>
      <td><input type="text" placeholder="Müşteri"></td>
      <td><input type="text" placeholder="Telefon"></td>
      <td><input type="number" placeholder="İndirim" onchange="updateDiscount(${i},this.value)"></td>
      <td><input type="text" placeholder="Not"></td>
      <td><button onclick="removeFromCart(${i})" class="btn">Sil</button></td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById('sum-dk').innerText=sumDK;
  document.getElementById('sum-4t').innerText=sum4T;
  document.getElementById('sum-tek').innerText=sumTek;
  document.getElementById('sum-nakit').innerText=sumNakit;
}

function removeFromCart(i){basket.splice(i,1);renderCart();}
function updateDiscount(i,val){basket[i].discount=Number(val);renderCart();}

function filterProducts(){
  const q=document.getElementById('search').value.toLowerCase();
  const tbody=document.getElementById('product-body');
  tbody.innerHTML="";
  products.filter(p=>Object.values(p).join(' ').toLowerCase().includes(q))
          .forEach(p=>{
            const tr=document.createElement('tr');
            tr.innerHTML=`
              <td>${p.Ürün}<span class="desc">${p.Açıklama}</span></td>
              <td>${p.Stok}</td>
              <td>${p["Diğer Kartlar"]}</td>
              <td>${p["4T AWM"]}</td>
              <td>${p["Tek Çekim"]}</td>
              <td>${p["Nakit"]}</td>
              <td>${p.Açıklama}</td>
              <td>${p.Kod}</td>
              <td style="font-size:11px">${p["Ürün Gamı"]}</td>
              <td style="font-size:11px">${p.Marka}</td>
              <td><button class="btn" onclick='addToCart(${JSON.stringify(p)})'>Ekle</button></td>
            `;
            tbody.appendChild(tr);
          });
}

function finalizeProposal(){
  const name=document.getElementById('cust-name').value.trim();
  let phone=document.getElementById('cust-phone').value.trim();
  const note=document.getElementById('extra-info').value.trim();

  if(!/^0\d{10}$/.test(phone)){
    alert("Telefon numarası 11 haneli ve 0 ile başlamalı!");
    return;
  }

  let msg=`Müşteri: ${name}\nTelefon: ${phone}\nNot: ${note}\n\nSepet Detayları:\n`;
  basket.forEach(item=>{
    msg+=`${item.Ürün} - Stok: ${item.Stok} - D.Kart:${item["Diğer Kartlar"]-item.discount} 4T:${item["4T AWM"]-item.discount} Tek:${item["Tek Çekim"]-item.discount} Nakit:${item["Nakit"]-item.discount}\n`;
  });

  msg = encodeURIComponent(msg);
  const waUrl = `https://wa.me/${phone}?text=${msg}`;
  window.open(waUrl,'_blank');
}
