// Ollama num_predict: -1 = generate until natural stop (no artificial cutoff)
const UNLIMITED = -1;

const COMPLETE_RESPONSE_INSTRUCTION =
  'Write the FULL complete response from start to finish. Do not stop early. Do not summarize or abbreviate. Do not stop mid-sentence, mid-paragraph, or mid-section. Write until the entire piece is finished.';

const ARTICLE_INSTRUCTION = `Write a complete, polished article of exactly 700 to 750 words (minimum 700, maximum 750).

Structure:
- Introduction (about 80-100 words): hook the reader and clearly introduce the topic
- Body (about 500-550 words): 3-4 sections with clear subheadings that fully explain the topic
- Conclusion (about 80-100 words): summarize the main points and end with a clear takeaway

Rules:
- Cover the ENTIRE topic context within the word limit — do not skip important aspects
- Write in full paragraphs; use complete sentences throughout
- Do not stop mid-sentence, mid-paragraph, or mid-section
- Do not write fewer than 700 words or more than 750 words
- Output only the finished article — no meta commentary`;

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

const TEXT_TYPE_CONFIG = {
  article: {
    task: (prompt) =>
      `Write a comprehensive article about: ${prompt}`,
    completion: ARTICLE_INSTRUCTION,
    maxTokens: 1400,
    temperature: 0.7,
  },
  blog: {
    task: (prompt) =>
      `Write an engaging, complete blog post about: ${prompt}`,
    completion: COMPLETE_RESPONSE_INSTRUCTION,
    maxTokens: UNLIMITED,
    temperature: 0.7,
  },
  description: {
    task: (prompt) => `Write a detailed, complete product description for: ${prompt}`,
    completion: COMPLETE_RESPONSE_INSTRUCTION,
    maxTokens: 4096,
    temperature: 0.7,
  },
  summary: {
    task: (prompt) => `Write a concise but complete summary of: ${prompt}`,
    completion: COMPLETE_RESPONSE_INSTRUCTION,
    maxTokens: 2048,
    temperature: 0.7,
  },
  general: {
    task: (prompt) => `Generate high-quality text content about: ${prompt}`,
    completion: COMPLETE_RESPONSE_INSTRUCTION,
    maxTokens: UNLIMITED,
    temperature: 0.7,
  },
};

const TEXT_TOKEN_LIMITS = {
  article: TEXT_TYPE_CONFIG.article.maxTokens,
  blog: TEXT_TYPE_CONFIG.blog.maxTokens,
  description: TEXT_TYPE_CONFIG.description.maxTokens,
  summary: TEXT_TYPE_CONFIG.summary.maxTokens,
  general: TEXT_TYPE_CONFIG.general.maxTokens,
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
  ARTICLE_INSTRUCTION,
  SLOGAN_INSTRUCTION,
  TEXT_TYPE_CONFIG,
  MARKETING_TYPE_CONFIG,
  TEXT_TOKEN_LIMITS,
  MARKETING_TOKEN_LIMITS,
  CHAT_TOKEN_LIMIT,
  CAPTION_TOKEN_LIMIT,
  LOGO_TOKEN_LIMIT,
};
