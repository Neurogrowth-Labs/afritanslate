import React, { useState, useMemo, Fragment } from 'react';
import type { Conversation, User, TranslationMode, View } from '../types';
import { ADD_ONS, FOOTER_LINKS } from '../constants';
import { 
    SearchIcon, LibraryIcon, PriceTagIcon, ScriptIcon, BookIcon, 
    MeetingIcon, LiveIcon, ImageIcon, LockIcon, OfflineIcon, 
    CheckIcon, DownloadIcon, EmailIcon, MicrophoneIcon, TranslateIcon,
    CloseIcon, UserIcon 
} from './Icons';


const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);

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
        onClick={disabled ? undefined : onClick}
        className={`flex items-center gap-3 w-full px-3 py-2 md:py-1.5 rounded text-[13px] font-medium transition-all group ${
            isActive 
            ? 'bg-accent/10 text-accent border border-accent/20' 
            : 'text-text-secondary hover:bg-white/5 hover:text-text-primary border border-transparent'
        } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    >
        <div className={`transition-colors ${isActive ? 'text-accent' : 'text-text-secondary group-hover:text-text-primary'}`}>{icon}</div>
        <span className="flex-1 text-left truncate">{label}</span>
        {isLocked && <LockIcon className="w-3.5 h-3.5 opacity-40" />}
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
        if (!searchTerm) return conversations;
        return conversations.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [conversations, searchTerm]);

    const hasPremiumAccess = ['Premium', 'Training', 'Entreprise'].includes(currentUser?.plan || '') || currentUser?.role === 'admin';

    return (
        <aside className={`fixed md:relative inset-y-0 left-0 z-50 w-64 bg-bg-surface border-r border-border-default flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 h-screen overflow-hidden`}>
            {/* Header: Brand & New Chat */}
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#121212" strokeWidth="2.5" className="w-5 h-5"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 18 15.3 15.3 0 0 1-8 0 15.3 15.3 0 0 1 4-18z"></path></svg>
                        </div>
                        <span className="font-brand font-bold text-lg text-white tracking-tight">Studio AI</span>
                    </div>
                    {/* Explicit Close Button for Mobile */}
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
                    className="w-full h-10 md:h-9 bg-accent text-bg-main font-bold rounded flex items-center justify-center gap-2 hover:bg-accent/90 transition-all shadow-sm"
                >
                    <PlusIcon />
                    <span>New Project</span>
                </button>

                <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
                    <input 
                        type="text"
                        placeholder="Quick search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-9 md:h-8 pl-8 pr-3 bg-bg-main border border-border-default rounded text-[11px] text-text-primary focus:ring-1 focus:ring-accent outline-none placeholder:text-text-secondary/50"
                    />
                </div>
            </div>

            {/* Main Navigation Sections */}
            <div className="flex-1 overflow-y-auto px-2 space-y-6 custom-scrollbar pb-6">
                <div>
                    <h4 className="px-3 mb-2 text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em]">Assistant</h4>
                    <div className="space-y-0.5">
                        <NavButton label="Translation Studio" icon={<TranslateIcon className="w-4 h-4"/>} isActive={currentView === 'chat' && currentMode === 'chat'} onClick={() => { onSetView('chat'); onSetMode('chat'); setIsOpen(false); }} />
                        <NavButton label="Live Conversation" icon={<LiveIcon className="w-4 h-4" />} isActive={currentView === 'live'} onClick={() => { onSetView('live'); setIsOpen(false); }} disabled={isOffline} />
                        <NavButton label="Audio Transcriber" icon={<MicrophoneIcon className="w-4 h-4" />} isActive={currentMode === 'transcriber'} onClick={() => { onSetMode('transcriber'); setIsOpen(false); }} disabled={isOffline} />
                    </div>
                </div>

                <div>
                    <h4 className="px-3 mb-2 text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em]">Creative Suite</h4>
                    <div className="space-y-0.5">
                        <NavButton label="Motion Generator" icon={<PlayIcon />} isActive={currentView === 'motion'} onClick={hasPremiumAccess ? () => { onSetView('motion'); setIsOpen(false); } : onUpgrade} isLocked={!hasPremiumAccess} disabled={isOffline} />
                        <NavButton label="Visual Arts" icon={<ImageIcon className="w-4 h-4" />} isActive={currentView === 'image'} onClick={hasPremiumAccess ? () => { onSetView('image'); setIsOpen(false); } : onUpgrade} isLocked={!hasPremiumAccess} disabled={isOffline} />
                    </div>
                </div>

                <div>
                    <h4 className="px-3 mb-2 text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em]">Advanced Translators</h4>
                    <div className="space-y-0.5">
                        <NavButton label="Script Translator" icon={<ScriptIcon className="w-4 h-4" />} isActive={currentMode === 'script'} onClick={hasPremiumAccess ? () => { onSetMode('script'); setIsOpen(false); } : onUpgrade} isLocked={!hasPremiumAccess} disabled={isOffline} />
                        <NavButton label="Literary Translator" icon={<BookIcon className="w-4 h-4" />} isActive={currentMode === 'book'} onClick={hasPremiumAccess ? () => { onSetMode('book'); setIsOpen(false); } : onUpgrade} isLocked={!hasPremiumAccess} disabled={isOffline} />
                        <NavButton label="Meeting Insights" icon={<MeetingIcon className="w-4 h-4" />} isActive={currentMode === 'meetings'} onClick={hasPremiumAccess ? () => { onSetMode('meetings'); setIsOpen(false); } : onUpgrade} isLocked={!hasPremiumAccess} disabled={isOffline} />
                    </div>
                </div>

                {filteredConversations.length > 0 && (
                    <div>
                        <h4 className="px-3 mb-2 text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em]">Recent Sessions</h4>
                        <div className="space-y-0.5">
                            {filteredConversations.map(convo => (
                                <div key={convo.id} className="group relative px-2">
                                    <button
                                        onClick={() => { onSelectConversation(convo.id); setIsOpen(false); }}
                                        className={`w-full text-left px-2 py-2 md:py-1.5 rounded text-xs truncate transition-all ${
                                            currentConversationId === convo.id ? 'bg-white/10 text-white font-semibold' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                                        }`}
                                    >
                                        {convo.title}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteConversation(convo.id); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Meta Sections */}
            <div className="p-2 border-t border-border-default space-y-1 bg-bg-surface">
                <NavButton label="My Profile" icon={<UserIcon className="w-4 h-4" />} isActive={currentView === 'profile'} onClick={() => { onSetView('profile'); setIsOpen(false); }} />
                <NavButton label="Resource Library" icon={<LibraryIcon className="w-4 h-4" />} isActive={currentView === 'library'} onClick={() => { onShowLibrary(); setIsOpen(false); }} />
                <NavButton label="Account & Billing" icon={<PriceTagIcon className="w-4 h-4" />} isActive={currentView === 'pricing'} onClick={() => { onShowPricing(); setIsOpen(false); }} />
                
                <div className="mt-4 px-3 py-2 bg-bg-main rounded border border-border-default flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-text-secondary font-bold uppercase">Plan Status</span>
                        <span className="text-xs font-bold text-accent">{currentUser?.plan || 'Free Member'}</span>
                    </div>
                    {currentUser?.plan === 'Free' && (
                        <button onClick={() => { onUpgrade(); setIsOpen(false); }} className="p-1 px-2 text-[10px] font-bold bg-white text-bg-main rounded hover:bg-white/90 transition-colors">UPGRADE</button>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;