/* Admission workflow for the shared, fictional browser-local demonstration. */
(() => {
  'use strict';
  const uid = prefix => prefix + '-' + (globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2));
  const clean = (value, max = 500) => String(value ?? '').trim().slice(0, max);
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const statuses = { new: 'Новая', review: 'На рассмотрении', waitlist: 'Лист ожидания', enrolled: 'Зачислена', declined: 'Отклонена', withdrawn: 'Отозвана' };
  const activeStatuses = ['new', 'review', 'waitlist', 'enrolled'];
  function create(C, organization, catalog) {
    const program = id => organization.programs.find(p => p.id === id);
    const programs = () => organization.programs;
    const allowed = id => program(id)?.audiences || [...new Set((program(id)?.groupIds || []).map(gid => ({ children: 'junior', families: 'parents', seniors: 'senior' })[gid]).filter(Boolean))];
    const groupProgram = (s, g) => g.programId || organization.programs.find(p => p.groupIds.includes(g.id))?.id;
    const programGroups = (s, id) => s.groups.filter(g => groupProgram(s, g) === id);
    const people = (s, id) => C.members(s, id);
    const groupStats = (s, id) => {
      const g = C.group(s, id), count = people(s, id).length;
      return { count, capacity: g?.capacity || 8, free: Math.max(0, (g?.capacity || 8) - count) };
    };
    const get = (s, id) => s.admission?.applications.find(a => a.id === id);
    const number = a => 'З-' + String(a.sequence).padStart(4, '0');
    const audience = (s, p) => p.audience || C.group(s, p.groupId)?.audience;
    const isMinor = id => ['preschool', 'junior', 'teen'].includes(id);
    const defaultCourse = (s, id) => C.available(s).find(c => c.group === id)?.id || '';
    function upgrade(s) {
      const result = C.clone(s);
      for (const p of programs()) {
        if (p.seedGroup && !result.groups.some(g => g.id === p.seedGroup.id)) result.groups.push({ ...C.clone(p.seedGroup), programId: p.id, open: true, initialCourseId: '' });
      }
      for (const g of result.groups) {
        g.programId ||= groupProgram(result, g);
        g.capacity ??= ({ children: 2, families: 6, seniors: 4 })[g.id] || 8;
        g.open ??= true;
        g.initialCourseId ??= program(g.programId)?.kind === 'studio' ? '' : ({ children: 'junior-web', families: 'parents-digital', seniors: 'senior-fraud' })[g.id] || defaultCourse(result, g.audience);
      }
      for (const p of result.learners) p.audience ||= C.group(result, p.groupId)?.audience;
      if (!result.admission) {
        result.admission = { version: 1, applications: [] };
        const now = new Date().toISOString();
        for (const [i, name, pid, aid, gid, guardianId] of [
          [1, 'Участник 04', 'family', 'junior', 'children', 'parent'],
          [2, 'Участник 05', 'senior', 'senior', 'seniors', '']
        ]) result.admission.applications.push({ id: 'application-example-' + i, sequence: i, token: 'example-' + i, name, audience: aid, programId: pid, preferredGroupId: gid, groupId: '', learnerId: '', guardianId, note: 'Демонстрационная заявка для знакомства с кабинетом координатора.', status: 'new', owner: 'Координатор 01', followUp: C.date(2), decision: '', createdAt: now, updatedAt: now, history: [{ status: 'new', at: now, message: 'Учебная заявка получена.' }] });
      }
      return result;
    }
    function valid(s) {
      try {
        if (!s.admission) return true;
        if (s.admission.version !== 1 || !Array.isArray(s.admission.applications) || s.admission.applications.length > 2000) return false;
        if (!s.groups.every(g => Number.isInteger(g.capacity) && g.capacity >= 1 && g.capacity <= 40 && typeof g.open === 'boolean' && program(groupProgram(s, g)))) return false;
        const list = s.admission.applications;
        if (new Set(list.map(a => a.id)).size !== list.length || new Set(list.map(a => a.sequence)).size !== list.length) return false;
        if (!list.every(a => a && (a.source === undefined || a.source === 'public-site' && typeof a.contactName === 'string' && a.contactName.length >= 2 && a.contactName.length <= 80 && typeof a.contact === 'string' && a.contact.length >= 3 && a.contact.length <= 100))) return false;
        return list.every(a => a && typeof a.id === 'string' && Number.isInteger(a.sequence) && a.sequence > 0 && typeof a.name === 'string' && program(a.programId) && allowed(a.programId).includes(a.audience) && Object.hasOwn(statuses, a.status) && Number.isFinite(Date.parse(a.createdAt)) && C.validDate(a.followUp) && Array.isArray(a.history) && (!a.learnerId || C.learner(s, a.learnerId)) && (!a.guardianId || C.learner(s, a.guardianId)) && (!a.preferredGroupId || C.group(s, a.preferredGroupId)) && (!a.groupId || C.group(s, a.groupId)) && (a.status !== 'enrolled' || a.learnerId && a.groupId && C.isMember(s, a.learnerId, a.groupId)));
      } catch { return false; }
    }
    function notify(s, a, message) {
      if (!a.learnerId) return;
      const recipients = [...new Set([a.learnerId, C.guardianId(s, a.learnerId)].filter(id => C.learner(s, id)))];
      s.notices ||= [];
      for (const id of recipients) s.notices.unshift({ id: uid('notice'), learnerId: id, relatedLearnerId: a.learnerId, applicationId: a.id, message: number(a) + ' · ' + a.name + '. ' + message, at: new Date().toISOString(), readAt: '' });
      s.notices = s.notices.slice(0, 500);
    }
    function record(s, a, status, message) {
      a.status = status; a.updatedAt = new Date().toISOString();
      a.history.push({ status, at: a.updatedAt, message });
      a.history = a.history.slice(-30);
      C.log(s, number(a) + ': ' + message);
      notify(s, a, message);
    }
    function request(s, values) {
      check(s.admission, 'Обнови демонстрацию перед отправкой заявки.');
      const token = clean(values.token, 120);
      const repeated = s.admission.applications.find(a => token && a.token === token);
      if (repeated) return repeated;
      check(values.demo === 'on', 'Для демонстрации используй вымышленные данные и отметь подтверждение.');
      const pid = values.programId, existing = values.learnerId && values.learnerId !== 'new' ? C.learner(s, values.learnerId) : null;
      check(program(pid) && (!values.learnerId || values.learnerId === 'new' || existing), 'Выбери программу и учебный профиль.');
      const aid = existing ? audience(s, existing) : values.audience;
      const name = existing ? existing.name : clean(values.name, 80);
      check(name.length >= 2 && allowed(pid).includes(aid), 'Укажи учебное имя и подходящее возрастное направление.');
      const gid = values.preferredGroupId === 'any' ? '' : values.preferredGroupId || '';
      const g = gid && C.group(s, gid);
      check(!gid || g && groupProgram(s, g) === pid && g.audience === aid && g.open !== false, 'Выбери открытую группу для этого направления.');
      check(!existing || !gid || !C.isMember(s, existing.id, gid), 'Участник уже зачислен в эту группу. Открой его кабинет или выбери другую группу.');
      const guardian = existing ? C.guardianId(s, existing.id) : isMinor(aid) ? values.guardianId : '';
      const publicSite = values.source === 'public-site';
      const contactName = clean(values.contactName, 80), contact = clean(values.contact, 100);
      check(!publicSite || !existing && contactName.length >= 2 && contact.length >= 3, 'Для заявки с сайта укажи учебное контактное лицо и способ связи.');
      check(!isMinor(aid) || C.learner(s, guardian) && !isMinor(audience(s, C.learner(s, guardian))) || publicSite && !guardian, 'Для детского профиля выбери сопровождающего взрослого.');
      const duplicate = s.admission.applications.find(a => activeStatuses.includes(a.status) && a.programId === pid && a.audience === aid && (existing ? a.learnerId === existing.id : !a.learnerId && a.name.toLocaleLowerCase('ru-RU') === name.toLocaleLowerCase('ru-RU')));
      check(!duplicate, duplicate ? 'Для этого участника уже есть заявка ' + number(duplicate) + '. Открой «Мои заявки».' : 'Заявка уже существует.');
      const now = new Date().toISOString(), sequence = Math.max(0, ...s.admission.applications.map(a => a.sequence)) + 1;
      const a = { id: uid('application'), sequence, token: token || uid('submission'), name, audience: aid, programId: pid, preferredGroupId: gid, groupId: '', learnerId: existing?.id || '', guardianId: guardian || '', note: clean(values.note), status: 'new', owner: 'Координатор 01', followUp: C.date(2), decision: '', createdAt: now, updatedAt: now, history: [{ status: 'new', at: now, message: 'Учебная заявка получена.' }] };
      if (publicSite) Object.assign(a, { source: 'public-site', contactName, contact });
      s.admission.applications.push(a);
      C.log(s, number(a) + ': получена заявка в программу «' + program(pid).title + '».');
      return a;
    }
    function linkGuardian(s, id, guardianId) {
      const a = get(s, id), p = C.learner(s, guardianId);
      check(a?.source === 'public-site' && isMinor(a.audience) && ['new', 'review', 'waitlist'].includes(a.status), 'Связать сопровождающего можно для незавершённой детской заявки с сайта.');
      check(p && !isMinor(audience(s, p)), 'Выбери взрослый учебный профиль сопровождающего.');
      if (a.guardianId === guardianId) return a;
      a.guardianId = guardianId;
      record(s, a, a.status, 'Координатор связал заявку с учебным профилем сопровождающего «' + p.name + '».');
      return a;
    }
    function handling(s, id, values) {
      const a = get(s, id);
      check(a && ['new', 'review', 'waitlist'].includes(a.status), 'Эту заявку уже обработали.');
      check(['Координатор 01', 'Координатор 02'].includes(values.owner) && C.validDate(values.followUp), 'Выбери ответственного и дату следующего действия.');
      a.owner = values.owner; a.followUp = values.followUp;
      if (a.status === 'new') record(s, a, 'review', 'Заявка принята в работу.');
      return a;
    }
    function wait(s, id, groupId, note = '') {
      const a = get(s, id), g = C.group(s, groupId);
      check(a && ['new', 'review', 'waitlist'].includes(a.status) && g && groupProgram(s, g) === a.programId && g.audience === a.audience, 'Для листа ожидания выбери подходящую группу.');
      const message = clean(note) || 'Ожидаем свободное место в группе «' + g.name + '».';
      if (a.status === 'waitlist' && a.groupId === groupId && a.decision === message) return a;
      a.groupId = groupId; a.decision = message;
      record(s, a, 'waitlist', message);
      return a;
    }
    function enrollmentConflict(s, person, groupId) {
      if (!person || C.isMember(s, person.id, groupId)) return '';
      const list = s.sessions.filter(m => (m.status || 'planned') === 'planned' && m.date >= C.date());
      const minutes = t => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
      for (const m of list.filter(m => m.groupId === groupId)) for (const other of list.filter(m => C.isMember(s, person.id, m.groupId))) {
        if (m.date === other.date && minutes(m.time) < minutes(other.time) + other.minutes && minutes(other.time) < minutes(m.time) + m.minutes) return 'У участника пересекаются встречи: «' + m.title + '» и «' + other.title + '». Выбери другую группу.';
      }
      return '';
    }
    function enroll(s, id, groupId) {
      const a = get(s, id), g = C.group(s, groupId);
      check(a, 'Заявка не найдена.');
      if (a.status === 'enrolled') return { application: a, learner: C.learner(s, a.learnerId), enrolled: true, repeated: true };
      check(a.source !== 'public-site' || !isMinor(a.audience) || C.learner(s, a.guardianId) && !isMinor(audience(s, C.learner(s, a.guardianId))), 'Перед зачислением ребёнка свяжи заявку с учебным профилем сопровождающего.');
      check(['new', 'review', 'waitlist'].includes(a.status) && g && groupProgram(s, g) === a.programId && g.audience === a.audience, 'Выбери подходящую группу для зачисления.');
      const existing = C.learner(s, a.learnerId), already = existing && C.isMember(s, existing.id, groupId);
      const error = enrollmentConflict(s, existing, groupId); check(!error, error);
      const initial = g.initialCourseId && C.available(s).find(c => c.id === g.initialCourseId && c.group === g.audience);
      check(!g.initialCourseId || initial, 'Начальный курс группы недоступен. Проверь настройки группы.');
      if (!already && groupStats(s, groupId).free === 0) {
        wait(s, id, groupId);
        return { application: a, enrolled: false, full: true };
      }
      const first = s.admission.applications.filter(x => x.status === 'waitlist' && x.groupId === groupId).sort((x, y) => x.sequence - y.sequence)[0];
      check(already || !first || first.id === a.id, first ? 'Первым в листе ожидания стоит ' + number(first) + '. Сначала рассмотрите эту заявку.' : 'Проверь очередь.');
      let person = existing;
      if (!person) {
        person = { id: uid('learner'), name: a.name, detail: catalog.groups.find(x => x.id === a.audience)?.age || 'Участник программы', audience: a.audience, groupId, groupIds: [groupId], initial: Array.from(a.name)[0]?.toUpperCase() || 'У', guardianId: a.guardianId || '' };
        s.learners.push(person);
      } else person.groupIds = [...new Set([...C.groupIds(s, person.id), groupId])];
      if (initial && !C.assigned(s, person.id).some(x => x.courseId === initial.id)) s.assignments.push({ id: uid('assignment'), learnerId: person.id, courseId: initial.id, due: C.date(7), note: 'Начальный курс группы «' + g.name + '». Изучай материал в удобном темпе.', ...(initial.custom ? { snapshot: C.clone(initial) } : {}) });
      a.learnerId = person.id; a.groupId = groupId; a.decision = 'Зачислен в группу «' + g.name + '». ' + (initial ? 'Курс и расписание доступны в кабинете.' : 'Расписание и программа встреч доступны в кабинете.');
      record(s, a, 'enrolled', a.decision);
      return { application: a, learner: person, enrolled: true, repeated: false };
    }
    function close(s, id, target, reason) {
      const a = get(s, id);
      check(a && ['new', 'review', 'waitlist'].includes(a.status) && ['declined', 'withdrawn'].includes(target), 'Завершить можно только незачисленную заявку.');
      check(clean(reason).length >= 3, 'Коротко укажи причину решения.');
      a.decision = clean(reason);
      record(s, a, target, (target === 'declined' ? 'Заявка отклонена. ' : 'Заявка отозвана. ') + a.decision);
      return a;
    }
    function reopen(s, id) {
      const a = get(s, id);
      check(a && ['declined', 'withdrawn'].includes(a.status), 'Эта заявка уже открыта или участник зачислен.');
      check(!s.admission.applications.some(x => x.id !== id && activeStatuses.includes(x.status) && x.programId === a.programId && x.audience === a.audience && (a.learnerId ? x.learnerId === a.learnerId : x.name.toLowerCase() === a.name.toLowerCase())), 'Для участника уже есть активная заявка в эту программу.');
      a.decision = ''; a.groupId = ''; a.followUp = C.date(2);
      record(s, a, 'review', 'Заявка возвращена на рассмотрение.');
      return a;
    }
    function saveGroup(s, id, values) {
      const existing = id && C.group(s, id), pid = existing ? groupProgram(s, existing) : values.programId, aid = existing?.audience || values.audience;
      check(!id || existing, 'Группа не найдена.');
      const capacity = Number(values.capacity), name = clean(values.name, 100), initialCourse = C.available(s).find(c => c.id === values.initialCourseId && c.group === aid);
      check(program(pid) && allowed(pid).includes(aid) && name.length >= 3, 'Укажи программу, направление и название группы.');
      check(Number.isInteger(capacity) && capacity >= 1 && capacity <= 40 && capacity >= (existing ? people(s, id).length : 0), 'Вместимость — от 1 до 40, не меньше числа зачисленных участников.');
      check(s.groups.some(g => g.teacher === values.teacher) && s.groups.some(g => g.room === values.room), 'Выбери преподавателя и место.');
      check(initialCourse || program(pid).kind === 'studio' && !values.initialCourseId, 'Выбери доступный начальный курс для этого возраста.');
      check(program(pid).kind !== 'studio' || !initialCourse || initialCourse.custom, 'Для занятий центра можно прикрепить авторские материалы преподавателя или оставить очный формат.');
      const result = { ...(existing || {}), id: existing?.id || uid('group'), name, programId: pid, audience: aid, teacher: values.teacher, room: values.room, capacity, initialCourseId: initialCourse?.id || '', open: values.open === 'on' || values.open === true };
      if (existing) s.groups[s.groups.indexOf(existing)] = result; else s.groups.push(result);
      C.log(s, (existing ? 'Обновлена' : 'Создана') + ' группа «' + name + '», мест: ' + capacity + '.');
      return result;
    }
    const personApplications = (s, id) => s.admission.applications.filter(a => a.learnerId === id || a.guardianId === id).sort((a, b) => b.sequence - a.sequence);
    const stats = s => Object.fromEntries(Object.keys(statuses).map(status => [status, s.admission.applications.filter(a => a.status === status).length]));
    return { upgrade, valid, program, programs, allowed, programGroups, groupProgram, groupStats, get, number, audience, isMinor, request, linkGuardian, handling, wait, enroll, close, reopen, saveGroup, personApplications, stats, statuses, uid };
  }
  window.EducationAdmissionCore = { create };
})();
