import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Upload, Mail, Check, X } from 'lucide-react';
import { uploadAPI, otpAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const AudioRecorder = ({ onAudioReady, onClose }) => {
  const { t } = useLanguage();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
    
  const [step, setStep] = useState('initial'); 
  const [otp, setOtp] = useState('');
  const [otpId, setOtpId] = useState(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpError, setOtpError] = useState('');
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
    
  const [canUpload, setCanUpload] = useState(true);
  const [timeMessage, setTimeMessage] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  
  useEffect(() => {
    const checkTimeRestriction = () => {
      const now = new Date();
      
      
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istTime = new Date(now.getTime() + istOffset);
      const hours = istTime.getUTCHours();
      
      const allowed = hours >= 14 && hours < 19;
      setCanUpload(allowed);
      
      if (!allowed) {
        if (hours < 14) {
          setTimeMessage(t('audioUploadsAvailable'));
        } else {
          setTimeMessage(t('audioUploadsClosed'));
        }
      }
    };

    checkTimeRestriction();
    const interval = setInterval(checkTimeRestriction, 60000); 

    return () => clearInterval(interval);
  }, [t]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
        setAudioBlob(audioBlob);
                
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setDuration(0);
      setError('');
      
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          
          if (newDuration >= 300) {
            stopRecording();
            return 300;
          }
          return newDuration;
        });
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Failed to access microphone. Please grant permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      clearInterval(timerRef.current);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setDuration(prev => {
            const newDuration = prev + 1;
            if (newDuration >= 300) {
              stopRecording();
              return 300;
            }
            return newDuration;
          });
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        clearInterval(timerRef.current);
      }
      setIsPaused(!isPaused);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const deleteRecording = () => {
    setAudioURL(null);
    setAudioBlob(null);
    setDuration(0);
    setIsPlaying(false);
    setStep('initial');
    setOtp('');
    setOtpId(null);
    setOtpError('');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Request OTP
  const handleRequestOTP = async () => {
    if (!canUpload) {
      setError(timeMessage);
      return;
    }

    if (!audioBlob) {
      setError('Please record audio first');
      return;
    }

    // Check file size (100 MB)
    const maxSize = 100 * 1024 * 1024;
    if (audioBlob.size > maxSize) {
      setError('Audio file size exceeds 100 MB limit');
      return;
    }

    setSendingOTP(true);
    setOtpError('');
    setError('');

    try {
      const { data } = await otpAPI.request();
      setMaskedEmail(data.email);
      setStep('otp-sent');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOTP(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setOtpError('Please enter a 6-digit OTP');
      return;
    }

    setVerifyingOTP(true);
    setOtpError('');

    try {
      const { data } = await otpAPI.verify(otp);
      setOtpId(data.otpId);
      setStep('otp-verified');
      
      // Auto-upload after verification
      setTimeout(() => {
        handleUpload(data.otpId);
      }, 500);
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setVerifyingOTP(false);
    }
  };

  // Upload audio
  const handleUpload = async (verifiedOtpId) => {
    if (!audioBlob) {
      setError('No audio to upload');
      return;
    }

    if (!verifiedOtpId) {
      setError('OTP verification required');
      return;
    }

    setUploading(true);
    setStep('uploading');
    setError('');

    try {
      const { data } = await uploadAPI.uploadAudio(audioBlob, verifiedOtpId, duration);
      
      onAudioReady({
        url: data.url,
        duration: duration,
        size: audioBlob.size
      });

      onClose();
    } catch (err) {
      console.error('Audio upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload audio');
      setStep('otp-verified');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-dark rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">🎙️ {t('audioTweet')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {!canUpload && (
          <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4 text-sm">
            {timeMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Recording Controls */}
        {!audioURL && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold mb-4">{formatTime(duration)}</div>
              {duration >= 300 && (
                <p className="text-yellow-500 text-sm mb-2">Maximum duration reached</p>
              )}
            </div>

            <div className="flex justify-center gap-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={!canUpload}
                  className="bg-twitter hover:bg-twitterDark text-white p-4 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mic className="w-8 h-8" />
                </button>
              ) : (
                <>
                  <button
                    onClick={pauseRecording}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white p-4 rounded-full transition-colors"
                  >
                    {isPaused ? <Play className="w-8 h-8" /> : <Pause className="w-8 h-8" />}
                  </button>
                  <button
                    onClick={stopRecording}
                    className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-colors"
                  >
                    <Square className="w-8 h-8" />
                  </button>
                </>
              )}
            </div>

            <div className="text-center text-sm text-gray-500 space-y-1">
              <p>• {t('maxDuration')}</p>
              <p>• {t('maxFileSize')}</p>
              <p>• {t('uploadsAllowed')}</p>
            </div>
          </div>
        )}
        
        {audioURL && (
          <div className="space-y-4">
            <div className="bg-darkHover rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">{t('recording')}</span>
                <span className="text-sm font-bold">{formatTime(duration)}</span>
              </div>

              <audio
                ref={audioRef}
                src={audioURL}
                onEnded={() => setIsPlaying(false)}
                className="w-full"
                controls
              />

              <div className="flex gap-2 mt-3">
                <button
                  onClick={playAudio}
                  className="flex-1 bg-twitter hover:bg-twitterDark text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  {isPlaying ? t('pauseRecording') : t('playRecording')}
                </button>
                <button
                  onClick={deleteRecording}
                  className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {step === 'initial' && (
              <button
                onClick={handleRequestOTP}
                disabled={sendingOTP || !canUpload}
                className="w-full bg-twitter hover:bg-twitterDark text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingOTP ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {t('sendingOTP')}
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    {t('verifyEmailUpload')}
                  </>
                )}
              </button>
            )}

            {step === 'otp-sent' && (
              <div className="space-y-3">
                <div className="bg-twitter bg-opacity-10 border border-twitter text-twitter px-4 py-3 rounded text-sm">
                  {t('otpSentTo')} {maskedEmail}
                </div>

                {otpError && (
                  <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded text-sm">
                    {otpError}
                  </div>
                )}

                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                    setOtpError('');
                  }}
                  placeholder={t('enterSixDigitOTP')}
                  className="w-full px-4 py-3 bg-darkHover border border-gray-700 rounded-lg focus:outline-none focus:border-twitter text-center text-2xl tracking-widest"
                  maxLength={6}
                />

                <div className="flex gap-2">
                  <button
                    onClick={handleVerifyOTP}
                    disabled={verifyingOTP || otp.length !== 6}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verifyingOTP ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        {t('verifying')}
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        {t('verifyOTP')}
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleRequestOTP}
                    disabled={sendingOTP}
                    className="bg-darkHover hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {t('resend')}
                  </button>
                </div>
              </div>
            )}

            {step === 'uploading' && (
              <div className="bg-twitter bg-opacity-10 border border-twitter text-twitter px-4 py-3 rounded text-center">
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-twitter"></div>
                  <span className="font-medium">{t('uploadingAudio')}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;