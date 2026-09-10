'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { aiFetch, aiErrorKey } from '@/lib/aiClient';
import { useAuth } from '@/lib/useAuth';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Send,
  Plus,
  User,
  Copy,
  Check,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import {
  listChats,
  saveChat,
  deleteChat,
  newChatId,
  chatTitle,
  type ChatSession,
  type ChatMessage,
} from '@/lib/chats';

// The stored shape is the source of truth; `timestamp` was never used for
// anything but ordering, which the stored `at` already does.
type Message = ChatMessage;

function greetingMessage(text: string): Message {
  return { id: '0', role: 'assistant', content: text, at: new Date().toISOString() };
}

export function AIChat() {
  const t = useTranslations('aiAssistant');
  const terr = useTranslations('errors');
  const { status: authStatus } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [chatId, setChatId] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reopen the most recent conversation, so a refresh no longer wipes it.
  useEffect(() => {
    const stored = listChats();
    setChats(stored);
    if (stored.length > 0) {
      setChatId(stored[0].id);
      setMessages(stored[0].messages);
    } else {
      setChatId(newChatId());
      setMessages([greetingMessage(t('greeting'))]);
    }
  }, [t]);

  // Save once a reply has finished streaming — not on every chunk, which would
  // rewrite storage dozens of times per answer.
  useEffect(() => {
    if (loading || !chatId) return;
    if (!messages.some((m) => m.role === 'user')) return;
    const session: ChatSession = {
      id: chatId,
      title: chatTitle(messages, t('newChat')),
      messages,
      updatedAt: new Date().toISOString(),
    };
    saveChat(session);
    setChats(listChats());
  }, [loading, messages, chatId, t]);

  function openChat(id: string) {
    if (loading) return;
    const found = chats.find((c) => c.id === id);
    if (!found) return;
    setChatId(id);
    setMessages(found.messages);
    setInput('');
  }

  function removeChat(id: string) {
    deleteChat(id);
    const remaining = listChats();
    setChats(remaining);
    if (id !== chatId) return;
    if (remaining.length > 0) {
      setChatId(remaining[0].id);
      setMessages(remaining[0].messages);
    } else {
      setChatId(newChatId());
      setMessages([greetingMessage(t('greeting'))]);
    }
  }

  async function copyMessage(message: Message) {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedId(message.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error('copy failed:', err);
    }
  }

  const suggestions = [
    t('suggestions.q1'),
    t('suggestions.q2'),
    t('suggestions.q3'),
    t('suggestions.q4'),
    t('suggestions.q5'),
  ];

  const historyItems = [
    { label: t('chats.resumeTips'), q: t('starters.resumeTips') },
    { label: t('chats.interview'), q: t('starters.interview') },
    { label: t('chats.coverLetter'), q: t('starters.coverLetter') },
  ];

  function resetChat() {
    if (loading) return;
    setChatId(newChatId());
    setMessages([greetingMessage(t('greeting'))]);
    setInput('');
    inputRef.current?.focus();
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      at: new Date().toISOString(),
    };

    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const assistantId = (Date.now() + 1).toString();
    let started = false;
    let acc = '';

    function pushChunk(chunk: string) {
      acc += chunk;
      if (!started) {
        started = true;
        setLoading(false);
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: 'assistant', content: acc, at: new Date().toISOString() },
        ]);
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m))
        );
      }
    }

    try {
      const res = await aiFetch('/api/chat', { messages: history });

      if (!res.ok || !res.body) {
        const detail = await res.text().catch(() => '');
        // A refusal from the guard is expected and explainable; anything else
        // falls through to the generic error below.
        const key = aiErrorKey(res.status, authStatus === 'authenticated', detail);
        throw new Error(key ? terr(key) : t('error'));
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        pushChunk(decoder.decode(value, { stream: true }));
      }

      if (!started) {
        pushChunk(t('noReply'));
      }
    } catch (err) {
      console.error('chat error:', err);
      const msg =
        (err instanceof Error && err.message) ||
        t('error');
      if (!started) {
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: 'assistant', content: msg, at: new Date().toISOString() },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function formatMessage(content: string) {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-semibold text-gray-900 dark:text-white mb-1">{line.slice(2, -2)}</p>;
      }
      if (line.startsWith('• ')) {
        return <p key={i} className="flex items-start gap-2 mb-1 text-gray-700 dark:text-gray-300"><span className="text-indigo-500 flex-shrink-0 mt-1">•</span>{line.slice(2)}</p>;
      }
      if (line.startsWith('💡')) {
        return <p key={i} className="mt-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg p-2">{line}</p>;
      }
      if (line === '') return <br key={i} />;
      // Bold inline
      const boldParts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="text-gray-700 dark:text-gray-300 mb-0.5">
          {boldParts.map((part, j) =>
            j % 2 === 1 ? <strong key={j} className="text-gray-900 dark:text-white font-semibold">{part}</strong> : part
          )}
        </p>
      );
    });
  }

  return (
    <div className="flex h-full gap-4">
      {/* Chat history sidebar */}
      <div className="hidden lg:flex w-56 flex-col gap-2 flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          className="w-full"
          onClick={resetChat}
        >
          {t('newChat')}
        </Button>
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-1 mt-2">
          {chats.length > 0 ? t('history') : t('startersTitle')}
        </div>

        {chats.length === 0 ? (
          <>
            {historyItems.map((item) => (
              <button
                key={item.label}
                onClick={() => sendMessage(item.q)}
                disabled={loading}
                className="text-left px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors truncate"
              >
                {item.label}
              </button>
            ))}
            <p className="px-1 mt-2 text-xs text-gray-400 dark:text-gray-600 leading-relaxed">
              {t('noChats')}
            </p>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-0.5">
            {chats.map((chat) => (
              <div key={chat.id} className="group/chat relative">
                <button
                  onClick={() => openChat(chat.id)}
                  disabled={loading}
                  title={chat.title}
                  className={cn(
                    'w-full text-left pl-3 pr-8 py-2 rounded-lg text-sm truncate transition-colors disabled:opacity-50',
                    chat.id === chatId
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <MessageSquare className="w-3.5 h-3.5 inline-block mr-2 -mt-0.5 opacity-60" />
                  {chat.title}
                </button>
                <button
                  type="button"
                  onClick={() => removeChat(chat.id)}
                  aria-label={`${t('deleteChat')}: ${chat.title}`}
                  title={t('deleteChat')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover/chat:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3 animate-slide-up',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={cn(
                'max-w-[80%] rounded-2xl p-4',
                message.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-gray-50 dark:bg-gray-800 rounded-bl-sm'
              )}>
                <div className={cn('text-sm leading-relaxed', message.role === 'user' && 'text-white')}>
                  {message.role === 'assistant'
                    ? formatMessage(message.content)
                    : message.content
                  }
                </div>
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => copyMessage(message)}
                      aria-label={t('copy')}
                      title={t('copy')}
                      className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {copiedId === message.id
                        ? <Check className="w-3 h-3 text-green-500" />
                        : <Copy className="w-3 h-3" />}
                    </button>
                    {copiedId === message.id && (
                      <span className="text-xs text-green-600 dark:text-green-400">{t('copied')}</span>
                    )}
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl rounded-bl-sm p-4">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                  {t('thinking')}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions (only shown when last message is from assistant) */}
        {messages[messages.length - 1]?.role === 'assistant' && !loading && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {suggestions.slice(0, 3).map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-end gap-3 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus-within:border-indigo-500 transition-colors">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('placeholder')}
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none focus:outline-none max-h-32 overflow-y-auto"
              style={{ scrollbarWidth: 'none' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150',
                input.trim() && !loading
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-2">
            {t('disclaimer')}
          </p>
        </div>
      </div>
    </div>
  );
}
