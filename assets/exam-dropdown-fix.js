(()=>{
'use strict';
const style=document.createElement('style');
style.textContent=`
.exam-grid{align-items:stretch!important}
.exam-card{height:100%;display:flex!important;flex-direction:column!important;overflow:hidden}
.exam-card>img{width:100%;height:190px!important;object-fit:cover;display:block}
.exam-card .card-body{display:flex!important;flex-direction:column!important;flex:1;padding:24px!important}
.exam-card .card-body h2{margin:0 0 10px!important}
.exam-card .card-body p{margin:0 0 22px!important;min-height:44px}
.exam-components{margin-top:auto!important;display:flex!important;flex-direction:column!important;gap:8px!important}
.exam-components>strong{display:block;margin:0!important;font-size:16px!important;color:#071f38}
.exam-prep-select{width:100%;min-height:46px;padding:0 42px 0 14px;border:1px solid #d9a72e;border-radius:12px;background:#fff;color:#071f38;font:700 14px/1.2 Arial,sans-serif;cursor:pointer;outline:none}
.exam-prep-select:focus{border-color:#b77b00;box-shadow:0 0 0 3px rgba(217,167,46,.16)}
@media(min-width:900px){.exam-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}.exam-card{min-height:480px}}
`;
document.head.appendChild(style);
function convert(){
 document.querySelectorAll('.exam-card .exam-components').forEach(box=>{
  if(box.dataset.dropdownReady)return;
  const links=[...box.querySelectorAll('a')];
  if(!links.length)return;
  const select=document.createElement('select');
  select.className='exam-prep-select';
  select.setAttribute('aria-label','Choose preparation');
  select.innerHTML='<option value="">Choose a preparation option</option>'+links.map(a=>`<option value="${a.href}">${a.textContent.trim()}</option>`).join('');
  select.addEventListener('change',()=>{if(select.value)location.href=select.value});
  links.forEach(a=>a.remove());
  box.appendChild(select);
  box.dataset.dropdownReady='1';
 });
}
convert();
new MutationObserver(convert).observe(document.getElementById('detailContent')||document.body,{childList:true,subtree:true});
})();