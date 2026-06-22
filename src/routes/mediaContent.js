const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const {
  generateCaption,
  textToImage,
  generateLogo,
  getGeneratedImage,
} = require('../controllers/mediaContentController');

// Validation rules
const captionValidation = [
  body('prompt').optional().notEmpty().withMessage('Prompt cannot be empty'),
  body('imageDescription').optional().notEmpty().withMessage('Image description cannot be empty'),
  validate,
];

const logoValidation = [
  body('prompt').optional().notEmpty().withMessage('Prompt cannot be empty'),
  body('companyName').optional().notEmpty().withMessage('Company name cannot be empty'),
  validate,
];

// Routes
router.post('/caption', authenticate, captionValidation, generateCaption);
router.post('/text-to-image', authenticate, textToImage);
router.post('/logo', authenticate, logoValidation, generateLogo);
router.get('/images/:contentId', authenticate, getGeneratedImage);

module.exports = router;

