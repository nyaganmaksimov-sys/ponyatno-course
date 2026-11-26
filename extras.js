(() => {
  'use strict';

  const main = document.getElementById('main');
  const key = 'ponyatno-life-v1';
  const links = {
    project: 'https://after55.moscow/',
    catalog: 'https://www.mos.ru/age/',
    digital: 'https://www.after55.moscow/digitalliteracy',
    safety: 'https://yandex.ru/project/dolgoletie',
    center: 'https://yandex.ru/maps/org/tsentr_mentalnogo_razvitiya/207839089282/'
  };
  const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const external = (url, label, cls = '') => `<a class="${cls}" href="${url}" target="_blank" rel="noopener noreferrer">${label}<span class="sr-only"> (откроется в новой вкладке)</span></a>`;
  const glyph = name => {
    const paths = {
      group: '<path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-7h6v7M9 9h6"/>',
      water: '<path d="M12 3S5 11 5 15a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
      photo: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="2"/><path d="m3 17 5-4 4 3 4-6 5 7"/>',
      shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9S4 17 4 12V6l8-3Z"/><path d="m8 12 3 3 5-6"/>'
    };
    return `<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
  };

  const scenarios = [
    {
      id: 'group', icon: 'group', title: 'Выбрать занятие долголетия',
      summary: 'Найти направление, сверить адрес и понять, как оформить запись.',
      lesson: 'gov-find', lessonName: 'Находим услугу и читаем условия',
      intro: 'Разберём выбор группы на учебном примере. Настоящая запись оформляется отдельно через организатора или официальный каталог проекта.',
      steps: [
        {title: 'С чего начать поиск?', text: 'Вы хотите найти занятия по цифровой грамотности. Какой путь выберете?', options: ['Открыть официальный каталог «Московского долголетия» на mos.ru', 'Перейти по случайной ссылке из сообщения и отправить документы', 'Считать, что открытие этого учебного сайта уже означает запись'], correct: 0, why: 'Начните с официального ресурса проекта. На нём можно искать направления и группы; наш сайт помогает подготовиться к этому действию.'},
        {title: 'Подходит ли вам группа?', text: 'Вам нужны очные занятия по цифровым навыкам рядом с домом. Что стоит проверить в карточке группы?', options: ['Только красивое название', 'Только количество фотографий', 'Направление, организатора, адрес, формат и время занятий'], correct: 2, why: 'Важно сверить все условия. Если ищете занятия именно нашего центра, сравните название организатора и адрес, затем уточните наличие мест.'},
        {title: 'Что делать после выбора?', text: 'Вы нашли подходящую карточку. Как убедиться, что вы действительно записаны?', options: ['Просто закрыть сайт', 'Следовать порядку записи и проверить подтверждение у организатора', 'Передать пароль от mos.ru преподавателю'], correct: 1, why: 'Открытая карточка не означает запись. Уточните порядок зачисления и получите подтверждение. Пароль и коды входа вводите самостоятельно.'}
      ],
      takeaway: ['Искать направление через официальный ресурс.', 'Сверять организатора, адрес, формат и время.', 'Уточнять наличие мест и проверять подтверждение записи.'],
      source: links.digital, sourceName: 'Цифровая грамотность в «Московском долголетии»'
    },
    {
      id: 'water', icon: 'water', title: 'Проверить показания воды',
      summary: 'Переписать цифры без спешки и сверить сведения перед отправкой.',
      lesson: 'gov-documents', lessonName: 'Документ, проверка и статус',
      intro: 'В тренажёре используется вымышленный счётчик. Здесь нет настоящего адреса, кода плательщика и отправки показаний.',
      steps: [
        {title: 'Какие цифры переписать?', text: 'Учебный пример: предыдущее показание — 125 м³, текущее — 131 м³. В этом задании поле просит текущее показание. Что выбрать?', options: ['125', '131', '6'], correct: 1, why: 'В учебном поле нужно 131 — текущее показание. Разница 6 показывает расход, но это другая величина. На реальном сервисе читайте подпись поля и подсказки.'},
        {title: 'Тот ли это счётчик?', text: 'Перед вами два поля: для холодной и для горячей воды. Что поможет не перепутать сведения?', options: ['Сверить тип воды и номер нужного прибора', 'Поставить одинаковое число в оба поля', 'Выбрать поле случайно'], correct: 0, why: 'Проверьте, к какому прибору относится каждое поле. Перед подтверждением отдельно сверьте адрес, номер прибора и переписанные цифры.'},
        {title: 'Когда можно переходить к реальному действию?', text: 'Вы закончили учебную проверку. Какой следующий шаг верный?', options: ['Считать показания отправленными', 'Ввести данные квартиры на этом учебном сайте', 'Открыть официальный сервис и заново проверить условия и свои сведения'], correct: 2, why: 'Тренажёр только обучает. Настоящие показания передаются отдельно в официальном сервисе. Текущие сроки и правила смотрите в его описании.'}
      ],
      takeaway: ['Различать текущее показание и расход.', 'Сверять тип воды и номер счётчика.', 'Проверять сведения и условия на официальном сервисе.'],
      source: 'https://www.mos.ru/', sourceName: 'Городские услуги на mos.ru'
    },
    {
      id: 'family', icon: 'photo', title: 'Подготовить фото для близкого',
      summary: 'Выбрать снимок и проверить, кому и что вы собираетесь отправить.',
      lesson: 'phone-photos', lessonName: 'Приложения и фотографии',
      intro: 'Подготовим вымышленное сообщение. Тренажёр не открывает вашу галерею, не читает контакты и не отправляет сообщения.',
      steps: [
        {title: 'Какой снимок выбрать?', text: 'Вы хотите показать близкому цветок, который вырастили дома. Что прикрепить?', options: ['Фотографию паспорта', 'Снимок банковской карты', 'Только фотографию цветка'], correct: 2, why: 'Выбирайте снимок, который относится к сообщению. Следите, чтобы вместе с ним случайно не были выбраны личные документы или другие лишние фотографии.'},
        {title: 'Что сверить перед отправкой?', text: 'Снимок выбран. На что посмотреть до нажатия кнопки отправки?', options: ['Только на заряд батареи', 'На имя получателя, выбранный чат и предпросмотр снимка', 'Ни на что: приложение всегда угадывает получателя'], correct: 1, why: 'Убедитесь, что открыт нужный личный чат, а в предпросмотре именно тот снимок. Если имена похожи, проверьте контакт дополнительно.'},
        {title: 'Личный чат или общая публикация?', text: 'Снимок предназначен одному близкому человеку. Какой вариант выбрать?', options: ['Личное сообщение проверенному получателю', 'Публичную публикацию для всех', 'Рассылку всем контактам'], correct: 0, why: 'Выберите личное сообщение, когда хотите поделиться только с одним человеком. Названия кнопок и расположение меню зависят от приложения.'}
      ],
      takeaway: ['Выбирать только нужные снимки.', 'Проверять получателя и предпросмотр.', 'Различать личное сообщение и публичную публикацию.'],
      source: links.safety, sourceName: 'Памятки по цифровой безопасности'
    },
    {
      id: 'call', icon: 'shield', title: 'Распознать подозрительный звонок',
      summary: 'Остановиться, сохранить коды в тайне и самостоятельно проверить просьбу.',
      lesson: 'safe-codes', lessonName: 'Пароли, коды и спокойная проверка',
      intro: 'Потренируемся на вымышленных ситуациях. Настоящие пароли, коды и банковские сведения здесь не нужны.',
      steps: [
        {title: 'Звонящий просит код', text: 'Человек представился «поддержкой проекта» и просит продиктовать код входа, чтобы «сохранить место в группе». Как поступить?', options: ['Не сообщать код и прекратить разговор', 'Продиктовать код, если человек вежливый', 'Переслать снимок экрана с кодом'], correct: 0, why: 'Код входа открывает доступ к аккаунту. Не сообщайте его звонящему и не пересылайте снимок сообщения.'},
        {title: 'Как проверить информацию?', text: 'Вы хотите узнать, действительно ли есть проблема с записью. Как связаться с организатором?', options: ['Позвонить по номеру, который продиктовал незнакомец', 'Открыть ссылку, которую он прислал', 'Самостоятельно найти контакт на официальном ресурсе или в знакомой карточке центра'], correct: 2, why: 'Проверяйте ситуацию по контакту, который вы нашли самостоятельно. Это помогает не продолжить разговор с тем же человеком под видом «проверки».'},
        {title: 'Знакомый голос и срочная просьба', text: 'В другом звонке знакомый голос просит срочно перевести деньги. Как сначала проверить просьбу?', options: ['Сразу перевести деньги', 'Завершить звонок и связаться с близким по давно известному номеру', 'Сообщить данные своей карты'], correct: 1, why: 'Голос и имя на экране сами по себе не подтверждают личность. Свяжитесь с близким по известному вам контакту и спокойно уточните ситуацию.'}
      ],
      takeaway: ['Не передавать коды и пароли.', 'Проверять просьбу по самостоятельно найденному контакту.', 'При срочной просьбе от близкого перезванивать на известный номер.'],
      source: links.safety, sourceName: 'Советы Яндекса и «Московского долголетия»'
    }
  ];

  let done = [];
  let storageOK = true;
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(raw)) done = [...new Set(raw.filter(id => scenarios.some(s => s.id === id)))];
  } catch { storageOK = false; }
  const sessions = {};
  function save() { try { localStorage.setItem(key, JSON.stringify(done)); } catch { storageOK = false; } }
  function card(s) {
    return `<a class="life-card" href="#life/${s.id}"><span class="life-icon">${glyph(s.icon)}</span><span class="life-card-meta">3 учебных шага${done.includes(s.id) ? ' · Пройдено' : ''}</span><h2>${s.title}</h2><p>${s.summary}</p><span class="card-action">${done.includes(s.id) ? 'Повторить или открыть памятку' : 'Попробовать'}</span></a>`;
  }
  function home() {
    return `<section class="longevity-banner" aria-labelledby="longevity-heading"><div><span class="project-label">Московское долголетие</span><h2 id="longevity-heading">Встречаемся в центре.<br>Тренируемся дома.</h2><p>Учебный ресурс Центра ментального развития для участников проекта и всех, кто осваивает цифровые навыки.</p></div><div class="banner-actions"><a class="btn primary" href="#dolgoletie">О занятиях и записи</a><a class="btn" href="#life">Практика для жизни</a><span>12 занятий и 4 дополнительных тренажёра</span></div></section>`;
  }
  function renderLong() {
    document.title = 'Московское долголетие — Умные Лисята';
    main.innerHTML = `<div class="page-heading longevity-heading"><div class="eyebrow">Центр ментального развития</div><h1>Цифровые навыки<br>для активной жизни</h1><p class="lead">Учимся вместе с участниками<br>«Московского долголетия».</p><p>Центр участвует в проекте «Московское долголетие». «Умные Лисята» помогает готовиться к занятиям, пробовать знакомые действия и повторять их дома.</p><div class="hero-actions"><a class="btn primary" href="#program">Открыть курс</a><a class="btn" href="#life">Выбрать жизненную задачу</a></div></div>
      <section class="connection-grid" aria-label="Как устроено обучение"><article class="connection-card"><span class="project-label">В центре</span><h2>Разбираемся вместе</h2><p>Преподаватель показывает действие, помогает повторить и подбирает темп под группу.</p></article><article class="connection-card"><span class="project-label">На сайте</span><h2>Пробуем без спешки</h2><p>Короткие объяснения, учебные упражнения и проверочные вопросы. Можно возвращаться к любому шагу.</p></article><article class="connection-card"><span class="project-label">Дома</span><h2>Закрепляем навык</h2><p>Повторяем на своём устройстве. Личные аккаунты используем только на официальных сервисах.</p></article></section>
      <section class="join-section" id="join"><div><div class="section-kicker">Как присоединиться</div><h2>Сначала выберите<br>подходящую группу</h2><p>На сайте проекта есть направление цифровой грамотности. Официальную запись на занятия оформляют отдельно от прохождения этого курса.</p><ol class="join-steps"><li><strong>Найдите направление и организатора.</strong> Откройте официальный ресурс проекта или уточните варианты у сотрудников центра.</li><li><strong>Сверьте адрес, формат и время.</strong> Если хотите заниматься у нас, уточните наличие группы и свободных мест в Центре ментального развития.</li><li><strong>Получите подтверждение записи.</strong> Организатор подскажет порядок участия, необходимые сведения и дату первого занятия.</li></ol><div class="hero-actions">${external(links.catalog, 'Каталог занятий на mos.ru', 'btn primary')}${external(links.project, 'Официальный сайт проекта', 'btn')}</div><p class="small-note">Условия участия и актуальное расписание проверяйте у организатора. Открытие учебного сайта не означает запись в группу.</p></div><aside class="center-card"><span class="project-label">Наш центр</span><h3>Центр ментального развития</h3><p>Москва, 10-я Парковая улица, 3</p>${external(links.center, 'Открыть карточку центра', 'btn')}<h3>Что уточнить перед визитом</h3><ul><li>Есть ли набор на цифровые занятия.</li><li>Какой уровень подготовки у группы.</li><li>Нужно ли принести смартфон и зарядное устройство.</li></ul><p class="small-note">Справочная проекта, указанная на его сайте:</p><a class="contact-phone" href="tel:+74958704444">+7 (495) 870-44-44</a><p class="small-note">Это общая справочная «Московского долголетия», а не телефон нашего центра.</p></aside></section>
      <section class="life-preview"><div class="section-kicker">Практические задачи</div><h2>Знания, которые пригодятся каждый день</h2><div class="life-grid">${scenarios.map(card).join('')}</div></section>
      <section class="homework"><h2>На первое занятие</h2><p>Возьмите своё устройство и зарядку, если планируете заниматься на смартфоне. Подумайте, что хотите научиться делать самостоятельно. Пароли и коды не записывайте в общие памятки и не передавайте преподавателю.</p></section>
      <p class="small-note resource-note">«Умные Лисята» — учебный ресурс центра. Запись в проект и работа с государственными сервисами выполняются на их официальных площадках. ${external(links.digital, 'О направлении цифровой грамотности')}</p>`;
  }
  function renderLife() {
    document.title = 'Практика для жизни — Умные Лисята';
    main.innerHTML = `<div class="page-heading"><div class="eyebrow">Повторяем знакомые действия</div><h1>Практика для жизни</h1><p>Четыре коротких тренажёра дополняют основной курс. Выберите задачу, которая нужна вам сейчас.</p><div class="life-progress"><strong>Пройдено ${done.length} из ${scenarios.length}</strong><span>Отметки сохраняются в этом браузере на этом устройстве.</span></div>${!storageOK ? '<p class="notice">Браузер не позволяет сохранить отметки. Упражнения всё равно доступны.</p>' : ''}</div><div class="life-grid">${scenarios.map(card).join('')}</div><section class="homework"><h2>Сначала потренируйтесь</h2><p>Здесь используются вымышленные ситуации. Настоящие сообщения, заявления и показания не отправляются. После тренировки повторите задачу на своём устройстве самостоятельно или с подсказкой преподавателя.</p></section><div class="lesson-bottom"><a class="btn" href="#program">Вернуться к основному курсу</a><a class="btn" href="#dolgoletie">О занятиях в центре</a></div>`;
  }
  function renderScenario(s) {
    document.title = s.title + ' — Умные Лисята';
    const ex = sessions[s.id] ||= {step: 0, pick: null, finished: done.includes(s.id)};
    const q = s.steps[ex.step];
    const correct = ex.pick === q.correct;
    main.innerHTML = `<article class="life-exercise"><a class="back-link" href="#life">Все жизненные задачи</a><div class="eyebrow">Учебный тренажёр · без личных данных</div><h1>${s.title}</h1><p class="life-intro">${s.intro}</p>${ex.finished ? `<section class="success-panel"><h2>Учебный маршрут пройден</h2><p>Вы разобрали все три шага. Можно повторить их или сохранить памятку на бумаге.</p></section><section class="takeaway"><h2>Что запомнить</h2><ul>${s.takeaway.map(t => `<li>${t}</li>`).join('')}</ul><p>На этом сайте выполнено только учебное упражнение.</p></section><div class="lesson-bottom no-print"><button class="btn primary" data-x-action="repeat" data-scenario="${s.id}">Повторить тренажёр</button><button class="btn" data-x-action="print">Распечатать памятку</button><a class="btn" href="#life">Выбрать другую задачу</a></div><p>${external(s.source, s.sourceName)}</p>` : `<div class="life-step-status"><span>Шаг ${ex.step + 1} из ${s.steps.length}</span><progress value="${ex.step}" max="${s.steps.length}" aria-label="Выполненные шаги"></progress></div><section class="life-question"><h2 id="life-question" tabindex="-1">${q.title}</h2><p>${q.text}</p><div class="life-options">${q.options.map((option, n) => `<button class="life-option${ex.pick === n ? ' selected' : ''}" data-x-action="answer" data-scenario="${s.id}" data-option="${n}" ${correct ? 'disabled' : ''} aria-pressed="${ex.pick === n}">${esc(option)}</button>`).join('')}</div>${ex.pick !== null ? `<p id="life-feedback" class="feedback ${correct ? 'good' : 'try'}" tabindex="-1">${correct ? 'Верно. ' + q.why : 'Попробуйте ещё раз. ' + (s.id === 'water' && ex.step === 0 ? 'Нужно текущее показание из условия, а не предыдущее число или разница.' : 'Ищите действие, которое помогает проверить сведения и сохранить личные данные.')}</p>` : ''}${correct ? `<button class="btn primary" data-x-action="next" data-scenario="${s.id}">${ex.step === s.steps.length - 1 ? 'Завершить тренажёр' : 'Следующий шаг'}</button>` : ''}</section>`}<div class="related-lesson no-print"><span>Если нужна основа</span><a href="#lesson/${s.lesson}/theory">${s.lessonName}</a></div></article>`;
  }
  function teacher() {
    return `<section class="teacher-longevity"><div><span class="project-label">Связь с Московским долголетием</span><h2>Один навык — в центре и дома</h2><p>Используйте основной курс как учебное сопровождение группы. Программу, продолжительность и расписание конкретной группы определяет организатор.</p></div><ol><li>В начале встречи выясните, какую задачу участник хочет решать сам.</li><li>Покажите действие на учебном примере и дайте повторить его на своём устройстве.</li><li>Выберите подходящий жизненный тренажёр и обсудите, где участнику нужна подсказка.</li><li>В конце оставьте одно короткое задание для повторения дома.</li></ol><p>Тренажёры дополняют 12 основных занятий. Отметки на сайте помогают повторению; посещаемость и запись в группу ведутся в установленном организатором порядке.</p><div class="lesson-bottom no-print"><a class="btn" href="#life">Жизненные тренажёры</a><a class="btn" href="#dolgoletie">Информация участнику</a></div></section>`;
  }
  function sources() {
    return `<section class="source-item"><h2>Московское долголетие: участие и практика</h2><p>Для записи в группу и уточнения условий используйте официальные ресурсы. Учебные тренажёры центра помогают подготовиться и повторить действия.</p><ul><li>${external(links.project, 'Сайт проекта «Московское долголетие»')}</li><li>${external(links.catalog, 'Каталог занятий на mos.ru')}</li><li>${external(links.digital, 'Направление цифровой грамотности')}</li><li>${external(links.safety, 'Материалы Яндекса и «Московского долголетия» по безопасности')}</li></ul><p class="small-note">Ссылки и описание направления проверены 25 ноября 2026 года. Расписание конкретной группы уточняйте у её организатора.</p></section>`;
  }

  main.addEventListener('click', event => {
    const button = event.target.closest('[data-x-action]');
    if (!button) return;
    const action = button.dataset.xAction;
    if (action === 'print') { window.print(); return; }
    const s = scenarios.find(item => item.id === button.dataset.scenario);
    if (!s) return;
    const ex = sessions[s.id];
    if (!ex) return;
    if (action === 'repeat') {
      sessions[s.id] = {step: 0, pick: null, finished: false};
    } else if (action === 'answer' && !ex.finished) {
      if (ex.pick === s.steps[ex.step].correct) return;
      const choice = Number(button.dataset.option);
      if (!Number.isInteger(choice) || choice < 0 || choice >= s.steps[ex.step].options.length) return;
      ex.pick = choice;
    } else if (action === 'next' && !ex.finished && ex.pick === s.steps[ex.step].correct) {
      if (ex.step < s.steps.length - 1) { ex.step++; ex.pick = null; }
      else { ex.finished = true; if (!done.includes(s.id)) done.push(s.id); save(); }
    } else return;
    const y = window.scrollY;
    renderScenario(s);
    if (action === 'answer') {
      window.scrollTo({top: y, behavior: 'instant'});
      document.getElementById('life-feedback')?.focus({preventScroll: true});
    } else if (sessions[s.id].finished) {
      window.scrollTo({top: 0, behavior: 'instant'});
      main.focus({preventScroll: true});
    } else {
      const heading = document.getElementById('life-question');
      heading?.scrollIntoView({block: 'start', behavior: 'instant'});
      heading?.focus({preventScroll: true});
    }
  });

  window.CourseExtras = {
    home, teacher, sources,
    render(parts) {
      if (parts[0] === 'dolgoletie') { renderLong(); return true; }
      if (parts[0] === 'life') {
        const s = scenarios.find(item => item.id === parts[1]);
        if (s) renderScenario(s); else renderLife();
        return true;
      }
      return false;
    }
  };
})();
