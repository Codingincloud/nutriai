import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import WeightChart from '../components/WeightChart';
import { FiTarget, FiTrendingDown, FiTrendingUp, FiMinus } from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import './Progress.css';

const Progress = () => {
  const { user } = useAuth();
  const [weightLogs, setWeightLogs]   = useState([]);
  const [prediction, setPrediction]   = useState(null);
  const [weeklyData, setWeeklyData]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [newWeight, setNewWeight]     = useState('');
  const [date, setDate]               = useState(new Date().toISOString().split('T')[0]);
  const [successMsg, setSuccessMsg]   = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [weightRes, predRes, weekRes] = await Promise.allSettled([
        api.get('/progress/weight/'),
        api.get('/progress/predict/'),
        api.get('/nutrition/weekly-summary/'),
      ]);

      if (weightRes.status === 'fulfilled') {
        const logs = (weightRes.value.data.results || weightRes.value.data || [])
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setWeightLogs(logs);
      }
      if (predRes.status === 'fulfilled') setPrediction(predRes.value.data);
      if (weekRes.status === 'fulfilled') {
        // Ensure data is correctly mapped for bar chart
        const raw = weekRes.value.data || [];
        const mapped = raw.map(d => ({
          day:      d.day || d.date,
          calories: parseFloat(d.calories) || 0,
          target:   parseFloat(d.target)   || 2000,
        }));
        setWeeklyData(mapped);
      }
    } catch (err) {
      console.error('Progress fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogWeight = async (e) => {
    e.preventDefault();
    if (!newWeight) return;
    try {
      await api.post('/progress/weight/', { weight_kg: parseFloat(newWeight), date });
      setNewWeight('');
      setSuccessMsg(`${newWeight} kg saved!`);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchAll();
    } catch (err) {
      console.error('Weight log failed', err);
    }
  };

  // Use backend's chart_data (includes both actual + predicted keys)
  const chartData = prediction?.chart_data || [];
  const goalWeight = user?.goal_weight_kg || prediction?.goal_weight;

  // Bar chart target line value
  const calorieTarget = weeklyData[0]?.target || 2000;

  return (
    <div className="progress-container fade-in">
      <h1 className="page-title">Progress Tracking</h1>

      {/* Stats row */}
      {prediction && (
        <div className="progress-stats">
          <div className="glass-card pstat">
            <div className="pstat-label">Current Weight</div>
            <div className="pstat-value">{prediction.current_weight} kg</div>
          </div>
          {goalWeight && (
            <div className="glass-card pstat">
              <div className="pstat-label">Goal Weight</div>
              <div className="pstat-value" style={{ color: '#1a7f4b' }}>{goalWeight} kg</div>
            </div>
          )}
          <div className="glass-card pstat">
            <div className="pstat-label">Weekly Change</div>
            <div className="pstat-value"
              style={{ color: prediction.weekly_change < 0 ? '#1a7f4b' : '#c0392b' }}>
              {prediction.weekly_change > 0 ? '+' : ''}{prediction.weekly_change} kg/wk
            </div>
          </div>
          <div className="glass-card pstat">
            <div className="pstat-label">Trend</div>
            <div className="pstat-value" style={{ gap: '6px' }}>
              {prediction.trend === 'decreasing'
                ? <FiTrendingDown style={{ color: '#1a7f4b' }} />
                : prediction.trend === 'increasing'
                  ? <FiTrendingUp style={{ color: '#c0392b' }} />
                  : <FiMinus style={{ color: '#8a9ab0' }} />}
              {' '}{prediction.trend || 'stable'}
            </div>
          </div>
        </div>
      )}

      {/* Trend summary text */}
      {prediction?.summary_text && (
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px', padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)' }}>
          📊 {prediction.summary_text}
        </p>
      )}

      <div className="progress-grid">
        {/* Weight chart — actual + predicted lines */}
        <div className="glass-card">
          <h3>Weight Trend + 8-Week Prediction</h3>
          {loading ? (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Loading chart…
            </div>
          ) : chartData.length === 0 ? (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)', gap: '1rem' }}>
              <FiTarget size={36} />
              <p style={{ fontSize: '13px' }}>Log your weight to see your trend line and prediction.</p>
            </div>
          ) : (
            <WeightChart data={chartData} goalWeight={goalWeight} />
          )}
        </div>

        {/* Calorie consistency bar chart */}
        <div className="glass-card">
          <h3>Calorie Intake — Last 7 Days</h3>
          {weeklyData.length === 0 ? (
            <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Log meals to see your weekly calorie history.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eaecf0" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#5a6a7a', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#5a6a7a', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, Math.max(calorieTarget * 1.2, ...weeklyData.map(d => d.calories || 0))]}
                />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #dde1e9', borderRadius: '6px', fontSize: '12px' }}
                  itemStyle={{ color: '#1a2332' }}
                  formatter={(value) => [`${Math.round(value)} kcal`, 'Calories']}
                />
                <ReferenceLine
                  y={calorieTarget}
                  stroke="#c0392b"
                  strokeDasharray="5 4"
                  label={{ value: `Target: ${calorieTarget} kcal`, fill: '#c0392b', fontSize: 11, position: 'right' }}
                />
                <Bar dataKey="calories" fill="#1e3a5f" radius={[4, 4, 0, 0]} name="Calories" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Log weight form */}
        <div className="glass-card">
          <h3>Log Weight</h3>
          {successMsg && <div className="success-toast">{successMsg}</div>}
          <form onSubmit={handleLogWeight} style={{ marginTop: '12px' }}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input
                type="number" step="0.1" min="20" max="300"
                value={newWeight}
                onChange={e => setNewWeight(e.target.value)}
                placeholder="e.g. 68.5" required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
              Save Entry
            </button>
          </form>

          <div style={{ marginTop: '20px' }}>
            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>Recent entries</h4>
            {weightLogs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '12px', fontSize: '13px' }}>
                No entries yet. Log your first weight above.
              </p>
            ) : (
              [...weightLogs].reverse().slice(0, 8).map(log => (
                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {new Date(log.date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span style={{ color: 'var(--navy)', fontWeight: 600 }}>
                    {parseFloat(log.weight_kg).toFixed(1)} kg
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;
