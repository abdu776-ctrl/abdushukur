// Daily AI budgets, kept apart from the guard that enforces them.
//
// The guard imports node crypto and the Supabase server client, so a client
// component that wanted to quote these numbers would have dragged all of that
// into the browser bundle. Re-typing them in the UI instead would let the two
// copies drift, and a number shown to someone is a promise: it has to be the
// number actually enforced.

/** Requests a day for someone who has not signed in. */
export const GUEST_DAILY_LIMIT = 5;

/** Requests a day for a signed-in account. */
export const USER_DAILY_LIMIT = 60;
