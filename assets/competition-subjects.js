(()=>{
'use strict';
const kangarooSubjects=['Mathematics','English Language','Science','Informatics / Computing'];
function enhance(){
 document.querySelectorAll('.detail-card').forEach(card=>{
  const h=card.querySelector('h2');
  if(!h||h.textContent.trim()!=='Math Kangaroo'||card.dataset.subjectReady)return;
  const p=card.querySelector('p');
  if(p)p.textContent='Kangaroo competition preparation across available subject pathways, with focused practice and competition-style questions.';
  const book=card.querySelector('a[href*="billing.html"]');if(!book)return;
  const label=document.createElement('label');label.className='competition-subject-label';label.textContent='Choose subject';
  const select=document.createElement('select');select.className='competition-subject-select';select.setAttribute('aria-label','Choose Kangaroo subject');
  select.innerHTML='<option value="">Choose a subject</option>'+kangarooSubjects.map(s=>`<option value="${s}">${s}</option>`).join('');
  select.addEventListener('change',()=>{book.href='billing.html?programme='+encodeURIComponent(select.value?`Kangaroo — ${select.value}`:'Kangaroo Competition Preparation')});
  book.before(label,select);card.dataset.subjectReady='1';
 });
}
const style=document.createElement('style');style.textContent=`.competition-subject-label{display:block;margin-top:auto;padding-top:14px;margin-bottom:7px;color:#071f38;font:700 13px Arial,sans-serif}.competition-subject-select{width:100%;min-height:44px;padding:0 40px 0 13px;border:1px solid #d9a72e;border-radius:11px;background:#fff;color:#071f38;font:700 13px Arial,sans-serif;outline:none}.competition-subject-select+a{margin-top:12px!important;align-self:flex-start}.detail-card[data-subject-ready="1"] .card-body{display:flex!important;flex-direction:column!important}`;document.head.appendChild(style);
enhance();new MutationObserver(enhance).observe(document.getElementById('detailContent')||document.body,{childList:true,subtree:true});
})();