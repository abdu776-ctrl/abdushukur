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
//   · Final ㄹ before a vowel is sometimes dropped from the liaison.
//
// Strength runs from 0 (textbook Korean, a fluent child) to 1 (a first-month
// beginner). Hesitation fillers and learner errors live in renderAnswer.

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
 * @param strength 0..1 — how strong the accent is. 0 returns the text as is.
 */
export function accentify(text: string, strength: number): string {
  const s = Math.max(0, Math.min(1, strength));
  if (s === 0) return text;
  const rand = seeded(text);
  const chars = [...text];

  return chars
    .map((ch, i) => {
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
      // A final ㄹ that would link into the next vowel (발음 → 바름) is
      // sometimes dropped instead by a beginner.
      const next = decompose(chars[i + 1] ?? '');
      if (JONG[syl.jong] === 'ㄹ' && next && next.cho === ci('ㅇ') && rand() < 0.3 * s) {
        syl.jong = 0;
      }
      return compose(syl);
    })
    .join('');
}

// ── How a child answers ───────────────────────────────────────────────────
//
// Not every child is a beginner. Some have lived in Korea for years, go to a
// Korean school and answer in natural, accent-free Korean with correct
// 존댓말. That is a full case here, not an exception: every answer can be
// rendered at any level, and the fluent one has its own, fuller text.

/** How much accent a child's voice carries. */
export type AccentLevel = 'none' | 'slight' | 'noticeable';

export const ACCENT_LEVELS: AccentLevel[] = ['none', 'slight', 'noticeable'];

/** Respelling strength, and how fast the child speaks, per accent level. */
export const ACCENT: Record<AccentLevel, { strength: number; rate: number }> = {
  none: { strength: 0, rate: 1 },
  slight: { strength: 0.4, rate: 0.95 },
  noticeable: { strength: 0.85, rate: 0.82 },
};

/** Stored with a cloned voice on the provider side, in English for the provider. */
export function accentDescription(level: AccentLevel, age: number): string {
  switch (level) {
    case 'none':
      return `A ${age}-year-old child who has grown up in Korea, speaks fluent, natural Korean with no foreign accent, clear and polite.`;
    case 'slight':
      return `A ${age}-year-old child from Uzbekistan learning Korean, speaks Korean with a slight Uzbek / Central Asian accent.`;
    case 'noticeable':
      return `A ${age}-year-old child from Uzbekistan who is new to Korean, speaks with a noticeable Uzbek accent, slowly and with hesitation.`;
  }
}

/** The four ways a child can answer, in the order the page lists them. */
export type AnswerStyle = 'learner' | 'selfCorrect' | 'polite' | 'fluent';

export const ANSWER_STYLES: AnswerStyle[] = ['learner', 'selfCorrect', 'polite', 'fluent'];

export interface LearnerErrors {
  /** Slipping into 반말 with a teacher. */
  banmal: boolean;
  /** The wrong particle form: 저은, 수학를. */
  grammar: boolean;
  /** 음… 어… */
  fillers: boolean;
}

export const NO_ERRORS: LearnerErrors = { banmal: false, grammar: false, fillers: false };

/** A level preset sets accent, style and errors together. */
export type Level = 'beginner' | 'intermediate' | 'fluent';

export const LEVELS: Level[] = ['beginner', 'intermediate', 'fluent'];

export interface ChildProfile {
  accent: AccentLevel;
  style: AnswerStyle;
  errors: LearnerErrors;
}

export const LEVEL_PRESETS: Record<Level, ChildProfile> = {
  beginner: { accent: 'noticeable', style: 'learner', errors: { banmal: true, grammar: true, fillers: true } },
  intermediate: { accent: 'slight', style: 'selfCorrect', errors: { banmal: true, grammar: false, fillers: true } },
  fluent: { accent: 'none', style: 'fluent', errors: NO_ERRORS },
};

/** The fluent style permits no learner errors; the page greys the toggles. */
export function errorsFor(style: AnswerStyle, errors: LearnerErrors): LearnerErrors {
  return style === 'fluent' ? NO_ERRORS : errors;
}

