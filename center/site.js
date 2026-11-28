(() => {
  'use strict';
  const O = window.EducationOrganization, catalog = window.EducationCatalog;
  const intake = window.CenterIntake.create(localStorage), main = document.getElementById('main');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const all = O.programs.filter(p => p.kind === 'studio' || ['family', 'senior'].includes(p.id));
  const pById = id => all.find(p => p.id === id);
  const defaultCategories = { 'creative-studio':'art', engineering:'development', 'logic-chess':'development', 'music-psychology':'development', english:'english', 'school-preparation':'development', family:'support', senior:'digital' };
  const category = p => p.category || defaultCategories[p.id] || 'support';
  const categoryLabels = { development:'Развитие и обучение', specialists:'Занятия со специалистами', english:'Английский язык', art:'Творческая студия', workshops:'Мастер-классы', pottery:'Гончарная студия', events:'Праздники', support:'Поддержка семьи', digital:'Компьютер и телефон' };
  const categoryName = id => categoryLabels[id] || 'Занятия центра';
  const ageLabels = {preschool:'Дошкольники · 3–6 лет',junior:'Школьники · 7–10 лет',teen:'Подростки · 11–17 лет',adult:'Взрослые · 18+',senior:'Старшее поколение',parents:'Семейные занятия'};
  const ageTitle = id => ageLabels[id] || id;
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
  const titleLabels = {engineering:'Инженерные занятия','logic-chess':'Шахматы и логика','music-psychology':'Музыка с психологом',english:'Английский для школьников','english-preschool':'Английский для дошкольников',senior:'Компьютер и телефон'};
  const programTitle = p => titleLabels[p.id] || p.title;
  // Separate preschool English already has its own public programme.
  const allowedAges = id => intake.A.allowed(id).filter(age => id !== 'english' || age !== 'preschool');
  const publicAudience = p => {
    const a = allowedAges(p.id), kids = ['preschool','junior','teen'].filter(id => a.includes(id));
    if (kids.length && a.includes('adult')) return 'Детям и взрослым';
    if (kids.length && a.includes('parents')) return 'Детям и родителям';
    if (a.length === 1 && a[0] === 'preschool') return 'Дошкольникам';
    if (a.length === 1 && a[0] === 'senior') return 'Старшему поколению';
    if (kids.length) return a.includes('preschool') ? 'Детям' : 'Школьникам';
    return 'Взрослым';
  };
  const publicCategories = O.categories.map(c => ({...c,title:categoryName(c.id)}));
  const ages = ['preschool','junior','teen','adult','senior','parents'].map(id => ({id,title:ageTitle(id)}));
  const finder = window.CenterCatalogue.create(all.map(p => ({...p,title:programTitle(p),description:description(p),category:category(p),audiences:allowedAges(p.id),aliases:[p.title]})),publicCategories,ages);
  let currentCatalogHash = '#directions', formDraft = {};
  const applyHash = p => {
    const age = finder.read(currentCatalogHash).age;
    return '#apply/' + p.id + (allowedAges(p.id).includes(age) ? '?age=' + age : '');
  };
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
  const title = (label, heading, body = '') => `<div class="page-head"><span class="eyebrow">${esc(label)}</span><h1>${esc(heading)}</h1>${body ? `<p class="muted">${esc(body)}</p>` : ''}</div>`;
  function card(p) {
    return `<article class="card" data-category="${category(p)}"><div class="card-head"><span class="card-category">${esc(categoryName(category(p)))}</span></div><h2><a class="program-link" href="#program/${p.id}?back=${encodeURIComponent(currentCatalogHash)}">${esc(programTitle(p))}</a></h2><p>${esc(description(p))}</p><p class="card-audience">${esc(publicAudience(p))}</p><span class="card-detail" aria-hidden="true">Подробнее</span></article>`;
  }
  function contactsBlock() {
    return `<div class="contact-panel"><section class="contact-card"><span class="eyebrow">Контакты</span><h2>Позвоните или напишите нам</h2><p>Ответим на вопросы о занятиях, расписании и условиях участия. Если ещё не выбрали направление, расскажите о возрасте и интересах участника.</p><a class="phone" href="tel:+79336983639">${esc(O.phone)}</a><div class="actions"><a class="button primary" href="#apply">Оставить заявку</a><a class="text-link" href="${esc(O.vkUrl)}" target="_blank" rel="noopener noreferrer">Написать ВКонтакте</a></div></section><section class="contact-card"><span class="map-label">МОСКВА · ИЗМАЙЛОВО</span><p class="address-large">10-я Парковая улица,<br>дом 3</p><p>Перед первым посещением договоритесь с нами о времени.</p><div class="entry-note"><strong>Вход через калитки 2, 3, 4, 5</strong><p>Позвоните <a href="tel:+79336983639">+7 (933) 698-36-39</a> и назовите номер калитки, у которой стоите.</p></div><div class="actions"><a class="text-link" href="https://yandex.ru/maps/?text=${encodeURIComponent(O.address)}" target="_blank" rel="noopener noreferrer">Построить маршрут</a></div></section></div>`;
  }
  function home() {
    const directionRows = [
      ['development','Развитие и обучение','Подготовка к школе, шахматы, логика и конструирование.'],
      ['specialists','Занятия со специалистами','Логопед, психолог, нейропсихолог и музыка с психологом.'],
      ['english','Английский язык','Отдельные направления для дошкольников и школьников.'],
      ['pottery','Гончарная студия','Курсы и мастер-классы по работе с глиной.']
    ];
    const shortcuts = [['preschool','3–6 лет','Дошкольникам'],['junior','7–10 лет','Школьникам'],['teen','11–17 лет','Подросткам'],['adult','18+','Взрослым'],['senior','Старшее поколение','Занятия и общение'],['parents','Семьям','Детям и родителям']];
    return `<section class="hero" aria-labelledby="hero-title"><div class="hero-copy"><span class="eyebrow">Центр ментального развития · Измайлово</span><h1 id="hero-title">Занятия<br> для детей<br> и взрослых</h1><p>Рисование и лепка, английский, подготовка к школе, шахматы и занятия со специалистами.</p><div class="actions"><a class="button primary" href="#directions">Выбрать занятие</a><a class="text-link" href="#contacts">Связаться с центром</a></div><a class="hero-location" href="#contacts">Москва, 10-я Парковая улица, 3 · Как пройти</a></div><div class="hero-photo"><img src="../assets/family/together.jpg" alt="Совместное рисование взрослого и ребёнка — иллюстративная фотография" width="1920" height="1080" fetchpriority="high"></div></section>
      <section class="age-section" aria-labelledby="age-title"><h2 id="age-title">Для кого ищете занятия?</h2><div class="age-shortcuts">${shortcuts.map(([id,heading,body]) => `<a href="${finder.toHash({age:id})}"><strong>${heading}</strong><span>${body}</span></a>`).join('')}</div></section>
      <section class="section discover"><div class="section-head"><div><span class="eyebrow">Занятия центра</span><h2>Выберите направление</h2></div><a class="text-link" href="#directions">Все занятия</a></div><div class="discover-grid"><a class="art-feature" href="#directions/art"><img src="../assets/family/painting.jpg" alt="Руки ребёнка в краске — иллюстрация творческого занятия" width="1000" height="667" loading="lazy"><div class="art-feature-copy"><h3>Творческая студия</h3><p>Рисование, лепка и театральные занятия для детей и взрослых.</p></div></a><div class="direction-list">${directionRows.map(([id,heading,body]) => `<a class="direction-item" href="#directions/${id}"><span class="direction-symbol">${symbol(id)}</span><div><h3>${heading}</h3><p>${body}</p></div></a>`).join('')}</div></div><div class="more-directions"><a href="#directions/workshops">Творческие мастер-классы</a><a href="#directions/events">Праздники и мероприятия</a><a href="#directions/support">Поддержка семьи</a></div></section>
      <section class="section together-section"><div class="together-copy"><span class="eyebrow">Поддержка ребёнка и семьи</span><h2>Если ребёнку<br>нужна поддержка</h2><p>В центре занимаются дети с разными особенностями развития, в том числе с синдромом Дауна. Перед первой встречей обсудим, что важно учесть на занятиях.</p><a class="button line-light" href="#directions/support">Направления поддержки</a></div><div class="support-list"><article><h3>Расскажите о своём запросе</h3><p>Что даётся ребёнку легко, а где нужна помощь. Диагнозы и документы в форме заявки указывать не нужно.</p></article><article><h3>Обсудим формат</h3><p>Поможем сориентироваться в направлениях и уточним условия участия.</p></article><article><h3>Согласуем участие семьи</h3><p>Обсудим сопровождение ребёнка и вопросы, с которыми родители хотят обратиться к специалисту.</p></article></div></section>
      <section class="family-section"><div class="family-photo"><img src="../assets/family/generations.jpg" alt="Женщина занимается живописью — иллюстративная фотография" width="1000" height="1500" loading="lazy"></div><div class="family-copy"><span class="eyebrow">Взрослым и старшему поколению</span><h2>Мастерские<br>и новые навыки</h2><p>Можно попробовать керамику, мозаику, витраж или другое творческое направление. Для старшего поколения есть занятия по работе с компьютером и телефоном.</p><div class="family-options"><a href="#directions/workshops?age=adult">Творческие мастер-классы<small>Посмотреть техники и выбрать занятие</small></a><a href="#program/senior">Компьютер и телефон<small>Занятия для старшего поколения</small></a><a href="#contacts">Московское долголетие<small>Группы и условия участия уточняйте по телефону центра</small></a></div></div></section>
      <section class="section">${contactsBlock()}<div class="faq"><h2>Перед первым посещением</h2><details><summary>Как узнать расписание и стоимость?</summary><p>Позвоните ${esc(O.phone)} или напишите нам ВКонтакте. Расскажем о времени занятий, наличии мест и условиях участия по выбранному направлению.</p></details><details><summary>Что делать, если мы ещё не выбрали занятие?</summary><p>Посмотрите каталог по возрасту или свяжитесь с нами. Расскажите, что интересно вам или ребёнку — обсудим подходящие варианты.</p></details><details><summary>Как попасть в центр?</summary><p>Договоритесь с нами о времени визита. На месте позвоните и назовите номер калитки: 2, 3, 4 или 5.</p></details></div></section>`;
  }
  function resultMarkup(state) {
    const items = finder.find(state);
    return items.length ? items.map(card).join('') : `<section class="catalog-empty"><h2>По этим условиям занятий не найдено</h2><p>Попробуйте другое слово, возраст или направление. Можно также позвонить нам: <a href="tel:+79336983639">${esc(O.phone)}</a>.</p><button type="button" class="primary" data-reset-filters>Сбросить фильтры</button></section>`;
  }
  function updateCatalogue() {
    const form = document.getElementById('catalog-filter');
    if (!form) return;
    const state = finder.clean(Object.fromEntries(new FormData(form)));
    currentCatalogHash = finder.toHash(state);
    history.replaceState(null,'',currentCatalogHash);
    document.getElementById('catalog-results').innerHTML = resultMarkup(state);
    document.getElementById('catalog-count').textContent = 'Найдено занятий: ' + finder.find(state).length;
    document.getElementById('reset-catalogue').hidden = state.age === 'all' && state.category === 'all' && !state.q;
  }
  function directions() {
    const state = finder.read(location.hash), count = finder.find(state).length;
    currentCatalogHash = finder.toHash(state);
    const active = state.age !== 'all' || state.category !== 'all' || state.q;
    return title('Каталог','Занятия в центре','Ищите по названию, возрасту или направлению. Расписание и условия участия уточним перед записью.') + `<form id="catalog-filter" class="catalog-filter" role="search" aria-label="Поиск занятий"><label for="catalog-query">Что ищете?<input type="search" id="catalog-query" name="q" maxlength="120" value="${esc(state.q)}" placeholder="Например: шахматы или рисование" aria-controls="catalog-results"></label><label for="catalog-age">Для кого<select id="catalog-age" name="age">${options([['all','Любой возраст'],...ages.map(a => [a.id,a.title])],state.age)}</select></label><label for="catalog-category">Направление<select id="catalog-category" name="category">${options([['all','Все направления'],...publicCategories.map(c => [c.id,c.title])],state.category)}</select></label><button class="primary" type="submit">Найти</button></form><div class="catalog-summary"><p id="catalog-count" tabindex="-1" role="status" aria-live="polite" aria-atomic="true">Найдено занятий: ${count}</p><button class="reset-link" type="button" id="reset-catalogue" data-reset-filters ${active ? '' : 'hidden'}>Сбросить фильтры</button></div><div class="cards" id="catalog-results" aria-label="Список занятий">${resultMarkup(state)}</div><div class="catalog-help"><div><h2>Нужна помощь с выбором?</h2><p>Позвоните или напишите нам. Обсудим возраст, интересы и подходящие занятия.</p></div><a class="button" href="#contacts">Контакты центра</a></div>`;
  }
  function program(id, params) {
    const p = pById(id);
    if (!p) return directions();
    const back = params?.get('back');
    if (back?.startsWith('#directions')) currentCatalogHash = finder.toHash(finder.read(back));
    return title(categoryName(category(p)),programTitle(p),description(p)) + `<div class="program-layout"><section class="panel"><dl class="program-facts"><div><dt>Кому подойдёт</dt><dd>${esc(publicAudience(p))}</dd></div><div><dt>Формат</dt><dd>${esc(p.format?.split(';')[0] || 'Уточним при записи')}</dd></div></dl><h2>На занятиях</h2>${p.activities?.length ? `<ul>${p.activities.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : `<p>${esc(description(p))}</p>`}<p class="muted">Возраст, расписание и наличие мест уточняем перед записью. Если нужна дополнительная поддержка, обсудите это с нами заранее.</p></section><aside class="panel"><h2>Запись на занятие</h2><p>Оставьте заявку на это направление или свяжитесь с центром.</p><a class="button primary" href="${applyHash(p)}">Оставить заявку</a><a class="program-phone" href="tel:+79336983639">${esc(O.phone)}</a><a class="text-link" href="${esc(O.vkUrl)}" target="_blank" rel="noopener noreferrer">Написать ВКонтакте</a></aside></div>`;
  }
  function about() {
    return title('Об организации','Центр «Солнечные лисята»','Занятия для детей и взрослых в московском районе Измайлово.') + `<div class="about-story"><img src="../assets/family/pottery.jpg" width="1200" height="800" alt="Совместная работа с глиной — иллюстративная фотография"><div><h2>Творчество, обучение<br>и поддержка семьи</h2><p>«Солнечные лисята» — некоммерческая организация в Измайлово. В центре проходят творческие и развивающие занятия, мастер-классы и встречи со специалистами.</p><p>Центр открыт для детей с особенностями развития, в том числе с синдромом Дауна. Перед началом занятий обсуждаем необходимую поддержку и условия участия.</p><p>Для взрослых есть творческие мастерские, а для старшего поколения — занятия по работе с компьютером и телефоном. Узнать о действующих группах можно по телефону центра.</p><a class="button primary" href="#apply">Оставить заявку</a></div></div><section class="panel"><h2>Об организации</h2><p>${esc(O.fullName)}</p><dl class="org-data"><div><dt>ИНН</dt><dd>${esc(O.inn)}</dd></div><div><dt>ОГРН</dt><dd>${esc(O.ogrn)}</dd></div><div><dt>Адрес занятий</dt><dd>${esc(O.address)}</dd></div></dl><a class="text-link" href="${esc(O.source)}" target="_blank" rel="noopener noreferrer">Карточка организации</a></section><section class="panel"><h2>Занятия продолжаются дома</h2><p>В учебной системе «Умные Лисята» можно заниматься самостоятельно, выполнять задания и получать обратную связь преподавателя. Для семьи всё собрано в одном кабинете.</p><a class="button" href="../education/?v=showcase1#showcase">Посмотреть демо кабинета</a><details><summary>Как развивается система центра</summary><p>После завершения демо планируется размещение рабочей системы в собственном дата-центре проекта — на сервере HPE. Это позволит управлять хранением данных, доступами и резервными копиями. Сейчас сайт и система работают как GitHub-демо.</p></details></section>`;
  }
  function photos() {
    return title('Об изображениях','Фотографии на сайте','На демонстрационном сайте используются иллюстративные фотографии. Они не являются фотографиями помещений, сотрудников или участников центра.') + `<section class="panel"><ul class="credits-list"><li><a href="https://unsplash.com/photos/mother-and-daughter-drawing-together-at-a-table--GIyD_NkhkU" target="_blank" rel="noopener noreferrer">Совместное рисование — Vitaly Gariev / Unsplash</a></li><li><a href="https://unsplash.com/photos/childs-hands-covered-in-paint-creating-art-2SA60mUllYY" target="_blank" rel="noopener noreferrer">Детское творчество — Jonathan Borba / Unsplash</a></li><li><a href="https://www.pexels.com/photo/elderly-female-painter-with-brush-and-color-palette-at-home-10120009/" target="_blank" rel="noopener noreferrer">Живопись — Ron Lach / Pexels</a></li><li><a href="https://www.pexels.com/photo/people-molding-a-clay-6694737/" target="_blank" rel="noopener noreferrer">Работа с глиной — cottonbro studio / Pexels</a></li></ul><p>Снимки используются по лицензиям <a href="https://unsplash.com/license" target="_blank" rel="noopener noreferrer">Unsplash</a> и <a href="https://www.pexels.com/license/" target="_blank" rel="noopener noreferrer">Pexels</a>. Логотип «Солнечные лисята» предоставлен для проекта.</p></section>`;
  }
  function apply(id, params) {
    const selected = pById(id) || pById(formDraft.programId) || all[0], audiences = allowedAges(selected.id);
    const preferred = params?.get('age') || formDraft.audience || finder.read(currentCatalogHash).age;
    const age = audiences.includes(preferred) ? preferred : audiences[0], child = ['preschool','junior','teen'].includes(age);
    const token = formDraft.token || 'public-' + (crypto.randomUUID?.() || Date.now().toString(36));
    formDraft = {...formDraft,token,programId:selected.id,audience:age};
    return title('Запись','Заявка на занятие','Выберите направление. Расскажите, как к вам обращаться и как с вами связаться.') + `<div class="form-layout"><section class="panel"><form id="public-application"><p class="form-note">Демонстрационная форма: используйте вымышленные данные. Для настоящей записи <a href="tel:+79336983639">позвоните в центр</a>.</p><input type="hidden" name="token" value="${esc(token)}"><fieldset><legend>О занятии</legend><label for="program-choice">Направление<select name="programId" id="program-choice">${options(all.map(p => [p.id,programTitle(p)]),selected.id)}</select></label><label for="age-choice">Кто будет заниматься<select name="audience" id="age-choice" required>${options(audiences.map(a => [a,ageTitle(a)]),age)}</select></label></fieldset><fieldset><legend>Как с вами связаться</legend><label for="participant-name">Имя участника<input id="participant-name" name="name" required minlength="2" maxlength="80" autocomplete="off" value="${esc(formDraft.name || '')}" placeholder="В демо: Участник 01"></label><label id="guardian-contact" for="contact-name" ${child ? '' : 'hidden'}>Ваше имя<input id="contact-name" name="contactName" ${child ? 'required' : 'disabled'} minlength="2" maxlength="80" autocomplete="off" value="${esc(formDraft.contactName || '')}" placeholder="В демо: Родитель 01"><small>Имя взрослого, который записывает ребёнка</small></label><label for="contact-phone">Телефон или контакт для связи<input id="contact-phone" name="contact" required minlength="3" maxlength="100" autocomplete="off" value="${esc(formDraft.contact || '')}" placeholder="В демо: Демо-контакт 01"></label><label for="application-note">Комментарий <span class="optional">необязательно</span><textarea id="application-note" name="note" maxlength="500" rows="3" placeholder="Например: интересует вечерняя группа. Диагнозы и документы не нужны.">${esc(formDraft.note || '')}</textarea></label></fieldset><label class="check"><input type="checkbox" name="demo" required ${formDraft.demo ? 'checked' : ''}><span>Использую вымышленные данные для проверки демоверсии.</span></label><button class="primary" type="submit">Отправить заявку</button><p class="feedback" id="form-feedback" role="status" aria-live="polite"></p></form></section><aside><section class="panel"><h2>Перед записью</h2><p>Расписание, наличие мест и условия участия уточняются в центре.</p><a class="program-phone" href="tel:+79336983639">${esc(O.phone)}</a><a class="text-link" href="${esc(O.vkUrl)}" target="_blank" rel="noopener noreferrer">Написать ВКонтакте</a></section><section class="panel"><h2>Как работает демо</h2><p>После отправки появится номер и статус заявки. Её обработку можно посмотреть в кабинете координатора.</p><p>Демонстрация сохраняет заявки в этом браузере.</p></section></aside></div>`;
  }
  function updateContactFields() {
    const form = document.getElementById('public-application');
    if (!form) return;
    const child = ['preschool','junior','teen'].includes(form.elements.audience.value);
    const field = document.getElementById('contact-name');
    document.getElementById('guardian-contact').hidden = !child;
    field.disabled = !child; field.required = child;
  }
  function status(id) {
    let a;
    try { a = intake.get(id); } catch (e) { return title('Заявка','Не удалось открыть статус',e.message); }
    if (!a || a.source !== 'public-site') return title('Заявка','Заявка не найдена','Откройте сохранённую учебную заявку в том же браузере.') + '<a class="button" href="#requests">Мои заявки</a>';
    return title('Заявка с сайта', intake.number(a) + ' · ' + a.name, pById(a.programId)?.title || intake.A.program(a.programId)?.title) + `<section class="panel status-card"><span class="pill">${esc(intake.A.statuses[a.status])}</span><h2 style="margin-top:1rem">${a.status === 'enrolled' ? 'Участник зачислен в демогруппу' : 'Заявка сохранена'}</h2><p>${esc(a.decision || 'Следующий шаг — рассмотрение координатором и подбор подходящего формата.')}</p><p class="muted">Номер заявки: ${intake.number(a)}. История будет обновляться после действий координатора в этом браузере.</p><div class="actions">${a.status === 'enrolled' ? `<a class="button" href="../education/?v=showcase1#student/${a.learnerId}">Учебный кабинет</a>` : ''}<a class="button" href="#requests">Мои заявки</a></div></section><section class="panel status-card"><h2>История заявки</h2><details class="demo-inspector"><summary>Обработка заявки в демоверсии</summary><a class="button" href="../education/?v=showcase1#application/${a.id}/manage">Открыть у координатора</a></details><ol class="history">${a.history.map(h => `<li><b>${esc(intake.A.statuses[h.status])}</b><p>${esc(h.message)}</p><small>${new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'}).format(new Date(h.at))} МСК</small></li>`).join('')}</ol></section>`;
  }
  function requests() {
    const items = intake.receipts();
    return title('Мои заявки','Заявки с сайта центра','Показаны заявки, созданные на этом сайте в текущем браузере.') + (items.length ? `<div class="cards">${items.map(a => `<article class="card"><span class="pill">${esc(intake.A.statuses[a.status])}</span><h2>${intake.number(a)} · ${esc(a.name)}</h2><p>${esc(intake.A.program(a.programId)?.title)}</p><a class="button" href="#status/${a.id}">Посмотреть статус</a></article>`).join('')}</div>` : '<section class="panel"><h2>Пока нет заявок</h2><p>Выберите направление и попробуйте учебную форму.</p><a class="button primary" href="#apply">Подобрать занятия</a></section>');
  }
  function render() {
    const [path, query = ''] = location.hash.slice(1).split('?');
    const [route, id] = path.split('/'), params = new URLSearchParams(query);
    const pages = {directions, program: () => program(id,params), about, contacts: () => title('Контакты','Как связаться и пройти в центр','Москва, Измайлово, 10-я Парковая улица, дом 3.') + contactsBlock(), photos, apply: () => apply(id,params), status: () => status(id), requests};
    main.className = pages[route] ? 'interior' : 'home-page';
    document.body.dataset.page = route || 'home';
    const content = (pages[route] || home)();
    const back = route === 'program' ? [currentCatalogHash,'Вернуться к занятиям'] : route === 'apply' && pById(id) ? ['#program/' + id,'Вернуться к занятию'] : ['#home','На главную'];
    main.innerHTML = (pages[route] ? `<a class="back-home" href="${esc(back[0])}">${back[1]}</a>` : '') + content;
    document.getElementById('site-nav').classList.remove('is-open');
    document.getElementById('menu-toggle').setAttribute('aria-expanded','false');
    document.querySelectorAll('#site-nav a').forEach(link => {
      if (link.hash.slice(1) === route || route === 'program' && link.hash === '#directions') link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    });
    document.title = (main.querySelector('h1')?.textContent || 'Главная').replace(/\s+/g,' ').trim() + ' — АНО «Солнечные лисята»';
    window.scrollTo(0,0); main.focus({preventScroll:true});
  }
  main.addEventListener('input', e => {
    if (e.target.id === 'catalog-query') updateCatalogue();
    if (e.target.form?.id === 'public-application') formDraft = {...formDraft,...Object.fromEntries(new FormData(e.target.form))};
  });
  main.addEventListener('click', e => {
    if (!e.target.closest('[data-reset-filters]')) return;
    const form = document.getElementById('catalog-filter');
    if (!form) return;
    form.elements.q.value = ''; form.elements.age.value = 'all'; form.elements.category.value = 'all';
    updateCatalogue(); document.getElementById('catalog-query').focus();
  });
  main.addEventListener('change', e => {
    if (e.target.form?.id === 'catalog-filter') { updateCatalogue(); return; }
    if (e.target.form?.id !== 'public-application') return;
    if (e.target.id === 'program-choice') {
      const age = document.getElementById('age-choice'), allowed = allowedAges(e.target.value);
      age.innerHTML = options(allowed.map(a => [a,ageTitle(a)]),allowed.includes(age.value) ? age.value : allowed[0]);
    }
    updateContactFields();
    formDraft = {...formDraft,...Object.fromEntries(new FormData(e.target.form)),demo:e.target.form.elements.demo.checked};
  });
  main.addEventListener('submit', e => {
    if (e.target.id === 'catalog-filter') { e.preventDefault(); updateCatalogue(); const count = document.getElementById('catalog-count'); count.focus({preventScroll:true}); count.scrollIntoView({block:'start'}); return; }
    if (e.target.id !== 'public-application') return;
    e.preventDefault();
    const form = e.target, feedback = document.getElementById('form-feedback'), button = form.querySelector('button[type=submit]');
    button.disabled = true;
    try {
      const values = Object.fromEntries(new FormData(form));
      if (!['preschool','junior','teen'].includes(values.audience)) values.contactName = values.name;
      const a = intake.request(values); formDraft = {}; location.hash = '#status/' + a.id;
    } catch (error) { feedback.textContent = error.message || 'Не удалось отправить заявку. Попробуйте ещё раз.'; feedback.tabIndex = -1; feedback.focus(); button.disabled = false; }
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
