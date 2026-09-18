import { NextRequest } from 'next/server';
import { guardAiRequest } from '@/lib/aiGuard';
import { GROQ_MODEL } from '@/lib/aiModel';

const SYSTEM_PROMPT = `You are Koreer's AI Career Assistant, an expert on getting a job in South Korea as an international student or foreign applicant (Korean resumes 이력서, 자기소개서, interviews, salary, workplace culture, and visa basics). Answer in the user's language (Uzbek, Russian, English, Korean, Chinese or Vietnamese). Be concrete, practical, and encouraging; use short paragraphs and bullets; include useful Korean terms with a short translation; keep it concise. For visa/legal specifics, remind the user to verify with official sources.

IMPORTANT — Korean must be written in Hangul only. Never use Chinese characters (Hanja / 漢字) such as 結尾, 誠實性, 校正, 添削. Always write the pure Hangul form instead (예: 결미, 정직성, 교정, 첨삭). Do not add parenthetical Hanja after Korean words. This applies even when you are answering in Chinese: the surrounding explanation is Chinese, but any Korean term inside it stays in Hangul.`;


export async function POST(req: NextRequest) {
  try {
    // Guests get a small daily budget so the assistant can be tried before
    // signing up; the cap and the burst limit keep a script from running the
    // provider bill up.
    const guard = await guardAiRequest(req);
    if (!guard.ok) {
      return new Response(guard.reason ?? 'refused', { status: guard.status ?? 429 });
    }

    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response('No messages provided', { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      // Deliberately terse: the client turns this into a translated message,
      // and a visitor has no business seeing our environment variable names.
      return new Response('unavailable', { status: 503 });
    }

    const chatMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
        .filter(
          (m: { role: string; content: string }) =>
            (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim()
        )
        .map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
    ];

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: true,
      }),
    });

    if (!groqRes.ok || !groqRes.body) {
      const errText = await groqRes.text().catch(() => '');
      console.error('groq error:', groqRes.status, errText);
      // This used to answer 200 with the provider's raw JSON, which the chat
      // then displayed as if the assistant had said it — a person asking about
      // their cover letter got back a stack of English about model IDs, in the
      // middle of a Korean interface. A real failure status instead, so the
      // client can say, in the reader's own language, that the assistant is
      // unavailable. The detail stays in the server log, where it is useful.
      return new Response('upstream-error', { status: 503 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readable = new ReadableStream({
      async start(controller) {
        const reader = groqRes.body!.getReader();
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;
              const jsonStr = trimmed.slice(5).trim();
              if (!jsonStr || jsonStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const text = parsed?.choices?.[0]?.delta?.content;
                if (text) controller.enqueue(encoder.encode(text));
              } catch {
                // ignore partial lines
              }
            }
          }
        } catch (err) {
          console.error('groq stream error:', err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (err) {
    console.error('chat route error:', err);
    return new Response('Something went wrong. Please try again.', { status: 500 });
  }
}
