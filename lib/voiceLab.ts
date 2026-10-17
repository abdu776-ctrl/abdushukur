// Voice lab: a Korean teacher asks, an Uzbek child (6–14) answers.
//
// The child's answer is spoken twice over in a sense: the cloned voice brings
// the child's own timbre, and the text sent to the speech engine is respelled
// the way an Uzbek beginner tends to pronounce it. A speech engine reads
// Hangul faithfully, so a respelled syllable is the only lever there is for
// an accent — there is no "accent" parameter to turn.
//
// The rules below are the common ones teachers of Uzbek learners report:
//   · Uzbek has no tense consonants: ㄲ ㄸ ㅃ ㅆ ㅉ come out plain.
//   · ㅓ and ㅗ are one vowel to an Uzbek ear, so ㅓ drifts to ㅗ.
//   · ㅡ has no Uzbek counterpart and becomes ㅜ (는 → 눈, 을 → 울).
//   · ㅐ / ㅔ and ㅚ / ㅙ / ㅞ collapse into one sound.
//   · Aspiration is weak for the youngest: ㅋ ㅌ ㅍ soften now and then.
//   · Final ㄹ before a vowel is often dropped from the liaison, and the
//     younger the child, the more hesitation fillers ("음…", "어…").
//
// Strength runs from 0 (textbook Korean) to 1 (a first-month beginner).

const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;

interface Syllable {
  cho: number;
  jung: number;
  jong: number;
}

function decompose(ch: string): Syllable | null {
  const code = ch.charCodeAt(0);
  if (code < HANGUL_START || code > HANGUL_END) return null;
  const offset = code - HANGUL_START;
  return { cho: Math.floor(offset / 588), jung: Math.floor((offset % 588) / 28), jong: offset % 28 };
}

function compose(s: Syllable): string {
  return String.fromCharCode(HANGUL_START + s.cho * 588 + s.jung * 28 + s.jong);
}

const ci = (j: string) => CHO.indexOf(j);
const vi = (j: string) => JUNG.indexOf(j);

/** Tense → plain. Applied with the full strength: the most reliable marker. */
const TENSE_TO_PLAIN: Record<number, number> = {
  [ci('ㄲ')]: ci('ㄱ'),
  [ci('ㄸ')]: ci('ㄷ'),
  [ci('ㅃ')]: ci('ㅂ'),
  [ci('ㅆ')]: ci('ㅅ'),
  [ci('ㅉ')]: ci('ㅈ'),
};

/** Aspirated → plain. Only some of the time, and mostly for the youngest. */
const ASPIRATED_TO_PLAIN: Record<number, number> = {
  [ci('ㅋ')]: ci('ㄱ'),
  [ci('ㅌ')]: ci('ㄷ'),
  [ci('ㅍ')]: ci('ㅂ'),
};

const VOWEL_SHIFT: Record<number, number> = {
  [vi('ㅓ')]: vi('ㅗ'),
  [vi('ㅕ')]: vi('ㅛ'),
  [vi('ㅐ')]: vi('ㅔ'),
  [vi('ㅙ')]: vi('ㅞ'),
  [vi('ㅚ')]: vi('ㅞ'),
  [vi('ㅢ')]: vi('ㅣ'),
};

/** Small deterministic PRNG, so the same line always sounds the same. */
function seeded(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 10_000) / 10_000;
  };
}

/**
 * Respell Korean the way an Uzbek child learner would say it.
 *
 * @param strength 0..1 — how strong the accent is.
 */
