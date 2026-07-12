import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { MessageSquare, X, Send, User, Bot, ShieldCheck } from 'lucide-react';

const ChatBot = () => {
  const { user, token, apiCall, showToast } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatStatus, setChatStatus] = useState('bot'); // 'bot' or 'admin'
  const messagesEndRef = useRef(null);

  // Initialize or fetch session ID from localStorage
  const [sessionId] = useState(() => {
    let id = localStorage.getItem('chat_session_id');
    if (!id) {
      id = 'chat_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('chat_session_id', id);
    }
    return id;
  });

  const loadHistory = async () => {
    try {
      const data = await apiCall(`/chats/history/${sessionId}`);
      setChatStatus(data.status);
      
      if (data.messages.length === 0) {
        // Seed default welcome message
        setMessages([
          {
            sender: 'bot',
            message: "Hello! Welcome to TechCentral. I'm your Virtual Assistant. Ask me anything about our gadgets, store hours, locations, delivery fees, or warranty. If you need to chat with Toby, our admin support agent, simply reply 'connect to admin'.",
            created_at: new Date().toISOString()
          }
        ]);
      } else {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  // Poll for admin replies if the session is actively connected to the admin
  useEffect(() => {
    loadHistory();
    
    let interval;
    if (isOpen && chatStatus === 'admin') {
      interval = setInterval(() => {
        loadHistory();
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isOpen, chatStatus, sessionId]);

  // Scroll to bottom on updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Optimistically add user message
    setMessages(prev => [...prev, { sender: 'user', message: userMessage, created_at: new Date().toISOString() }]);

    try {
      const data = await apiCall('/chats/message', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          message: userMessage,
          userId: user?.id || null
        })
      });

      setChatStatus(data.status);
      
      if (data.reply) {
        setMessages(prev => [...prev, { sender: 'bot', message: data.reply, created_at: new Date().toISOString() }]);
      }
    } catch (err) {
      showToast('Chat could not send. Please retry.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, fontFamily: 'var(--font-family)' }}>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="btn btn-primary"
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0
          }}
          title="Chat Support Assistant"
        >
          <MessageSquare size={26} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          width: '360px',
          height: '460px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {chatStatus === 'admin' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div>
                <h4 style={{ margin: 0, fontWeight: 'bold', fontSize: '0.95rem' }}>
                  {chatStatus === 'admin' ? 'Toby (Admin Support)' : 'TechCentral Assistant'}
                </h4>
                <span style={{ fontSize: '0.75rem', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {chatStatus === 'admin' ? (
                    <>
                      <ShieldCheck size={10} /> Live Agent Session
                    </>
                  ) : (
                    'AI Chatbot Online'
                  )}
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ color: 'white', opacity: 0.8 }} title="Close Chat">
              <X size={20} />
            </button>
          </div>

          {/* Messages area */}
          <div style={{
            flexGrow: 1,
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: 'var(--bg-primary)'
          }}>
            {messages.map((msg, index) => {
              const isUser = msg.sender === 'user';
              const isAdminMsg = msg.sender === 'admin';
              
              let bubbleBg = 'var(--surface)';
              let bubbleColor = 'var(--text-primary)';
              let alignSelf = 'flex-start';
              let borderRadius = '4px 16px 16px 16px';

              if (isUser) {
                bubbleBg = 'var(--primary)';
                bubbleColor = 'white';
                alignSelf = 'flex-end';
                borderRadius = '16px 4px 16px 16px';
              } else if (isAdminMsg) {
                bubbleBg = 'var(--success-glow)';
                bubbleColor = 'var(--text-primary)';
                alignSelf = 'flex-start';
                borderRadius = '4px 16px 16px 16px';
              }

              return (
                <div key={index} style={{
                  maxWidth: '80%',
                  padding: '12px 16px',
                  borderRadius,
                  backgroundColor: bubbleBg,
                  color: bubbleColor,
                  alignSelf,
                  fontSize: '0.85rem',
                  lineHeight: '1.4',
                  boxShadow: 'var(--shadow-sm)',
                  border: isUser ? 'none' : '1px solid var(--border)'
                }}>
                  {msg.message}
                </div>
              );
            })}
            
            {loading && (
              <div style={{ alignSelf: 'flex-start', padding: '12px 16px', borderRadius: '4px 16px 16px 16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', gap: '4px' }}>
                <span className="spinner-dot" style={{ animationDelay: '0s' }}>.</span>
                <span className="spinner-dot" style={{ animationDelay: '0.2s' }}>.</span>
                <span className="spinner-dot" style={{ animationDelay: '0.4s' }}>.</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Footer input form */}
          <form onSubmit={handleSendMessage} style={{
            padding: '12px 16px',
            backgroundColor: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <input
              type="text"
              placeholder={chatStatus === 'admin' ? "Type message to Toby..." : "Ask assistant or type 'help'..."}
              className="form-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flexGrow: 1, marginBottom: 0, padding: '10px 14px' }}
              disabled={loading}
              maxLength={500}
            />
            <button
              type="submit"
              className="btn btn-primary btn-icon"
              style={{ width: '40px', height: '40px', flexShrink: 0 }}
              disabled={loading || !input.trim()}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
