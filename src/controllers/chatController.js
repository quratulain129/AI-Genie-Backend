const ollamaService = require('../services/ollamaService');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { CHAT_TOKEN_LIMIT } = require('../config/generationLimits');

const sendMessage = async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
        code: 'MISSING_MESSAGE',
      });
    }

    let conversation;

    if (conversationId) {
      conversation = await Conversation.findOne({
        where: { id: conversationId, userId: req.user.id },
      });
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found',
          code: 'CONVERSATION_NOT_FOUND',
        });
      }
    } else {
      const title = message.length > 60 ? message.substring(0, 60) + '...' : message;
      conversation = await Conversation.create({
        userId: req.user.id,
        title,
      });
    }

    await Message.create({
      conversationId: conversation.id,
      role: 'user',
      content: message,
    });

    const recentMessages = await Message.findAll({
      where: { conversationId: conversation.id },
      order: [['createdAt', 'ASC']],
      limit: 20,
    });

    const chatMessages = [
      {
        role: 'system',
        content:
          'You are a helpful AI assistant. Continue the conversation naturally using the full message history. Always give complete answers — do not stop mid-sentence or leave your response unfinished.',
      },
      ...recentMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    const response = await ollamaService.generateChat(chatMessages, null, {
      temperature: 0.7,
      max_tokens: CHAT_TOKEN_LIMIT,
    });

    await Message.create({
      conversationId: conversation.id,
      role: 'assistant',
      content: response,
    });

    await conversation.changed('updatedAt', true);
    await conversation.save();

    res.json({
      success: true,
      data: {
        response,
        conversationId: conversation.id,
      },
      message: 'Message processed successfully',
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process chat message',
      code: 'CHAT_ERROR',
    });
  }
};

const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      where: { id: conversationId, userId: req.user.id },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
        code: 'CONVERSATION_NOT_FOUND',
      });
    }

    const messages = await Message.findAll({
      where: { conversationId: conversation.id },
      order: [['createdAt', 'ASC']],
      attributes: ['id', 'role', 'content', 'createdAt'],
    });

    res.json({
      success: true,
      data: {
        conversation: {
          id: conversation.id,
          title: conversation.title,
          messages,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get conversation',
      code: 'GET_CONVERSATION_ERROR',
    });
  }
};

const listConversations = async (req, res) => {
  try {
    const conversations = await Conversation.findAll({
      where: { userId: req.user.id },
      order: [['updatedAt', 'DESC']],
      attributes: ['id', 'title', 'createdAt', 'updatedAt'],
    });

    res.json({
      success: true,
      data: { conversations },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list conversations',
      code: 'LIST_CONVERSATIONS_ERROR',
    });
  }
};

const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      where: { id: conversationId, userId: req.user.id },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
        code: 'CONVERSATION_NOT_FOUND',
      });
    }

    await Message.destroy({ where: { conversationId: conversation.id } });
    await conversation.destroy();

    res.json({
      success: true,
      message: 'Conversation deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete conversation',
      code: 'DELETE_CONVERSATION_ERROR',
    });
  }
};

const renameConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { title } = req.body;

    const conversation = await Conversation.findOne({
      where: { id: conversationId, userId: req.user.id },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
        code: 'CONVERSATION_NOT_FOUND',
      });
    }

    conversation.title = title;
    await conversation.save();

    res.json({
      success: true,
      data: { conversation },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to rename conversation',
      code: 'RENAME_CONVERSATION_ERROR',
    });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  listConversations,
  deleteConversation,
  renameConversation,
};
