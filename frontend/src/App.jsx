import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
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
import LoginHistory from './components/LoginHistory'; // NEW IMPORT

function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <NotificationProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              
              <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={<Home />} />
                <Route path="search" element={<Search />} />
                <Route path="subscription" element={<Subscription />} />
                <Route path="language" element={<LanguageSettings />} />
                <Route path="login-history" element={<LoginHistory />} /> {/* NEW ROUTE */}
                <Route path="profile/:username" element={<Profile />} />
                <Route path="tweet/:id" element={<TweetDetail />} />
                <Route path="settings/profile" element={<EditProfile />} />
                <Route path="settings/notifications" element={<NotificationSettings />} />
              </Route>
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </NotificationProvider>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;