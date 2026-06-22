const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const {
  sendMessage,
  getConversation,
  listConversations,
  deleteConversation,
  renameConversation,
} = require('../controllers/chatController');

const messageValidation = [
  body('message').notEmpty().withMessage('Message is required'),
  body('conversationId').optional().isString().withMessage('Conversation ID must be a string'),
  validate,
];

const renameValidation = [
  body('title').notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  validate,
];

router.post('/message', authenticate, messageValidation, sendMessage);
router.get('/conversations', authenticate, listConversations);
router.get('/conversation/:conversationId', authenticate, getConversation);
router.delete('/conversation/:conversationId', authenticate, deleteConversation);
router.patch('/conversation/:conversationId', authenticate, renameValidation, renameConversation);

module.exports = router;
