import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

axios.defaults.baseURL = API_URL;

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const tweetAPI = {
  getAll: () => axios.get('/tweets'),
  getFeed: () => axios.get('/tweets/feed'),
  getById: (id) => axios.get(`/tweets/${id}`),
  create: (tweetData) => axios.post('/tweets', tweetData),
  delete: (id) => axios.delete(`/tweets/${id}`),
  like: (id) => axios.post(`/tweets/${id}/like`),
  unlike: (id) => axios.delete(`/tweets/${id}/like`),
  retweet: (id) => axios.post(`/tweets/${id}/retweet`),
  reply: (id, content) => axios.post(`/tweets/${id}/reply`, content)
};

export const userAPI = {
  getProfile: (username) => axios.get(`/users/${username}`),
  updateProfile: (profileData) => axios.put('/users/profile', profileData),
  follow: (userId) => axios.post(`/users/${userId}/follow`),
  unfollow: (userId) => axios.delete(`/users/${userId}/follow`),
  getTweets: (username) => axios.get(`/users/${username}/tweets`),
  search: (query) => axios.get(`/users/search/users?q=${query}`)
};

export const uploadAPI = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return axios.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadAudio: async (file, otpId, duration) => {
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('otpId', otpId);
    formData.append('duration', duration);
    return axios.post('/upload/audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export const otpAPI = {
  request: () => axios.post('/otp/request'),
  verify: (otp) => axios.post('/otp/verify', { otp }),
  check: () => axios.get('/otp/check')
};

export const passwordResetAPI = {
  requestReset: (email) => axios.post('/password-reset/request', { email }),
  verifyToken: (token) => axios.get(`/password-reset/verify/${token}`),
  resetPassword: (token, data) => axios.post(`/password-reset/reset/${token}`, data),
  checkAvailability: (email) => axios.get(`/password-reset/check-availability?email=${email}`)
};

export const subscriptionAPI = {
  getMySubscription: () => axios.get('/subscription/my-subscription'),
  getPlans: () => axios.get('/subscription/plans'),
  createOrder: (planType) => axios.post('/subscription/create-order', { planType }),
  verifyPayment: (paymentData) => axios.post('/subscription/verify-payment', paymentData),
  checkPaymentTime: () => axios.get('/subscription/check-payment-time')
};

export const languageAPI = {
  getCurrentLanguage: () => axios.get('/language/current'),
  requestLanguageChange: (language, phoneNumber = null) => {
    const payload = { language };
    if (phoneNumber) {
      payload.phoneNumber = phoneNumber;
    }
    return axios.post('/language/request-change', payload);
  },
  verifyOTP: (otp, language) => axios.post('/language/verify-otp', { otp, language }),
  updatePhoneNumber: (phoneNumber) => axios.post('/language/update-phone', { phoneNumber })
};

export default axios;
