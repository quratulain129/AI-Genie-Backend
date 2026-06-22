const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { generateMarketingContent } = require('../controllers/marketingContentController');

// Validation rules
const generateValidation = [
  body('prompt').notEmpty().withMessage('Prompt is required'),
  body('type')
    .optional()
    .isIn(['ad', 'slogan', 'social', 'email', 'seo'])
    .withMessage('Invalid marketing type'),
  validate,
];

// Routes
router.post('/generate', authenticate, generateValidation, generateMarketingContent);

module.exports = router;

