(() => {
  'use strict';
  window.EducationSchedule = {
    create({ C, state, esc, chrome, heading, options, icon, metric, table, dateLabel, save, go, refresh }) {
      const labels = { planned: 'Запланирована', completed: 'Проведена', cancelled: 'Отменена' };
      const attendanceLabels = { '': 'Не отмечено', present: 'Был на занятии', absent: 'Пропустил', excused: 'Уважительная причина' };
      const group = id => C.group(state(), id);
      const learner = id => C.learner(state(), id);
      const meetings = () => state().sessions.map(m => C.meetingInfo(state(), m));
      const meeting = id => meetings().find(m => m.id === id);
      const status = m => `<span class="tag ws-status-${m.status}">${labels[m.status]}</span>`;
      const fullTime = m => `${dateLabel(m.date)} · ${esc(m.time)} · ${m.minutes} мин`;
      const unread = person => C.notices(state(), person).filter(n => !n.readAt).length;
      const inboxLink = person => `<a class="btn ws-inbox-link" href="#inbox/${person}">Уведомления<span class="ws-unread-count" aria-label="Непрочитанных: ${unread(person)}">${unread(person)}</span></a>`;
      function notificationPreview(person) {
        const list = C.notices(state(), person).filter(n => !n.readAt);
        return list.length ? `<aside class="ws-notification-preview"><span class="ws-icon">${icon('calendar')}</span><div><h2>Новости расписания</h2><p>${esc(list[0].message)}</p><a href="#inbox/${person}">Посмотреть уведомления (${list.length})</a></div></aside>` : '';
      }
      function personSchedule(person, viewer = person.id) {
        const list = meetings().filter(m => m.groupId === person.groupId).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
        return `<section class="panel"><div class="ws-section-title"><h2>Встречи с преподавателем</h2>${icon('calendar')}</div>${list.length ? list.map(m => `<div class="ws-meeting ${m.status === 'cancelled' ? 'ws-meeting-cancelled' : ''}"><div class="ws-date"><b>${dateLabel(m.date)}</b><span>${esc(m.time)} · ${m.minutes} мин · МСК</span>${status(m)}</div><div><h3>${esc(m.title)}</h3><p class="muted">${esc(m.teacher)} · ${esc(m.room)}</p>${m.status === 'cancelled' ? `<p class="ws-cancel-reason">Причина: ${esc(m.cancelReason)}</p>` : `<span class="tag">${esc(attendanceLabels[m.attendance[person.id] || ''])}</span>`}<p class="ws-meeting-link"><a href="#event/${m.id}/${viewer}">Программа встречи</a></p></div></div>`).join('') : '<p class="muted">Встреч пока нет. Преподаватель добавит их в расписание.</p>'}<p class="muted ws-caption">Время московское. Все встречи и преподаватели — демонстрационные.</p></section>`;
      }
      function calendar(groupId, anchor) {
        const chosen = group(groupId) ? groupId : 'all', focus = C.validDate(anchor) ? anchor : C.date();
        const start = C.weekStart(focus), end = C.shiftDate(start, 6);
        const list = meetings().filter(m => (chosen === 'all' || m.groupId === chosen) && m.date >= start && m.date <= end).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
        const days = Array.from({ length: 7 }, (_, i) => C.shiftDate(start, i));
        const to = d => `#schedule/${chosen}/${d}`;
        return chrome('schedule') + heading('РАСПИСАНИЕ ЦЕНТРА', 'У каждой встречи своё время', 'Планируй неделю, переноси занятия и держи участников в курсе изменений.', `<a class="btn primary" href="#meeting/new/${chosen === 'all' ? 'children' : chosen}/${focus}">Новая встреча</a>`) + `<div class="ws-calendar-filters"><label>Группа<select data-ws-change="calendar-group" data-date="${focus}">${options([['all', 'Все группы'], ...state().groups.map(g => [g.id, g.name])], chosen)}</select></label><label>Неделя с датой<input type="date" data-ws-change="calendar-date" data-group="${chosen}" value="${focus}"></label><div class="actions"><a class="btn" href="${to(C.shiftDate(start, -7))}">Предыдущая неделя</a><a class="btn" href="${to(C.date())}">Эта неделя</a><a class="btn" href="${to(C.shiftDate(start, 7))}">Следующая неделя</a></div></div><div class="ws-metrics ws-calendar-metrics">${metric(list.filter(m => m.status === 'planned').length, 'Запланировано')}${metric(list.filter(m => m.status === 'completed').length, 'Проведено')}${metric(list.filter(m => m.status === 'cancelled').length, 'Отменено')}</div><div class="ws-section-title"><h2>${dateLabel(start)} — ${dateLabel(end)}</h2><span class="muted">Все встречи по московскому времени</span></div><div class="ws-week-scroll" role="region" aria-label="Расписание на неделю" tabindex="0"><div class="ws-week-board">${days.map(day => {
          const dayList = list.filter(m => m.date === day), today = day === C.date();
          const name = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', weekday: 'short' }).format(new Date(day + 'T12:00:00Z'));
          return `<section class="ws-week-day ${today ? 'is-today' : ''}"><h3>${esc(name)}<b>${dateLabel(day)}</b>${today ? '<small>Сегодня</small>' : ''}</h3>${dayList.length ? dayList.map(m => `<a class="ws-calendar-event ws-event-${m.status}" href="#meeting/${m.id}"><strong>${esc(m.time)} <span>· ${m.minutes} мин</span></strong>${status(m)}<h4>${esc(m.title)}</h4><p>${esc(group(m.groupId).name)}</p><small>${esc(m.teacher)}<br>${esc(m.room)}</small></a>`).join('') : '<p class="ws-day-empty">Нет встреч</p>'}<a class="ws-add-meeting" href="#meeting/new/${chosen === 'all' ? 'children' : chosen}/${day}">Добавить</a></section>`;
        }).join('')}</div></div><p class="ws-caption muted">Для группы, преподавателя и очного кабинета проверяются пересечения. Соседние встречи могут начинаться сразу после завершения предыдущей.</p>`;
      }
      function selectField(name, title, items, value, locked) {
        return `<label>${title}${locked ? `<input type="hidden" name="${name}" value="${esc(value)}">` : ''}<select name="${name}" ${locked ? 'disabled' : 'required'} ${name === 'groupId' ? 'data-ws-change="meeting-group"' : ''}>${options(items, value)}</select></label>`;
      }
      function editMeeting(id, groupId, selectedDate) {
        const m = id !== 'new' ? meeting(id) : null;
        if (id !== 'new' && !m) return chrome('schedule') + heading('ВСТРЕЧА', 'Встреча не найдена', 'Открой нужную встречу из расписания.', '<a class="btn" href="#schedule">Расписание</a>');
        const g = group(m?.groupId || groupId) || state().groups[0];
        const when = m?.date || (C.validDate(selectedDate) ? selectedDate : C.date());
        const back = `#schedule/${g.id}/${when}`, locked = m && (m.status === 'completed' || Object.keys(m.attendance).length > 0);
        const teachers = [...new Set(state().groups.map(g => g.teacher))], rooms = [...new Set(state().groups.map(g => g.room))];
        return chrome('schedule') + heading('ВСТРЕЧА ГРУППЫ', m ? m.title : 'Новая встреча', m ? `${group(m.groupId).name} · ${dateLabel(m.date)} · ${m.time} МСК` : 'Сохрани встречу — участники увидят её в своих кабинетах.', `<a class="btn" href="${back}">Расписание группы</a>`) + (m?.status === 'cancelled' ? `<section class="panel"><h2>Встреча отменена</h2><p class="ws-cancel-reason">${esc(m.cancelReason)}</p><p>Встреча остаётся в истории. При восстановлении проверяется занятость на прежнее время.</p><div class="actions"><button class="primary" data-ws-action="restore-meeting" data-session="${m.id}">Восстановить встречу</button><a class="btn" href="#meeting/new/${g.id}/${C.date()}">Создать другую встречу</a></div></section>` : `<div class="ws-meeting-editor"><section class="panel"><h2>${m ? 'Программа и время' : 'Детали встречи'}</h2>${locked ? '<p class="notice">Встреча проведена или в журнале уже есть отметки. Время, группа и место сохранены; программу и домашнюю практику можно уточнить.</p>' : ''}<form data-ws-form="meeting" data-session="${m?.id || ''}"><label>Тема встречи<input name="title" required minlength="3" maxlength="160" value="${esc(m?.title || '')}" placeholder="Например: учимся делать презентацию"></label>${selectField('groupId', 'Учебная группа', state().groups.map(g => [g.id, g.name]), g.id, locked)}<div class="ws-form-row"><label>Дата<input type="date" name="date" required value="${when}" ${locked ? 'readonly' : ''}></label><label>Начало, МСК<input type="time" name="time" required value="${esc(m?.time || '12:00')}" ${locked ? 'readonly' : ''}></label><label>Минут<input type="number" name="minutes" min="15" max="180" step="1" required value="${m?.minutes || 60}" ${locked ? 'readonly' : ''}></label></div><div class="ws-form-row two">${selectField('teacher', 'Преподаватель', teachers.map(t => [t, t]), m?.teacher || g.teacher, locked)}${selectField('room', 'Место', rooms.map(r => [r, r]), m?.room || g.room, locked)}</div><label>Программа встречи<textarea name="agenda" maxlength="2000" rows="4" placeholder="Что разберём на встрече">${esc(m?.agenda || '')}</textarea></label><label>Повторение после встречи<textarea name="home" maxlength="1000" rows="3" placeholder="Небольшая практика для дома">${esc(m?.home || '')}</textarea></label><div class="actions"><button class="primary">${m ? 'Сохранить изменения' : 'Создать встречу'}</button><a class="btn" href="${back}">Вернуться к расписанию</a></div><p class="ws-form-feedback" role="status"></p></form></section><aside><section class="panel"><h2>Что увидят участники</h2><p>Тему, программу, московское время, преподавателя, место и домашнюю практику.</p><p>При переносе или отмене в кабинете появится уведомление. Родитель Саши также увидит изменение детской встречи.</p>${m ? `<p>${status(m)}</p><a class="btn" href="#teacher/${g.id}">Журнал группы</a>` : ''}</section>${m?.status === 'planned' ? `<section class="panel"><h2>После встречи</h2><p>Отметь посещения в журнале. Статус встречи меняется отдельно от отметок участников.</p><button data-ws-action="finish-meeting" data-session="${m.id}">Встреча проведена</button></section>${!Object.keys(m.attendance).length ? `<section class="panel"><h2>Отмена встречи</h2><form data-ws-form="cancel-meeting" data-session="${m.id}"><label>Причина отмены<textarea name="reason" required minlength="3" maxlength="500" rows="3" placeholder="Что сообщить участникам"></textarea></label><button class="ws-danger">Отменить встречу</button><p class="ws-form-feedback" role="status"></p></form></section>` : ''}` : ''}</aside></div>`);
      }
      function eventDetails(id, viewer) {
        const m = meeting(id), person = learner(viewer), parentView = viewer === 'parent';
        const allowed = m && person && (m.groupId === person.groupId || parentView && m.groupId === learner('child').groupId);
        if (!allowed) return chrome('student') + heading('ПРОГРАММА ВСТРЕЧИ', 'Встреча не найдена', 'Открой расписание в своём учебном профиле.', '<a class="btn" href="#student">Мой кабинет</a>');
        return chrome(parentView ? 'parent' : 'student') + heading('ПРОГРАММА ВСТРЕЧИ', m.title, group(m.groupId).name, `<a class="btn" href="${parentView ? '#parent' : '#student/' + viewer}">В мой кабинет</a>`) + `<section class="panel"><div class="ws-section-title"><h2>${fullTime(m)} · МСК</h2>${status(m)}</div><p>${esc(m.teacher)} · ${esc(m.room)}</p>${m.status === 'cancelled' ? `<p class="ws-cancel-reason">Причина отмены: ${esc(m.cancelReason)}</p>` : ''}<h3>Что разберём</h3><p class="ws-text">${esc(m.agenda || 'Преподаватель уточнит программу на встрече. Назначенные материалы доступны в кабинете ученика.')}</p>${m.home ? `<h3>Повторение после встречи</h3><p class="ws-text">${esc(m.home)}</p>` : ''}</section>`;
      }
      function journal(g, people) {
        const list = meetings().filter(m => m.groupId === g.id).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
        return `<section class="panel"><div class="ws-section-title"><h2>Журнал посещений</h2><a href="#schedule/${g.id}">Расписание группы</a></div><p class="muted">Посещения видны в кабинетах участников и сводке руководителя.</p>${list.length ? list.map(m => `<div class="ws-journal-meeting"><div class="ws-section-title"><h3>${fullTime(m)} · ${esc(m.title)}</h3>${status(m)}</div>${m.status === 'cancelled' ? `<p class="ws-cancel-reason">${esc(m.cancelReason)}</p><p class="muted">Для отменённой встречи посещения не отмечаются.</p>` : table(['Участник', 'Посещение'], people.map(p => `<tr><td>${esc(p.name)}</td><td><label class="ws-attendance-label"><span class="ws-sr-only">Посещение: ${esc(p.name)}, ${dateLabel(m.date)}</span><select data-ws-change="attendance" data-session="${m.id}" data-learner="${p.id}">${options(Object.entries(attendanceLabels), m.attendance[p.id] || '')}</select></label></td></tr>`))}<p class="ws-meeting-link"><a href="#meeting/${m.id}">Программа и статус встречи</a></p></div>`).join('') : '<p>Добавь встречу в расписание, чтобы открыть журнал.</p>'}</section>`;
      }
      function inbox(id) {
        const p = learner(id) || learner(state().activeLearner) || state().learners[0];
        const list = C.notices(state(), p.id), role = p.id === 'parent' ? 'parent' : 'student';
        return chrome(role) + heading('УВЕДОМЛЕНИЯ УЧАСТНИКА', p.id === 'parent' ? 'Новости семьи' : `Что нового, ${p.name}`, 'Здесь появляются назначения встреч, переносы, отмены и материалы после занятия.', `<a class="btn" href="${role === 'parent' ? '#parent' : '#student/' + p.id}">В мой кабинет</a>`) + (list.length ? `<div class="ws-section-title"><p class="muted">Непрочитанных: ${unread(p.id)}</p><button data-ws-action="read-notices" data-learner="${p.id}" ${unread(p.id) ? '' : 'disabled'}>Прочитать все</button></div><div class="ws-inbox-list">${list.map(n => `<article class="panel ws-inbox-item ${n.readAt ? '' : 'unread'}"><div class="ws-section-title"><span class="tag ${n.readAt ? 'ready' : ''}">${n.readAt ? 'Прочитано' : 'Новое'}</span><small>${new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(n.at))} МСК</small></div><p>${esc(n.message)}</p><div class="actions">${meeting(n.sessionId) ? `<a class="btn" href="#event/${n.sessionId}/${p.id}">Программа встречи</a>` : ''}${!n.readAt ? `<button data-ws-action="read-notice" data-learner="${p.id}" data-notice="${n.id}">Отметить прочитанным</button>` : ''}</div></article>`).join('')}</div>` : `<section class="panel ws-empty"><span class="ws-icon">${icon('calendar')}</span><h2>Пока всё по плану</h2><p>Когда преподаватель добавит или изменит встречу, уведомление появится здесь.</p></section>`);
      }
      function directorPanel() {
        const list = meetings().filter(m => m.status === 'planned' && m.date >= C.date()).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 5);
        return `<section class="panel"><div class="ws-section-title"><h2>Ближайшие встречи</h2><a href="#schedule">Расписание центра</a></div>${list.length ? table(['Время, МСК', 'Тема и группа', 'Преподаватель', 'Место'], list.map(m => `<tr><td>${fullTime(m)}</td><td><a href="#meeting/${m.id}">${esc(m.title)}</a><small>${esc(group(m.groupId).name)}</small></td><td>${esc(m.teacher)}</td><td>${esc(m.room)}</td></tr>`)) : '<p class="muted">Предстоящих встреч пока нет.</p>'}</section>`;
      }
      function submit(form, values) {
        if (form.dataset.wsForm === 'meeting') {
          const m = C.saveMeeting(state(), form.dataset.session, values);
          save('Встреча сохранена. Участники увидят её в кабинетах.');
          go(`#schedule/${m.groupId}/${m.date}`); return true;
        }
        if (form.dataset.wsForm === 'cancel-meeting') {
          C.cancelMeeting(state(), form.dataset.session, values.reason);
          save('Встреча отменена. Причина видна участникам.'); refresh(); return true;
        }
        return false;
      }
      function change(target) {
        if (target.dataset.wsChange === 'calendar-group') { go(`#schedule/${target.value}/${target.dataset.date}`); return true; }
        if (target.dataset.wsChange === 'calendar-date') {
          if (C.validDate(target.value)) go(`#schedule/${target.dataset.group}/${target.value}`);
          return true;
        }
        if (target.dataset.wsChange === 'meeting-group') {
          const g = group(target.value), form = target.closest('form');
          if (g && form) { form.elements.teacher.value = g.teacher; form.elements.room.value = g.room; }
          return true;
        }
        return false;
      }
      function click(button) {
        switch (button.dataset.wsAction) {
          case 'restore-meeting': C.restoreMeeting(state(), button.dataset.session); save('Встреча восстановлена. Участники увидят уведомление.'); refresh(); return true;
          case 'finish-meeting': { const m = C.finishMeeting(state(), button.dataset.session); save('Встреча отмечена проведённой.'); go('#teacher/' + m.groupId); return true; }
          case 'read-notice': C.readNotice(state(), button.dataset.learner, button.dataset.notice); save('Уведомление прочитано.'); refresh(); return true;
          case 'read-notices': C.readNotice(state(), button.dataset.learner); save('Все уведомления прочитаны.'); refresh(); return true;
          default: return false;
        }
      }
      return { calendar, editMeeting, eventDetails, personSchedule, journal, inbox, inboxLink, notificationPreview, directorPanel, submit, change, click };
    }
  };
})();
