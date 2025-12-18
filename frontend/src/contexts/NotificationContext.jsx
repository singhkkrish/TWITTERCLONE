import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permission, setPermission] = useState('default');
  const [keywords, setKeywords] = useState(['cricket', 'science']);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (currentUser && !isInitialized) {
      const userId = currentUser._id || currentUser.id;
      const saved = localStorage.getItem(`notifications_${userId}`);
      
      if (saved) {
        try {
          const prefs = JSON.parse(saved);
          setNotificationsEnabled(prefs.enabled === true);
          setKeywords(prefs.keywords || ['cricket', 'science']);
        } catch (err) {}
      }

      if ('Notification' in window) {
        const currentPermission = Notification.permission;
        setPermission(currentPermission);
      }
      
      setIsInitialized(true);
    }
  }, [currentUser, isInitialized]);

  const savePreferences = (enabled, newKeywords) => {
    if (currentUser) {
      try {
        const userId = currentUser._id || currentUser.id;
        const prefs = { enabled, keywords: newKeywords };
        localStorage.setItem(
          `notifications_${userId}`,
          JSON.stringify(prefs)
        );
      } catch (err) {}
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      setPermission('granted');
      return true;
    }

    if (Notification.permission !== 'denied') {
      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        return result === 'granted';
      } catch (err) {
        return false;
      }
    }

    return false;
  };

  const showNotification = (title, body, tweet, forceShow = false) => {
    if (!forceShow && !notificationsEnabled) {
      return;
    }
    
    if (permission !== 'granted') {
      return;
    }

    try {
      const options = {
        body: body,
        icon: tweet?.author?.profilePicture || 'https://api.dicebear.com/7.x/avataaars/svg?seed=twitter',
        badge: 'https://api.dicebear.com/7.x/shapes/svg?seed=notification',
        tag: tweet?._id || 'general',
        requireInteraction: false,
        silent: false,
      };

      const notification = new Notification(title, options);

      notification.onclick = () => {
        window.focus();
        if (tweet) {
          window.location.href = `/tweet/${tweet._id}`;
        }
        notification.close();
      };

      setTimeout(() => {
        try { notification.close(); } catch (err) {}
      }, 10000);

    } catch (err) {}
  };

  const enableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      setNotificationsEnabled(true);
      savePreferences(true, keywords);
      setTimeout(() => {
        showNotification(
          'Notifications Enabled! 🔔',
          `You'll now receive notifications for tweets containing: ${keywords.join(', ')}`,
          null,
          true
        );
      }, 100);
    } else {
      alert('Please allow notifications in your browser settings to enable this feature.');
    }
  };

  const disableNotifications = () => {
    setNotificationsEnabled(false);
    savePreferences(false, keywords);
  };

  const updateKeywords = (newKeywords) => {
    setKeywords(newKeywords);
    savePreferences(notificationsEnabled, newKeywords);
  };

  const checkAndNotify = (tweet) => {
    if (!notificationsEnabled) {
      return;
    }
    
    if (!tweet || !tweet.content) {
      return;
    }

    const tweetAuthorId = tweet.author?._id || tweet.author?.id;
    const currentUserId = currentUser?._id || currentUser?.id;

    if (tweetAuthorId && currentUserId && String(tweetAuthorId) === String(currentUserId)) {
      return;
    }

    const content = tweet.content.toLowerCase();
    const matchedKeywords = keywords.filter(keyword => 
      content.includes(keyword.toLowerCase())
    );

    if (matchedKeywords.length > 0) {
      const title = `🔔 New Tweet from @${tweet.author.username}`;
      const body = tweet.content;
      showNotification(title, body, tweet, false);
    }
  };

  const value = {
    notificationsEnabled,
    permission,
    keywords,
    enableNotifications,
    disableNotifications,
    updateKeywords,
    checkAndNotify,
    showNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