export function accentify(text: string, strength: number): string {
  const s = Math.max(0, Math.min(1, strength));
  if (s === 0) return text;
  const rand = seeded(text);
  const chars = [...text];

  const out = chars.map((ch, i) => {
    const syl = decompose(ch);
    if (!syl) return ch;

    if (TENSE_TO_PLAIN[syl.cho] !== undefined && rand() < 0.35 + 0.6 * s) {
      syl.cho = TENSE_TO_PLAIN[syl.cho];
    }
    if (ASPIRATED_TO_PLAIN[syl.cho] !== undefined && rand() < 0.4 * s) {
      syl.cho = ASPIRATED_TO_PLAIN[syl.cho];
    }
    if (VOWEL_SHIFT[syl.jung] !== undefined && rand() < 0.25 + 0.55 * s) {
      syl.jung = VOWEL_SHIFT[syl.jung];
    }
    // 스, 즈, 트 in loanwords (우즈베키스탄) are bare consonants to an Uzbek
    // speaker — Uzbek has clusters — so those stay; 는, 을, 은 do not.
    const sibilant = [ci('ㅅ'), ci('ㅆ'), ci('ㅈ'), ci('ㅉ'), ci('ㅊ'), ci('ㅌ')].includes(syl.cho);
    if (syl.jung === vi('ㅡ') && !sibilant && rand() < 0.3 + 0.5 * s) {
      syl.jung = vi('ㅜ');
    }
    if (JONG[syl.jong] === 'ㅆ' || JONG[syl.jong] === 'ㄲ') {
      syl.jong = JONG.indexOf(JONG[syl.jong] === 'ㅆ' ? 'ㅅ' : 'ㄱ');
    }
    // A final ㄹ that would link into the next vowel (발음 → 바름) is often
    // kept apart by a beginner instead; insert nothing, but keep the coda —
    // and at high strength, drop it altogether now and then.
    const next = decompose(chars[i + 1] ?? '');
    if (JONG[syl.jong] === 'ㄹ' && next && next.cho === ci('ㅇ') && rand() < 0.3 * s) {
      syl.jong = 0;
    }
    return compose(syl);
  });

  let result = out.join('');

  // Hesitation: one filler at the start, more often the stronger the accent.
  if (rand() < 0.2 + 0.6 * s) {
    const fillers = ['음… ', '어… ', '음, '];
    result = fillers[Math.floor(rand() * fillers.length)] + result;
  }
  return result;
}

/** Accent strength suggested by age: a six-year-old is newest to Korean. */
export function strengthForAge(age: number): number {
  const a = Math.max(6, Math.min(14, age));
  return Math.round((0.9 - ((a - 6) / 8) * 0.5) * 100) / 100;
}

// ── Dialogue ──────────────────────────────────────────────────────────────

export type Speaker = 'teacher' | 'child';

export interface DialogueLine {
  speaker: Speaker;
  /** What is said, in correct Korean. */
  ko: string;
  /** An Uzbek gloss, so a parent can follow along. */
  uz: string;
}

export interface Scenario {
  id: string;
  /** Uzbek title. */
  title: string;
  ko: string;
  minAge: number;
  lines: DialogueLine[];
}

const T = (ko: string, uz: string): DialogueLine => ({ speaker: 'teacher', ko, uz });
const C = (ko: string, uz: string): DialogueLine => ({ speaker: 'child', ko, uz });

