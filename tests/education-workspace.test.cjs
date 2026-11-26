const { test } = require('node:test');
const assert = require('node:assert/strict');
global.window = {};
require('../education/catalog.js');
require('../education/workspace-core.js');
const core = window.EducationWorkspaceCore.create(window.EducationCatalog);

test('a completed lesson updates only its learner, once', () => {
  const s = core.seed();
  assert.equal(core.complete(s, 'child', 'junior-web', '1'), true);
  assert.equal(core.complete(s, 'child', 'junior-web', '1'), false);
  assert.deepEqual(core.progress(s, 'child'), { done: 2, total: 6 });
  assert.deepEqual(core.progress(s, 'parent'), { done: 0, total: 6 });
  assert.deepEqual(core.progress(s, 'senior'), { done: 1, total: 8 });
  assert.equal(core.stats(s).done, 3);
  assert.throws(() => core.complete(s, 'parent', 'junior-web', '1'));
  assert.throws(() => core.complete(s, 'child', 'junior-web', '999'));
});

test('publication is required for assignment and is restricted to the right group', () => {
  const s = core.seed();
  assert.throws(() => core.assign(s, 'children', 'custom-presentation', core.date(7), ''));
  core.publish(s, 'custom-presentation');
  assert.throws(() => core.assign(s, 'seniors', 'custom-presentation', core.date(7), ''));
  assert.equal(core.assign(s, 'children', 'custom-presentation', core.date(7), 'Вместе со взрослым'), 1);
  assert.throws(() => core.assign(s, 'children', 'custom-presentation', core.date(7), ''));
  assert.deepEqual(core.progress(s, 'child'), { done: 1, total: 8 });
});

test('assigned course content is preserved across draft edits and republication', () => {
  const s = core.seed();
  core.publish(s, 'custom-presentation');
  core.assign(s, 'children', 'custom-presentation', core.date(7), '');
  const draft = s.drafts[0];
  const oldText = draft.lessons[0].text;
  core.saveLesson(s, draft.id, 'story', { ...draft.lessons[0], text: 'Новое объяснение.' });
  core.publish(s, draft.id);
  assert.equal(core.available(s).find(c => c.id === draft.id).revision, 2);
  assert.equal(core.course(s, draft.id, 'child').revision, 1);
  assert.equal(core.course(s, draft.id, 'child').lessons[0].text, oldText);
  core.complete(s, 'child', draft.id, 'story');
  assert.deepEqual(core.progress(s, 'child'), { done: 2, total: 8 });
});

test('reordering draft lessons preserves stable lesson IDs and assigned progress', () => {
  const s = core.seed();
  core.publish(s, 'custom-presentation');
  core.assign(s, 'children', 'custom-presentation', core.date(7), '');
  core.complete(s, 'child', 'custom-presentation', 'story');
  core.moveLesson(s, 'custom-presentation', 'story', 1);
  assert.equal(s.drafts[0].lessons[0].id, 'slides');
  assert.equal(core.course(s, 'custom-presentation', 'child').lessons[0].id, 'story');
  assert.equal(core.isDone(s, 'child', 'custom-presentation', 'slides'), false);
});

test('attendance updates totals and cannot mark a learner outside a group', () => {
  const s = core.seed();
  core.attendance(s, 'meeting-child', 'child', 'absent');
  assert.equal(core.stats(s).present, 0);
  assert.equal(core.stats(s).absent, 1);
  core.attendance(s, 'meeting-child', 'child', 'excused');
  assert.equal(core.stats(s).absent, 0);
  assert.equal(core.stats(s).excused, 1);
  core.attendance(s, 'meeting-child', 'child', '');
  assert.equal(core.stats(s).excused, 0);
  assert.throws(() => core.attendance(s, 'meeting-child', 'senior', 'present'));
});

test('a new course needs complete content and valid duration before publishing', () => {
  const s = core.seed();
  const d = core.createDraft(s, { title: 'Новая программа', group: 'parents', description: 'Практика общения' });
  assert.throws(() => core.publish(s, d.id));
  const fields = { title: 'Первое занятие', goal: 'Попробовать', text: 'Объяснение', practice: 'Практика', home: '', minutes: 20 };
  assert.throws(() => core.saveLesson(s, d.id, '', { ...fields, minutes: -1 }));
  assert.throws(() => core.saveLesson(s, d.id, '', { ...fields, practice: ' ' }));
  const l = core.saveLesson(s, d.id, '', fields);
  assert.ok(l.id);
  assert.equal(core.publish(s, d.id).lessons.length, 1);
  assert.equal(core.assign(s, 'families', d.id, core.date(7), ''), 1);
  assert.throws(() => core.assign(s, 'families', 'parents-family', core.date(-1), ''));
});

test('stored state restores snapshots, assignments, notes and marks', () => {
  const s = core.seed();
  core.publish(s, 'custom-presentation');
  core.assign(s, 'children', 'custom-presentation', core.date(7), 'Сохранённое задание');
  core.complete(s, 'child', 'custom-presentation', 'story');
  const restored = JSON.parse(JSON.stringify(s));
  assert.equal(core.valid(restored), true);
  assert.deepEqual(core.progress(restored, 'child'), { done: 2, total: 8 });
  assert.equal(core.course(restored, 'custom-presentation', 'child').revision, 1);
  assert.equal(core.valid({ version: 1 }), false);
  restored.assignments[0].learnerId = 'missing';
  assert.equal(core.valid(restored), false);
});

test('study routes require an assigned, existing lesson', () => {
  const s = core.seed();
  assert.equal(core.study(s, 'child', 'junior-web', '1').index, 1);
  for (const index of ['-1', '999', '1x', '']) assert.equal(core.study(s, 'child', 'junior-web', index), null);
  assert.equal(core.study(s, 'parent', 'junior-web', '1'), null);
});
