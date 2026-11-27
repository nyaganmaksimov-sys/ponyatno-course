const { test } = require('node:test');
const assert = require('node:assert/strict');
global.window = {};
for (const file of ['catalog', 'organization', 'workspace-core', 'admission-core', 'homework-core', 'showcase-data', 'showcase-core', 'showcase']) require('../education/' + file + '.js');
require('../center/store.js');
const C = window.EducationWorkspaceCore.create(window.EducationCatalog);
const A = window.EducationAdmissionCore.create(C, window.EducationOrganization, window.EducationCatalog);
const H = window.EducationHomeworkCore.create(C);
const S = window.EducationShowcaseCore.create(C, A, H);
const seed = () => H.upgrade(A.upgrade(C.upgrade(C.seed())));
function memory(initial) {
  const data = new Map(initial ? [['ponyatno-education-workspace-v1', JSON.stringify(initial)]] : []);
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), data };
}
const publicValues = (changes = {}) => ({ token: 'public-test', programId: 'creative-studio', audience: 'junior', name: 'Учебный участник сайта', contactName: 'Учебный взрослый', contact: 'Демо-контакт 01', demo: 'on', ...changes });

test('showcase adds eight valid cases, preserves existing work and uses six complete introductory courses', () => {
  const s = seed(), previousMarks = C.clone(s.marks), previousTasks = C.clone(s.homework.tasks), previousApplications = C.clone(s.admission.applications);
  const result = S.install(s);
  assert.equal(result.entries.length, 8);
  assert.deepEqual(s.marks.slice(0, previousMarks.length), previousMarks);
  assert.deepEqual(s.homework.tasks.slice(0, previousTasks.length), previousTasks);
  assert.deepEqual(s.admission.applications.slice(0, previousApplications.length), previousApplications);
  assert.ok(C.valid(s) && A.valid(s) && H.valid(s));
  assert.equal(result.entries.filter(e => C.course(s, e.courseId, e.learnerId).custom).length, 6);
  for (const e of result.entries) {
    const c = C.course(s, e.courseId, e.learnerId);
    if (c.custom) { assert.equal(c.lessons.length, 3); assert.ok(c.lessons.every(l => l.text && l.practice && l.home)); }
    assert.equal(A.get(s, e.applicationId).status, 'enrolled');
    assert.equal(C.members(s, e.groupId).length, 1);
    assert.equal(s.sessions.filter(m => m.groupId === e.groupId && m.status === 'completed').length, 1);
    assert.equal(s.sessions.filter(m => m.groupId === e.groupId && m.status === 'planned').length, 1);
  }
  const stats = H.stats(s);
  for (const status of ['draft', 'submitted', 'revision', 'accepted']) assert.ok(stats[status] > 0);
});

test('reopening showcase never resets edits, checked homework or application history', () => {
  const s = seed(); S.install(s);
  const e = S.entry(s, 'creative'), t = H.get(s, e.taskId);
  H.review(s, t.id, e.groupId, H.latest(t).id, 'accepted', 'Проверено во время показа.');
  const snapshot = JSON.stringify(s);
  assert.strictEqual(S.install(s), s.showcase);
  assert.equal(JSON.stringify(s), snapshot);
  const restored = H.upgrade(A.upgrade(C.upgrade(JSON.parse(snapshot))));
  assert.equal(S.installed(restored), true);
  assert.equal(H.status(restored, H.get(restored, e.taskId)), 'accepted');
});

test('showcase renders every case and describes own data center as a future stage', () => {
  const s = seed(); S.install(s);
  const ui = window.EducationShowcase.create({ S, C, H, state: () => s, esc: v => String(v ?? ''), chrome: () => '', heading: (...v) => v.join(' '), metric: (...v) => v.join(' '), commit: fn => fn(s), go() {} });
  for (const e of s.showcase.entries) {
    const html = ui.detail(e.id);
    assert.match(html, /Проверить работу/);
    assert.match(html, /Подать заявку с сайта центра/);
    assert.ok(!html.includes('undefined'));
  }
  assert.match(ui.infrastructure(), /Планируется после демо/);
  assert.match(ui.infrastructure(), /GitHub Pages/);
  assert.match(ui.landing(), /Публичный сайт центра/);
});

