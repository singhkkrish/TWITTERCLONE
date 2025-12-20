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

  // Initialize on mount
  useEffect(() => {
    if (currentUser && !isInitialized) {
      initializeNotifications();
    }
  }, [currentUser, isInitialized]);

  const initializeNotifications = () => {
    const userId = currentUser._id || currentUser.id;
    const saved = localStorage.getItem(`notifications_${userId}`);
    
    if (saved) {
      try {
        const prefs = JSON.parse(saved);
        setNotificationsEnabled(prefs.enabled === true);
        setKeywords(prefs.keywords || ['cricket', 'science']);
        console.log('📱 Loaded notification preferences:', prefs);
      } catch (err) {
        console.error('Error loading preferences:', err);
      }
    }

    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      setPermission(currentPermission);
      console.log('🔔 Browser notification permission:', currentPermission);
    } else {
      console.warn('⚠️ Notifications not supported in this browser');
    }
    
    setIsInitialized(true);
  };

  const savePreferences = (enabled, newKeywords) => {
    if (currentUser) {
      try {
        const userId = currentUser._id || currentUser.id;
        const prefs = { enabled, keywords: newKeywords };
        localStorage.setItem(
          `notifications_${userId}`,
          JSON.stringify(prefs)
        );
        console.log('💾 Saved notification preferences:', prefs);
      } catch (err) {
        console.error('Error saving preferences:', err);
      }
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.error('❌ This browser does not support notifications');
      alert('This browser does not support desktop notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      console.log('✅ Notification permission already granted');
      setPermission('granted');
      return true;
    }

    if (Notification.permission !== 'denied') {
      try {
        console.log('🔔 Requesting notification permission...');
        const result = await Notification.requestPermission();
        setPermission(result);
        console.log('🔔 Permission result:', result);
        return result === 'granted';
      } catch (err) {
        console.error('Error requesting permission:', err);
        return false;
      }
    }

    console.warn('⚠️ Notifications are blocked');
    return false;
  };

  const showNotification = (title, body, tweet, forceShow = false) => {
    // Check if notifications should be shown
    if (!forceShow && !notificationsEnabled) {
      console.log('🔕 Notifications disabled, skipping');
      return;
    }
    
    if (permission !== 'granted') {
      console.log('⚠️ Permission not granted, skipping notification');
      return;
    }

    try {
      console.log('🔔 Showing notification:', { title, body });
      
      const options = {
        body: body,
        icon: tweet?.author?.profilePicture || 'https://api.dicebear.com/7.x/avataaars/svg?seed=twitter',
        badge: 'https://api.dicebear.com/7.x/shapes/svg?seed=notification',
        tag: tweet?._id || 'general',
        requireInteraction: false,
        silent: false,
        vibrate: [200, 100, 200],
      };

      const notification = new Notification(title, options);

      notification.onclick = () => {
        console.log('📱 Notification clicked');
        window.focus();
        if (tweet && tweet._id) {
          window.location.href = `/tweet/${tweet._id}`;
        }
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => {
        try { 
          notification.close(); 
          console.log('🔕 Notification auto-closed');
        } catch (err) {
          console.error('Error closing notification:', err);
        }
      }, 10000);

    } catch (err) {
      console.error('❌ Error showing notification:', err);
    }
  };

  const enableNotifications = async () => {
    console.log('🔔 Enabling notifications...');
    const granted = await requestPermission();
    
    if (granted) {
      setNotificationsEnabled(true);
      savePreferences(true, keywords);
      console.log('✅ Notifications enabled successfully');
      
      // Show test notification
      setTimeout(() => {
        showNotification(
          '🔔 Notifications Enabled!',
          `You'll now receive notifications for tweets containing: ${keywords.join(', ')}`,
          null,
          true
        );
      }, 100);
    } else {
      console.error('❌ Permission not granted');
      alert('Please allow notifications in your browser settings to enable this feature.');
    }
  };

  const disableNotifications = () => {
    console.log('🔕 Disabling notifications...');
    setNotificationsEnabled(false);
    savePreferences(false, keywords);
  };

  const updateKeywords = (newKeywords) => {
    console.log('📝 Updating keywords:', newKeywords);
    setKeywords(newKeywords);
    savePreferences(notificationsEnabled, newKeywords);
  };

  const checkAndNotify = (tweet) => {
    // Debug logs
    console.log('🔍 Checking tweet for notifications...');
    console.log('Tweet:', tweet);
    console.log('Notifications enabled:', notificationsEnabled);
    console.log('Keywords:', keywords);
    console.log('Permission:', permission);

    // Check if notifications are enabled
    if (!notificationsEnabled) {
      console.log('🔕 Notifications disabled, skipping');
      return;
    }
    
    // Check if tweet exists and has content
    if (!tweet || !tweet.content) {
      console.log('⚠️ Tweet has no content, skipping');
      return;
    }

    // Get author and current user IDs
    const tweetAuthorId = tweet.author?._id || tweet.author?.id;
    const currentUserId = currentUser?._id || currentUser?.id;

    // Don't notify for own tweets
    if (tweetAuthorId && currentUserId && String(tweetAuthorId) === String(currentUserId)) {
      console.log('👤 Own tweet, skipping notification');
      return;
    }

    // Check for keyword matches
    const content = tweet.content.toLowerCase();
    const matchedKeywords = keywords.filter(keyword => 
      content.includes(keyword.toLowerCase())
    );

    console.log('🔎 Matched keywords:', matchedKeywords);

    if (matchedKeywords.length > 0) {
      console.log('✅ Keywords matched! Showing notification...');
      
      const title = `🔔 New Tweet from @${tweet.author?.username || 'Unknown'}`;
      const body = `${tweet.content.substring(0, 100)}${tweet.content.length > 100 ? '...' : ''}`;
      
      // Show notification with full tweet
      showNotification(title, body, tweet, false);
    } else {
      console.log('❌ No keyword matches found');
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