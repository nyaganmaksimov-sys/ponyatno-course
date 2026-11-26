/* Organization identity and center activities supplied by the user. Groups and examples are fictional demo data. */
window.EducationOrganization = {
  product: 'Умные Лисята',
  tagline: 'Учимся и развиваемся вместе',
  name: 'АНО «Солнечные лисята»',
  fullName: 'Автономная некоммерческая организация поддержки социально значимых инициатив «Солнечные лисята»',
  inn: '9719090225',
  ogrn: '1267700313066',
  source: 'https://www.rusprofile.ru/id/1267700313066',
  vkUrl: 'https://vk.ru/club239727985',
  address: 'Москва, Измайлово, 10-я Парковая улица, дом 3',
  phone: '+7 (933) 698-36-39',
  invitation: 'Разные — значит вместе. Каждый ребёнок уникален: помогаем пробовать новое, общаться и развиваться в комфортном темпе.',
  programs: [
    { id: 'creative-studio', kind: 'studio', title: 'Творческая студия', subtitle: 'Творчество и мастерская', audiences: ['preschool', 'junior', 'teen'], audience: 'Дети · группу подберёт координатор', description: 'Рисуем, лепим, фантазируем и создаём собственные работы. Пробуем разные материалы и учимся выражать свои идеи через творчество.', activities: ['Рисование', 'Лепка', 'Творческие занятия'], groupIds: ['creative-demo'], icon: 'edit', seedGroup: { id: 'creative-demo', name: 'Творческая студия · демогруппа', audience: 'junior', teacher: 'Педагог 02', room: 'Кабинет 2', capacity: 6 } },
    { id: 'engineering', kind: 'studio', title: 'Инженерное направление', audiences: ['preschool', 'junior', 'teen'], audience: 'Дети · группу подберёт координатор', description: 'Конструируем, исследуем устройство окружающего мира и учимся воплощать собственные идеи в небольшие проекты.', activities: ['Конструирование', 'Исследования', 'Собственные проекты'], groupIds: ['engineering-demo'], icon: 'edit', seedGroup: { id: 'engineering-demo', name: 'Инженерные занятия · демогруппа', audience: 'junior', teacher: 'Педагог 01', room: 'Кабинет 1', capacity: 6 } },
    { id: 'logic-chess', kind: 'studio', title: 'Интеллект и логика', audiences: ['preschool', 'junior', 'teen'], audience: 'Дети · группу подберёт координатор', description: 'Шахматы и задания на мышление, внимание и память. Учимся анализировать, искать решения и пробовать новые способы справляться с задачами.', activities: ['Шахматы', 'Мышление и внимание', 'Память и логика'], groupIds: ['logic-demo'], icon: 'book', seedGroup: { id: 'logic-demo', name: 'Шахматы и логика · демогруппа', audience: 'junior', teacher: 'Педагог 01', room: 'Кабинет 1', capacity: 6 } },
    { id: 'music-psychology', kind: 'studio', title: 'Музыкальные занятия с психологом', audiences: ['preschool', 'junior', 'teen'], audience: 'Дети · группу подберёт координатор', description: 'Через музыку, игру и взаимодействие знакомимся с чувствами, учимся выражать эмоции и лучше понимать друг друга.', activities: ['Музыка и игра', 'Выражение чувств', 'Общение'], groupIds: ['music-demo'], icon: 'family', seedGroup: { id: 'music-demo', name: 'Музыкальные занятия · демогруппа', audience: 'preschool', teacher: 'Педагог 02', room: 'Кабинет 2', capacity: 6 } },
    { id: 'english', kind: 'studio', title: 'Английский язык', audiences: ['preschool', 'junior', 'teen'], audience: 'Дети · группу подберёт координатор', description: 'Знакомимся с английским через игры, интересные задания и живое общение. Пробуем понимать речь и говорить в доброжелательной обстановке.', activities: ['Игровые задания', 'Понимание речи', 'Живое общение'], groupIds: ['english-demo'], icon: 'book', seedGroup: { id: 'english-demo', name: 'Английский язык · демогруппа', audience: 'junior', teacher: 'Педагог 02', room: 'Кабинет 2', capacity: 6 } },
    { id: 'school-preparation', kind: 'studio', title: 'Подготовка к школе', audiences: ['preschool'], audience: 'Дошкольники · подбор группы с координатором', description: 'Развиваем речь, внимание, память и учебные навыки. Помогаем познакомиться со школьными задачами с интересом и уверенностью.', activities: ['Развитие речи', 'Внимание и память', 'Подготовка к обучению'], groupIds: ['school-demo'], icon: 'teacher', seedGroup: { id: 'school-demo', name: 'Подготовка к школе · демогруппа', audience: 'preschool', teacher: 'Педагог 01', room: 'Кабинет 1', capacity: 6 } },
    { id: 'family', audiences: ['preschool', 'junior', 'teen', 'parents'], title: 'Семья и развитие', audience: 'Дети и родители', description: 'Учимся вместе: понятные учебные материалы для детей, помощь родителям и совместная практика дома.', groupIds: ['children', 'families'], icon: 'family' },
    { id: 'senior', audiences: ['senior'], title: 'Цифровая уверенность', audience: 'Старшее поколение', description: 'Спокойно осваиваем цифровые навыки, разбираем жизненные ситуации и повторяем материал с поддержкой преподавателя.', groupIds: ['seniors'], icon: 'book' }
  ]
};
