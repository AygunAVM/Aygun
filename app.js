let allProducts=[];
let basket=JSON.parse(localStorage.getItem("basket"))||[];
let discountAmount=0;
let discountType="TRY";

/* LOGIN */
async function checkAuth(){
const u=document.getElementById("user-input").value.trim().toLowerCase();
const p=document.getElementById("pass-input").value.trim();
const remember=document.getElementById("remember-me").checked;

const res=await fetch("data/kullanicilar.json");
const users=await res.json();
const user=users.find(x=>x.Email.toLowerCase()===u && x.Sifre===p);

if(user){
if(remember) localStorage.setItem("user",JSON.stringify(user));
document.getElementById("login-screen").style.display="none";
document.getElementById("app-content").style.display="block";
loadData();
}else{
document.getElementById("login-err").style.display="block";
}
}

/* LOAD */
async function loadData(){
const res=await fetch("data/urunler.json?"+Date.now());
const json=await res.json();
allProducts=json.data;
document.getElementById("v-tag").innerText=json.metadata.v;
renderTable(allProducts);
updateUI();
}

/* FILTER */
function filterData(){
const val=document.getElementById("search").value.toLowerCase().trim();
const keys=val.split(" ").filter(x=>x);
const filtered=allProducts.filter(p=>{
const row=Object.values(p).join(" ").toLowerCase();
return keys.every(k=>row.includes(k));
});
renderTable(filtered);
}

/* TABLE */
function renderTable(data){
const list=document.getElementById("product-list");
list.innerHTML=data.map((u,i)=>`
<tr>
<td><button onclick="addToBasket(${i})">+</button></td>
<td><b>${u.Ürün}</b></td>
<td>${u.Stok}</td>
<td>${u["Diğer Kartlar"]}</td>
<td>${u["4T AWM"]}</td>
<td>${u["Tek Çekim"]}</td>
<td>${u.Nakit}</td>
<td style="white-space:nowrap;overflow:auto;">${u.Açıklama||""}</td>
<td>${u.Kod}</td>
<td class="small">${u["Ürün Gamı"]||""}</td>
<td class="small">${u.Marka||""}</td>
</tr>
`).join("");
}

/* BASKET */
function addToBasket(i){
basket.push(allProducts[i]);
save();
}

function save(){
localStorage.setItem("basket",JSON.stringify(basket));
updateUI();
}

function clearBasket(){
basket=[];
discountAmount=0;
save();
}

/* DISCOUNT */
function applyDiscount(){
discountAmount=parseFloat(document.getElementById("discount-input").value)||0;
discountType=document.getElementById("discount-type").value;
updateUI();
}

/* UPDATE UI */
function updateUI(){
document.getElementById("cart-count").innerText=basket.length;
}

/* WHATSAPP */
function finalizeProposal(){
const name=document.getElementById("cust-name").value.trim();
let phone=document.getElementById("cust-phone").value.trim();

if(!/^05\d{9}$/.test(phone)){
alert("Telefon 05XXXXXXXXX formatında olmalı");
return;
}

phone="90"+phone.substring(1);

let msg="Aygün AVM Teklif\n";
msg+="Müşteri: "+name+"\n\n";

basket.forEach(i=>{
msg+=i.Ürün+"\n";
});

window.open("https://wa.me/"+phone+"?text="+encodeURIComponent(msg));
}

/* AUTO LOGIN */
window.onload=()=>{
const user=localStorage.getItem("user");
if(user){
document.getElementById("login-screen").style.display="none";
document.getElementById("app-content").style.display="block";
loadData();
}
}
