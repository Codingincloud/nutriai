import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import FoodSearch from '../components/FoodSearch';
import MealCard from '../components/MealCard';
import { FiCalendar, FiPlusCircle } from 'react-icons/fi';
import './FoodLog.css';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

const FoodLog = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [mealType, setMealType] = useState('lunch');
  const [portionSize, setPortionSize] = useState(100);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchLogs(); }, [date]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/nutrition/logs/?date=${date}`);
      setLogs(res.data.results || res.data || []);
    } catch (err) {
      console.error('Failed to fetch logs', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFoodSelect = (food) => {
    setSelectedFood(food);
    setPortionSize(food.serving_size_g || 100);
  };

  const handleLogMeal = async (e) => {
    e.preventDefault();
    if (!selectedFood) return;
    if (parseFloat(portionSize) <= 0) {
      setErrorMsg('Portion size must be greater than 0.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      await api.post('/nutrition/logs/', {
        food: selectedFood.id,
        meal_type: mealType,
        quantity_g: parseFloat(portionSize),
      });
      setSelectedFood(null);
      setPortionSize(100);
      setSuccessMsg(`${selectedFood.name} logged.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchLogs();
    } catch (err) {
      const msg = err.response?.data?.quantity_g?.[0]
        || err.response?.data?.detail
        || 'Could not log meal. Try again.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  const totalCalories = logs.reduce((s, m) => s + (m.total_calories || 0), 0);

  const getTypeCalories = (type) =>
    logs.filter(l => l.meal_type === type).reduce((s, m) => s + (m.total_calories || 0), 0);

  return (
    <div className="food-log-container fade-in">
      <div className="food-log-header">
        <h1 className="page-title">Food Log</h1>
        <div className="date-total">
          <div className="date-picker-wrap">
            <FiCalendar className="date-icon" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="daily-total">
            Total: <strong>{Math.round(totalCalories)} kcal</strong>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="success-toast">{successMsg}</div>
      )}
      {errorMsg && (
        <div className="error-toast">{errorMsg}</div>
      )}

      <div className="log-grid">
        {/* LEFT: Add meal form */}
        <div className="log-form-col">
          <div className="glass-card">
            <h3 style={{marginBottom: '1rem'}}>Add a Meal</h3>
            <FoodSearch onSelect={handleFoodSelect} />

            {selectedFood && (
              <form onSubmit={handleLogMeal} className="add-meal-form fade-in">
                <div className="selected-food-box">
                  <div className="sf-name">{selectedFood.name}</div>
                  {selectedFood.name_nepali && (
                    <div className="sf-nepali">{selectedFood.name_nepali}</div>
                  )}
                  <div className="sf-macros">
                    <span>🔥 {Math.round(selectedFood.calories)} kcal</span>
                    <span>P: {selectedFood.protein}g</span>
                    <span>C: {selectedFood.carbohydrates}g</span>
                    <span>F: {selectedFood.fat}g</span>
                    <span style={{color:'var(--text-muted)'}}>per 100g</span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Meal Type</label>
                    <select value={mealType} onChange={e => setMealType(e.target.value)}>
                      {MEAL_TYPES.map(t => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Portion (g)</label>
                    <input
                      type="number" min="1" max="5000" value={portionSize}
                      onChange={e => setPortionSize(e.target.value)} required
                    />
                  </div>
                </div>

                <div className="form-preview">
                  ≈ {Math.round((selectedFood.calories || 0) * portionSize / 100)} kcal for {portionSize}g
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setSelectedFood(null)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Logging...' : <><FiPlusCircle /> Log Meal</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT: Today's log grouped by meal type */}
        <div className="log-list-col">
          <h3 style={{marginBottom: '1rem'}}>
            {new Date(date + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>

          {loading ? (
            <div className="glass-card" style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>Loading...</div>
          ) : logs.length === 0 ? (
            <div className="glass-card empty-log">
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>Nothing logged for this day.</p>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>Search for a food on the left to add it.</p>
            </div>
          ) : (
            <div>
              {MEAL_TYPES.map(type => {
                const typeLogs = logs.filter(l => l.meal_type === type);
                if (typeLogs.length === 0) return null;
                const typeCalories = getTypeCalories(type);
                return (
                  <div key={type} className="meal-group">
                    <div className="meal-group-header">
                      <span className="meal-group-title">
                        {type === 'breakfast' ? '🌅' : type === 'lunch' ? '☀️' : type === 'dinner' ? '🌙' : '🍎'} {type.charAt(0).toUpperCase() + type.slice(1)}
                      </span>
                      <span className="meal-group-cal">{Math.round(typeCalories)} kcal</span>
                    </div>
                    {typeLogs.map(log => (
                      <MealCard key={log.id} meal={log} onDelete={handleDelete} />
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodLog;
