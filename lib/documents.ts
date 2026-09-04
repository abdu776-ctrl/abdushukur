'use client';

import { getSupabase } from './supabase';

// Saved resumes and cover letters.
//
// The builder state is stored as JSON in documents.data, so the document shape
// can evolve without a migration for every new field. Row Level Security scopes
// every query to the signed-in user — there is no way to read someone else's
// document, even though the browser holds the publishable key.

export type DocumentKind = 'resume' | 'cover_letter';

export interface SavedDocument {
  id: string;
  kind: DocumentKind;
  title: string;
  company: string;
  data: Record<string, unknown>;
  updated_at: string;
}

/** Thrown when the caller needs to tell the user to sign in. */
export class NotSignedInError extends Error {
  constructor() {
    super('not-signed-in');
    this.name = 'NotSignedInError';
  }
}

async function requireUserId(): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) throw new NotSignedInError();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new NotSignedInError();
  return data.user.id;
}

/** Every document belonging to the signed-in user, newest first.
 *  Returns [] when Supabase is unconfigured or nobody is signed in. */
export async function listDocuments(): Promise<SavedDocument[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];

  const { data, error } = await supabase
    .from('documents')
    .select('id, kind, title, company, data, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('listDocuments failed:', error.message);
    return [];
  }
  return (data ?? []) as SavedDocument[];
}

export async function loadDocument(id: string): Promise<SavedDocument | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('documents')
    .select('id, kind, title, company, data, updated_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('loadDocument failed:', error.message);
    return null;
  }
  return (data as SavedDocument) ?? null;
}

/** Insert a new document, or update it when `id` is supplied.
 *  Returns the saved row so the caller can keep the id for later saves. */
export async function saveDocument(input: {
  id?: string | null;
  kind: DocumentKind;
  title: string;
  company?: string;
  data: Record<string, unknown>;
}): Promise<SavedDocument> {
  const supabase = getSupabase();
  if (!supabase) throw new NotSignedInError();
  const userId = await requireUserId();

  const row = {
    user_id: userId,
    kind: input.kind,
    title: input.title,
    company: input.company ?? '',
    data: input.data,
  };

  const query = input.id
    ? supabase.from('documents').update(row).eq('id', input.id)
    : supabase.from('documents').insert(row);

  const { data, error } = await query
    .select('id, kind, title, company, data, updated_at')
    .single();

  if (error) throw new Error(error.message);
  return data as SavedDocument;
}

export async function deleteDocument(id: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new NotSignedInError();
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
