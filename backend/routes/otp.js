const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');
const auth = require('../middleware/auth');

router.post('/request', auth, otpController.requestOTP);
router.post('/verify', auth, otpController.verifyOTP);
router.get('/check', auth, otpController.checkOTPVerification);

module.exports = router;
