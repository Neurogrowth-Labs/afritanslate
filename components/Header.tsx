
import React from 'react';
import type { User } from '../types';
import { MenuIcon, LogoutIcon, BoltIcon } from './Icons';

interface HeaderProps {
  sourceLangName?: string;
  targetLangName?: string;
  isChatActive: boolean;
  currentUser: User | null;
  onUpgradeClick: () => void;
  onProfileClick: () => void;
  tone?: string;
  onToggleSidebar: () => void;
  isOffline: boolean;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ sourceLangName, targetLangName, isChatActive, currentUser, onUpgradeClick, onProfileClick, tone, onToggleSidebar, isOffline, onLogout }) => {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-bg-surface/50 backdrop-blur-md flex-shrink-0 z-40 sticky top-0">
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar} className="p-2 text-text-secondary md:hidden hover:text-white transition-colors rounded-lg hover:bg-white/5" aria-label="Open menu">
          <MenuIcon className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h1 className="text-[14px] font-bold text-white leading-tight font-brand tracking-wide">AfriTranslate AI</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-yellow-500 animate-pulse' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'}`}></div>
                <span className="text-[9px] text-text-secondary font-medium tracking-widest uppercase">
                    {isOffline ? 'Offline' : 'System Active'}
                </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Breadcrumb-like status for chat */}
        {isChatActive && sourceLangName && targetLangName && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-black/20 border border-white/5 rounded-full text-[11px] font-medium text-text-secondary shadow-inner">
                <span className="text-white/80">{sourceLangName}</span>
                <svg className="w-3 h-3 text-text-secondary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                <span className="text-white/80">{targetLangName}</span>
                <span className="mx-2 h-3 w-px bg-white/10"></span>
                <span className="text-accent">{tone}</span>
            </div>
        )}

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
                        {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden sm:block text-left">
                        <p className="text-[12px] font-bold text-white leading-none">{currentUser.name}</p>
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
