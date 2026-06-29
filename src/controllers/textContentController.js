const ollamaService = require('../services/ollamaService');
const Content = require('../models/Content');
const ContentSession = require('../models/ContentSession');
const {
  GENERAL_INSTRUCTION,
  BRIEF_REPLY_INSTRUCTION,
  TEXT_TYPE_CONFIG,
  TEXT_TOKEN_LIMITS,
} = require('../config/generationLimits');
const {
  getSessionHistory,
  buildPromptWithSessionHistory,
} = require('../utils/sessionContext');

function isCasualGreeting(prompt) {
  const trimmed = prompt.trim();
  if (!trimmed) return true;

  return /^(hi|hello|hey|hiya|yo|sup|good\s+(morning|afternoon|evening)|thanks|thank\s*you|ok|okay|bye|goodbye)[\s!.?,]*$/i.test(
    trimmed
  );
}

function buildGenerationPlan(contentType, prompt) {
  const type = contentType || 'general';
  const isGeneral = !contentType || contentType === '';

  // Brief replies only for General + actual greetings (never for Article/Blog/etc.)
  if (isGeneral && isCasualGreeting(prompt)) {
    return {
      instruction: BRIEF_REPLY_INSTRUCTION(prompt),
      genOptions: {
        max_tokens: TEXT_TOKEN_LIMITS.generalBrief,
        maxContinuations: 0,
        temperature: 0.7,
      },
    };
  }

  const typeConfig = TEXT_TYPE_CONFIG[type];

  if (typeConfig) {
    const { buildInstruction, maxTokens, maxContinuations, temperature, continuationPrompt } =
      typeConfig;
    return {
      instruction: buildInstruction(prompt),
      genOptions: {
        max_tokens: maxTokens,
        maxContinuations: maxContinuations ?? 0,
        temperature: temperature ?? 0.7,
        ...(continuationPrompt ? { continuationPrompt } : {}),
      },
    };
  }

  return {
    instruction: `${GENERAL_INSTRUCTION}\n\nUser request: ${prompt}`,
    genOptions: {
      max_tokens: TEXT_TOKEN_LIMITS.general,
      maxContinuations: 1,
      temperature: 0.7,
    },
  };
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

    const { instruction, genOptions } = buildGenerationPlan(contentType, prompt);
    const sessionHistory = await getSessionHistory(session.id);
    const systemPrompt = buildPromptWithSessionHistory(sessionHistory, instruction);

    const generatedContent = await ollamaService.generateText(
      systemPrompt,
      null,
      genOptions
    );

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
