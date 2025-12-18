const express = require('express');
const router = express.Router();
const tweetController = require('../controllers/tweetController');
const auth = require('../middleware/auth');

router.post('/', auth, tweetController.createTweet);
router.get('/', tweetController.getAllTweets);
router.get('/feed', auth, tweetController.getFeed);
router.get('/:id', tweetController.getTweet);
router.delete('/:id', auth, tweetController.deleteTweet);
router.post('/:id/like', auth, tweetController.likeTweet);
router.delete('/:id/like', auth, tweetController.unlikeTweet);
router.post('/:id/retweet', auth, tweetController.retweet);
router.post('/:id/reply', auth, tweetController.replyToTweet);

module.exports = router;
