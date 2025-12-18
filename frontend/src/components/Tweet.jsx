import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { tweetAPI } from '../services/api';
import { Heart, MessageCircle, Repeat2, Trash2, Mic, Play, Pause } from 'lucide-react';

const Tweet = ({ tweet, onUpdate, onDelete }) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isRetweeted, setIsRetweeted] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const userLiked = tweet.likes?.some(
      like => String(like) === String(currentUser?._id || currentUser?.id)
    );
    setIsLiked(userLiked);
    setLikesCount(tweet.likes?.length || 0);

    const userRetweeted = tweet.retweets?.some(
      retweet => String(retweet) === String(currentUser?._id || currentUser?.id)
    );
    setIsRetweeted(userRetweeted);
  }, [tweet, currentUser]);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLiking) return;

    setIsLiking(true);
    const newIsLiked = !isLiked;
    const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;

    setIsLiked(newIsLiked);
    setLikesCount(newLikesCount);

    try {
      if (newIsLiked) {
        await tweetAPI.like(tweet._id);
      } else {
        await tweetAPI.unlike(tweet._id);
      }
    } catch (err) {
      console.error('Failed to like/unlike tweet:', err);
      setIsLiked(!newIsLiked);
      setLikesCount(newIsLiked ? likesCount - 1 : likesCount + 1);
    } finally {
      setIsLiking(false);
    }
  };

  const handleRetweet = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isRetweeted) {
      alert('You have already retweeted this');
      return;
    }

    try {
      const { data } = await tweetAPI.retweet(tweet._id);
      setIsRetweeted(true);
      if (onUpdate) onUpdate(data);
    } catch (err) {
      console.error('Failed to retweet:', err);
      alert(err.response?.data?.message || 'Failed to retweet');
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm(`Are you sure you want to ${t('deleteTweet')}?`)) {
      try {
        await tweetAPI.delete(tweet._id);
        if (onDelete) onDelete(tweet._id);
      } catch (err) {
        console.error('Failed to delete tweet:', err);
      }
    }
  };

  const toggleAudio = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlayingAudio(!isPlayingAudio);
    }
  };

  const handleProfileClick = (e, username) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/profile/${username}`);
  };

  const handleTweetClick = (e, tweetId) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/tweet/${tweetId}`);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const displayTweet = tweet.isRetweet ? tweet.originalTweet : tweet;
  const author = displayTweet?.author;

  if (!author) return null;

  return (
    <div 
      className="border-b border-gray-800 p-4 hover:bg-darkHover transition-colors cursor-pointer"
      onClick={(e) => handleTweetClick(e, displayTweet._id)}
    >
      {tweet.isRetweet && (
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-2 ml-10">
          <Repeat2 className="w-4 h-4" />
          <span>{tweet.author?.name} {t('retweet')}ed</span>
        </div>
      )}

      <div className="flex gap-3">
        {/* Profile Picture */}
        <div 
          onClick={(e) => handleProfileClick(e, author.username)}
          className="cursor-pointer"
        >
          <img
            src={author.profilePicture}
            alt={author.name}
            className="w-12 h-12 rounded-full flex-shrink-0"
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Author Info */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              onClick={(e) => handleProfileClick(e, author.username)}
              className="font-bold hover:underline cursor-pointer"
            >
              {author.name}
            </span>
            <span className="text-gray-500">@{author.username}</span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-500 text-sm">
              {new Date(displayTweet.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Tweet Content */}
          {displayTweet.content && (
            <p className="mt-2 whitespace-pre-wrap break-words">{displayTweet.content}</p>
          )}

          {/* Audio Player */}
          {displayTweet.audio && (
            <div className="mt-3 bg-darkHover rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={toggleAudio}
                  className="bg-twitter hover:bg-twitterDark p-3 rounded-full transition-colors"
                >
                  {isPlayingAudio ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Mic className="w-4 h-4 text-twitter" />
                    <span className="text-sm font-bold">{t('audioTweet')}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatTime(displayTweet.audio.duration)}
                  </p>
                </div>
              </div>
              <audio
                ref={audioRef}
                src={displayTweet.audio.url}
                onEnded={() => setIsPlayingAudio(false)}
                onPlay={() => setIsPlayingAudio(true)}
                onPause={() => setIsPlayingAudio(false)}
                className="w-full"
                controls
              />
            </div>
          )}

          {/* Images */}
          {displayTweet.images && displayTweet.images.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {displayTweet.images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt="Tweet image"
                  className="rounded-2xl w-full h-64 object-cover"
                />
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-3 max-w-md">
            {/* Reply Button */}
            <button
              onClick={(e) => handleTweetClick(e, displayTweet._id)}
              className="flex items-center gap-2 text-gray-500 hover:text-twitter transition-colors group"
            >
              <div className="p-2 rounded-full group-hover:bg-twitter group-hover:bg-opacity-10">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-sm">{displayTweet.replies?.length || 0}</span>
            </button>

            {/* Retweet Button */}
            <button
              onClick={handleRetweet}
              disabled={isRetweeted}
              className={`flex items-center gap-2 ${isRetweeted ? 'text-green-500' : 'text-gray-500 hover:text-green-500'} transition-colors group disabled:cursor-not-allowed`}
            >
              <div className="p-2 rounded-full group-hover:bg-green-500 group-hover:bg-opacity-10">
                <Repeat2 className="w-5 h-5" />
              </div>
              <span className="text-sm">{displayTweet.retweets?.length || 0}</span>
            </button>

            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'} transition-colors group`}
            >
              <div className="p-2 rounded-full group-hover:bg-red-500 group-hover:bg-opacity-10 transition-all">
                <Heart
                  className={`w-5 h-5 transition-all ${isLiked ? 'fill-current scale-110' : ''}`}
                />
              </div>
              <span className="text-sm font-medium">{likesCount}</span>
            </button>

            {/* Delete Button */}
            {(author._id === currentUser?.id || author._id === currentUser?._id) && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors group"
              >
                <div className="p-2 rounded-full group-hover:bg-red-500 group-hover:bg-opacity-10">
                  <Trash2 className="w-5 h-5" />
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tweet;