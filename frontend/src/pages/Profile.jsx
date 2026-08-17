import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, fetchProfile } = useAuth();
  const [formData, setFormData] = useState({
    age: '', gender: 'male', height_cm: '', weight_kg: '',
    activity_level: 'sedentary', health_goal: 'maintain_weight',
    dietary_preference: 'none', allergies: '', health_conditions: '',
    goal_weight_kg: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setFormData({
        age: user.age || '',
        gender: user.gender || 'male',
        height_cm: user.height_cm || '',
        weight_kg: user.weight_kg || '',
        activity_level: user.activity_level || 'sedentary',
        health_goal: user.health_goal || 'maintain_weight',
        dietary_preference: user.dietary_preference || 'none',
        allergies: user.allergies || '',
        health_conditions: user.health_conditions || '',
        goal_weight_kg: user.goal_weight_kg || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await api.put('/users/profile/', formData);
      await fetchProfile();
      setMessage({ type: 'success', text: '✅ Profile updated! Calories recalculated.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: '❌ Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container fade-in">
      <h1 className="page-title">Health Profile</h1>

      {user && (
        <div className="metrics-row">
          {[
            { label: 'BMI', value: user.bmi || '—' },
            { label: 'BMR', value: user.bmr ? Math.round(user.bmr) + ' kcal' : '—' },
            { label: 'TDEE', value: user.tdee ? Math.round(user.tdee) + ' kcal' : '—' },
            { label: 'Calorie Target', value: user.calorie_target ? Math.round(user.calorie_target) + ' kcal' : '—' },
          ].map(m => (
            <div key={m.label} className="glass-card metric-card">
              <div className="metric-label">{m.label}</div>
              <div className="metric-value">{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {message.text && (
        <div className={`toast ${message.type}`}>{message.text}</div>
      )}

      <div className="glass-card profile-card">
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Age</label>
                <input type="number" name="age" value={formData.age} onChange={handleChange} min="10" max="120" required />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Height (cm)</label>
                <input type="number" step="0.1" name="height_cm" value={formData.height_cm} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Current Weight (kg)</label>
                <input type="number" step="0.1" name="weight_kg" value={formData.weight_kg} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Goal Weight (kg)</label>
                <input type="number" step="0.1" name="goal_weight_kg" value={formData.goal_weight_kg} onChange={handleChange} placeholder="Optional" />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Fitness Goals</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Activity Level</label>
                <select name="activity_level" value={formData.activity_level} onChange={handleChange}>
                  <option value="sedentary">Sedentary (desk job, no exercise)</option>
                  <option value="lightly_active">Lightly Active (1-3 days/week)</option>
                  <option value="moderately_active">Moderately Active (3-5 days/week)</option>
                  <option value="very_active">Very Active (6-7 days/week)</option>
                  <option value="extra_active">Extra Active (athlete)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Health Goal</label>
                <select name="health_goal" value={formData.health_goal} onChange={handleChange}>
                  <option value="lose_weight">Lose Weight (-500 kcal)</option>
                  <option value="maintain_weight">Maintain Weight</option>
                  <option value="gain_weight">Gain Weight (+500 kcal)</option>
                  <option value="build_muscle">Build Muscle (+500 kcal)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Dietary Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Dietary Preference</label>
                <select name="dietary_preference" value={formData.dietary_preference} onChange={handleChange}>
                  <option value="none">No Preference</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="non_vegetarian">Non-Vegetarian</option>
                  <option value="eggetarian">Eggetarian</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Allergies (comma separated)</label>
                <input type="text" name="allergies" value={formData.allergies} onChange={handleChange} placeholder="e.g. nuts, dairy, gluten" />
              </div>
              <div className="form-group">
                <label className="form-label">Health Conditions (comma separated)</label>
                <input type="text" name="health_conditions" value={formData.health_conditions} onChange={handleChange} placeholder="e.g. diabetes, hypertension" />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Profile & Recalculate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
