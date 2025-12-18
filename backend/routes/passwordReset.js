const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const passwordResetController = require('../controllers/passwordResetController');

router.post(
  '/request',
  [
    body('email').isEmail().withMessage('Please provide a valid email')
  ],
  passwordResetController.requestPasswordReset
);

router.get('/verify/:token', passwordResetController.verifyResetToken);

router.post(
  '/reset/:token',
  [
    body('newPassword').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword').optional().custom((value, { req }) => value === req.body.newPassword).withMessage('Passwords must match'),
    body('useGeneratedPassword').isBoolean()
  ],
  passwordResetController.resetPassword
);

router.get('/check-availability', passwordResetController.checkResetAvailability);

module.exports = router;
