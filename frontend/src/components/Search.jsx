import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { userAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext'; 
import { Search as SearchIcon, X } from 'lucide-react';

const Search = () => {
  const { t } = useLanguage(); 
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    const searchQuery = e.target.value;
    setQuery(searchQuery);

    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await userAPI.search(searchQuery);
      setResults(data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
  };

  return (
    <div className="max-w-full">
      <div className="border-b border-gray-800 px-4 py-3 sticky top-0 bg-black z-10">
        <h1 className="text-xl font-bold mb-4">{t('search')}</h1>
        
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder={t('searchUsers')}
            className="w-full bg-darkHover rounded-full py-3 pl-12 pr-10 focus:outline-none focus:ring-2 focus:ring-twitter"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-800">
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-twitter mx-auto"></div>
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {t('noUsersFound').replace('{query}', query)}
          </div>
        )}

        {results.map((user) => (
          <Link
            key={user._id}
            to={`/profile/${user.username}`}
            className="block p-4 hover:bg-darkHover transition-colors"
          >
            <div className="flex items-center gap-3">
              <img
                src={user.profilePicture}
                alt={user.name}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{user.name}</p>
                <p className="text-gray-500 text-sm truncate">@{user.username}</p>
                {user.bio && (
                  <p className="text-gray-400 text-sm mt-1 line-clamp-2">{user.bio}</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Search;