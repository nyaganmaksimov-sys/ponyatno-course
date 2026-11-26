const { test } = require('node:test');
const assert = require('node:assert/strict');
global.window = {};
require('../education/catalog.js');
require('../education/workspace-core.js');
const core = window.EducationWorkspaceCore.create(window.EducationCatalog);
const fresh = () => core.upgrade(core.seed());
const values = overrides => ({ groupId: 'children', title: 'Новая учебная встреча', date: core.date(4), time: '10:00', minutes: 45, teacher: 'Педагог 01', room: 'Кабинет 1', agenda: 'Разбираем материал.', home: 'Повторить дома.', ...overrides });

test('creating and moving a meeting notifies its learner and linked parent', () => {
  const s = fresh(), m = core.saveMeeting(s, '', values());
  assert.equal(core.notices(s, 'child').length, 1);
  assert.equal(core.notices(s, 'parent').length, 1);
  assert.equal(core.notices(s, 'senior').length, 0);
  core.saveMeeting(s, m.id, values({ time: '12:00' }));
  assert.equal(core.notices(s, 'parent').length, 2);
  assert.match(core.notices(s, 'parent')[0].message, /перенесена/);
  assert.match(core.notices(s, 'parent')[0].message, /10:00.*12:00/);
  assert.equal(core.valid(s), true);
});

test('a group, teacher or physical room cannot be double booked', () => {
  const s = fresh();
  core.saveMeeting(s, '', values());
  const original = JSON.stringify(s);
  assert.throws(() => core.saveMeeting(s, '', values({ time: '10:30', teacher: 'Педагог 02', room: 'Кабинет 2' })), /У группы/);
  assert.throws(() => core.saveMeeting(s, '', values({ groupId: 'seniors', time: '10:30', room: 'Кабинет 2' })), /Преподаватель/);
  assert.throws(() => core.saveMeeting(s, '', values({ groupId: 'families', teacher: 'Педагог 02', time: '10:30' })), /Кабинет/);
  assert.equal(JSON.stringify(s), original, 'rejected writes leave the schedule, events and notifications intact');
});

test('back-to-back meetings, separate dates and separate online teachers are permitted', () => {
  const s = fresh();
  core.saveMeeting(s, '', values());
  assert.ok(core.saveMeeting(s, '', values({ time: '10:45' })));
  assert.ok(core.saveMeeting(s, '', values({ date: core.date(5) })));
  assert.ok(core.saveMeeting(s, '', values({ groupId: 'families', teacher: 'Педагог 02', room: 'Онлайн', time: '13:00' })));
  assert.ok(core.saveMeeting(s, '', values({ groupId: 'seniors', teacher: 'Педагог 01', room: 'Онлайн', time: '13:00' })));
});

test('cancellation preserves the meeting, frees its slot and is reversible', () => {
  const s = fresh(), m = core.saveMeeting(s, '', values());
  core.cancelMeeting(s, m.id, 'Перенос по просьбе группы');
  assert.equal(s.sessions.find(x => x.id === m.id).status, 'cancelled');
  assert.match(core.notices(s, 'child')[0].message, /Перенос по просьбе группы/);
  assert.throws(() => core.attendance(s, m.id, 'child', 'present'));
  core.restoreMeeting(s, m.id);
  assert.equal(s.sessions.find(x => x.id === m.id).status, 'planned');
  assert.match(core.notices(s, 'parent')[0].message, /восстановлена/);
});

test('a cancelled meeting cannot be restored over a newly occupied slot', () => {
  const s = fresh(), m = core.saveMeeting(s, '', values());
  core.cancelMeeting(s, m.id, 'Нет возможности провести');
  core.saveMeeting(s, '', values({ title: 'Другая встреча' }));
  const before = JSON.stringify(s);
  assert.throws(() => core.restoreMeeting(s, m.id), /Восстановить/);
  assert.equal(JSON.stringify(s), before);
});

