const Tweet = require('../models/Tweet');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

exports.createTweet = async (req, res) => {
  try {
    const { content, images, audio } = req.body;

    if (!content && (!images || images.length === 0) && !audio) {
      return res.status(400).json({ message: 'Tweet must have content, images, or audio' });
    }

    const subscription = await Subscription.findOne({ userId: req.userId });

    if (!subscription) {
      return res.status(403).json({
        message: 'No subscription found. Please subscribe to a plan.',
        requiresSubscription: true
      });
    }

    if (typeof subscription.isExpired === 'function' && subscription.isExpired()) {
      if (typeof subscription.resetToFree === 'function') {
        try { await subscription.resetToFree(); } catch (e) { console.error('Failed to reset subscription to free:', e); }
      }
      return res.status(403).json({
        message: 'Your subscription has expired. You are now on Free Plan (1 tweet limit).',
        subscriptionExpired: true
      });
    }

    if (typeof subscription.canPostTweet === 'function' && !subscription.canPostTweet()) {
      return res.status(403).json({
        message: `You have reached your tweet limit (${subscription.tweetsLimit} tweets). Upgrade your plan to post more tweets.`,
        limitReached: true,
        currentPlan: subscription.planType,
        tweetsUsed: subscription.tweetsUsed,
        tweetsLimit: subscription.tweetsLimit
      });
    }

    if (audio) {
      if (!audio.url) {
        return res.status(400).json({ message: 'Invalid audio data' });
      }

      if (audio.duration && audio.duration > 300) {
        return res.status(400).json({ message: 'Audio duration exceeds 5 minutes limit' });
      }

      if (audio.size && audio.size > 100 * 1024 * 1024) {
        return res.status(400).json({ message: 'Audio file size exceeds 100 MB limit' });
      }
    }

    const tweet = new Tweet({
      content: content || '',
      author: req.userId,
      images: images || [],
      audio: audio || null
    });

    await tweet.save();

    await User.findByIdAndUpdate(req.userId, {
      $push: { tweets: tweet._id }
    });

    if (typeof subscription.incrementTweetCount === 'function') {
      try { await subscription.incrementTweetCount(); } catch (e) { console.error('Failed to increment subscription tweet count:', e); }
    }

    const populatedTweet = await Tweet.findById(tweet._id)
      .populate('author', 'username name profilePicture');

    const subscriptionInfo = {
      tweetsUsed: subscription.tweetsUsed,
      tweetsLimit: subscription.tweetsLimit,
      tweetsRemaining: subscription.tweetsLimit === -1 ? 'Unlimited' : (subscription.tweetsLimit - subscription.tweetsUsed)
    };

    res.status(201).json({
      ...populatedTweet.toObject(),
      subscription: subscriptionInfo
    });
  } catch (error) {
    console.error('Create tweet error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllTweets = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const tweets = await Tweet.find({ isReply: false })
      .populate('author', 'username name profilePicture')
      .populate({
        path: 'originalTweet',
        populate: { path: 'author', select: 'username name profilePicture' }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json(tweets);
  } catch (error) {
    console.error('Get all tweets error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getTweet = async (req, res) => {
  try {
    const tweet = await Tweet.findById(req.params.id)
      .populate('author', 'username name profilePicture')
      .populate({
        path: 'replies',
        populate: { path: 'author', select: 'username name profilePicture' }
      })
      .populate({
        path: 'originalTweet',
        populate: { path: 'author', select: 'username name profilePicture' }
      });

    if (!tweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }

    res.json(tweet);
  } catch (error) {
    console.error('Get tweet error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteTweet = async (req, res) => {
  try {
    const tweet = await Tweet.findById(req.params.id);

    if (!tweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }

    if (tweet.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this tweet' });
    }

    await Tweet.findByIdAndDelete(req.params.id);

    await User.findByIdAndUpdate(req.userId, {
      $pull: { tweets: req.params.id }
    });

    res.json({ message: 'Tweet deleted successfully' });
  } catch (error) {
    console.error('Delete tweet error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.likeTweet = async (req, res) => {
  try {
    const tweet = await Tweet.findById(req.params.id);

    if (!tweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }

    if (tweet.likes.includes(req.userId)) {
      return res.status(400).json({ message: 'Tweet already liked' });
    }

    tweet.likes.push(req.userId);
    await tweet.save();

    await User.findByIdAndUpdate(req.userId, {
      $push: { likes: tweet._id }
    });

    res.json({ message: 'Tweet liked successfully', likesCount: tweet.likes.length });
  } catch (error) {
    console.error('Like tweet error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.unlikeTweet = async (req, res) => {
  try {
    const tweet = await Tweet.findById(req.params.id);

    if (!tweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }

    if (!tweet.likes.includes(req.userId)) {
      return res.status(400).json({ message: 'Tweet not liked yet' });
    }

    tweet.likes = tweet.likes.filter(id => id.toString() !== req.userId);
    await tweet.save();

    await User.findByIdAndUpdate(req.userId, {
      $pull: { likes: tweet._id }
    });

    res.json({ message: 'Tweet unliked successfully', likesCount: tweet.likes.length });
  } catch (error) {
    console.error('Unlike tweet error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.retweet = async (req, res) => {
  try {
    const originalTweet = await Tweet.findById(req.params.id);

    if (!originalTweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }

    const existingRetweet = await Tweet.findOne({
      author: req.userId,
      originalTweet: req.params.id,
      isRetweet: true
    });

    if (existingRetweet) {
      return res.status(400).json({ message: 'Already retweeted' });
    }

    const retweet = new Tweet({
      content: originalTweet.content,
      author: req.userId,
      isRetweet: true,
      originalTweet: req.params.id,
      images: originalTweet.images,
      audio: originalTweet.audio
    });

    await retweet.save();

    originalTweet.retweets.push(req.userId);
    await originalTweet.save();

    await User.findByIdAndUpdate(req.userId, {
      $push: { retweets: originalTweet._id, tweets: retweet._id }
    });

    const populatedRetweet = await Tweet.findById(retweet._id)
      .populate('author', 'username name profilePicture')
      .populate({
        path: 'originalTweet',
        populate: { path: 'author', select: 'username name profilePicture' }
      });

    res.status(201).json(populatedRetweet);
  } catch (error) {
    console.error('Retweet error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.replyToTweet = async (req, res) => {
  try {
    const { content, images, audio } = req.body;
    const parentTweet = await Tweet.findById(req.params.id);

    if (!parentTweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }

    const reply = new Tweet({
      content: content || '',
      author: req.userId,
      images: images || [],
      audio: audio || null,
      isReply: true,
      replyTo: req.params.id
    });

    await reply.save();

    parentTweet.replies.push(reply._id);
    await parentTweet.save();

    const populatedReply = await Tweet.findById(reply._id)
      .populate('author', 'username name profilePicture');

    res.status(201).json(populatedReply);
  } catch (error) {
    console.error('Reply to tweet error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getFeed = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const following = user.following || [];

    const tweets = await Tweet.find({
      $or: [
        { author: { $in: following } },
        { author: req.userId }
      ],
      isReply: false
    })
      .populate('author', 'username name profilePicture')
      .populate({
        path: 'originalTweet',
        populate: { path: 'author', select: 'username name profilePicture' }
      })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(tweets);
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
