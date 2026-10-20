"use strict";
const KEY="nyusatsu-pwa-records-v1";
const seed=[
["岡山県","岡山県"],["岡山市","岡山県"],["倉敷市","岡山県"],["鳥取市","鳥取県"],
["三重県","三重県"],["津市","三重県"],["四日市市","三重県"],["浜松市","静岡県"],
["生駒市","奈良県"],["福井市","福井県"],["勝山市","福井県"],
["神奈川県","神奈川県"],["横浜市","神奈川県"],["川崎市","神奈川県"],
["愛媛県","愛媛県"],["松山市","愛媛県"],["山口市","山口県"],["下関市","山口県"],
["広島県","広島県"],["広島市","広島県"],["福山市","広島県"]
].map(([name,pref],i)=>({id:"seed-"+i,name,pref,start:"",end:"",status:"未確認",url:"",checked:"",memo:"",fav:false,updated:""}));
let records=load();
function load(){try{const s=localStorage.getItem(KEY);if(s){const v=JSON.parse(s);if(Array.isArray(v))return v;}}catch(e){console.warn(e)}return structuredClone(seed)}
function save(){localStorage.setItem(KEY,JSON.stringify(records));render()}
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function localDay(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function daysUntil(date){if(!date)return Infinity;const a=new Date(date+"T12:00:00");const b=new Date(localDay()+"T12:00:00");return Math.round((a-b)/86400000)}
function displayDate(s){return s?s.replaceAll("-","/"):"未登録"}
function derived(r){const d=daysUntil(r.end);return r.end&&d>=0&&d<=30?"soon":r.status==="受付中"?"open":"other"}
function render(){
const q=$("search").value.trim().toLowerCase(),f=$("filter").value,sort=$("sort").value;
const total=records.length,unknown=records.filter(r=>["未確認","未公表"].includes(r.status)).length,open=records.filter(r=>r.status==="受付中").length,soon=records.filter(r=>r.end&&daysUntil(r.end)>=0&&daysUntil(r.end)<=30).length;
$("stats").innerHTML=[["登録先",total],["受付中（登録情報）",open],["締切30日以内",soon],["未確認・未公表",unknown]].map(([n,v])=>`<div class="stat"><strong>${v}</strong><span>${n}</span></div>`).join("");
let a=records.filter(r=>(r.name+" "+r.pref+" "+r.memo).toLowerCase().includes(q));
if(f==="fav")a=a.filter(r=>r.fav);
if(f==="open")a=a.filter(r=>r.status==="受付中");
if(f==="soon")a=a.filter(r=>r.end&&daysUntil(r.end)>=0&&daysUntil(r.end)<=30);
if(f==="unknown")a=a.filter(r=>["未確認","未公表"].includes(r.status));
a.sort((x,y)=>sort==="deadline"?(daysUntil(x.end)-daysUntil(y.end)):sort==="updated"?(y.updated||"").localeCompare(x.updated||""):(x.pref+x.name).localeCompare(y.pref+y.name,"ja"));
$("list").innerHTML=a.length?a.map(r=>{const status=derived(r),url=r.url&&/^https:\/\//i.test(r.url)?`<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">公式サイト ↗</a>`:"公式URL未登録";return `<article class="item"><div class="itemtop"><div><h3>${esc(r.name)}</h3><div class="sub">${esc(r.pref)}</div></div><button class="star" data-action="fav" data-id="${esc(r.id)}" aria-label="お気に入り切替">${r.fav?"★":"☆"}</button></div><div style="margin-top:10px"><span class="pill ${status}">${esc(r.status)}</span>${status==="soon"?' <span class="pill soon">締切まで'+daysUntil(r.end)+'日</span>':""}</div><div class="dates"><div>受付開始<b>${displayDate(r.start)}</b></div><div>申請締切<b>${displayDate(r.end)}</b></div></div><div class="small">最終確認：${displayDate(r.checked)}　／　${url}</div>${r.memo?`<p class="small">${esc(r.memo)}</p>`:""}<div class="itembottom"><span class="small">端末内に保存</span><div class="itembuttons"><button data-action="edit" data-id="${esc(r.id)}">編集</button><button data-action="delete" data-id="${esc(r.id)}">削除</button></div></div></article>`}).join(""):'<div class="empty">条件に合う自治体がありません。</div>';
}
function openEditor(r){$("formtitle").textContent=r?"自治体を編集":"自治体を追加";["id","name","pref","start","end","status","url","checked","memo"].forEach(k=>$(k).value=r?.[k]??(k==="status"?"未確認":""));$("editor").showModal()}
$("add").onclick=()=>openEditor(null);$("cancel").onclick=()=>$("editor").close();
$("editform").onsubmit=e=>{e.preventDefault();const r={};["id","name","pref","start","end","status","url","checked","memo"].forEach(k=>r[k]=$(k).value.trim());if(r.start&&r.end&&r.start>r.end){alert("締切日は受付開始日以降にしてください");return}if(r.url&&!/^https:\/\//i.test(r.url)){alert("公式URLは https:// から入力してください");return}const i=records.findIndex(x=>x.id===r.id);r.id=r.id||"user-"+Date.now()+"-"+Math.random().toString(36).slice(2,7);r.fav=i>=0?records[i].fav:false;r.updated=new Date().toISOString();if(i>=0)records[i]=r;else records.push(r);save();$("editor").close()};
$("list").onclick=e=>{const b=e.target.closest("button[data-action]");if(!b)return;const i=records.findIndex(r=>r.id===b.dataset.id);if(i<0)return;if(b.dataset.action==="fav")records[i].fav=!records[i].fav;else if(b.dataset.action==="edit"){openEditor(records[i]);return}else if(b.dataset.action==="delete"){if(!confirm(records[i].name+"を削除しますか？"))return;records.splice(i,1)}save()};
["search","filter","sort"].forEach(k=>$(k).addEventListener(k==="search"?"input":"change",render));
function download(content,name,type){const u=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement("a");a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000)}
$("export").onclick=()=>download(JSON.stringify({version:1,exported:new Date().toISOString(),records},null,2),"nyusatsu-backup-"+localDay()+".json","application/json");
$("csv").onclick=()=>{const fields=["pref","name","start","end","status","url","checked","memo","fav"];const lines=[["都道府県","自治体・発注機関","受付開始","申請締切","状況","公式URL","最終確認","メモ","お気に入り"],...records.map(r=>fields.map(k=>r[k]??""))];const csv="\uFEFF"+lines.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(",")).join("\r\n");download(csv,"nyusatsu-"+localDay()+".csv","text/csv;charset=utf-8")};
$("import").onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());if(data.version!==1||!Array.isArray(data.records)||data.records.length>10000||!data.records.every(r=>r&&typeof r.id==="string"&&typeof r.name==="string"&&typeof r.pref==="string"))throw Error("形式が正しくありません");if(confirm("現在のデータをバックアップ内容で置き換えますか？")){records=data.records;save()}}catch(err){alert("読み込み失敗："+err.message)}e.target.value=""};
render();
if("serviceWorker" in navigator&&location.protocol!=="file:")navigator.serviceWorker.register("./sw.js").catch(console.warn);
