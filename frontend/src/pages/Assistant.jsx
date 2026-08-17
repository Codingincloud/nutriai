import React from 'react';
import ChatBot from '../components/ChatBot';
import './Assistant.css';

const SUGGESTIONS = [
  'How much dal bhat can I eat and stay under 2000 kcal?',
  'Is 500g of chiura too much for lunch?',
  'What should I eat before a morning run?',
  'Explain the difference between BMR and TDEE.',
  'My goal is to maintain weight — am I eating correctly?',
];

const Assistant = () => {
  return (
    <div className="assistant-container fade-in">
      <div className="assistant-header">
        <h1 className="page-title">Nutrition Assistant</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 0 }}>
          Powered by Gemini — uses your saved profile for context.
        </p>
      </div>

      <div className="assistant-layout">
        <div className="chat-section">
          <ChatBot />
        </div>

        <div className="suggestions-section">
          <div className="glass-card" style={{ marginBottom: '14px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Things to try
            </p>
            <ul className="suggestion-list">
              {SUGGESTIONS.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6, padding: '0 2px' }}>
            Responses are AI-generated and may be inaccurate. Always verify nutritional advice with a qualified dietitian.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assistant;
