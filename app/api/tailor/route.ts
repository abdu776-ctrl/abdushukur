import { NextRequest } from 'next/server';

// Tailors a 자기소개서 section to a specific job posting using the applicant's
// OWN material. It must never invent a personal history — if the applicant has
// given nothing to work from, it returns a tailored outline plus the concrete
// questions they need to answer instead of a fabricated story.

const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const SECTION_BRIEF: Record<string, string> = {
  growth: 'the 성장과정 section: one decisive formative experience, what value it shaped, and how that value shows up in this role.',
  personality: 'the 성격 (강점·약점) section: a concrete strength with evidence, and an honest weakness with what they do about it.',
  motivation: 'the 지원동기 section: why THIS company (its direction/products/news from the posting) and why THIS role (how their experience fits).',
  aspiration: 'the 입사 후 포부 section: realistic goals after joining and how they would contribute.',
  custom: 'the section described by its title.',
};

const LANG_NAME: Record<string, string> = {
  ko: 'Korean', en: 'English', uz: 'Uzbek', ru: 'Russian',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sectionType = 'custom',
      sectionTitle = '',
      company = '',
      position = '',
      jobPosting = '',
      content = '',
      profile = '',
      charLimit = 800,
      locale = 'uz',
    } = body ?? {};

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'AI is not configured yet. Please set the GROQ_API_KEY environment variable.' },
        { status: 503 }
      );
    }

    const userLang = LANG_NAME[locale] || 'Uzbek';
    const brief = SECTION_BRIEF[sectionType] || SECTION_BRIEF.custom;
    // Material can come from what they already wrote in this section, or from
    // their saved career profile — either is real, applicant-supplied fact.
    const hasDraft = String(content).trim().length >= 40;
    const hasProfile = String(profile).trim().length >= 20;
    const hasMaterial = hasDraft || hasProfile;

    const system = [
      'You help an international applicant in South Korea write a 자기소개서 (Korean self-introduction letter).',
      `You are writing ${brief}`,
      '',
      'HARD RULES — these override everything else:',
      '1. NEVER invent facts about the applicant. Do not make up a birthplace, family, school, employer, project, award, number, or achievement. Use ONLY what the applicant actually provided.',
      '2. If the applicant has given little or nothing to work from, DO NOT write a fake story. Instead return a short tailored outline for this section plus 3–5 specific questions they must answer, based on the job posting. Write that outline and those questions in ' + userLang + '.',
      '3. When the applicant HAS provided material, rewrite and tailor THEIR material — keep their real facts, improve structure, tone and fit to the posting.',
      '4. Write the 자기소개서 text itself in Korean, using Hangul only. Never use Chinese characters (Hanja). Use formal 존댓말.',
      `5. Keep the Korean text within about ${charLimit} characters.`,
      '6. Output only the text itself — no headings like "Here is", no explanations, no markdown fences.',
    ].join('\n');

    const parts: string[] = [];
    if (company) parts.push(`Target company: ${company}`);
    if (position) parts.push(`Target position: ${position}`);
    if (sectionTitle) parts.push(`Section title: ${sectionTitle}`);
    if (jobPosting.trim()) parts.push(`Job posting (tailor to this):\n${String(jobPosting).slice(0, 4000)}`);
    if (hasProfile) {
      parts.push(`The applicant's saved career profile (real facts — use these):\n${String(profile).slice(0, 3000)}`);
    }
    if (hasDraft) {
      parts.push(`The applicant's notes / current draft for this section (use ONLY these facts):\n${String(content).slice(0, 4000)}`);
    }
    if (!hasMaterial) {
      parts.push('The applicant has NOT provided their own material yet. Follow HARD RULE 2 — give a tailored outline and specific questions, do not invent a story.');
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: parts.join('\n\n') },
        ],
        temperature: 0.4,
        max_tokens: 1200,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text().catch(() => '');
      console.error('tailor groq error:', groqRes.status, errText);
      return Response.json({ error: `AI error ${groqRes.status}` }, { status: 502 });
    }

    const data = await groqRes.json();
    const text: string = data?.choices?.[0]?.message?.content?.trim() ?? '';
    if (!text) return Response.json({ error: 'Empty AI response' }, { status: 502 });

    // outline mode = we had nothing personal to work from
    return Response.json({ text, outline: !hasMaterial });
  } catch (err) {
    console.error('tailor route error:', err);
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
