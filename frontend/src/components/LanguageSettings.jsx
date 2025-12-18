import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { languageAPI } from '../services/api';
import { Globe, Mail, Phone, Check, X, AlertCircle, Loader } from 'lucide-react';

const LanguageSettings = () => {
  const { currentLanguage, changeLanguage, t } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpType, setOtpType] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');

  const languages = [
    { code: 'en', name: t('english'), flag: '🇬🇧', requiresOTP: false, otpType: 'none' },
    { code: 'fr', name: t('french'), flag: '🇫🇷', requiresOTP: true, otpType: 'email' },
    { code: 'es', name: t('spanish'), flag: '🇪🇸', requiresOTP: true, otpType: 'phone' },
    { code: 'hi', name: t('hindi'), flag: '🇮🇳', requiresOTP: true, otpType: 'phone' },
    { code: 'pt', name: t('portuguese'), flag: '🇵🇹', requiresOTP: true, otpType: 'phone' },
    { code: 'zh', name: t('chinese'), flag: '🇨🇳', requiresOTP: true, otpType: 'phone' }
  ];

  const handleLanguageSelect = async (langCode) => {
    setSelectedLanguage(langCode);
    setError('');
    setSuccess('');
    setPhoneNumber('');
    setOtp('');
    setMaskedPhone('');

    const lang = languages.find(l => l.code === langCode);

    if (langCode === 'en') {
      try {
        setLoading(true);
        console.log('🌍 Changing to English (no OTP)');
        await languageAPI.requestLanguageChange(langCode, null);
        changeLanguage(langCode);
        setSuccess(t('languageChanged'));
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error('❌ Error changing to English:', err);
        setError(err.response?.data?.message || t('failedToChangeLanguage'));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (lang.otpType === 'email') {
      try {
        setLoading(true);
        console.log('📧 Requesting French (email OTP)');
        const { data } = await languageAPI.requestLanguageChange(langCode, null);
        
        if (data.requiresOTP) {
          setOtpType('email');
          setShowOTPModal(true);
          setSuccess(t('checkYourEmail'));
          setTimeout(() => setSuccess(''), 5000);
        }
      } catch (err) {
        console.error('❌ Error requesting French:', err);
        setError(err.response?.data?.message || t('failedToSendOTP'));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (lang.otpType === 'phone') {
      console.log('📱 Language requires phone OTP:', langCode);
      setOtpType('phone');
      setShowPhoneInput(true);
    }
  };

  const handleSendPhoneOTP = async () => {
    console.log('📞 Attempting to send phone OTP');
    console.log('📱 Phone number entered:', phoneNumber);
    console.log('🌍 Selected language:', selectedLanguage);

    if (!phoneNumber) {
      setError('Please enter your phone number');
      return;
    }

    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError('Please enter a valid international phone number (e.g., +1234567890)');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('📤 Sending API request with phone:', phoneNumber);
      
      const { data } = await languageAPI.requestLanguageChange(selectedLanguage, phoneNumber);
      
      console.log('📥 API Response:', data);
      
      if (data.requiresOTP) {
        setMaskedPhone(data.maskedPhone || phoneNumber);
        setShowPhoneInput(false);
        setShowOTPModal(true);
        setSuccess('OTP sent to your phone successfully!');
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      console.error('❌ Error sending phone OTP:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    console.log('🔐 Attempting to verify OTP');
    
    if (otp.length !== 6) {
      setError(t('pleaseEnterValidOTP'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('📤 Verifying OTP:', otp, 'for language:', selectedLanguage);
      
      await languageAPI.verifyOTP(otp, selectedLanguage);
      
      console.log('✅ OTP verified successfully');
      
      changeLanguage(selectedLanguage);
      setShowOTPModal(false);
      setShowPhoneInput(false);
      setOtp('');
      setPhoneNumber('');
      setSuccess(t('languageChanged'));
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('❌ Error verifying OTP:', err);
      setError(err.response?.data?.message || t('invalidOTP'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    console.log('🔄 Resending OTP');
    setOtp('');
    
    if (otpType === 'phone') {
      await handleSendPhoneOTP();
    } else {
      try {
        setLoading(true);
        setError('');
        await languageAPI.requestLanguageChange(selectedLanguage, null);
        setSuccess(t('checkYourEmail'));
        setTimeout(() => setSuccess(''), 5000);
      } catch (err) {
        setError(err.response?.data?.message || t('failedToResendOTP'));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-gray-800 px-6 py-4 sticky top-0 bg-black z-10">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-twitter" />
          <h1 className="text-2xl font-bold">{t('language')}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {success && (
          <div className="mb-4 bg-green-500 bg-opacity-10 border border-green-500 rounded-xl p-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500" />
              <p className="text-green-500 text-sm">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-xl p-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="mb-6 bg-darkHover rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-sm mb-2">{t('currentLanguage')}</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{languages.find(l => l.code === currentLanguage)?.flag}</span>
            <p className="text-xl font-bold">{languages.find(l => l.code === currentLanguage)?.name}</p>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold mb-4">{t('selectLanguage')}</h2>
          
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              disabled={loading}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                currentLanguage === lang.code
                  ? 'border-twitter bg-twitter bg-opacity-10'
                  : 'border-gray-800 bg-darkHover hover:border-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{lang.flag}</span>
                <div className="text-left">
                  <p className="font-bold">{lang.name}</p>
                  {lang.requiresOTP && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      {lang.otpType === 'email' ? (
                        <><Mail className="w-3 h-3" /> Email OTP Required</>
                      ) : (
                        <><Phone className="w-3 h-3" /> Phone OTP Required</>
                      )}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {loading && selectedLanguage === lang.code && (
                  <Loader className="w-5 h-5 text-twitter animate-spin" />
                )}
                {currentLanguage === lang.code && (
                  <Check className="w-6 h-6 text-twitter" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-400">
              <p className="font-bold mb-2">{t('languageVerification')}</p>
              <ul className="space-y-1 text-xs">
                <li>• English: No verification required</li>
                <li>• French: Email OTP verification</li>
                <li>• Spanish, Hindi, Portuguese, Chinese: Phone OTP verification</li>
                <li>• OTP valid for 10 minutes</li>
                <li>• Phone must be in international format: +1234567890</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Phone Number Input Modal */}
      {showPhoneInput && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-dark border border-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Enter Phone Number</h2>
              <button
                onClick={() => {
                  setShowPhoneInput(false);
                  setPhoneNumber('');
                  setError('');
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4 text-sm text-gray-400 bg-darkHover p-3 rounded-lg">
              <Phone className="w-4 h-4 text-twitter" />
              <span>We'll send an OTP to verify your phone number</span>
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm font-bold mb-2">
                <Phone className="w-4 h-4" />
                Phone Number (International Format)
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  setPhoneNumber(value);
                  console.log('📱 Phone input changed:', value);
                }}
                placeholder="+919876543210"
                className="w-full px-4 py-3 bg-darkHover border border-gray-700 rounded-lg focus:border-twitter focus:outline-none text-white placeholder-gray-500"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                Examples: +1234567890 (USA), +919876543210 (India), +447123456789 (UK)
              </p>
            </div>

            {error && (
              <div className="mb-4 text-red-500 text-sm flex items-center gap-2 bg-red-500 bg-opacity-10 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleSendPhoneOTP}
              disabled={loading || !phoneNumber}
              className="w-full bg-twitter hover:bg-twitterDark text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-5 h-5 animate-spin" />}
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-dark border border-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{t('otpVerification')}</h2>
              <button
                onClick={() => {
                  setShowOTPModal(false);
                  setOtp('');
                  setError('');
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4 text-sm text-gray-400 bg-darkHover p-3 rounded-lg">
              {otpType === 'email' ? (
                <>
                  <Mail className="w-4 h-4 text-twitter" />
                  <span>OTP sent to your email address</span>
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 text-twitter" />
                  <span>OTP sent to {maskedPhone}</span>
                </>
              )}
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm font-bold mb-2">
                {t('enterOTP')}
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(value);
                  console.log('🔢 OTP entered:', value);
                }}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 bg-darkHover border border-gray-700 rounded-lg focus:border-twitter focus:outline-none text-center text-2xl tracking-widest font-mono text-white"
                autoFocus
              />
              <p className="text-xs text-gray-500 text-center mt-2">
                {t('enterSixDigitOTPCode')}
              </p>
            </div>

            {error && (
              <div className="mb-4 text-red-500 text-sm flex items-center gap-2 bg-red-500 bg-opacity-10 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
              className="w-full bg-twitter hover:bg-twitterDark text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3 flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-5 h-5 animate-spin" />}
              {loading ? t('verifying') : t('verifyOTP')}
            </button>

            <button
              onClick={handleResendOTP}
              disabled={loading}
              className="w-full text-twitter hover:text-twitterDark font-bold py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('resendOTP')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSettings;