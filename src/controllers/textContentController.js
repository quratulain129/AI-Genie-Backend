const ollamaService = require('../services/ollamaService');
const Content = require('../models/Content');
const ContentSession = require('../models/ContentSession');
const { TEXT_TYPE_CONFIG } = require('../config/generationLimits');
const {
  getSessionHistory,
  buildPromptWithSessionHistory,
} = require('../utils/sessionContext');

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

async function finalizeArticle(content, topic) {
  let result = content.trim();
  let words = countWords(result);

  if (words >= 700 && words <= 750) {
    return result;
  }

  if (words < 700) {
    const expandPrompt = `The article below is only ${words} words and is incomplete. Rewrite it as ONE complete article of 700-750 words about "${topic}".

Include a full introduction, 3-4 detailed body sections with subheadings, and a proper conclusion that covers the entire topic. Output only the finished article.

Draft to expand:
${result}`;
    result = await ollamaService.generateText(expandPrompt, null, {
      max_tokens: TEXT_TYPE_CONFIG.article.maxTokens,
      temperature: TEXT_TYPE_CONFIG.article.temperature,
    });
    words = countWords(result);
  }

  if (words > 750) {
    const trimPrompt = `Shorten the article below to 700-750 words while keeping all key points, subheadings, and a complete conclusion. Output only the revised article.

${result}`;
    result = await ollamaService.generateText(trimPrompt, null, {
      max_tokens: TEXT_TYPE_CONFIG.article.maxTokens,
      temperature: TEXT_TYPE_CONFIG.article.temperature,
    });
  }

  return result.trim();
}

const generateTextContent = async (req, res) => {
  try {
    const { prompt, contentType, sessionId } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required',
        code: 'MISSING_PROMPT',
      });
    }

    let session;
    if (sessionId) {
      session = await ContentSession.findOne({
        where: { id: sessionId, userId: req.user.id, type: 'text' },
      });
      if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }
    } else {
      const title = prompt.length > 60 ? prompt.substring(0, 60) + '...' : prompt;
      session = await ContentSession.create({
        userId: req.user.id,
        type: 'text',
        title,
      });
    }

    const typeKey = contentType && TEXT_TYPE_CONFIG[contentType] ? contentType : 'general';
    const typeConfig = TEXT_TYPE_CONFIG[typeKey];
    const currentInstruction = `${typeConfig.task(prompt)}\n\n${typeConfig.completion}`;

    const sessionHistory = await getSessionHistory(session.id);
    const systemPrompt = buildPromptWithSessionHistory(sessionHistory, currentInstruction);

    let generatedContent = await ollamaService.generateText(systemPrompt, null, {
      max_tokens: typeConfig.maxTokens,
      temperature: typeConfig.temperature,
    });

    if (typeKey === 'article') {
      generatedContent = await finalizeArticle(generatedContent, prompt);
    }

    await Content.create({
      userId: req.user.id,
      sessionId: session.id,
      type: 'text',
      prompt,
      generatedContent,
      metadata: { contentType: contentType || 'general' },
    });

    await session.changed('updatedAt', true);
    await session.save();

    res.json({
      success: true,
      data: {
        content: generatedContent,
        type: contentType || 'general',
        sessionId: session.id,
      },
      message: 'Text content generated successfully',
    });
  } catch (error) {
    console.error('Text content generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate text content',
      code: 'GENERATION_ERROR',
    });
  }
};

module.exports = { generateTextContent };
