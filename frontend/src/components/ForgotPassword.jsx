import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { passwordResetAPI } from '../services/api';
import { Twitter, Mail, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const ForgotPassword = () => {
  const { t } = useLanguage();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [canRetry, setCanRetry] = useState(true);
  const [nextRetryTime, setNextRetryTime] = useState(null);
  const [lastRequestTime, setLastRequestTime] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      // Request password reset directly
      const { data } = await passwordResetAPI.requestReset(email);
      
      if (data.success) {
        setSuccess(true);
        setEmail('');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      
      if (err.response?.status === 429) {
        // Already requested today
        setCanRetry(false);
        setNextRetryTime(err.response.data.nextRetryTime);
        setLastRequestTime(err.response.data.lastRequestTime);
        setError(err.response.data.message);
      } else {
        setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Twitter className="mx-auto h-12 w-12 text-twitter" />
          <h2 className="mt-6 text-3xl font-bold">{t('forgotPassword')}</h2>
          <p className="mt-2 text-sm text-gray-400">
            No worries! We'll send you reset instructions.
          </p>
        </div>

        {success && (
          <div className="bg-green-500 bg-opacity-10 border border-green-500 text-green-500 px-4 py-3 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Email Sent Successfully!</p>
              <p className="text-sm mt-1">
                We've sent password reset instructions to your email. Please check your inbox and spam folder.
              </p>
              <p className="text-xs mt-2 opacity-75">
                Remember: You can only reset your password once per day.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Cannot Send Reset Email</p>
                <p className="text-sm mt-1">{error}</p>
                
                {!canRetry && nextRetryTime && (
                  <div className="mt-3 space-y-2">
                    <div className="bg-red-600 bg-opacity-20 p-3 rounded">
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <p className="font-bold">Reset Request Details:</p>
                          {lastRequestTime && (
                            <p className="mt-1">
                              <span className="opacity-75">Last request:</span>{' '}
                              <span className="font-mono">{formatDateTime(lastRequestTime)}</span>
                            </p>
                          )}
                          <p className="mt-1">
                            <span className="opacity-75">Next available:</span>{' '}
                            <span className="font-mono">{formatDateTime(nextRetryTime)}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs opacity-75">
                      💡 <strong>Tip:</strong> Check your email for the previous reset link. It's still valid for 24 hours.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              {t('emailAddress')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full pl-12 pr-3 py-3 border border-gray-700 bg-transparent rounded-md placeholder-gray-500 text-white focus:outline-none focus:ring-twitter focus:border-twitter"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                  setSuccess(false);
                  setCanRetry(true);
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Enter the email address associated with your account
            </p>
          </div>

          <div className="bg-darkHover rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-twitter" />
              {t('importantInformation')}
            </h3>
            <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
              <li>You can only request password reset <strong className="text-white">once per day</strong></li>
              <li>A temporary password will be generated and sent to your email</li>
              <li>The temporary password contains only letters (mixed case)</li>
              <li>Reset link is valid for 24 hours</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading || !canRetry}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full text-sm font-medium text-white bg-twitter hover:bg-twitterDark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-twitter disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {t('sendingOTP')}
              </span>
            ) : (
              'Send Reset Instructions'
            )}
          </button>

          <div className="text-center space-y-2">
            <Link to="/login" className="text-twitter hover:text-twitterDark text-sm">
              ← {t('back')} to {t('login')}
            </Link>
            <p className="text-sm text-gray-500">
              {t('dontHaveAccount')}{' '}
              <Link to="/register" className="text-twitter hover:text-twitterDark">
                {t('signup')}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;