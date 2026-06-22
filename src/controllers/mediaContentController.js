const fs = require('fs');
const axios = require('axios');
const ollamaService = require('../services/ollamaService');
const Content = require('../models/Content');
const ContentSession = require('../models/ContentSession');
const { saveBase64Image, getImagePath, imageExists } = require('../utils/imageStorage');

async function getOrCreateSession(userId, prompt, sessionId) {
  if (sessionId) {
    const session = await ContentSession.findOne({
      where: { id: sessionId, userId, type: 'media' },
    });
    if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
    return session;
  }
  const title = prompt.length > 60 ? prompt.substring(0, 60) + '...' : prompt;
  return ContentSession.create({ userId, type: 'media', title });
}

const generateCaption = async (req, res) => {
  try {
    const { prompt, imageDescription, sessionId } = req.body;

    if (!prompt && !imageDescription) {
      return res.status(400).json({
        success: false,
        error: 'Prompt or image description is required',
        code: 'MISSING_PROMPT',
      });
    }

    const effectivePrompt = prompt || imageDescription;
    const session = await getOrCreateSession(req.user.id, effectivePrompt, sessionId);

    const systemPrompt = imageDescription
      ? `Generate an engaging caption for this image/video: ${imageDescription}\n\nCaption:`
      : `Generate an engaging, creative caption. Topic: ${prompt}\n\nCaption:`;

    const generatedContent = await ollamaService.generateText(systemPrompt, null, {
      temperature: 0.7,
      max_tokens: 200,
    });

    await Content.create({
      userId: req.user.id,
      sessionId: session.id,
      type: 'media',
      prompt: effectivePrompt,
      generatedContent,
      metadata: { mediaType: 'caption' },
    });

    await session.changed('updatedAt', true);
    await session.save();

    res.json({
      success: true,
      data: { caption: generatedContent, sessionId: session.id },
      message: 'Caption generated successfully',
    });
  } catch (error) {
    console.error('Caption generation error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to generate caption',
      code: 'GENERATION_ERROR',
    });
  }
};

const textToImage = async (req, res) => {
  try {
    const { prompt, negativePrompt, steps, width, height, sessionId } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required',
        code: 'MISSING_PROMPT',
      });
    }

    const session = await getOrCreateSession(req.user.id, prompt, sessionId);
    const imageServiceURL = process.env.IMAGE_SERVICE_URL || 'http://localhost:7860';

    const response = await axios.post(`${imageServiceURL}/api/txt2img`, {
      prompt,
      negative_prompt: negativePrompt || 'blurry, bad quality, distorted',
      steps: steps || 20,
      width: width || 512,
      height: height || 512,
    }, { timeout: 120000 });

    const content = await Content.create({
      userId: req.user.id,
      sessionId: session.id,
      type: 'media',
      prompt,
      generatedContent: '',
      metadata: { mediaType: 'text-to-image', hasImage: true },
    });

    saveBase64Image(req.user.id, content.id, response.data.data.image);

    await session.changed('updatedAt', true);
    await session.save();

    res.json({
      success: true,
      data: {
        image: response.data.data.image,
        format: 'png',
        sessionId: session.id,
        contentId: content.id,
      },
      message: 'Image generated successfully',
    });
  } catch (error) {
    console.error('Text-to-image generation error:', error);
    const msg = error.code === 'ECONNREFUSED'
      ? 'Image service is not running. Start it with: cd image-service && python server.py'
      : error.message || 'Failed to generate image';
    res.status(error.status || 500).json({
      success: false,
      error: msg,
      code: 'GENERATION_ERROR',
    });
  }
};

const generateLogo = async (req, res) => {
  try {
    const { prompt, companyName, style, sessionId } = req.body;

    if (!prompt && !companyName) {
      return res.status(400).json({
        success: false,
        error: 'Prompt or company name is required',
        code: 'MISSING_PROMPT',
      });
    }

    const effectivePrompt = prompt || companyName;
    const session = await getOrCreateSession(req.user.id, effectivePrompt, sessionId);

    const systemPrompt = `Generate a detailed description for a logo design. ${
      companyName ? `Company: ${companyName}. ` : ''
    }${style ? `Style: ${style}. ` : ''}Requirements: ${prompt || 'Create a professional logo'}\n\nLogo Description:`;

    const generatedContent = await ollamaService.generateText(systemPrompt, null, {
      temperature: 0.8,
      max_tokens: 300,
    });

    await Content.create({
      userId: req.user.id,
      sessionId: session.id,
      type: 'media',
      prompt: effectivePrompt,
      generatedContent,
      metadata: { mediaType: 'logo', companyName, style },
    });

    await session.changed('updatedAt', true);
    await session.save();

    res.json({
      success: true,
      data: {
        logoDescription: generatedContent,
        sessionId: session.id,
        note: 'This is a text description. For actual logo generation, integrate with an image generation service.',
      },
      message: 'Logo description generated successfully',
    });
  } catch (error) {
    console.error('Logo generation error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to generate logo description',
      code: 'GENERATION_ERROR',
    });
  }
};

const getGeneratedImage = async (req, res) => {
  try {
    const content = await Content.findOne({
      where: { id: req.params.contentId, userId: req.user.id, type: 'media' },
    });

    if (!content || content.metadata?.mediaType !== 'text-to-image') {
      return res.status(404).json({
        success: false,
        error: 'Image not found',
        code: 'NOT_FOUND',
      });
    }

    if (!imageExists(req.user.id, content.id)) {
      return res.status(404).json({
        success: false,
        error: 'Image file not found',
        code: 'FILE_NOT_FOUND',
      });
    }

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'private, max-age=31536000');
    fs.createReadStream(getImagePath(req.user.id, content.id)).pipe(res);
  } catch (error) {
    console.error('Get generated image error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to load image',
      code: 'IMAGE_ERROR',
    });
  }
};

module.exports = { generateCaption, textToImage, generateLogo, getGeneratedImage };
