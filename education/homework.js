(() => {
  'use strict';
  window.EducationHomework = {
    create({ H, C, state, esc, chrome, heading, options, metric, dateLabel, commit, go, refresh }) {
      const labels = { new: 'Можно выполнить', draft: 'Черновик', submitted: 'На проверке', revision: 'Нужна доработка', accepted: 'Принято', paused: 'Приостановлено' };
      const supports = { independent: 'Самостоятельно', 'with-helper': 'С помощью сопровождающего', 'in-class': 'На занятии' };
      const person = id => C.learner(state(), id);
      const group = id => C.group(state(), id);
      const tag = t => `<span class="hw-status hw-${H.status(state(), t)}">${labels[H.status(state(), t)]}</span>`;
      const time = value => new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) + ' МСК';
      const sourceLabel = t => t.source.courseTitle || (t.source.kind === 'session' ? 'Практика после встречи' : 'Задание педагога');
      const due = t => t.due ? `<span class="hw-due">До ${dateLabel(t.due)}${t.due < C.date() && ['new', 'draft', 'revision'].includes(H.status(state(), t)) ? ' · срок прошёл, отправить всё равно можно' : ''}</span>` : '<span class="hw-due">В удобном темпе</span>';
      const link = (t, viewer = t.learnerId) => `#homework-task/${t.id}/${viewer}`;
      const feedback = t => H.latest(t)?.review?.feedback || '';
      function fileLinks(files) {
        return files.length ? `<ul class="hw-files">${files.map(f => `<li>${f.type.startsWith('image/') ? `<img src="${esc(f.data)}" alt="Прикреплённая работа: ${esc(f.name)}" loading="lazy">` : '<span class="hw-file-symbol" aria-hidden="true">Файл</span>'}<div><a href="${esc(f.data)}" download="${esc(f.name)}">${esc(f.name)}</a><small>${Math.ceil(f.size / 1024)} КБ</small></div></li>`).join('')}</ul>` : '';
      }
      function card(t, viewer, teacher = false) {
        return `<article class="panel hw-card"><div class="hw-card-top">${tag(t)}${due(t)}</div><h3><a href="${teacher ? '#homework-review/' + t.id : link(t, viewer)}">${esc(t.title)}</a></h3><p class="muted">${teacher ? esc(person(t.learnerId)?.name) + ' · ' : ''}${esc(sourceLabel(t))}</p><p class="hw-excerpt">${esc(t.instructions)}</p>${feedback(t) ? `<p class="hw-feedback"><b>Педагог:</b> ${esc(feedback(t))}</p>` : ''}<a class="btn ${H.status(state(), t) === 'revision' || teacher && H.status(state(), t) === 'submitted' ? 'primary' : ''}" href="${teacher ? '#homework-review/' + t.id : link(t, viewer)}">${teacher ? H.status(state(), t) === 'submitted' ? 'Проверить работу' : 'Открыть задание' : ['new', 'draft', 'revision'].includes(H.status(state(), t)) ? 'Выполнить задание' : 'Посмотреть работу'}</a></article>`;
      }
      function summary(learnerId, viewer = learnerId) {
        const tasks = H.list(state(), learnerId), stats = H.stats(state(), tasks);
        const priority = { revision: 0, draft: 1, new: 2, submitted: 3, accepted: 4, paused: 5 };
        const selected = [...tasks].sort((a, b) => priority[H.status(state(), a)] - priority[H.status(state(), b)] || (a.due || '9999').localeCompare(b.due || '9999')).slice(0, 2);
        return `<section class="panel hw-summary"><div class="ws-section-title"><div><span class="kicker">ПРАКТИКА МЕЖДУ ВСТРЕЧАМИ</span><h2>Домашние задания</h2></div><a class="btn" href="#homework/${learnerId}/${viewer}">Все задания (${tasks.length})</a></div><p class="muted">Отправь ответ, фотографию или файл. Педагог посмотрит работу и подскажет следующий шаг.</p><div class="hw-counters"><span>На проверке <b>${stats.submitted}</b></span><span>Доработать <b>${stats.revision}</b></span><span>Принято <b>${stats.accepted}</b></span></div>${selected.length ? `<div class="hw-grid">${selected.map(t => card(t, viewer)).join('')}</div>` : '<p>Педагог сможет выдать практику по любому направлению, в том числе после очной встречи.</p>'}</section>`;
      }
      function learnerPage(id, viewerId) {
        const p = person(id) || person(state().activeLearner) || state().learners[0];
        const viewer = viewerId === C.guardianId(state(), p.id) ? viewerId : p.id;
        const tasks = H.list(state(), p.id);
        return chrome(viewer === p.id ? 'student' : 'parent') + heading('ДОМАШНИЕ ЗАДАНИЯ', 'Практика в своём темпе', p.name + ' · ответ, выбор варианта, фотография или файл работы.', `<a class="btn" href="${viewer === p.id ? '#student/' + p.id : '#parent/' + p.id + '/' + viewer}">В кабинет</a>`) + `<div class="hw-explainer"><b>Как это работает</b><p>Открой задание, сохрани черновик или отправь работу. После проверки здесь появится комментарий педагога. Если нужна помощь, можно выполнить вместе с сопровождающим или на занятии.</p></div>${tasks.length ? `<div class="hw-grid">${tasks.map(t => card(t, viewer)).join('')}</div>` : '<section class="panel"><h2>Пока нет заданий</h2><p>Они появятся после назначения курса или практики преподавателем.</p></section>'}`;
      }
      function history(t) {
        return t.attempts.length ? `<section class="panel"><h2>Отправки и обратная связь</h2><ol class="hw-history">${[...t.attempts].reverse().map(a => `<li><div class="hw-card-top"><b>${a.actorId === 'teacher' ? 'Отметка педагога на занятии' : 'Отправка ' + a.number}</b><small>${time(a.at)}</small></div><p class="muted">${supports[a.support]}${a.actorId !== 'teacher' && a.actorId !== t.learnerId ? ' · отправил(а) ' + esc(person(a.actorId)?.name || 'сопровождающий') : ''}</p>${a.text ? `<p class="hw-text">${esc(a.text)}</p>` : ''}${a.choice !== null ? `<p><b>Выбранный ответ:</b> ${esc(t.choices[a.choice])}</p>` : ''}${fileLinks(a.files)}${a.review ? `<div class="hw-review-feedback"><b>${labels[a.review.decision]}</b><p class="hw-text">${esc(a.review.feedback)}</p><small>${esc(a.review.teacher)} · ${time(a.review.at)}</small></div>` : '<p class="muted">Ожидает проверки педагога.</p>'}</li>`).join('')}</ol></section>` : '';
      }
      function taskPage(id, viewerId, teacher = false) {
        const t = H.get(state(), id);
        if (!t) return chrome(teacher ? 'teacher' : 'student') + heading('ДОМАШНЕЕ ЗАДАНИЕ', 'Задание не найдено', 'Открой список заданий в своём кабинете.', '<a class="btn" href="#student">Кабинет</a>');
        const viewer = viewerId === C.guardianId(state(), t.learnerId) ? viewerId : t.learnerId;
        const current = H.status(state(), t), editable = ['new', 'draft', 'revision'].includes(current), d = H.content(t), last = H.latest(t);
        const back = teacher ? '#homework-teacher/' + t.groupId : '#homework/' + t.learnerId + '/' + viewer;
        let form = '';
        if (teacher && current === 'submitted') {
          form = `<section class="panel"><h2>Проверка работы</h2><form data-ws-form="homework-review" data-task="${t.id}" data-group="${t.groupId}" data-attempt="${last.id}"><label>Обратная связь<textarea name="feedback" rows="4" required minlength="3" maxlength="2000" placeholder="Что получилось и что попробовать дальше"></textarea></label><div class="actions"><button class="primary" name="decision" value="accepted">Принять работу</button><button name="decision" value="revision">Вернуть на доработку</button></div><p class="ws-form-feedback" role="status"></p></form></section>`;
        } else if (teacher && editable) {
          form = `<section class="panel"><h2>Поддержка на занятии</h2><p>Если участник выполнил задание очно, педагог может зафиксировать результат. Такая отметка будет отличаться от онлайн-отправки.</p><form data-ws-form="homework-in-class" data-task="${t.id}" data-group="${t.groupId}"><label>Что получилось<textarea name="feedback" rows="3" minlength="3" maxlength="2000" required placeholder="Опиши выполненное действие и необходимую помощь"></textarea></label><button>Отметить выполнение на занятии</button><p class="ws-form-feedback" role="status"></p></form></section>`;
        } else if (!teacher && editable) {
          form = `<section class="panel"><h2>${current === 'revision' ? 'Доработать и отправить снова' : 'Моя работа'}</h2>${current === 'revision' ? `<div class="hw-review-feedback"><b>Подсказка педагога</b><p class="hw-text">${esc(feedback(t))}</p></div>` : ''}<form data-ws-form="homework-answer" data-task="${t.id}" data-person="${t.learnerId}" data-viewer="${viewer}">${t.choices.length ? `<fieldset class="hw-question"><legend>${esc(t.question || 'Выбери вариант ответа')}</legend>${t.choices.map((v, i) => `<label><input type="radio" name="choice" value="${i}" ${d.choice === i ? 'checked' : ''}><span>${esc(v)}</span></label>`).join('')}</fieldset>` : ''}<label>Ответ или рассказ о работе<textarea name="text" rows="5" maxlength="4000" placeholder="Что ты сделал(а)? Что получилось? Нужна ли помощь?">${esc(d.text)}</textarea></label>${fileLinks(d.files)}${d.files.map(f => `<label class="hw-check"><input type="checkbox" name="removeFile" value="${esc(f.id)}">Убрать ${esc(f.name)} из этой отправки</label>`).join('')}<label>Добавить фото или файл<input type="file" name="attachments" multiple accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,.docx,.xlsx,.pptx" aria-describedby="hw-file-help"></label><p id="hw-file-help" class="muted">До двух файлов по 512 КБ. Фото уменьшается автоматически. PDF, TXT и файлы Word, Excel, PowerPoint.</p><label>Как выполнялось задание<select name="support">${options(Object.entries(supports), viewer !== t.learnerId ? 'with-helper' : d.support)}</select></label>${viewer !== t.learnerId ? `<p class="muted">Работу отправляет ${esc(person(viewer)?.name)} как сопровождающий. Помощь будет отмечена у педагога.</p>` : ''}<div class="actions"><button class="primary" name="intent" value="submit">Отправить педагогу</button><button name="intent" value="draft" formnovalidate>Сохранить черновик</button></div><p class="ws-form-feedback" role="status" aria-live="polite"></p></form></section>`;
        }
        const lesson = t.source.kind === 'lesson' ? H.resolveCourse(state(), t.source.courseId, t.learnerId) : null;
        const lessonIndex = lesson?.lessons?.findIndex(l => l.id === t.source.lessonId);
        const lessonHref = lessonIndex >= 0 ? lesson.legacy ? `../#lesson/${t.source.lessonId}/theory` : lesson.custom ? `#workshop/${t.learnerId}/${lesson.id}/${t.source.lessonId}` : C.assigned(state(), t.learnerId).some(a => a.courseId === lesson.id) ? `#study/${t.learnerId}/${lesson.id}/${lessonIndex}` : `#lesson/${lesson.id}/${lessonIndex}` : '';
        return chrome(teacher ? 'teacher' : viewer === t.learnerId ? 'student' : 'parent') + heading(teacher ? 'РАБОТА УЧАСТНИКА' : 'ДОМАШНЕЕ ЗАДАНИЕ', t.title, person(t.learnerId).name + ' · ' + sourceLabel(t), `<a class="btn" href="${back}">Все задания</a>`) + `<section class="panel hw-task-brief"><div class="hw-card-top">${tag(t)}${due(t)}</div><h2>Что нужно сделать</h2><p class="hw-text">${esc(t.instructions)}</p>${t.choices.length ? teacher || !editable ? `<h3>Учебный вопрос</h3><p>${esc(t.question)}</p><ul>${t.choices.map(v => `<li>${esc(v)}</li>`).join('')}</ul>` : '<p class="muted">Для закрепления также выбери ответ на учебный вопрос.</p>' : ''}${lessonHref ? `<a href="${lessonHref}">Открыть материал занятия</a>` : ''}${current === 'paused' ? '<p class="notice">Встреча отменена или недоступна. Отправка приостановлена, предыдущие работы сохранены.</p>' : ''}${current === 'submitted' && !teacher ? '<p class="notice">Работа отправлена. Здесь появится ответ педагога; повторная отправка станет доступна, если потребуется доработка.</p>' : ''}</section>${teacher ? history(t) + form : form + history(t)}`;
      }
      function teacherPage(groupId, filter) {
        const g = group(groupId) || group(state().teacherGroup) || state().groups[0];
        const selected = ['all', ...Object.keys(labels)].includes(filter) ? filter : 'submitted';
        const tasks = H.byGroup(state(), g.id), stats = H.stats(state(), tasks);
        const shown = tasks.filter(t => selected === 'all' || H.status(state(), t) === selected);
        return chrome('teacher') + heading('ДОМАШНИЕ ЗАДАНИЯ', 'Проверка и обратная связь', 'Работы участников по всем направлениям выбранной группы.', `<a class="btn primary" href="#homework-new/${g.id}">Выдать задание</a>`) + `<div class="hw-filters"><label>Группа<select data-ws-change="homework-group">${options(state().groups.map(g => [g.id, g.name]), g.id)}</select></label><label>Статус<select data-ws-change="homework-filter" data-group="${g.id}">${options([['all', 'Все задания'], ...Object.entries(labels)], selected)}</select></label><a class="btn" href="#teacher/${g.id}">Кабинет преподавателя</a></div><div class="ws-metrics">${metric(stats.submitted, 'На проверке')}${metric(stats.revision, 'На доработке')}${metric(stats.accepted, 'Принято')}${metric(tasks.length, 'Заданий участникам')}</div>${shown.length ? `<div class="hw-grid">${shown.map(t => card(t, '', true)).join('')}</div>` : '<section class="panel"><h2>В этом статусе пока нет работ</h2><p>Выбери «Все задания», чтобы посмотреть выданную практику или отметить выполнение на занятии.</p></section>'}`;
      }
      function newTask(groupId, sessionId) {
        const g = group(groupId) || group(state().teacherGroup) || state().groups[0];
        const meetings = state().sessions.filter(m => m.groupId === g.id && m.status !== 'cancelled');
        const m = meetings.find(m => m.id === sessionId), members = C.members(state(), g.id);
        return chrome('teacher') + heading('НОВОЕ ЗАДАНИЕ', 'Практика для любого занятия', g.name + ' · можно выдать всей группе или одному участнику.', `<a class="btn" href="#homework-teacher/${g.id}/all">Все задания группы</a>`) + `<section class="panel hw-form-panel">${members.length ? `<form data-ws-form="homework-new"><input type="hidden" name="groupId" value="${g.id}"><label>Кому выдать<select name="learnerId">${options([['all', 'Всем участникам группы'], ...members.map(p => [p.id, p.name])], 'all')}</select></label><label>Связать со встречей<select name="sessionId">${options([['', 'Отдельное задание'], ...meetings.map(m => [m.id, m.title + ' · ' + dateLabel(m.date)])], m?.id || '')}</select></label><label>Название<input name="title" required minlength="3" maxlength="180" value="${esc(m?.title || '')}" placeholder="Например: покажи свою творческую работу"></label><label>Что нужно сделать<textarea name="instructions" rows="5" required minlength="3" maxlength="4000" placeholder="Короткие шаги и понятный ожидаемый результат">${esc(m?.home || '')}</textarea></label><label>Срок выполнения, если нужен<input type="date" name="due" min="${C.date()}"></label><details class="hw-choice-editor"><summary>Добавить вопрос с выбором ответа</summary><label>Учебный вопрос<input name="question" maxlength="1000"></label><label>Варианты — каждый с новой строки<textarea name="choiceLines" rows="4" maxlength="2000" placeholder="От двух до шести вариантов"></textarea></label><p class="muted">Педагог проверит выбор и даст обратную связь вместе с остальной работой.</p></details><button class="primary">Выдать задание</button><p class="ws-form-feedback" role="status"></p></form>` : '<h2>В группе пока нет участников</h2><p>Сначала зачисли учебный профиль через кабинет координатора.</p><a class="btn" href="#coordinator">Координатор</a>'}</section>`;
      }
      function lessonPanel(learnerId, courseId, lessonId) {
        const t = learnerId && H.lessonTask(state(), learnerId, courseId, lessonId);
        return `<section class="panel hw-lesson-panel"><span class="kicker">ПОПРОБУЙ САМОСТОЯТЕЛЬНО</span><h2>Домашнее задание онлайн</h2><p>Выполни практику, отправь ответ, фото или файл и получи комментарий педагога. Черновик можно сохранить и продолжить позже.</p>${t ? tag(t) : ''}<div class="actions"><a class="btn primary" href="${t ? link(t) : '#homework-lesson/' + courseId + '/' + lessonId}">${t && ['submitted', 'accepted'].includes(H.status(state(), t)) ? 'Посмотреть мою работу' : 'Выполнить домашнее задание'}</a></div></section>`;
      }
      function lessonEntry(courseId, lessonId) {
        const c = H.resolveCourse(state(), courseId), l = c?.lessons.find(l => l.id === lessonId);
        if (!l) return chrome('student') + heading('ДОМАШНЕЕ ЗАДАНИЕ', 'Занятие не найдено', 'Открой опубликованное занятие из каталога.', '<a class="btn" href="#home">Каталог</a>');
        const people = state().learners.filter(p => C.groupIds(state(), p.id).some(id => group(id).audience === c.group));
        return chrome('student') + heading('ВЫБОР УЧЕБНОГО ПРОФИЛЯ', l.title, 'Ответ сохранится у выбранного участника и появится у педагога его группы.') + `<section class="panel"><h2>Кто выполняет задание?</h2>${people.length ? `<div class="hw-profile-grid">${people.map(p => `<button data-ws-action="homework-start" data-person="${p.id}" data-course="${esc(courseId)}" data-lesson="${esc(lessonId)}">${esc(p.name)}<small>${esc(p.detail)}</small></button>`).join('')}</div>` : '<p>Для этого возрастного направления пока нет учебного профиля. Его можно добавить при зачислении через координатора.</p><a class="btn" href="#coordinator">Открыть координатора</a>'}<p class="muted">В демонстрации используются вымышленные профили. Эта практика сама по себе не зачисляет в курс.</p></section>`;
      }
      function teacherSummary(groupId) {
        const stats = H.stats(state(), H.byGroup(state(), groupId));
        return `<section class="panel hw-teacher-summary"><div><h2>Домашние задания</h2><p>На проверке: <b>${stats.submitted}</b> · на доработке: <b>${stats.revision}</b> · принято: <b>${stats.accepted}</b></p></div><div class="actions"><a class="btn primary" href="#homework-teacher/${groupId}">Проверить работы</a><a class="btn" href="#homework-new/${groupId}">Выдать задание</a></div></section>`;
      }
      function meetingPanel(sessionId, viewerId, teacher = false) {
        const m = state().sessions.find(m => m.id === sessionId);
        if (!m) return '';
        if (teacher) return `<section class="panel"><h2>Домашнее задание после встречи</h2><p>Поле «Повторение после встречи» создаёт задания участникам автоматически. Здесь можно также выдать отдельную практику с ответом или файлом работы.</p><div class="actions">${m.status !== 'cancelled' ? `<a class="btn primary" href="#homework-new/${m.groupId}/${m.id}">Выдать задание по встрече</a>` : ''}<a class="btn" href="#homework-teacher/${m.groupId}/all">Задания группы</a></div></section>`;
        const p = C.isMember(state(), viewerId, m.groupId) ? person(viewerId) : C.childrenOf(state(), viewerId).find(p => C.isMember(state(), p.id, m.groupId));
        if (!p) return '';
        const tasks = H.list(state(), p.id).filter(t => t.source.kind === 'session' && t.source.sessionId === m.id);
        return `<section class="panel"><h2>Домашняя практика после встречи</h2>${tasks.length ? `<div class="hw-grid">${tasks.map(t => card(t, viewerId)).join('')}</div>` : '<p>Педагог сможет добавить практику и материалы после встречи.</p>'}</section>`;
      }
      function directorPanel() {
        const s = H.stats(state());
        return `<section class="panel"><h2>Домашняя практика и обратная связь</h2><div class="ws-metrics">${metric(s.submitted, 'Ожидают проверки')}${metric(s.revision, 'На доработке')}${metric(s.accepted, 'Приняты педагогом')}${metric(state().homework.tasks.filter(t => t.attempts.length).length, 'Заданий с отправкой или очной отметкой')}</div><p class="muted">Это статусы учебных работ. Они учитываются отдельно от посещений и отметок о разборе урока.</p></section>`;
      }
      function error(form, e) {
        const node = form.querySelector('.ws-form-feedback');
        if (node) { node.textContent = e.message; node.tabIndex = -1; node.focus(); }
      }
      const readFile = file => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('Файл не удалось прочитать. Выбери его ещё раз.')); reader.readAsDataURL(file); });
      async function attachment(file) {
        let type = file.type, data, name = file.name.replace(/[\\/\x00-\x1f]/g, '_').slice(-150), size = file.size;
        const ext = name.split('.').pop().toLowerCase();
        type = Object.entries(H.mimeTypes).find(([, exts]) => exts.includes(ext))?.[0] || '';
        if (!type) throw new Error('Этот формат не поддерживается. Прикрепи JPG, PNG, WEBP, PDF, TXT или документ Office.');
        if (file.size > 15 * 1024 * 1024) throw new Error('Фото слишком большое. Выбери файл до 15 МБ; документ — до 512 КБ.');
        if (type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          try {
            const image = new Image();
            await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error('Изображение не удалось открыть. Выбери другое фото.')); image.src = url; });
            const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
            const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
            const context = canvas.getContext('2d'); context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height);
            data = canvas.toDataURL('image/jpeg', .78); type = 'image/jpeg'; name = name.replace(/\.[^.]+$/, '') + '.jpg';
            size = atob(data.split(',')[1]).length;
          } finally { URL.revokeObjectURL(url); }
        } else {
          if (size > H.MAX_FILE) throw new Error('Документ больше 512 КБ. Уменьши файл или отправь ответ текстом.');
          const raw = await readFile(file); data = 'data:' + type + ';base64,' + raw.split(',')[1];
        }
        if (size > H.MAX_FILE) throw new Error('После уменьшения фото всё ещё больше 512 КБ. Выбери изображение меньшего размера.');
        return { id: 'file-' + (globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2)), name, type, size, data };
      }
      async function answer(form, values) {
        if (form.dataset.busy === 'true') return;
        form.dataset.busy = 'true';
        const buttons = [...form.querySelectorAll('button')]; buttons.forEach(b => b.disabled = true);
        const node = form.querySelector('.ws-form-feedback'); node.textContent = 'Сохраняем работу…';
        try {
          const t = H.get(state(), form.dataset.task);
          if (!t) throw new Error('Задание не найдено.');
          const data = new FormData(form), removed = data.getAll('removeFile');
          const kept = H.content(t).files.filter(f => !removed.includes(f.id));
          const selected = data.getAll('attachments').filter(f => f && f.size);
          if (kept.length + selected.length > 2) throw new Error('Можно прикрепить до двух файлов. Убери лишние и попробуй снова.');
          const files = [...kept, ...await Promise.all(selected.map(attachment))];
          const method = values.intent === 'draft' ? H.saveDraft : H.submit;
          commit(s => method(s, t.id, t.learnerId, { ...values, files }, form.dataset.viewer), values.intent === 'draft' ? 'Черновик сохранён. Можно продолжить позже.' : 'Работа отправлена педагогу.');
          go(link(t, form.dataset.viewer));
        } catch (e) { error(form, e); }
        finally { form.dataset.busy = 'false'; buttons.forEach(b => b.disabled = false); }
      }
      function submit(form, values) {
        switch (form.dataset.wsForm) {
          case 'homework-answer': answer(form, values); return true;
          case 'homework-new': commit(s => H.assign(s, values), 'Задание выдано участникам.'); go('#homework-teacher/' + values.groupId + '/all'); return true;
          case 'homework-review': commit(s => H.review(s, form.dataset.task, form.dataset.group, form.dataset.attempt, values.decision, values.feedback), 'Проверка сохранена. Участник увидит комментарий.'); refresh(); return true;
          case 'homework-in-class': commit(s => H.inClass(s, form.dataset.task, form.dataset.group, values.feedback), 'Выполнение на занятии отмечено.'); refresh(); return true;
          default: return false;
        }
      }
      function click(b) {
        if (b.dataset.wsAction !== 'homework-start') return false;
        let task;
        commit(s => { task = H.openLesson(s, b.dataset.person, b.dataset.course, b.dataset.lesson); }, 'Задание открыто в учебном профиле.');
        go(link(task)); return true;
      }
      function change(target) {
        if (target.dataset.wsChange === 'homework-group') { go('#homework-teacher/' + target.value); return true; }
        if (target.dataset.wsChange === 'homework-filter') { go('#homework-teacher/' + target.dataset.group + '/' + target.value); return true; }
        return false;
      }
      function render(route, id, n, last) {
        switch (route) {
          case 'homework': return learnerPage(id, n);
          case 'homework-task': return taskPage(id, n);
          case 'homework-teacher': return teacherPage(id, n);
          case 'homework-review': return taskPage(id, '', true);
          case 'homework-new': return newTask(id, n);
          case 'homework-lesson': return lessonEntry(id, n);
          default: return null;
        }
      }
      return { render, summary, teacherSummary, directorPanel, meetingPanel, lessonPanel, submit, click, change };
    }
  };
})();
