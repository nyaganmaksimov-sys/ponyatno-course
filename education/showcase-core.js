(() => {
  'use strict';
  window.EducationShowcaseCore = {
    create(C, A, H, examples = window.EducationShowcaseData) {
      const installed = s => s.showcase?.version === 1 && Array.isArray(s.showcase.entries) && s.showcase.entries.length === examples.length && s.showcase.entries.every(e => C.learner(s, e.learnerId) && C.group(s, e.groupId) && H.get(s, e.taskId));
      function install(s) {
        if (installed(s)) return s.showcase;
        if (s.showcase) throw new Error('Примеры показа изменены. Сохрани текущие данные; подготовить новый показ можно после отдельного сброса демо.');
        const entries = [];
        let guardian;
        examples.forEach((item, index) => {
          let courseId = item.nativeCourse;
          if (item.lessons) {
            const draft = C.createDraft(s, { title: item.courseTitle, group: item.audience, description: item.description });
            for (const l of item.lessons) C.saveLesson(s, draft.id, '', l);
            C.publish(s, draft.id); courseId = draft.id;
          }
          const groupId = 'showcase-v1-' + item.id;
          if (C.group(s, groupId)) throw new Error('Группа с идентификатором показа уже существует. Текущие данные сохранены.');
          const g = { id: groupId, name: 'Показ · ' + item.title, audience: item.audience, programId: item.programId, teacher: index % 2 ? 'Педагог 02' : 'Педагог 01', room: index % 2 ? 'Кабинет 2' : 'Кабинет 1', capacity: 4, open: true, initialCourseId: courseId };
          s.groups.push(g);
          const application = A.request(s, { token: 'showcase-v1-' + item.id, demo: 'on', name: item.learner, audience: item.audience, programId: item.programId, preferredGroupId: groupId, guardianId: ['preschool', 'junior', 'teen'].includes(item.audience) ? guardian.id : '', note: 'Вымышленный пример для показа возможностей системы.' });
          const result = A.enroll(s, application.id, groupId), p = result.learner;
          if (!result.enrolled || !p) throw new Error('Не удалось подготовить учебный профиль показа.');
          if (item.id === 'family') guardian = p;
          s.notes[p.id] = 'Демонстрационная учебная заметка: подбираем удобный темп и понятный способ ответа.';
          const c = C.course(s, courseId, p.id);
          let meeting;
          for (let day = 1; day <= 21 && !meeting; day++) {
            const candidate = { groupId, title: c.lessons[0].title, date: C.date(-day), time: '10:00', minutes: 30, teacher: g.teacher, room: g.room };
            if (!C.collision(s, candidate)) meeting = C.saveMeeting(s, '', { ...candidate, agenda: c.lessons[0].goal, home: '' });
          }
          if (!meeting) throw new Error('Не удалось подобрать свободное время для учебной встречи показа.');
          C.attendance(s, meeting.id, p.id, 'present'); C.finishMeeting(s, meeting.id);
          let upcoming;
          for (let day = 1; day <= 21 && !upcoming; day++) {
            const candidate = { groupId, title: c.lessons[1]?.title || c.lessons[0].title, date: C.date(day), time: '11:00', minutes: 30, teacher: g.teacher, room: g.room };
            if (!C.collision(s, candidate)) upcoming = C.saveMeeting(s, '', { ...candidate, agenda: c.lessons[1]?.goal || c.lessons[0].goal, home: '' });
          }
          if (!upcoming) throw new Error('Не удалось подобрать следующую встречу показа.');
          C.complete(s, p.id, c.id, c.lessons[0].id);
          H.sync(s);
          const tasks = c.lessons.map(l => H.lessonTask(s, p.id, c.id, l.id));
          for (const [i, target] of item.states.entries()) {
            const t = tasks[i], l = c.lessons[i];
            const helper = target === 'accepted-helper';
            const values = { text: item.answer, choice: t.choices.length ? l.correct : null, files: [], support: helper ? 'with-helper' : 'independent' };
            if (item.id === 'creative' && i === 1) {
              const bytes = new TextEncoder().encode('Вымышленная работа для демонстрации: жёлтое солнце, оранжевые лучи.');
              values.files.push({ id: 'showcase-sample-file', name: 'Учебный_пример.txt', type: 'text/plain', size: bytes.length, data: 'data:text/plain;base64,' + btoa(String.fromCharCode(...bytes)) });
            }
            if (target === 'draft') H.saveDraft(s, t.id, p.id, values);
            else if (target === 'in-class') H.inClass(s, t.id, groupId, item.feedback);
            else if (target !== 'new') {
              const attempt = H.submit(s, t.id, p.id, values, helper ? guardian.id : p.id);
              if (['revision', 'accepted', 'accepted-helper'].includes(target)) H.review(s, t.id, groupId, attempt.id, target === 'revision' ? 'revision' : 'accepted', item.feedback);
            }
          }
          // Choose an actionable example: a submitted creative work, a revision,
          // or the first lesson. Nothing is overwritten when the walkthrough is reopened.
          const focus = tasks.find(t => H.status(s, t) === 'submitted') || tasks.find(t => H.status(s, t) === 'revision') || tasks[0];
          entries.push({ id: item.id, title: item.title, learnerId: p.id, guardianId: ['preschool', 'junior', 'teen'].includes(item.audience) ? guardian.id : '', groupId, courseId, taskId: focus.id, applicationId: application.id, meetingId: upcoming.id });
        });
        s.showcase = { version: 1, installedAt: new Date().toISOString(), entries };
        C.log(s, 'Подготовлены восемь вымышленных сценариев показа, включая шесть направлений центра.');
        return s.showcase;
      }
      const entry = (s, id) => installed(s) ? s.showcase.entries.find(e => e.id === id) : null;
      return { install, installed, entry, examples };
    }
  };
})();
