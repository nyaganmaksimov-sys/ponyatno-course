/* Shared, browser-local demonstration data. No account or access-control system. */
(() => {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const uid = prefix => prefix + '-' + (globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2));
  const date = (offset = 0) => {
    const now = new Date();
    now.setUTCDate(now.getUTCDate() + offset);
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  };
  const text = (value, max) => String(value ?? '').trim().slice(0, max);
  const requireValue = (condition, message) => { if (!condition) throw new Error(message); };
  const validDate = value => typeof value === 'string' && /^20\d{2}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value + 'T12:00:00Z')) && new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) === value;
  const shiftDate = (value, days) => {
    requireValue(validDate(value) && Number.isInteger(days), 'Проверь дату.');
    const d = new Date(value + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  };
  const weekStart = value => shiftDate(value, -((new Date(value + 'T12:00:00Z').getUTCDay() + 6) % 7));
  const timeMinutes = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : NaN;

  function create(catalog) {
    const native = catalog.courses.filter(c => c.lessons).map(c => ({
      ...c, lessons: c.lessons.map((l, i) => ({ ...l, id: String(i) })), custom: false
    }));
    const seed = () => ({
      version: 1, activeLearner: 'child', teacherGroup: 'children', notices: [],
      learners: [
        { id: 'child', name: 'Саша', detail: '8 лет · ученик', groupId: 'children', initial: 'С' },
        { id: 'parent', name: 'Марина', detail: 'Взрослый участник · родитель Саши', groupId: 'families', initial: 'М' },
        { id: 'senior', name: 'Виктор', detail: 'Старшее поколение', groupId: 'seniors', initial: 'В' }
      ],
      groups: [
        { id: 'children', name: 'Цифровые исследователи', audience: 'junior', teacher: 'Педагог 01', room: 'Кабинет 1' },
        { id: 'families', name: 'Родительская гостиная', audience: 'parents', teacher: 'Педагог 02', room: 'Онлайн' },
        { id: 'seniors', name: 'Уверенный пользователь', audience: 'senior', teacher: 'Педагог 01', room: 'Кабинет 2' }
      ],
      sessions: [
        { id: 'meeting-child', groupId: 'children', date: date(), time: '16:00', title: 'Учимся пользоваться интернетом', minutes: 40, attendance: { child: 'present' } },
        { id: 'meeting-parent', groupId: 'families', date: date(1), time: '19:00', title: 'Семейные правила для гаджетов', minutes: 60, attendance: {} },
        { id: 'meeting-senior', groupId: 'seniors', date: date(1), time: '11:00', title: 'Учебный разбор подозрительного звонка', minutes: 75, attendance: {} }
      ],
      assignments: [
        { id: 'assignment-child', learnerId: 'child', courseId: 'junior-web', due: date(7), note: 'Повтори дома с взрослым. Если что-то непонятно, обсудим на встрече.' },
        { id: 'assignment-parent', learnerId: 'parent', courseId: 'parents-digital', due: date(7), note: 'Подготовь один вопрос для обсуждения на родительской встрече.' },
        { id: 'assignment-senior', learnerId: 'senior', courseId: 'senior-fraud', due: date(7), note: 'Занимайся в удобном темпе. Для повторения можно включить озвучивание.' }
      ],
      marks: [
        { learnerId: 'child', courseId: 'junior-web', lessonId: '0', at: new Date().toISOString() },
        { learnerId: 'senior', courseId: 'senior-fraud', lessonId: '0', at: new Date().toISOString() }
      ],
      notes: { child: 'На следующей встрече вместе повторим, как задавать вопросы взрослым. Дома можно разобрать ещё один учебный пример.' },
      drafts: [{
        id: 'custom-presentation', title: 'Моя первая презентация', group: 'junior', description: 'Два коротких занятия: придумываем историю и собираем понятные слайды.',
        lessons: [
          { id: 'story', title: 'Придумываем историю', goal: 'Составить рассказ из трёх частей.', text: 'Выбери вымышленного героя. Придумай начало, событие и завершение истории. Для каждой части нарисуй один рисунок на бумаге.', practice: 'Разложи три рисунка по порядку и расскажи историю взрослому.', home: 'Придумайте вместе другое окончание.', minutes: 20 },
          { id: 'slides', title: 'Собираем три слайда', goal: 'Перенести историю в три простых слайда.', text: 'На каждом слайде оставь один рисунок и короткую подпись. Проверь, что подписи легко прочитать. Покажи слайды в порядке своей истории.', practice: 'Покажи историю взрослому и спроси, что было понятно.', home: 'Повтори рассказ по рисункам без подсказки.', minutes: 25 }
        ], published: null, revision: 0
      }],
      events: [{ id: 'initial', at: new Date().toISOString(), message: 'Демонстрационный центр подготовлен: три группы и три учебных профиля.' }]
    });

    function valid(s) {
      try {
        if (!s || s.version !== 1 || !['learners', 'groups', 'sessions', 'assignments', 'marks', 'drafts', 'events'].every(k => Array.isArray(s[k]) && s[k].length <= 2000)) return false;
        const defaults = seed();
        if (!defaults.learners.every(l => s.learners.some(x => x?.id === l.id)) || !defaults.groups.every(g => s.groups.some(x => x?.id === g.id))) return false;
        if (!s.learners.every(l => l && typeof l.id === 'string' && typeof l.name === 'string' && s.groups.some(g => g.id === l.groupId))) return false;
        if (!s.groups.every(g => g && typeof g.id === 'string' && typeof g.name === 'string')) return false;
        if (!s.drafts.every(c => c && typeof c.id === 'string' && typeof c.title === 'string' && Array.isArray(c.lessons) && c.lessons.every(l => l && typeof l.id === 'string') && (!c.published || Array.isArray(c.published.lessons)))) return false;
        if (!s.sessions.every(m => m && typeof m.id === 'string' && validDate(m.date) && Number.isFinite(timeMinutes(m.time)) && typeof m.title === 'string' && Number.isInteger(m.minutes) && m.minutes >= 5 && m.minutes <= 240 && s.groups.some(g => g.id === m.groupId) && (m.status === undefined || ['planned', 'completed', 'cancelled'].includes(m.status)) && m.attendance && Object.values(m.attendance).every(v => ['present', 'absent', 'excused'].includes(v)))) return false;
        if (s.notices !== undefined && (!Array.isArray(s.notices) || s.notices.length > 500 || !s.notices.every(n => n && typeof n.id === 'string' && typeof n.message === 'string' && Number.isFinite(Date.parse(n.at)) && s.learners.some(l => l.id === n.learnerId)))) return false;
        if (!s.assignments.every(a => a && s.learners.some(l => l.id === a.learnerId) && (native.some(c => c.id === a.courseId) || (a.snapshot?.id === a.courseId && Array.isArray(a.snapshot.lessons))))) return false;
        if (!s.marks.every(m => m && typeof m.lessonId === 'string' && typeof m.at === 'string' && s.learners.some(l => l.id === m.learnerId))) return false;
        if (!s.notes || typeof s.notes !== 'object') return false;
        return true;
      } catch { return false; }
    }
    const learner = (s, id) => s.learners.find(l => l.id === id);
    const group = (s, id) => s.groups.find(g => g.id === id);
    const meetingInfo = (s, m) => ({ ...m, status: m.status || 'planned', teacher: m.teacher || group(s, m.groupId)?.teacher, room: m.room || group(s, m.groupId)?.room, agenda: m.agenda || '', home: m.home || '', cancelReason: m.cancelReason || '' });
    function upgrade(s) {
      const updated = clone(s);
      updated.sessions = updated.sessions.map(m => meetingInfo(updated, m));
      updated.notices ||= [];
      return updated;
    }
    const available = s => [...native, ...s.drafts.filter(c => c.published).map(c => ({ ...clone(c.published), custom: true }))];
    const course = (s, id, learnerId) => s.assignments.find(a => a.courseId === id && a.learnerId === learnerId)?.snapshot || available(s).find(c => c.id === id);
    const assigned = (s, learnerId) => s.assignments.filter(a => a.learnerId === learnerId);
    const isDone = (s, learnerId, courseId, lessonId) => s.marks.some(m => m.learnerId === learnerId && m.courseId === courseId && m.lessonId === String(lessonId));
    const progress = (s, learnerId) => assigned(s, learnerId).reduce((result, a) => {
      const c = course(s, a.courseId, learnerId);
      if (c) { result.total += c.lessons.length; result.done += c.lessons.filter(l => isDone(s, learnerId, c.id, l.id)).length; }
      return result;
    }, { done: 0, total: 0 });
    function log(s, message) {
      s.events.unshift({ id: uid('event'), at: new Date().toISOString(), message });
      s.events = s.events.slice(0, 50);
    }
    function complete(s, learnerId, courseId, lessonId) {
      const c = course(s, courseId, learnerId);
      requireValue(learner(s, learnerId) && assigned(s, learnerId).some(a => a.courseId === courseId) && c?.lessons.some(l => l.id === String(lessonId)), 'Это занятие не назначено выбранному ученику.');
      if (isDone(s, learnerId, courseId, lessonId)) return false;
      s.marks.push({ learnerId, courseId, lessonId: String(lessonId), at: new Date().toISOString() });
      log(s, learner(s, learnerId).name + ': разобрано занятие «' + c.lessons.find(l => l.id === String(lessonId)).title + '».');
      return true;
    }
    function assign(s, groupId, courseId, due, note) {
      const g = group(s, groupId), c = available(s).find(c => c.id === courseId);
      requireValue(g && c && g.audience === c.group, 'Выбери курс для возраста этой группы.');
      requireValue(validDate(due) && due >= date(), 'Укажи срок сегодня или позднее.');
      const people = s.learners.filter(l => l.groupId === groupId && !assigned(s, l.id).some(a => a.courseId === courseId));
      requireValue(people.length, 'Этот курс уже назначен всем участникам группы.');
      for (const l of people) s.assignments.push({ id: uid('assignment'), learnerId: l.id, courseId, due, note: text(note, 500), ...(c.custom ? { snapshot: clone(c) } : {}) });
      log(s, 'Группе «' + g.name + '» назначен курс «' + c.title + '».');
      return people.length;
    }
    function attendance(s, sessionId, learnerId, value) {
      const meeting = s.sessions.find(m => m.id === sessionId);
      requireValue(meeting && meeting.status !== 'cancelled' && learner(s, learnerId)?.groupId === meeting.groupId && ['', 'present', 'absent', 'excused'].includes(value), 'Не удалось изменить посещаемость: проверь участника и статус встречи.');
      if (value) meeting.attendance[learnerId] = value;
      else delete meeting.attendance[learnerId];
    }
    function collision(s, candidate, excludeId) {
      const start = timeMinutes(candidate.time), end = start + candidate.minutes;
      for (const original of s.sessions) {
        const m = meetingInfo(s, original), other = timeMinutes(m.time);
        if (m.id === excludeId || m.status === 'cancelled' || m.date !== candidate.date || start >= other + m.minutes || other >= end) continue;
        const reason = m.groupId === candidate.groupId ? 'У группы уже есть встреча' : m.teacher === candidate.teacher ? 'Преподаватель занят' : candidate.room !== 'Онлайн' && m.room === candidate.room ? 'Кабинет занят' : '';
        if (reason) return `${reason}: «${m.title}», ${m.time} (${group(s, m.groupId).name}). Выбери другое время или ресурс.`;
      }
      return '';
    }
    function notifyMeeting(s, groupIds, meeting, message) {
      s.notices ||= [];
      const people = s.learners.filter(p => groupIds.includes(p.groupId));
      const at = new Date().toISOString();
      for (const p of people) {
        s.notices.unshift({ id: uid('notice'), learnerId: p.id, relatedLearnerId: p.id, groupId: meeting.groupId, sessionId: meeting.id, message, at, readAt: '' });
        if (p.id === 'child') s.notices.unshift({ id: uid('notice'), learnerId: 'parent', relatedLearnerId: 'child', groupId: meeting.groupId, sessionId: meeting.id, message: 'Для Саши: ' + message, at, readAt: '' });
      }
      s.notices = s.notices.slice(0, 500);
    }
    const meetingStamp = m => new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', day: 'numeric', month: 'long' }).format(new Date(m.date + 'T12:00:00Z')) + ', ' + m.time;
    function saveMeeting(s, id, values) {
      const original = id ? s.sessions.find(m => m.id === id) : null;
      requireValue(!id || original, 'Встреча не найдена.');
      const old = original && meetingInfo(s, original);
      requireValue(!old || old.status !== 'cancelled', 'Сначала восстанови отменённую встречу.');
      const g = group(s, values.groupId), minutes = Number(values.minutes);
      requireValue(g && text(values.title, 160).length >= 3 && validDate(values.date) && Number.isFinite(timeMinutes(values.time)), 'Заполни тему встречи, группу, дату и время.');
      requireValue(Number.isInteger(minutes) && minutes >= 15 && minutes <= 180 && timeMinutes(values.time) + minutes <= 1440, 'Продолжительность — от 15 до 180 минут. Встреча должна завершиться в тот же день.');
      const teachers = s.groups.map(g => g.teacher), rooms = s.groups.map(g => g.room);
      requireValue(teachers.includes(values.teacher) && rooms.includes(values.room), 'Выбери преподавателя и место из списка.');
      const candidate = { id: old?.id || uid('meeting'), groupId: g.id, title: text(values.title, 160), date: values.date, time: values.time, minutes, teacher: values.teacher, room: values.room, agenda: text(values.agenda, 2000), home: text(values.home, 1000), status: old?.status || 'planned', attendance: old?.attendance || {}, cancelReason: '' };
      const moving = old && ['groupId', 'date', 'time', 'minutes', 'teacher', 'room'].some(k => old[k] !== candidate[k]);
      requireValue(!moving || (old.status !== 'completed' && !Object.keys(old.attendance).length), 'У встречи уже есть отметки или она проведена. Чтобы сохранить журнал, создай следующую встречу отдельно.');
      const error = collision(s, candidate, id);
      requireValue(!error, error);
      if (old && ['groupId', 'title', 'date', 'time', 'minutes', 'teacher', 'room', 'agenda', 'home'].every(k => old[k] === candidate[k])) return original;
      if (original) s.sessions[s.sessions.indexOf(original)] = candidate;
      else s.sessions.push(candidate);
      const message = !old ? `Назначена встреча «${candidate.title}»: ${meetingStamp(candidate)}. ${candidate.teacher}, ${candidate.room}.` : moving ? `Встреча «${candidate.title}» перенесена: было ${meetingStamp(old)}, теперь ${meetingStamp(candidate)}. ${candidate.teacher}, ${candidate.room}.` : `Обновлена программа встречи «${candidate.title}»: ${meetingStamp(candidate)}.`;
      log(s, message);
      notifyMeeting(s, [...new Set([old?.groupId, candidate.groupId].filter(Boolean))], candidate, message);
      return candidate;
    }
    function cancelMeeting(s, id, reason) {
      const m = s.sessions.find(m => m.id === id);
      requireValue(m && (m.status || 'planned') === 'planned', 'Отменить можно только запланированную встречу.');
      requireValue(!Object.keys(m.attendance).length, 'У встречи уже есть отметки посещения. Сохрани журнал, а изменения обсуди с участниками.');
      requireValue(text(reason, 500).length >= 3, 'Укажи причину отмены.');
      m.status = 'cancelled'; m.cancelReason = text(reason, 500);
      const message = `Встреча «${m.title}» ${meetingStamp(m)} отменена. Причина: ${m.cancelReason}`;
      log(s, message); notifyMeeting(s, [m.groupId], m, message);
      return m;
    }
    function restoreMeeting(s, id) {
      const m = s.sessions.find(m => m.id === id);
      requireValue(m?.status === 'cancelled', 'Встреча не отменена.');
      const error = collision(s, meetingInfo(s, m), id);
      requireValue(!error, 'Восстановить встречу на прежнее время не удалось. ' + error);
      m.status = 'planned'; m.cancelReason = '';
      const message = `Встреча «${m.title}» восстановлена: ${meetingStamp(m)}.`;
      log(s, message); notifyMeeting(s, [m.groupId], m, message);
      return m;
    }
    function finishMeeting(s, id) {
      const m = s.sessions.find(m => m.id === id);
      requireValue(m && (m.status || 'planned') === 'planned', 'Провести можно только запланированную встречу.');
      m.status = 'completed';
      const message = `Встреча «${m.title}» проведена. ${m.home ? 'Повторение дома: ' + m.home : 'Материалы для повторения доступны в назначенных курсах.'}`;
      log(s, message); notifyMeeting(s, [m.groupId], m, message);
      return m;
    }
    const notices = (s, learnerId) => (s.notices || []).filter(n => n.learnerId === learnerId);
    function readNotice(s, learnerId, id) {
      requireValue(learner(s, learnerId), 'Учебный профиль не найден.');
      const list = notices(s, learnerId).filter(n => !id || n.id === id);
      requireValue(!id || list.length, 'Уведомление не найдено.');
      for (const n of list) if (!n.readAt) n.readAt = new Date().toISOString();
    }
    function createDraft(s, values) {
      requireValue(text(values.title, 100).length >= 3 && catalog.groups.some(g => g.id === values.group), 'Укажи название курса и направление.');
      const draft = { id: uid('custom'), title: text(values.title, 100), group: values.group, description: text(values.description, 1000), lessons: [], published: null, revision: 0 };
      s.drafts.push(draft);
      log(s, 'Создан черновик «' + draft.title + '».');
      return draft;
    }
    function editDraft(s, id, values) {
      const draft = s.drafts.find(c => c.id === id);
      requireValue(draft && text(values.title, 100).length >= 3 && catalog.groups.some(g => g.id === values.group), 'Проверь название и направление.');
      draft.title = text(values.title, 100); draft.group = values.group; draft.description = text(values.description, 1000);
      return draft;
    }
    function saveLesson(s, courseId, lessonId, values) {
      const draft = s.drafts.find(c => c.id === courseId), minutes = Number(values.minutes);
      requireValue(draft && text(values.title, 100).length >= 3 && text(values.goal, 500) && text(values.text, 8000) && text(values.practice, 2000), 'Заполни название, цель, объяснение и практику.');
      requireValue(Number.isInteger(minutes) && minutes >= 5 && minutes <= 180, 'Продолжительность — от 5 до 180 минут.');
      const result = { id: lessonId || uid('lesson'), title: text(values.title, 100), goal: text(values.goal, 500), text: text(values.text, 8000), practice: text(values.practice, 2000), home: text(values.home, 2000), minutes };
      if (lessonId) {
        const index = draft.lessons.findIndex(l => l.id === lessonId);
        requireValue(index !== -1, 'Занятие не найдено.'); draft.lessons[index] = result;
      } else draft.lessons.push(result);
      return result;
    }
    function moveLesson(s, courseId, lessonId, delta) {
      const draft = s.drafts.find(c => c.id === courseId), index = draft?.lessons.findIndex(l => l.id === lessonId);
      requireValue(draft && index >= 0 && [-1, 1].includes(delta), 'Занятие не найдено.');
      const target = index + delta;
      if (target >= 0 && target < draft.lessons.length) [draft.lessons[index], draft.lessons[target]] = [draft.lessons[target], draft.lessons[index]];
    }
    function publish(s, id) {
      const draft = s.drafts.find(c => c.id === id);
      requireValue(draft && draft.title.trim().length >= 3 && draft.description.trim() && draft.lessons.length, 'Добавь описание и хотя бы одно полное занятие.');
      requireValue(draft.lessons.every(l => l.title.trim() && l.goal.trim() && l.text.trim() && l.practice.trim() && Number.isInteger(l.minutes) && l.minutes >= 5 && l.minutes <= 180), 'Проверь содержание всех занятий.');
      draft.revision += 1;
      draft.published = clone({ id: draft.id, title: draft.title, group: draft.group, description: draft.description, lessons: draft.lessons, revision: draft.revision, custom: true });
      log(s, 'В демо опубликован курс «' + draft.title + '», версия ' + draft.revision + '.');
      return draft.published;
    }
    function study(s, learnerId, courseId, index) {
      const c = course(s, courseId, learnerId), i = Number(index);
      if (!learner(s, learnerId) || !assigned(s, learnerId).some(a => a.courseId === courseId) || !c || c.custom || !/^\d+$/.test(String(index)) || !c.lessons[i]) return null;
      return { learner: learner(s, learnerId), c, index: i };
    }
    const stats = s => {
      const result = s.learners.reduce((acc, l) => { const p = progress(s, l.id); acc.done += p.done; acc.total += p.total; return acc; }, { done: 0, total: 0, present: 0, absent: 0, excused: 0 });
      for (const m of s.sessions.filter(m => m.status !== 'cancelled')) for (const v of Object.values(m.attendance)) if (v in result) result[v]++;
      return result;
    };
    function programStats(s, groupIds) {
      const people = s.learners.filter(l => groupIds.includes(l.groupId));
      const list = s.sessions.filter(m => groupIds.includes(m.groupId));
      const result = { participants: people.length, planned: 0, completed: 0, cancelled: 0, present: 0, absent: 0, excused: 0, minutes: 0, done: 0, total: 0 };
      for (const m of list) {
        result[m.status || 'planned']++;
        if (m.status === 'completed') result.minutes += m.minutes;
        if (m.status !== 'cancelled') for (const [id, value] of Object.entries(m.attendance)) if (people.some(p => p.id === id) && ['present', 'absent', 'excused'].includes(value)) result[value]++;
      }
      for (const p of people) { const n = progress(s, p.id); result.done += n.done; result.total += n.total; }
      return result;
    }
    return { seed, valid, upgrade, learner, group, native, available, course, assigned, isDone, progress, complete, assign, attendance, createDraft, editDraft, saveLesson, moveLesson, publish, study, stats, date, clone, validDate, shiftDate, weekStart, meetingInfo, collision, saveMeeting, cancelMeeting, restoreMeeting, finishMeeting, notices, readNotice, programStats };
  }
  window.EducationWorkspaceCore = { create };
})();
