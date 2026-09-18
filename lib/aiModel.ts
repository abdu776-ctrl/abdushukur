/**
 * The model the three AI routes call.
 *
 * It lived as a default in each route, spelled out three times. When Groq
 * retired llama-3.3-70b-versatile the assistant started answering every
 * question with a 404, and the fix had to be made — correctly — in three
 * files. One constant instead.
 *
 * Why this one: Groq named openai/gpt-oss-120b as the replacement for the
 * retired model, and it is documented at 128k context across 80+ languages.
 * This app answers in six, and has to keep Korean terms intact inside a
 * Vietnamese or Russian sentence, so breadth of language matters more here
 * than raw reasoning.
 *
 * GROQ_MODEL overrides it, so a bad default can be corrected from the Vercel
 * dashboard without a deploy. Worth knowing the next time a model is retired.
 */
export const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
