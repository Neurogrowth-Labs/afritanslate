
import React, { useState, useRef, useEffect } from 'react';
import type { User } from '../types';
import { InfoIcon, MenuIcon, WifiOffIcon, LogoutIcon, BoltIcon } from './Icons';

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
    <header className="h-14 flex items-center justify-between px-4 border-b border-border-default bg-bg-surface flex-shrink-0 z-40">
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar} className="p-1.5 text-text-secondary md:hidden hover:text-text-primary transition-colors bg-bg-main border border-border-default rounded" aria-label="Open menu">
          <MenuIcon className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h1 className="text-[14px] font-bold text-white leading-tight font-brand">AfriTranslate AI</h1>
            <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                <span className="text-[10px] text-text-secondary font-medium tracking-wide uppercase">
                    {isOffline ? 'Offline Mode' : 'Cloud Neural System Active'}
                </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isChatActive && sourceLangName && targetLangName && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-bg-main border border-border-default rounded-full text-[11px] font-medium text-text-secondary">
                <span>{sourceLangName}</span>
                <svg className="w-3 h-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                <span className="text-white">{targetLangName}</span>
                <span className="mx-1 h-2 w-px bg-border-default"></span>
                <span className="text-accent">{tone}</span>
            </div>
        )}

        {currentUser && (
            <div className="flex items-center gap-3 pl-4 border-l border-border-default h-6">
                {(currentUser.plan !== 'Entreprise') && (
                    <button 
                        onClick={onUpgradeClick}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-accent text-bg-main text-[10px] font-bold rounded-full hover:bg-accent/90 transition-colors shadow-sm mr-2 animate-pulse-slow"
                    >
                        <BoltIcon className="w-3 h-3" />
                        <span>{currentUser.plan === 'Free' ? 'Upgrade' : 'Change Plan'}</span>
                    </button>
                )}
                <button 
                    onClick={onProfileClick}
                    className="flex items-center gap-2 group cursor-pointer hover:opacity-80 transition-opacity"
                >
                     <div className="w-7 h-7 rounded bg-gradient-to-tr from-accent to-brand-primary flex items-center justify-center font-bold text-bg-main text-[11px] shadow-sm">
                        {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden sm:block text-left">
                        <p className="text-[11px] font-bold text-white leading-none">{currentUser.name}</p>
                        <p className="text-[9px] text-text-secondary leading-none mt-0.5 tracking-wider uppercase">{currentUser.plan || 'Free'}</p>
                    </div>
                </button>
                <button 
                    onClick={onLogout} 
                    className="p-1.5 text-text-secondary hover:text-red-400 hover:bg-red-400/5 rounded transition-all" 
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
