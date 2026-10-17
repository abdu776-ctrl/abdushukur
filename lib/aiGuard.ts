import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { GUEST_DAILY_LIMIT, USER_DAILY_LIMIT } from './aiLimits';

// Server-side guard for the AI routes.
//
// All three routes call a paid provider and were open to the internet: no
// account required, no limit, no size cap. A script could have run the API key
// dry overnight, and the bill would have been real.
//
// Two layers:
//   1. A short burst limit held in memory. Cheap, catches a hammering loop
//      immediately, but only within one serverless instance.
//   2. A daily budget in the database, so the limit survives instance churn.
//
// Guests are allowed a small daily budget on purpose — someone should be able
// to try the assistant before creating an account.

// Re-exported so the routes keep importing limits from the guard, while the
// numbers themselves live somewhere the browser can read too.
export { GUEST_DAILY_LIMIT, USER_DAILY_LIMIT } from './aiLimits';

/** Requests per minute per caller, regardless of the daily budget. */
const BURST_PER_MINUTE = 10;

/** Largest request body an AI route will read, in bytes. */
export const MAX_BODY_BYTES = 100_000;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export interface GuardResult {
  ok: boolean;
  /** Set when the request must be refused. */
  status?: 401 | 413 | 429 | 503;
  reason?: 'unauthenticated' | 'too-many-requests' | 'quota-exceeded' | 'too-large' | 'unavailable';
  userId?: string | null;
}

// ── Burst limiter ───────────────────────────────────────────────────────────

const hits = new Map<string, number[]>();

function burstAllowed(key: string): boolean {
  const now = Date.now();
  const windowStart = now - 60_000;
  const recent = (hits.get(key) ?? []).filter((t) => t > windowStart);
  recent.push(now);
  hits.set(key, recent);

  // Keep the map from growing without bound on a long-lived instance.
  if (hits.size > 5_000) {
    for (const [k, times] of hits) {
      if (times.every((t) => t <= windowStart)) hits.delete(k);
    }
  }
  return recent.length <= BURST_PER_MINUTE;
}

// ── Caller identity ─────────────────────────────────────────────────────────

/** The signed-in user's id, or null. Verified against Supabase — a forged
 *  token cannot pass, because the token is checked, not merely decoded. */
async function verifyUser(req: NextRequest): Promise<string | null> {
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token || !url || !anonKey) return null;

  try {
    const supabase = createClient(url, anonKey);
    const { data, error } = await supabase.auth.getUser(token);
    if (error) return null;
    return data.user?.id ?? null;
  } catch (err) {
    console.error('token verification failed:', err);
    return null;
  }
}

/** Bucket a guest by a hash of their address — the address itself is never
 *  stored or logged. */
function guestKey(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for') ?? '';
  const ip = forwarded.split(',')[0].trim() || 'unknown';
  const salt = process.env.RATE_LIMIT_SALT ?? 'koreer';
  return `ip:${createHash('sha256').update(ip + salt).digest('hex').slice(0, 32)}`;
}

// ── Daily budget ────────────────────────────────────────────────────────────

async function consumeQuota(key: string, limit: number): Promise<boolean> {
  if (!url || !anonKey) return true; // Not configured: fall back to burst only.
  try {
    const supabase = createClient(url, anonKey);
    const { data, error } = await supabase.rpc('consume_ai_quota', {
      p_key: key,
      p_limit: limit,
    });
    if (error) {
      // A missing function or a database blip must not take the feature down;
      // the burst limiter still applies.
      console.error('quota check failed:', error.message);
      return true;
    }
    return data === true;
  } catch (err) {
    console.error('quota check failed:', err);
    return true;
  }
}

// ── Entry point ─────────────────────────────────────────────────────────────

/**
 * Decide whether an AI request may proceed.
 *
 * @param requireAccount routes that only make sense for a signed-in user
 *                       (tailoring a saved document) refuse guests outright.
 */
export async function guardAiRequest(
  req: NextRequest,
  options: { requireAccount?: boolean } = {}
): Promise<GuardResult> {
  const length = Number(req.headers.get('content-length') ?? 0);
  if (length > MAX_BODY_BYTES) {
    return { ok: false, status: 413, reason: 'too-large' };
  }

  const userId = await verifyUser(req);

  if (options.requireAccount && !userId) {
    return { ok: false, status: 401, reason: 'unauthenticated', userId: null };
  }

  const key = userId ? `user:${userId}` : guestKey(req);

  if (!burstAllowed(key)) {
    return { ok: false, status: 429, reason: 'too-many-requests', userId };
  }

  const limit = userId ? USER_DAILY_LIMIT : GUEST_DAILY_LIMIT;
  if (!(await consumeQuota(key, limit))) {
    return { ok: false, status: 429, reason: 'quota-exceeded', userId };
  }

  return { ok: true, userId };
}

/** Body text, refused if it exceeds the cap even when Content-Length lied. */
export async function readLimitedBody(req: NextRequest): Promise<string | null> {
  const text = await req.text();
  return text.length > MAX_BODY_BYTES ? null : text;
}
