(()=>{
'use strict';
const subjects={
'MBA Support':['Accounting & Financial Management','Business Research Methods','Economics for Managers','Human Resource Management','Marketing Management','Operations Management','Organisational Behaviour','Strategic Management','Business Communication','Entrepreneurship','Project / Assignment Support'],
'BBA Support':['Accounting','Business Communication','Business Mathematics','Economics','Finance','Human Resource Management','Marketing','Management','Organisational Behaviour','Entrepreneurship','Statistics','Project / Assignment Support'],
'BA Support':['English Language','English Literature','Psychology','Sociology','History','Geography','Economics','Education','Communication Studies','Political Science','Research & Academic Writing','Project / Assignment Support'],
'B.Ed Support':['Educational Psychology','Curriculum & Instruction','Teaching Methods','Classroom Management','Assessment & Evaluation','Educational Technology','Inclusive Education','Research Methods','Lesson Planning','Assignment Support'],
'M.Ed Support':['Advanced Educational Psychology','Curriculum Development','Educational Leadership & Management','Assessment & Evaluation','Research Methods','Inclusive Education','Educational Technology','Teacher Education','Dissertation / Research Support','Assignment Support']
};
const book=n=>`billing.html?programme=${encodeURIComponent(n)}`;
function apply(){
 document.querySelectorAll('.subject-card').forEach(card=>{
  const title=card.querySelector('h2')?.textContent.trim();
  const list=subjects[title];
  if(!list||card.querySelector('.higher-subject-select'))return;
  const body=card.querySelector('.card-body');
  const link=card.querySelector('.subject-book');
  if(!body||!link)return;
  const label=document.createElement('label'); label.className='board-label higher-subject-label'; label.textContent='Choose subject';
  const select=document.createElement('select'); select.className='board-select higher-subject-select'; select.setAttribute('aria-label',`Choose ${title} subject`);
  select.innerHTML='<option value="">Choose a subject</option>'+list.map(s=>`<option value="${s}">${s}</option>`).join('');
  select.addEventListener('change',()=>{link.href=book(select.value?`${title} — ${select.value}`:title)});
  body.insertBefore(label,link); body.insertBefore(select,link);
 });
}
new MutationObserver(apply).observe(document.body,{childList:true,subtree:true});
apply();
})();