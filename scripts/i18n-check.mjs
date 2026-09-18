#!/usr/bin/env node
// Fails if a locale is missing a key the default locale has, or if an Uzbek
// apostrophe inside a word is the wrong character.
// No dependencies — plain Node. Wired into package.json as `i18n:check`.
import fs from 'fs';
import path from 'path';

const MESSAGES_DIR = 'messages';
const DEFAULT_LOCALE = 'en';
const LOCALES = ['en', 'ko', 'uz', 'ru', 'zh', 'vi'];

function flatten(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) keys.push(...flatten(v, key));
    else keys.push(key);
  }
  return keys;
}

function load(locale) {
  const file = path.join(MESSAGES_DIR, `${locale}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const base = new Set(flatten(load(DEFAULT_LOCALE)));
let failed = false;

for (const locale of LOCALES) {
  if (locale === DEFAULT_LOCALE) continue;
  const keys = new Set(flatten(load(locale)));
  const missing = [...base].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !base.has(k));
  if (missing.length) {
    failed = true;
    console.error(`\n[${locale}] missing ${missing.length} key(s) present in ${DEFAULT_LOCALE}:`);
    missing.forEach((k) => console.error(`  - ${k}`));
  }
  if (extra.length) {
    console.warn(`\n[${locale}] has ${extra.length} extra key(s) not in ${DEFAULT_LOCALE}:`);
    extra.forEach((k) => console.warn(`  + ${k}`));
  }
}

// ── Uzbek orthography ───────────────────────────────────────────────────────
// Uzbek Latin has two letters a keyboard types as a plain apostrophe, and they
// are not the same character:
//
//   o\u02bb / g\u02bb   U+02BB MODIFIER LETTER TURNED COMMA  — part of the letter
//   ma\u02bclumot        U+02BC MODIFIER LETTER APOSTROPHE    — the tutuq belgisi
//
// The file once held five different stand-ins for those two, so the same word
// was spelled three ways. Whoever adds the next string will reach for the key
// on their keyboard, which is why this is checked rather than merely fixed.
//
// Only apostrophes inside a word are policed. Quotation marks around a phrase
// are punctuation and are left alone.
const TURNED = String.fromCharCode(0x02bb);
const TUTUQ = String.fromCharCode(0x02bc);
const WRONG = [String.fromCharCode(39), String.fromCharCode(0x2018), String.fromCharCode(0x2019),
               String.fromCharCode(0x60), String.fromCharCode(0xb4)];
const isLetter = (c) => /\p{L}/u.test(c);

function checkUzbekApostrophes() {
  const problems = [];
  const walk = (node, path) => {
    if (typeof node === 'string') {
      for (let i = 0; i < node.length; i++) {
        const ch = node[i];
        if (!WRONG.includes(ch)) continue;
        const before = node[i - 1] ?? '';
        const after = node[i + 1] ?? '';
        const inWord = isLetter(before) && (isLetter(after) || /[oOgG]/.test(before));
        if (!inWord) continue;
        const want = /[oOgG]/.test(before) ? TURNED : TUTUQ;
        problems.push({
          path,
          want,
          context: node.slice(Math.max(0, i - 15), i + 15),
        });
      }
    } else if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
    }
  };
  walk(load('uz'), '');
  return problems;
}

const uzProblems = checkUzbekApostrophes();
if (uzProblems.length) {
  failed = true;
  console.error(`\n[uz] ${uzProblems.length} apostrophe(s) inside a word are the wrong character:`);
  for (const p of uzProblems) {
    console.error(`  - ${p.path}: ...${p.context}...  -> use ${p.want}`);
  }
  console.error(`  Uzbek uses ${TURNED} in o${TURNED}/g${TURNED} and ${TUTUQ} for the tutuq belgisi.`);
}

// ── Korean terms outside the Korean locale ─────────────────────────────────
// 이력서 and 자기소개서 are the names of the two documents this app builds, and
// they belong in the interface — a person applying in Korea will meet those
// words on the employer's page. But a reader who cannot read Hangul sees only
// a shape. The rule is therefore: their own word first, the Korean one in
// parentheses right after it. Never the Korean term standing alone.
const KOREAN_TERMS = ['\uc790\uae30\uc18c\uac1c\uc11c', '\uc774\ub825\uc11c'];

function checkKoreanTerms(locale) {
  const problems = [];
  const walk = (node, path) => {
    if (typeof node === 'string') {
      for (const term of KOREAN_TERMS) {
        let i = node.indexOf(term);
        while (i !== -1) {
          // Preceded by an opening bracket means it is glossing a word that
          // came before it, which is what we want.
          if (!/[(\uff08]\s*$/.test(node.slice(Math.max(0, i - 2), i))) {
            problems.push({ path, term, context: node.slice(Math.max(0, i - 30), i + term.length + 5) });
          }
          i = node.indexOf(term, i + 1);
        }
      }
    } else if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
    }
  };
  walk(load(locale), '');
  return problems;
}

for (const locale of LOCALES) {
  if (locale === 'ko') continue;
  const bare = checkKoreanTerms(locale);
  if (!bare.length) continue;
  failed = true;
  console.error(`\n[${locale}] ${bare.length} Korean term(s) stand alone with no ${locale} word beside them:`);
  for (const b of bare) console.error(`  - ${b.path}: ...${b.context}...`);
  console.error('  Write the reader\'s own word first, then the Korean one in parentheses.');
}

if (failed) {
  console.error('\ni18n:check FAILED.\n');
  process.exit(1);
}
console.log('i18n:check passed — every locale has every key, and the Uzbek apostrophes are the right characters.');
