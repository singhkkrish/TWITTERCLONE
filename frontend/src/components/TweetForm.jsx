import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { tweetAPI, uploadAPI } from '../services/api';
import { Image, X, Mic } from 'lucide-react';
import AudioRecorder from './AudioRecorder';

const TweetForm = ({ onTweetCreated, replyTo }) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [audio, setAudio] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const uploadPromises = files.map(file => uploadAPI.uploadImage(file));
      const results = await Promise.all(uploadPromises);
      const imageUrls = results.map(res => res.data.url);
      setImages(prev => [...prev, ...imageUrls]);
    } catch (err) {
      setError(t('imageUploadFailed'));
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAudioReady = (audioData) => {
    setAudio(audioData);
    setShowAudioRecorder(false);
  };

  const removeAudio = () => {
    setAudio(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim() && images.length === 0 && !audio) {
      setError(t('tweetValidationError'));
      return;
    }

    setError('');

    try {
      const tweetData = {
        content,
        images,
        audio
      };

      const { data } = replyTo
        ? await tweetAPI.reply(replyTo, tweetData)
        : await tweetAPI.create(tweetData);

      onTweetCreated(data);
      setContent('');
      setImages([]);
      setAudio(null);
    } catch (err) {
      if (err.response?.data?.limitReached) {
        setError(`${err.response.data.message} ${t('upgradePrompt')}`);
      } else if (err.response?.data?.subscriptionExpired) {
        setError(`${err.response.data.message} ${t('renewPrompt')}`);
      } else {
        setError(err.response?.data?.message || t('tweetPostFailed'));
      }
    }
  };

  return (
    <>
      <div className="border-b border-gray-800 p-4">
        {error && (
          <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex gap-4">
            <img
              src={currentUser?.profilePicture}
              alt={currentUser?.name}
              className="w-12 h-12 rounded-full flex-shrink-0"
            />

            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  replyTo
                    ? t('tweetYourReply')
                    : audio
                    ? t('addCaptionOptional')
                    : t('whatsHappening')
                }
                className="w-full bg-transparent text-xl resize-none outline-none placeholder-gray-500 min-h-[80px]"
                maxLength={280}
              />

              {/* Audio Preview */}
              {audio && (
                <div className="mt-4 bg-darkHover rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-twitter p-2 rounded-full">
                        <Mic className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold">{t('audioTweet')}</p>
                        <p className="text-sm text-gray-500">
                          {formatTime(audio.duration)} • {formatSize(audio.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeAudio}
                      className="text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <audio src={audio.url} controls className="w-full" />
                </div>
              )}

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {images.map((img, index) => (
                    <div key={index} className="relative">
                      <img
                        src={img}
                        alt="Upload"
                        className="rounded-2xl w-full h-48 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-black bg-opacity-75 rounded-full p-1 hover:bg-opacity-90"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
                <div className="flex items-center gap-2">
                  {!audio && (
                    <label className="cursor-pointer text-twitter hover:bg-twitter hover:bg-opacity-10 p-2 rounded-full transition-colors">
                      <Image className="w-5 h-5" />
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  )}

                  {!audio && images.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAudioRecorder(true)}
                      className="text-twitter hover:bg-twitter hover:bg-opacity-10 p-2 rounded-full transition-colors"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  )}

                  {uploading && (
                    <span className="text-sm text-gray-500">
                      {t('uploading')}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {content.length > 0 && (
                    <span
                      className={`text-sm ${
                        content.length > 260 ? 'text-red-500' : 'text-gray-500'
                      }`}
                    >
                      {content.length}/280
                    </span>
                  )}

                  <button
                    type="submit"
                    disabled={
                      (!content.trim() && images.length === 0 && !audio) ||
                      uploading
                    }
                    className="bg-twitter hover:bg-twitterDark text-white font-bold py-2 px-6 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {replyTo ? t('reply') : t('tweet')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {showAudioRecorder && (
        <AudioRecorder
          onAudioReady={handleAudioReady}
          onClose={() => setShowAudioRecorder(false)}
        />
      )}
    </>
  );
};

export default TweetForm;