test('public-site request reaches the shared coordinator queue without creating an enrolled learner', () => {
  const storage = memory(seed()), store = window.CenterIntake.create(storage), before = store.load();
  const a = store.request(publicValues());
  const s = store.load();
  assert.equal(a.source, 'public-site');
  assert.equal(a.contactName, 'Учебный взрослый');
  assert.equal(a.guardianId, '');
  assert.equal(s.learners.length, before.learners.length);
  assert.deepEqual(s.marks, before.marks);
  assert.equal(A.get(s, a.id).status, 'new');
  assert.equal(A.stats(s).new, A.stats(before).new + 1);
  assert.equal(store.receipts()[0].id, a.id);
  assert.equal(window.CenterIntake.create(storage).get(a.id).id, a.id);
  assert.ok(C.valid(s) && A.valid(s) && H.valid(s));
});

test('public child intake needs a confirmed adult profile before enrollment, then obtains the assigned course and homework', () => {
  const s = seed(); S.install(s);
  const e = S.entry(s, 'creative'), guardian = S.entry(s, 'family');
  const storage = memory(s), store = window.CenterIntake.create(storage), a = store.request(publicValues());
  const current = store.load(), size = current.learners.length;
  assert.throws(() => A.enroll(current, a.id, e.groupId), /сопровождающего/);
  assert.equal(current.learners.length, size);
  assert.throws(() => A.linkGuardian(current, a.id, 'child'));
  A.linkGuardian(current, a.id, guardian.learnerId);
  const enrolled = A.enroll(current, a.id, e.groupId); H.sync(current);
  assert.equal(enrolled.enrolled, true);
  assert.equal(C.guardianId(current, enrolled.learner.id), guardian.learnerId);
  assert.equal(C.assigned(current, enrolled.learner.id).length, 1);
  assert.equal(H.list(current, enrolled.learner.id).length, 3);
  storage.setItem(store.key, JSON.stringify(current));
  assert.equal(store.get(a.id).status, 'enrolled');
  assert.ok(A.valid(current) && C.valid(current) && H.valid(current));
});

test('public adult request can be processed without a guardian or extra profiles', () => {
  const s = seed(), store = window.CenterIntake.create(memory(s));
  const a = store.request(publicValues({ programId: 'senior', audience: 'senior', name: 'Учебный взрослый участник' }));
  const current = store.load(), before = current.learners.length;
  const result = A.enroll(current, a.id, 'seniors');
  assert.equal(result.enrolled, true);
  assert.equal(current.learners.length, before + 1);
  assert.equal(result.learner.guardianId, '');
});

test('duplicate submissions are idempotent and invalid contact or missing demo confirmation never changes storage', () => {
  const storage = memory(seed()), store = window.CenterIntake.create(storage);
  const first = store.request(publicValues());
  assert.equal(store.request(publicValues()).id, first.id);
  const before = storage.getItem(store.key);
  for (const changes of [{ token:'new-1', demo:'' }, { token:'new-2', contact:'' }, { token:'new-3', contactName:'a' }, { token:'new-4', audience:'unknown' }]) assert.throws(() => store.request(publicValues(changes)));
  assert.equal(storage.getItem(store.key), before);
});

test('a storage failure cannot produce a successful public-site receipt or overwrite saved progress', () => {
  const storage = memory(seed()), before = storage.getItem('ponyatno-education-workspace-v1');
  storage.setItem = () => { throw new Error('Хранилище недоступно.'); };
  const store = window.CenterIntake.create(storage);
  assert.throws(() => store.request(publicValues()), /Хранилище/);
  assert.equal(storage.getItem(store.key), before);
  assert.deepEqual(store.receipts(), []);
});

test('every displayed public-site direction has a defined intake audience', () => {
  for (const p of window.EducationOrganization.programs.filter(p => p.kind === 'studio' || ['family','senior'].includes(p.id))) assert.ok(A.allowed(p.id).length, p.id);
});
