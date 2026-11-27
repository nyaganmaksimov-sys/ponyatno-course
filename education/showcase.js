(() => {
  'use strict';
  window.EducationShowcase = {
    create({ S, C, H, state, esc, chrome, heading, metric, commit, go }) {
      const labels = { new: 'Можно выполнить', draft: 'Черновик', submitted: 'На проверке', revision: 'Нужна доработка', accepted: 'Принято', paused: 'Приостановлено' };
      const button = (item, label = 'Открыть пример') => S.installed(state()) ? `<a class="btn" href="#showcase/${item.id}">${label}</a>` : `<button data-ws-action="prepare-showcase" data-case="${item.id}">${label}</button>`;
      function entryCard(item) {
        const e = S.entry(state(), item.id), tasks = e ? H.byGroup(state(), e.groupId) : [];
        const stats = e && H.stats(state(), tasks);
        return `<article class="panel sc-card"><span class="sc-case-kind">${item.id === 'family' || item.id === 'senior' ? 'Учебная программа' : 'Направление центра'}</span><h2>${esc(item.title)}</h2><p>${esc(item.description || (item.id === 'family' ? 'Обучение взрослого и поддержка ребёнка в связанном семейном кабинете.' : 'Практические задания, спокойный темп и понятная обратная связь.'))}</p>${e ? `<p class="muted">${esc(C.learner(state(), e.learnerId).name)} · на проверке ${stats.submitted} · принято ${stats.accepted}</p>` : '<p class="muted">Учебный профиль, занятия и примеры работ.</p>'}${button(item)}</article>`;
      }
      function landing() {
        const ready = S.installed(state());
        return chrome('') + heading('ГОТОВЫЙ ПОКАЗ КЛИЕНТУ', 'Весь учебный путь в одном примере', 'Выбери направление и посмотри связанные действия участника, сопровождающего, преподавателя и руководителя.', '<div class="actions"><a class="btn" href="../center/">Публичный сайт центра</a><a class="btn" href="../client.html">Описание проекта</a></div>') + `<section class="sc-intro"><div><span class="kicker">ВОСЕМЬ ВЫМЫШЛЕННЫХ СЦЕНАРИЕВ</span><h2>${ready ? 'Примеры готовы к показу' : 'Подготовим понятный показ'}</h2><p>Творчество, инженерные занятия, шахматы, музыка, английский, подготовка к школе, семейное обучение и старшее поколение.</p><p>${ready ? 'Работы уже имеют разные статусы: черновик, проверка, доработка и принятие. Открытие показа сохраняет внесённые изменения.' : 'Добавим отдельные учебные профили, группы и работы. Текущие записи и результаты сохранятся.'}</p></div><div>${ready ? '<a class="btn primary" href="#showcase/creative">Начать с творческой студии</a>' : '<button class="primary" data-ws-action="prepare-showcase" data-case="creative">Добавить примеры для показа</button>'}<a class="btn" href="#infrastructure">Собственный дата-центр</a></div></section><div class="sc-library">${S.examples.map(entryCard).join('')}</div><p class="notice">Все люди, группы, встречи и отправки в этих примерах вымышлены. Три вводных занятия по каждому из шести направлений подготовлены для демонстрации и требуют проверки педагогами перед реальным использованием.</p>${infrastructureCard()}`;
      }
      function detail(id) {
        const e = S.entry(state(), id), item = S.examples.find(item => item.id === id);
        if (!e || !item) return landing();
        const p = C.learner(state(), e.learnerId), c = C.course(state(), e.courseId, p.id), t = H.get(state(), e.taskId);
        const tasks = H.byGroup(state(), e.groupId), stats = H.stats(state(), tasks);
        const lesson = c.lessons.find(l => l.id === t.source.lessonId) || c.lessons[0];
        const lessonRoute = c.custom ? `#workshop/${p.id}/${c.id}/${lesson.id}` : `#study/${p.id}/${c.id}/${c.lessons.indexOf(lesson)}`;
        const steps = [
          ['Запись в центр', 'Посетитель может оставить обращение на публичном сайте. В этом примере учебная заявка уже зачислена. Видно решение координатора и выбранную группу.', `#application/${e.applicationId}`, 'Открыть заявку'],
          ['Участник изучает материал', 'Цель занятия, объяснение, практика и переход к домашней работе.', lessonRoute, 'Открыть занятие'],
          ['Участник отправляет работу', 'Текст, выбор ответа, фото или файл; черновик и история отправок.', `#homework-task/${t.id}/${p.id}`, 'Открыть домашнюю работу'],
          ['Педагог даёт обратную связь', 'Проверка той же работы: принять или вернуть на доработку с комментарием.', `#homework-review/${t.id}`, 'Проверить работу'],
          ...(e.guardianId ? [['Сопровождающий видит результат', 'Связанный профиль ребёнка, комментарии, задания и помощь при отправке.', `#parent/${p.id}/${e.guardianId}`, 'Открыть семейный кабинет']] : []),
          ['Руководитель видит общую картину', 'Группы, посещения и домашние работы учитываются отдельными показателями.', '#director', 'Открыть сводку']
        ];
        return chrome('') + heading('СЦЕНАРИЙ ПОКАЗА', item.title, p.name + ' · вымышленный учебный пример', '<a class="btn" href="#showcase">Все направления показа</a>') + `<nav class="sc-case-nav" aria-label="Направления показа">${S.examples.map(x => `<a class="btn ${x.id === id ? 'primary' : ''}" href="#showcase/${x.id}" ${x.id === id ? 'aria-current="page"' : ''}>${esc(x.title)}</a>`).join('')}</nav><section class="panel sc-current"><div><span class="kicker">ОДНА РАБОТА В РАЗНЫХ КАБИНЕТАХ</span><h2>${esc(t.title)}</h2><p>${esc(t.instructions)}</p></div><span class="hw-status hw-${H.status(state(), t)}">${labels[H.status(state(), t)]}</span></section><div class="ws-metrics">${metric(c.lessons.length, 'Занятий в примере')}${metric(stats.submitted, 'На проверке')}${metric(stats.revision, 'Нужна доработка')}${metric(stats.accepted, 'Принято')}</div><div class="sc-steps">${steps.map(([title, text, href, action]) => `<section class="panel sc-step"><div><h2>${title}</h2><p>${text}</p></div><a class="btn" href="${href}">${action}</a></section>`).join('')}</div><section class="panel"><h2>Другие действия в этом направлении</h2><a class="btn" href="../center/#apply/${item.programId}">Подать заявку с сайта центра</a><div class="actions"><a class="btn" href="#student/${p.id}">Кабинет участника</a><a class="btn" href="#homework/${p.id}/${p.id}">Все домашние задания</a><a class="btn" href="#homework-teacher/${e.groupId}/all">Все работы группы</a><a class="btn" href="#teacher/${e.groupId}">Кабинет педагога</a><a class="btn" href="#event/${e.meetingId}/${p.id}">Следующая встреча</a>${c.custom ? `<a class="btn" href="#builder/${c.id}">Программа в конструкторе</a>` : ''}</div></section><p class="notice">Переключай кабинеты в верхнем меню. Изменения этой работы сохраняются в браузере; вернуться к последовательности можно по ссылке «Готовый показ».</p>${infrastructureCard()}`;
      }
      function infrastructureCard() {
        return `<section class="panel sc-infrastructure"><div><span class="kicker">ПЛАНИРУЕМЫЙ ЭТАП ПРОЕКТА</span><h2>Собственный дата-центр</h2><p>После завершения демо планируем разместить рабочую систему на собственном сервере HPE: с общей базой, личными аккаунтами и закрытым хранением файлов.</p></div><a class="btn" href="#infrastructure">Преимущества и этапы</a></section>`;
      }
      function infrastructure() {
        return chrome('') + heading('РАЗВИТИЕ ПРОЕКТА', 'Система на собственной инфраструктуре', 'Планируемое размещение рабочей версии в собственном дата-центре на сервере HPE.', '<a class="btn" href="#showcase">К демонстрации</a>') + `<section class="sc-intro"><div><span class="kicker">КОНТРОЛЬ ДАННЫХ И РАЗВИТИЯ</span><h2>Собственный дата-центр — преимущество проекта</h2><p>Организация сможет управлять местом хранения учебных данных, правами доступа, резервными копиями и обновлениями. Инфраструктуру можно развивать под задачи центра.</p></div><span class="sc-phase">Планируется после демо</span></section><div class="sc-library">${[
          ['Контроль хранения', 'Общая база и вложения будут размещаться на собственной инфраструктуре, с установленными организацией правилами хранения.'],
          ['Управление доступом', 'Личные аккаунты и роли позволят предоставлять доступ к нужным группам, участникам и работам.'],
          ['Собственные резервные копии', 'Можно настроить расписание копирования, сроки хранения и проверку восстановления.'],
          ['Развитие под задачи центра', 'Собственное размещение даст возможность выбирать конфигурацию и планировать дальнейшие интеграции и обновления.']
        ].map(([title, body]) => `<article class="panel"><h2>${title}</h2><p>${body}</p></article>`).join('')}</div><section class="panel"><h2>Последовательность внедрения</h2><ol class="sc-roadmap"><li><b>Сейчас — GitHub-демо.</b> Показываем сценарии, уточняем программу и удобство кабинетов.</li><li><b>После согласования — серверная версия.</b> Подготовим общую базу, вход в аккаунты и защищённое хранение вложений.</li><li><b>Затем — перенос на HPE.</b> Настроим домен, доступы, резервное копирование и проверим работу с разных устройств.</li></ol><p class="muted">Сейчас сайт работает на GitHub Pages, а демонстрационные данные сохраняются в браузере. Размещение в собственном дата-центре обозначено как будущий этап; оно ещё не запущено.</p></section>`;
      }
      function click(b) {
        if (b.dataset.wsAction !== 'prepare-showcase') return false;
        commit(s => S.install(s), 'Примеры для показа готовы. Текущие записи сохранены.');
        go('#showcase/' + (S.examples.some(e => e.id === b.dataset.case) ? b.dataset.case : 'creative'));
        return true;
      }
      return { landing, detail, infrastructure, infrastructureCard, click };
    }
  };
})();
