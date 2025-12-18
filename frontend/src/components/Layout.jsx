import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Home, User, Settings, LogOut, Twitter, Search, Bell, Crown, Globe, Shield } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const Layout = () => {
  const { currentUser, logout } = useAuth();
  const { t } = useLanguage();
  const { notificationsEnabled } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <div className="w-20 xl:w-64 h-screen sticky top-0 border-r border-gray-800 px-2">
          <div className="flex flex-col h-full py-4">
            <div className="mb-4 px-3">
              <Twitter className="h-8 w-8 text-twitter" />
            </div>
            
            <nav className="flex-1 space-y-2">
              <Link
                to="/"
                className={`flex items-center gap-4 px-3 py-3 rounded-full hover:bg-darkHover transition-colors ${
                  isActive('/') ? 'bg-darkHover' : ''
                }`}
              >
                <Home className="h-7 w-7" />
                <span className="hidden xl:inline text-xl">{t('home')}</span>
              </Link>
              
              <Link
                to="/search"
                className={`flex items-center gap-4 px-3 py-3 rounded-full hover:bg-darkHover transition-colors ${
                  isActive('/search') ? 'bg-darkHover' : ''
                }`}
              >
                <Search className="h-7 w-7" />
                <span className="hidden xl:inline text-xl">{t('search')}</span>
              </Link>

              <Link
                to="/settings/notifications"
                className={`flex items-center gap-4 px-3 py-3 rounded-full hover:bg-darkHover transition-colors relative ${
                  isActive('/settings/notifications') ? 'bg-darkHover' : ''
                }`}
              >
                <Bell className={`h-7 w-7 ${notificationsEnabled ? 'text-twitter' : ''}`} />
                <span className="hidden xl:inline text-xl">{t('notifications')}</span>
                {notificationsEnabled && (
                  <span className="absolute top-2 left-2 w-2 h-2 bg-twitter rounded-full"></span>
                )}
              </Link>

              <Link
                to="/subscription"
                className={`flex items-center gap-4 px-3 py-3 rounded-full hover:bg-darkHover transition-colors ${
                  isActive('/subscription') ? 'bg-darkHover' : ''
                }`}
              >
                <Crown className="h-7 w-7 text-yellow-500" />
                <span className="hidden xl:inline text-xl">{t('subscription')}</span>
              </Link>

              <Link
                to="/language"
                className={`flex items-center gap-4 px-3 py-3 rounded-full hover:bg-darkHover transition-colors ${
                  isActive('/language') ? 'bg-darkHover' : ''
                }`}
              >
                <Globe className="h-7 w-7 text-blue-500" />
                <span className="hidden xl:inline text-xl">{t('language')}</span>
              </Link>

              <Link
                to="/login-history"
                className={`flex items-center gap-4 px-3 py-3 rounded-full hover:bg-darkHover transition-colors ${
                  isActive('/login-history') ? 'bg-darkHover' : ''
                }`}
              >
                <Shield className="h-7 w-7 text-green-500" />
                <span className="hidden xl:inline text-xl">{t('loginHistory') || 'Login History'}</span>
              </Link>
              
              <Link
                to={`/profile/${currentUser?.username}`}
                className={`flex items-center gap-4 px-3 py-3 rounded-full hover:bg-darkHover transition-colors ${
                  location.pathname.includes('/profile/') ? 'bg-darkHover' : ''
                }`}
              >
                <User className="h-7 w-7" />
                <span className="hidden xl:inline text-xl">{t('profile')}</span>
              </Link>
              
              <Link
                to="/settings/profile"
                className={`flex items-center gap-4 px-3 py-3 rounded-full hover:bg-darkHover transition-colors ${
                  isActive('/settings/profile') ? 'bg-darkHover' : ''
                }`}
              >
                <Settings className="h-7 w-7" />
                <span className="hidden xl:inline text-xl">{t('settings')}</span>
              </Link>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-4 px-3 py-3 rounded-full hover:bg-darkHover transition-colors w-full text-left"
              >
                <LogOut className="h-7 w-7" />
                <span className="hidden xl:inline text-xl">{t('logout')}</span>
              </button>
            </nav>
            
            <div className="mt-auto">
              <div className="flex items-center gap-3 px-3 py-3 rounded-full hover:bg-darkHover transition-colors cursor-pointer">
                <img
                  src={currentUser?.profilePicture}
                  alt={currentUser?.name}
                  className="w-10 h-10 rounded-full"
                />
                <div className="hidden xl:block">
                  <p className="font-bold text-sm">{currentUser?.name}</p>
                  <p className="text-gray-500 text-sm">@{currentUser?.username}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 border-r border-gray-800 min-h-screen">
          <Outlet />
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block w-80 px-4 py-4">
          <div className="bg-dark rounded-2xl p-4">
            <h2 className="text-xl font-bold mb-4">{t('whatsHappeningTitle')}</h2>
            <p className="text-gray-500">{t('checkLatestTweets')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;