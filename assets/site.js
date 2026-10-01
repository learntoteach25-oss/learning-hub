(()=>{
'use strict';
const catalogue=document.getElementById('catalogue');
const detail=document.getElementById('detailView');
const output=document.getElementById('detailContent');
const back=document.getElementById('backToCatalogue');
const menuButton=document.getElementById('mobileMenuButton');
const mobileNav=document.getElementById('mobileNav');
const TEACHER_FORM='https://docs.google.com/forms/d/e/1FAIpQLSdZ-W5Yct8zPLFwICYdYWmg3iAPZr6J_LcWMRxdtIE5yPW8nA/viewform';

const subjects=[
['Mathematics','Numeracy, problem solving, algebra, geometry and exam preparation.','https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=900&q=82'],
['English','Reading, writing, language, literature and communication skills.','https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=82'],
['General Science','Foundational scientific knowledge and enquiry skills.','https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=900&q=82'],
['Biology','Living systems, human biology, ecology and examination support.','https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=900&q=82'],
['Chemistry','Chemical principles, calculations, practical concepts and revision.','https://images.unsplash.com/photo-1532634993-15f421e42ec0?auto=format&fit=crop&w=900&q=82'],
['Physics','Forces, energy, electricity, waves and problem solving.','https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=900&q=82'],
['Computer Science / ICT','Computing concepts, digital literacy and curriculum support.','https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=82'],
['Business Studies','Business organisation, operations, marketing, finance and strategy.','https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=82'],
['Economics','Microeconomics, macroeconomics, data response and evaluation.','https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=900&q=82'],
['Accounting','Financial records, statements, analysis and examination practice.','https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=900&q=82'],
['Psychology','Core approaches, research methods, studies and evaluation skills.','https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=900&q=82'],
['Sociology','Society, institutions, identity, research and analytical writing.','https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=82'],
['History','Historical knowledge, evidence, interpretation and essay skills.','https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=900&q=82'],
['Geography','Physical and human geography, case studies and data skills.','https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=900&q=82'],
['Environmental Science','Ecosystems, sustainability, resources and environmental issues.','https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=82'],
['Social Studies','People, communities, citizenship and interdisciplinary learning.','https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=900&q=82'],
['Primary Subjects','Structured support across core primary learning areas.','https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=900&q=82'],
['Homework Support','Guided help with schoolwork, understanding and completion.','https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=82'],
['Revision & Exam Support','Revision planning, practice, technique and exam confidence.','https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=82']
];
const groups=[['Core Academic Subjects',subjects.slice(0,7)],['Business & Humanities',subjects.slice(7,16)],['Primary & Learning Support',subjects.slice(16)]];
const curricula=['Primary / Lower Secondary','IGCSE','GCSE','Cambridge International (CIE)','Pearson Edexcel','OxfordAQA','International Baccalaureate (IB)','AS & A Level'];
const quran=[['Noorani Qaida','Arabic letters, joining, pronunciation and reading foundations.'],['Quran Reading','Guided reading practice for accuracy, fluency and confidence.'],['Tajweed','Essential Tajweed rules with supported application in recitation.'],['Hifz Support','Structured memorisation, revision and consistency support.'],['Islamic Studies','Faith, worship, manners and everyday Islamic understanding.'],['Seerah & Islamic History','Seerah and key events in Islamic history through structured lessons.']];
const exams=[['IELTS','International English Language Testing System preparation.'],['PTE Academic','Pearson Test of English Academic preparation.'],['TOEFL','Test of English as a Foreign Language preparation.'],['International & School Exams','Targeted revision and examination support.']];

function home(push=true){detail.hidden=true;catalogue.hidden=false;if(push)history.pushState({view:'home'},'','/');window.scrollTo({top:0,behavior:'smooth'});}
function subjectFolder([name,description,image]){return `<details class="subject-folder"><summary><span class="subject-image"><img src="${image}" alt="${name}"></span><span class="subject-copy"><strong>${name}</strong><small>${description}</small><em>View programmes & curriculum options</em></span><span class="folder-toggle" aria-hidden="true">+</span></summary><div class="subject-programmes"><div class="subject-programmes-head"><strong>${name} programmes</strong><span>Choose the curriculum or level that applies to the learner.</span></div><div class="curriculum-list">${curricula.map(c=>`<a href="billing.html?programme=${encodeURIComponent(name+' — '+c)}"><span>${c}</span><b>Continue →</b></a>`).join('')}</div></div></details>`;}
function programmesView(){return `<div class="detail-content programmes-view"><span class="eyebrow">Learning Programmes</span><h1>Choose a subject</h1><p>Open a subject folder to see its programme and curriculum pathways. Booking appears only after you choose the relevant pathway.</p>${groups.map(([title,items])=>`<section class="subject-section"><div class="subject-section-head"><h2>${title}</h2><span>${items.length} learning areas</span></div><div class="subject-folder-grid">${items.map(subjectFolder).join('')}</div></section>`).join('')}</div>`;}
function quranView(){return `<div class="detail-content"><span class="eyebrow">Quran & Islamic Studies</span><h1>Quran & Islamic Learning</h1><p>Choose the learning area first. Each pathway is kept clear and separate for children, young learners, adults and beginners.</p><div class="detail-grid">${quran.map(([name,description])=>`<article class="detail-card"><h2>${name}</h2><p>${description}</p><a href="billing.html?programme=${encodeURIComponent(name)}">View & Book</a></article>`).join('')}</div></div>`;}
function examsView(){return `<div class="detail-content"><span class="eyebrow">Exam Preparation</span><h1>English Proficiency & Exam Support</h1><p>IELTS, PTE Academic and other examination support remain visible as separate learning pathways.</p><div class="detail-grid">${exams.map(([name,description])=>`<article class="detail-card"><h2>${name}</h2><p>${description}</p><a href="billing.html?programme=${encodeURIComponent(name)}">View & Book</a></article>`).join('')}</div></div>`;}
function simpleView(label,title,intro,items){return `<div class="detail-content"><span class="eyebrow">${label}</span><h1>${title}</h1><p>${intro}</p><div class="detail-grid">${items.map(name=>`<article class="detail-card"><h2>${name}</h2><p>Explore structured, personalised support for this learning pathway.</p><a href="billing.html?programme=${encodeURIComponent(name)}">View & Book</a></article>`).join('')}</div></div>`;}
function show(view,push=true){if(view==='teacher'){window.location.href=TEACHER_FORM;return;}if(view==='programmes')output.innerHTML=programmesView();else if(view==='quran')output.innerHTML=quranView();else if(view==='exams')output.innerHTML=examsView();else if(view==='boards')output.innerHTML=simpleView('International Boards','International Curriculum Support','Choose the relevant international curriculum pathway.',['International Baccalaureate (IB)','Cambridge International (CIE)','Pearson Edexcel','OxfordAQA','IGCSE','GCSE']);else if(view==='support')output.innerHTML=simpleView('Learning Support','Personalised Learning Support','Support designed around individual learner needs, pace and goals.',['Foundational Learning','Learning Differences','Catch-Up Learning','Homework Support','Revision Support']);else if(view==='resources')output.innerHTML=simpleView('Learning Resources','Resources for Learning & Practice','Explore free and premium learning resources.',['Free Learning Library','Premium Digital Resources']);else{home(push);return;}catalogue.hidden=true;detail.hidden=false;if(push){const url=new URL(location.href);url.search='';url.searchParams.set('view',view);history.pushState({view},'',url);}window.scrollTo({top:0,behavior:'smooth'});}
document.querySelectorAll('[data-view]').forEach(el=>el.addEventListener('click',()=>show(el.dataset.view)));
back?.addEventListener('click',()=>home());
menuButton?.addEventListener('click',()=>{const open=mobileNav.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));});
addEventListener('popstate',load);
function load(){const view=new URLSearchParams(location.search).get('view');if(view==='teacher'){window.location.replace(TEACHER_FORM);return;}view?show(view,false):home(false);}
load();
})();