/** Built-in lessons, so the page works with no AI key at all. */
export const SCENARIOS: Scenario[] = [
  {
    id: 'intro',
    title: 'Tanishuv',
    ko: '자기소개',
    minAge: 6,
    lines: [
      T('안녕하세요! 이름이 뭐예요?', 'Assalomu alaykum! Isming nima?'),
      C('안녕하세요. 제 이름은 {name}이에요.', 'Assalomu alaykum. Mening ismim {name}.'),
      T('몇 살이에요?', 'Necha yoshdasan?'),
      C('저는 {age}살이에요.', 'Men {age} yoshdaman.'),
      T('어느 나라에서 왔어요?', 'Qaysi davlatdan kelgansan?'),
      C('우즈베키스탄에서 왔어요.', 'Oʻzbekistondan kelganman.'),
      T('와, 정말요? 한국에 온 지 얼마나 됐어요?', 'Voy, rostdanmi? Koreyaga kelganingga qancha boʻldi?'),
      C('육 개월 됐어요. 한국어가 조금 어려워요.', 'Olti oy boʻldi. Koreys tili biroz qiyin.'),
      T('괜찮아요. 아주 잘하고 있어요!', 'Hechqisi yoʻq. Juda yaxshi gapiryapsan!'),
    ],
  },
  {
    id: 'family',
    title: 'Oila',
    ko: '가족',
    minAge: 6,
    lines: [
      T('가족이 몇 명이에요?', 'Oilangiz necha kishi?'),
      C('다섯 명이에요. 엄마, 아빠, 형, 여동생, 그리고 저예요.', 'Besh kishi. Onam, dadam, akam, singlim va men.'),
      T('엄마는 무슨 일을 하세요?', 'Onang nima ish qiladi?'),
      C('우리 엄마는 선생님이에요.', 'Onam oʻqituvchi.'),
      T('가족이랑 같이 한국에 살아요?', 'Oilang bilan birga Koreyada yashaysanmi?'),
      C('네, 아빠랑 엄마랑 같이 살아요. 할머니는 타슈켄트에 계세요.', 'Ha, dadam va onam bilan yashayman. Buvim Toshkentda.'),
    ],
  },
  {
    id: 'school',
    title: 'Maktab',
    ko: '학교',
    minAge: 7,
    lines: [
      T('학교에서 무슨 과목을 제일 좋아해요?', 'Maktabda qaysi fanni eng yaxshi koʻrasan?'),
      C('저는 수학을 제일 좋아해요.', 'Men matematikani eng yaxshi koʻraman.'),
      T('왜 수학을 좋아해요?', 'Nega matematikani yoqtirasan?'),
      C('숫자는 우즈베크어랑 한국어가 똑같아서 쉬워요.', 'Raqamlar oʻzbekchada ham koreyschada ham bir xil, shuning uchun oson.'),
      T('한국 친구가 있어요?', 'Koreys doʻsting bormi?'),
      C('네, 민준이라는 친구가 있어요. 같이 축구해요.', 'Ha, Minjun degan doʻstim bor. Birga futbol oʻynaymiz.'),
    ],
  },
  {
    id: 'food',
    title: 'Ovqat',
    ko: '음식',
    minAge: 6,
    lines: [
      T('무슨 음식을 좋아해요?', 'Qanday ovqatni yaxshi koʻrasan?'),
      C('저는 플로프를 좋아해요. 우즈베키스탄 음식이에요.', 'Men oshni yaxshi koʻraman. Oʻzbek taomi.'),
      T('한국 음식은 어때요? 김치 먹을 수 있어요?', 'Koreys taomlari qanday? Kimchi yeya olasanmi?'),
      C('김치는 조금 매워요. 그런데 떡볶이는 정말 맛있어요!', 'Kimchi biroz achchiq. Lekin tteokbokki juda mazali!'),
      T('하하, 떡볶이도 매운데요?', 'Haha, tteokbokki ham achchiq-ku?'),
      C('네, 그래도 맛있어요. 물을 많이 마셔요.', 'Ha, baribir mazali. Koʻp suv ichaman.'),
    ],
  },
  {
    id: 'weather',
    title: 'Ob-havo',
    ko: '날씨',
    minAge: 8,
    lines: [
      T('오늘 날씨가 어때요?', 'Bugun havo qanday?'),
      C('오늘은 날씨가 추워요. 바람이 많이 불어요.', 'Bugun havo sovuq. Shamol koʻp esyapti.'),
      T('우즈베키스탄의 겨울은 어때요?', 'Oʻzbekistonda qish qanday?'),
      C('우즈베키스탄도 겨울에 추워요. 눈도 와요.', 'Oʻzbekistonda ham qishda sovuq. Qor ham yogʻadi.'),
      T('여름에는요?', 'Yozda-chi?'),
      C('여름에는 아주 더워요. 사십 도까지 올라가요.', 'Yozda juda issiq. Qirq darajagacha koʻtariladi.'),
    ],
  },
  {
    id: 'hobby',
    title: 'Sevimli mashgʻulot',
    ko: '취미',
    minAge: 9,
    lines: [
      T('주말에 보통 뭐 해요?', 'Dam olish kunlari odatda nima qilasan?'),
      C('주말에는 친구들이랑 공원에서 자전거를 타요.', 'Dam olish kunlari doʻstlarim bilan bogʻda velosiped haydayman.'),
      T('취미가 뭐예요?', 'Qiziqishing nima?'),
      C('제 취미는 그림 그리기예요. 한국 만화를 그려요.', 'Mening qiziqishim rasm chizish. Koreys multfilmlarini chizaman.'),
      T('나중에 커서 뭐가 되고 싶어요?', 'Katta boʻlganda kim boʻlmoqchisan?'),
      C('저는 의사가 되고 싶어요. 한국이랑 우즈베키스탄에서 사람들을 돕고 싶어요.', 'Men shifokor boʻlmoqchiman. Koreya va Oʻzbekistonda odamlarga yordam bermoqchiman.'),
    ],
  },
  {
    id: 'study',
    title: 'Koreys tilini oʻrganish',
    ko: '한국어 공부',
    minAge: 10,
    lines: [
      T('한국어 공부가 어때요? 뭐가 제일 어려워요?', 'Koreys tilini oʻrganish qanday? Eng qiyini nima?'),
      C('발음이 제일 어려워요. "ㅓ"랑 "ㅗ"가 비슷하게 들려요.', 'Talaffuz eng qiyin. "ㅓ" va "ㅗ" bir xil eshitiladi.'),
      T('맞아요. 그럼 "어머니"를 말해 볼까요?', 'Toʻgʻri. Unda "어머니" deb aytib koʻr-chi?'),
      C('어머니.', 'Ona.'),
      T('아주 좋아요! 존댓말은 어때요?', 'Juda yaxshi! Hurmat shakli qanday?'),
      C('존댓말도 어려워요. 그래도 매일 연습하고 있어요.', 'Hurmat shakli ham qiyin. Lekin har kuni mashq qilyapman.'),
      T('정말 대단해요. 계속 열심히 해요!', 'Haqiqatan zoʻr. Shunday tirishqoq boʻlishda davom et!'),
    ],
  },
];

