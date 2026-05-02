
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
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-bg-surface/50 backdrop-blur-md flex-shrink-0 z-40 sticky top-0">
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar} className="p-2 text-text-secondary md:hidden hover:text-white transition-colors rounded-lg hover:bg-white/5" aria-label="Open menu">
          <MenuIcon className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <img
            src="/logo-transparent.svg"
            alt="AfriTranslate AI"
            className="h-7 w-auto select-none"
            draggable={false}
          />
          <div className="flex items-center gap-1.5 pl-3 border-l border-white/5 self-stretch">
            <div className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-yellow-500 animate-pulse' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'}`}></div>
            <span className="text-[9px] text-text-secondary font-medium tracking-widest uppercase">
                {isOffline ? 'Offline' : 'System Active'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {currentUser && (
            <div className="flex items-center gap-3 pl-4 border-l border-white/5 h-8">
                {(currentUser.plan !== 'Entreprise') && (
                    <button 
                        onClick={onUpgradeClick}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold rounded-full hover:bg-accent hover:text-black transition-all shadow-sm mr-2"
                    >
                        <BoltIcon className="w-3 h-3" />
                        <span>{currentUser.plan === 'Free' ? 'GO PRO' : 'UPGRADE'}</span>
                    </button>
                )}
                <button 
                    onClick={onProfileClick}
                    className="flex items-center gap-2 group cursor-pointer hover:opacity-80 transition-opacity"
                >
                     <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-yellow-600 flex items-center justify-center font-bold text-black text-[12px] shadow-md border-2 border-transparent group-hover:border-white/10 transition-all">
                        {(currentUser.name?.charAt(0) || currentUser.email?.charAt(0) || 'U').toUpperCase()}
                    </div>
                    <div className="hidden sm:block text-left">
                        <p className="text-[12px] font-bold text-white leading-none">{currentUser.name || currentUser.email || 'User'}</p>
                    </div>
                </button>
                <button 
                    onClick={onLogout} 
                    className="p-2 text-text-secondary hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all" 
                    title="Sign Out"
                >
                    <LogoutIcon className="w-4 h-4" />
                </button>
            </div>
        )}
      </div>
    </header>
  );
};

export default Header;
