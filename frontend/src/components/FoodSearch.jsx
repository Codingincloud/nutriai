import React, { useState, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import api from '../api/axios';
import './FoodSearch.css';

const FoodSearch = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length > 1) {
        searchFood(query);
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const searchFood = async (searchQuery) => {
    setLoading(true);
    try {
      const res = await api.get(`/nutrition/foods/?search=${searchQuery}`);
      const data = res.data.results || res.data || [];
      setResults(data);
      setShowDropdown(true);
    } catch (error) {
      console.error("Food search failed", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (food) => {
    onSelect(food);
    setQuery('');
    setShowDropdown(false);
    setResults([]);
  };

  return (
    <div className="food-search-container">
      <div className="search-input-wrapper">
        <FiSearch className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search for food... (e.g. Momo, Dal Bhat, दाल भात)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
        />
        {query && (
          <FiX className="clear-icon" onClick={() => { setQuery(''); setResults([]); setShowDropdown(false); }} />
        )}
      </div>
      
      {showDropdown && results.length > 0 && (
        <div className="search-results glass-card">
          {loading ? (
            <div className="search-loading">Searching...</div>
          ) : (
            results.map((food) => (
              <div key={food.id} className="search-result-item" onClick={() => handleSelect(food)}>
                <div className="food-info">
                  <div className="food-name">{food.name}</div>
                  {food.name_nepali && <div className="food-name-nepali">{food.name_nepali}</div>}
                </div>
                <div className="food-meta">
                  <span className="food-calories">{Math.round(food.calories)} kcal</span>
                  <span className="food-category">{food.category}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showDropdown && results.length === 0 && query.length > 1 && !loading && (
        <div className="search-results glass-card">
          <div className="search-loading">No foods found for "{query}"</div>
        </div>
      )}
    </div>
  );
};

export default FoodSearch;
