import { NavLink } from 'react-router-dom';
import '../styles/sidebar.css';
import { ConstructionIcon, DocumentIcon, HistoryIcon, MessageIcon } from './Icons';

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <ConstructionIcon />
        <span className="sidebar-title">ConstructionGen</span>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/" className="sidebar-link" end>
          <ConstructionIcon />
          <span>Home</span>
        </NavLink>
        <NavLink to="/new-report" className="sidebar-link">
          <DocumentIcon />
          <span>New Report</span>
        </NavLink>
        <NavLink to="/chat" className="sidebar-link">
          <MessageIcon />
          <span>Chat with AI</span>
        </NavLink>
        <NavLink to="/history" className="sidebar-link">
          <HistoryIcon />
          <span>History</span>
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;
