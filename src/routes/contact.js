const express = require('express');
const { body } = require('express-validator');
const { submitContact } = require('../controllers/contactController');
const { validate } = require('../middleware/validation');

const router = express.Router();

const contactValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('company').optional().trim(),
  body('country').optional().trim(),
  body('phoneNumber').optional().trim(),
  body('agreed')
    .custom((value) => value === true || value === 'true')
    .withMessage('You must agree to the privacy policy'),
];

router.post('/', contactValidation, validate, submitContact);

module.exports = router;
