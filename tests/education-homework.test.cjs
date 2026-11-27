const { test } = require('node:test');
const assert = require('node:assert/strict');
global.window = {};
require('../data.js');
require('../education/catalog.js');
require('../education/organization.js');
require('../education/workspace-core.js');
require('../education/admission-core.js');
require('../education/homework-core.js');
require('../education/homework.js');
const C = window.EducationWorkspaceCore.create(window.EducationCatalog);
const A = window.EducationAdmissionCore.create(C, window.EducationOrganization, window.EducationCatalog);
const H = window.EducationHomeworkCore.create(C);
const seed = () => H.upgrade(A.upgrade(C.upgrade(C.seed())));
const answer = (text = 'Моя учебная работа') => ({ text, choice: 0, support: 'independent', files: [] });
const first = s => H.list(s, 'child')[0];
const file = (id, bytes = 3) => ({ id, name: id + '.txt', type: 'text/plain', size: bytes, data: 'data:text/plain;base64,' + Buffer.alloc(bytes, 65).toString('base64') });

test('old state upgrades without losing progress; every assigned lesson gets one homework', () => {
  const old = A.upgrade(C.upgrade(C.seed())), initial = JSON.stringify(old);
  assert.equal(H.valid(old), true);
  const s = H.upgrade(old);
  assert.equal(JSON.stringify(old), initial);
  assert.deepEqual(s.marks, old.marks);
  assert.deepEqual(s.assignments, old.assignments);
  assert.equal(s.homework.tasks.length, s.assignments.reduce((n, a) => n + C.course(s, a.courseId, a.learnerId).lessons.length, 0));
  const ids = s.homework.tasks.map(t => t.id);
  H.sync(s); H.sync(s);
  assert.deepEqual(s.homework.tasks.map(t => t.id), ids);
  assert.equal(H.valid(s), true);
});

test('draft, submission, revision and acceptance preserve independent attempt history', () => {
  const s = seed(), t = first(s), before = C.progress(s, 'child');
  H.saveDraft(s, t.id, 'child', answer('Первый черновик'));
  assert.equal(H.status(s, t), 'draft');
  const a = H.submit(s, t.id, 'child', answer('Первый ответ'));
  assert.equal(H.status(s, t), 'submitted');
  assert.throws(() => H.submit(s, t.id, 'child', answer('Повторный щелчок')));
  H.review(s, t.id, t.groupId, a.id, 'revision', 'Добавь ещё один пример.');
  assert.equal(H.status(s, t), 'revision');
  H.saveDraft(s, t.id, 'child', answer('Второй черновик'));
  assert.equal(a.text, 'Первый ответ');
  const b = H.submit(s, t.id, 'child', answer('Исправленный ответ'));
  assert.throws(() => H.review(s, t.id, t.groupId, a.id, 'accepted', 'Устаревшая проверка'));
  H.review(s, t.id, t.groupId, b.id, 'accepted', 'Спасибо, теперь всё понятно.');
  assert.equal(H.status(s, t), 'accepted');
  assert.equal(t.attempts.length, 2);
  assert.equal(a.review.decision, 'revision');
  assert.equal(b.review.decision, 'accepted');
  assert.throws(() => H.saveDraft(s, t.id, 'child', answer()));
  assert.deepEqual(C.progress(s, 'child'), before);
  assert.equal(H.valid(s), true);
});

test('empty submissions, invalid choices, wrong learners and unrelated helpers are rejected atomically', () => {
  const s = seed(), t = first(s), before = JSON.stringify(t);
  for (const [id, data, actor] of [
    ['parent', answer(), 'parent'], ['child', answer(), 'senior'],
    ['child', { ...answer(''), choice: null }, 'child'], ['child', { ...answer(), choice: 999 }, 'child'],
    ['child', { ...answer(), support: 'anything' }, 'child']
  ]) assert.throws(() => H.submit(s, t.id, id, data, actor));
  assert.equal(JSON.stringify(t), before);
});

test('linked parent can send child work with explicit assistance and gets review notices', () => {
  const s = seed(), t = first(s);
  const a = H.submit(s, t.id, 'child', answer(), 'parent');
  assert.equal(a.actorId, 'parent');
  assert.equal(a.support, 'with-helper');
  H.review(s, t.id, 'children', a.id, 'accepted', 'Работа принята, спасибо.');
  const notices = s.notices.filter(n => n.homeworkId === t.id);
  assert.deepEqual(new Set(notices.map(n => n.learnerId)), new Set(['child', 'parent']));
  assert.equal(C.valid(s), true);
});

