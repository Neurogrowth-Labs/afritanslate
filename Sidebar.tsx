
import React, { useState, useMemo, Fragment } from 'react';
import type { Conversation, User, TranslationMode, View } from '../types';
import { ADD_ONS, FOOTER_LINKS } from '../constants';
import { SearchIcon, LibraryIcon, PriceTagIcon, ScriptIcon, BookIcon, MeetingIcon, LiveIcon, ImageIcon, LockIcon, OfflineIcon, CheckIcon, DownloadIcon, EmailIcon, MicrophoneIcon } from './Icons';


const PlusIcon = () => ( // Adinkra "Nkonsonkonson" (unity and human relations)
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 transition-transform group-open:rotate-180">
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653Z" />
    </svg>
);

interface SidebarProps {
    conversations: Conversation[];
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

interface NavButtonProps {
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
    disabled?: boolean;
    isLocked?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ label, icon, isActive, onClick, disabled = false, isLocked = false }) => {
    const baseClasses = 'relative flex items-center justify-start gap-3 w-full p-2.5 rounded-md text-sm font-medium transition-colors group';
    const activeClasses = 'bg-accent/20 text-text-primary';
    const inactiveClasses = disabled 
        ? 'text-text-secondary/50 cursor-not-allowed'
        : 'text-text-secondary hover:bg-border-default/50 hover:text-white';
    
    const effectiveOnClick = disabled ? () => {} : onClick;

    return (
        <button
            onClick={effectiveOnClick}
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
            disabled={disabled}
            title={isLocked ? 'Upgrade to access this feature' : (disabled ? 'This feature is unavailable offline' : '')}
        >
            {isActive && <span className="absolute left-0 top-2 bottom-2 w-1 bg-accent rounded-r-full"></span>}
            <div className={`transition-colors ${isActive ? 'text-accent' : (disabled ? 'text-text-secondary/50' : 'group-hover:text-white')}`}>{icon}</div>
            {label}
            {isLocked && !disabled && <LockIcon className="w-4 h-4 ml-auto text-text-secondary/70" />}
        </button>
    );
};