/** What a rendered answer did, so the page can explain it in Uzbek. */
export type AnswerNote = 'banmal' | 'selfCorrect' | 'grammar' | 'fillers' | 'accent' | 'fluent';

export interface Answer {
  /** What the child says, mistakes included. */
  said: string;
  /** What the speech engine reads: `said`, respelled for the accent. */
  spoken: string;
  /** The correct answer, for comparison when `said` differs. */
  correct: string;
  /** The accent it is spoken with: none for a fluent answer, whatever was asked. */
  accent: AccentLevel;
  /** Speaking rate relative to normal. */
  rate: number;
  notes: AnswerNote[];
}

/** Sentence by sentence, keeping each one's punctuation. */
function sentences(text: string): string[] {
  return text.match(/[^.!?…]+[.!?…]*\s*/g) ?? [text];
}

/** Polite → 반말, for the endings and pronouns a child actually slips on. */
export function toBanmal(text: string): string {
  return text
    .replace(/안녕하세요/g, '안녕')
    .replace(/감사합니다/g, '고마워')
    .replace(/반갑습니다/g, '반가워')
    .replace(/저희/g, '우리')
    .replace(/저는/g, '나는')
    .replace(/저도/g, '나도')
    .replace(/제가/g, '내가')
    .replace(/(^|\s)제 /g, '$1내 ')
    .replace(/(^|\s)네([,.!])/g, '$1응$2')
    .replace(/이에요/g, '이야')
    .replace(/예요/g, '야')
    .replace(/세요(?=[.!?…,"\s]|$)/g, '셔')
    .replace(/([가-힣])요(?=[.!?…,"\s]|$)/g, '$1');
}

/** The wrong form of a topic or object particle, as a beginner says it. */
function particleErrors(text: string, rand: () => number, force: boolean): string {
  const swap: Record<string, string> = { 은: '는', 는: '은', 을: '를', 를: '을' };
  let changed = false;
  const out = text.replace(/([가-힣])([은는을를])(?=[\s,.!?]|$)/g, (m, before: string, p: string) => {
    if (changed && !force) return m;
    // Leave verb forms alone (하는, 있는): those are not particles.
    if (/[하있없되]/.test(before)) return m;
    if (rand() < 0.6 || (force && !changed)) {
      changed = true;
      return before + swap[p];
    }
    return m;
  });
  return out;
}

/** Where the hesitations go: before the first sentence, and for a noticeable
 *  accent before the second too. Chosen once, so the shown text and the
 *  spoken text hesitate in the same places. */
function fillerPlan(level: AccentLevel, count: number, rand: () => number): string[] {
  const fillers = ['음… ', '어… ', '음, '];
  const pick = () => fillers[Math.floor(rand() * fillers.length)];
  return [pick(), level === 'noticeable' && count > 1 ? pick() : ''];
}

function withFillers(text: string, plan: string[]): string {
  const parts = sentences(text);
  parts[0] = plan[0] + parts[0];
  if (parts.length > 1) parts[1] = plan[1] + parts[1];
  return parts.join('');
}

export interface AnswerOptions {
  style: AnswerStyle;
  accent: AccentLevel;
  errors: LearnerErrors;
  /**
   * Show the style's mistakes on every line, not just on the share of lines
   * where they would naturally happen. Used for the variants, so each one
   * shows what makes it different.
   */
  force?: boolean;
}

/** Render a child's line in a given answer style. */
export function renderAnswer(line: DialogueLine, opts: AnswerOptions): Answer {
  const errors = errorsFor(opts.style, opts.errors);
  const rand = seeded(`${opts.style}|${line.ko}`);
  const notes: AnswerNote[] = [];

  if (opts.style === 'fluent') {
    const text = line.fluent ?? line.ko;
    return { said: text, spoken: text, correct: text, accent: 'none', rate: ACCENT.none.rate, notes: ['fluent'] };
  }

  const correct = line.ko;
  let said = correct;

  if (opts.style === 'learner' && errors.banmal && (opts.force || rand() < 0.7)) {
    said = toBanmal(said);
    if (said !== correct) notes.push('banmal');
  }
  if (opts.style === 'selfCorrect' && errors.banmal && (opts.force || rand() < 0.5)) {
    const [first, ...rest] = sentences(said);
    const slip = toBanmal(first).trim().replace(/[.!?…]+$/, '');
    if (slip !== first.trim().replace(/[.!?…]+$/, '')) {
      said = `${slip}… 아, ${first.trim()}${rest.length ? ' ' + rest.join('') : ''}`;
      notes.push('selfCorrect');
    }
  }
  if (errors.grammar) {
    const next = particleErrors(said, rand, !!opts.force);
    if (next !== said) notes.push('grammar');
    said = next;
  }

  // Fillers are added after the respelling, so 음 stays 음.
  let spoken = accentify(said, ACCENT[opts.accent].strength);
  if (opts.accent !== 'none') notes.push('accent');
  if (errors.fillers && opts.accent !== 'none' && (opts.force || rand() < 0.75)) {
    const plan = fillerPlan(opts.accent, sentences(said).length, rand);
    spoken = withFillers(spoken, plan);
    said = withFillers(said, plan);
    notes.push('fillers');
  }
  return {
    said: said.trim(),
    spoken: spoken.trim(),
    correct,
    accent: opts.accent,
    rate: ACCENT[opts.accent].rate,
    notes,
  };
}

// ── Dialogue ──────────────────────────────────────────────────────────────

export type Speaker = 'teacher' | 'child';

/** Voices: the teacher, the child, and a second child for "two children". */
export type VoiceSlot = 'teacher' | 'child' | 'child2';

export interface DialogueLine {
  speaker: Speaker;
  /** What is said, in correct Korean (correct 존댓말 for the child). */
  ko: string;
  /** An Uzbek gloss, so a parent can follow along. */
  uz: string;
  /**
   * A fluent child's answer: the same reply as a child who grew up in Korea
   * gives it — a little longer and more complete (저는, -는데, -이랑).
   */
  fluent?: string;
  fluentUz?: string;
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
const C = (ko: string, uz: string, fluent: string, fluentUz: string): DialogueLine => ({
  speaker: 'child',
  ko,
  uz,
  fluent,
  fluentUz,
});

/** Built-in lessons, so the page works with no AI key at all. */
export const SCENARIOS: Scenario[] = [
  {
    id: 'daily',
    title: 'Kundalik savollar',
    ko: '일상 질문',
    minAge: 6,
    lines: [
      T('오늘 아침에 뭐 먹었어요?', 'Bugun ertalab nima yeding?'),
      C('빵 먹었어요.', 'Non yedim.', '저는 오늘 아침에 빵이랑 우유를 먹었어요.', 'Men bugun ertalab non yeb, sut ichdim.'),
      T('숙제 했어요?', 'Uy vazifasini qildingmi?'),
      C('네, 했어요.', 'Ha, qildim.', '네, 어제 다 했어요.', 'Ha, kecha hammasini qilib qoʻydim.'),
      T('몇 살이에요?', 'Necha yoshdasan?'),
      C('{age}살이에요.', '{age} yoshdaman.', '저는 {age}살이에요.', 'Men {age} yoshdaman.'),
      T('한국어 어려워요?', 'Koreys tili qiyinmi?'),
      C('네, 어려워요.', 'Ha, qiyin.', '처음에는 어려웠는데, 지금은 괜찮아요.', 'Avvaliga qiyin edi, hozir yaxshi.'),
    ],
  },
  {
    id: 'intro',
    title: 'Tanishuv',
    ko: '자기소개',
    minAge: 6,
    lines: [
      T('안녕하세요! 이름이 뭐예요?', 'Assalomu alaykum! Isming nima?'),
      C('안녕하세요. 제 이름은 {name}이에요.', 'Assalomu alaykum. Mening ismim {name}.',
        '안녕하세요, 선생님. 제 이름은 {name}이에요. 만나서 반갑습니다.', 'Assalomu alaykum, ustoz. Mening ismim {name}. Tanishganimdan xursandman.'),
      T('몇 살이에요?', 'Necha yoshdasan?'),
      C('저는 {age}살이에요.', 'Men {age} yoshdaman.', '저는 올해 {age}살이에요.', 'Men bu yil {age} yoshdaman.'),
      T('어느 나라에서 왔어요?', 'Qaysi davlatdan kelgansan?'),
      C('우즈베키스탄에서 왔어요.', 'Oʻzbekistondan kelganman.',
        '저는 우즈베키스탄 타슈켄트에서 왔어요.', 'Men Oʻzbekistonning Toshkent shahridan kelganman.'),
      T('와, 정말요? 한국에 온 지 얼마나 됐어요?', 'Voy, rostdanmi? Koreyaga kelganingga qancha boʻldi?'),
      C('육 개월 됐어요. 한국어가 조금 어려워요.', 'Olti oy boʻldi. Koreys tili biroz qiyin.',
        '한국에 온 지 벌써 오 년이 됐어요. 그래서 이제 한국어가 편해요.', 'Koreyaga kelganimga besh yil boʻldi. Shuning uchun endi koreys tilida bemalol gapiraman.'),
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
      C('다섯 명이에요. 엄마, 아빠, 형, 여동생, 그리고 저예요.', 'Besh kishi. Onam, dadam, akam, singlim va men.',
        '저희 가족은 다섯 명이에요. 어머니, 아버지, 형, 여동생이랑 저예요.', 'Oilamiz besh kishi: onam, dadam, akam, singlim va men.'),
      T('엄마는 무슨 일을 하세요?', 'Onang nima ish qiladi?'),
      C('우리 엄마는 선생님이에요.', 'Onam oʻqituvchi.',
        '저희 어머니는 초등학교 선생님이세요.', 'Onam boshlangʻich maktab oʻqituvchisi.'),
      T('가족이랑 같이 한국에 살아요?', 'Oilang bilan birga Koreyada yashaysanmi?'),
      C('네, 아빠랑 엄마랑 같이 살아요. 할머니는 타슈켄트에 계세요.', 'Ha, dadam va onam bilan yashayman. Buvim Toshkentda.',
        '네, 부모님이랑 같이 살아요. 할머니는 타슈켄트에 계시는데, 방학 때마다 뵈러 가요.', 'Ha, ota-onam bilan yashayman. Buvim Toshkentda, har taʼtilda koʻrgani boraman.'),
    ],
  },
  {
    id: 'school',
    title: 'Maktab',
    ko: '학교',
    minAge: 7,
    lines: [
      T('학교에서 무슨 과목을 제일 좋아해요?', 'Maktabda qaysi fanni eng yaxshi koʻrasan?'),
      C('저는 수학을 제일 좋아해요.', 'Men matematikani eng yaxshi koʻraman.',
        '저는 수학을 제일 좋아해요. 어려운 문제를 풀 때 정말 재미있어요.', 'Men matematikani eng yaxshi koʻraman. Qiyin masala yechganda juda qiziq.'),
      T('왜 수학을 좋아해요?', 'Nega matematikani yoqtirasan?'),
      C('숫자는 우즈베크어랑 한국어가 똑같아서 쉬워요.', 'Raqamlar oʻzbekchada ham koreyschada ham bir xil, shuning uchun oson.',
        '숫자는 어느 나라 말로 해도 똑같아서 쉬운데, 문장으로 된 문제는 조금 어려워요.', 'Raqamlar qaysi tilda boʻlsa ham bir xil, shuning uchun oson; lekin matnli masalalar biroz qiyin.'),
      T('한국 친구가 있어요?', 'Koreys doʻsting bormi?'),
      C('네, 민준이라는 친구가 있어요. 같이 축구해요.', 'Ha, Minjun degan doʻstim bor. Birga futbol oʻynaymiz.',
        '네, 민준이라는 친한 친구가 있어요. 쉬는 시간마다 같이 축구해요.', 'Ha, Minjun degan yaqin doʻstim bor. Har tanaffusda birga futbol oʻynaymiz.'),
    ],
  },
  {
    id: 'food',
    title: 'Ovqat',
    ko: '음식',
    minAge: 6,
    lines: [
      T('무슨 음식을 좋아해요?', 'Qanday ovqatni yaxshi koʻrasan?'),
      C('저는 플로프를 좋아해요. 우즈베키스탄 음식이에요.', 'Men oshni yaxshi koʻraman. Oʻzbek taomi.',
        '저는 플로프를 제일 좋아해요. 우즈베키스탄 전통 음식인데, 할머니가 만들어 주시는 게 제일 맛있어요.', 'Men oshni eng yaxshi koʻraman. Bu oʻzbek milliy taomi, buvim pishirgani eng mazali.'),
      T('한국 음식은 어때요? 김치 먹을 수 있어요?', 'Koreys taomlari qanday? Kimchi yeya olasanmi?'),
      C('김치는 조금 매워요. 그런데 떡볶이는 정말 맛있어요!', 'Kimchi biroz achchiq. Lekin tteokbokki juda mazali!',
        '네, 김치는 이제 잘 먹어요. 그리고 떡볶이는 정말 좋아해요!', 'Ha, kimchini endi bemalol yeyman. Tteokbokkini esa juda yaxshi koʻraman!'),
      T('하하, 떡볶이도 매운데요?', 'Haha, tteokbokki ham achchiq-ku?'),
      C('네, 그래도 맛있어요. 물을 많이 마셔요.', 'Ha, baribir mazali. Koʻp suv ichaman.',
        '네, 맵긴 한데 그래서 더 맛있는 것 같아요.', 'Ha, achchigʻu, lekin shuning uchun yanada mazali tuyuladi.'),
    ],
  },
  {
    id: 'weather',
    title: 'Ob-havo',
    ko: '날씨',
    minAge: 8,
    lines: [
      T('오늘 날씨가 어때요?', 'Bugun havo qanday?'),
      C('오늘은 날씨가 추워요. 바람이 많이 불어요.', 'Bugun havo sovuq. Shamol koʻp esyapti.',
        '오늘은 날씨가 꽤 추워요. 바람도 많이 불어서 목도리를 하고 왔어요.', 'Bugun havo ancha sovuq. Shamol ham kuchli, shuning uchun sharf taqib keldim.'),
      T('우즈베키스탄의 겨울은 어때요?', 'Oʻzbekistonda qish qanday?'),
      C('우즈베키스탄도 겨울에 추워요. 눈도 와요.', 'Oʻzbekistonda ham qishda sovuq. Qor ham yogʻadi.',
        '우즈베키스탄도 겨울에는 추운 편이에요. 눈도 자주 와요.', 'Oʻzbekistonda ham qish ancha sovuq. Qor ham tez-tez yogʻadi.'),
      T('여름에는요?', 'Yozda-chi?'),
      C('여름에는 아주 더워요. 사십 도까지 올라가요.', 'Yozda juda issiq. Qirq darajagacha koʻtariladi.',
        '여름에는 정말 더워요. 사십 도까지 올라갈 때도 있어요.', 'Yozda juda issiq. Baʼzan qirq darajagacha koʻtariladi.'),
    ],
  },
  {
    id: 'hobby',
    title: 'Sevimli mashgʻulot',
    ko: '취미',
    minAge: 9,
    lines: [
      T('주말에 보통 뭐 해요?', 'Dam olish kunlari odatda nima qilasan?'),
      C('주말에는 친구들이랑 공원에서 자전거를 타요.', 'Dam olish kunlari doʻstlarim bilan bogʻda velosiped haydayman.',
        '주말에는 보통 친구들이랑 한강 공원에서 자전거를 타요.', 'Dam olish kunlari odatda doʻstlarim bilan Xangang bogʻida velosiped haydayman.'),
      T('취미가 뭐예요?', 'Qiziqishing nima?'),
      C('제 취미는 그림 그리기예요. 한국 만화를 그려요.', 'Mening qiziqishim rasm chizish. Koreys multfilmlarini chizaman.',
        '제 취미는 그림 그리기예요. 요즘은 좋아하는 웹툰 캐릭터를 따라 그리고 있어요.', 'Mening qiziqishim rasm chizish. Hozir yoqtirgan vebtun qahramonlarimni chizyapman.'),
      T('나중에 커서 뭐가 되고 싶어요?', 'Katta boʻlganda kim boʻlmoqchisan?'),
      C('저는 의사가 되고 싶어요. 한국이랑 우즈베키스탄에서 사람들을 돕고 싶어요.', 'Men shifokor boʻlmoqchiman. Koreya va Oʻzbekistonda odamlarga yordam bermoqchiman.',
        '저는 커서 의사가 되고 싶어요. 한국이랑 우즈베키스탄 두 나라에서 아픈 사람들을 돕고 싶어요.', 'Katta boʻlsam shifokor boʻlmoqchiman. Koreya va Oʻzbekiston — ikki davlatda bemorlarga yordam bermoqchiman.'),
    ],
  },
  {
    id: 'study',
    title: 'Koreys tilini oʻrganish',
    ko: '한국어 공부',
    minAge: 10,
    lines: [
      T('한국어 공부가 어때요? 뭐가 제일 어려워요?', 'Koreys tilini oʻrganish qanday? Eng qiyini nima?'),
      C('발음이 제일 어려워요. "ㅓ"랑 "ㅗ"가 비슷하게 들려요.', 'Talaffuz eng qiyin. "ㅓ" va "ㅗ" bir xil eshitiladi.',
        '처음에는 "ㅓ"랑 "ㅗ"가 비슷하게 들려서 발음이 어려웠는데, 지금은 괜찮아요.', 'Avvaliga "ㅓ" va "ㅗ" bir xil eshitilib, talaffuz qiyin edi, hozir yaxshi.'),
      T('맞아요. 그럼 "어머니"를 말해 볼까요?', 'Toʻgʻri. Unda "어머니" deb aytib koʻr-chi?'),
      C('어머니.', 'Ona.', '어머니.', 'Ona.'),
      T('아주 좋아요! 존댓말은 어때요?', 'Juda yaxshi! Hurmat shakli qanday?'),
      C('존댓말도 어려워요. 그래도 매일 연습하고 있어요.', 'Hurmat shakli ham qiyin. Lekin har kuni mashq qilyapman.',
        '존댓말은 학교에서 매일 쓰니까 이제 자연스러워요. 그래도 높임말 단어는 가끔 헷갈려요.', 'Hurmat shaklini maktabda har kuni ishlataman, endi tabiiy chiqadi. Lekin hurmat soʻzlarini baʼzan adashtiraman.'),
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
    s
      .replaceAll('{name}이에요', name + copula)
      .replaceAll('{name}', name)
      .replaceAll('{age}살', `${NATIVE_AGES[age] ?? age} 살`)
      .replaceAll('{age}', String(age));
  return {
    ...line,
    ko: sub(line.ko),
    uz: sub(line.uz),
    ...(line.fluent !== undefined ? { fluent: sub(line.fluent) } : {}),
    ...(line.fluentUz !== undefined ? { fluentUz: sub(line.fluentUz) } : {}),
  };
}

/** Korean age words read better than digits: Koreans say 여섯 살, not 육살. */
const NATIVE_AGES: Record<number, string> = {
  6: '여섯', 7: '일곱', 8: '여덟', 9: '아홉', 10: '열', 11: '열한', 12: '열두', 13: '열세', 14: '열네',
};

export function scenarioLines(scenario: Scenario, name: string, age: number): DialogueLine[] {
  return scenario.lines.map((l) => fillLine(l, name, age));
}

// ── Voices kept on this device ────────────────────────────────────────────

export interface ClonedVoice {
  voiceId: string;
  label: string;
  createdAt: string;
  /** Children only. Missing on voices saved before levels existed. */
  accentLevel?: AccentLevel;
}

const VOICES_KEY = 'koreer:voice-lab';

export function loadVoices(): Partial<Record<VoiceSlot, ClonedVoice>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(VOICES_KEY);
    return raw ? (JSON.parse(raw) as Partial<Record<VoiceSlot, ClonedVoice>>) : {};
  } catch {
    return {};
  }
}

export function saveVoices(voices: Partial<Record<VoiceSlot, ClonedVoice>>): void {
  try {
    window.localStorage.setItem(VOICES_KEY, JSON.stringify(voices));
  } catch {
    // Storage disabled — the voice still works for this visit.
  }
}
