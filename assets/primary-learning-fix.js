(()=>{
'use strict';
const PRIMARY_FOLDER_IMAGE='https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=88';
const CARD_IMAGES=[
 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=86',
 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=900&q=86',
 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=86',
 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=86'
];
const LABELS=[
 ['Primary Subjects','Structured learning across core primary subjects and essential skills.'],
 ['Homework Guidance','Guided help with schoolwork, understanding and independent completion.'],
 ['Revision & Exam Preparation','Revision planning, practice, technique and exam confidence.'],
 ['Foundational Learning','Literacy, numeracy and essential skills taught through structured practice.']
];
function patchFolder(){
 const folder=document.querySelector('.programme-folder[data-programme-group="primary"]');
 if(!folder)return;
 const img=folder.querySelector('img'),strong=folder.querySelector('.folder-copy strong'),em=folder.querySelector('.folder-copy em');
 if(img){img.src=PRIMARY_FOLDER_IMAGE;img.alt='Primary Learning';}
 if(strong)strong.textContent='Primary Learning';
 if(em)em.textContent='Practical learning for younger learners, homework, revision and stronger foundations.';
}
function patchPrimaryView(){
 const root=document.querySelector('.programme-group-view');
 if(!root)return;
 const h1=root.querySelector('h1');
 if(!h1 || !/Primary|Learning Support/i.test(h1.textContent))return;
 h1.textContent='Primary Learning';
 const intro=root.querySelector(':scope > p');
 if(intro)intro.textContent='Practical learning for younger learners, homework, revision and stronger foundations.';
 root.classList.add('primary-learning-view');
 const cards=[...root.querySelectorAll('.programme-items .detail-card')];
 cards.forEach((card,i)=>{
   if(!LABELS[i])return;
   const img=card.querySelector('img'),title=card.querySelector('h2'),p=card.querySelector('.card-body > p');
   if(img){img.src=CARD_IMAGES[i];img.alt=LABELS[i][0];}
   if(title)title.textContent=LABELS[i][0];
   if(p)p.textContent=LABELS[i][1];
   const select=card.querySelector('.board-select');
   if(select && i>0){select.closest('.subject-card')?.classList.add('no-board-choice');select.remove();card.querySelector('.board-label')?.remove();}
   const book=card.querySelector('.subject-book');
   if(book)book.href=`billing.html?programme=${encodeURIComponent(LABELS[i][0])}`;
 });
}
function patch(){patchFolder();patchPrimaryView();}
new MutationObserver(patch).observe(document.body,{childList:true,subtree:true});
document.addEventListener('click',()=>setTimeout(patch,0));
patch();
})();