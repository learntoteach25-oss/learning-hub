(()=>{
'use strict';
function loadSharedShell(){
  if(document.querySelector('script[data-lh-shared-shell]'))return;
  const s=document.createElement('script');
  s.src='assets/site-shell.js?v=20261002-shell1';
  s.dataset.lhSharedShell='1';
  document.head.appendChild(s);
}
loadSharedShell();
const ROOT_PATHS=new Set(['/','/index.html']);
const root=ROOT_PATHS.has(location.pathname);
const qs=s=>document.querySelector(s),qsa=s=>[...document.querySelectorAll(s)];
const catalogue=()=>qs('.areas')||qs('.catalogue-page');
const views=()=>qsa('.detail-view');
function normalize(v){return String(v||'').toLowerCase().trim().replace(/\s+/g,'-').replace(/&/g,'and')}
function findView(name){const n=normalize(name);return views().find(v=>normalize(v.dataset.view||v.id)===n)||null}
function showCatalogue(push=true){if(!root){location.href='/';return}document.body.classList.add('lh-catalogue-home');views().forEach(v=>v.classList.remove('active'));const c=catalogue();if(c){c.style.display='block';c.removeAttribute('hidden')}['.hero','.contact-wrap','.feedback-wrap','.about-wrap'].forEach(sel=>qsa(sel).forEach(el=>el.style.display='none'));if(push)history.pushState({view:'catalogue'},'',location.pathname);scrollTo({top:0,behavior:'smooth'})}
function openView(name,push=true){if(!root){location.href='/?view='+encodeURIComponent(name);return}const v=findView(name);if(!v)return;const c=catalogue();if(c)c.style.display='none';views().forEach(x=>x.classList.toggle('active',x===v));v.style.display='block';if(push)history.pushState({view:normalize(name)},'','?view='+encodeURIComponent(normalize(name)));scrollTo({top:0,behavior:'smooth'})}
function initial(){if(!root)return;document.body.classList.add('lh-catalogue-home');const requested=new URLSearchParams(location.search).get('view');if(requested&&findView(requested))openView(requested,false);else showCatalogue(false)}
document.addEventListener('click',e=>{const back=e.target.closest('.back-home,[data-home]');if(back){e.preventDefault();showCatalogue();return}const trigger=e.target.closest('[data-view],[data-open]');if(trigger){const name=trigger.dataset.view||trigger.dataset.open;if(findView(name)){e.preventDefault();openView(name);return}}});
addEventListener('popstate',()=>{if(!root)return;const requested=new URLSearchParams(location.search).get('view');requested&&findView(requested)?openView(requested,false):showCatalogue(false)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initial);else initial();
})();