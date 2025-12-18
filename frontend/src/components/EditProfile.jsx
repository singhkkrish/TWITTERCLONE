import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { userAPI, uploadAPI } from '../services/api';
import { Camera } from 'lucide-react';

const EditProfile = () => {
  const { t } = useLanguage();
  const { currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    bio: currentUser?.bio || '',
    profilePicture: currentUser?.profilePicture || '',
    coverPicture: currentUser?.coverPicture || ''
  });
  const [loading, setLoading] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError(t('fileTooLarge') || 'File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError(t('invalidFileType') || 'Please upload an image file');
      return;
    }

    try {
      if (type === 'profilePicture') {
        setUploadingProfile(true);
      } else {
        setUploadingCover(true);
      }

      setError('');
      console.log(`📤 Uploading ${type}...`);
      
      const { data } = await uploadAPI.uploadImage(file);
      console.log('✅ Upload successful:', data.url);
      
      setFormData({ ...formData, [type]: data.url });
    } catch (err) {
      console.error('❌ Upload failed:', err);
      setError(err.response?.data?.message || t('failedToUploadImage') || 'Failed to upload image');
    } finally {
      if (type === 'profilePicture') {
        setUploadingProfile(false);
      } else {
        setUploadingCover(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('💾 Submitting profile update:', formData);
      
      const { data } = await userAPI.updateProfile(formData);
      console.log('✅ Profile updated successfully:', data);
      
      updateUser(data);
      
      navigate(`/profile/${currentUser.username}`);
    } catch (err) {
      console.error('❌ Profile update failed:', err);
      setError(err.response?.data?.message || t('failedToUpdateProfile') || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 bg-black z-10">
        <h1 className="text-xl font-bold">{t('editProfile')}</h1>
        <button
          onClick={handleSubmit}
          disabled={loading || uploadingProfile || uploadingCover}
          className="bg-white text-black px-4 py-2 rounded-full font-bold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('saving') || 'Saving...' : t('save') || 'Save'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 mx-4 mt-4 rounded">
          {error}
        </div>
      )}

      <form className="p-4">
        <div className="mb-6 relative">
          <div className="h-48 bg-gray-800 rounded-lg relative overflow-hidden">
            {formData.coverPicture && (
              <img src={formData.coverPicture} alt="Cover" className="w-full h-full object-cover" />
            )}
            <label className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black bg-opacity-50 hover:bg-opacity-40 transition-opacity">
              {uploadingCover ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              ) : (
                <Camera className="w-8 h-8" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'coverPicture')}
                className="hidden"
                disabled={uploadingCover || loading}
              />
            </label>
          </div>
          
          <div className="absolute -bottom-16 left-4">
            <div className="w-32 h-32 rounded-full border-4 border-black overflow-hidden bg-gray-800 relative">
              {formData.profilePicture && (
                <img src={formData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              )}
              <label className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black bg-opacity-50 hover:bg-opacity-40 transition-opacity">
                {uploadingProfile ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <Camera className="w-6 h-6" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'profilePicture')}
                  className="hidden"
                  disabled={uploadingProfile || loading}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="mt-20 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('name') || 'Name'}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-transparent border border-gray-700 rounded-md focus:outline-none focus:border-twitter"
              maxLength={50}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('bio') || 'Bio'}
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-transparent border border-gray-700 rounded-md focus:outline-none focus:border-twitter resize-none"
              rows={4}
              maxLength={160}
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-1">{formData.bio.length}/160</p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;