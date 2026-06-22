const ContentSession = require('../models/ContentSession');
const Content = require('../models/Content');
const { deleteUserImages } = require('../utils/imageStorage');

const listSessions = async (req, res) => {
  try {
    const { type } = req.query;

    if (!type || !['text', 'marketing', 'media'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Valid type query param required (text, marketing, media)',
      });
    }

    const sessions = await ContentSession.findAll({
      where: { userId: req.user.id, type },
      order: [['updatedAt', 'DESC']],
      attributes: ['id', 'title', 'type', 'createdAt', 'updatedAt'],
    });

    res.json({ success: true, data: { sessions } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getSession = async (req, res) => {
  try {
    const session = await ContentSession.findOne({
      where: { id: req.params.sessionId, userId: req.user.id },
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const contents = await Content.findAll({
      where: { sessionId: session.id },
      order: [['createdAt', 'ASC']],
      attributes: ['id', 'prompt', 'generatedContent', 'metadata', 'createdAt'],
    });

    res.json({
      success: true,
      data: {
        session: {
          id: session.id,
          title: session.title,
          type: session.type,
          contents,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteSession = async (req, res) => {
  try {
    const session = await ContentSession.findOne({
      where: { id: req.params.sessionId, userId: req.user.id },
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const contents = await Content.findAll({
      where: { sessionId: session.id },
      attributes: ['id', 'metadata'],
    });
    const imageContentIds = contents
      .filter((c) => c.metadata?.mediaType === 'text-to-image')
      .map((c) => c.id);
    deleteUserImages(req.user.id, imageContentIds);

    await Content.destroy({ where: { sessionId: session.id } });
    await session.destroy();

    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const renameSession = async (req, res) => {
  try {
    const { title } = req.body;
    const session = await ContentSession.findOne({
      where: { id: req.params.sessionId, userId: req.user.id },
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    session.title = title;
    await session.save();

    res.json({ success: true, data: { session } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { listSessions, getSession, deleteSession, renameSession };
