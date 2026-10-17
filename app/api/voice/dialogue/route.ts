import { NextRequest, NextResponse } from 'next/server';
import { guardAiRequest } from '@/lib/aiGuard';
import { GROQ_MODEL } from '@/lib/aiModel';

// A fresh lesson dialogue on a topic of the user's choosing. The built-in
// scenarios cover the basics; this is for "a dialogue about the bus to school".

function prompt(topic: string, name: string, age: number): string {
  return `Write a short Korean lesson dialogue between a female Korean teacher (선생님) and ${name}, a ${age}-year-old child from Uzbekistan who moved to Korea and is learning Korean as an international student.

Topic: ${topic}

Rules:
- 6 to 8 lines, alternating, the teacher speaks first and asks questions; the child answers.
- The teacher uses simple, warm 해요체, suited to a ${age}-year-old.
- The child answers in correct but simple Korean, at the level of a ${age}-year-old who has studied Korean for under a year. Short sentences for younger children. The child may mention life in Uzbekistan (Tashkent, plov, family) where natural.
- For every child line also give "fluent": the same answer as a child who has grown up in Korea gives it — natural, accent-free Korean with fully correct 존댓말, a little longer and more complete (저는, connectors like -는데, -이랑), with "fluentUz" as its Uzbek translation.
- Hangul only — no Hanja, no romanisation.
- Give an Uzbek (Latin script) translation of every line.

Reply with ONLY JSON, no prose, in this exact shape:
{"lines":[{"speaker":"teacher","ko":"...","uz":"..."},{"speaker":"child","ko":"...","uz":"...","fluent":"...","fluentUz":"..."}]}`;
}

export async function POST(req: NextRequest) {
  try {
    const guard = await guardAiRequest(req);
    if (!guard.ok) {
      return NextResponse.json({ error: guard.reason }, { status: guard.status ?? 429 });
    }

    const body = await req.json();
    const topic = String(body.topic ?? '').trim().slice(0, 120);
    const name = String(body.name ?? '').trim().slice(0, 20) || '아지즈';
    const age = Math.max(6, Math.min(14, Number(body.age) || 8));
    if (!topic) return NextResponse.json({ error: 'no-topic' }, { status: 400 });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt(topic, name, age) }],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) {
      console.error('dialogue groq error:', res.status, await res.text().catch(() => ''));
      return NextResponse.json({ error: 'upstream-error' }, { status: 503 });
    }
    const data = await res.json();
    const parsed = JSON.parse(data?.choices?.[0]?.message?.content ?? '{}');
    const lines = Array.isArray(parsed.lines)
      ? parsed.lines
          .filter(
            (l: { speaker?: string; ko?: unknown; uz?: unknown }) =>
              (l.speaker === 'teacher' || l.speaker === 'child') && typeof l.ko === 'string' && l.ko.trim()
          )
          .slice(0, 12)
          .map((l: { speaker: string; ko: string; uz?: unknown; fluent?: unknown; fluentUz?: unknown }) => ({
            speaker: l.speaker,
            ko: l.ko.trim().slice(0, 300),
            uz: typeof l.uz === 'string' ? l.uz.trim().slice(0, 300) : '',
            ...(l.speaker === 'child' && typeof l.fluent === 'string' && l.fluent.trim()
              ? {
                  fluent: l.fluent.trim().slice(0, 300),
                  fluentUz: typeof l.fluentUz === 'string' ? l.fluentUz.trim().slice(0, 300) : '',
                }
              : {}),
          }))
      : [];
    if (lines.length === 0) return NextResponse.json({ error: 'upstream-error' }, { status: 503 });
    return NextResponse.json({ lines });
  } catch (err) {
    console.error('dialogue route error:', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