test('teacher can issue to one learner or a whole studio without assigning a digital course', () => {
  const s = seed(), g = s.groups.find(g => g.id.includes('creative')) || s.groups.find(g => g.programId === 'creative');
  assert.ok(g);
  s.learners.push({ id: 'artist', name: 'Художник', detail: 'Учебный профиль', initial: 'Х', groupId: g.id, audience: g.audience, guardianId: 'parent' });
  const result = H.assign(s, { groupId: g.id, learnerId: 'all', title: 'Творческая работа', instructions: 'Создай рисунок и приложи фотографию.', due: '' });
  assert.equal(result.length, 1);
  assert.equal(C.assigned(s, 'artist').length, 0);
  H.submit(s, result[0].id, 'artist', { ...answer('Описание рисунка'), choice: null });
  assert.equal(H.status(s, result[0]), 'submitted');
  assert.throws(() => H.assign(s, { groupId: g.id, learnerId: 'senior', title: 'Пример', instructions: 'Сделай пример.' }));
});

test('meeting homework is generated for members, paused on cancellation and resumed without losing drafts', () => {
  const s = seed(), m = s.sessions.find(m => m.groupId === 'families');
  m.home = 'Придумай правило для семейного обсуждения.';
  H.sync(s);
  const t = H.list(s, 'parent').find(t => t.source.sessionId === m.id);
  assert.ok(t);
  H.saveDraft(s, t.id, 'parent', { ...answer('Мой черновик'), choice: null });
  m.status = 'cancelled';
  assert.equal(H.status(s, t), 'paused');
  assert.throws(() => H.submit(s, t.id, 'parent', { ...answer(), choice: null }));
  m.status = 'planned'; H.sync(s);
  assert.equal(H.status(s, t), 'draft');
  assert.equal(H.content(t).text, 'Мой черновик');
  assert.equal(s.homework.tasks.filter(x => x.id === t.id).length, 1);
});

test('all published catalog lessons and original twelve lessons support online practice', () => {
  const s = seed(); let count = 0;
  for (const audience of window.EducationCatalog.groups.map(g => g.id)) {
    if (!s.groups.some(g => g.audience === audience)) s.groups.push({ id: 'test-' + audience, name: audience, audience, teacher: 'Педагог', room: 'Кабинет' });
    if (!s.learners.some(p => C.group(s, p.groupId).audience === audience)) {
      const g = s.groups.find(g => g.audience === audience);
      s.learners.push({ id: 'test-' + audience, name: audience, groupId: g.id });
    }
  }
  const courses = [...C.available(s), H.resolveCourse(s, 'senior-basic')];
  for (const c of courses) {
    const p = s.learners.find(p => C.group(s, p.groupId).audience === c.group);
    for (const l of c.lessons) {
      const t = H.openLesson(s, p.id, c.id, l.id);
      assert.equal(t.source.lessonId, l.id);
      assert.ok(t.instructions);
      assert.equal(H.openLesson(s, p.id, c.id, l.id).id, t.id);
      count++;
    }
  }
  assert.ok(count > 100);
  assert.equal(H.valid(s), true);
  assert.throws(() => H.openLesson(s, 'child', 'senior-basic', 'pc-start'));
});

test('author homework retains assigned publication while newly assigned lessons are added', () => {
  const s = seed(); C.publish(s, 'custom-presentation');
  C.assign(s, 'children', 'custom-presentation', C.date(7), 'Пример'); H.sync(s);
  const t = H.lessonTask(s, 'child', 'custom-presentation', 'story'), original = t.instructions;
  const draft = s.drafts.find(d => d.id === 'custom-presentation');
  C.saveLesson(s, draft.id, 'story', { ...draft.lessons[0], home: 'Совсем другая практика' });
  C.publish(s, draft.id); H.sync(s);
  assert.equal(t.instructions, original);
  assert.equal(t.source.revision, 1);
});

test('files are persisted with content, validated and kept across resubmissions', () => {
  const s = seed(), t = first(s), f = file('sample');
  const a = H.submit(s, t.id, 'child', { ...answer(), files: [f] });
  H.review(s, t.id, t.groupId, a.id, 'revision', 'Повтори с другим примером.');
  H.saveDraft(s, t.id, 'child', { ...answer(), files: [] });
  assert.equal(a.files[0].data, f.data);
  const restored = JSON.parse(JSON.stringify(s));
  assert.equal(H.valid(restored), true);
  assert.equal(H.content(H.get(restored, t.id)).files.length, 0);
  assert.equal(H.latest(H.get(restored, t.id)).files.length, 1);
  for (const invalid of [{ ...f, type: 'text/html' }, { ...f, size: 4 }, { ...f, name: 'bad.svg' }, { ...f, data: 'javascript:alert(1)' }, { ...f, data: f.data + '!' }]) assert.equal(H.validFile(invalid), false);
});

