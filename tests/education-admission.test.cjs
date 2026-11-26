const { test } = require('node:test');
const assert = require('node:assert/strict');
global.window = {};
require('../education/catalog.js');
require('../education/organization.js');
require('../education/workspace-core.js');
require('../education/admission-core.js');
const C = window.EducationWorkspaceCore.create(window.EducationCatalog);
const A = window.EducationAdmissionCore.create(C, window.EducationOrganization, window.EducationCatalog);
const fresh = () => A.upgrade(C.upgrade(C.seed()));
const apply = (s, name = 'Участник 06', overrides = {}) => A.request(s, { token: name, demo: 'on', programId: 'family', learnerId: 'new', name, audience: 'junior', preferredGroupId: 'children', guardianId: 'parent', note: 'Учебный пример.', ...overrides });
const resize = (s, count) => A.saveGroup(s, 'children', { ...C.group(s, 'children'), capacity: count });
const anotherGroup = s => A.saveGroup(s, '', { name: 'Вечерняя группа', programId: 'family', audience: 'junior', teacher: 'Педагог 02', room: 'Кабинет 2', capacity: 4, initialCourseId: 'junior-web', open: 'on' });

test('migration preserves existing progress, assignments and course drafts', () => {
  const old = C.upgrade(C.seed());
  const before = JSON.stringify({ marks: old.marks, assignments: old.assignments, drafts: old.drafts });
  assert.equal(A.valid(old), true);
  const s = A.upgrade(old);
  assert.equal(JSON.stringify({ marks: s.marks, assignments: s.assignments, drafts: s.drafts }), before);
  assert.equal(s.learners.length, 3);
  assert.equal(s.admission.applications.length, 2);
  assert.equal(A.upgrade(s).admission.applications.length, 2);
  assert.equal(C.valid(s) && A.valid(s), true);
});

test('a pending application is not counted as an enrolled learner', () => {
  const s = fresh(), a = apply(s);
  assert.equal(a.status, 'new');
  assert.equal(s.learners.length, 3);
  assert.equal(A.groupStats(s, 'children').count, 1);
  assert.equal(C.programStats(s, ['children', 'families']).participants, 2);
  assert.equal(A.stats(s).new, 3);
  assert.equal(A.request(s, { token: a.token }).id, a.id, 'same submission is idempotent');
  assert.equal(s.admission.applications.length, 3);
});

test('enrollment creates one learner, initial course and separate family notifications', () => {
  const s = fresh(), a = apply(s), result = A.enroll(s, a.id, 'children');
  assert.equal(result.enrolled, true);
  assert.equal(s.learners.length, 4);
  assert.equal(C.assigned(s, result.learner.id)[0].courseId, 'junior-web');
  assert.equal(C.childrenOf(s, 'parent').length, 2);
  assert.equal(A.groupStats(s, 'children').free, 0);
  assert.equal(C.notices(s, result.learner.id)[0].applicationId, a.id);
  assert.equal(C.notices(s, 'parent')[0].applicationId, a.id);
  const before = JSON.stringify(s);
  assert.equal(A.enroll(s, a.id, 'children').repeated, true);
  assert.equal(JSON.stringify(s), before);
  assert.equal(C.valid(s) && A.valid(s), true);
});

test('full groups put applications on a waitlist without creating extra learners', () => {
  const s = fresh();
  A.enroll(s, apply(s).id, 'children');
  const a = apply(s, 'Участник 07'), result = A.enroll(s, a.id, 'children');
  assert.equal(result.enrolled, false);
  assert.equal(result.full, true);
  assert.equal(a.status, 'waitlist');
  assert.equal(s.learners.length, 4);
  assert.equal(A.groupStats(s, 'children').count, 2);
  resize(s, 3);
  assert.equal(A.enroll(s, a.id, 'children').enrolled, true);
  assert.equal(s.learners.length, 5);
});

