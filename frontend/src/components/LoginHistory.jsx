import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Shield, 
  Monitor, 
  Smartphone, 
  Tablet,
  Globe,
  MapPin,
  Clock,
  Check,
  X,
  Loader,
  AlertCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

const LoginHistory = () => {
  const { t } = useLanguage();
  const [loginHistory, setLoginHistory] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLoginHistory();
  }, []);

  const fetchLoginHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/auth/login-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setLoginHistory(response.data.loginHistory || []);
      setCurrentSession(response.data.currentSession);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching login history:', err);
      setError(t('failedToLoadHistory') || 'Failed to load login history');
      setLoading(false);
    }
  };

  const getDeviceIcon = (device) => {
    switch (device) {
      case 'mobile':
        return <Smartphone className="w-5 h-5 text-twitter" />;
      case 'tablet':
        return <Tablet className="w-5 h-5 text-twitter" />;
      case 'desktop':
        return <Monitor className="w-5 h-5 text-twitter" />;
      default:
        return <Globe className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateDuration = (loginTime, logoutTime) => {
    if (!logoutTime) return t('active') || 'Active';
    
    const duration = new Date(logoutTime) - new Date(loginTime);
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader className="w-8 h-8 text-twitter animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 sticky top-0 bg-black z-10">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-twitter" />
          <h1 className="text-2xl font-bold">{t('loginHistory') || 'Login History'}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Current Session */}
        {currentSession && (
          <div className="mb-6 bg-green-500 bg-opacity-10 border-2 border-green-500 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h2 className="text-lg font-bold text-green-500">{t('currentSession') || 'Current Session'}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                {getDeviceIcon(currentSession.device)}
                <span className="text-gray-300">{currentSession.browser}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">{currentSession.ipAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">
                  {t('started') || 'Started'}: {formatDate(currentSession.loginTime)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="mb-6 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-400">
              <p className="font-bold mb-2">{t('securitySettings') || 'Security Settings:'}</p>
              <ul className="space-y-1 text-xs">
                <li>• {t('chromeRequiresOTP') || 'Chrome browsers require email OTP verification'}</li>
                <li>• {t('edgeDirectAccess') || 'Microsoft Edge browsers have direct access'}</li>
                <li>• {t('mobileRestricted') || 'Mobile devices restricted to 10:00 AM - 1:00 PM'}</li>
                <li>• {t('allAttemptsTracked') || 'All login attempts are tracked and monitored'}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Login History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{t('recentActivity') || 'Recent Activity'}</h2>
            <span className="text-sm text-gray-400">
              {loginHistory.length} {t('totalLogins') || 'total logins'}
            </span>
          </div>

          {loginHistory.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">{t('noLoginHistory') || 'No login history yet'}</p>
            </div>
          ) : (
            loginHistory.map((login, index) => (
              <div
                key={index}
                className={`bg-darkHover border rounded-xl p-4 transition-all hover:border-gray-700 ${
                  login.accessGranted
                    ? 'border-gray-800'
                    : 'border-red-500 bg-red-500 bg-opacity-5'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getDeviceIcon(login.device)}
                    <div>
                      <h3 className="font-bold">{login.browser.name}</h3>
                      <p className="text-xs text-gray-400">
                        {login.os.name} • {login.device}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {login.accessGranted ? (
                      <div className="flex items-center gap-1 text-green-500 text-xs">
                        <Check className="w-4 h-4" />
                        <span>{t('success') || 'Success'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-500 text-xs">
                        <X className="w-4 h-4" />
                        <span>{t('denied') || 'Denied'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    <span>{login.ipAddress}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-3 h-3" />
                    <span>
                      {login.location.city}, {login.location.country}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(login.loginTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>
                      {t('duration') || 'Duration'}: {calculateDuration(login.loginTime, login.logoutTime)}
                    </span>
                  </div>
                </div>

                {login.requiresOTP && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <Shield className="w-3 h-3 text-blue-500" />
                    <span className="text-blue-400">
                      {login.otpVerified ? (t('otpVerified') || 'OTP Verified') : (t('otpRequired') || 'OTP Required')}
                    </span>
                  </div>
                )}

                {!login.accessGranted && login.accessDeniedReason && (
                  <div className="mt-2 bg-red-500 bg-opacity-10 border border-red-500 rounded p-2">
                    <p className="text-xs text-red-400">
                      <strong>{t('reason') || 'Reason'}:</strong> {login.accessDeniedReason}
                    </p>
                  </div>
                )}

                {login.logoutTime && (
                  <div className="mt-2 text-xs text-gray-500">
                    {t('loggedOut') || 'Logged out'}: {formatDate(login.logoutTime)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginHistory;