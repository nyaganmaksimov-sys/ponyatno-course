(() => {
  'use strict';
  const O = window.EducationOrganization, catalog = window.EducationCatalog;
  const intake = window.CenterIntake.create(localStorage), main = document.getElementById('main');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const all = O.programs.filter(p => p.kind === 'studio' || ['family', 'senior'].includes(p.id));
  const pById = id => all.find(p => p.id === id);
  const defaultCategories = { 'creative-studio':'art', engineering:'development', 'logic-chess':'development', 'music-psychology':'development', english:'english', 'school-preparation':'development', family:'support', senior:'digital' };
  const category = p => p.category || defaultCategories[p.id] || 'support';
  const categoryName = id => O.categories.find(c => c.id === id)?.title || 'Занятия центра';
  const ageTitle = id => catalog.groups.find(g => g.id === id)?.age || id;
  const publicCopy = {
    speech: 'Обсудим развитие речи ребёнка и подберём подходящий формат занятий с логопедом.',
    neuro: 'Консультация по вопросам развития и обучения ребёнка. Обсудим запрос семьи и дальнейшие шаги.',
    defect: 'Обсудим потребности ребёнка и поддержку в обучении и развитии.',
    'child-psych': 'Разговор с детским психологом о чувствах, общении и ситуациях, которые волнуют ребёнка и семью.',
    'clinical-psych': 'Консультация по вашему запросу. Содержание встречи и формат поддержки обсудим заранее.',
    logorhythm: 'Соединяем речь, музыку и движение в игровых заданиях. Содержание занятий подбирает специалист.',
    tiffany: 'Знакомимся с витражом Тиффани. Работаем с цветом и композицией, обсуждаем материалы и технику.',
    mosaic: 'Собираем картинку из отдельных фрагментов. Пробуем сочетания цвета, формы и фактуры.',
    mandala: 'Создаём объёмные мандалы, придумываем узоры и экспериментируем с цветом.',
    ceramics: 'Знакомимся с керамикой и создаём собственные работы. Формат и материалы обсудим перед встречей.',
    relief: 'Пробуем объёмное изображение: придумываем сюжет и создаём рельефную композицию.',
    'cotton-toy': 'Знакомимся с техникой ватной игрушки и придумываем своего персонажа.',
    painting: 'Экспериментируем с объёмом, цветом и фактурой в скульптурной и интерьерной живописи.',
    'panel-art': 'Создаём декоративное панно. Выбираем технику, материалы и сюжет для своей работы.',
    doll: 'Придумываем образ и характер авторской куклы. Знакомимся с материалами и этапами создания.',
    'pottery-daily': 'Пробуем работу с глиной и создаём свою первую вещь. Время мастер-класса согласуем с центром.'
  };
  const description = p => publicCopy[p.id] || p.description;
  const publicAudience = p => String(p.audience || 'Подберём подходящий формат').split(';')[0].trim();
  const options = (items, selected) => items.map(([id,title]) => `<option value="${esc(id)}" ${id === selected ? 'selected' : ''}>${esc(title)}</option>`).join('');
  const drawings = {
    sun: '<circle cx="16" cy="16" r="6"/><path d="M16 2v4m0 20v4M2 16h4m20 0h4M6 6l3 3m14 14 3 3M6 26l3-3M23 9l3-3"/>',
    development: '<path d="M5 13 16 5l11 8v15H5Zm6 15V17h10v11M3 13 16 3l13 10"/><path d="M14 10h4"/>',
    art: '<path d="m20 4 7 7-14 14-9 3 3-9Z M17 7l7 7M7 19l6 6M4 28l2-6"/>',
    specialists: '<path d="M16 28S3 20 3 11a7 7 0 0 1 13-3 7 7 0 0 1 13 3c0 9-13 17-13 17Z"/>',
    english: '<rect x="3" y="4" width="26" height="21" rx="4"/><path d="m8 25-1 5 8-5M9 18l4-9 4 9m-6-3h4M21 10h3m-3 4h3m-3 4h3"/>',
    pottery: '<path d="M10 5h12v6c0 4 5 6 5 12s-22 6-22 0 5-8 5-12Zm0 4h12M7 26h18M13 2h6"/>',
    workshops: '<path d="m5 24 9-18 4 2-9 18ZM19 16l8-9 3 3-8 9M3 29h26M15 22l4 4 5-5"/>',
    events: '<path d="m5 27 6-20 15 15-21 5Zm5-17 13 13M22 3l-2 6m8-1-4 4m6 6-6-1M5 3l4 3"/>',
    support: '<circle cx="11" cy="10" r="5"/><circle cx="24" cy="12" r="4"/><path d="M2 29v-6a9 9 0 0 1 18 0v6m1-10a7 7 0 0 1 9 7v3"/>',
    digital: '<rect x="8" y="2" width="17" height="28" rx="4"/><path d="M13 6h7M15 26h3"/>'
  };
  const symbol = key => `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawings[key] || drawings.sun}</svg>`;
  const sunSeal = '<svg viewBox="0 0 120 120" aria-hidden="true"><path fill="currentColor" d="m60 0 9 17 17-9 1 20 20-1-9 18 22 8-17 12 10 17-21 2 1 21-20-8-11 20-11-19-18 9-2-21-20 1 9-19L0 64l18-12L7 35l22-2-1-20 20 8Z"/><circle cx="45" cy="56" r="3" fill="#302a2a"/><circle cx="72" cy="56" r="3" fill="#302a2a"/><path d="M43 71q17 17 34-1" stroke="#302a2a" fill="none" stroke-width="3" stroke-linecap="round"/></svg>';
  const title = (label, heading, body = '') => `<div class="page-head"><span class="eyebrow">${esc(label)}</span><h1>${esc(heading)}</h1>${body ? `<p class="muted">${esc(body)}</p>` : ''}</div>`;
  function card(p) {
    return `<article class="card" data-category="${category(p)}"><div class="card-head"><span class="card-mark">${symbol(category(p))}</span><span class="card-category">${esc(categoryName(category(p)))}</span></div><h2>${esc(p.title)}</h2><p>${esc(description(p))}</p><p><span class="pill">${esc(publicAudience(p))}</span></p><a class="card-detail" href="#program/${p.id}">О занятии</a></article>`;
  }
  function contactsBlock() {
    return `<div class="contact-panel"><section class="contact-card"><span class="eyebrow">Давайте знакомиться</span><h2>Здесь начинается<br>что-то хорошее.</h2><p>Расскажите, что интересно вам или ребёнку. Мы поможем выбрать занятие и договоримся о первой встрече.</p><a class="phone" href="tel:+79336983639">${esc(O.phone)}</a><div class="actions"><a class="button primary" href="#apply">Оставить заявку</a><a class="text-link" href="${esc(O.vkUrl)}" target="_blank" rel="noopener noreferrer">Написать ВКонтакте</a></div></section><section class="contact-card"><span class="map-label">МЫ РЯДОМ · МОСКВА, ИЗМАЙЛОВО</span><p class="address-large">10-я Парковая улица,<br>дом 3</p><p>Приходите по предварительной договорённости — поможем сориентироваться на месте.</p><div class="entry-note"><strong>Калитки 2, 3, 4, 5</strong><p>Для входа позвоните <a href="tel:+79336983639">+7 (933) 698-36-39</a> и назовите номер калитки.</p></div><div class="actions"><a class="text-link" href="https://yandex.ru/maps/?text=${encodeURIComponent(O.address)}" target="_blank" rel="noopener noreferrer">Открыть на карте</a></div></section></div>`;
  }
  function home() {
    const directionRows = [
      ['development','Узнавать и удивляться','Подготовка к школе, шахматы, логика и инженерные занятия.'],
      ['specialists','Расти с поддержкой','Логопед, психолог и музыкальные занятия с психологом.'],
      ['english','Знакомиться с миром','Английский через творчество, игру и живое общение.'],
      ['pottery','Создавать своими руками','Гончарное мастерство, керамика и первые собственные работы.']
    ];
    return `<section class="hero" aria-labelledby="hero-title"><div class="hero-copy"><span class="eyebrow">Центр ментального развития · Измайлово</span><h1 id="hero-title">Радость<br> быть<br> <em>вместе.</em></h1><p>Рисовать, придумывать, учиться новому и находить друзей. Занятия для детей и взрослых в «Солнечных лисятах».</p><div class="actions"><a class="button primary" href="#directions">Найти своё занятие</a><a class="text-link" href="#about">Познакомимся?</a></div><span class="hero-location">АНО «Солнечные лисята» · 10-я Парковая, 3</span></div><div class="hero-photo"><img src="../assets/family/together.jpg" alt="Мама и дочь вместе рисуют цветными карандашами — иллюстративная фотография" width="1920" height="1080" fetchpriority="high"><span class="sun-seal">${sunSeal}</span><span class="hero-caption">Разные —<br>значит вместе!</span></div></section>
      <div class="hero-bottom" aria-label="Наш подход"><span>Творить</span>${symbol('sun')}<span>Пробовать новое</span>${symbol('sun')}<span>Дружить</span>${symbol('sun')}<span>Быть собой</span></div>
      <section class="section discover"><div class="section-head"><div><span class="eyebrow">Каждому — своё увлечение</span><h2>Маленькие открытия.<br>Большая радость.</h2></div><p>Начните с того, что нравится. Остальному научимся вместе.</p></div><div class="discover-grid"><a class="art-feature" href="#directions/art"><img src="../assets/family/painting.jpg" alt="Детские руки в краске — творческий процесс" width="1000" height="667" loading="lazy"><span class="feature-tag">Можно фантазировать!</span><div class="art-feature-copy"><h3>Творить — здорово.</h3><p>Рисование, лепка, театр и мастерские для больших и маленьких.</p></div></a><div class="direction-list">${directionRows.map(([id,heading,body]) => `<a class="direction-item" href="#directions/${id}"><span class="direction-symbol">${symbol(id)}</span><div><h3>${heading}</h3><p>${body}</p></div></a>`).join('')}</div></div><div class="more-directions"><a href="#directions/workshops">Творческие мастер-классы</a><a href="#directions/events">Семейные праздники</a><a href="#directions/support">Семейная школа</a><a href="#directions">Все направления</a></div></section>
      <section class="section together-section"><div class="together-copy"><span class="eyebrow">Разные — значит вместе</span><h2>У каждого —<br>свой темп.<br><span>И свой талант.</span></h2><p>Кому-то легко начать разговор. Кому-то нужно больше времени. Мы хотим, чтобы у каждого было место для общения, творчества и собственных маленьких побед.</p><a class="button line-light" href="#about">Больше о нашем центре</a></div><div class="support-list"><article><h3>Можно быть собой</h3><p>Принимаем детей с разными особенностями развития, в том числе с синдромом Дауна. Обсуждаем, какая поддержка нужна именно вашему ребёнку.</p></article><article><h3>Можно пробовать и ошибаться</h3><p>Рисуем, играем, исследуем. Учимся замечать не только результат, но и удовольствие от самого занятия.</p></article><article><h3>Можно вместе с семьёй</h3><p>Родители — рядом. Помогаем выбрать формат, в котором ребёнку будет понятнее и спокойнее.</p></article></div></section>
      <section class="family-section"><div class="family-photo"><img src="../assets/family/generations.jpg" alt="Женщина старшего возраста занимается живописью — иллюстративная фотография" width="1000" height="1500" loading="lazy"></div><div class="family-copy"><span class="eyebrow">Интересно в любом возрасте</span><h2>Новое увлечение?<br>Самое время.</h2><p>Здесь есть место и детским открытиям, и взрослым интересам. Творчество объединяет, а общие занятия дают повод чаще встречаться.</p><div class="family-options"><a href="#directions/workshops">Творческие мастерские<small>Керамика, мозаика, витраж и другие техники</small></a><a href="#program/senior">Цифровая уверенность<small>Знакомство с полезными возможностями телефона и компьютера</small></a><a href="#contacts">Московское долголетие<small>Актуальные группы и условия участия уточняйте у центра</small></a></div></div></section>
      <section class="section first-step"><div><span class="eyebrow">Первый шаг — самый простой</span><h2>Давайте<br>попробуем!</h2><p>Не обязательно сразу знать, какое направление выбрать. Начнём с разговора.</p><a class="button primary" href="#apply">Помогите выбрать занятие</a></div><ol class="first-step-list"><li><h3>Расскажите о себе</h3><p>Что нравится, сколько лет участнику и что хочется попробовать.</p></li><li><h3>Выберем подходящий формат</h3><p>Обсудим группу, расписание и поддержку, которая может понадобиться.</p></li><li><h3>Встретимся в центре</h3><p>Договоримся о времени и подскажем, как к нам пройти.</p></li></ol></section>
      <section class="section">${contactsBlock()}<div class="faq"><details><summary>Как выбрать занятие, если пока не определились?</summary><p>Позвоните или оставьте заявку. Расскажите о возрасте и интересах участника — обсудим несколько подходящих направлений.</p></details><details><summary>Можно ли прийти ребёнку с особенностями развития?</summary><p>Да, центр открыт для разных детей. Перед первым посещением обсудим необходимую поддержку и подходящий формат участия.</p></details><details><summary>Где посмотреть расписание и условия участия?</summary><p>Наличие мест, время занятий и условия участия уточнит координатор по телефону ${esc(O.phone)} или в группе ВКонтакте.</p></details></div></section>`;
  }
  function directions(filter) {
    const selected = O.categories.some(c => c.id === filter) ? filter : 'all';
    const items = all.filter(p => selected === 'all' || category(p) === selected);
    return title('Направления центра','Найдём занятие по интересам','Возраст, наличие групп, расписание и условия участия уточняет координатор.') + `<nav class="catalog-controls" aria-label="Категории занятий"><a href="#directions" class="${selected === 'all' ? 'selected' : ''}">Все направления</a>${O.categories.map(c => `<a href="#directions/${c.id}" class="${selected === c.id ? 'selected' : ''}">${esc(c.title)}</a>`).join('')}</nav><div class="cards">${items.map(card).join('')}</div>${items.length ? '' : '<p class="notice">Поможем подобрать направление при личном обращении.</p>'}<div class="actions"><a class="button primary" href="#apply">Помогите выбрать</a><a class="button" href="#contacts">Связаться с центром</a></div>`;
  }
  function program(id) {
    const p = pById(id);
    if (!p) return directions();
    return title(categoryName(category(p)),p.title,description(p)) + `<div class="program-layout"><section class="panel"><h2>Что можно попробовать</h2>${p.activities?.length ? `<ul>${p.activities.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : `<p>${esc(description(p))}</p>`}<div class="tags"><span class="pill">${esc(publicAudience(p))}</span><span class="pill">${esc(p.format || 'Формат обсудим с координатором')}</span></div><p>Подберём подходящую группу или индивидуальный формат с учётом интересов, возраста и необходимой поддержки. Содержание и расписание уточним перед началом занятий.</p><a class="button" href="#directions/${category(p)}">Другие направления</a></section><aside class="panel"><span class="eyebrow">Первый шаг</span><h2>Обсудим участие</h2><p>Оставьте заявку или позвоните нам. Поможем разобраться в вариантах занятий.</p><div class="actions"><a class="button primary" href="#apply/${p.id}">Заявка на это направление</a><a class="button" href="tel:+79336983639">${esc(O.phone)}</a></div></aside></div>`;
  }
  function about() {
    return title('АНО «Солнечные лисята»','Место, где можно быть собой.','Развиваться, общаться, создавать и поддерживать друг друга.') + `<div class="about-story"><img src="../assets/family/pottery.jpg" width="1200" height="800" alt="Совместная работа с глиной — иллюстративная фотография"><div><h2>Разные интересы.<br>Общие открытия.</h2><p>Мы создали «Солнечных лисят», чтобы у детей было пространство, где можно пробовать новое, раскрывать таланты и находить друзей.</p><p>Каждый ребёнок уникален. Мы уважаем его особенности, характер и темп. Центр открыт для детей с особенностями развития, в том числе с синдромом Дауна.</p><p>Взрослых и старшее поколение приглашаем на творческие и развивающие занятия. Актуальные форматы и условия участия обсудим лично.</p><a class="button primary" href="#apply">Давайте познакомимся</a></div></div><section class="panel"><h2>Об организации</h2><p>${esc(O.fullName)}</p><dl class="org-data"><div><dt>ИНН</dt><dd>${esc(O.inn)}</dd></div><div><dt>ОГРН</dt><dd>${esc(O.ogrn)}</dd></div><div><dt>Адрес занятий</dt><dd>${esc(O.address)}</dd></div></dl><a class="text-link" href="${esc(O.source)}" target="_blank" rel="noopener noreferrer">Карточка организации</a></section><section class="panel"><h2>Занятия продолжаются дома</h2><p>В учебной системе «Умные Лисята» можно заниматься самостоятельно, выполнять задания и получать обратную связь преподавателя. Для семьи всё собрано в одном кабинете.</p><a class="button" href="../education/?v=showcase1#showcase">Посмотреть демо кабинета</a><details><summary>Как развивается система центра</summary><p>После завершения демо планируется размещение рабочей системы в собственном дата-центре проекта — на сервере HPE. Это позволит управлять хранением данных, доступами и резервными копиями. Сейчас сайт и система работают как GitHub-демо.</p></details></section>`;
  }
  function photos() {
    return title('Об изображениях','Фотографии для настроения','На демонстрационном сайте используются иллюстративные фотографии. Они не являются фотографиями помещений, сотрудников или участников центра.') + `<section class="panel"><ul class="credits-list"><li><a href="https://unsplash.com/photos/mother-and-daughter-drawing-together-at-a-table--GIyD_NkhkU" target="_blank" rel="noopener noreferrer">Совместное рисование — Vitaly Gariev / Unsplash</a></li><li><a href="https://unsplash.com/photos/childs-hands-covered-in-paint-creating-art-2SA60mUllYY" target="_blank" rel="noopener noreferrer">Детское творчество — Jonathan Borba / Unsplash</a></li><li><a href="https://www.pexels.com/photo/elderly-female-painter-with-brush-and-color-palette-at-home-10120009/" target="_blank" rel="noopener noreferrer">Живопись — Ron Lach / Pexels</a></li><li><a href="https://www.pexels.com/photo/people-molding-a-clay-6694737/" target="_blank" rel="noopener noreferrer">Работа с глиной — cottonbro studio / Pexels</a></li></ul><p>Снимки используются по лицензиям <a href="https://unsplash.com/license" target="_blank" rel="noopener noreferrer">Unsplash</a> и <a href="https://www.pexels.com/license/" target="_blank" rel="noopener noreferrer">Pexels</a>. Логотип «Солнечные лисята» предоставлен для проекта.</p></section>`;
  }
  function apply(id) {
    const selected = pById(id) || all[0], audiences = intake.A.allowed(selected.id);
    const token = 'public-' + (crypto.randomUUID?.() || Date.now().toString(36));
    return title('Запись на занятия','Начнём с знакомства.','Выберите направление и расскажите, что вам интересно.') + `<div class="form-layout"><section class="panel"><form id="public-application"><p class="form-note">Это демонстрационная заявка. Используйте вымышленные имя и контакт. Для реальной записи позвоните в центр.</p><input type="hidden" name="token" value="${token}"><label>Интересующее направление<select name="programId" id="program-choice">${options(all.map(p => [p.id,p.title]),selected.id)}</select></label><label>Возрастное направление<select name="audience" id="age-choice" required>${options(audiences.map(a => [a,ageTitle(a)]),audiences[0])}</select></label><label>Имя участника<input name="name" required minlength="2" maxlength="80" autocomplete="off" placeholder="Например: Учебный участник"></label><label>Контактное лицо<input name="contactName" required minlength="2" maxlength="80" autocomplete="off" placeholder="Вымышленное имя взрослого или участника"></label><label>Телефон или учебный контакт<input name="contact" required minlength="3" maxlength="100" autocomplete="off" placeholder="В демо можно написать: Демо-контакт 01"></label><label>Что вам интересно?<textarea name="note" maxlength="500" rows="3" placeholder="Интересы и удобное время. Диагнозы и документы в форме не нужны."></textarea></label><label class="check"><input type="checkbox" name="demo" required><span>Подтверждаю, что использую вымышленные данные для демонстрации заявки.</span></label><button class="primary" type="submit">Отправить учебную заявку</button><p class="feedback" id="form-feedback" role="status" aria-live="polite"></p></form></section><aside><section class="panel"><h2>Что будет дальше</h2><p>Учебная заявка появится у координатора. В демо можно посмотреть подбор группы, решение и переход в кабинет участника.</p><p>Для детской заявки координатор отдельно свяжет профиль сопровождающего перед зачислением.</p></section><section class="panel"><h2>Нужен совет?</h2><p>О реальных занятиях и условиях участия можно уточнить у центра.</p><a class="phone" href="tel:+79336983639">${esc(O.phone)}</a></section></aside></div>`;
  }
  function status(id) {
    let a;
    try { a = intake.get(id); } catch (e) { return title('Заявка','Не удалось открыть статус',e.message); }
    if (!a || a.source !== 'public-site') return title('Заявка','Заявка не найдена','Откройте сохранённую учебную заявку в том же браузере.') + '<a class="button" href="#requests">Мои заявки</a>';
    return title('Учебная заявка', intake.number(a) + ' · ' + a.name, pById(a.programId)?.title || intake.A.program(a.programId)?.title) + `<section class="panel status-card"><span class="pill">${esc(intake.A.statuses[a.status])}</span><h2 style="margin-top:1rem">${a.status === 'enrolled' ? 'Учебный профиль включён в группу' : 'Заявка сохранена в демонстрации'}</h2><p>${esc(a.decision || 'Следующий шаг — рассмотрение координатором и подбор подходящего формата.')}</p><p class="muted">Номер заявки: ${intake.number(a)}. История будет обновляться после действий координатора в этом браузере.</p><div class="actions"><a class="button primary" href="../education/?v=showcase1#application/${a.id}/manage">Показать обработку координатором</a>${a.status === 'enrolled' ? `<a class="button" href="../education/?v=showcase1#student/${a.learnerId}">Учебный кабинет</a>` : ''}<a class="button" href="#requests">Мои заявки</a></div></section><section class="panel status-card"><h2>История заявки</h2><ol class="history">${a.history.map(h => `<li><b>${esc(intake.A.statuses[h.status])}</b><p>${esc(h.message)}</p><small>${new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'}).format(new Date(h.at))} МСК</small></li>`).join('')}</ol></section>`;
  }
  function requests() {
    const items = intake.receipts();
    return title('Мои учебные заявки','Заявки с сайта центра','Показаны заявки, созданные на этом сайте в текущем браузере.') + (items.length ? `<div class="cards">${items.map(a => `<article class="card"><span class="pill">${esc(intake.A.statuses[a.status])}</span><h2>${intake.number(a)} · ${esc(a.name)}</h2><p>${esc(intake.A.program(a.programId)?.title)}</p><a class="button" href="#status/${a.id}">Посмотреть статус</a></article>`).join('')}</div>` : '<section class="panel"><h2>Пока нет заявок</h2><p>Выберите направление и попробуйте учебную форму.</p><a class="button primary" href="#apply">Подобрать занятия</a></section>');
  }
  function render() {
    const [route, id] = location.hash.slice(1).split('/');
    const pages = { directions: () => directions(id), program: () => program(id), about, contacts: () => title('Контакты','Увидимся в Измайлово.','Приходите знакомиться — договоримся об удобном времени.') + contactsBlock(), photos, apply: () => apply(id), status: () => status(id), requests };
    main.className = pages[route] ? 'interior' : 'home-page';
    main.innerHTML = (pages[route] ? '<a class="back-home" href="#home">На главную</a>' : '') + (pages[route] || home)();
    document.getElementById('site-nav').classList.remove('is-open');
    document.getElementById('menu-toggle').setAttribute('aria-expanded','false');
    document.querySelectorAll('#site-nav a').forEach(link => {
      if (link.hash.slice(1) === route) link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    });
    document.title = (main.querySelector('h1')?.textContent || 'Главная').replace(/\s+/g,' ').trim() + ' — АНО «Солнечные лисята»';
    window.scrollTo(0,0); main.focus({preventScroll:true});
  }
  main.addEventListener('change', e => {
    if (e.target.id !== 'program-choice') return;
    const age = document.getElementById('age-choice'), allowed = intake.A.allowed(e.target.value);
    age.innerHTML = options(allowed.map(a => [a,ageTitle(a)]),allowed.includes(age.value) ? age.value : allowed[0]);
  });
  main.addEventListener('submit', e => {
    if (e.target.id !== 'public-application') return;
    e.preventDefault();
    const form = e.target, feedback = document.getElementById('form-feedback'), button = form.querySelector('button[type=submit]');
    button.disabled = true;
    try { const a = intake.request(Object.fromEntries(new FormData(form))); location.hash = '#status/' + a.id; }
    catch (error) { feedback.textContent = error.message || 'Заявку не удалось сохранить. Попробуйте ещё раз.'; feedback.tabIndex = -1; feedback.focus(); button.disabled = false; }
  });
  document.getElementById('menu-toggle').addEventListener('click', () => {
    const open = document.getElementById('site-nav').classList.toggle('is-open');
    document.getElementById('menu-toggle').setAttribute('aria-expanded',String(open));
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !document.getElementById('site-nav').classList.contains('is-open')) return;
    document.getElementById('site-nav').classList.remove('is-open');
    document.getElementById('menu-toggle').setAttribute('aria-expanded','false');
    document.getElementById('menu-toggle').focus();
  });
  document.querySelector('.skip').addEventListener('click', e => { e.preventDefault(); main.focus(); });
  window.addEventListener('hashchange', render);
  window.addEventListener('storage', e => { if (e.key === intake.key && ['status','requests'].includes(location.hash.slice(1).split('/')[0])) render(); });
  render();
})();
