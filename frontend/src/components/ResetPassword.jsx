import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { passwordResetAPI } from '../services/api';
import { Twitter, Eye, EyeOff, CheckCircle, AlertCircle, Key, Lock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const ResetPassword = () => {
  const { t } = useLanguage();
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  
  const [userInfo, setUserInfo] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [useGeneratedPassword, setUseGeneratedPassword] = useState(false);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const { data } = await passwordResetAPI.verifyToken(token);
      if (data.valid) {
        setTokenValid(true);
        setUserInfo(data);
        setGeneratedPassword(data.generatedPassword);
      } else {
        setError('Invalid or expired reset link');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired reset link');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!useGeneratedPassword) {
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        setSubmitting(false);
        return;
      }

      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters long');
        setSubmitting(false);
        return;
      }
    }

    try {
      const { data } = await passwordResetAPI.resetPassword(token, {
        newPassword,
        confirmPassword,
        useGeneratedPassword
      });

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-twitter mx-auto"></div>
          <p className="mt-4 text-gray-400">{t('verifying')}</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold">Invalid Reset Link</h2>
          <p className="text-gray-400">{error}</p>
          <Link
            to="/forgot-password"
            className="inline-block mt-4 text-twitter hover:text-twitterDark"
          >
            Request a new reset link →
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold">Password Reset Successful!</h2>
          <p className="text-gray-400">
            Your password has been reset successfully. Redirecting to login...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-twitter mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Twitter className="mx-auto h-12 w-12 text-twitter" />
          <h2 className="mt-6 text-3xl font-bold">{t('resetPassword')}</h2>
          <p className="mt-2 text-sm text-gray-400">
            Hello, <span className="text-white font-bold">{userInfo?.username}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Generated Password Option */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Key className="w-6 h-6 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-lg">Generated Password</h3>
              <p className="text-sm opacity-90 mt-1">
                A secure password has been generated for you
              </p>
            </div>
          </div>

          <div className="bg-white bg-opacity-20 rounded-lg p-3">
            <p className="text-xs opacity-75 mb-1">Your Temporary Password:</p>
            <p className="font-mono text-2xl font-bold tracking-wider break-all">
              {generatedPassword}
            </p>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={useGeneratedPassword}
              onChange={(e) => setUseGeneratedPassword(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-white bg-transparent checked:bg-white"
            />
            <span className="text-sm">
              Use this generated password (recommended)
            </span>
          </label>
        </div>

        {/* Custom Password Option */}
        {!useGeneratedPassword && (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="bg-darkHover rounded-xl p-4 space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Or Create Your Own Password
              </h3>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                  {t('newPassword')}
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    className="appearance-none relative block w-full px-3 py-3 pr-10 border border-gray-700 bg-transparent rounded-md placeholder-gray-500 text-white focus:outline-none focus:ring-twitter focus:border-twitter"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  {t('confirmPassword')}
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className="appearance-none relative block w-full px-3 py-3 pr-10 border border-gray-700 bg-transparent rounded-md placeholder-gray-500 text-white focus:outline-none focus:ring-twitter focus:border-twitter"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-400">
                Password must be at least 6 characters long
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full text-sm font-medium text-white bg-twitter hover:bg-twitterDark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-twitter disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? `${t('resetPassword')}...` : t('resetPassword')}
            </button>
          </form>
        )}

        {useGeneratedPassword && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full text-sm font-medium text-white bg-twitter hover:bg-twitterDark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-twitter disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? `${t('resetPassword')}...` : 'Confirm Reset with Generated Password'}
          </button>
        )}

        <div className="text-center">
          <Link to="/login" className="text-twitter hover:text-twitterDark text-sm">
            ← {t('back')} to {t('login')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;