/** Fill a scenario's {name} / {age} placeholders. */
export function fillLine(line: DialogueLine, name: string, age: number): DialogueLine {
  // 이에요 after a final consonant, 예요 after a vowel: 아지즈예요, 자밀이에요.
  const last = decompose(name.slice(-1));
  const copula = last && last.jong === 0 ? '예요' : '이에요';
  const sub = (s: string) =>
    s.replaceAll('{name}이에요', name + copula).replaceAll('{name}', name).replaceAll('{age}', String(age));
  return { ...line, ko: sub(line.ko), uz: sub(line.uz) };
}

/** Korean age words read better than digits for a child's line. */
const NATIVE_AGES: Record<number, string> = {
  6: '여섯', 7: '일곱', 8: '여덟', 9: '아홉', 10: '열', 11: '열한', 12: '열두', 13: '열세', 14: '열네',
};

export function scenarioLines(scenario: Scenario, name: string, age: number): DialogueLine[] {
  return scenario.lines.map((l) => {
    const filled = fillLine(l, name, age);
    // "{age}살" reads as a digit to a speech engine ("육살"); Koreans say 여섯 살.
    return { ...filled, ko: filled.ko.replace(`${age}살`, `${NATIVE_AGES[age] ?? age} 살`) };
  });
}

// ── Voices kept on this device ────────────────────────────────────────────

export interface ClonedVoice {
  voiceId: string;
  label: string;
  createdAt: string;
}

const VOICES_KEY = 'koreer:voice-lab';

export function loadVoices(): Partial<Record<Speaker, ClonedVoice>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(VOICES_KEY);
    return raw ? (JSON.parse(raw) as Partial<Record<Speaker, ClonedVoice>>) : {};
  } catch {
    return {};
  }
}

export function saveVoices(voices: Partial<Record<Speaker, ClonedVoice>>): void {
  try {
    window.localStorage.setItem(VOICES_KEY, JSON.stringify(voices));
  } catch {
    // Storage disabled — the voice still works for this visit.
  }
}
