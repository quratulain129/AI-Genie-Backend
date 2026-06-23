const ollamaService = require('../services/ollamaService');
const Content = require('../models/Content');
const ContentSession = require('../models/ContentSession');
const {
  COMPLETE_RESPONSE_INSTRUCTION,
  TEXT_TOKEN_LIMITS,
} = require('../config/generationLimits');
const {
  getSessionHistory,
  buildPromptWithSessionHistory,
} = require('../utils/sessionContext');

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

    const contentTypes = {
      article:
        'Write a comprehensive, well-structured article with a clear introduction, multiple detailed body sections, and a full conclusion. No word limit — write the entire article',
      blog:
        'Write an engaging, complete blog post with introduction, detailed main content, and conclusion. No word limit — write the entire post',
      description: 'Write a detailed, complete product description',
      summary: 'Write a concise but complete summary',
    };

    const typeKey = contentType && contentTypes[contentType] ? contentType : 'general';

    let currentInstruction;
    if (contentType && contentTypes[contentType]) {
      currentInstruction = `${contentTypes[contentType]} about: ${prompt}\n\n${COMPLETE_RESPONSE_INSTRUCTION}`;
    } else {
      currentInstruction = `Generate high-quality text content about: ${prompt}\n\n${COMPLETE_RESPONSE_INSTRUCTION}`;
    }

    const sessionHistory = await getSessionHistory(session.id);
    const systemPrompt = buildPromptWithSessionHistory(sessionHistory, currentInstruction);

    const generatedContent = await ollamaService.generateText(systemPrompt, null, {
      max_tokens: TEXT_TOKEN_LIMITS[typeKey],
    });

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