const OFFLINE_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'sw', name: 'Swahili' },
    { code: 'yo', name: 'Yoruba' },
];

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
        if (!searchTerm) {
            return conversations;
        }
        return conversations.filter(c => 
            c.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [conversations, searchTerm]);

    const hasPremiumAccess = ['Premium', 'Training', 'Entreprise'].includes(currentUser?.plan || '') || currentUser?.role === 'admin';

    const isChatViewActive = currentView === 'chat';
    const isLibraryViewActive = currentView === 'library';
    const isPricingViewActive = currentView === 'pricing' || currentView === 'payment';
    const isLiveViewActive = currentView === 'live';
    const isImageViewActive = currentView === 'image';
    const isMotionViewActive = currentView === 'motion';
    
    const showChatHistory = currentView === 'chat' && currentMode === 'chat';

    return (
        <Fragment>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-30 md:hidden"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                ></div>
            )}

            <aside className={`fixed md:relative inset-y-0 left-0 z-40 bg-bg-surface flex flex-col text-text-primary h-screen flex-shrink-0 border-r border-border-default transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-64`}>
                {/* Top Fixed Section */}
                <div className="p-2 pb-0 flex flex-col gap-2 flex-shrink-0">
                    <NavButton label="New Assistant Chat" icon={<PlusIcon />} isActive={isChatViewActive} onClick={onNewChat} />
                    
                    {showChatHistory && (
                        <div className="relative mb-2">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <SearchIcon className="w-4 h-4 text-text-secondary" />
                            </div>
                            <input 
                                type="text"
                                placeholder="Search chats..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-2 pl-9 bg-bg-main border border-border-default rounded-md text-sm focus:ring-2 focus:ring-accent focus:border-accent transition placeholder-text-secondary"
                            />
                        </div>
                    )}
                </div>
                
                {/* Scrollable Content Section */}
                <div className="flex-1 overflow-y-auto p-2 pt-2 space-y-4 custom-scrollbar">
                    {/* Navigation Menu */}
                    <div className="flex flex-col gap-1">
                        <div className="h-px bg-border-default my-1 mb-2"></div>
                        <h3 className="px-2.5 mb-1 text-xs font-semibold tracking-wider text-text-secondary uppercase">AI Tools</h3>
                        <NavButton label="Live Conversation" icon={<LiveIcon className="w-5 h-5" />} isActive={isLiveViewActive} onClick={() => onSetView('live')} disabled={isOffline} />
                        <NavButton label="Image Generation" icon={<ImageIcon className="w-5 h-5" />} isActive={isImageViewActive} onClick={hasPremiumAccess ? () => onSetView('image') : onUpgrade} isLocked={!hasPremiumAccess} disabled={isOffline} />
                        <NavButton label="Motion Generator" icon={<PlayIcon />} isActive={isMotionViewActive} onClick={hasPremiumAccess ? () => onSetView('motion') : onUpgrade} isLocked={!hasPremiumAccess} disabled={isOffline} />
                        <NavButton label="Audio Transcriber" icon={<MicrophoneIcon className="w-5 h-5" />} isActive={currentMode === 'transcriber'} onClick={() => onSetMode('transcriber')} disabled={isOffline} />

                        <div className="h-px bg-border-default my-2"></div>
                        <h3 className="px-2.5 mb-1 text-xs font-semibold tracking-wider text-text-secondary uppercase">Translation Tools</h3>
                        <NavButton label="Email Translator" icon={<EmailIcon className="w-5 h-5" />} isActive={currentMode === 'email'} onClick={hasPremiumAccess ? () => onSetMode('email') : onUpgrade} isLocked={!hasPremiumAccess} disabled={isOffline} />
                        <NavButton label="Script Translator" icon={<ScriptIcon className="w-5 h-5" />} isActive={currentMode === 'script'} onClick={hasPremiumAccess ? () => onSetMode('script') : onUpgrade} isLocked={!hasPremiumAccess} disabled={isOffline} />
                        <NavButton label="Book Translator" icon={<BookIcon className="w-5 h-5" />} isActive={currentMode === 'book'} onClick={hasPremiumAccess ? () => onSetMode('book') : onUpgrade} isLocked={!hasPremiumAccess} disabled={isOffline} />
                        <NavButton label="Meeting Summarizer" icon={<MeetingIcon className="w-5 h-5" />} isActive={currentMode === 'meetings'} onClick={hasPremiumAccess ? () => onSetMode('meetings') : onUpgrade} isLocked={!hasPremiumAccess} disabled={isOffline} />
                        
                        <div className="h-px bg-border-default my-2"></div>
                        <NavButton label="Library" icon={<LibraryIcon className="w-5 h-5" />} isActive={isLibraryViewActive} onClick={onShowLibrary} />
                        <NavButton label="Pricing" icon={<PriceTagIcon className="w-5 h-5" />} isActive={isPricingViewActive} onClick={onShowPricing} />
                        
                        <details className="group px-2.5" open={isOffline}>
                            <summary className="flex items-center justify-between py-2 rounded-md text-sm font-medium transition-colors cursor-pointer text-text-secondary hover:text-white list-none">
                                <div className="flex items-center gap-3">
                                    <OfflineIcon className="w-5 h-5" />
                                    <span>Offline Packs</span>
                                </div>
                                <ChevronDownIcon />
                            </summary>
                            <div className="pl-4 pr-1 pt-2 pb-1 space-y-2 border-l border-border-default ml-2.5">
                                {OFFLINE_LANGUAGES.map(lang => {
                                    const isDownloaded = offlinePacks.includes(lang.code);
                                    return (
                                        <div key={lang.code} className="flex items-center justify-between">
                                            <span className="text-sm text-text-primary">{lang.name}</span>
                                            {isDownloaded ? (
                                                <div className="flex items-center gap-1.5 text-xs text-green-400 font-semibold">
                                                    <CheckIcon className="w-4 h-4" />
                                                    <span>Downloaded</span>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => onToggleOfflinePack(lang.code)}
                                                    className="flex items-center gap-1.5 px-2 py-1 bg-border-default text-xs text-text-primary rounded-md hover:bg-accent hover:text-white transition-colors"
                                                >
                                                    <DownloadIcon className="w-4 h-4" />
                                                    <span>Download</span>
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                                <p className="text-xs text-text-secondary pt-2 !mt-4">Downloaded packs allow for basic translations when you're offline.</p>
                            </div>
                        </details>
                    </div>

                    {/* Chat History List */}
                    {showChatHistory && (
                        <div className="pt-4 border-t border-border-default">
                            <h3 className="px-2 mb-2 text-xs font-semibold tracking-wider text-text-secondary uppercase">Recents</h3>
                            <nav className="flex flex-col gap-1 mb-4">
                                {filteredConversations.map(convo => (
                                    <div key={convo.id} className="group relative">
                                        <button
                                            onClick={() => onSelectConversation(convo.id)}
                                            className={`w-full text-left p-2 rounded-md text-sm truncate ${
                                                currentConversationId === convo.id ? 'bg-border-default font-semibold' : 'hover:bg-border-default/50'
                                            } transition-colors`}
                                        >
                                            {convo.title}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteConversation(convo.id);
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Delete chat"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                ))}
                                {filteredConversations.length === 0 && <p className="px-2 text-xs text-text-secondary italic">No chats found.</p>}
                            </nav>

                            <div className="pt-4 border-t border-border-default">
                                <h3 className="px-2 mb-2 text-xs font-semibold tracking-wider text-text-secondary uppercase">Add-ons</h3>
                                <div className="flex flex-col gap-1">
                                    {ADD_ONS.map(addon => (
                                        <button 
                                            key={addon.name} 
                                            onClick={() => onChooseAddon(addon.name)}
                                            className="group flex items-start gap-3 w-full p-2 rounded-md hover:bg-border-default/50 transition-colors text-left"
                                        >
                                            <div className="flex-shrink-0 mt-0.5">
                                                <addon.icon className="w-5 h-5 text-text-secondary group-hover:text-accent transition-colors" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-text-primary">{addon.name} <span className="text-xs font-normal text-text-secondary">{addon.price}</span></p>
                                                <p className="text-xs text-text-secondary">{addon.description}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </Fragment>
    );
};

export default Sidebar;
