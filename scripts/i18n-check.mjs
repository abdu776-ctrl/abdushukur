#!/usr/bin/env node
// Fails if any non-default locale is missing a key present in the default locale.
// No dependencies — plain Node. Wired into package.json as `i18n:check`.
import fs from 'fs';
import path from 'path';

const MESSAGES_DIR = 'messages';
const DEFAULT_LOCALE = 'en';
const LOCALES = ['en', 'ko', 'uz', 'ru'];

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

if (failed) {
  console.error('\ni18n:check FAILED — some locales are missing keys.\n');
  process.exit(1);
}
console.log('i18n:check passed — all locales have every key from the default locale.');
