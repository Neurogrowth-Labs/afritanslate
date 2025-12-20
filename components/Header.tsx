
import React, { useState, useRef, useEffect } from 'react';
import type { User } from '../types';
import { InfoIcon, MenuIcon, WifiOffIcon } from './Icons';

interface HeaderProps {
  sourceLangName?: string;
  targetLangName?: string;
  isChatActive: boolean;
  currentUser: User | null;
  onUpgradeClick: () => void;
  tone?: string;
  onToggleSidebar: () => void;
  isOffline: boolean;
  onLogout: () => void;
}

const LogoIcon = () => (
    <div className="w-9 h-9 rounded-full bg-bg-surface flex-shrink-0 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-accent">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 18 15.3 15.3 0 0 1-8 0 15.3 15.3 0 0 1 4-18z"></path>
        </svg>
    </div>
)

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
);

const Header: React.FC<HeaderProps> = ({ sourceLangName, targetLangName, isChatActive, currentUser, onUpgradeClick, tone, onToggleSidebar, isOffline, onLogout }) => {
  const [isContextDropdownOpen, setIsContextDropdownOpen] = useState(false);
  const contextDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextDropdownRef.current && !contextDropdownRef.current.contains(event.target as Node)) {
        setIsContextDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="flex items-center justify-between p-3 border-b border-border-default bg-bg-main flex-shrink-0 z-30">
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="p-1 text-text-secondary md:hidden hover:text-text-primary transition-colors" aria-label="Open menu">
          <MenuIcon className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          <LogoIcon />
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-text-primary">AfriTranslate AI</h1>
            {isChatActive && sourceLangName && targetLangName ? (
               <p className="text-xs text-text-secondary hidden sm:block">{sourceLangName} → {targetLangName}</p>
            ) : (
              <p className="text-xs text-text-secondary hidden sm:block">Translate it like a local.</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {isOffline && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-900/50 border border-yellow-700 rounded-md text-sm text-yellow-300" title="You are offline. Some features are limited.">
                <WifiOffIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Offline Mode</span>
            </div>
        )}
        
        {isChatActive && tone && (
            <div className="relative" ref={contextDropdownRef}>
                <button 
                    onClick={() => setIsContextDropdownOpen(!isContextDropdownOpen)}
                    className="flex items-center gap-2 p-2 bg-bg-surface hover:bg-border-default border border-border-default rounded-md text-sm text-text-secondary hover:text-text-primary transition-colors"
                    aria-label="View conversation context"
                    title="Conversation Context"
                >
                    <InfoIcon className="w-5 h-5" />
                </button>
                {isContextDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-bg-surface border border-border-default rounded-lg shadow-xl z-50 animate-fade-in p-4">
                        <h4 className="font-semibold text-white mb-3 text-base border-b border-border-default pb-2">Current Context</h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-text-secondary">Source:</span>
                                <span className="font-medium text-text-primary bg-bg-main px-2 py-1 rounded border border-border-default/50">{sourceLangName}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-text-secondary">Target:</span>
                                <span className="font-medium text-text-primary bg-bg-main px-2 py-1 rounded border border-border-default/50">{targetLangName}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-text-secondary">Tone:</span>
                                <span className="font-medium text-text-primary bg-bg-main px-2 py-1 rounded border border-border-default/50">{tone}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {currentUser?.plan !== 'Entreprise' && (
          <button 
            onClick={onUpgradeClick}
            className="hidden sm:block px-4 py-2 bg-accent text-white font-semibold rounded-md text-sm hover:bg-accent/90 transition-colors shadow-sm"
          >
            Upgrade
          </button>
        )}

        {currentUser && (
            <div className="flex items-center gap-3 pl-3 ml-1 border-l border-border-default">
                <div className="flex items-center gap-3" title={`Logged in as ${currentUser.name}`}>
                     <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-brand-secondary flex items-center justify-center font-bold text-white text-sm flex-shrink-0 select-none cursor-default shadow-md border border-white/10">
                        {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden lg:block">
                        <p className="text-sm font-medium text-text-primary leading-tight">{currentUser.name}</p>
                        <p className="text-xs text-text-secondary leading-tight">{currentUser.plan} Plan</p>
                    </div>
                </div>
                <button 
                    onClick={onLogout} 
                    className="p-2 text-text-secondary hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all duration-200" 
                    title="Log Out"
                >
                    <LogoutIcon />
                </button>
            </div>
        )}
      </div>
    </header>
  );
};

export default Header;
