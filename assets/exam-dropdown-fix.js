(()=>{
'use strict';
const style=document.createElement('style');
style.textContent=`
/* Exam page presentation */
.exams-view{text-align:center!important}
.exams-view>.eyebrow,.exams-view>h1,.exams-view>p{text-align:center!important;margin-left:auto!important;margin-right:auto!important}
.exams-view>h1{max-width:900px!important}.exams-view>p{max-width:850px!important}
.exams-view h2.section-title{text-align:center!important;margin:34px auto 8px!important}
.exams-view .section-note{text-align:center!important;margin:0 auto 22px!important}
.exam-grid{align-items:stretch!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:24px!important;margin:24px auto 48px!important;max-width:1220px!important}
.exam-card{height:100%;display:flex!important;flex-direction:column!important;overflow:hidden!important;border-radius:18px!important;background:#fff!important;box-shadow:0 12px 28px rgba(20,29,38,.08)!important}
.exam-card>img{width:100%;height:190px!important;object-fit:cover!important;display:block!important}
.exam-card .card-body{display:flex!important;flex-direction:column!important;flex:1!important;padding:24px!important;text-align:left!important}
.exam-card .card-body h2{margin:0 0 10px!important;min-height:36px!important}.exam-card .card-body p{margin:0 0 22px!important;min-height:50px!important;line-height:1.55!important}
.exam-components{margin-top:auto!important;display:flex!important;flex-direction:column!important;gap:9px!important}.exam-components>strong{display:block;margin:0!important;font-size:16px!important;color:#071f38}
.exam-prep-select{width:100%;min-height:46px;padding:0 42px 0 14px;border:1px solid #d9a72e;border-radius:12px;background:#fff;color:#071f38;font:700 14px/1.2 Arial,sans-serif;cursor:pointer;outline:none}.exam-prep-select:focus{border-color:#b77b00;box-shadow:0 0 0 3px rgba(217,167,46,.16)}
.exam-book-now{display:inline-flex!important;align-items:center!important;justify-content:center!important;align-self:flex-start!important;min-height:42px!important;margin-top:12px!important;padding:0 20px!important;border-radius:999px!important;background:#e5b53d!important;color:#080808!important;font:700 13px/1 Arial,sans-serif!important;text-decoration:none!important}
/* All programme category headings */
.programme-group-view>.eyebrow,.programme-group-view>h1,.programme-group-view>p{text-align:center!important;margin-left:auto!important;margin-right:auto!important}.programme-group-view>h1{max-width:900px!important}.programme-group-view>p{max-width:760px!important}
@media(max-width:900px){.exam-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}@media(max-width:650px){.exam-grid{grid-template-columns:1fr!important}.exam-card>img{height:180px!important}}
`;
document.head.appendChild(style);
function convert(){
 document.querySelectorAll('.exam-card .exam-components').forEach(box=>{
  if(box.dataset.dropdownReady)return;
  const links=[...box.querySelectorAll('a')];if(!links.length)return;
  const select=document.createElement('select');select.className='exam-prep-select';select.setAttribute('aria-label','Choose preparation');
  select.innerHTML='<option value="">Choose a preparation option</option>'+links.map(a=>`<option value="${a.href}">${a.textContent.trim()}</option>`).join('');
  const first=links[0]?.href||'#';select.addEventListener('change',()=>{if(select.value)location.href=select.value});links.forEach(a=>a.remove());box.appendChild(select);
  const book=document.createElement('a');book.className='exam-book-now';book.href=first;book.textContent='Book Now';box.appendChild(book);box.dataset.dropdownReady='1';
 });
}
convert();new MutationObserver(convert).observe(document.getElementById('detailContent')||document.body,{childList:true,subtree:true});
})();