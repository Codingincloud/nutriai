import React, { useState, useRef, useEffect } from 'react';
import { FiSend } from 'react-icons/fi';
import api from '../api/axios';
import './ChatBot.css';

// Simple nutrition bowl SVG — avoids generic FiActivity icon
const BotIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8 2 4 6 4 10c0 3.3 2 6.2 5 7.4V20h6v-2.6c3-1.2 5-4.1 5-7.4 0-4-4-8-8-8z"/>
    <path d="M9 14c.5 1 1.5 2 3 2s2.5-1 3-2"/>
  </svg>
);

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);

const ChatBot = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Ask me anything about your meals, calories, or nutrition goals.' }
  ]);
  const [input, setInput]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setIsLoading(true);

    try {
      const res = await api.post('/assistant/chat/', { message: text });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.reply || res.data.content || 'No response. Try again.'
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Couldn't connect. Check your internet and try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container glass-card">
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message-wrapper ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? <UserIcon /> : <BotIcon />}
            </div>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}

        {/* Phase 5: "Thinking..." text instead of same spinner */}
        {isLoading && (
          <div className="message-wrapper assistant">
            <div className="message-avatar"><BotIcon /></div>
            <div className="message-content chat-thinking">Thinking…</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about your meals, weight goal, or nutrition…"
          disabled={isLoading}
          autoComplete="off"
        />
        <button type="submit" disabled={!input.trim() || isLoading} className="send-btn">
          <FiSend size={14} />
        </button>
      </form>
    </div>
  );
};

export default ChatBot;
