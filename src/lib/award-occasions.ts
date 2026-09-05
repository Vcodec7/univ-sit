import type { OfficialDocType, OfficialDocTemplate } from '@/lib/official-documents-shared';

/** Поводы как в жизни молодёжного центра — админ выбирает бланк, текст подставляется. */
export type AwardOccasionId =
  | 'custom'
  | 'contest_winner'
  | 'contest_place'
  | 'contest_participant'
  | 'event_volunteer'
  | 'event_speaker'
  | 'club_active'
  | 'dobro'
  | 'eco_action'
  | 'space_host'
  | 'mentor'
  | 'practice'
  | 'festival'
  | 'team_project'
  | 'media'
  | 'sport';

export type AwardOccasion = {
  id: AwardOccasionId;
  label: string;
  hint: string;
  type: OfficialDocType;
  template: OfficialDocTemplate;
  title: string;
  subtitle: string;
  body: string;
  achievementCode?: string;
};

export const AWARD_OCCASIONS: AwardOccasion[] = [
  {
    id: 'custom',
    label: 'Свой текст',
    hint: 'Пустой бланк — напишите за что сами',
    type: 'CERTIFICATE',
    template: 'classic',
    title: '',
    subtitle: '',
    body: '',
  },
  {
    id: 'contest_winner',
    label: 'Победа в конкурсе',
    hint: 'Диплом победителя',
    type: 'DIPLOMA',
    template: 'formal',
    title: 'Победа в конкурсе',
    subtitle: 'Молодёжный портал · номинация',
    body: 'За первое место и вклад в творческую и общественную жизнь сообщества.',
    achievementCode: 'OFFICIAL_DIPLOMA',
  },
  {
    id: 'contest_place',
    label: 'Призёр конкурса',
    hint: '2–3 место, спецприз',
    type: 'DIPLOMA',
    template: 'modern',
    title: 'Призёр конкурса',
    subtitle: 'Диплом призёра',
    body: 'За высокий результат в конкурсе и активное участие в жизни портала.',
    achievementCode: 'OFFICIAL_DIPLOMA',
  },
  {
    id: 'contest_participant',
    label: 'Участник конкурса',
    hint: 'Сертификат участника',
    type: 'CERTIFICATE',
    template: 'classic',
    title: 'Участник конкурса',
    subtitle: 'Сертификат участника',
    body: 'За участие в конкурсной программе и готовность пробовать себя.',
    achievementCode: 'OFFICIAL_CERTIFICATE',
  },
  {
    id: 'event_volunteer',
    label: 'Волонтёр мероприятия',
    hint: 'Благодарность за смену',
    type: 'GRATITUDE',
    template: 'classic',
    title: 'Волонтёр мероприятия',
    subtitle: 'Благодарность',
    body: 'За помощь на площадке: встреча гостей, навигация, атмосфера и забота о людях.',
    achievementCode: 'OFFICIAL_GRATITUDE',
  },
  {
    id: 'event_speaker',
    label: 'Спикер / ведущий',
    hint: 'Сертификат ведущего',
    type: 'CERTIFICATE',
    template: 'modern',
    title: 'Спикер программы',
    subtitle: 'Ведущий · модератор',
    body: 'За выступление, ведение сцены и умение держать зал.',
    achievementCode: 'OFFICIAL_CERTIFICATE',
  },
  {
    id: 'club_active',
    label: 'Актив клуба',
    hint: 'Почётная грамота актива',
    type: 'HONORARY',
    template: 'formal',
    title: 'Актив клуба',
    subtitle: 'Почётная грамота',
    body: 'За регулярную работу в клубе, командность и пример для сверстников.',
    achievementCode: 'OFFICIAL_HONORARY',
  },
  {
    id: 'dobro',
    label: 'Добровольчество',
    hint: 'Сертификат за добрые дела',
    type: 'CERTIFICATE',
    template: 'classic',
    title: 'Доброволец года',
    subtitle: 'Социальная активность',
    body: 'За добровольческие часы, помощь людям и проектам города.',
    achievementCode: 'OFFICIAL_CERTIFICATE',
  },
  {
    id: 'eco_action',
    label: 'Экоакция / субботник',
    hint: 'Забота о городе',
    type: 'CERTIFICATE',
    template: 'modern',
    title: 'Участник экоакции',
    subtitle: 'Чистый берег · зелёный жест',
    body: 'За участие в экологической акции и бережное отношение к городу и морю.',
    achievementCode: 'OFFICIAL_CERTIFICATE',
  },
  {
    id: 'space_host',
    label: 'Хозяин площадки',
    hint: 'Бронь зала, приём гостей',
    type: 'GRATITUDE',
    template: 'classic',
    title: 'Хозяин площадки',
    subtitle: 'Благодарность',
    body: 'За организацию встречи на площадке портала и заботу о гостях.',
    achievementCode: 'OFFICIAL_GRATITUDE',
  },
  {
    id: 'mentor',
    label: 'Наставник',
    hint: 'Почётная грамота ментора',
    type: 'HONORARY',
    template: 'formal',
    title: 'Наставник',
    subtitle: 'Почётная грамота',
    body: 'За сопровождение ребят, подсказки вовремя и передачу опыта.',
    achievementCode: 'OFFICIAL_HONORARY',
  },
  {
    id: 'practice',
    label: 'Практика / стажировка',
    hint: 'Сертификат прохождения',
    type: 'CERTIFICATE',
    template: 'classic',
    title: 'Практика на портале',
    subtitle: 'Сертификат',
    body: 'За прохождение практики, ответственность и вклад в рабочие задачи сообщества.',
    achievementCode: 'OFFICIAL_CERTIFICATE',
  },
  {
    id: 'festival',
    label: 'Фестиваль / форум',
    hint: 'Диплом участника форума',
    type: 'DIPLOMA',
    template: 'modern',
    title: 'Участник форума',
    subtitle: 'Молодёжный форум / фестиваль',
    body: 'За участие в форумной программе, нетворкинг и представление своего проекта.',
    achievementCode: 'OFFICIAL_DIPLOMA',
  },
  {
    id: 'team_project',
    label: 'Командный проект',
    hint: 'Знак отличия команды',
    type: 'AWARD',
    template: 'modern',
    title: 'Командный проект',
    subtitle: 'Знак отличия',
    body: 'За совместную работу над проектом: идея, реализация и презентация результата.',
  },
  {
    id: 'media',
    label: 'Медиа / пресс-центр',
    hint: 'Сертификат медиаволонтёра',
    type: 'CERTIFICATE',
    template: 'classic',
    title: 'Медиаволонтёр',
    subtitle: 'Пресс-центр',
    body: 'За съёмку, тексты и освещение жизни сообщества.',
    achievementCode: 'OFFICIAL_CERTIFICATE',
  },
  {
    id: 'sport',
    label: 'Спорт / зарядка',
    hint: 'Диплом за активность',
    type: 'DIPLOMA',
    template: 'classic',
    title: 'Спортивная активность',
    subtitle: 'Зарядка · турнир · выход',
    body: 'За участие в спортивной программе и поддержку здорового ритма сообщества.',
    achievementCode: 'OFFICIAL_DIPLOMA',
  },
];

export const AWARD_OCCASION_BY_ID: Record<string, AwardOccasion> = Object.fromEntries(
  AWARD_OCCASIONS.map((o) => [o.id, o])
);

export function parseAwardMeta(metaJson: string | null | undefined): {
  occasion?: AwardOccasionId;
} {
  if (!metaJson) return {};
  try {
    const raw = JSON.parse(metaJson) as { occasion?: string };
    if (raw.occasion && AWARD_OCCASION_BY_ID[raw.occasion]) {
      return { occasion: raw.occasion as AwardOccasionId };
    }
  } catch {
    /* ignore */
  }
  return {};
}
