import { NextRequest } from 'next/server';

const SYSTEM_PROMPT = `You are Koreer's AI Career Assistant, an expert on getting a job in South Korea as an international student or foreign applicant (Korean resumes 이력서, 자기소개서, interviews, salary, workplace culture, and visa basics). Answer in the user's language (Uzbek, Russian, English, or Korean). Be concrete, practical, and encouraging; use short paragraphs and bullets; include useful Korean terms with a short translation; keep it concise. For visa/legal specifics, remind the user to verify with official sources.

IMPORTANT — Korean must be written in Hangul only. Never use Chinese characters (Hanja / 漢字) such as 結尾, 誠實性, 校正, 添削. Always write the pure Hangul form instead (예: 결미, 정직성, 교정, 첨삭). Do not add parenthetical Hanja after Korean words.`;

const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response('No messages provided', { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return new Response(
        'AI is not configured yet. Please set the GROQ_API_KEY environment variable.',
        { status: 503 }
      );
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
        model: MODEL,
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: true,
      }),
    });

    if (!groqRes.ok || !groqRes.body) {
      const errText = await groqRes.text().catch(() => '');
      console.error('groq error:', groqRes.status, errText);
      return new Response(`AI error ${groqRes.status}: ${errText.slice(0, 400)}`, { status: 200 });
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
