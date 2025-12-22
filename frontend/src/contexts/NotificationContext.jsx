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
  const [notifiedTweets, setNotifiedTweets] = useState(new Set()); // Track notified tweets

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
      
      // If enabled but no permission, show warning
      if (saved && JSON.parse(saved).enabled && currentPermission !== 'granted') {
        console.warn('⚠️ Notifications enabled but permission not granted');
      }
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
        
        if (result === 'granted') {
          console.log('✅ Permission granted successfully');
        } else {
          console.warn('⚠️ Permission denied by user');
        }
        
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
    // IMPROVED: Better validation and logging
    console.log('🔔 showNotification called:', {
      title,
      forceShow,
      enabled: notificationsEnabled,
      permission,
      tweetId: tweet?._id
    });

    // Check if notifications should be shown
    if (!forceShow && !notificationsEnabled) {
      console.log('🔕 Notifications disabled, skipping');
      return;
    }
    
    if (permission !== 'granted') {
      console.log('⚠️ Permission not granted:', permission);
      return;
    }

    // IMPROVED: Prevent duplicate notifications
    if (tweet?._id && notifiedTweets.has(tweet._id)) {
      console.log('⏭️ Already notified for this tweet, skipping');
      return;
    }

    try {
      console.log('📣 Showing notification now...');
      
      const options = {
        body: body,
        icon: tweet?.author?.profilePicture || 'https://api.dicebear.com/7.x/avataaars/svg?seed=twitter',
        badge: 'https://api.dicebear.com/7.x/shapes/svg?seed=notification',
        tag: tweet?._id || `notification-${Date.now()}`,
        requireInteraction: false,
        silent: false,
        vibrate: [200, 100, 200],
        timestamp: Date.now(),
      };

      const notification = new Notification(title, options);

      // Track that we've notified for this tweet
      if (tweet?._id) {
        setNotifiedTweets(prev => new Set([...prev, tweet._id]));
      }

      console.log('✅ Notification created successfully');

      notification.onclick = () => {
        console.log('📱 Notification clicked');
        window.focus();
        if (tweet && tweet._id) {
          // Use history API instead of direct href to avoid page reload
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
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        permission: Notification.permission
      });
    }
  };

  const enableNotifications = async () => {
    console.log('🔔 Enabling notifications...');
    const granted = await requestPermission();
    
    if (granted) {
      setNotificationsEnabled(true);
      savePreferences(true, keywords);
      console.log('✅ Notifications enabled successfully');
      console.log('🎯 Watching for keywords:', keywords);
      
      // Show test notification
      setTimeout(() => {
        showNotification(
          '🔔 Notifications Enabled!',
          `You'll receive notifications for tweets with: ${keywords.join(', ')}`,
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
    // Clear notified tweets when disabling
    setNotifiedTweets(new Set());
  };

  const updateKeywords = (newKeywords) => {
    console.log('📝 Updating keywords:', newKeywords);
    setKeywords(newKeywords);
    savePreferences(notificationsEnabled, newKeywords);
    
    // Show confirmation if notifications are enabled
    if (notificationsEnabled && newKeywords.length > 0) {
      console.log('🎯 Now watching for:', newKeywords);
    }
  };

  const checkAndNotify = (tweet) => {
    // IMPROVED: More detailed logging and validation
    const timestamp = new Date().toLocaleTimeString();
    console.log(`\n🔍 [${timestamp}] Checking tweet for notifications...`);
    console.log('📄 Tweet content:', tweet?.content);
    console.log('👤 Tweet author:', tweet?.author?.username);
    console.log('⚙️ Settings:', {
      enabled: notificationsEnabled,
      permission,
      keywords: keywords.join(', ')
    });

    // Early validation checks
    if (!notificationsEnabled) {
      console.log('❌ CHECK FAILED: Notifications are disabled');
      return;
    }
    
    if (permission !== 'granted') {
      console.log('❌ CHECK FAILED: Browser permission not granted:', permission);
      return;
    }

    if (!tweet || !tweet.content) {
      console.log('❌ CHECK FAILED: Tweet has no content');
      return;
    }

    if (keywords.length === 0) {
      console.log('❌ CHECK FAILED: No keywords configured');
      return;
    }

    // Get author and current user IDs
    const tweetAuthorId = tweet.author?._id || tweet.author?.id;
    const currentUserId = currentUser?._id || currentUser?.id;

    console.log('🆔 IDs:', {
      tweetAuthor: tweetAuthorId,
      currentUser: currentUserId,
      isOwnTweet: String(tweetAuthorId) === String(currentUserId)
    });

    // Don't notify for own tweets
    if (tweetAuthorId && currentUserId && String(tweetAuthorId) === String(currentUserId)) {
      console.log('❌ CHECK FAILED: This is your own tweet');
      return;
    }

    // Check for keyword matches (case-insensitive)
    const content = tweet.content.toLowerCase();
    const matchedKeywords = keywords.filter(keyword => 
      content.includes(keyword.toLowerCase())
    );

    console.log('🔎 Keyword check:', {
      searchIn: content,
      lookingFor: keywords,
      found: matchedKeywords
    });

    if (matchedKeywords.length > 0) {
      console.log('✅ MATCH FOUND! Keywords:', matchedKeywords.join(', '));
      console.log('📣 Triggering notification...');
      
      const title = `🔔 New Tweet from @${tweet.author?.username || 'Unknown'}`;
      const keywordText = matchedKeywords.length === 1 
        ? `"${matchedKeywords[0]}"` 
        : `keywords: ${matchedKeywords.join(', ')}`;
      const body = `Contains ${keywordText}: ${tweet.content.substring(0, 100)}${tweet.content.length > 100 ? '...' : ''}`;
      
      showNotification(title, body, tweet, false);
    } else {
      console.log('❌ NO MATCH: Tweet does not contain any watched keywords');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
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