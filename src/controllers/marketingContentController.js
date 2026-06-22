const ollamaService = require('../services/ollamaService');
const Content = require('../models/Content');
const ContentSession = require('../models/ContentSession');

const generateMarketingContent = async (req, res) => {
  try {
    const { prompt, type, sessionId } = req.body;

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
        where: { id: sessionId, userId: req.user.id, type: 'marketing' },
      });
      if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }
    } else {
      const title = prompt.length > 60 ? prompt.substring(0, 60) + '...' : prompt;
      session = await ContentSession.create({
        userId: req.user.id,
        type: 'marketing',
        title,
      });
    }

    let systemPrompt = '';
    const marketingTypes = {
      ad: `Create compelling advertisement copy that is persuasive and attention-grabbing. Topic: ${prompt}`,
      slogan: `Create a catchy, memorable slogan. Topic: ${prompt}`,
      social: `Create engaging social media post content that is shareable and relevant. Topic: ${prompt}`,
      email: `Create professional email marketing content. Topic: ${prompt}`,
      seo: `Create SEO-optimized content with relevant keywords. Topic: ${prompt}`,
    };

    if (type && marketingTypes[type]) {
      systemPrompt = marketingTypes[type];
    } else {
      systemPrompt = `Create effective marketing content. Topic: ${prompt}`;
    }

    const generatedContent = await ollamaService.generateText(systemPrompt, null, {
      temperature: 0.8,
      max_tokens: 512,
    });

    await Content.create({
      userId: req.user.id,
      sessionId: session.id,
      type: 'marketing',
      prompt,
      generatedContent,
      metadata: { marketingType: type || 'general' },
    });

    await session.changed('updatedAt', true);
    await session.save();

    res.json({
      success: true,
      data: {
        content: generatedContent,
        type: type || 'general',
        sessionId: session.id,
      },
      message: 'Marketing content generated successfully',
    });
  } catch (error) {
    console.error('Marketing content generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate marketing content',
      code: 'GENERATION_ERROR',
    });
  }
};

module.exports = { generateMarketingContent };