test('attendance and completed meetings are preserved when editing the schedule', () => {
  const s = fresh(), m = core.saveMeeting(s, '', values());
  core.attendance(s, m.id, 'child', 'present');
  assert.throws(() => core.saveMeeting(s, m.id, values({ time: '12:00' })), /уже есть отметки/);
  assert.throws(() => core.cancelMeeting(s, m.id, 'Отменяем'), /отметки посещения/);
  core.saveMeeting(s, m.id, values({ home: 'Уточнённая практика для дома.' }));
  core.finishMeeting(s, m.id);
  assert.equal(s.sessions.find(x => x.id === m.id).attendance.child, 'present');
  assert.throws(() => core.saveMeeting(s, m.id, values({ time: '12:00' })));
  assert.throws(() => core.cancelMeeting(s, m.id, 'Отменяем'));
  assert.equal(core.programStats(s, ['children']).minutes, 45);
});

test('saving unchanged details does not produce duplicate notices', () => {
  const s = fresh(), m = core.saveMeeting(s, '', values());
  const before = JSON.stringify(s);
  core.saveMeeting(s, m.id, values());
  assert.equal(JSON.stringify(s), before);
});

test('reading notifications affects only the selected recipient', () => {
  const s = fresh(), m = core.saveMeeting(s, '', values());
  const parentNotice = core.notices(s, 'parent')[0];
  assert.throws(() => core.readNotice(s, 'child', parentNotice.id));
  core.readNotice(s, 'parent', parentNotice.id);
  assert.ok(parentNotice.readAt);
  assert.equal(core.notices(s, 'child')[0].readAt, '');
  core.saveMeeting(s, m.id, values({ time: '12:00' }));
  core.readNotice(s, 'parent');
  assert.equal(core.notices(s, 'parent').filter(n => !n.readAt).length, 0);
});

test('existing v0.6 state is upgraded without losing lessons, drafts or assignments', () => {
  const old = core.seed(); delete old.notices;
  const expected = JSON.stringify({ marks: old.marks, drafts: old.drafts, assignments: old.assignments });
  assert.equal(core.valid(old), true);
  const s = core.upgrade(old);
  assert.equal(JSON.stringify({ marks: s.marks, drafts: s.drafts, assignments: s.assignments }), expected);
  assert.equal(s.sessions[0].teacher, 'Педагог 01');
  assert.equal(s.sessions[0].status, 'planned');
  assert.deepEqual(s.notices, []);
  const restored = JSON.parse(JSON.stringify(s));
  assert.equal(core.valid(restored), true);
});

test('calendar validation rejects impossible dates, midnight overflow and invalid resources', () => {
  const s = fresh();
  assert.equal(core.validDate('2026-02-30'), false);
  assert.equal(core.weekStart('2026-11-26'), '2026-11-23');
  assert.equal(core.shiftDate('2026-12-31', 1), '2027-01-01');
  for (const override of [{ date: '2026-02-30' }, { time: '24:00' }, { minutes: 0 }, { time: '23:30', minutes: 60 }, { teacher: 'Нет такого преподавателя' }, { room: 'Нет такого кабинета' }]) assert.throws(() => core.saveMeeting(s, '', values(override)));
});

test('program reporting counts unique people and separates visits from learning marks', () => {
  const s = fresh();
  const initial = core.programStats(s, ['children', 'families', 'children']);
  assert.equal(initial.participants, 2);
  assert.equal(initial.present, 1);
  assert.equal(initial.done, 1);
  assert.equal(initial.total, 12);
  const m = core.saveMeeting(s, '', values());
  core.attendance(s, m.id, 'child', 'present');
  core.finishMeeting(s, m.id);
  const result = core.programStats(s, ['children', 'families']);
  assert.equal(result.participants, 2);
  assert.equal(result.present, 2);
  assert.equal(result.completed, 1);
  assert.equal(result.done, 1);
  assert.equal(result.minutes, 45);
});
