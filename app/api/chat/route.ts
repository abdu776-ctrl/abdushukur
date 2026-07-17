import Anthropic from '@anthropic-ai/sdk';
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

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response('No messages provided', { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        'AI is not configured yet. Please set the ANTHROPIC_API_KEY environment variable.',
        { status: 503 }
      );
    }

    const client = new Anthropic();

    // Keep only user/assistant turns with non-empty content, ensure it starts
    // with a user turn (the API rejects a leading assistant message).
    const cleaned: Anthropic.MessageParam[] = messages
      .filter(
        (m: { role: string; content: string }) =>
          (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim()
      )
      .map((m: { role: 'user' | 'assistant'; content: string }) => ({ role: m.role, content: m.content }));

    while (cleaned.length && cleaned[0].role !== 'user') cleaned.shift();

    if (!cleaned.length) {
      return new Response('No user message provided', { status: 400 });
    }

    const anthropicStream = client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: cleaned,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of anthropicStream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } catch (err) {
          console.error('chat stream error:', err);
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
