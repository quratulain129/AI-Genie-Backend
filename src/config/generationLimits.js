// Ollama num_predict: -1 = generate until natural stop (no artificial cutoff)
const UNLIMITED = -1;

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

const COMPLETE_RESPONSE_INSTRUCTION =
  'Write the FULL complete response from start to finish. There is NO word limit. Do not stop early. Do not summarize or abbreviate. Do not stop mid-sentence, mid-paragraph, or mid-section. Write until the entire piece is finished.';

const ARTICLE_WORD_MIN = 700;
const ARTICLE_WORD_MAX = 750;

const ARTICLE_INSTRUCTION = `Write a complete, self-contained article between ${ARTICLE_WORD_MIN} and ${ARTICLE_WORD_MAX} words.

Requirements:
- You MUST write at least ${ARTICLE_WORD_MIN} words. A short paragraph is NOT acceptable.
- Cover the entire topic: a clear introduction, multiple detailed body sections, and a proper conclusion.
- The full article MUST be ${ARTICLE_WORD_MIN}-${ARTICLE_WORD_MAX} words. Do not stop early. Do not exceed ${ARTICLE_WORD_MAX} words.
- Finish every section — no incomplete thoughts, cliffhangers, or "to be continued".
- End with a concluding paragraph that fully wraps up the topic within the word limit.`;

const GENERAL_INSTRUCTION = `Generate helpful text that matches what the user asked for.
- Short or casual inputs (greetings, quick questions) → reply in 1-3 sentences only.
- Substantial topics → give a focused, complete answer without unnecessary padding.
- Do NOT write essays, articles, or long lectures unless the user clearly asks for detailed content.`;

const SUMMARY_INSTRUCTION = `Write a clear, concise summary of the content or topic below.

Requirements:
- Capture only the main ideas and key points — no filler, repetition, or tangents.
- Keep it brief: usually 100-200 words (shorter if the source is short).
- Use plain, readable prose. Do NOT write an essay, article, or long report.
- If given a topic, summarize the essential points someone should know.
- If given text to summarize, distill it faithfully without adding unrelated content.`;

const BLOG_WORD_MIN = 400;
const BLOG_WORD_MAX = 600;

const BLOG_INSTRUCTION = `Write a complete, engaging blog post between ${BLOG_WORD_MIN} and ${BLOG_WORD_MAX} words.

Requirements:
- Structure: introduction, informative body sections, and a conclusion.
- Cover the topic fully within ${BLOG_WORD_MIN}-${BLOG_WORD_MAX} words. Do not stop early or exceed ${BLOG_WORD_MAX} words.
- Conversational, readable tone suited for online readers.
- Do not write an academic essay or overly formal article.`;

const DESCRIPTION_WORD_MIN = 120;
const DESCRIPTION_WORD_MAX = 250;

const DESCRIPTION_INSTRUCTION = `Write a compelling product description between ${DESCRIPTION_WORD_MIN} and ${DESCRIPTION_WORD_MAX} words.

Requirements:
- Highlight key features, benefits, and what makes the product valuable.
- Concise and scannable — not an article, essay, or blog post.
- Open with a strong hook. Use persuasive, clear language.
- Focus on selling points a shopper needs to make a decision.`;

const BRIEF_REPLY_INSTRUCTION = (prompt) =>
  `The user said: "${prompt}"\n\nReply briefly and naturally in 1-3 sentences. Do not write an essay, article, blog post, product description, or long summary.`;

const TEXT_TYPE_CONFIG = {
  article: {
    buildInstruction: (prompt) => `${ARTICLE_INSTRUCTION}\n\nTopic: ${prompt}`,
    maxTokens: 1200,
    maxContinuations: 3,
    temperature: 0.65,
    continuationPrompt:
      'Continue the article from exactly where you stopped. Keep the total length between 700 and 750 words. Complete all remaining sections and end with a full conclusion. Do not repeat any text already written.',
  },
  blog: {
    buildInstruction: (prompt) => `${BLOG_INSTRUCTION}\n\nTopic: ${prompt}`,
    maxTokens: 900,
    maxContinuations: 1,
    temperature: 0.7,
    continuationPrompt: `Continue the blog post from exactly where you stopped. Keep the total length between ${BLOG_WORD_MIN} and ${BLOG_WORD_MAX} words. Finish with a proper conclusion. Do not repeat any text already written.`,
  },
  description: {
    buildInstruction: (prompt) => `${DESCRIPTION_INSTRUCTION}\n\nProduct: ${prompt}`,
    maxTokens: 400,
    maxContinuations: 0,
    temperature: 0.7,
  },
  summary: {
    buildInstruction: (prompt) =>
      `${SUMMARY_INSTRUCTION}\n\nContent or topic to summarize:\n${prompt}`,
    maxTokens: 512,
    maxContinuations: 0,
    temperature: 0.6,
  },
};

const TEXT_TOKEN_LIMITS = {
  article: TEXT_TYPE_CONFIG.article.maxTokens,
  blog: TEXT_TYPE_CONFIG.blog.maxTokens,
  description: TEXT_TYPE_CONFIG.description.maxTokens,
  summary: TEXT_TYPE_CONFIG.summary.maxTokens,
  general: 1024,
  generalBrief: 150,
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
  ARTICLE_WORD_MIN,
  ARTICLE_WORD_MAX,
  GENERAL_INSTRUCTION,
  SUMMARY_INSTRUCTION,
  BLOG_INSTRUCTION,
  DESCRIPTION_INSTRUCTION,
  BRIEF_REPLY_INSTRUCTION,
  TEXT_TYPE_CONFIG,
  SLOGAN_INSTRUCTION,
  MARKETING_TYPE_CONFIG,
  TEXT_TOKEN_LIMITS,
  MARKETING_TOKEN_LIMITS,
  CHAT_TOKEN_LIMIT,
  CAPTION_TOKEN_LIMIT,
  LOGO_TOKEN_LIMIT,
};
