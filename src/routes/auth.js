const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const {
  signup,
  signin,
  getMe,
  googleAuth,
  facebookAuth,
  logout,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Validation rules
const signupValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('username')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  validate,
];

const signinValidation = [
  body('username').notEmpty().withMessage('Username or email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// Routes
router.post('/signup', signupValidation, signup);
router.post('/signin', signinValidation, signin);
router.post('/google', googleAuth);
router.post('/facebook', facebookAuth);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

module.exports = router;

