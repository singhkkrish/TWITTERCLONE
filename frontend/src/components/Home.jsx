import React, { useState, useEffect, useRef } from 'react';
import TweetForm from './TweetForm';
import TweetList from './TweetList';
import { tweetAPI } from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';

const Home = () => {
  const { t } = useLanguage();
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { checkAndNotify } = useNotifications();
  const previousTweetsRef = useRef([]);

  const fetchTweets = async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true);
      setError('');

      const { data } = await tweetAPI.getAll();

      if (isPolling && previousTweetsRef.current.length > 0) {
        const newTweets = data.filter(tweet =>
          !previousTweetsRef.current.some(oldTweet => oldTweet._id === tweet._id)
        );

        newTweets.forEach(tweet => {
          console.log('🔍 Checking new tweet for notifications:', tweet.content);
          console.log('🔍 Tweet author:', tweet.author?.username);
          console.log('🔍 Current user:', currentUser?.username);
          checkAndNotify(tweet);
        });
      }

      previousTweetsRef.current = data;
      setTweets(data);
    } catch (err) {
      setError(t('failedToLoadTweets'));
      console.error('Error fetching tweets:', err);
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTweets(false);

    const interval = setInterval(() => {
      console.log('📡 Polling for new tweets...');
      fetchTweets(true);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleTweetCreated = (newTweet) => {
    console.log('✨ New tweet created:', newTweet);
    setTweets([newTweet, ...tweets]);
    previousTweetsRef.current = [newTweet, ...tweets];

    checkAndNotify(newTweet);
  };

  const handleTweetUpdate = (updatedTweet) => {
    setTweets(tweets.map(tweet =>
      tweet._id === updatedTweet._id ? updatedTweet : tweet
    ));
  };

  const handleTweetDelete = (tweetId) => {
    setTweets(tweets.filter(tweet => tweet._id !== tweetId));
    previousTweetsRef.current = tweets.filter(tweet => tweet._id !== tweetId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-twitter"></div>
      </div>
    );
  }

  return (
    <div className="max-w-full">
      <div className="border-b border-gray-800 px-4 py-3 sticky top-0 bg-black z-10">
        <h1 className="text-xl font-bold">{t('home')}</h1>
      </div>

      {error && (
        <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 mx-4 mt-4 rounded">
          {error}
        </div>
      )}

      <TweetForm onTweetCreated={handleTweetCreated} />

      {tweets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-xl mb-2">{t('noTweetsYet')}</p>
          <p className="text-sm">{t('beFirstToTweet')}</p>
        </div>
      ) : (
        <TweetList
          tweets={tweets}
          onTweetUpdate={handleTweetUpdate}
          onTweetDelete={handleTweetDelete}
        />
      )}
    </div>
  );
};

export default Home;