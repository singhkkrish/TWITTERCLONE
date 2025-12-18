import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Twitter } from 'lucide-react';

const Register = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('📤 Submitting registration form:', formData);
      await register(formData);
      console.log('✅ Registration completed, navigating to home');
      navigate('/');
    } catch (err) {
      console.error('❌ Registration failed:', err);
      setError(err.response?.data?.message || t('failedToRegister'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Twitter className="mx-auto h-12 w-12 text-twitter" />
          <h2 className="mt-6 text-3xl font-bold">{t('joinTwitterToday')}</h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <input
              name="name"
              type="text"
              required
              className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-transparent rounded-md placeholder-gray-500 text-white focus:outline-none focus:ring-twitter focus:border-twitter"
              placeholder={t('fullName')}
              value={formData.name}
              onChange={handleChange}
            />
            
            <input
              name="username"
              type="text"
              required
              className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-transparent rounded-md placeholder-gray-500 text-white focus:outline-none focus:ring-twitter focus:border-twitter"
              placeholder={t('username')}
              value={formData.username}
              onChange={handleChange}
            />
            
            <input
              name="email"
              type="email"
              required
              className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-transparent rounded-md placeholder-gray-500 text-white focus:outline-none focus:ring-twitter focus:border-twitter"
              placeholder={t('emailAddress')}
              value={formData.email}
              onChange={handleChange}
            />
            
            <input
              name="password"
              type="password"
              required
              className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-transparent rounded-md placeholder-gray-500 text-white focus:outline-none focus:ring-twitter focus:border-twitter"
              placeholder={t('password')}
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full text-sm font-medium text-white bg-twitter hover:bg-twitterDark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-twitter disabled:opacity-50"
          >
            {loading ? t('creatingAccount') : t('signUp')}
          </button>

          <div className="text-center">
            <Link to="/login" className="text-twitter hover:text-twitterDark">
              {t('alreadyHaveAccount')} {t('signIn')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;