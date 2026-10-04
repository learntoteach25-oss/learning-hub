(()=>{
'use strict';
const detail=document.getElementById('detailContent');
if(!detail)return;

function refineLabels(){
  detail.querySelectorAll('.programme-folder').forEach(folder=>{
    const key=folder.dataset.programmeGroup;
    const title=folder.querySelector('.folder-copy strong');
    if(key==='higher' && title) title.textContent='Higher Education';
  });
  detail.querySelectorAll('.detail-card h2').forEach(h=>{
    if(h.textContent.trim()==='Math Kangaroo') h.textContent='Kangaroo Competitions';
  });
}

const observer=new MutationObserver(refineLabels);
observer.observe(detail,{childList:true,subtree:true});
refineLabels();

// Fallback navigation for programme folders so every folder remains clickable.
detail.addEventListener('click',e=>{
  const folder=e.target.closest('.programme-folder');
  if(!folder)return;
  // Let site.js handle the normal click first. If it does not change the view,
  // dispatch a clean keyboard-style activation on the same button.
  const key=folder.dataset.programmeGroup;
  if(!key)return;
  setTimeout(()=>{
    if(detail.querySelector(`.programme-folder[data-programme-group="${key}"]`)){
      const evt=new KeyboardEvent('keydown',{key:'Enter',bubbles:true});
      folder.dispatchEvent(evt);
    }
  },0);
},true);
})();