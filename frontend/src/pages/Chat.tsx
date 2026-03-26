import { useState, useRef, useEffect } from 'react';
import '../styles/chat.css';
import { SendIcon, MessageIcon, BotIcon, UserCircleIcon } from '../components/Icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const INITIAL_MESSAGE: Message = {
  id: 1,
  text: "Hello! I'm your construction AI assistant. Ask me anything about construction, safety, materials, or best practices!",
  sender: 'ai',
  timestamp: new Date(),
};

function Chat() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('chatMessages');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) }));
    }
    return [INITIAL_MESSAGE];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  const handleClearChat = () => {
    const fresh = [{ ...INITIAL_MESSAGE, id: Date.now(), timestamp: new Date() }];
    setMessages(fresh);
    localStorage.setItem('chatMessages', JSON.stringify(fresh));
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      // Build history: skip the initial greeting (always index 0), send the rest up to current
      const history = messages
        .slice(1)
        .map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));

      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputMessage, history }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: data.response,
          sender: 'ai',
          timestamp: new Date(),
        }]);
      } else {
        throw new Error('Failed');
      }
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error. Please make sure the backend is running.',
        sender: 'ai',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const allQuestions = [
    "What are the key safety requirements for scaffolding?",
    "How do I inspect concrete quality?",
    "What's the proper way to cure concrete?",
    "Tell me about foundation inspection best practices",
    "What PPE is required on a construction site?",
    "How do I write a daily site report?",
    "What are common causes of construction delays?",
    "How do I check if rebar placement is correct?",
    "What is the standard curing time for concrete slabs?",
    "How do I conduct a site safety audit?",
    "What documents are needed before breaking ground?",
    "How do I handle a near-miss incident on site?",
    "What are the load-bearing requirements for scaffolding?",
    "How do I inspect welding quality on steel structures?",
    "What is the proper mix ratio for structural concrete?",
    "How do I manage subcontractors on a large project?",
    "What are OSHA requirements for fall protection?",
    "How do I calculate material quantities for a pour?",
    "What should a quality control checklist include?",
    "How do I document weather delays professionally?",
  ];

  const [suggestedQuestions] = useState<string[]>(() => {
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  });

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div className="page-header">
          <div className="page-header-icon">
            <MessageIcon />
          </div>
          <div className="page-header-text">
            <h1>Chat with AI</h1>
            <p className="page-header-subtitle">Ask anything about construction, safety & materials</p>
          </div>
          <span className="page-header-brand">Construction Report Generator</span>
        </div>
        <div className="chat-header-actions">
          <button className="btn btn-outline btn-sm clear-chat-btn" onClick={handleClearChat}>
            Clear Chat
          </button>
        </div>
      </div>

      <div className="chat-container">
        <div className="messages-container">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.sender === 'user' ? 'message-user' : 'message-ai'}`}>
              <div className="message-avatar">
                {message.sender === 'user' ? <UserCircleIcon /> : <BotIcon />}
              </div>
              <div className="message-content">
                {message.sender === 'ai' ? (
                  <div className="message-text message-markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="message-text">{message.text}</div>
                )}
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="message message-ai">
              <div className="message-avatar"><BotIcon /></div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="suggested-questions">
            <p>Try asking:</p>
            <div className="suggestions-grid">
              {suggestedQuestions.map((q, i) => (
                <button key={i} className="suggestion-btn" onClick={() => setInputMessage(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="chat-input-container">
          <textarea
            className="chat-input"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about construction, safety, materials..."
            rows={1}
            disabled={loading}
          />
          <button
            className="btn btn-primary send-btn"
            onClick={handleSend}
            disabled={loading || !inputMessage.trim()}
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
