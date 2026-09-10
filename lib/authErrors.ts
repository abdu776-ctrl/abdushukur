'use client';

// Supabase auth errors arrive in English, always — the library has no locale.
// Showing `error.message` straight to the user meant a Chinese or Vietnamese
// visitor got "Invalid login credentials" in the middle of a translated page.
//
// This maps the errors people actually hit to our own copy, and falls back to
// the server's wording for anything unmapped, so a rare error is still shown
// rather than swallowed.

/** Keys under the `authErrors` namespace. */
type ErrorKey =
  | 'invalidCredentials'
  | 'emailNotConfirmed'
  | 'userExists'
  | 'weakPassword'
  | 'rateLimit'
  | 'samePassword'
  | 'invalidEmail'
  | 'expiredLink'
  | 'network'
  | 'generic';

// supabase-js sets `code` on AuthApiError for most failures.
const BY_CODE: Record<string, ErrorKey> = {
  invalid_credentials: 'invalidCredentials',
  email_not_confirmed: 'emailNotConfirmed',
  user_already_exists: 'userExists',
  email_exists: 'userExists',
  weak_password: 'weakPassword',
  over_request_rate_limit: 'rateLimit',
  over_email_send_rate_limit: 'rateLimit',
  same_password: 'samePassword',
  validation_failed: 'invalidEmail',
  email_address_invalid: 'invalidEmail',
  otp_expired: 'expiredLink',
  bad_jwt: 'expiredLink',
  session_expired: 'expiredLink',
};

// Older releases (and some endpoints) only send a message.
const BY_MESSAGE: [RegExp, ErrorKey][] = [
  [/invalid login credentials/i, 'invalidCredentials'],
  [/email not confirmed|confirm your email/i, 'emailNotConfirmed'],
  [/already registered|already exists/i, 'userExists'],
  [/password should be at least|weak password/i, 'weakPassword'],
  [/rate limit|too many requests|only request this after/i, 'rateLimit'],
  [/should be different from the old password/i, 'samePassword'],
  [/unable to validate email|invalid format/i, 'invalidEmail'],
  [/expired|invalid token/i, 'expiredLink'],
  [/failed to fetch|network/i, 'network'],
];

/**
 * Localized text for a Supabase auth error.
 *
 * @param error the value caught, or the `error` field of a Supabase response
 * @param t     a translator scoped to the `authErrors` namespace
 */
export function authErrorMessage(error: unknown, t: (key: ErrorKey) => string): string {
  if (!error) return t('generic');

  const err = error as { code?: string; message?: string; status?: number };
  const code = typeof err.code === 'string' ? err.code : '';
  const message = typeof err.message === 'string' ? err.message : '';

  const key = BY_CODE[code] ?? BY_MESSAGE.find(([re]) => re.test(message))?.[1];
  if (key) return t(key);

  // Unmapped: prefer the server's own words over a vague "something went wrong",
  // but never show an empty string.
  return message || t('generic');
}
