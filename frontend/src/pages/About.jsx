import React from 'react';

const TEAM = [
  { name: 'Dristi Shrestha',  id: '790313', role: 'Backend & ML' },
  { name: 'Prashant Ghimire', id: '790328', role: 'Frontend & API' },
  { name: 'Romina Koju',      id: '790332', role: 'Dataset & Testing' },
  { name: 'Shrijan Sainju',   id: '790342', role: 'ML & Evaluation' },
];

const About = () => {
  return (
    <div className="fade-in" style={{ maxWidth: 640, padding: '8px 0' }}>
      <h1 className="page-title">About NutriAI</h1>

      <div className="glass-card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          NutriAI is a 7th semester undergraduate project at Khwopa Engineering College,
          Purbanchal University. The goal was to build a personalized nutrition recommendation
          system that actually works for Nepali dietary patterns — most existing tools are
          trained on Western food databases and don't include dal bhat, chiura, or sel roti.
        </p>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 10 }}>
          We built NepaliNutriDB from scratch — 117 traditional Nepali foods with
          nutritional data. The recommendation engine uses XGBoost (R² = 0.87) compared
          against a Random Forest baseline. The AI assistant uses Google Gemini Flash.
        </p>
      </div>

      <div className="glass-card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 12 }}>
          Team
        </p>
        {TEAM.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: '13.5px' }}>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{m.name}</span>
              <span style={{ marginLeft: 8, fontSize: '12px', color: 'var(--text-muted)' }}>— {m.role}</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.id}</span>
          </div>
        ))}
        <div style={{ paddingTop: 12, fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Khwopa Engineering College, Libali-08, Bhaktapur<br />
          Purbanchal University · Computer Engineering · 2026
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 10 }}>
          What we built
        </p>
        <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.9, paddingLeft: 18 }}>
          <li>XGBoost + Random Forest recommendation engine — trained on NepaliNutriDB</li>
          <li>Behavioral feedback loop — likes/dislikes shift future recommendation scores</li>
          <li>8-week weight projection using linear regression on logged weight history</li>
          <li>Gemini Flash nutrition assistant with user profile context</li>
          <li>BMI / BMR / TDEE auto-calculation on profile save</li>
        </ul>
      </div>

      <div className="glass-card">
        <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 10 }}>
          What we didn't build
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Computer vision food recognition was in the original scope but we deferred it.
          No labelled Nepali food image dataset exists publicly, so we would have had to
          collect and annotate one ourselves — out of scope for a single semester.
          NepaliNutriDB text search covers the same user need adequately.
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 10 }}>
          v0.9 beta · August 2026
        </p>
      </div>
    </div>
  );
};

export default About;