test('waitlisted applications are served in queue order', () => {
  const s = fresh();
  A.enroll(s, apply(s).id, 'children');
  const first = apply(s, 'Участник 07'), second = apply(s, 'Участник 08');
  A.enroll(s, first.id, 'children'); A.enroll(s, second.id, 'children');
  resize(s, 4);
  const before = JSON.stringify(s);
  assert.throws(() => A.enroll(s, second.id, 'children'), /Первым в листе/);
  assert.equal(JSON.stringify(s), before);
  A.enroll(s, first.id, 'children');
  assert.equal(A.enroll(s, second.id, 'children').enrolled, true);
  assert.equal(A.groupStats(s, 'children').count, 4);
});

test('age mismatch, invalid guardian, missing demo confirmation and duplicates are rejected', () => {
  const s = fresh(), before = JSON.stringify(s);
  assert.throws(() => apply(s, 'Не тот возраст', { audience: 'senior' }));
  assert.throws(() => apply(s, 'Не та группа', { preferredGroupId: 'seniors' }));
  assert.throws(() => apply(s, 'Нет взрослого', { guardianId: '' }));
  assert.throws(() => apply(s, 'Нет подтверждения', { demo: '' }));
  assert.equal(JSON.stringify(s), before);
  const a = apply(s);
  assert.throws(() => apply(s, 'Участник 06', { token: 'another-token' }), /уже есть заявка/);
  assert.throws(() => A.enroll(s, a.id, 'seniors'));
});

test('decline, withdrawal and reopening preserve history and do not remove learners', () => {
  const s = fresh(), a = apply(s);
  assert.throws(() => A.close(s, a.id, 'declined', ' '));
  A.close(s, a.id, 'declined', 'Нужна другая программа.');
  assert.equal(a.status, 'declined');
  A.reopen(s, a.id);
  assert.equal(a.status, 'review');
  A.close(s, a.id, 'withdrawn', 'Изменились планы.');
  assert.equal(a.history.length, 4);
  assert.equal(s.learners.length, 3);
  A.reopen(s, a.id); A.enroll(s, a.id, 'children');
  assert.throws(() => A.close(s, a.id, 'withdrawn', 'Изменились планы.'));
});

test('coordinator responsibility and follow-up date are retained', () => {
  const s = fresh(), a = apply(s);
  A.handling(s, a.id, { owner: 'Координатор 02', followUp: C.date(3) });
  assert.equal(a.status, 'review');
  assert.equal(a.owner, 'Координатор 02');
  assert.equal(a.followUp, C.date(3));
  assert.throws(() => A.handling(s, a.id, { owner: 'Unknown', followUp: C.date(3) }));
});

test('an existing learner can join another compatible group without duplicate progress', () => {
  const s = fresh(), g = anotherGroup(s);
  const a = apply(s, 'Existing', { learnerId: 'child', preferredGroupId: g.id });
  A.enroll(s, a.id, g.id);
  assert.equal(s.learners.length, 3);
  assert.equal(C.isMember(s, 'child', 'children'), true);
  assert.equal(C.isMember(s, 'child', g.id), true);
  assert.equal(C.members(s, g.id).length, 1);
  assert.equal(C.assigned(s, 'child').length, 1);
  assert.deepEqual(C.progress(s, 'child'), { done: 1, total: 6 });
  assert.equal(C.programStats(s, ['children', g.id]).participants, 1);
  assert.equal(C.valid(s) && A.valid(s), true);
});

test('enrollment rejects overlapping meetings for an existing participant atomically', () => {
  const s = fresh(), g = anotherGroup(s), day = C.date(5);
  C.saveMeeting(s, '', { groupId: 'children', title: 'Первая встреча', date: day, time: '10:00', minutes: 60, teacher: 'Педагог 01', room: 'Кабинет 1' });
  C.saveMeeting(s, '', { groupId: g.id, title: 'Вторая встреча', date: day, time: '10:30', minutes: 60, teacher: 'Педагог 02', room: 'Кабинет 2' });
  const a = apply(s, 'Existing', { learnerId: 'child', preferredGroupId: g.id }), before = JSON.stringify(s);
  assert.throws(() => A.enroll(s, a.id, g.id), /пересекаются встречи/);
  assert.equal(JSON.stringify(s), before);
});

test('capacity cannot fall below enrollment and closed intake rejects direct requests', () => {
  const s = fresh(); A.enroll(s, apply(s).id, 'children');
  assert.throws(() => resize(s, 1));
  A.saveGroup(s, 'children', { ...C.group(s, 'children'), open: false });
  assert.throws(() => apply(s, 'Участник 07'));
  assert.ok(apply(s, 'Участник 07', { preferredGroupId: 'any' }));
});

