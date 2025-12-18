import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import Tweet from './Tweet';

const TweetList = ({ tweets, onTweetUpdate, onTweetDelete }) => {
  const { t } = useLanguage();

  if (!tweets || tweets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{t('noTweets')}</p>
      </div>
    );
  }

  return (
    <div>
      {tweets.map((tweet) => (
        <Tweet
          key={tweet._id}
          tweet={tweet}
          onUpdate={onTweetUpdate}
          onDelete={onTweetDelete}
        />
      ))}
    </div>
  );
};

export default TweetList;