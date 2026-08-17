import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import CalorieRing from '../components/CalorieRing';
import MacroChart from '../components/MacroChart';
import MealCard from '../components/MealCard';
import { FiZap, FiActivity, FiCrosshair, FiTrendingUp } from 'react-icons/fi';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [meals,   setMeals]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const fetchAll = async () => {
      try {
        const [sumRes, mealsRes] = await Promise.all([
          api.get(`/nutrition/daily-summary/?date=${today}`).catch(() => null),
          api.get(`/nutrition/logs/?date=${today}`).catch(() => ({ data: [] })),
        ]);
        if (sumRes) setSummary(sumRes.data);
        setMeals(mealsRes.data.results || mealsRes.data || []);
      } catch (err) {
        console.error('Dashboard fetch error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const target   = summary?.calorie_target || user?.calorie_target || 2000;
  const consumed = summary?.total_calories || meals.reduce((s, m) => s + (m.total_calories || 0), 0);
  const protein  = summary?.total_protein  || meals.reduce((s, m) => s + (m.total_protein  || 0), 0);
  const carbs    = summary?.total_carbs    || meals.reduce((s, m) => s + (m.total_carbs    || 0), 0);
  const fat      = summary?.total_fat      || meals.reduce((s, m) => s + (m.total_fat      || 0), 0);
  const remaining = Math.max(0, target - consumed);

  // Date string, no generic greeting
  const today = new Date();
  const dayLabel = today.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  if (loading) return <div className="loading-screen">Loading…</div>;

  return (
    <div className="dashboard-container fade-in">

      {/* Page header — date-driven, no emoji greeting */}
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Nutrition Summary</h1>
          <p className="dashboard-date">{dayLabel}</p>
        </div>
        {user?.username && (
          <div className="dashboard-user-chip">{user.username[0].toUpperCase()}</div>
        )}
      </div>

      {/* Inline stat strip — smaller than 4 equal cards */}
      <div className="stat-strip">
        <div className="stat-strip-item">
          <div className="strip-label">BMI</div>
          <div className="strip-value">{user?.bmi ? parseFloat(user.bmi).toFixed(1) : '—'}</div>
        </div>
        <div className="stat-strip-divider" />
        <div className="stat-strip-item">
          <div className="strip-label">BMR</div>
          <div className="strip-value">{user?.bmr ? Math.round(user.bmr) + ' kcal' : '—'}</div>
        </div>
        <div className="stat-strip-divider" />
        <div className="stat-strip-item">
          <div className="strip-label">Daily target</div>
          <div className="strip-value">{Math.round(target)} kcal</div>
        </div>
        <div className="stat-strip-divider" />
        <div className="stat-strip-item">
          <div className="strip-label">Goal</div>
          <div className="strip-value">{user?.health_goal?.replace(/_/g, ' ') || '—'}</div>
        </div>
      </div>

      {/* Main content — calorie summary + macros side by side, then meals below */}
      <div className="dashboard-main">

        {/* Left: calorie overview — ring alongside text, not as centrepiece */}
        <div className="glass-card dash-calories">
          <h3>Calories today</h3>
          <div className="calories-layout">
            <CalorieRing consumed={consumed} target={target} size={140} />
            <div className="calories-text">
              <div className="cal-primary">
                <span className="cal-num">{Math.round(consumed)}</span>
                <span className="cal-unit"> / {Math.round(target)} kcal</span>
              </div>
              <div className="cal-row" style={{ color: remaining > 0 ? '#1a7f4b' : '#c0392b' }}>
                {remaining > 0
                  ? `${Math.round(remaining)} kcal remaining`
                  : `${Math.round(consumed - target)} kcal over target`}
              </div>
              <div className="cal-progress-bar">
                <div
                  className="cal-progress-fill"
                  style={{
                    width: `${Math.min(100, (consumed / target) * 100)}%`,
                    background: consumed > target ? '#c0392b' : '#1e3a5f'
                  }}
                />
              </div>
              <div className="cal-meals-count">{meals.length} meal{meals.length !== 1 ? 's' : ''} logged</div>
            </div>
          </div>
        </div>

        {/* Right: macros */}
        <div className="glass-card dash-macros">
          <h3>Macros</h3>
          <MacroChart protein={protein} carbs={carbs} fats={fat} />
          <div className="macro-legend">
            {[['Protein', protein, '#1e3a5f'], ['Carbs', carbs, '#1a7f4b'], ['Fat', fat, '#c0392b']].map(([name, val, color]) => (
              <div key={name} className="macro-legend-item">
                <span className="macro-dot" style={{ background: color }} />
                <span>{name}</span>
                <span style={{ color, fontWeight: 600 }}>{Math.round(val)}g</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Meals log */}
      <div className="glass-card dash-meals">
        <div className="meals-header">
          <h3>Today's log</h3>
          <span className="meals-count">{meals.length} {meals.length === 1 ? 'entry' : 'entries'}</span>
        </div>
        <div className="meals-list">
          {meals.length === 0 ? (
            <div className="empty-state">
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
                No meals logged yet for today.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', marginTop: '4px' }}>
                Use the Food Log page to add meals — your calorie ring will update automatically.
              </p>
            </div>
          ) : (
            meals.map(meal => <MealCard key={meal.id} meal={meal} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
