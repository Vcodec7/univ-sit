/**
 * Lightweight lexicon tone for a thread (not a moderator, not ML).
 * Kind vs harsh words in Russian youth chat — shown as a 0–100 “шкала общения”.
 */

const KIND = [
  'спасибо',
  'благодар',
  'пожалуйста',
  'супер',
  'круто',
  'класс',
  'огонь',
  'люблю',
  'рад',
  'рада',
  'здорово',
  'молодец',
  'обнял',
  'обняла',
  'поддержи',
  'вместе',
  'удачи',
  'успех',
  'добро',
  'милый',
  'милая',
  'кайф',
  'топ',
  'вау',
  'ок',
  'окей',
  'хорошо',
  'норм',
  'согласен',
  'согласна',
  'пожалуйста',
  'извини',
  'прости',
];

const HARSH = [
  'дурак',
  'дура',
  'идиот',
  'тупой',
  'тупая',
  'ненавиж',
  'убей',
  'сдох',
  'дебил',
  'мраз',
  'твар',
  'заткнись',
  'пошёл',
  'пошла',
  'нахер',
  'нахуй',
  'блять',
  'сука',
  'пизд',
  'ебан',
  'урод',
  'гнид',
  'токсик',
  'бесишь',
  'заткни',
  'отвали',
  'ненавижу',
];

export type ChatTone = {
  score: number;
  kindHits: number;
  harshHits: number;
  label: string;
  hint: string;
};

function countHits(text: string, stems: string[]) {
  let n = 0;
  for (const s of stems) {
    if (text.includes(s)) n += 1;
  }
  return n;
}

export function threadTone(bodies: string[]): ChatTone {
  const blob = bodies
    .filter(Boolean)
    .join('\n')
    .toLowerCase()
    .replace(/ё/g, 'е');
  if (!blob.trim()) {
    return { score: 55, kindHits: 0, harshHits: 0, label: 'нейтрально', hint: 'Напишите пару фраз — шкала оживает' };
  }
  const kindHits = countHits(blob, KIND);
  const harshHits = countHits(blob, HARSH);
  const raw = 55 + kindHits * 8 - harshHits * 14;
  const score = Math.max(8, Math.min(100, raw));
  let label = 'спокойно';
  let hint = 'Диалог ровный';
  if (score >= 78) {
    label = 'тепло';
    hint = 'Много добрых слов';
  } else if (score <= 32) {
    label = 'напряжённо';
    hint = 'Жёсткая лексика — лучше смягчить тон';
  } else if (kindHits + harshHits === 0) {
    label = 'нейтрально';
    hint = 'Пока без явного тона';
  }
  return { score, kindHits, harshHits, label, hint };
}
