import React, { useState, useMemo, Fragment } from 'react';
import type { Conversation, User, TranslationMode, View } from '../types';
import { ADD_ONS, FOOTER_LINKS } from '../../constants';
import {
    SearchIcon, LibraryIcon, PriceTagIcon, BookIcon,
    MeetingIcon, LockIcon,
    CloseIcon, UserIcon, TrashIcon, PlusIcon
} from './Icons';
import { getTrialStatus } from '../utils/trialUtils';


const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653Z" />
    </svg>
);

interface SidebarProps {
    conversations: (Omit<Conversation, 'messages'>)[];
    currentConversationId: number | null;
    currentView: View;
    currentMode: TranslationMode;
    onNewChat: () => void;
    onSelectConversation: (id: number) => void;
    onDeleteConversation: (id: number) => void;
    onShowLibrary: () => void;
    onShowPricing: () => void;
    onChooseAddon: (addonName: string) => void;
    onSetMode: (mode: TranslationMode) => void;
    onSetView: (view: View) => void;
    currentUser: User | null;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onUpgrade: () => void;
    isOffline: boolean;
    offlinePacks: string[];
    onToggleOfflinePack: (langCode: string) => void;
}

const NavButton: React.FC<{ label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void; isLocked?: boolean; disabled?: boolean }> = ({ label, icon, isActive, onClick, isLocked, disabled }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 w-full px-3 py-2 md:py-2 rounded-lg text-[13px] font-medium transition-all group relative ${
            isActive 
            ? 'bg-gradient-to-r from-accent/10 to-transparent text-white border-l-2 border-accent' 
            : 'text-text-secondary hover:bg-white/5 hover:text-text-primary border-l-2 border-transparent'
        } ${disabled ? 'opacity-30 cursor-not-allowed' : ''} ${isLocked ? 'opacity-70 hover:opacity-100' : ''}`}
    >
        <div className={`transition-colors ${isActive ? 'text-accent' : 'text-text-secondary group-hover:text-text-primary'}`}>{icon}</div>
        <span className="flex-1 text-left truncate">{label}</span>
        {isLocked && <LockIcon className="w-3.5 h-3.5 text-accent/70" />}
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({
    conversations,
    currentConversationId,
    currentView,
    currentMode,
    onNewChat,
    onSelectConversation,
    onDeleteConversation,
    onShowLibrary,
    onShowPricing,
    onChooseAddon,
    onSetMode,
    onSetView,
    currentUser,
    isOpen,
    setIsOpen,
    onUpgrade,
    isOffline,
    offlinePacks,
    onToggleOfflinePack
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredConversations = useMemo(() => {
        if (!conversations) return [];
        if (!searchTerm) return conversations;
        return conversations.filter(c => (c.title || 'Untitled').toLowerCase().includes(searchTerm.toLowerCase()));
    }, [conversations, searchTerm]);

    const planLevels: Record<string, number> = {
        'Free': 0, 'Basic': 1, 'Premium': 2, 'Training': 3, 'Entreprise': 4
    };
    const userPlan = currentUser?.plan || 'Free';
    const currentLevel = planLevels[userPlan] || 0;

    // Trial status computed from profile
    const trialStatus = currentUser ? getTrialStatus({ plan: currentUser.plan, trial_start_date: (currentUser as any).trial_start_date || null }) : null;
    const hasPremiumTrialAccess = trialStatus ? (trialStatus.isPremium || trialStatus.isOnTrial) : false;
    
    const hasAccess = (minLevel: number) => {
        if (hasPremiumTrialAccess) return true; // Trial or Premium grants access
        if (currentLevel >= 2) return true; // Paid Premium and above
        return currentLevel >= minLevel; // Otherwise, compare plan level
    };

    const FEATURE_LEVELS = { transcriber: 1, script: 1, book: 1, live: 2, motion: 2, image: 2, meetings: 2, email: 1, glossary: 2, creative: 2 };

    const handleFeatureClick = (action: () => void, requiredLevel: number) => {
        if (hasAccess(requiredLevel)) {
            action();
        } else {
            onUpgrade();
        }
        setIsOpen(false);
    };

    return (
        <aside className={`
            fixed md:relative inset-y-0 left-0 z-50 w-64 
            bg-bg-surface/80 backdrop-blur-xl border-r border-white/5
            flex flex-col transform transition-transform duration-300 ease-in-out 
            ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 h-screen overflow-hidden shadow-2xl md:shadow-none
        `}>
            {/* Header: Brand & New Chat */}
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <img
                        src="/logo-transparent.svg"
                        alt="AfriTranslate AI"
                        className="h-8 w-auto select-none"
                        draggable={false}
                    />
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="md:hidden p-1.5 text-text-secondary hover:text-white"
                        aria-label="Close sidebar"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                
                <button 
                    onClick={() => { onNewChat(); setIsOpen(false); }}
                    className="w-full h-10 md:h-10 bg-white/5 border border-white/10 text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-white/10 hover:border-white/20 transition-all shadow-sm group"
                >
                    <PlusIcon />
                    <span className="group-hover:text-accent transition-colors">New Project</span>
                </button>

                <div className="relative group">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary group-focus-within:text-accent transition-colors" />
                    <input 
                        type="text"
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-9 md:h-9 pl-8 pr-3 bg-black/20 border border-white/5 rounded-lg text-[11px] text-text-primary focus:ring-1 focus:ring-accent/50 focus:border-accent/50 outline-none placeholder:text-text-secondary/50 transition-all"
                    />
                </div>
            </div>

            {/*
              Pre-launch v1: AI features that route through the legacy
              `services/geminiService.ts` (Translation Studio, AI Assistant,
              Live Conversation, Audio Transcriber, Script Translator,
              Literary Translator, Email Localization) are temporarily hidden
              from the sidebar because they would call a now-removed client
              key. The corresponding components still exist and routes still
              mount on deep-link, but throw an explicit "moved server-side"
              error from `getApiKey()` rather than crashing silently.
              They will be re-enabled in v2 once each surface is moved
              behind a /api/* Vercel route, mirroring the pattern at
              api/creative/* and api/meeting-insights/*.
            */}
            <div className="flex-1 overflow-y-auto px-3 space-y-6 custom-scrollbar pb-6">
                <div>
                    <h4 className="px-3 mb-2 text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em] opacity-60">Creative</h4>
                    <div className="space-y-0.5">
                        <NavButton
                            label="Creative Studio"
                            icon={<PlayIcon />}
                            isActive={currentView === 'creative' || currentView === 'motion' || currentView === 'image'}
                            onClick={() => handleFeatureClick(() => { onSetView('creative'); setIsOpen(false); }, FEATURE_LEVELS.creative)}
                            isLocked={!hasAccess(FEATURE_LEVELS.creative)}
                            disabled={isOffline}
                        />
                    </div>
                </div>

                <div>
                    <h4 className="px-3 mb-2 text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em] opacity-60">Professional</h4>
                    <div className="space-y-0.5">
                        <NavButton label="Meeting Insights" icon={<MeetingIcon className="w-4 h-4" />} isActive={currentMode === 'meetings'} onClick={() => handleFeatureClick(() => onSetMode('meetings'), FEATURE_LEVELS.meetings)} isLocked={!hasAccess(FEATURE_LEVELS.meetings)} disabled={isOffline} />
                        <NavButton label="Glossary Vault" icon={<BookIcon className="w-4 h-4" />} isActive={currentView === 'glossary'} onClick={() => handleFeatureClick(() => onSetView('glossary'), FEATURE_LEVELS.glossary)} isLocked={!hasAccess(FEATURE_LEVELS.glossary)} disabled={isOffline} />
                    </div>
                </div>

                <div>
                    <h4 className="px-3 mb-2 text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em] opacity-60">History</h4>
                    {filteredConversations.length > 0 ? (
                        <div className="space-y-0.5">
                            {filteredConversations.map(convo => (
                                <div key={convo.id} className="group relative px-1">
                                    <button
                                        onClick={() => { onSelectConversation(convo.id); setIsOpen(false); }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs truncate transition-all ${
                                            String(currentConversationId) === String(convo.id) ? 'bg-white/10 text-white font-medium' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                                        }`}
                                    >
                                        {convo.title}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteConversation(convo.id); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <TrashIcon className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="px-3 text-[10px] text-text-secondary/50 italic">No history found</p>
                    )}
                </div>
            </div>

            {/* Bottom Meta Sections */}
            <div className="p-3 border-t border-white/5 bg-black/20 backdrop-blur-md">
                <NavButton label="My Profile" icon={<UserIcon className="w-4 h-4" />} isActive={currentView === 'profile'} onClick={() => { onSetView('profile'); setIsOpen(false); }} />
                <NavButton label="Library" icon={<LibraryIcon className="w-4 h-4" />} isActive={currentView === 'library'} onClick={() => { onShowLibrary(); setIsOpen(false); }} />
                <NavButton label="Plans" icon={<PriceTagIcon className="w-4 h-4" />} isActive={currentView === 'pricing'} onClick={() => { onShowPricing(); setIsOpen(false); }} />
                
                <div className="mt-3 px-3 py-2 bg-gradient-to-r from-white/5 to-transparent rounded-lg border border-white/5 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">Plan</span>
                        <span className="text-xs font-bold text-accent drop-shadow-sm">{currentUser?.plan || 'Free'}</span>
                    </div>
                    {currentUser?.plan !== 'Entreprise' && (
                        <button
                            onClick={onUpgrade}
                            className="text-[9px] font-bold text-bg-main bg-accent px-2.5 py-1 rounded shadow-lg shadow-accent/20 hover:bg-white hover:text-accent transition-all"
                        >
                            UPGRADE
                        </button>
                    )}
                </div>

                {/* Trial Banner */}
                {trialStatus && trialStatus.isOnTrial && (
                    <div className="mt-3 p-3 rounded-lg border border-yellow-600 bg-gradient-to-br from-yellow-900 to-yellow-800 text-yellow-300">
                        <div className="text-xs font-bold uppercase tracking-wider">⚡ Premium Trial</div>
                        <div className="text-lg font-black">{trialStatus.daysRemaining} days remaining</div>
                        <button onClick={onUpgrade} className="mt-2 px-3 py-1 text-[10px] font-bold border border-yellow-600 rounded text-yellow-300 hover:bg-yellow-700/20">Upgrade to keep Premium</button>
                    </div>
                )}
                {trialStatus && trialStatus.trialExpired && (
                    <div className="mt-3 p-3 rounded-lg border border-white/10 bg-gray-800 text-gray-400">
                        <div className="text-xs font-bold uppercase tracking-wider">🔒 Trial Ended</div>
                        <div className="text-sm">Upgrade to access Premium features</div>
                        <button onClick={onUpgrade} className="mt-2 px-3 py-1 text-[10px] font-bold bg-accent text-black rounded hover:bg-white hover:text-accent transition-colors">Upgrade Now</button>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
