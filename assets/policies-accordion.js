(()=>{
'use strict';
function initPolicyAccordions(){
  if(!document.body.classList.contains('policy-page') && !document.querySelector('.policy-page')) return;
  const sections=[...document.querySelectorAll('.policy-section')];
  if(!sections.length) return;
  const style=document.createElement('style');
  style.id='policy-accordion-style';
  style.textContent=`
    .policy-section{padding:0!important;overflow:hidden!important;background:#fffdf8!important;border:1px solid #dfbd72!important;border-radius:16px!important;box-shadow:0 8px 24px rgba(46,32,8,.05)!important;transition:box-shadow .25s ease,border-color .25s ease!important}
    .policy-section:hover{border-color:#d6a22f!important;box-shadow:0 10px 30px rgba(46,32,8,.08)!important}
    .policy-section .section-head{position:relative!important;display:grid!important;grid-template-columns:58px minmax(0,1fr) 44px!important;column-gap:20px!important;align-items:center!important;margin:0!important;padding:24px 28px!important;border:0!important;cursor:pointer!important;user-select:none!important;background:linear-gradient(90deg,#fffdf8 0%,#fffaf0 100%)!important}
    .policy-section .section-head::after{content:'+'!important;grid-column:3!important;grid-row:1!important;width:40px!important;height:40px!important;display:grid!important;place-items:center!important;border-radius:50%!important;background:#090909!important;border:1px solid #d6a22f!important;color:#f2c85b!important;font:400 27px/1 Arial,sans-serif!important;transition:transform .25s ease,background .25s ease!important}
    .policy-section.is-open .section-head::after{content:'−'!important;background:#d6a22f!important;color:#090909!important;transform:rotate(180deg)!important}
    .policy-section .section-head>div:last-of-type{grid-column:2!important;grid-row:1!important;padding:0!important;min-width:0!important}
    .policy-section .section-head h2{margin:0!important;font:700 28px/1.18 Georgia,serif!important;color:#17130d!important}
    .policy-section .section-head h2:after{content:''!important;display:block!important;width:44px!important;height:2px!important;margin-top:9px!important;background:#d6a22f!important}
    .policy-section .section-head p{margin:8px 0 0!important;max-width:900px!important;color:#5c554b!important;font:14px/1.55 Arial,sans-serif!important}
    .policy-section .policy-grid{display:none!important;padding:6px 30px 28px!important;border-top:1px solid #eadbb9!important;background:#fffdf8!important}
    .policy-section.is-open .policy-grid{display:grid!important;animation:policyReveal .24s ease both!important}
    @keyframes policyReveal{from{opacity:0;transform:translateY(-7px)}to{opacity:1;transform:none}}
    .policy-section .section-head:focus-visible{outline:3px solid rgba(214,162,47,.35)!important;outline-offset:-3px!important}
    @media(max-width:600px){.policy-section .section-head{grid-template-columns:48px minmax(0,1fr) 38px!important;column-gap:12px!important;padding:19px 16px!important}.policy-section .section-head::after{width:36px!important;height:36px!important;font-size:24px!important}.policy-section .section-head h2{font-size:22px!important}.policy-section .section-head p{font-size:12.5px!important}.policy-section .policy-grid{padding:4px 18px 22px!important}}
  `;
  document.head.appendChild(style);
  sections.forEach((section,index)=>{
    const head=section.querySelector('.section-head');
    const grid=section.querySelector('.policy-grid');
    if(!head||!grid) return;
    const panelId=(section.id||`policy-${index+1}`)+'-panel';
    grid.id=panelId;
    head.setAttribute('role','button');
    head.setAttribute('tabindex','0');
    head.setAttribute('aria-controls',panelId);
    head.setAttribute('aria-expanded','false');
    const setOpen=(open)=>{
      section.classList.toggle('is-open',open);
      head.setAttribute('aria-expanded',String(open));
    };
    head.addEventListener('click',()=>setOpen(!section.classList.contains('is-open')));
    head.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setOpen(!section.classList.contains('is-open'));}});
  });
  function openHash(){
    const id=location.hash.slice(1);
    if(!id) return;
    const section=document.getElementById(id);
    if(section?.classList.contains('policy-section')){
      section.classList.add('is-open');
      section.querySelector('.section-head')?.setAttribute('aria-expanded','true');
    }
  }
  document.querySelectorAll('.policy-card a[href^="#"]').forEach(a=>a.addEventListener('click',()=>setTimeout(openHash,0)));
  openHash();
  window.addEventListener('hashchange',openHash);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initPolicyAccordions); else initPolicyAccordions();
})();