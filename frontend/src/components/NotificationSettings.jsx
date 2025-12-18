import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Bell, BellOff, Plus, X } from 'lucide-react';

const NotificationSettings = () => {
  const { t } = useLanguage();
  const {
    notificationsEnabled,
    permission,
    keywords,
    enableNotifications,
    disableNotifications,
    updateKeywords
  } = useNotifications();

  const [newKeyword, setNewKeyword] = useState('');
  const [error, setError] = useState('');

  const handleToggle = async () => {
    if (notificationsEnabled) {
      disableNotifications();
    } else {
      await enableNotifications();
    }
  };

  const handleAddKeyword = () => {
    const keyword = newKeyword.trim().toLowerCase();
    
    if (!keyword) {
      setError(t('pleaseEnterKeyword'));
      return;
    }

    if (keywords.includes(keyword)) {
      setError(t('keywordAlreadyExists'));
      return;
    }

    updateKeywords([...keywords, keyword]);
    setNewKeyword('');
    setError('');
  };

  const handleRemoveKeyword = (keywordToRemove) => {
    if (keywords.length === 1) {
      setError(t('mustHaveOneKeyword'));
      return;
    }
    updateKeywords(keywords.filter(k => k !== keywordToRemove));
    setError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddKeyword();
    }
  };

  return (
    <div>
      <div className="border-b border-gray-800 px-4 py-3 sticky top-0 bg-black z-10">
        <h1 className="text-xl font-bold">{t('notificationSettings')}</h1>
      </div>

      <div className="p-4 max-w-2xl">
        <div className="bg-dark rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {notificationsEnabled ? (
                  <Bell className="w-6 h-6 text-twitter" />
                ) : (
                  <BellOff className="w-6 h-6 text-gray-500" />
                )}
                <h2 className="text-xl font-bold">{t('pushNotifications')}</h2>
              </div>
              <p className="text-gray-400 text-sm">
                {t('getNotifiedForKeywords')}
              </p>
              
              {permission === 'denied' && (
                <div className="mt-3 bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-3 py-2 rounded text-sm">
                  {t('notificationsBlocked')}
                </div>
              )}
            </div>

            <button
              onClick={handleToggle}
              disabled={permission === 'denied'}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                notificationsEnabled ? 'bg-twitter' : 'bg-gray-600'
              } ${permission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  notificationsEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="bg-dark rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4">{t('keywordsToMonitor')}</h3>
          <p className="text-gray-400 text-sm mb-4">
            {t('keywordsDescription')}
          </p>

          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('addKeyword')}
              className="flex-1 px-4 py-2 bg-transparent border border-gray-700 rounded-lg focus:outline-none focus:border-twitter"
            />
            <button
              onClick={handleAddKeyword}
              className="bg-twitter hover:bg-twitterDark text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t('add')}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <div
                key={keyword}
                className="bg-twitter bg-opacity-20 border border-twitter text-twitter px-4 py-2 rounded-full flex items-center gap-2 group"
              >
                <span className="font-medium">{keyword}</span>
                <button
                  onClick={() => handleRemoveKeyword(keyword)}
                  className="hover:bg-red-500 hover:bg-opacity-20 rounded-full p-1 transition-colors"
                  title={t('removeKeyword')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {keywords.length === 0 && (
            <p className="text-gray-500 text-center py-4">{t('noKeywordsAdded')}</p>
          )}
        </div>

        <div className="mt-6 bg-darkHover rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-2">{t('howItWorks')}</h3>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-twitter mt-1">•</span>
              <span>{t('howItWorksStep1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-twitter mt-1">•</span>
              <span>{t('howItWorksStep2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-twitter mt-1">•</span>
              <span>{t('howItWorksStep3')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-twitter mt-1">•</span>
              <span>{t('howItWorksStep4')}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;