import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { LanguageProvider } from './contexts/LanguageContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Home from './components/Home';
import Search from './components/Search';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Profile from './components/Profile';
import TweetDetail from './components/TweetDetail';
import EditProfile from './components/EditProfile';
import NotificationSettings from './components/NotificationSettings';
import Subscription from './components/Subscription';
import LanguageSettings from './components/LanguageSettings';
import LoginHistory from './components/LoginHistory';
import { tweetAPI } from './services/api';

// ========================================
// NEW: Global Notification Watcher Component
// This polls for tweets on ALL pages, not just Home
// ========================================
const GlobalNotificationWatcher = () => {
  const { checkAndNotify, notificationsEnabled } = useNotifications();
  const { currentUser } = useAuth();
  const previousTweetsRef = useRef([]);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    // Only run if notifications are enabled and user is logged in
    if (!notificationsEnabled || !currentUser) {
      console.log('🔕 Global watcher: Notifications disabled or no user');
      return;
    }

    console.log('🌐 Global notification watcher started');
    console.log('🎯 Watching for keywords on ALL pages');

    const checkForNewTweets = async () => {
      try {
        const { data } = await tweetAPI.getAll();
        
        // Skip notification check on initial load
        if (isInitialLoad.current) {
          console.log('📋 Initial load - setting baseline tweets');
          previousTweetsRef.current = data;
          isInitialLoad.current = false;
          return;
        }

        // Check for new tweets
        if (previousTweetsRef.current.length > 0) {
          const previousIds = new Set(previousTweetsRef.current.map(t => t._id));
          const newTweets = data.filter(tweet => !previousIds.has(tweet._id));
          
          if (newTweets.length > 0) {
            console.log(`🌐 Global watcher found ${newTweets.length} new tweets`);
            
            // Check each new tweet for notifications
            newTweets.forEach(tweet => {
              // Don't notify for own tweets
              const tweetAuthorId = tweet.author?._id || tweet.author?.id;
              const currentUserId = currentUser?._id || currentUser?.id;
              
              if (String(tweetAuthorId) !== String(currentUserId)) {
                console.log('🔔 Global check:', tweet.content.substring(0, 50));
                checkAndNotify(tweet);
              } else {
                console.log('👤 Own tweet, skipping');
              }
            });
          }
        }
        
        previousTweetsRef.current = data;
      } catch (error) {
        console.error('❌ Global watcher error:', error);
      }
    };

    // Initial check
    checkForNewTweets();

    // Poll every 10 seconds
    const interval = setInterval(() => {
      console.log('📡 Global watcher polling... (works on ALL pages)');
      checkForNewTweets();
    }, 10000);

    return () => {
      console.log('🔴 Global notification watcher stopped');
      clearInterval(interval);
    };
  }, [notificationsEnabled, currentUser, checkAndNotify]);

  // This component doesn't render anything
  return null;
};

// ========================================
// Main App Component
// ========================================
function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <NotificationProvider>
            {/* NEW: Global notification watcher - runs on ALL pages */}
            <GlobalNotificationWatcher />
            
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              
              {/* Protected Routes */}
              <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={<Home />} />
                <Route path="search" element={<Search />} />
                <Route path="subscription" element={<Subscription />} />
                <Route path="language" element={<LanguageSettings />} />
                <Route path="login-history" element={<LoginHistory />} />
                <Route path="profile/:username" element={<Profile />} />
                <Route path="tweet/:id" element={<TweetDetail />} />
                <Route path="settings/profile" element={<EditProfile />} />
                <Route path="settings/notifications" element={<NotificationSettings />} />
              </Route>
              
              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </NotificationProvider>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;