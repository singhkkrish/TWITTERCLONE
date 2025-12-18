const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/:username', userController.getUserProfile);
router.put('/profile', auth, userController.updateProfile);
router.post('/:userId/follow', auth, userController.followUser);
router.delete('/:userId/follow', auth, userController.unfollowUser);
router.get('/:username/tweets', userController.getUserTweets);
router.get('/search/users', userController.searchUsers);

module.exports = router;
