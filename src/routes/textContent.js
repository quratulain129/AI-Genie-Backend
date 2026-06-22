const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { generateTextContent } = require('../controllers/textContentController');

// Validation rules
const generateValidation = [
  body('prompt').notEmpty().withMessage('Prompt is required'),
  body('contentType')
    .optional()
    .isIn(['article', 'blog', 'description', 'summary'])
    .withMessage('Invalid content type'),
  validate,
];

// Routes
router.post('/generate', authenticate, generateValidation, generateTextContent);

module.exports = router;

