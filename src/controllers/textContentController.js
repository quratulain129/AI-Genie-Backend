const ollamaService = require('../services/ollamaService');
const Content = require('../models/Content');
const ContentSession = require('../models/ContentSession');

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

    let systemPrompt = '';
    const contentTypes = {
      article: 'Write a comprehensive, well-structured article',
      blog: 'Write an engaging blog post',
      description: 'Write a detailed product description',
      summary: 'Write a concise summary',
    };

    if (contentType && contentTypes[contentType]) {
      systemPrompt = `${contentTypes[contentType]} about: ${prompt}\n\n`;
    } else {
      systemPrompt = `Generate high-quality text content about: ${prompt}\n\n`;
    }

    const generatedContent = await ollamaService.generateText(systemPrompt);

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
