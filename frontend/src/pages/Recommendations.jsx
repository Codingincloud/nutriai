import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { FiRefreshCw, FiPlusCircle, FiThumbsUp, FiThumbsDown, FiInfo } from 'react-icons/fi';
import './Recommendations.css';

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState('');
  const [addingId, setAddingId]               = useState(null);
  const [feedbackMap, setFeedbackMap]         = useState({});
  const [loggedIds, setLoggedIds]             = useState(new Set());

  useEffect(() => { fetchRecommendations(); }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/recommendations/generate/');
      const data = res.data.results || res.data || [];
      setRecommendations(data);
      // Pre-populate feedback map from backend behavioral data
      const fb = {};
      data.forEach(f => {
        if (f.liked)    fb[f.id] = 'liked';
        if (f.disliked) fb[f.id] = 'disliked';
      });
      setFeedbackMap(fb);
    } catch (err) {
      console.error('Failed to fetch recommendations', err);
      setError('Could not load recommendations. Complete your Health Profile first.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToLog = async (food) => {
    setAddingId(food.id);
    try {
      await api.post('/nutrition/logs/', { food: food.id, meal_type: 'lunch', quantity_g: 100 });
      setLoggedIds(prev => new Set([...prev, food.id]));
    } catch (err) {
      console.error('Add to log failed', err);
    } finally {
      setAddingId(null);
    }
  };

  const handleFeedback = async (food, type) => {
    // Toggle off if already set
    const current = feedbackMap[food.id];
    const newType = current === type ? null : type;
    try {
      if (newType) {
        await api.post(`/recommendations/${food.id}/feedback/`, { feedback: newType });
      }
      setFeedbackMap(prev => ({ ...prev, [food.id]: newType }));
    } catch (err) {
      console.error('Feedback failed', err);
    }
  };

  // Score bar color: green-ish above 70%, amber 40-70%, muted below
  const scoreColor = (pct) => {
    if (pct >= 70) return '#1a7f4b';
    if (pct >= 40) return '#b45309';
    return '#c0392b';
  };

  return (
    <div className="recommendations-container fade-in">
      <div className="rec-header-row">
        <div>
          <h1 className="page-title">Meal Recommendations</h1>
          <p className="rec-subtitle">
            Ranked by XGBoost nutritional quality + today's remaining macro budget.
            Scores vary based on what you've already eaten today.
          </p>
        </div>
        <button className="btn-primary refresh-btn" onClick={fetchRecommendations} disabled={loading}>
          <FiRefreshCw style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="rec-grid">
          {[1,2,3,4,5,6].map(n => <div key={n} className="glass-card rec-skeleton" />)}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🥗</div>
          <h3>No recommendations yet</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '13px' }}>
            Complete your Health Profile (age, weight, goal), then click Refresh.
          </p>
        </div>
      ) : (
        <div className="rec-grid">
          {recommendations.map((food, idx) => {
            const fb     = feedbackMap[food.id];
            const logged = loggedIds.has(food.id);
            const pct    = food.match_percent || Math.round((food.score || 0) * 100);

            return (
              <div key={food.id} className={`glass-card rec-card ${idx < 3 ? 'top-pick' : ''}`}>

                {idx < 3 && <span className="top-badge">Top Pick #{idx + 1}</span>}

                {/* Name + Score */}
                <div className="rec-card-header">
                  <div>
                    <div className="rec-food-name">{food.name}</div>
                    {food.name_nepali && <div className="rec-food-nepali">{food.name_nepali}</div>}
                  </div>
                  <div className="rec-score" style={{ color: scoreColor(pct) }}>{pct}%</div>
                </div>

                {/* Score bar */}
                <div className="rec-score-bar">
                  <div className="rec-score-fill"
                    style={{ width: `${pct}%`, background: scoreColor(pct) }} />
                </div>

                {/* Model comparison: XGBoost vs RF */}
                {food.xgb_score !== undefined && (
                  <div className="rec-model-compare">
                    <span title="XGBoost nutritional quality score">XGB: {food.xgb_score}%</span>
                    {food.rf_score !== undefined && (
                      <span title="Random Forest score">RF: {food.rf_score}%</span>
                    )}
                    <span title="Budget fit today">Budget fit: {Math.round((food.score || 0) * 100)}%</span>
                  </div>
                )}

                {/* Reason string */}
                {food.reason && (
                  <div className="rec-reason">
                    <FiInfo size={11} style={{ flexShrink: 0 }} />
                    <span>{food.reason}</span>
                  </div>
                )}

                {/* Macros */}
                <div className="rec-macros">
                  <span>🔥 {Math.round(food.calories || 0)} kcal</span>
                  <span>P: {Math.round(food.protein || 0)}g</span>
                  <span>C: {Math.round(food.carbohydrates || 0)}g</span>
                  <span>F: {Math.round(food.fat || 0)}g</span>
                </div>

                {/* Tags */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {food.is_nepali && <span className="nepali-badge">🇳🇵 Nepali</span>}
                  {food.is_vegetarian && <span className="veg-badge">🥦 Veg</span>}
                  {fb === 'liked' && <span className="liked-badge">👍 Preferred</span>}
                  {fb === 'disliked' && <span className="disliked-badge">👎 Low preference</span>}
                </div>

                {/* Actions */}
                <div className="rec-actions">
                  <button
                    className={`btn-primary add-btn ${logged ? 'logged' : ''}`}
                    onClick={() => handleAddToLog(food)}
                    disabled={addingId === food.id || logged}
                  >
                    <FiPlusCircle size={13} />
                    {logged ? 'Logged ✓' : addingId === food.id ? '…' : 'Add to Log'}
                  </button>
                  <button
                    className={`icon-btn ${fb === 'liked' ? 'liked' : ''}`}
                    onClick={() => handleFeedback(food, 'liked')}
                    title="Like — boosts this food's future ranking"
                  >
                    <FiThumbsUp size={13} />
                  </button>
                  <button
                    className={`icon-btn ${fb === 'disliked' ? 'disliked' : ''}`}
                    onClick={() => handleFeedback(food, 'disliked')}
                    title="Dislike — lowers this food's future ranking"
                  >
                    <FiThumbsDown size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Recommendations;
