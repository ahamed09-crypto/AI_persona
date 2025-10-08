const express = require('express');
const Joi = require('joi');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');
const authController = require('../controllers/auth.controller');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required'
  }),
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 50 characters',
    'any.required': 'Name is required'
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.details[0].message,
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    next();
  };
};

// Routes
router.post('/register', 
  validateRequest(registerSchema), 
  asyncHandler(authController.register)
);

router.post('/login', 
  validateRequest(loginSchema), 
  asyncHandler(authController.login)
);

router.get('/me', 
  authenticateToken, 
  asyncHandler(authController.getMe)
);

router.post('/refresh', 
  asyncHandler(authController.refresh)
);

router.post('/logout', 
  authenticateToken, 
  asyncHandler(authController.logout)
);

module.exports = router;