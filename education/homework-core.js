/* Homework workflow for the fictional, browser-local Education workspace. */
(() => {
  'use strict';
  const clean = (v, max = 4000) => String(v ?? '').trim().slice(0, max);
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  const uid = () => 'hw-' + (globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2));
  const mimeTypes = {
    'image/jpeg': ['jpg', 'jpeg'], 'image/png': ['png'], 'image/webp': ['webp'],
    'application/pdf': ['pdf'], 'text/plain': ['txt'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['pptx']
  };
  const MAX_FILE = 512 * 1024, MAX_STORAGE = 3 * 1024 * 1024;
  function create(C, legacyData = window.CourseData) {
    const legacyCourse = legacyData?.lessons ? { id: 'senior-basic', title: 'Компьютер и смартфон', group: 'senior', legacy: true, lessons: legacyData.lessons.map(l => ({ id: l.id, title: l.title, home: l.homework, goal: l.summary, scenario: l.quiz?.[0]?.[0] || '', choices: l.quiz?.[0]?.[1] || [] })) } : null;
    const resolveCourse = (s, courseId, learnerId) => C.course(s, courseId, learnerId) || (courseId === legacyCourse?.id ? legacyCourse : null);
    const get = (s, id) => s.homework?.tasks.find(t => t.id === id);
    const sourceExists = (s, t) => t.source.kind === 'session' ? s.sessions.some(m => m.id === t.source.sessionId && m.groupId === t.groupId) : true;
    const paused = (s, t) => !sourceExists(s, t) || t.source.kind === 'session' && s.sessions.some(m => m.id === t.source.sessionId && m.status === 'cancelled');
    const latest = t => t.attempts[t.attempts.length - 1];
    const status = (s, t) => paused(s, t) ? 'paused' : latest(t)?.review?.decision || (latest(t) ? 'submitted' : t.draft ? 'draft' : 'new');
    const content = t => t.draft || latest(t) || { text: '', choice: null, files: [], support: 'independent' };
    const list = (s, learnerId) => (s.homework?.tasks || []).filter(t => t.learnerId === learnerId);
    const byGroup = (s, groupId) => (s.homework?.tasks || []).filter(t => t.groupId === groupId);
    const lessonTask = (s, learnerId, courseId, lessonId) => list(s, learnerId).find(t => t.source.kind === 'lesson' && t.source.courseId === courseId && t.source.lessonId === String(lessonId));
    const now = () => new Date().toISOString();
    function task(s, learnerId, groupId, source, title, instructions, due = '', question = '', choices = []) {
      check(C.learner(s, learnerId) && C.isMember(s, learnerId, groupId), 'Участник не состоит в выбранной группе.');
      return { id: uid(), learnerId, groupId, source: C.clone(source), title: clean(title, 180), instructions: clean(instructions), due, question: clean(question, 1000), choices: choices.map(v => clean(v, 300)), createdAt: now(), draft: null, attempts: [] };
    }
    function sync(s) {
      s.homework ||= { version: 1, tasks: [] };
      for (const a of s.assignments) {
        const c = C.course(s, a.courseId, a.learnerId);
        if (!c) continue;
        const gid = C.groupIds(s, a.learnerId).find(id => C.group(s, id)?.audience === c.group);
        if (!gid) continue;
        for (const l of c.lessons) {
          if (lessonTask(s, a.learnerId, c.id, l.id)) continue;
          s.homework.tasks.push(task(s, a.learnerId, gid, { kind: 'lesson', courseId: c.id, lessonId: String(l.id), courseTitle: c.title, revision: c.revision || 0 }, l.title, l.home || l.practice || l.goal, C.validDate(a.due) ? a.due : '', l.scenario || '', l.choices || []));
        }
      }
      for (const m of s.sessions) {
        if (!clean(m.home) || m.status === 'cancelled') continue;
        for (const p of C.members(s, m.groupId)) {
          if (list(s, p.id).some(t => t.source.kind === 'session' && t.source.sessionId === m.id && t.source.automatic)) continue;
          s.homework.tasks.push(task(s, p.id, m.groupId, { kind: 'session', sessionId: m.id, automatic: true }, m.title, m.home));
        }
      }
      return s;
    }
    const upgrade = s => sync(C.clone(s));
    function notify(s, t, message) {
      s.notices ||= [];
      for (const id of new Set([t.learnerId, C.guardianId(s, t.learnerId)].filter(id => C.learner(s, id)))) {
        s.notices.unshift({ id: uid(), learnerId: id, relatedLearnerId: t.learnerId, homeworkId: t.id, at: now(), readAt: '', message });
      }
      s.notices = s.notices.slice(0, 500);
    }
    function assign(s, values) {
      const g = C.group(s, values.groupId);
      check(g, 'Выбери учебную группу.');
      const people = values.learnerId && values.learnerId !== 'all' ? C.members(s, g.id).filter(p => p.id === values.learnerId) : C.members(s, g.id);
      check(people.length, 'В выбранной группе пока нет подходящих участников.');
      const title = clean(values.title, 180), instructions = clean(values.instructions), due = values.due || '';
      check(title.length >= 3 && instructions.length >= 3, 'Добавь название и понятное описание задания.');
      check(!due || C.validDate(due) && due >= C.date(), 'Укажи срок сегодня или позднее либо оставь его свободным.');
      const choices = clean(values.choiceLines, 2000).split('\n').map(v => clean(v, 300)).filter(Boolean);
      check(!choices.length || choices.length >= 2 && choices.length <= 6 && new Set(choices).size === choices.length, 'Для выбора ответа нужны от двух до шести разных вариантов.');
      check(!choices.length || clean(values.question, 1000).length >= 3, 'Добавь вопрос к вариантам ответа.');
      let source = { kind: 'custom' };
      if (values.sessionId) {
        const m = s.sessions.find(m => m.id === values.sessionId && m.groupId === g.id && m.status !== 'cancelled');
        check(m, 'Выбери действующую встречу этой группы.');
        source = { kind: 'session', sessionId: m.id };
      }
      const result = people.map(p => task(s, p.id, g.id, source, title, instructions, due, values.question, choices));
      check(s.homework.tasks.length + result.length <= 4000, 'Для этого демонстрационного центра достигнут предел заданий.');
      s.homework.tasks.push(...result);
      for (const t of result) notify(s, t, 'Новое домашнее задание: «' + t.title + '».');
      C.log(s, 'Группе «' + g.name + '» выдано задание «' + title + '»: ' + result.length + ' участн.');
      return result;
    }
    function openLesson(s, learnerId, courseId, lessonId) {
      sync(s);
      const found = lessonTask(s, learnerId, courseId, lessonId);
      if (found) return found;
      const c = resolveCourse(s, courseId), l = c?.lessons.find(l => l.id === String(lessonId));
      const gid = C.groupIds(s, learnerId).find(id => C.group(s, id)?.audience === c?.group);
      check(l && gid, 'Для этого занятия выбери учебный профиль подходящего возрастного направления.');
      const t = task(s, learnerId, gid, { kind: 'lesson', courseId, lessonId: String(l.id), courseTitle: c.title, revision: c.revision || 0, selfPractice: true }, l.title, l.home || l.practice || l.goal, '', l.scenario || '', l.choices || []);
      s.homework.tasks.push(t);
      return t;
    }
    function validFile(f) {
      if (!f || typeof f.id !== 'string' || typeof f.name !== 'string' || f.name.length > 160 || !mimeTypes[f.type] || !Number.isInteger(f.size) || f.size < 1 || f.size > MAX_FILE || typeof f.data !== 'string') return false;
      const prefix = 'data:' + f.type + ';base64,', raw = f.data.slice(prefix.length);
      return f.data.startsWith(prefix) && raw.length % 4 === 0 && raw.length <= Math.ceil(MAX_FILE / 3) * 4 && /^[A-Za-z0-9+/]*={0,2}$/.test(raw) && raw.length / 4 * 3 - (raw.endsWith('==') ? 2 : raw.endsWith('=') ? 1 : 0) === f.size && mimeTypes[f.type].includes(f.name.split('.').pop().toLowerCase());
    }
    function checkedTask(s, id, learnerId) {
      const t = get(s, id);
      check(t && t.learnerId === learnerId && C.learner(s, learnerId), 'Задание не относится к выбранному участнику.');
      check(!paused(s, t), 'Встреча отменена или недоступна. Задание приостановлено; уточни у педагога.');
      return t;
    }
    function makeDraft(s, t, values, actorId) {
      check(actorId === t.learnerId || C.guardianId(s, t.learnerId) === actorId, 'Выбери участника или связанного сопровождающего.');
      check(['new', 'draft', 'revision'].includes(status(s, t)), 'Работа уже отправлена. Дождись проверки педагога.');
      const files = values.files || [], choice = values.choice === '' || values.choice === null || values.choice === undefined ? null : Number(values.choice);
      check(Array.isArray(files) && files.length <= 2 && files.every(validFile) && new Set(files.map(f => f.id)).size === files.length, 'Прикрепи до двух поддерживаемых файлов размером до 512 КБ каждый.');
      check(choice === null || Number.isInteger(choice) && choice >= 0 && choice < t.choices.length, 'Выбери ответ из списка.');
      check(['independent', 'with-helper', 'in-class'].includes(values.support), 'Укажи, как выполнялось задание.');
      return { text: clean(values.text), choice, files: C.clone(files), support: actorId === t.learnerId ? values.support : 'with-helper', actorId, savedAt: now() };
    }
    function budget(s, t, replacement) {
      const size = JSON.stringify({ ...s.homework, tasks: s.homework.tasks.map(x => x.id === t.id ? replacement : x) }).length;
      check(size <= MAX_STORAGE, 'В демонстрации закончилось место для вложений. Уменьши файлы или отправь текстовый ответ.');
    }
    function saveDraft(s, id, learnerId, values, actorId = learnerId) {
      const t = checkedTask(s, id, learnerId), draft = makeDraft(s, t, values, actorId);
      budget(s, t, { ...t, draft }); t.draft = draft;
      return t;
    }
    function submit(s, id, learnerId, values, actorId = learnerId) {
      const t = checkedTask(s, id, learnerId), draft = makeDraft(s, t, values, actorId);
      check(draft.text || draft.files.length || draft.choice !== null, 'Добавь ответ, выбери вариант или прикрепи работу.');
      check(!t.choices.length || draft.choice !== null, 'Выбери вариант ответа на учебный вопрос.');
      check(t.attempts.length < 20, 'Достигнут предел отправок в демонстрации. Обсуди работу с педагогом.');
      const attempt = { ...draft, id: uid(), number: t.attempts.length + 1, at: now(), review: null };
      budget(s, t, { ...t, draft: null, attempts: [...t.attempts, attempt] });
      t.draft = null; t.attempts.push(attempt);
      C.log(s, C.learner(s, learnerId).name + ': отправлена работа «' + t.title + '» (попытка ' + attempt.number + ').');
      return attempt;
    }
    function review(s, id, groupId, attemptId, decision, feedback) {
      const t = get(s, id), a = t && latest(t);
      check(t && t.groupId === groupId && !paused(s, t) && a?.id === attemptId && status(s, t) === 'submitted', 'Работа уже проверена или изменилась. Обнови список проверок.');
      check(['accepted', 'revision'].includes(decision), 'Выбери результат проверки.');
      const message = clean(feedback, 2000);
      check(message.length >= 3, 'Добавь понятный комментарий участнику.');
      a.review = { decision, feedback: message, at: now(), teacher: C.group(s, groupId).teacher };
      notify(s, t, (decision === 'accepted' ? 'Работа принята' : 'Нужна доработка') + ': «' + t.title + '». ' + message);
      C.log(s, 'Проверено задание «' + t.title + '»: ' + (decision === 'accepted' ? 'принято.' : 'нужна доработка.'));
      return a;
    }
    function inClass(s, id, groupId, feedback) {
      const t = get(s, id);
      check(t && t.groupId === groupId && !paused(s, t) && ['new', 'draft', 'revision'].includes(status(s, t)), 'Сначала проверь статус задания и выбранную группу.');
      const message = clean(feedback, 2000);
      check(message.length >= 3, 'Опиши, что участник выполнил на занятии.');
      check(t.attempts.length < 20, 'Достигнут предел отправок в демонстрации.');
      const a = { id: uid(), number: t.attempts.length + 1, text: message, choice: null, files: [], support: 'in-class', actorId: 'teacher', at: now(), review: { decision: 'accepted', feedback: message, at: now(), teacher: C.group(s, groupId).teacher } };
      budget(s, t, { ...t, draft: null, attempts: [...t.attempts, a] });
      t.draft = null; t.attempts.push(a);
      notify(s, t, 'Педагог отметил выполнение на занятии: «' + t.title + '». ' + message);
      C.log(s, 'Педагог отметил выполнение «' + t.title + '» на занятии.');
      return a;
    }
    function stats(s, tasks = s.homework.tasks) {
      const result = { total: tasks.length, new: 0, draft: 0, submitted: 0, revision: 0, accepted: 0, paused: 0 };
      for (const t of tasks) result[status(s, t)]++;
      return result;
    }
    function valid(s) {
      if (s.homework === undefined) return true;
      try {
        const h = s.homework;
        const validContent = (w, t) => w && typeof w.text === 'string' && w.text.length <= 4000 && (w.choice === null || Number.isInteger(w.choice) && w.choice >= 0 && w.choice < t.choices.length) && ['independent', 'with-helper', 'in-class'].includes(w.support) && typeof w.actorId === 'string' && Array.isArray(w.files) && w.files.length <= 2 && w.files.every(validFile);
        return h?.version === 1 && Array.isArray(h.tasks) && h.tasks.length <= 4000 && new Set(h.tasks.map(t => t.id)).size === h.tasks.length && JSON.stringify(h).length <= MAX_STORAGE && h.tasks.every(t =>
          t && typeof t.id === 'string' && C.learner(s, t.learnerId) && C.group(s, t.groupId) && typeof t.title === 'string' && t.title.length <= 180 && typeof t.instructions === 'string' && t.instructions.length <= 4000 && (!t.due || C.validDate(t.due)) && t.source && ['lesson', 'session', 'custom'].includes(t.source.kind) && (t.source.kind !== 'lesson' || typeof t.source.courseId === 'string' && typeof t.source.lessonId === 'string') && (t.source.kind !== 'session' || typeof t.source.sessionId === 'string') && typeof t.question === 'string' && Array.isArray(t.choices) && t.choices.length <= 6 && t.choices.every(v => typeof v === 'string' && v.length <= 300) && (!t.draft || validContent(t.draft, t)) && Array.isArray(t.attempts) && t.attempts.length <= 20 && new Set(t.attempts.map(a => a.id)).size === t.attempts.length && t.attempts.every(a => validContent(a, t) && typeof a.id === 'string' && Number.isInteger(a.number) && Number.isFinite(Date.parse(a.at)) && (!a.review || ['accepted', 'revision'].includes(a.review.decision) && typeof a.review.feedback === 'string' && a.review.feedback.length <= 2000)));
      } catch { return false; }
    }
    return { upgrade, sync, valid, get, list, byGroup, lessonTask, openLesson, resolveCourse, status, content, latest, stats, assign, saveDraft, submit, review, inClass, validFile, mimeTypes, MAX_FILE };
  }
  window.EducationHomeworkCore = { create };
})();