test('initial author course retains its assigned published version', () => {
  const s = fresh(); C.publish(s, 'custom-presentation');
  A.saveGroup(s, 'children', { ...C.group(s, 'children'), initialCourseId: 'custom-presentation' });
  const result = A.enroll(s, apply(s).id, 'children'), id = result.learner.id;
  assert.equal(C.course(s, 'custom-presentation', id).revision, 1);
  C.saveLesson(s, 'custom-presentation', 'story', { ...s.drafts[0].lessons[0], text: 'Уточнённый материал.' });
  C.publish(s, 'custom-presentation');
  assert.equal(C.course(s, 'custom-presentation', id).revision, 1);
  assert.equal(C.assigned(s, 'child')[0].courseId, 'junior-web');
});

test('stored admission state restores and validates references', () => {
  const s = fresh(), a = apply(s); A.enroll(s, a.id, 'children');
  const restored = A.upgrade(C.upgrade(JSON.parse(JSON.stringify(s))));
  assert.equal(C.valid(restored) && A.valid(restored), true);
  assert.equal(A.get(restored, a.id).status, 'enrolled');
  restored.admission.applications.find(x => x.id === a.id).learnerId = 'missing';
  assert.equal(A.valid(restored), false);
});

test('newly enrolled children receive schedule notices through their linked adult', () => {
  const s = fresh(), a = apply(s), result = A.enroll(s, a.id, 'children');
  const m = C.saveMeeting(s, '', { groupId: 'children', title: 'Встреча новой группы', date: C.date(6), time: '10:00', minutes: 60, teacher: 'Педагог 01', room: 'Кабинет 1' });
  assert.ok(C.notices(s, result.learner.id).some(n => n.sessionId === m.id));
  assert.ok(C.notices(s, 'parent').some(n => n.sessionId === m.id && n.relatedLearnerId === result.learner.id));
  C.attendance(s, m.id, result.learner.id, 'present');
  assert.equal(m.attendance[result.learner.id], 'present');
});

test('all six center directions are available for applications', () => {
  const s = fresh();
  const directions = ['creative-studio', 'engineering', 'logic-chess', 'music-psychology', 'english', 'school-preparation'];
  for (const id of directions) {
    const p = A.program(id), g = A.programGroups(s, id)[0];
    assert.equal(p.kind, 'studio');
    assert.ok(g);
    const a = apply(s, 'Учебный участник ' + id, { programId: id, audience: g.audience, preferredGroupId: g.id, token: id });
    assert.equal(a.programId, id);
  }
});

test('center classes enroll without assigning unrelated digital courses', () => {
  const s = fresh(), g = A.programGroups(s, 'creative-studio')[0];
  const a = apply(s, 'Участник творческой студии', { programId: 'creative-studio', audience: g.audience, preferredGroupId: g.id });
  const result = A.enroll(s, a.id, g.id);
  assert.equal(result.enrolled, true);
  assert.equal(C.assigned(s, result.learner.id).length, 0);
  assert.equal(A.groupStats(s, g.id).count, 1);
  assert.equal(C.childrenOf(s, 'parent').some(p => p.id === result.learner.id), true);
  assert.equal(C.valid(s) && A.valid(s), true);
});

test('center groups can attach a published author course or keep classroom-only format', () => {
  const s = fresh(), g = A.programGroups(s, 'creative-studio')[0];
  A.saveGroup(s, g.id, { ...g, initialCourseId: '' });
  assert.throws(() => A.saveGroup(s, g.id, { ...g, initialCourseId: 'junior-web' }), /авторские материалы/);
  C.publish(s, 'custom-presentation');
  A.saveGroup(s, g.id, { ...g, initialCourseId: 'custom-presentation' });
  const a = apply(s, 'Участник авторской программы', { programId: 'creative-studio', audience: g.audience, preferredGroupId: g.id });
  const result = A.enroll(s, a.id, g.id);
  assert.equal(C.assigned(s, result.learner.id)[0].snapshot.revision, 1);
});
