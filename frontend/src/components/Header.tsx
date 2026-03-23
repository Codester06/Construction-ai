import '../styles/header.css';
import { ConstructionIcon, UserIcon, SettingsIcon } from './Icons';

function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <ConstructionIcon />
        <h1 className="header-title">ConstructionGen</h1>
      </div>
      <div className="header-right">
        <button className="header-btn" title="Profile">
          <UserIcon />
        </button>
        <button className="header-btn" title="Settings">
          <SettingsIcon />
        </button>
      </div>
    </header>
  );
}

export default Header;