test('attachment budget rejects oversized changes without erasing submitted work', () => {
  const s = seed(), t = first(s), files = [file('large-a', 500 * 1024), file('large-b', 500 * 1024)];
  const a = H.submit(s, t.id, 'child', { ...answer(), files });
  H.review(s, t.id, t.groupId, a.id, 'revision', 'Добавь описание, файлы можно оставить.');
  H.submit(s, t.id, 'child', { ...answer('Новое описание'), files });
  const b = H.latest(t); H.review(s, t.id, t.groupId, b.id, 'revision', 'Теперь отправь короткий ответ.');
  const before = JSON.stringify(t);
  assert.throws(() => H.saveDraft(s, t.id, 'child', { ...answer(), files }));
  assert.equal(JSON.stringify(t), before);
  assert.equal(H.valid(s), true);
});

test('in-class completion is a teacher observation and stays separate from online submission', () => {
  const s = seed(), t = first(s);
  assert.throws(() => H.inClass(s, t.id, 'seniors', 'Проверка'));
  const a = H.inClass(s, t.id, 'children', 'Выполнил с памяткой на занятии.');
  assert.equal(a.actorId, 'teacher');
  assert.equal(a.support, 'in-class');
  assert.equal(H.status(s, t), 'accepted');
  assert.throws(() => H.inClass(s, t.id, 'children', 'Повторная отметка'));
  assert.equal(H.stats(s).accepted, 1);
});

test('invalid restored homework is rejected and review requires an explicit comment', () => {
  const s = seed(), t = first(s), a = H.submit(s, t.id, 'child', answer());
  assert.throws(() => H.review(s, t.id, t.groupId, a.id, 'accepted', ' '));
  assert.equal(H.status(s, t), 'submitted');
  const broken = C.clone(s); broken.homework.tasks[0].attempts[0].files = [{ type: 'text/html' }];
  assert.equal(H.valid(broken), false);
  assert.equal(H.valid({ ...s, homework: { version: 1, tasks: [null] } }), false);
});

test('homework cards render for catalog lessons, studio tasks and scheduled meetings', () => {
  const s = seed();
  const [studio] = H.assign(s, { groupId: 'children', title: 'Рисунок солнца', instructions: 'Нарисуй солнце и расскажи о нём.' });
  s.sessions[0].home = 'Повтори после очной встречи.'; H.sync(s);
  const meeting = H.list(s, 'child').find(t => t.source.kind === 'session');
  const ui = window.EducationHomework.create({ H, C, state: () => s, esc: v => String(v ?? ''), chrome: () => '', heading: (...args) => args.join(' '), options: () => '', metric: (...args) => args.join(' '), dateLabel: v => v, commit: change => change(s), go: () => {}, refresh: () => {} });
  for (const t of [first(s), studio, meeting]) {
    assert.match(ui.render('homework-task', t.id, 'child'), /Моя работа/);
    assert.match(ui.render('homework-review', t.id), /Поддержка на занятии/);
    assert.equal(ui.render('homework-task', t.id).includes('undefined'), false);
  }
  H.inClass(s, studio.id, 'children', 'Создал работу на встрече с памяткой.');
  assert.match(ui.render('homework-task', studio.id), /Отметка педагога на занятии/);
  assert.match(ui.render('homework-review', studio.id), /Принято/);
  assert.match(ui.render('homework-lesson', 'senior-basic', 'pc-start'), /Кто выполняет задание/);
  assert.match(ui.meetingPanel(s.sessions[0].id, 'child'), /Домашняя практика/);
  assert.match(ui.directorPanel(), /Ожидают проверки/);
});

test('first direct homework visit persists task IDs before interaction and survives reload', () => {
  const vm = require('node:vm'), fs = require('node:fs'), path = require('node:path');
  const stored = new Map();
  const scripts = ['../data.js', '../education/catalog.js', '../education/organization.js', '../education/workspace-core.js', '../education/admission-core.js', '../education/admission.js', '../education/schedule.js', '../education/homework-core.js', '../education/homework.js', '../education/showcase-data.js', '../education/showcase-core.js', '../education/showcase.js', '../education/workspace.js'];
  const boot = () => {
    const context = vm.createContext({ window: { addEventListener() {} }, document: { addEventListener() {} }, localStorage: { getItem: k => stored.get(k) || null, setItem: (k, v) => stored.set(k, v) } });
    for (const name of scripts) vm.runInContext(fs.readFileSync(path.join(__dirname, name), 'utf8'), context);
    return context;
  };
  const firstBoot = boot(), key = 'ponyatno-education-workspace-v1';
  const initial = JSON.parse(stored.get(key)), id = initial.homework.tasks[0].id;
  assert.match(firstBoot.window.EducationWorkspace.render('homework-task', id, 'child'), /Моя работа/);
  const reloaded = boot(), restored = JSON.parse(stored.get(key));
  assert.equal(restored.homework.tasks[0].id, id);
  assert.deepEqual(restored.marks, initial.marks);
  assert.match(reloaded.window.EducationWorkspace.render('homework-task', id, 'child'), /Моя работа/);
});
