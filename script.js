const STORE_KEY = "caretrack_visitors_v1";
let visitors = loadVisitors();
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const todayKey = () => new Date().toLocaleDateString("en-CA");
const fmt = (value) => value ? new Date(value).toLocaleString([], {dateStyle:"medium",timeStyle:"short"}) : "—";
const safe = (s="") => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function loadVisitors(){try{return JSON.parse(localStorage.getItem(STORE_KEY))||[]}catch{return []}}
function save(){localStorage.setItem(STORE_KEY,JSON.stringify(visitors));renderAll()}
function initials(name=""){return name.trim().split(/\s+/).slice(0,2).map(x=>x[0]||"").join("").toUpperCase()}
function makeId(){return "VC-"+Date.now().toString().slice(-7)}
function showToast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}
function go(page){$$(".page").forEach(p=>p.classList.toggle("active-page",p.id===`page-${page}`));$$(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===page));$("#crumb").textContent=({dashboard:"Dashboard",register:"Register visitor",pass:"Visitor pass",active:"Active visitors",records:"Visitor records"})[page];$("#sidebar").classList.remove("open");if(page==="pass")$("#passSearch").focus()}
function statusPill(v){return `<span class="status ${v.exitTime?"out":"inside"}">${v.exitTime?"Checked out":"Inside"}</span>`}
function person(v){return `<div class="person-cell"><span class="mini-avatar">${safe(initials(v.visitorName))}</span><span><strong>${safe(v.visitorName)}</strong><small>${safe(v.relationship)} · ${safe(v.phone)}</small></span></div>`}
function renderDashboard(){
 const today=visitors.filter(v=>v.dateKey===todayKey()),active=today.filter(v=>!v.exitTime),exited=today.filter(v=>v.exitTime);
 $("#statTotal").textContent=today.length;$("#statActive").textContent=active.length;$("#statExited").textContent=exited.length;$("#statPatients").textContent=new Set(today.map(v=>v.patientId.toLowerCase())).size;
 const rows=[...visitors].sort((a,b)=>b.createdAt-a.createdAt).slice(0,5);
 $("#recentRows").innerHTML=rows.length?rows.map(v=>`<tr><td>${person(v)}</td><td>${safe(v.patientName)}<br><small>${safe(v.ward)}</small></td><td>${fmt(v.entryTime)}</td><td>${statusPill(v)}</td></tr>`).join(""):`<tr><td colspan="4"><div class="empty-state">No visitors registered yet. Create your first visitor entry.</div></td></tr>`;
}
function renderActive(){
 const q=($("#activeSearch")?.value||"").toLowerCase();
 const list=visitors.filter(v=>!v.exitTime).filter(v=>[v.visitorName,v.patientName,v.patientId,v.passId].join(" ").toLowerCase().includes(q));
 $("#activeCountText").textContent=`${visitors.filter(v=>!v.exitTime).length} active visit(s)`;
 $("#activeRows").innerHTML=list.map(v=>`<tr><td>${person(v)}</td><td>${safe(v.patientName)}<br><small>${safe(v.ward)} · ${safe(v.patientId)}</small></td><td><strong>${safe(v.passId)}</strong></td><td>${fmt(v.entryTime)}</td><td>${v.duration} min</td><td><button class="outline-btn checkout-btn" data-id="${safe(v.passId)}">Check out</button></td></tr>`).join("");
 $("#activeEmpty").classList.toggle("hidden",list.length>0);
}
function renderRecords(){
 const q=($("#recordsSearch")?.value||"").toLowerCase(),filter=$("#statusFilter")?.value||"all";
 const list=[...visitors].sort((a,b)=>b.createdAt-a.createdAt).filter(v=>[v.visitorName,v.patientName,v.patientId,v.passId,v.ward].join(" ").toLowerCase().includes(q)).filter(v=>filter==="all"||(filter==="Inside"?!v.exitTime:!!v.exitTime));
 $("#recordRows").innerHTML=list.map(v=>`<tr><td><strong>${safe(v.passId)}</strong></td><td>${safe(v.visitorName)}</td><td>${safe(v.patientName)}<br><small>${safe(v.patientId)}</small></td><td>${fmt(v.entryTime)}</td><td>${fmt(v.exitTime)}</td><td>${statusPill(v)}</td></tr>`).join("");
 $("#recordsEmpty").classList.toggle("hidden",list.length>0);
}
function renderAll(){renderDashboard();renderActive();renderRecords()}
function passMarkup(v){return `<div class="pass-card"><div class="pass-card-head"><div class="pass-brand"><span>✚</span> CareTrack <small style="display:block;font:600 9px 'DM Sans';letter-spacing:1px;color:#91a0a8;margin-top:3px">HOSPITAL VISITOR PASS</small></div><div class="pass-id">${safe(v.passId)}</div></div><div class="pass-details"><div><small>VISITOR NAME</small><strong>${safe(v.visitorName)}</strong></div><div><small>RELATIONSHIP</small><strong>${safe(v.relationship)}</strong></div><div><small>PATIENT NAME</small><strong>${safe(v.patientName)}</strong></div><div><small>PATIENT ID</small><strong>${safe(v.patientId)}</strong></div><div><small>WARD / ROOM</small><strong>${safe(v.ward)}</strong></div><div><small>ENTRY TIME</small><strong>${fmt(v.entryTime)}</strong></div><div><small>ALLOWED DURATION</small><strong>${v.duration} minutes</strong></div><div><small>VISIT STATUS</small><strong>${v.exitTime?"Checked out":"Active"}</strong></div></div><div style="border-top:1px dashed #dce6e9;padding-top:13px;color:#91a0a8;font-size:9px">Please display this pass while inside the hospital. Return to reception when leaving.</div></div>`}
function showPass(v){if(!v)return;$("#passResult").innerHTML=passMarkup(v)+`<div class="pass-actions" style="margin-top:12px"><button class="primary-btn" id="printPass">Print pass</button><button class="outline-btn" id="goRecords">View records</button></div>`;$("#printPass").onclick=()=>window.print();$("#goRecords").onclick=()=>go("records")}
$("#visitorForm").addEventListener("submit",e=>{e.preventDefault();const f=new FormData(e.currentTarget),v={visitorName:f.get("visitorName").trim(),phone:f.get("phone").trim(),relationship:f.get("relationship"),category:f.get("category"),patientName:f.get("patientName").trim(),patientId:f.get("patientId").trim(),ward:f.get("ward").trim(),duration:Number(f.get("duration")),passId:makeId(),entryTime:new Date().toISOString(),exitTime:null,createdAt:Date.now(),dateKey:todayKey()};visitors.push(v);save();e.currentTarget.reset();showToast("Visitor registered and pass created.");go("pass");$("#passSearch").value=v.passId;showPass(v)});
$("#findPass").onclick=()=>{const q=$("#passSearch").value.trim().toLowerCase();const v=visitors.find(x=>x.passId.toLowerCase()===q||x.visitorName.toLowerCase().includes(q));if(v)showPass(v);else{$("#passResult").innerHTML=`<div class="pass-empty"><div class="empty-icon">⌕</div><h3>No matching pass found</h3><p>Check the visitor name or pass ID and try again.</p></div>`}};
$("#passSearch").addEventListener("keydown",e=>{if(e.key==="Enter")$("#findPass").click()});
$("#activeRows").addEventListener("click",e=>{const b=e.target.closest(".checkout-btn");if(!b)return;const v=visitors.find(x=>x.passId===b.dataset.id);if(v&&!v.exitTime){v.exitTime=new Date().toISOString();save();showToast(`${v.visitorName} checked out successfully.`)}});
$("#activeSearch").addEventListener("input",renderActive);$("#recordsSearch").addEventListener("input",renderRecords);$("#statusFilter").addEventListener("change",renderRecords);
$("#exportCsv").onclick=()=>{const header=["Pass ID","Visitor","Phone","Relationship","Patient","Patient ID","Ward","Entry Time","Exit Time","Status"];const rows=visitors.map(v=>[v.passId,v.visitorName,v.phone,v.relationship,v.patientName,v.patientId,v.ward,v.entryTime,v.exitTime||"",v.exitTime?"Checked out":"Inside"]);const csv=[header,...rows].map(r=>r.map(x=>`"${String(x??"").replace(/"/g,'""')}"`).join(",")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="caretrack-visitor-records.csv";a.click();URL.revokeObjectURL(a.href);showToast("Visitor records exported.")};
$$("[data-page]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.page)));$$("[data-go]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.go)));$("#mobileMenu").onclick=()=>$("#sidebar").classList.toggle("open");
$("#closeModal").onclick=()=>$("#passModal").classList.add("hidden");$("#passModal").onclick=e=>{if(e.target.id==="passModal")$("#passModal").classList.add("hidden")};
renderAll();