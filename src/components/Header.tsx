
import React from 'react';
import type { User } from '../types';
import { MenuIcon, LogoutIcon, BoltIcon } from './Icons';
import LanguageSelector from './LanguageSelector';

interface HeaderProps {
  sourceLang?: string;
  targetLang?: string;
  onSourceLangChange?: (code: string) => void;
  onTargetLangChange?: (code: string) => void;
  isChatActive: boolean;
  currentUser: User | null;
  onUpgradeClick: () => void;
  onProfileClick: () => void;
  tone?: string;
  onToggleSidebar: () => void;
  isOffline: boolean;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({
  sourceLang,
  targetLang,
  onSourceLangChange,
  onTargetLangChange,
  isChatActive,
  currentUser,
  onUpgradeClick,
  onProfileClick,
  tone,
  onToggleSidebar,
  isOffline,
  onLogout
}) => {
  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-white/5 bg-bg-surface/50 backdrop-blur-md flex-shrink-0 z-40 sticky top-0">
      {/* Left: logo + status pill (status pill hidden on the smallest screens to leave room) */}
      <div className="flex items-center gap-3 min-w-0">
        <img
          src="/logo-transparent.svg"
          alt="AfriTranslate AI"
          className="h-7 w-auto select-none flex-shrink-0"
          draggable={false}
        />
        <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-white/5 self-stretch">
          <div className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-neutral-400 animate-pulse' : 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.35)]'}`}></div>
          <span className="text-[9px] text-text-secondary font-medium tracking-widest uppercase">
              {isOffline ? 'Offline' : 'System Active'}
          </span>
        </div>
      </div>

      {/* Right: desktop user actions OR mobile hamburger. */}
      <div className="flex items-center gap-2 sm:gap-4">
        {currentUser && (
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-white/5 h-8">
                {(currentUser.plan !== 'Entreprise') && (
                    <button
                        onClick={onUpgradeClick}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/20 text-white text-[10px] font-bold rounded-full hover:bg-white hover:text-black transition-all shadow-sm mr-2"
                    >
                        <BoltIcon className="w-3 h-3" />
                        <span>{currentUser.plan === 'Free' ? 'GO PRO' : 'UPGRADE'}</span>
                    </button>
                )}
                <button
                    onClick={onProfileClick}
                    className="flex items-center gap-2 group cursor-pointer hover:opacity-80 transition-opacity"
                >
                     <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-white to-neutral-500 flex items-center justify-center font-bold text-black text-[12px] shadow-md border-2 border-transparent group-hover:border-white/10 transition-all">
                        {(currentUser.name?.charAt(0) || currentUser.email?.charAt(0) || 'U').toUpperCase()}
                    </div>
                    <div className="text-left">
                        <p className="text-[12px] font-bold text-white leading-none">{currentUser.name || currentUser.email || 'User'}</p>
                    </div>
                </button>
                <button
                    onClick={onLogout}
                    className="p-2 text-text-secondary hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    title="Sign Out"
                >
                    <LogoutIcon className="w-4 h-4" />
                </button>
            </div>
        )}
        {/* Mobile: hamburger opens the full-screen drawer carrying every nav
            item + profile + logout. Desktop already shows the sidebar so the
            hamburger is `md:hidden`. */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden touch-target p-2 text-text-secondary hover:text-white transition-colors rounded-lg hover:bg-white/5"
          aria-label="Open menu"
        >
          <MenuIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
