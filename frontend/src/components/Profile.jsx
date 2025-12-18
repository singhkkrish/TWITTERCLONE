import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext'; // NEW
import { userAPI } from '../services/api';
import TweetList from './TweetList';
import { Calendar } from 'lucide-react';

const Profile = () => {
  const { t } = useLanguage(); // NEW
  const { username } = useParams();
  const { currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const [profileRes, tweetsRes] = await Promise.all([
          userAPI.getProfile(username),
          userAPI.getTweets(username)
        ]);
        
        setUser(profileRes.data);
        setTweets(tweetsRes.data);
        setIsFollowing(profileRes.data.followers?.some(f => f._id === currentUser?.id));
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, currentUser]);

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await userAPI.unfollow(user._id);
        setIsFollowing(false);
        setUser(prev => ({
          ...prev,
          followers: prev.followers.filter(f => f._id !== currentUser?.id)
        }));
      } else {
        await userAPI.follow(user._id);
        setIsFollowing(true);
        setUser(prev => ({
          ...prev,
          followers: [...prev.followers, { _id: currentUser?.id }]
        }));
      }
    } catch (err) {
      console.error('Failed to follow/unfollow:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-twitter"></div>
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-8">{t('userNotFound')}</div>;
  }

  const isOwnProfile = currentUser?.username === username;

  return (
    <div>
      <div className="border-b border-gray-800">
        {user.coverPicture && (
          <img src={user.coverPicture} alt="Cover" className="w-full h-48 object-cover" />
        )}
        
        <div className="px-4 pb-4">
          <div className="flex justify-between items-start -mt-16 mb-4">
            <img
              src={user.profilePicture}
              alt={user.name}
              className="w-32 h-32 rounded-full border-4 border-black"
            />
            
            {isOwnProfile ? (
              <Link
                to="/settings/profile"
                className="mt-20 px-4 py-2 border border-gray-600 rounded-full font-bold hover:bg-gray-800 transition-colors"
              >
                {t('editProfile')}
              </Link>
            ) : (
              <button
                onClick={handleFollow}
                className={`mt-20 px-4 py-2 rounded-full font-bold transition-colors ${
                  isFollowing
                    ? 'bg-transparent border border-gray-600 hover:bg-red-500 hover:bg-opacity-10 hover:border-red-500 hover:text-red-500'
                    : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {isFollowing ? t('following') : t('follow')}
              </button>
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-bold">{user.name}</h2>
            <p className="text-gray-500">@{user.username}</p>
            
            {user.bio && <p className="mt-3">{user.bio}</p>}
            
            <div className="flex items-center gap-4 mt-3 text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {t('joined')} {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
            
            <div className="flex gap-4 mt-3">
              <div>
                <span className="font-bold">{user.following?.length || 0}</span>
                <span className="text-gray-500 ml-1">{t('following')}</span>
              </div>
              <div>
                <span className="font-bold">{user.followers?.length || 0}</span>
                <span className="text-gray-500 ml-1">{t('followers')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="border-b border-gray-800">
        <div className="flex">
          <div className="flex-1 text-center py-4 font-bold border-b-4 border-twitter">
            {t('tweets')}
          </div>
        </div>
      </div>
      
      <TweetList tweets={tweets} />
    </div>
  );
};

export default Profile;