import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Twitter, Mail, Lock, AlertCircle, Loader, Shield, Clock } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const detectBrowser = () => {
  const userAgent = navigator.userAgent;
  
  if (navigator.brave && navigator.brave.isBrave) {
    return 'Brave';
  }
  
  if (userAgent.includes('Edg/') || userAgent.includes('Edge/')) {
    return 'Edge';
  }
  
  if (userAgent.includes('Firefox/')) {
    return 'Firefox';
  }
  
  if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
    return 'Safari';
  }
  
  if (userAgent.includes('OPR/') || userAgent.includes('Opera/')) {
    return 'Opera';
  }
  
  if (userAgent.includes('Chrome/')) {
    return 'Chrome';
  }
  
  return 'Unknown';
};

const Login = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiresOTP, setRequiresOTP] = useState(false);
  const [userId, setUserId] = useState(null);
  const [browserType, setBrowserType] = useState('');
  const [mobileAccessInfo, setMobileAccessInfo] = useState(null);
  const [detectedBrowser, setDetectedBrowser] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/');
    }
    
    const browser = detectBrowser();
    setDetectedBrowser(browser);
    console.log('🔍 Client-side detected browser:', browser);
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔐 Calling login with:', formData.email);
      console.log('📤 Sending clientBrowser:', detectedBrowser);
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: formData.email,
        password: formData.password,
        clientBrowser: detectedBrowser  
      });

      const { data } = response;
      console.log('📦 Login response:', data);

      if (data.requiresOTP) {
        console.log('🔐 OTP required - showing OTP screen');
        setRequiresOTP(true);
        setUserId(data.userId);
        setBrowserType(data.browserType);
        setError('');
      } 
      else if (data.token && data.user) {
        console.log('✅ Direct login successful - setting token');
        login(data.token, data.user);
        navigate('/');
      }
      
    } catch (err) {
      console.error('❌ Login error:', err);
      
      if (err.response?.data?.code === 'MOBILE_ACCESS_RESTRICTED') {
        setMobileAccessInfo(err.response.data.allowedHours);
        setError(err.response.data.message);
      } 
      else {
        setError(err.response?.data?.message || t('failedToLogin') || 'Failed to login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔐 Verifying OTP:', otp);
      
      const response = await axios.post(`${API_URL}/auth/verify-browser-otp`, {
        userId,
        otp
      });

      const { data } = response;
      console.log('✅ OTP verified, logging in with token');
      
      login(data.token, data.user);
      navigate('/');
      
    } catch (err) {
      console.error('❌ OTP verification error:', err);
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setOtp('');
    await handleLogin({ preventDefault: () => {} });
  };

  if (requiresOTP) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Shield className="w-16 h-16 text-twitter" />
            </div>
            <h2 className="text-3xl font-bold mb-2">{t('securityVerification') || 'Security Verification'}</h2>
            <p className="text-gray-400">
              {t('otpSentToEmail') || "We've sent a verification code to your email"}
            </p>
          </div>

          <div className="bg-darkHover border border-gray-800 rounded-xl p-6 mb-4">
            <div className="flex items-center gap-3 mb-4 text-sm text-gray-400">
              <Mail className="w-5 h-5 text-twitter" />
              <span>{t('checkEmailForCode') || 'Check your email for the 6-digit code'}</span>
            </div>

            <form onSubmit={handleVerifyOTP}>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">
                  {t('enterVerificationCode') || 'Enter Verification Code'}
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-twitter focus:outline-none text-center text-2xl tracking-widest font-mono"
                  autoFocus
                  required
                />
                <p className="text-xs text-gray-500 text-center mt-2">
                  {t('enterSixDigitCode') || 'Enter the 6-digit code from your email'}
                </p>
              </div>

              {error && (
                <div className="mb-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-twitter hover:bg-twitterDark text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
              >
                {loading && <Loader className="w-5 h-5 animate-spin" />}
                {loading ? t('verifying') || 'Verifying...' : t('verifyAndLogin') || 'Verify & Login'}
              </button>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                className="w-full text-twitter hover:text-twitterDark font-bold py-2 transition-colors disabled:opacity-50"
              >
                {t('resendCode') || 'Resend Code'}
              </button>
            </form>
          </div>

          <div className="text-center">
            <button
              onClick={() => {
                setRequiresOTP(false);
                setOtp('');
                setError('');
              }}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              ← {t('backToLogin') || 'Back to Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mobile access restriction screen
  if (mobileAccessInfo) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Clock className="w-16 h-16 text-yellow-500" />
            </div>
            <h2 className="text-3xl font-bold mb-2">{t('accessRestricted') || 'Access Restricted'}</h2>
          </div>

          <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-xl p-6 mb-4">
            <div className="text-center">
              <p className="text-yellow-500 font-bold mb-2">{t('mobileAccessHours') || 'Mobile Access Hours'}</p>
              <p className="text-gray-300 mb-4">{error}</p>
              <div className="bg-black rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-400 mb-2">{t('allowedAccessTime') || 'Allowed Access Time:'}</p>
                <p className="text-2xl font-bold text-twitter">
                  {mobileAccessInfo.start}:00 - {mobileAccessInfo.end}:00
                </p>
              </div>
              <p className="text-xs text-gray-500">
                {t('tryAgainDuringHours') || 'Please try again during the allowed hours or use a desktop browser'}
              </p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => {
                setMobileAccessInfo(null);
                setError('');
              }}
              className="text-twitter hover:text-twitterDark font-bold transition-colors"
            >
              ← {t('tryAgain') || 'Try Again'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Regular login screen
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Twitter className="mx-auto h-12 w-12 text-twitter" />
          <h2 className="mt-6 text-3xl font-bold">{t('signInToTwitterClone')}</h2>
          {detectedBrowser && (
            <p className="text-xs text-gray-500 mt-2">
              Browser: {detectedBrowser}
            </p>
          )}
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && !mobileAccessInfo && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">{t('email')}</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-transparent rounded-md placeholder-gray-500 text-white focus:outline-none focus:ring-twitter focus:border-twitter"
                placeholder={t('emailAddress')}
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">{t('password')}</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-transparent rounded-md placeholder-gray-500 text-white focus:outline-none focus:ring-twitter focus:border-twitter"
                placeholder={t('password')}
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link
              to="/forgot-password"
              className="text-sm text-twitter hover:text-twitterDark"
            >
              {t('forgotPassword')}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full text-sm font-medium text-white bg-twitter hover:bg-twitterDark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-twitter disabled:opacity-50"
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              t('signIn')
            )}
          </button>

          <div className="text-center">
            <Link to="/register" className="text-twitter hover:text-twitterDark">
              {t('dontHaveAccount')} {t('signUp')}
            </Link>
          </div>
        </form>

        {/* Security Info */}
        <div className="mt-6 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-400">
              <p className="font-bold mb-1">{t('securityNotice') || 'Security Notice:'}</p>
              <ul className="space-y-1">
                <li>• Chrome: Email verification required</li>
                <li>• Brave, Edge, Firefox: Direct access</li>
                <li>• Mobile: 10 AM - 1 PM only</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;