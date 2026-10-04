(()=>{
'use strict';
const FOLDER_IMAGE='https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=88';
const CARD_IMAGES=['https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=86','https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=900&q=86','https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=86','https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=86'];
const COPY=[['Primary Subjects','Structured learning across core primary subjects and essential skills.'],['Homework Guidance','Guided help with schoolwork, understanding and independent completion.'],['Revision & Exam Preparation','Revision planning, practice, technique and exam confidence.'],['Foundational Learning','Literacy, numeracy and essential skills taught through structured practice.']];
function fix(){
 const folder=document.querySelector('.programme-folder[data-programme-group="primary"]');
 if(folder){const img=folder.querySelector('img'),title=folder.querySelector('.folder-copy strong'),intro=folder.querySelector('.folder-copy em');if(img){img.src=FOLDER_IMAGE;img.alt='Primary Learning';img.style.objectPosition='center 48%';}if(title)title.textContent='Primary Learning';if(intro)intro.textContent='Practical learning for younger learners, homework, revision and stronger foundations.';}
 const group=document.querySelector('.programme-group-view');
 if(!group)return;
 const h1=group.querySelector(':scope > h1');
 if(!h1||!/Primary|Learning Support/i.test(h1.textContent))return;
 group.classList.add('primary-learning-view');h1.textContent='Primary Learning';
 const p=group.querySelector(':scope > p');if(p)p.textContent='Practical learning for younger learners, homework, revision and stronger foundations.';
 [...group.querySelectorAll('.programme-items .detail-card')].forEach((card,i)=>{if(!COPY[i])return;const img=card.querySelector('img'),title=card.querySelector('h2'),desc=card.querySelector('.card-body > p');if(img){img.src=CARD_IMAGES[i];img.alt=COPY[i][0];img.style.objectPosition='center';}if(title)title.textContent=COPY[i][0];if(desc)desc.textContent=COPY[i][1];if(i>0){card.querySelector('.board-label')?.remove();card.querySelector('.board-select')?.remove();}const a=card.querySelector('.subject-book');if(a)a.href=`billing.html?programme=${encodeURIComponent(COPY[i][0])}`;});
}
const target=document.getElementById('detailContent');if(target)new MutationObserver(fix).observe(target,{childList:true,subtree:true});document.addEventListener('click',()=>setTimeout(fix,0));fix();
})();