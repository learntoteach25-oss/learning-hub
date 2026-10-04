(()=>{
'use strict';
const LOGO='assets/learning-hub-logo.png?v=approved-20260923';
function enhanceFeedback(){const section=document.querySelector('.reviews');if(!section)return;const reviews=[
{name:'王雨桐 (Wang Yutong)',place:'China',lang:'zh',dir:'ltr',text:'这个老师上课很有意思，会鼓励我，并说没关系。互动感很强。'},
{name:'ريم العتيبي (Reem Al-Otaibi)',place:'Saudi Arabia',lang:'ar',dir:'rtl',text:'واااااااو أقولكم احجزوها وانتوا مغمضين، النطق والشرح والتفاعل واووو!'},
{name:'Nicha S.',place:'Thailand',lang:'en',dir:'ltr',text:'She is gentle, patient and very good at guiding students. I feel comfortable speaking in class.'},
{name:'陈欣怡 (Chen Xinyi)',place:'China',lang:'zh',dir:'ltr',text:'我很喜欢这个老师。老师很有耐心，也会鼓励我。'},
{name:'نور الخالد (Noor Al-Khaled)',place:'Kuwait',lang:'ar',dir:'rtl',text:'الشرح واضح والتفاعل ممتاز، والمعلمة صبورة وتشجعني كثيراً أثناء الدرس.'},
{name:'Alya H.',place:'Malaysia',lang:'en',dir:'ltr',text:'The lessons are interesting and interactive. She gives me enough time to think and answer confidently.'},
{name:'林子涵 (Lin Zihan)',place:'China',lang:'zh',dir:'ltr',text:'挺好。善于用道具，引导孩子，回答对了还会给奖励。'},
{name:'عبدالله السالم (Abdullah Al-Salem)',place:'Saudi Arabia',lang:'ar',dir:'rtl',text:'النطق والشرح والتفاعل رائع، أحب أسلوب الدرس وأشعر أنني أتعلم بثقة.'},
{name:'Pimchanok K.',place:'Thailand',lang:'en',dir:'ltr',text:'The class is energetic and engaging, and corrections are explained kindly and clearly.'},
{name:'Hana A.',place:'Malaysia',lang:'en',dir:'ltr',text:'She adjusts the lesson pace when I need more time and always encourages me to keep trying.'}
];
section.innerHTML=`<div class="reviews-head"><div class="reviews-title"><span class="eyebrow">Learner Voices</span><div><h2>What Our Learners Say!</h2><p>Student experiences from across our international learning community.</p></div></div><div class="review-controls"><button class="lh-review-prev" type="button" aria-label="Previous reviews">←</button><button class="lh-review-next" type="button" aria-label="Next reviews">→</button></div></div><div class="review-window"><div class="review-track lh-review-track">${reviews.map((r,i)=>`<article class="review-slide"><div class="review-card" role="button" tabindex="0" data-i="${i}"><div class="review-top"><div class="review-person"><strong>${r.name}</strong><small>${r.place}</small></div><span class="stars">★★★★★</span></div><p class="review-text" lang="${r.lang}" dir="${r.dir}">${r.text}</p><span class="read-cue">Click to read ↗</span></div></article>`).join('')}</div></div><div class="review-dots lh-review-dots"></div>`;
const track=section.querySelector('.lh-review-track'),slides=[...track.children],dots=section.querySelector('.lh-review-dots');let index=0,timer;
const visible=()=>innerWidth<=620?1:innerWidth<=900?2:3,maxIndex=()=>Math.max(0,slides.length-visible());
function paint(){const card=slides[0].getBoundingClientRect().width;track.style.transform=`translate3d(-${index*(card+12)}px,0,0)`;[...dots.children].forEach((d,n)=>d.classList.toggle('active',n===index))}
function go(n){const max=maxIndex();index=n>max?0:n<0?max:n;paint()}
function start(){clearInterval(timer);timer=setInterval(()=>go(index+1),2800)}
for(let i=0;i<=maxIndex();i++){const d=document.createElement('button');d.type='button';d.className='review-dot'+(i===0?' active':'');d.onclick=()=>{go(i);start()};dots.appendChild(d)}
section.querySelector('.lh-review-prev').onclick=()=>{go(index-1);start()};section.querySelector('.lh-review-next').onclick=()=>{go(index+1);start()};
section.querySelectorAll('.review-card').forEach(card=>card.onclick=()=>{const r=reviews[+card.dataset.i],m=document.getElementById('reviewModal'),t=document.getElementById('modalText'),meta=document.getElementById('modalMeta');if(m&&t&&meta){meta.textContent=`${r.name} • ${r.place}`;t.textContent=r.text;t.dir=r.dir;m.classList.add('open');m.setAttribute('aria-hidden','false')}});
addEventListener('resize',()=>{index=Math.min(index,maxIndex());paint()});paint();start()}
function mount(){enhanceFeedback()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();