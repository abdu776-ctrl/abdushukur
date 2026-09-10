'use client';

// Saved AI conversations.
//
// The assistant used to keep everything in React state, so a refresh threw the
// conversation away — and the "Chat history" list beside it was not history at
// all, just three fixed starter prompts.
//
// Conversations stay in this browser rather than in the account. They can
// contain a lot of personal career detail, and keeping them on the device is
// both the more private default and the one that needs no migration. Documents
// remain the thing that follows the user across devices.

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  at: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}

const STORAGE_KEY = 'koreer:chats';
/** Older conversations fall off the end rather than filling up storage. */
const MAX_CHATS = 30;
const TITLE_MAX = 60;

export function newChatId(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/** A conversation's title is its first question, trimmed to fit the list. */
export function chatTitle(messages: ChatMessage[], fallback: string): string {
  const firstQuestion = messages.find((m) => m.role === 'user')?.content.trim();
  if (!firstQuestion) return fallback;
  return firstQuestion.length > TITLE_MAX
    ? `${firstQuestion.slice(0, TITLE_MAX).trimEnd()}…`
    : firstQuestion;
}

export function listChats(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatSession[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((c) => c && typeof c.id === 'string' && Array.isArray(c.messages))
      .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
  } catch {
    return [];
  }
}

function persist(chats: ChatSession[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(chats.slice(0, MAX_CHATS)));
  } catch {
    // Storage full or disabled — the conversation on screen still works.
  }
}

/** Insert or replace a conversation, newest first. */
export function saveChat(session: ChatSession): void {
  const rest = listChats().filter((c) => c.id !== session.id);
  persist([{ ...session, updatedAt: new Date().toISOString() }, ...rest]);
}

export function deleteChat(id: string): void {
  persist(listChats().filter((c) => c.id !== id));
}

export function countChats(): number {
  return listChats().length;
}
