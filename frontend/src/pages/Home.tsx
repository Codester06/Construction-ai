import { useNavigate } from 'react-router-dom';
import '../styles/home.css';
import { DocumentIcon, MessageIcon, HistoryIcon, ConstructionIcon } from '../components/Icons';

function Home() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <DocumentIcon />,
      title: 'New Report',
      description: 'Generate professional daily site reports with AI in seconds.',
      path: '/new-report',
      accent: '#F97316',
    },
    {
      icon: <MessageIcon />,
      title: 'Chat with AI',
      description: 'Ask anything about construction, safety, or best practices.',
      path: '/chat',
      accent: '#0EA5E9',
    },
    {
      icon: <HistoryIcon />,
      title: 'History',
      description: 'Browse and download all your previously generated reports.',
      path: '/history',
      accent: '#8B5CF6',
    },
  ];

  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="hero-badge">
          <ConstructionIcon />
          <span>AI-Powered</span>
        </div>
        <h1 className="hero-title">Welcome to ConstructionGen</h1>
        <p className="hero-subtitle">
          Your intelligent construction documentation assistant. Generate reports, get AI answers, and track your projects — all in one place.
        </p>
        <div className="hero-cta">
          <button className="btn-primary-cta" onClick={() => navigate('/new-report')}>
            Generate a Report
          </button>
          <button className="btn-secondary-cta" onClick={() => navigate('/chat')}>
            Chat with AI
          </button>
        </div>
      </div>

      <div className="features-grid">
        {features.map((f, i) => (
          <div
            key={i}
            className="feature-card"
            style={{ '--accent': f.accent } as React.CSSProperties}
            onClick={() => navigate(f.path)}
          >
            <div className="feature-icon">{f.icon}</div>
            <h3 className="feature-title">{f.title}</h3>
            <p className="feature-description">{f.description}</p>
            <span className="feature-arrow">→</span>
          </div>
        ))}
      </div>

      <p className="home-tagline">Built for construction professionals who value speed and accuracy.</p>
    </div>
  );
}

export default Home;
