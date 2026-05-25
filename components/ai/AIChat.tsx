'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Send,
  Plus,
  User,
  Copy,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AI_RESPONSES: Record<string, string> = {
  default: `I'm your AI Career Assistant for Korean job applications! I can help you with:

• **Korean Resume (이력서)** — formatting, content, photo requirements
• **자기소개서** — structure, writing tips, cultural nuances
• **Interview Preparation** — common Korean interview questions
• **Salary Negotiation** — Korean workplace norms
• **Cultural Tips** — Korean workplace etiquette

What would you like help with today?`,
  photo: `**Korean Resume Photo Requirements (증명사진)**

Korean resumes traditionally require a formal headshot photo. Here are the standards:

• **Size**: 3×4 cm (printed), 300×400 px (digital minimum)
• **Background**: White or light blue/gray — solid color only
• **Attire**: Professional business attire — suit is ideal
• **Expression**: Neutral or slight smile, eyes open naturally
• **Age**: Taken within the last 3-6 months

💡 **Pro tip**: Many students get professional "취업사진" (job application photos) taken at photo studios in Korea for around 15,000-30,000 won. The studios know exactly what Korean companies expect!`,
  coverletter: `**자기소개서 Writing Guide**

The 자기소개서 (self-introduction letter) is the most important document in Korean job applications. It typically has 4 sections:

**1. 성장과정 (Growth Background)**
Share your upbringing and key experiences that shaped your character. Korean companies value perseverance stories.

**2. 성격의 장단점 (Strengths & Weaknesses)**
Be specific and honest. Show self-awareness. Always follow a weakness with how you're working to overcome it.

**3. 지원동기 (Application Motivation)**
Research the company deeply. Reference specific products, values, or recent news. Generic answers are a red flag.

**4. 입사 후 포부 (Future Goals)**
Be ambitious but realistic. Show commitment to long-term growth with the company.

💡 **Word count**: Most companies want 500-1000 characters per section.`,
  interview: `**Common Korean Interview Questions**

Here are the most frequently asked interview questions in Korean companies:

**Personal questions:**
- 자기소개를 해주세요 (Please introduce yourself)
- 지원 동기가 무엇인가요? (Why are you applying?)
- 입사 후 10년 계획은? (5-10 year career plan?)

**Experience questions:**
- 가장 힘들었던 경험과 극복 방법은? (Hardest challenge and how you overcame it?)
- 팀 프로젝트 경험을 말해주세요 (Tell about a team project experience)

**Cultural fit:**
- 우리 회사에 대해 알고 있나요? (What do you know about our company?)
- 당신의 강점이 우리 회사에 어떻게 도움이 될까요? (How will your strengths benefit us?)

💡 **Tips for international students**: Practice in Korean, show genuine interest in Korean culture, and emphasize your unique multilingual perspective!`,
  salary: `**Korean Salary Negotiation Tips**

Salary discussion in Korea has some specific norms to be aware of:

**General approach:**
- Korean companies often ask for your "희망 연봉" (desired salary) on application forms
- Research the typical range for your position and industry beforehand
- It's acceptable to state a range: e.g., "3,500-4,000만원"

**For international students:**
- Entry-level positions at large companies (대기업): ~2,800-3,500만원/year
- Mid-size companies (중견기업): ~2,400-3,000만원/year
- Startups: often lower base but may offer equity

**Important:**
- Many Korean companies have fixed salary tables (호봉제), especially for new graduates
- Bonuses (성과급) can add 10-30% on top of base salary
- Ask about 4대 보험 coverage (national health, pension, employment, workers comp)

💡 If it's your first job in Korea, focus on learning and growth over maximum salary!`,
};

function getAIResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('photo') || lower.includes('사진') || lower.includes('증명')) return AI_RESPONSES.photo;
  if (lower.includes('자기소개') || lower.includes('cover letter') || lower.includes('자소서')) return AI_RESPONSES.coverletter;
  if (lower.includes('interview') || lower.includes('면접')) return AI_RESPONSES.interview;
  if (lower.includes('salary') || lower.includes('연봉') || lower.includes('월급')) return AI_RESPONSES.salary;
  return AI_RESPONSES.default;
}

export function AIChat() {
  const t = useTranslations('aiAssistant');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: AI_RESPONSES.default,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const suggestions = [
    t('suggestions.q1'),
    t('suggestions.q2'),
    t('suggestions.q3'),
    t('suggestions.q4'),
    t('suggestions.q5'),
  ];

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    await new Promise((r) => setTimeout(r, 800 + Math.random() * 1000));

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: getAIResponse(text),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setLoading(false);
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
        <Button variant="outline" size="sm" icon={<Plus className="w-4 h-4" />} className="w-full">
          {t('newChat')}
        </Button>
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-1 mt-2">
          {t('history')}
        </div>
        {['Korean Resume Tips', 'Interview Questions', '자기소개서 Guide'].map((chat) => (
          <button
            key={chat}
            className="text-left px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors truncate"
          >
            {chat}
          </button>
        ))}
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
                    <button className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                      <Copy className="w-3 h-3" />
                    </button>
                    <button className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-green-500 transition-colors">
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors">
                      <ThumbsDown className="w-3 h-3" />
                    </button>
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
            AI responses are for guidance only. Always verify with official sources.
          </p>
        </div>
      </div>
    </div>
  );
}
