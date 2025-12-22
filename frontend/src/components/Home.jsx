import React, { useState, useEffect, useRef } from 'react';
import TweetForm from './TweetForm';
import TweetList from './TweetList';
import { tweetAPI } from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { checkAndNotify, notificationsEnabled } = useNotifications();
  const previousTweetsRef = useRef([]);
  const lastCheckTimeRef = useRef(Date.now());

  const fetchTweets = async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true);
      setError('');
      
      const { data } = await tweetAPI.getAll();
      
      // IMPROVED: Check for new tweets more reliably
      if (isPolling && previousTweetsRef.current.length > 0) {
        const previousIds = new Set(previousTweetsRef.current.map(t => t._id));
        const newTweets = data.filter(tweet => !previousIds.has(tweet._id));
        
        if (newTweets.length > 0) {
          console.log(`🆕 Found ${newTweets.length} new tweets`);
          
          // Check each new tweet immediately
          newTweets.forEach(tweet => {
            console.log('🔍 Checking new tweet:', tweet.content);
            
            // Don't notify for own tweets
            const tweetAuthorId = tweet.author?._id || tweet.author?.id;
            const currentUserId = currentUser?._id || currentUser?.id;
            
            if (tweetAuthorId === currentUserId) {
              console.log('👤 Own tweet, skipping notification');
            } else {
              // Check notification immediately
              checkAndNotify(tweet);
            }
          });
        } else {
          console.log('📭 No new tweets found');
        }
      }
      
      previousTweetsRef.current = data;
      setTweets(data);
      lastCheckTimeRef.current = Date.now();
    } catch (err) {
      setError(t('failedToLoadTweets'));
      console.error('Error fetching tweets:', err);
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    fetchTweets(false);
    
    // IMPROVED: Poll more frequently for better responsiveness
    const interval = setInterval(() => {
      const timeSinceLastCheck = Date.now() - lastCheckTimeRef.current;
      console.log(`📡 Polling for new tweets... (${Math.round(timeSinceLastCheck / 1000)}s since last check)`);
      fetchTweets(true);
    }, 10000); // Changed from 15s to 10s
    
    return () => clearInterval(interval);
  }, [currentUser]); // Add currentUser as dependency

  const handleTweetCreated = (newTweet) => {
    console.log('✨ New tweet created locally:', newTweet);
    
    // Add to state immediately
    const updatedTweets = [newTweet, ...tweets];
    setTweets(updatedTweets);
    previousTweetsRef.current = updatedTweets;
    
    // Check notification immediately for own tweet (will be skipped in checkAndNotify)
    // This ensures the logic is consistent
    checkAndNotify(newTweet);
  };

  const handleTweetUpdate = (updatedTweet) => {
    setTweets(tweets.map(tweet => 
      tweet._id === updatedTweet._id ? updatedTweet : tweet
    ));
    previousTweetsRef.current = tweets.map(tweet => 
      tweet._id === updatedTweet._id ? updatedTweet : tweet
    );
  };

  const handleTweetDelete = (tweetId) => {
    const filtered = tweets.filter(tweet => tweet._id !== tweetId);
    setTweets(filtered);
    previousTweetsRef.current = filtered;
  };

  // Show notification status in UI
  useEffect(() => {
    if (notificationsEnabled) {
      console.log('🔔 Notifications are ENABLED - watching for keywords');
    } else {
      console.log('🔕 Notifications are DISABLED');
    }
  }, [notificationsEnabled]);

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
        {/* Debug indicator */}
        {notificationsEnabled && (
          <p className="text-xs text-gray-500 mt-1">
            🔔 Notifications active - checking every 10 seconds
          </p>
        )}
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