import { createHash } from 'crypto';
import type { NextRequest } from 'next/server';
import { GUEST_DAILY_LIMIT } from './aiLimits';

// Guard for the voice routes of the standalone site.
//
// There are no accounts here. What stands between the internet and the
// ElevenLabs key is:
//   1. An optional access code (ACCESS_CODE). When it is set, every voice
//      request must carry it — as `x-access-code` or as a Bearer token — so a
//      stranger who finds the URL cannot spend the free credits.
//   2. A burst limit and a daily budget per visitor, held in memory. They
//      reset when the serverless instance does, which is acceptable for a
//      test site: the provider's own monthly cap is the hard limit.
//
// The signature matches Koreer's guard, so the routes are the same files.

export const MAX_BODY_BYTES = 100_000;
const BURST_PER_MINUTE = 10;

export interface GuardResult {
  ok: boolean;
  status?: 401 | 413 | 429 | 503;
  reason?: 'unauthenticated' | 'too-many-requests' | 'quota-exceeded' | 'too-large' | 'unavailable';
  /** Always "owner": with the access code, whoever is here is the owner. */
  userId?: string | null;
}

const hits = new Map<string, number[]>();
const daily = new Map<string, { day: string; count: number }>();

function visitor(req: NextRequest): string {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  return createHash('sha256').update(ip + (process.env.RATE_LIMIT_SALT ?? 'ovoz-lab')).digest('hex').slice(0, 24);
}

/** The code the request carries, from either header. */
export function presentedCode(req: NextRequest): string {
  const header = req.headers.get('x-access-code') ?? '';
  if (header) return header.trim();
  const auth = req.headers.get('authorization') ?? '';
  return auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
}

/** True when no code is configured, or the request carries the right one. */
export function codeAccepted(req: NextRequest): boolean {
  const code = process.env.ACCESS_CODE;
  return !code || presentedCode(req) === code;
}

export async function guardAiRequest(
  req: NextRequest,
  options: {
    requireAccount?: boolean;
    maxBytes?: number;
    bucket?: string;
    limits?: { guest: number; user: number };
    burstPerMinute?: number;
  } = {}
): Promise<GuardResult> {
  const length = Number(req.headers.get('content-length') ?? 0);
  if (length > (options.maxBytes ?? MAX_BODY_BYTES)) {
    return { ok: false, status: 413, reason: 'too-large' };
  }
  if (!codeAccepted(req)) {
    return { ok: false, status: 401, reason: 'unauthenticated', userId: null };
  }

  const key = `${options.bucket ?? 'ai'}:${visitor(req)}`;

  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => t > now - 60_000);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5_000) hits.clear();
  if (recent.length > (options.burstPerMinute ?? BURST_PER_MINUTE)) {
    return { ok: false, status: 429, reason: 'too-many-requests', userId: 'owner' };
  }

  const day = new Date().toISOString().slice(0, 10);
  const entry = daily.get(key);
  const count = entry && entry.day === day ? entry.count + 1 : 1;
  daily.set(key, { day, count });
  // `user` is the number that applies: with the code, a visitor is trusted.
  const limit = options.limits?.user || options.limits?.guest || GUEST_DAILY_LIMIT;
  if (count > limit) {
    return { ok: false, status: 429, reason: 'quota-exceeded', userId: 'owner' };
  }

  return { ok: true, userId: 'owner' };
}
