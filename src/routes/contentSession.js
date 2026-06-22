const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const {
  listSessions,
  getSession,
  deleteSession,
  renameSession,
} = require('../controllers/contentSessionController');

const renameValidation = [
  body('title').notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  validate,
];

router.get('/', authenticate, listSessions);
router.get('/:sessionId', authenticate, getSession);
router.delete('/:sessionId', authenticate, deleteSession);
router.patch('/:sessionId', authenticate, renameValidation, renameSession);

module.exports = router;
