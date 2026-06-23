// Ollama num_predict: -1 = generate until natural stop (no artificial cutoff)
const UNLIMITED = -1;

const COMPLETE_RESPONSE_INSTRUCTION =
  'Write the FULL complete response from start to finish. There is NO word limit. Do not stop early. Do not summarize or abbreviate. Do not stop mid-sentence, mid-paragraph, or mid-section. Write until the entire piece is finished.';

const SLOGAN_INSTRUCTION = `Generate exactly 10 catchy, eye-catching slogan options.

Rules:
- Each slogan MUST be one short line only (maximum 10 words).
- Output ONLY the numbered slogans — no title, introduction, explanation, or paragraphs.
- Do NOT write an article, essay, or marketing report.
- Format exactly like this:
1. [slogan]
2. [slogan]
...
10. [slogan]`;

const TEXT_TOKEN_LIMITS = {
  article: UNLIMITED,
  blog: UNLIMITED,
  description: 4096,
  summary: 2048,
  general: UNLIMITED,
};

const MARKETING_TYPE_CONFIG = {
  ad: {
    task: (prompt) =>
      `Create compelling, persuasive advertisement copy that is attention-grabbing. Topic: ${prompt}`,
    completion: 'Write complete ad copy. Keep it concise and punchy — not a long article.',
    maxTokens: 1024,
    temperature: 0.8,
  },
  slogan: {
    task: (prompt) => `Create eye-catching one-line slogans for: ${prompt}`,
    completion: SLOGAN_INSTRUCTION,
    maxTokens: 300,
    temperature: 0.9,
  },
  social: {
    task: (prompt) =>
      `Create engaging social media post content that is shareable and relevant. Topic: ${prompt}`,
    completion: 'Write ready-to-post social content. Keep it short and engaging — not a long article.',
    maxTokens: 512,
    temperature: 0.8,
  },
  email: {
    task: (prompt) => `Create professional email marketing content. Topic: ${prompt}`,
    completion: COMPLETE_RESPONSE_INSTRUCTION,
    maxTokens: 2048,
    temperature: 0.7,
  },
  seo: {
    task: (prompt) =>
      `Create SEO-optimized content with relevant keywords. Topic: ${prompt}`,
    completion: COMPLETE_RESPONSE_INSTRUCTION,
    maxTokens: UNLIMITED,
    temperature: 0.7,
  },
  general: {
    task: (prompt) => `Create effective marketing content. Topic: ${prompt}`,
    completion: 'Write complete marketing content appropriate to the request.',
    maxTokens: 1024,
    temperature: 0.8,
  },
};

const MARKETING_TOKEN_LIMITS = {
  ad: MARKETING_TYPE_CONFIG.ad.maxTokens,
  slogan: MARKETING_TYPE_CONFIG.slogan.maxTokens,
  social: MARKETING_TYPE_CONFIG.social.maxTokens,
  email: MARKETING_TYPE_CONFIG.email.maxTokens,
  seo: MARKETING_TYPE_CONFIG.seo.maxTokens,
  general: MARKETING_TYPE_CONFIG.general.maxTokens,
};

const CHAT_TOKEN_LIMIT = UNLIMITED;
const CAPTION_TOKEN_LIMIT = 1024;
const LOGO_TOKEN_LIMIT = 2048;

module.exports = {
  UNLIMITED,
  COMPLETE_RESPONSE_INSTRUCTION,
  SLOGAN_INSTRUCTION,
  MARKETING_TYPE_CONFIG,
  TEXT_TOKEN_LIMITS,
  MARKETING_TOKEN_LIMITS,
  CHAT_TOKEN_LIMIT,
  CAPTION_TOKEN_LIMIT,
  LOGO_TOKEN_LIMIT,
};
