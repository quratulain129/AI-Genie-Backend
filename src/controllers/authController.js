const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR',
      });
    }

    const { email, username, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: existingUser.email === email ? 'Email already exists' : 'Username already exists',
        code: 'USER_EXISTS',
      });
    }

    // Create user
    const user = await User.create({
      email,
      username,
      password,
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      },
      message: 'User registered successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error during registration',
      code: 'SIGNUP_ERROR',
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/signin
// @access  Public
const signin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR',
      });
    }

    const { username, password } = req.body;

    // Check for user (by username or email)
    const user = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email: username }],
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      },
      message: 'Login successful',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error during login',
      code: 'SIGNIN_ERROR',
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error',
      code: 'GET_USER_ERROR',
    });
  }
};

// @desc    Google OAuth (ready for frontend integration)
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  try {
    const { token, email, name } = req.body;

    // TODO: Verify Google token with Google API
    // For now, this is a placeholder for frontend integration
    // Frontend should send verified user info from Google

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email and name are required',
        code: 'MISSING_DATA',
      });
    }

    // Check if user exists
    let user = await User.findOne({ where: { email } });

    if (user) {
      // User exists, generate token
      const jwtToken = generateToken(user.id);
      return res.json({
        success: true,
        data: {
          token: jwtToken,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
          },
        },
        message: 'Login successful',
      });
    }

    // Create new user
    user = await User.create({
      email,
      username: name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
      oauthProvider: 'google',
      oauthId: email,
    });

    const jwtToken = generateToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        token: jwtToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      },
      message: 'User registered successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error during Google authentication',
      code: 'GOOGLE_AUTH_ERROR',
    });
  }
};

// @desc    Facebook OAuth (ready for frontend integration)
// @route   POST /api/auth/facebook
// @access  Public
const facebookAuth = async (req, res) => {
  try {
    const { token, email, name } = req.body;

    // TODO: Verify Facebook token with Facebook API
    // For now, this is a placeholder for frontend integration
    // Frontend should send verified user info from Facebook

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email and name are required',
        code: 'MISSING_DATA',
      });
    }

    // Check if user exists
    let user = await User.findOne({ where: { email } });

    if (user) {
      // User exists, generate token
      const jwtToken = generateToken(user.id);
      return res.json({
        success: true,
        data: {
          token: jwtToken,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
          },
        },
        message: 'Login successful',
      });
    }

    // Create new user
    user = await User.create({
      email,
      username: name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
      oauthProvider: 'facebook',
      oauthId: email,
    });

    const jwtToken = generateToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        token: jwtToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      },
      message: 'User registered successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error during Facebook authentication',
      code: 'FACEBOOK_AUTH_ERROR',
    });
  }
};

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // Since we're using JWT, logout is handled client-side by removing the token
    // This endpoint is here for consistency and future token blacklisting if needed
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error',
      code: 'LOGOUT_ERROR',
    });
  }
};

module.exports = {
  signup,
  signin,
  getMe,
  googleAuth,
  facebookAuth,
  logout,
};

