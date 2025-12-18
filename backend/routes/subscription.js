const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const auth = require('../middleware/auth');

router.get('/my-subscription', auth, subscriptionController.getUserSubscription);
router.get('/plans', subscriptionController.getPlans);
router.post('/create-order', auth, subscriptionController.createOrder);
router.post('/verify-payment', auth, subscriptionController.verifyPayment);
router.get('/check-payment-time', subscriptionController.checkPaymentTime);

module.exports = router;
