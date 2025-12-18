import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext'; 
import { tweetAPI } from '../services/api';
import Tweet from './Tweet';
import TweetForm from './TweetForm';
import TweetList from './TweetList';

const TweetDetail = () => {
  const { t } = useLanguage(); 
  const { id } = useParams();
  const [tweet, setTweet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTweet = async () => {
      try {
        setLoading(true);
        const { data } = await tweetAPI.getById(id);
        setTweet(data);
      } catch (err) {
        console.error('Failed to load tweet:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTweet();
  }, [id]);

  const handleReplyCreated = (newReply) => {
    setTweet(prev => ({
      ...prev,
      replies: [newReply, ...(prev.replies || [])]
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-twitter"></div>
      </div>
    );
  }

  if (!tweet) {
    return <div className="text-center py-8">{t('tweetNotFound')}</div>;
  }

  return (
    <div>
      <div className="border-b border-gray-800 px-4 py-3">
        <h1 className="text-xl font-bold">{t('tweet')}</h1>
      </div>
      
      <Tweet tweet={tweet} onUpdate={setTweet} />
      
      <div className="border-b border-gray-800">
        <TweetForm onTweetCreated={handleReplyCreated} replyTo={id} />
      </div>
      
      {tweet.replies && tweet.replies.length > 0 && (
        <div>
          <div className="border-b border-gray-800 px-4 py-3 font-bold text-gray-500">
            {t('replies')}
          </div>
          <TweetList tweets={tweet.replies} />
        </div>
      )}
    </div>
  );
};

export default TweetDetail;