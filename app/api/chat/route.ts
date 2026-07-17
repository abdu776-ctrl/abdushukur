import { NextRequest } from 'next/server';

const SYSTEM_PROMPT = `You are Koreer's AI Career Assistant, an expert on getting a job in South Korea as an international student or foreign applicant.

You help with:
- Korean resumes (이력서): formatting, photo requirements, sections, Korean standards
- Self-introduction letters (자기소개서): the 4 sections (성장과정, 성격의 장단점, 지원동기, 입사 후 포부), writing tips, cultural nuances
- Interview preparation: common Korean interview questions and how to answer them
- Salary negotiation and Korean workplace norms (연봉, 대기업/중견기업, 4대 보험)
- Korean workplace etiquette and business culture
- Visa and work-authorization basics for foreign workers (general guidance only)

Guidelines:
- Answer in the same language the user writes in (Uzbek, Russian, English, or Korean). If unsure, default to English.
- Be concrete, practical, and encouraging. Use short paragraphs and bullet points.
- Include the relevant Korean terms (with a short translation) where useful.
- Keep answers focused and reasonably concise.
- For legal/visa specifics, remind the user to verify with official sources (e.g. HiKorea, the employer, or immigration office).`;

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response('No messages provided', { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        'AI is not configured yet. Please set the GEMINI_API_KEY environment variable.',
        { status: 503 }
      );
    }

    // Convert to Gemini format: assistant -> model, user -> user, must start with user.
    const contents = messages
      .filter(
        (m: { role: string; content: string }) =>
          (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim()
      )
      .map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    while (contents.length && contents[0].role !== 'user') contents.shift();

    if (!contents.length) {
      return new Response('No user message provided', { status: 400 });
    }

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=` +
      encodeURIComponent(apiKey);

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    });

    if (!geminiRes.ok || !geminiRes.body) {
      const errText = await geminiRes.text().catch(() => '');
      console.error('gemini error:', geminiRes.status, errText);
      return new Response('AI service error. Please try again.', { status: 502 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readable = new ReadableStream({
      async start(controller) {
        const reader = geminiRes.body!.getReader();
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            // Gemini SSE: lines like "data: {json}" separated by newlines.
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;
              const jsonStr = trimmed.slice(5).trim();
              if (!jsonStr || jsonStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const text = parsed?.candidates?.[0]?.content?.parts
                  ?.map((p: { text?: string }) => p.text || '')
                  .join('');
                if (text) controller.enqueue(encoder.encode(text));
              } catch {
                // ignore partial/non-JSON lines
              }
            }
          }
        } catch (err) {
          console.error('gemini stream error:', err);
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
