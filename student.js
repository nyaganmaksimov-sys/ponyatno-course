(() => {
'use strict';
const {lessons,modules}=window.CourseData;
const main=document.getElementById('main');
const life=[['group','Выбрать занятие долголетия'],['water','Проверить показания воды'],['family','Подготовить фото для близкого'],['call','Распознать подозрительный звонок']];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const valid=(v,ids)=>new Set(Array.isArray(v)?v.filter(x=>ids.includes(x)):[]);
function model(state,lifeState){
 const ids=lessons.map(l=>l.id);
 const completed=valid(state.completed,ids), practiced=valid(state.practiced,ids), passed=valid(state.passed,ids), doneLife=valid(lifeState,life.map(x=>x[0]));
 const path=['pc','phone','all'].includes(state.path)?state.path:'all';
 const selected=lessons.filter(l=>path==='all'||l.module===path||['safe','gov','final'].includes(l.module));
 const count=selected.filter(l=>completed.has(l.id)).length;
 const next=selected.find(l=>!completed.has(l.id));
 const stage=next?(practiced.has(next.id)?'quiz':'theory'):'theory';
 return {completed,practiced,passed,doneLife,path,selected,count,next,stage};
}
function render(state,storageOK){
 document.title='Мой кабинет — Понятно';
 let raw=[],ok=storageOK;
 try{raw=JSON.parse(localStorage.getItem('ponyatno-life-v1')||'[]');}catch{ok=false;}
 const m=model(state,raw), total=m.selected.length;
 const achievements=[['Первый шаг','Завершено первое занятие',m.completed.size>0],['Уверенный пользователь','Завершены три занятия',m.completed.size>=3],['Безопасный интернет','Пройдены оба занятия по безопасности',m.completed.has('web-address')&&m.completed.has('safe-codes')],['Практика для жизни','Пройдены все четыре жизненных тренажёра',m.doneLife.size===life.length],['Мой учебный маршрут','Завершены все занятия выбранного маршрута',m.count===total]];
 const link=(l,stage)=>'#lesson/'+l.id+'/'+stage;
 const routeName={all:'Весь курс',pc:'Компьютер',phone:'Android'}[m.path];
 main.innerHTML=`<div class="student-page"><div class="page-heading"><div class="eyebrow">Ваши успехи</div><h1>Мой кабинет</h1><p>Здесь видно, чему вы уже научились. Продолжайте в удобном темпе.</p></div>
 ${!ok?'<p class="notice">Не удалось прочитать или сохранить часть прогресса в браузере. Отчёт может быть неполным.</p>':''}
 <section class="student-summary"><div><p class="student-label">Ваш маршрут: ${routeName}</p><h2>${m.count} из ${total} занятий</h2><div class="progress-track" role="progressbar" aria-label="Завершённые занятия маршрута" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${m.count}"><span style="width:${100*m.count/total}%"></span></div><p>${m.next?'Следующее занятие: '+esc(m.next.title):'Поздравляем! Ваш учебный маршрут завершён.'}</p></div><div class="student-actions no-print"><a class="btn primary" href="${m.next?link(m.next,m.stage):'#program'}">${m.next?'Продолжить обучение':'Повторить занятия'}</a><button class="btn" type="button" data-student-print>Распечатать результаты</button></div></section>
 <div class="student-metrics"><article><strong>${m.practiced.size} / ${lessons.length}</strong><span>Практические задания</span></article><article><strong>${m.passed.size} / ${lessons.length}</strong><span>Пройденные тесты</span></article><article><strong>${m.doneLife.size} / ${life.length}</strong><span>Жизненные тренажёры</span></article></div>
 <section class="student-section"><h2>Мои достижения</h2><div class="student-achievements">${achievements.map(([title,desc,earned])=>`<article class="student-award ${earned?'earned':''}"><span class="student-award-mark" aria-hidden="true">${earned?'✓':'○'}</span><div><h3>${title}</h3><p>${desc}</p><span class="small-note">${earned?'Получено':'Впереди'}</span></div></article>`).join('')}</div></section>
 <section class="student-section"><h2>Что повторить</h2><p>Если осталось незавершённое задание или тест, можно вернуться к нему.</p><div class="student-list">${m.selected.filter(l=>!m.completed.has(l.id)&&(m.practiced.has(l.id)||m.passed.has(l.id)||Object.prototype.hasOwnProperty.call(state.answers||{},l.id))).map(l=>`<a class="student-row" href="${link(l,m.practiced.has(l.id)?'quiz':'practice')}"><strong>${esc(l.title)}</strong><span>Продолжить →</span></a>`).join('')||'<p>Незавершённых заданий для повторения пока нет. Можно открыть любое занятие ниже.</p>'}</div></section>
 <section class="student-section"><h2>Мои занятия</h2>${modules.map(mod=>{const ls=m.selected.filter(l=>l.module===mod.id);return ls.length?`<h3>${esc(mod.title)}</h3><div class="student-list">${ls.map(l=>`<a class="student-row" href="${link(l,'theory')}"><strong>${esc(l.title)}</strong><span>${m.completed.has(l.id)?'✓ Завершено':'Не завершено'}</span></a>`).join('')}</div>`:'';}).join('')}</section>
 <section class="student-section"><h2>Практика для жизни</h2><div class="student-list">${life.map(([id,title])=>`<a class="student-row" href="#life/${id}"><strong>${title}</strong><span>${m.doneLife.has(id)?'✓ Завершено':'Попробовать'}</span></a>`).join('')}</div></section>
 <section class="student-section student-notice"><h2>О ваших результатах</h2><p>Это личный учебный отчёт, а не официальный сертификат или подтверждение посещаемости. Результаты хранятся только в этом браузере. Если очистить данные браузера или перейти на другое устройство, прогресс может быть недоступен.</p><p>На общем компьютере результаты относятся к текущему браузеру, а не к отдельному человеку. Не вводите личные данные.</p><p class="student-print-date">Дата отчёта: ${new Date().toLocaleDateString('ru-RU')}</p></section></div>`;
}
main.addEventListener('click',e=>{if(e.target.closest('[data-student-print]'))window.print();});
window.CourseStudent={render,model};
})();