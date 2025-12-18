const express = require('express');
const router = express.Router();
const languageController = require('../controllers/languageController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/current', languageController.getCurrentLanguage);
router.post('/request-change', languageController.requestLanguageChange);
router.post('/verify-otp', languageController.verifyLanguageOTP);
router.post('/update-phone', languageController.updatePhoneNumber);

module.exports = router;
