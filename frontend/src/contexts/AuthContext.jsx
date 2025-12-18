import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUser(response.data);
      }
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (tokenOrEmail, userOrPassword) => {
    try {
      if (typeof tokenOrEmail === 'string' && 
          tokenOrEmail.length > 50 && 
          typeof userOrPassword === 'object' && 
          userOrPassword.id) {
        
        const token = tokenOrEmail;
        const user = userOrPassword;
        
        localStorage.setItem('token', token);
        setCurrentUser(user);
        return { success: true };
      }
      
      const email = tokenOrEmail;
      const password = userOrPassword;

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, {
        email,
        password
      });

      const { data } = response;

      if (data.requiresOTP) {
        return {
          requiresOTP: true,
          userId: data.userId,
          browserType: data.browserType,
          message: data.message
        };
      }

      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        setCurrentUser(data.user);
        return { success: true };
      }

      throw new Error('Invalid login response');
    } catch (error) {
      if (error.response?.data?.requiresOTP) {
        throw error;
      }
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      let username, email, password, name;
      
      if (typeof userData === 'object' && userData !== null) {
        ({ username, email, password, name } = userData);
      } else {
        username = userData;
        email = arguments[1];
        password = arguments[2];
        name = arguments[3];
      }

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, {
        username,
        email,
        password,
        name
      });

      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setCurrentUser(user);
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  const updateUser = (userData) => {
    setCurrentUser(prevUser => ({
      ...prevUser,
      ...userData
    }));
  };

  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    checkAuth,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
