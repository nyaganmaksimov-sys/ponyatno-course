(() => {
  'use strict';
  const C = window.EducationWorkspaceCore.create(window.EducationCatalog);
  const key = 'ponyatno-education-workspace-v1';
  const A = window.EducationAdmissionCore.create(C, window.EducationOrganization, window.EducationCatalog);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const attendanceLabels = { '': 'Не отмечено', present: 'Был на занятии', absent: 'Пропустил', excused: 'Уважительная причина' };
  let state = A.upgrade(C.upgrade(C.seed())), storageOK = true, loadWarning = '';
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const saved = JSON.parse(raw);
      if (C.valid(saved) && A.valid(saved)) state = A.upgrade(C.upgrade(saved));
      else loadWarning = 'Сохранённое демо не удалось прочитать. Показан новый пример; прежние данные сохранены до следующего изменения.';
    }
  } catch { storageOK = false; }
  const refresh = () => window.dispatchEvent(new Event('workspacechange'));
  const go = hash => { if (location.hash === hash) refresh(); else location.hash = hash; };
  let toastTimer;
  function toast(message) {
    const node = document.getElementById('workspace-toast');
    if (!node) return;
    node.textContent = message;
    node.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('visible'), 6000);
  }
  function save(message) {
    try { localStorage.setItem(key, JSON.stringify(state)); storageOK = true; loadWarning = ''; }
    catch { storageOK = false; }
    if (message) toast(storageOK ? message : 'Изменение видно сейчас, но не сохранится после закрытия: хранилище браузера недоступно.');
    return storageOK;
  }
  const learner = id => C.learner(state, id);
  const active = () => learner(state.activeLearner) || state.learners[0];
  const group = id => C.group(state, id);
  const course = (id, learnerId) => C.course(state, id, learnerId);
  const assignments = id => C.assigned(state, id);
  const lessonCount = n => n + ' ' + (n % 10 === 1 && n % 100 !== 11 ? 'занятие' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'занятия' : 'занятий');
  const pct = p => p.total ? Math.round(p.done * 100 / p.total) : 0;
  const dateLabel = value => new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', day: 'numeric', month: 'long' }).format(new Date(value + 'T12:00:00Z'));
  const options = (items, selected) => items.map(([id, name]) => `<option value="${esc(id)}" ${id === selected ? 'selected' : ''}>${esc(name)}</option>`).join('');
  const iconPaths = {
    book: '<path d="M3 4h7a3 3 0 0 1 3 3v14a4 4 0 0 0-3-2H3zM21 4h-5a3 3 0 0 0-3 3m0 14a4 4 0 0 1 3-2h5V4"/>',
    family: '<circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 21v-4a6 6 0 0 1 12 0v4m1-7a5 5 0 0 1 7 4v3"/>',
    teacher: '<path d="m2 7 10-4 10 4-10 4zM6 10v5c4 3 8 3 12 0v-5M22 7v8M9 21h6"/>',
    chart: '<path d="M4 3v18h17M9 16v-5m5 5V7m5 9v-9"/>',
    edit: '<path d="m14 5 5 5M4 20l5-1L21 7l-5-5L4 14z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.book}</svg>`;
  const metric = (value, label, detail = '') => `<div class="ws-metric"><strong>${esc(value)}</strong><span>${esc(label)}</span>${detail ? `<small>${esc(detail)}</small>` : ''}</div>`;
  const progress = (p, label = 'Разобрано занятий') => p.total ? `<div class="ws-progress-head"><span>${esc(label)}</span><b>${p.done} из ${p.total}</b></div><div class="progress" role="progressbar" aria-label="${esc(label)}" aria-valuemin="0" aria-valuemax="${p.total || 1}" aria-valuenow="${p.done}"><span style="width:${pct(p)}%"></span></div>` : '<p class="ad-no-materials muted">Электронные материалы пока не назначены.</p>';
  const heading = (kicker, title, description, action = '') => `<div class="ws-heading"><div><div class="kicker">${esc(kicker)}</div><h1>${esc(title)}</h1><p class="muted">${esc(description)}</p></div>${action}</div>`;
  const table = (heads, rows) => `<div class="ws-table-wrap"><table><thead><tr>${heads.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
  const roles = [
    ['student', 'Ученик', 'book'], ['parent', 'Родитель', 'family'], ['teacher', 'Преподаватель', 'teacher'], ['coordinator', 'Координатор', 'family'], ['schedule', 'Расписание', 'calendar'], ['builder', 'Конструктор', 'edit'], ['director', 'Руководитель', 'chart']
  ];
  const chrome = current => `<div class="mobile-cabinet-switch"><span>Демонстрация · учебные профили</span><details><summary>${roles.find(r=>r[0]===current)?.[1] || "Выбрать кабинет"} <span aria-hidden="true">⌄</span></summary><div class="mobile-cabinet-options">${roles.map(([id,title,name])=>`<a href="#${id}" ${id===current?'aria-current="page"':''}>${icon(name)}${title}</a>`).join('')}</div></details></div><div class="ws-demo-strip"><span><b>Умные Лисята · демо АНО «Солнечные лисята»</b> · все профили вымышлены</span><a href="#demo">Сценарий показа</a></div><nav class="ws-role-nav" aria-label="Кабинеты демонстрации">${roles.map(([id, title, name]) => `<a href="#${id}" ${id === current ? 'class="selected" aria-current="page"' : ''}>${icon(name)}${title}</a>`).join('')}</nav>${!storageOK ? '<p class="notice" role="status">Сохранение в браузере недоступно. Изменения действуют до закрытия страницы.</p>' : ''}${loadWarning ? `<p class="notice">${esc(loadWarning)}</p>` : ''}`;
  const organization = window.EducationOrganization;
  const calendar = window.EducationSchedule.create({ C, state: () => state, esc, chrome, heading, options, icon, metric, table, dateLabel, save, go, refresh });
  const admissions = window.EducationAdmission.create({ A, C, state: () => state, esc, chrome, heading, options, icon, metric, table, dateLabel, save, go, refresh });
  const dashboardLinks = (items) => `<div class="cabinet-shortcuts" aria-label="Быстрые действия">${items.map(([ico,title,detail,href])=>`<a href="${esc(href)}"><span class="ws-icon">${icon(ico)}</span><span><b>${esc(title)}</b><small>${esc(detail)}</small></span><span class="cabinet-chevron" aria-hidden="true">›</span></a>`).join('')}</div>`;
  const nextMeeting = (items) => items.filter(m=>(m.status||'planned')==='planned' && m.date>=C.date()).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0];
  const meetingTile = (m, href) => `<section class="cabinet-next-meeting"><span class="ws-icon">${icon('calendar')}</span><div><small>Ближайшая встреча</small><h3>${m?esc(m.title):'Нет запланированных встреч'}</h3><p>${m?esc(dateLabel(m.date)+' · '+m.time+' МСК · '+m.room):'Расписание можно открыть отдельно.'}</p></div><a class="btn" href="${esc(href)}">${m?'Подробнее':'Расписание'}</a></section>`;
  function assignmentProgress(a) {
    const c = course(a.courseId, a.learnerId);
    return { done: c.lessons.filter(l => C.isDone(state, a.learnerId, c.id, l.id)).length, total: c.lessons.length };
  }
  const lessonHref = (person, c, index) => c.custom ? `#workshop/${person}/${c.id}/${c.lessons[index].id}` : `#study/${person}/${c.id}/${index}`;
  function nextLesson(person, c) {
    const index = c.lessons.findIndex(l => !C.isDone(state, person, c.id, l.id));
    return index < 0 ? 0 : index;
  }
  function assignmentCard(a) {
    const c = course(a.courseId, a.learnerId), p = assignmentProgress(a), next = nextLesson(a.learnerId, c);
    return `<article class="card ws-course-card"><span class="tag ${p.done === p.total ? 'ready' : ''}">${p.done === p.total ? 'Все примеры разобраны' : 'Назначено преподавателем'}</span><h3>${esc(c.title)}</h3><p class="muted">${lessonCount(c.lessons.length)} · до ${dateLabel(a.due)}${c.custom ? ' · авторский курс' : ''}</p>${progress(p)}<p class="ws-assignment-note">${esc(a.note)}</p><a class="btn primary" href="${lessonHref(a.learnerId, c, next)}">${p.done === p.total ? 'Повторить курс' : p.done ? 'Продолжить обучение' : 'Начать обучение'}</a></article>`;
  }
  function schedule(person, viewer) { return calendar.personSchedule(person, viewer); }
  function demo() {
    const catalog = window.EducationCatalog;
    const lessonCount = catalog.courses.reduce((n, c) => n + (c.lessons?.length || (c.legacy ? 12 : 0)), 0);
    return chrome('') + `<section class="mobile-welcome"><div class="mobile-welcome-copy"><span>УЧИМСЯ И РАЗВИВАЕМСЯ ВМЕСТЕ</span><h1>Обучение для всей семьи</h1><p>Детям, родителям и старшему поколению.</p><a class="btn primary" href="#apply">Записаться на занятия</a></div><img src="../assets/umnye-lisyata-logo.png" alt="" width="86" height="66"></section><section class="mobile-quick"><h2>С чего начнём?</h2><div>${[['book','Мои курсы','#student'],['calendar','Расписание','#schedule'],['family','Родителям','#parent'],['teacher','Преподавателям','#teacher']].map(([k,t,u])=>`<a href="${u}"><span class="ws-icon">${icon(k)}</span><b>${t}</b></a>`).join('')}</div></section><section class="ws-demo-hero"><div><div class="kicker">ДЕМО ДЛЯ АНО «СОЛНЕЧНЫЕ ЛИСЯТА»</div><h1>Учиться вместе.<br>В любом возрасте.</h1><p>«Умные Лисята» — система обучения и поддержки участников социальных программ. Занятия для детей, родителей и старшего поколения, работа преподавателей и отчётность организации — в одном пространстве.</p><div class="actions"><a class="btn primary" href="#apply">Подать учебную заявку</a><a class="btn" href="#student/child">Демо кабинета ученика</a></div></div><div class="ws-hero-logo"><img src="../assets/umnye-lisyata-logo.png" alt="Умные Лисята — учимся и развиваемся вместе" width="360" height="276"></div></section><div class="ws-metrics mobile-demo-metrics">${metric(catalog.courses.length, 'Учебные программы')}${metric(lessonCount, 'Вводных занятий')}${metric(organization.categories.length, 'Направлений центра')}${metric(state.groups.length, 'Группы в демо')}</div>${directionsHTML()}<div class="ws-section-title"><h2>Пять минут внутри платформы</h2><span class="muted">Один связанный сценарий</span></div><div class="ws-walkthrough">${[
      ['family', 'Участник записывается в программу', 'Оставь учебную заявку, выбери группу и посмотри решение координатора.', '#apply'],
      ['book', 'Ученик проходит занятие', 'Выбери Сашу, продолжи курс и сохрани учебную отметку.', '#student/child'],
      ['family', 'Родитель видит результат', 'Открой прогресс Саши, домашнюю практику и комментарий педагога.', '#parent'],
      ['teacher', 'Преподаватель ведёт группу', 'Проверь отметку, посети журнал и назначь следующий курс.', '#teacher/children'],
      ['calendar', 'Координатор сопровождает участника', 'Проверь места, зачисли участника и открой его учебный кабинет.', '#coordinator'],
      ['edit', 'Автор собирает свой курс', 'Открой пример, измени занятие и опубликуй его внутри демо.', '#builder/custom-presentation'],
      ['chart', 'Руководитель видит картину', 'Посмотри сводку групп, назначений и посещаемости.', '#director']
    ].map(([i, t, d, href]) => `<a class="ws-walk-card" href="${href}"><span class="ws-icon">${icon(i)}</span><div><h3>${t}</h3><p>${d}</p></div><span class="ws-walk-action">Открыть</span></a>`).join('')}</div><section class="panel ws-demo-extras"><div><h2>Программы и учебные материалы</h2><p class="muted">Посмотри примеры социальных программ, материалы для разных возрастов и практические тренажёры.</p></div><div class="actions"><a class="btn" href="#home">Каталог курсов</a><a class="btn" href="#sim">Тренажёры</a><a class="btn" href="#center">Услуги центра</a></div></section><details class="panel ws-details"><summary>Как устроена демонстрация</summary><p>Действия в кабинетах связаны в одном браузере. Это вымышленные профили, без входа в аккаунт и переноса данных на другое устройство. HUB и основной курс используют отдельные демонстрационные данные.</p><p>Материалы подготовлены для показа и требуют проверки педагогами. Учебные отметки показывают разбор примеров, а не подтверждённые навыки или официальную аттестацию.</p><button data-ws-action="reset-open">Подготовить демо заново</button><div id="ws-reset-confirm" hidden><p>Будут сброшены профили, назначения, журнал и авторские черновики этой демонстрации. Отметки обычного каталога и HUB сохранятся.</p><button class="ws-danger" data-ws-action="reset-confirm">Сбросить демонстрацию</button><button data-ws-action="reset-cancel">Оставить данные</button></div></details>`;
  }
  function student(id) {
    if (learner(id)) { state.activeLearner = id; save(); }
    const p = active(), g = group(p.groupId), progressData = C.progress(state, p.id);
    const list = assignments(p.id);
    const next = list.find(a => { const n = assignmentProgress(a); return n.done < n.total; });
    const c = next && course(next.courseId, p.id), index = c ? nextLesson(p.id, c) : 0;
    const meeting = nextMeeting(state.sessions.filter(m => C.isMember(state, p.id, m.groupId)));
    const emptyTitle = meeting?.title || 'Добро пожаловать в группу';
    const emptyText = meeting ? dateLabel(meeting.date) + ' · ' + meeting.time + ' МСК. Программа встречи доступна ниже.' : 'Координатор и преподаватель добавят встречи в расписание. Здесь появятся их программа и материалы.';
    const emptyAction = meeting ? `<a class="btn primary" href="#event/${meeting.id}/${p.id}">Программа встречи</a>` : `<a class="btn" href="#participant/${p.id}">Мои группы</a>`;
    return chrome('student') + heading('КАБИНЕТ УЧЕНИКА', `Привет, ${p.name}!`, 'Небольшие шаги, понятные объяснения и практика в своём темпе.', `<div class="ws-cabinet-actions">${calendar.inboxLink(p.id)}<label class="ws-profile-select">Учебный профиль<select data-ws-change="learner">${options(state.learners.map(x => [x.id, x.name + ' · ' + x.detail]), p.id)}</select></label></div>`) + `${calendar.notificationPreview(p.id)}${meetingTile(meeting,meeting?'#event/'+meeting.id+'/'+p.id:'#schedule/'+g.id)}<div class="ws-student-overview"><section class="ws-next"><span class="tag">${next ? 'Следующий шаг' : !list.length ? 'Занятия со специалистом' : 'Можно повторить'}</span><h2>${next ? esc(c.lessons[index].title) : !list.length ? esc(emptyTitle) : 'Все назначенные примеры разобраны'}</h2><p>${next ? esc(c.lessons[index].goal) : !list.length ? esc(emptyText) : 'Вернись к любому занятию или потренируйся ещё раз.'}</p>${next ? `<a class="btn primary" href="${lessonHref(p.id, c, index)}">Продолжить занятие</a>` : !list.length ? emptyAction : '<a class="btn primary" href="#sim">Открыть тренажёры</a>'}</section><section class="ws-person-card"><div class="ws-avatar">${esc(p.initial)}</div><div><h3>${esc(p.name)}</h3><p class="muted">${esc(p.detail)}</p><p>${C.groupIds(state, p.id).map(id => esc(group(id).name)).join(" · ")}</p></div>${progress(progressData, 'Мой учебный путь')}</section></div>${dashboardLinks([['book','Учебные материалы',list.length+' назначенных курсов',next?lessonHref(p.id,c,index):'#home'],['calendar','Расписание','Встречи моей группы','#schedule/'+g.id],['check','Тренажёры','Практика без риска','#sim'],['family','Записаться','Подать учебную заявку','#apply']])}<div class="ws-section-title"><h2 id="my-courses">Мои курсы</h2><a href="#home">Весь каталог</a></div>${list.length ? `<div class="grid ws-assignment-grid">${list.map(assignmentCard).join('')}</div>` : '<section class="panel"><h2>Занятия и учебные материалы</h2><p>Ты записан на занятия со специалистом. Программа встреч появится в расписании; преподаватель сможет добавить материалы для повторения.</p></section>'}${schedule(p)}<div class="actions">${admissions.entryLink}<a class="btn" href="#applications">Мои учебные заявки</a><a class="btn" href="#participant/${p.id}">Карточка участника</a></div><p class="ws-caption muted">Профили показывают возможности платформы. Данные кабинетов сохраняются в этом браузере.</p>`;
  }
  function parent(childId, guardianKey) {
    const guardian = learner(guardianKey) || learner(state.familyGuardian) || learner('parent');
    const children = C.childrenOf(state, guardian.id);
    const child = children.find(p => p.id === childId) || children.find(p => p.id === state.familyChild) || children[0];
    if (!child) return chrome('parent') + heading('СЕМЕЙНЫЙ КАБИНЕТ', 'Учимся вместе', 'Для этого учебного профиля пока нет связанных детей.', '<a class="btn" href="#apply">Запись в программу</a>');
    state.familyGuardian = guardian.id; state.familyChild = child.id;
    const p = C.progress(state, child.id), g = group(child.groupId);
    const childCourses = assignments(child.id).map(a => course(a.courseId, child.id));
    const childMeetings=state.sessions.filter(m=>C.isMember(state,child.id,m.groupId));const upcoming=nextMeeting(childMeetings);const visited=childMeetings.filter(m=>m.status!=='cancelled'&&m.attendance[child.id]==='present').length;
    const marks = state.marks.filter(m => m.learnerId === child.id).sort((a, b) => b.at.localeCompare(a.at));
    const last = marks.map(m => childCourses.find(c => c.id === m.courseId)?.lessons.find(l => l.id === m.lessonId)).find(Boolean);
    return chrome('parent') + heading('КАБИНЕТ СОПРОВОЖДАЮЩЕГО', 'Рядом с ребёнком', 'Понятный прогресс, домашняя практика и поддержка преподавателя.', `<div class="actions">${calendar.inboxLink(guardian.id)}<a class="btn" href="#student/${guardian.id}">Мои курсы</a></div>`) + `${calendar.notificationPreview(guardian.id)}<div class="ad-family-select"><p class="muted">Сопровождающий: ${esc(guardian.name)}</p>${children.length > 1 ? `<label>Учебный профиль ребёнка<select data-ws-change="admission-family" data-guardian="${guardian.id}">${options(children.map(p => [p.id, p.name]), child.id)}</select></label>` : ''}</div><div class="ws-parent-overview"><section class="panel ws-child-summary"><div class="ws-profile-line"><span class="ws-avatar">${esc(child.initial)}</span><div><h2>${esc(child.name)}</h2><p class="muted">${esc(child.detail)} · ${esc(g.name)}</p></div></div>${progress(p, 'Разобранные учебные примеры')}<p class="muted ws-caption">Это учебные отметки, а не оценка способностей ребёнка.</p></section><section class="panel ws-family-practice"><span class="ws-icon">${icon('family')}</span><h2>Попробуйте вместе дома</h2><p>${esc(last?.home || (childCourses.length ? 'Выберите одно назначенное занятие и вместе обсудите учебную ситуацию.' : 'Практику для повторения дома преподаватель добавит в программу встречи.'))}</p><a href="#student/${child.id}">Открыть задания ребёнка</a></section></div>${meetingTile(upcoming,upcoming?'#event/'+upcoming.id+'/'+guardian.id:'#schedule/'+g.id)}<div class="ws-metrics cabinet-family-metrics">${metric(visited,'Отмеченных посещений')}${metric(childCourses.length,'Назначенных курсов')}</div>${dashboardLinks([['book','Задания ребёнка','Домашняя практика','#student/'+child.id],['calendar','Расписание','Группа ребёнка','#schedule/'+g.id],['family','Запись на занятия','Выбор программы','#apply'],['check','Уведомления','Сообщения центра','#inbox/'+guardian.id]])}<section class="panel"><h2>Комментарий преподавателя</h2><p class="ws-note">${esc(state.notes[child.id] || 'Пока нет комментария.')}</p><p class="muted">${esc(g.teacher)} · учебная заметка</p></section><section class="panel"><h2>Как идут занятия</h2>${!childCourses.length ? '<p class="muted">Программы встреч и отметки посещения доступны в расписании ниже.</p>' : ''}${childCourses.map(c => `<h3>${esc(c.title)}</h3><ol class="ws-lesson-list">${c.lessons.map(l => `<li><span class="ws-lesson-state ${C.isDone(state, child.id, c.id, l.id) ? 'done' : ''}>${C.isDone(state, child.id, c.id, l.id) ? '✓' : '·'}</span><div><b>${esc(l.title)}</b><span class="muted">${C.isDone(state, child.id, c.id, l.id) ? 'Пример разобран' : 'Впереди'}</span></div></li>`).join('')}</ol>`).join('')}</section>${schedule(child, guardian.id)}<div class="actions"><a class="btn" href="#apply">Записаться в программу</a><a class="btn" href="#applications">Учебные заявки</a></div>`;
  }
  function teacher(id) {
    if (group(id)) { state.teacherGroup = id; save(); }
    const g = group(state.teacherGroup) || state.groups[0], people = C.members(state, g.id);
    const meetings = state.sessions.filter(m => m.groupId === g.id);
    const offered = C.available(state).filter(c => c.group === g.audience && (A.program(A.groupProgram(state, g))?.kind !== 'studio' || c.custom));
    const unassigned = offered.filter(c => people.some(p => !assignments(p.id).some(a => a.courseId === c.id)));
    const familyPeople = people.filter(p => C.guardianId(state, p.id));
    const upcoming=nextMeeting(meetings);const todayMeetings=meetings.filter(m=>m.date===C.date()&&m.status!=='cancelled');
    return chrome('teacher') + heading('КАБИНЕТ ПРЕПОДАВАТЕЛЯ', 'Группа под рукой', 'Назначай обучение, отмечай посещения и помогай участникам двигаться дальше.', `<div class="actions"><a class="btn" href="#schedule/${g.id}">Расписание группы</a><a class="btn" href="#builder">Создать свой курс</a></div>`) + `<label class="ws-group-select">Учебная группа<select data-ws-change="group">${options(state.groups.map(g => [g.id, g.name]), g.id)}</select></label>${meetingTile(upcoming,upcoming?'#meeting/'+upcoming.id:'#schedule/'+g.id)}${dashboardLinks([['calendar','Расписание',todayMeetings.length+' встреч сегодня','#schedule/'+g.id],['check','Журнал посещений','Отметки выбранной группы','#journal/'+g.id],['edit','Конструктор','Создать учебные материалы','#builder'],['book','Каталог курсов','Программы обучения','#home']])}<div class="ws-metrics">${metric(people.length, 'Участников')}${metric(offered.length, 'Доступных курсов')}${metric(people.reduce((n, p) => n + C.progress(state, p.id).done, 0), 'Учебных отметок')}${metric(meetings.length, 'Встреч в расписании')}</div><section class="panel"><h2>Участники и учебный прогресс</h2>${table(['Участник', 'Назначено курсов', 'Разобрано занятий', 'Кабинет'], people.map(p => { const n = C.progress(state, p.id); return `<tr><td><b>${esc(p.name)}</b><small>${esc(p.detail)}</small></td><td>${assignments(p.id).length}</td><td><div class="ws-table-progress">${progress(n)}</div></td><td><a href="#participant/${p.id}">Карточка</a> · <a href="#student/${p.id}">Кабинет</a></td></tr>`; }))}</section><div class="ws-two-columns"><section class="panel"><h2>Назначить курс группе</h2><p class="muted">Курс появится у всех участников выбранной группы.</p>${unassigned.length ? `<form data-ws-form="assignment"><input type="hidden" name="groupId" value="${g.id}"><label>Курс<select name="courseId" required>${options(unassigned.map(c => [c.id, c.title + (c.custom ? ' · авторский' : '')]))}</select></label><label>Разобрать до<input type="date" name="due" required min="${C.date()}" value="${C.date(7)}"></label><label>Комментарий участникам<textarea name="note" rows="3" maxlength="500" placeholder="Что повторить дома"></textarea></label><button class="primary">Назначить курс</button><p class="ws-form-feedback" role="status"></p></form>` : '<p>Материалы для занятий можно создать и опубликовать в конструкторе, затем назначить участникам группы.</p><a class="btn" href="#builder">Открыть конструктор</a>'}</section><section class="panel"><h2>Комментарий для семьи</h2>${familyPeople.length ? `<p class="muted">Учебная заметка из карточки участника появится в связанном семейном кабинете.</p>${familyPeople.map(p => `<div class="ad-membership"><h3>${esc(p.name)}</h3><p class="muted">${esc(state.notes[p.id] || 'Комментарий пока не добавлен.')}</p><a class="btn" href="#participant/${p.id}">Открыть учебную заметку</a></div>`).join('')}` : '<p class="muted">У участников этой группы пока не указаны сопровождающие. Учебные заметки доступны в карточках участников.</p>'}</section></div><section class="panel cabinet-journal-entry"><h2>Журнал посещений</h2><p class="muted">Открой отдельный журнал выбранной группы.</p><a class="btn primary" href="#journal/${esc(g.id)}">Открыть журнал</a></section><section class="panel"><h2>Назначения группы</h2>${table(['Участник', 'Курс', 'Срок', 'Разобрано'], people.flatMap(p => assignments(p.id).map(a => { const c = course(a.courseId, p.id), n = assignmentProgress(a); return `<tr><td>${esc(p.name)}</td><td>${esc(c.title)}${c.custom ? ` · версия ${c.revision}` : ''}</td><td>${dateLabel(a.due)}</td><td>${n.done} из ${n.total}</td></tr>`; })))}</section>`;
  }
  function lessonForm(draft, lessonId) {
    const l = draft.lessons.find(l => l.id === lessonId);
    return `<section class="panel"><h2>${l ? 'Редактировать занятие' : 'Добавить занятие'}</h2><form data-ws-form="lesson" data-course="${esc(draft.id)}" data-lesson="${esc(l?.id || '')}"><label>Название занятия<input name="title" required minlength="3" maxlength="100" value="${esc(l?.title || '')}" placeholder="Например: придумываем историю"></label><label>Цель занятия<input name="goal" required maxlength="500" value="${esc(l?.goal || '')}" placeholder="Что участник сможет попробовать"></label><label>Продолжительность, минут<input type="number" name="minutes" required min="5" max="180" step="1" value="${l?.minutes || 20}"></label><label>Объяснение<textarea name="text" required rows="5" maxlength="8000">${esc(l?.text || '')}</textarea></label><label>Практическое задание<textarea name="practice" required rows="3" maxlength="2000">${esc(l?.practice || '')}</textarea></label><label>Повторение дома<textarea name="home" rows="2" maxlength="2000">${esc(l?.home || '')}</textarea></label><div class="actions"><button class="primary">${l ? 'Сохранить занятие' : 'Добавить в программу'}</button>${l ? `<a class="btn" href="#builder/${draft.id}">Отменить редактирование</a>` : ''}</div><p class="ws-form-feedback" role="status"></p></form></section>`;
  }
  function builder(id, lessonId) {
    const d = state.drafts.find(c => c.id === id);
    if (id && !d) return chrome('builder') + heading('КОНСТРУКТОР КУРСОВ', 'Курс не найден', 'Вернись к списку авторских программ.', '<a class="btn" href="#builder">Все черновики</a>');
    if (!d) return chrome('builder') + heading('КОНСТРУКТОР КУРСОВ', 'Твой опыт — новый курс', 'Собери программу из объяснений и практики, затем назначь её учебной группе.') + `<div class="ws-two-columns"><section class="panel"><h2>Новая программа</h2><form data-ws-form="create-course"><label>Название<input name="title" required minlength="3" maxlength="100" placeholder="Чему будем учиться"></label><label>Направление<select name="group" required>${options(window.EducationCatalog.groups.map(g => [g.id, g.title]), 'junior')}</select></label><label>Описание<textarea name="description" rows="3" maxlength="1000" placeholder="Для кого курс и что будем делать"></textarea></label><button class="primary">Создать черновик</button><p class="ws-form-feedback" role="status"></p></form></section><section class="panel"><h2>Авторские программы</h2>${state.drafts.map(c => `<a class="ws-draft-link" href="#builder/${c.id}"><span class="ws-icon">${icon('book')}</span><div><h3>${esc(c.title)}</h3><p class="muted">${lessonCount(c.lessons.length)} · ${c.published ? 'опубликована версия ' + c.revision : 'черновик'}</p></div></a>`).join('')}</section></div>`;
    const same = d.published && JSON.stringify({ title: d.title, group: d.group, description: d.description, lessons: d.lessons }) === JSON.stringify({ title: d.published.title, group: d.published.group, description: d.published.description, lessons: d.published.lessons });
    return chrome('builder') + heading('КОНСТРУКТОР КУРСОВ', d.title, 'Сначала сохрани изменения в форме, затем проверь предпросмотр и опубликуй программу.', '<a class="btn" href="#builder">Все программы</a>') + `<div class="ws-publish-bar"><div><span class="tag ${same ? 'ready' : ''}">${d.published ? same ? 'Опубликована версия ' + d.revision : 'Изменения в черновике' : 'Черновик'}</span><p class="muted">${lessonCount(d.lessons.length)} · ${d.lessons.reduce((n, l) => n + l.minutes, 0)} мин</p></div><div class="actions"><a class="btn" href="#preview/${d.id}">Предпросмотр</a><button class="primary" data-ws-action="publish" data-course="${d.id}" ${same ? 'disabled' : ''}>Опубликовать в демо</button></div></div>${d.published ? '<p class="notice">Курс доступен для назначения группе. Ученики сохраняют ту версию, которую им назначили; изменения черновика её не меняют.</p><a class="btn" href="#teacher">Назначить группе</a>' : ''}<div class="ws-builder-layout"><div><section class="panel"><h2>О программе</h2><form data-ws-form="course" data-course="${d.id}"><label>Название<input name="title" required minlength="3" maxlength="100" value="${esc(d.title)}"></label><label>Направление<select name="group" required>${options(window.EducationCatalog.groups.map(g => [g.id, g.title]), d.group)}</select></label><label>Описание<textarea name="description" rows="3" maxlength="1000">${esc(d.description)}</textarea></label><button>Сохранить описание</button><p class="ws-form-feedback" role="status"></p></form></section>${lessonForm(d, lessonId)}</div><section class="panel ws-outline"><h2>Программа курса</h2>${d.lessons.length ? `<ol class="ws-builder-lessons">${d.lessons.map((l, index) => `<li><h3>${esc(l.title)}</h3><p class="muted">${l.minutes} мин · ${esc(l.goal)}</p><div class="actions"><a class="btn" href="#builder/${d.id}/${l.id}">Изменить</a><button data-ws-action="move" data-course="${d.id}" data-lesson="${l.id}" data-delta="-1" aria-label="Раньше: ${esc(l.title)}" ${index === 0 ? 'disabled' : ''}>Выше</button><button data-ws-action="move" data-course="${d.id}" data-lesson="${l.id}" data-delta="1" aria-label="Позже: ${esc(l.title)}" ${index === d.lessons.length - 1 ? 'disabled' : ''}>Ниже</button></div></li>`).join('')}</ol>` : '<div class="ws-empty">Добавь первое занятие в форме слева.</div>'}<p class="muted ws-caption">Публикация делает программу доступной внутри этой демонстрации. Материалы следует проверить преподавателю.</p></section></div>`;
  }
  function preview(id) {
    const d = state.drafts.find(c => c.id === id);
    if (!d) return chrome('builder') + heading('ПРЕДПРОСМОТР', 'Курс не найден', '', '<a class="btn" href="#builder">В конструктор</a>');
    return chrome('builder') + heading('ПРЕДПРОСМОТР ЧЕРНОВИКА', d.title, d.description, `<a class="btn" href="#builder/${d.id}">Вернуться к редактированию</a>`) + `<p class="notice">Так будет выглядеть сохранённое содержание курса. Предпросмотр не создаёт учебных отметок.</p>${d.lessons.length ? d.lessons.map((l, i) => `<section class="panel"><p class="muted">Занятие ${i + 1} · ${l.minutes} минут</p>${workshopContent(l)}</section>`).join('') : '<section class="panel">В программе пока нет занятий.</section>'}`;
  }
  function workshopContent(l, showTitle = true) {
    return `${showTitle ? `<h2>${esc(l.title)}</h2>` : ''}<p><b>Цель:</b> ${esc(l.goal)}</p><h3>Разбираемся</h3><p class="ws-text">${esc(l.text)}</p><h3>Пробуем на практике</h3><p class="ws-text">${esc(l.practice)}</p>${l.home ? `<h3>Повторение дома</h3><p class="ws-text">${esc(l.home)}</p>` : ''}`;
  }
  function workshop(learnerId, courseId, lessonId) {
    const c = course(courseId, learnerId), person = learner(learnerId);
    const l = c?.custom && c.lessons.find(l => l.id === lessonId);
    if (!person || !l || !assignments(learnerId).some(a => a.courseId === courseId)) return chrome('student') + heading('УЧЕБНОЕ ЗАНЯТИЕ', 'Занятие не назначено', 'Открой программу из кабинета ученика.', '<a class="btn" href="#student">Мои курсы</a>');
    const index = c.lessons.indexOf(l), done = C.isDone(state, learnerId, courseId, lessonId);
    return chrome('student') + `<div class="lesson"><a class="back" href="#student/${learnerId}">В мой кабинет</a><p class="muted">${esc(c.title)} · версия ${c.revision} · ${index + 1} из ${c.lessons.length}</p><h1>${esc(l.title)}</h1><section class="panel">${workshopContent(l, false)}</section><section class="panel"><h2>Попробовал задание?</h2><p>Поставь отметку после разбора материала и практики. Она появится у преподавателя${learnerId === 'child' ? ' и родителя' : ''}.</p><p class="muted">Это учебная отметка, а не оценка реального навыка.</p><button class="primary" data-ws-action="complete-custom" data-learner="${learnerId}" data-course="${courseId}" data-lesson="${lessonId}" ${done ? 'disabled' : ''}>${done ? 'Занятие отмечено' : 'Разобрал материал и попробовал практику'}</button></section><div class="actions"><a class="btn" href="#student/${learnerId}">Мои курсы</a>${index + 1 < c.lessons.length ? `<a class="btn" href="${lessonHref(learnerId, c, index + 1)}">Следующее занятие</a>` : ''}</div></div>`;
  }
  function centerCatalog(category='all'){
    const selected=organization.categories.find(c=>c.id===category), list=organization.programs.filter(p=>!selected||p.category===selected.id);
    return chrome('')+heading('УСЛУГИ ЦЕНТРА',selected?selected.title:'Выберите направление','Программы и услуги по рекламным материалам АНО «Солнечные лисята».','<a class="btn" href="#programs">Отчёт по программам</a>')+
    '<p class="notice">Демонстрационные заявки. Реальные цены, расписание, специалисты и условия участия подтверждает центр. Не вводите личные или медицинские данные.</p>'+
    '<div class="center-categories">'+organization.categories.map(c=>'<a class="btn '+(selected?.id===c.id?'primary':'')+'" href="#center/'+esc(c.id)+'">'+esc(c.title)+'</a>').join('')+'<a class="btn" href="#center">Все услуги</a></div>'+
    '<div class="center-services">'+list.map(p=>'<article class="card center-service"><span class="ws-icon">'+icon(p.icon)+'</span><h3>'+esc(p.title)+'</h3><small>'+esc(p.audience)+'</small><p>'+esc(p.description)+'</p><p class="muted">'+esc(p.format||'Подбор группы координатором')+'</p><a class="btn primary" href="#apply/'+esc(p.id)+'">Подать учебную заявку</a></article>').join('')+'</div>'+centerContacts();
  }
  function centerContacts(){return '<section class="panel center-contacts"><h2>Контакты центра</h2><p>'+esc(organization.address)+'</p><p>'+esc(organization.metro)+'</p><p>Режим работы по листовке: '+esc(organization.hours)+'</p><div class="actions"><a class="btn" href="tel:+79336983639">'+esc(organization.phone)+'</a><a class="btn" href="'+esc(organization.vkUrl)+'" target="_blank" rel="noopener noreferrer">ВКонтакте</a></div><p>Telegram: '+esc(organization.telegram)+'</p><p class="muted">Ссылка MAX уточняется у центра.</p></section>';}
  function directionsHTML(){return '<section class="ad-directions"><div class="ws-section-title"><h2>Направления «Солнечных лисят»</h2><a href="#center">Все услуги центра</a></div><div class="ad-direction-grid">'+organization.categories.map(c=>'<a class="ad-direction-card" href="#center/'+esc(c.id)+'"><span class="ws-icon">'+icon(c.icon)+'</span><h3>'+esc(c.title)+'</h3><p>'+organization.programs.filter(p=>p.category===c.id).length+' направлений и услуг</p><span>Посмотреть →</span></a>').join('')+'</div></section>';}
  function programs() {
    const summaries = organization.programs.map(p => { const ids = A.programGroups(state, p.id).map(g => g.id); return { ...p, groupIds: ids, stats: C.programStats(state, ids) }; });
    return chrome('') + heading('ЗАНЯТИЯ И ПРОГРАММЫ', 'Занятия, которые объединяют', organization.invitation, '<button data-ws-action="print">Распечатать отчёт</button>') + `<p class="notice">Здесь показаны направления центра и примеры образовательных программ. Группы, вместимость, расписание, участники и показатели — демонстрационные. Возраст и формат занятий уточняет координатор.</p><div class="ws-program-grid">${summaries.map(p => `<article class="panel ws-program-card"><span class="ws-icon">${icon(p.icon)}</span><span class="tag">${p.kind === 'studio' ? 'Направление центра' : 'Пример программы'}</span><h2>${esc(p.title)}</h2>${p.subtitle ? `<p class="muted">${esc(p.subtitle)}</p>` : ''}<p class="muted">${esc(p.audience)}</p><p>${esc(p.description)}</p>${p.activities ? `<ul class="ad-activity-tags">${p.activities.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}<div class="ws-inline-metrics">${metric(p.stats.participants, 'Участников в демо')}${metric(p.stats.present, 'Отмеченных посещений')}</div><div class="actions">${admissions.programActions(p.id)}${p.groupIds.map(id => `<a class="btn" href="#teacher/${id}">${esc(group(id).name)}</a>`).join('')}</div>${p.groupIds.length ? `<a href="#schedule/${p.groupIds[0]}">Расписание встреч</a>` : '<p class="muted">Координатор поможет подобрать группу.</p>'}</article>`).join('')}</div><section class="panel"><h2>Участие в программах</h2>${table(['Направление или программа', 'Участники', 'Проведено встреч', 'Посещения', 'Учебные отметки'], summaries.map(p => `<tr><td><b>${esc(p.title)}</b></td><td>${p.stats.participants}</td><td>${p.stats.completed}</td><td>${p.stats.present}</td><td>${p.stats.total ? p.stats.done + ' из ' + p.stats.total : 'Материалы не назначены'}</td></tr>`))}<p class="muted ws-caption">Участники считаются по уникальным учебным профилям внутри программы. Посещения — отдельные отметки в журнале. Учебные отметки отражают разбор примеров и не являются оценкой социального эффекта или официальной отчётностью.</p></section><section class="panel"><h2>Поможем выбрать занятия</h2><p>Подберём направление с учётом возраста и интересов ребёнка, в комфортном для него темпе.</p><p>${esc(organization.address)}</p><div class="actions"><a class="btn" href="tel:+79336983639">${esc(organization.phone)}</a><a class="btn" href="${organization.vkUrl}" target="_blank" rel="noopener noreferrer">Группа ВК</a></div></section><details class="panel ws-details"><summary>Об организации, для которой готовится демонстрация</summary><h2>${esc(organization.name)}</h2><p>${esc(organization.fullName)}</p><p>ИНН ${organization.inn} · ОГРН ${organization.ogrn}</p><a href="${organization.source}" target="_blank" rel="noopener noreferrer">Карточка организации</a></details>`;
  }
  function journalPage(id){const g=group(id)||group(state.teacherGroup)||state.groups[0];return chrome('teacher')+heading('ЖУРНАЛ ПОСЕЩЕНИЙ',g.name,'Посещения сохраняются в связанных учебных профилях.','<a class="btn" href="#teacher/'+esc(g.id)+'">К группе</a>')+calendar.journal(g,C.members(state,g.id));}
  function director() {
    const s = C.stats(state), incoming = A.stats(state);
    return chrome('director') + heading('КАБИНЕТ РУКОВОДИТЕЛЯ', 'Работа организации в цифрах', 'Участники программ, встречи, посещаемость и учебные отметки демонстрации.', '<button data-ws-action="print">Распечатать сводку</button>') + `${dashboardLinks([['family','Заявки и зачисления',(incoming.new+incoming.review)+' в работе','#coordinator'],['calendar','Расписание центра','Встречи всех групп','#schedule'],['teacher','Учебные группы',state.groups.length+' групп','#coordinator/groups'],['chart','Социальные программы','Показатели участия','#programs']])}<div class="ws-metrics">${metric(state.learners.length, 'Уникальных участников')}${metric(state.assignments.length, 'Назначений курсов')}${metric(s.done + ' / ' + s.total, 'Разобрано занятий')}${metric(s.present, 'Отмеченных посещений', s.absent + ' пропусков · ' + s.excused + ' по уважительной причине')}</div><section class="panel"><div class="ws-section-title"><h2>Запись в программы</h2><a href="#coordinator">Кабинет координатора</a></div><div class="ws-inline-metrics">${metric(incoming.new + incoming.review, "Заявок в работе")}${metric(incoming.waitlist, "В листе ожидания")}</div><p class="muted ws-caption">Участники учитываются после зачисления. Заявки и лист ожидания показаны отдельно.</p></section><section class="panel"><h2>Учебные группы</h2>${table(['Группа и педагог', 'Участники', 'Учебный путь', 'Посещения', 'Открыть'], state.groups.map(g => {
      const people = C.members(state, g.id);
      const p = people.reduce((a, l) => { const n = C.progress(state, l.id); a.done += n.done; a.total += n.total; return a; }, { done: 0, total: 0 });
      const recorded = state.sessions.filter(m => m.groupId === g.id).flatMap(m => Object.values(m.attendance));
      return `<tr><td><b>${esc(g.name)}</b><small>${esc(g.teacher)}</small></td><td>${people.length}</td><td><div class="ws-table-progress">${progress(p)}</div></td><td>Посещений: ${recorded.filter(v => v === 'present').length}<small>Записей в журнале: ${recorded.length}</small></td><td><a href="#teacher/${g.id}">Группа</a></td></tr>`;
    }))}</section><div class="ws-two-columns"><section class="panel"><h2>Последние действия</h2><ol class="ws-activity">${state.events.slice(0, 8).map(e => `<li><span class="ws-event-mark" aria-hidden="true">${icon('check')}</span><div><p>${esc(e.message)}</p><small>${new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(e.at))} МСК</small></div></li>`).join('')}</ol></section><section class="panel"><h2>Авторские программы</h2><div class="ws-inline-metrics">${metric(state.drafts.length, 'В конструкторе')}${metric(state.drafts.filter(c => c.published).length, 'Опубликовано в демо')}</div>${state.drafts.map(c => `<a class="ws-draft-link" href="#builder/${c.id}"><span class="ws-icon">${icon('edit')}</span><div><h3>${esc(c.title)}</h3><p class="muted">${c.published ? 'Версия ' + c.revision + ' доступна для назначения' : 'Готовится в черновике'}</p></div></a>`).join('')}<a class="btn" href="#programs">Программы и участие</a></section></div>${calendar.directorPanel()}<p class="notice">Сводка рассчитана по связанным демопрофилям в этом браузере. Данные HUB и отметки обычного каталога в неё не входят.</p>`;
  }
  function render(route, id, n, last) {
    switch (route) {
      case 'demo': return demo();
      case 'student': return student(id);
      case 'parent': return parent(id, n);
      case 'teacher': return teacher(id);
      case 'journal': return journalPage(id);
      case 'schedule': return calendar.calendar(id, n);
      case 'meeting': return calendar.editMeeting(id || 'new', n, last);
      case 'event': return calendar.eventDetails(id, n);
      case 'inbox': return calendar.inbox(id);
      case 'programs': return programs();
      case 'center': return centerCatalog(id);
      case 'specialists': return centerCatalog('specialists');
      case 'apply': return admissions.apply(id);
      case 'applications': return admissions.applications();
      case 'application': return admissions.application(id, n);
      case 'coordinator': return admissions.coordinator(id, n);
      case 'group': return admissions.groupEditor(id || 'new', n);
      case 'participant': return admissions.participant(id);
      case 'builder': return builder(id, n);
      case 'preview': return preview(id);
      case 'director': return director();
      case 'workshop': return workshop(id, n, last);
      default: return null;
    }
  }
  function formError(form, error) {
    const node = form.querySelector('.ws-form-feedback');
    if (node) { node.textContent = error.message; node.setAttribute('tabindex', '-1'); node.focus(); }
    else toast(error.message);
  }
  document.addEventListener('submit', e => {
    const form = e.target.closest('[data-ws-form]');
    if (!form) return;
    e.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    if (e.submitter?.name) values[e.submitter.name] = e.submitter.value;
    try {
      if (admissions.submit(form, values)) return;
      if (calendar.submit(form, values)) return;
      switch (form.dataset.wsForm) {
        case 'assignment': C.assign(state, values.groupId, values.courseId, values.due, values.note); save('Курс назначен группе.'); refresh(); break;
        case 'create-course': { const d = C.createDraft(state, values); save('Черновик создан.'); go('#builder/' + d.id); break; }
        case 'course': C.editDraft(state, form.dataset.course, values); save('Описание сохранено.'); refresh(); break;
        case 'lesson': C.saveLesson(state, form.dataset.course, form.dataset.lesson, values); save('Занятие сохранено в программе.'); go('#builder/' + form.dataset.course); break;
      }
    } catch (error) { formError(form, error); }
  });
  document.addEventListener('change', e => {
    const target = e.target.closest('[data-ws-change]');
    if (!target) return;
    try {
      if (admissions.change(target)) return;
      if (calendar.change(target)) return;
      if (target.dataset.wsChange === 'learner' && learner(target.value)) { state.activeLearner = target.value; save(); go('#student/' + target.value); }
      if (target.dataset.wsChange === 'group' && group(target.value)) { state.teacherGroup = target.value; save(); go('#teacher/' + target.value); }
      if (target.dataset.wsChange === 'attendance') { C.attendance(state, target.dataset.session, target.dataset.learner, target.value); save('Посещение сохранено.'); }
    } catch (error) { toast(error.message); }
  });
  function click(e) {
    const b = e.target.closest('[data-ws-action]');
    if (!b) return false;
    try {
      if (admissions.click(b)) return true;
      if (calendar.click(b)) return true;
      switch (b.dataset.wsAction) {
        case 'publish': C.publish(state, b.dataset.course); save('Курс опубликован в демо. Его можно назначить группе.'); refresh(); break;
        case 'move': C.moveLesson(state, b.dataset.course, b.dataset.lesson, Number(b.dataset.delta)); save('Порядок занятий изменён.'); refresh(); break;
        case 'complete-custom': C.complete(state, b.dataset.learner, b.dataset.course, b.dataset.lesson); save('Учебная отметка сохранена в профиле.'); refresh(); break;
        case 'print': window.print(); break;
        case 'reset-open': document.getElementById('ws-reset-confirm').hidden = false; break;
        case 'reset-cancel': document.getElementById('ws-reset-confirm').hidden = true; break;
        case 'reset-confirm': state = A.upgrade(C.upgrade(C.seed())); save('Демонстрация подготовлена заново.'); refresh(); break;
      }
    } catch (error) { toast(error.message); }
    return true;
  }
  window.addEventListener('storage', e => {
    if (e.key !== key || !e.newValue) return;
    try {
      const incoming = JSON.parse(e.newValue);
      if (C.valid(incoming) && A.valid(incoming)) { state = A.upgrade(C.upgrade(incoming)); refresh(); }
    } catch { /* Leave the current demonstration intact. */ }
  });
  window.EducationWorkspace = {
    render, click, directionsHTML,
    study: (person, courseId, index) => C.study(state, person, courseId, index),
    complete: (person, courseId, index) => { C.complete(state, person, courseId, String(index)); return save(); },
    isDone: (person, courseId, index) => C.isDone(state, person, courseId, String(index))
  };
})();
