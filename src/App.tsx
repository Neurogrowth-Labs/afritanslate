import React, { useState, useEffect, useRef } from 'react';
import { SignIn, useClerk, useUser } from '@clerk/clerk-react';
import { supabase } from '../supabaseClient';

// --- MAIN APPLICATION IMPORTS --- //
import type { User, View, TranslationMode, Conversation, LibraryItem, ChatMessage, UserRole } from './types';

// Import all components needed for the app
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import Library from './components/Library';
import Pricing from './components/Pricing';
import Payment from './components/Payment';
import PaymentSuccess from './components/PaymentSuccess';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import ContactForm from './components/ContactForm';
import ScriptTranslator from './components/ScriptTranslator';
import BookTranslator from './components/BookTranslator';
import MeetingSummarizer from './components/MeetingSummarizer';
import MeetingInsights from './components/MeetingInsights';
import UpgradeModal from './components/UpgradeModal';
import TranslationStudio from './components/TranslationStudio';
import GlossaryVault from './components/GlossaryVault';
import Chat from './components/Chat'; // Import Chat component
import AdminPortal from './components/AdminPortal';
import LiveConversation from './components/LiveConversation';
import AudioTranscriber from './components/AudioTranscriber';
import DemoSection from './components/DemoSection';
import AboutPage from './components/AboutPage';
import UseCasesPage from './components/UseCasesPage';
import TestimonialsPage from './components/TestimonialsPage';
import VideoGenerator from './components/VideoGenerator';
import CreativeStudio from './components/creative/CreativeStudio';
import ConfirmationModal from './components/ConfirmationModal';
import ProfileDashboard from './components/ProfileDashboard';
import OnboardingAgent from './components/OnboardingAgent';
import EmailTranslator from './components/EmailTranslator';
import { LogoIcon, SearchIcon, TranslateIcon, LiveIcon, MicrophoneIcon, GlobeIcon, BoltIcon, LockIcon, CheckIcon, DownloadIcon, ImageIcon } from './components/Icons';
import { getNuancedTranslation } from '../services/geminiService'; // Import service
import { generateOperationalManual } from '../services/pdfGenerator'; // Import PDF generator
import { getTrialStatus, TrialStatus } from './utils/trialUtils';

const PUBLIC_INFO_VIEWS: View[] = ['about', 'useCases', 'testimonials'];

const getPrimaryEmail = (user: ReturnType<typeof useUser>['user']) =>
    user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';

const getDisplayName = (user: ReturnType<typeof useUser>['user']) => {
    const email = getPrimaryEmail(user);
    return user?.fullName || user?.firstName || user?.username || email.split('@')[0] || 'AfriTranslate User';
};

const isLegacyProfileId = (profileId: string) => !profileId.startsWith('user_');

// NOTE: The standalone ImageGenerator placeholder and VideoGenerator route are
// now unified inside CreativeStudio (/studio/creative). VideoGenerator's AI
// pipeline is preserved for re-use during the AI integration phase.

const getInitialAppState = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const shouldShowAuth = searchParams.get('auth') === 'signin';

    return shouldShowAuth
        ? { show: true, initialView: 'chat' as View }
        : { show: false };
};

// --- TRANSLATOR APP --- //
const TranslatorApp: React.FC<{
    initialUser: User;
    onLogout: () => Promise<void>;
    onShowLanding: () => void;
    initialView?: View;
    wasSignup?: boolean;
}> = ({ initialUser, onLogout, onShowLanding, initialView = 'chat', wasSignup = false }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(initialUser);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
    
    const [conversations, setConversations] = useState<(Omit<Conversation, 'messages'>)[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
    
    const [currentView, setCurrentView] = useState<View>(initialView);
    const [currentMode, setCurrentMode] = useState<TranslationMode>('chat');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Chat Configuration State (for new chats or creating context)
    const [chatConfig, setChatConfig] = useState({ source: 'en', target: 'sw', tone: 'Friendly' });

    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [highlightedPlan, setHighlightedPlan] = useState<string | null>(null);
    const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingConversationId, setDeletingConversationId] = useState<number | null>(null);

    const [offlinePacks, setOfflinePacks] = useState<string[]>(() => {
        const savedPacks = localStorage.getItem('offlinePacks');
        return savedPacks ? JSON.parse(savedPacks) : [];
    });
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Honour the /studio/creative deep link on first paint so the unified
    // Creative Studio is reachable via a real URL.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (window.location.pathname.startsWith('/studio/creative')) {
            setCurrentView('creative');
        }
        const onPop = () => {
            if (window.location.pathname.startsWith('/studio/creative')) {
                setCurrentView('creative');
            }
        };
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, []);

    // Mirror the active view back to the URL so the path stays in sync when
    // users land on Creative Studio via the sidebar, and clear the stale path
    // when they navigate away so a refresh does not force them back in.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const onCreativePath = window.location.pathname.startsWith('/studio/creative');
        if (currentView === 'creative') {
            if (onCreativePath) return;
            const url = new URL(window.location.href);
            url.pathname = '/studio/creative';
            window.history.replaceState({}, '', url.toString());
        } else if (onCreativePath) {
            const url = new URL(window.location.href);
            url.pathname = '/';
            url.searchParams.delete('tab');
            window.history.replaceState({}, '', url.toString());
        }
    }, [currentView]);

    useEffect(() => {
        setCurrentUser(initialUser);
    }, [initialUser]);

    useEffect(() => {
        if (!currentUser) return;

        const syncCurrentUser = async () => {
            const status = getTrialStatus({ plan: currentUser.plan, trial_start_date: currentUser.trial_start_date || null });
            setTrialStatus(status);

            if (status.trialExpired && currentUser.plan === 'Premium') {
                await supabase
                    .from('profiles')
                    .update({ plan: 'Free' })
                    .eq('id', currentUser.id);
                setCurrentUser(prev => prev ? { ...prev, plan: 'Free' } as User : prev);
                setTrialStatus(getTrialStatus({ plan: 'Free', trial_start_date: currentUser.trial_start_date || null }));
            }

            if (wasSignup && !currentUser.onboarding_completed) {
                setCurrentView('onboarding');
            }
        };

        syncCurrentUser();
    }, [currentUser?.id, currentUser?.plan, currentUser?.trial_start_date, currentUser?.onboarding_completed, wasSignup]);

    const fetchLibraryItems = async () => {
        const { data } = await supabase.from('library_items').select('*').order('id', { ascending: false });
        setLibraryItems(data || []);
    };
    
    useEffect(() => {
        if (!currentUser) return;
        fetchLibraryItems();

        const fetchConversations = async () => {
            const { data } = await supabase.from('conversations').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
            setConversations(data || []);
        };
        fetchConversations();

        if (currentUser.role === 'admin') {
            const fetchAllUsers = async () => {
                const { data } = await supabase.from('profiles').select('*');
                setAllUsers(data as User[] || []);
            };
            fetchAllUsers();
        }
    }, [currentUser]);

    const handleLogout = async () => {
        setCurrentUser(null);
        await onLogout();
    };

    const handleSetView = (view: View) => {
        setCurrentView(view);
        // Default to 'chat' mode (AI Assistant) when navigating to 'chat' view unless specified
        if (view === 'chat' && currentMode !== 'chat' && currentMode !== 'studio') {
             setCurrentMode('chat');
        }
        setIsSidebarOpen(false);
    };

    const handleSetMode = (mode: TranslationMode) => {
        setCurrentView('chat');
        setCurrentMode(mode);
        setIsSidebarOpen(false);
    };

    const handleNewChat = () => {
        setActiveConversation(null);
        setChatConfig({ source: 'en', target: 'sw', tone: 'Friendly' });
        handleSetView('chat');
        setCurrentMode('chat');
    };

    const handleSelectConversation = async (id: number) => {
        setIsLoading(true);
        handleSetView('chat');
        // Ensure we are in chat mode when selecting a conversation, usually conversations are chats
        setCurrentMode('chat'); 
        
        const { data: convoData } = await supabase.from('conversations').select('*').eq('id', id).eq('user_id', currentUser?.id).single();
        if (convoData) {
            const { data: messagesData } = await supabase.from('chat_messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true });
            const convo = { ...convoData, messages: messagesData as ChatMessage[] };
            setActiveConversation(convo);
            setChatConfig({
                source: convo.source_lang,
                target: convo.target_lang,
                tone: convo.tone
            });
        }
        setIsLoading(false);
    };

    const handleChatSendMessage = async (text: string, attachments: File[], audioSourceFileName: string | null) => {
        if (!currentUser) return;
        setIsLoading(true);

        try {
            let conversationId = activeConversation?.id;
            let currentConvo = activeConversation;

            // 1. Create Conversation if needed
            if (!conversationId) {
                const { data, error } = await supabase.from('conversations').insert({
                    user_id: currentUser.id,
                    title: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
                    source_lang: chatConfig.source,
                    target_lang: chatConfig.target,
                    tone: chatConfig.tone
                }).select().single();

                if (error) throw error;
                if (data) {
                    conversationId = data.id;
                    currentConvo = { ...data, messages: [] };
                    setActiveConversation(currentConvo);
                    setConversations(prev => [data, ...prev]);
                }
            }

            if (!conversationId || !currentConvo) throw new Error("Failed to initialize conversation");

            // 2. Add User Message Locally & DB
            const userMsg: ChatMessage = {
                id: Date.now(), // Temporary ID
                conversation_id: conversationId,
                role: 'user',
                originalText: text,
                created_at: new Date().toISOString(),
                attachments: attachments.map(f => ({ name: f.name, type: f.type })),
                originalAudioFileName: audioSourceFileName || undefined
            };

            // Optimistic update
            const messagesWithUser = [...currentConvo.messages, userMsg];
            setActiveConversation({ ...currentConvo, messages: messagesWithUser });

            // Persist user message
            // Note: In a real app, upload attachments to storage first. Skipping here for demo simplicity.
            await supabase.from('chat_messages').insert({
                conversation_id: conversationId,
                role: 'user',
                "originalText": text,
                attachments: userMsg.attachments,
                "originalAudioFileName": audioSourceFileName
            });

            // 3. Generate AI Response
            const result = await getNuancedTranslation(text, chatConfig.source, chatConfig.target, chatConfig.tone, attachments);

            const aiMsg: ChatMessage = {
                id: Date.now() + 1,
                conversation_id: conversationId,
                role: 'ai',
                originalText: result.culturallyAwareTranslation,
                translation: result,
                created_at: new Date().toISOString()
            };

            // 4. Update UI & DB with AI Response
            setActiveConversation({ ...currentConvo, messages: [...messagesWithUser, aiMsg] });
            
            await supabase.from('chat_messages').insert({
                conversation_id: conversationId,
                role: 'ai',
                "originalText": result.culturallyAwareTranslation,
                translation: result
            });

        } catch (error) {
            console.error("Chat error:", error);
            // Optionally add an error message to the chat
        } finally {
            setIsLoading(false);
        }
    };

    const handleRateMessage = async (id: number, rating: 'good' | 'bad') => {
        // Optimistic update
        if (activeConversation) {
            const updatedMessages = activeConversation.messages.map(m => 
                m.id === id ? { ...m, rating } : m
            );
            setActiveConversation({ ...activeConversation, messages: updatedMessages });
        }
    };

    const handleAddItem = async (item: Omit<LibraryItem, 'id'>) => {
        await supabase.from('library_items').insert(item);
        fetchLibraryItems();
    };

    const handleUpdateItem = async (item: LibraryItem) => {
        const { id, ...rest } = item;
        await supabase.from('library_items').update(rest).eq('id', id);
        fetchLibraryItems();
    };

    const handleDeleteItem = async (id: number) => {
        await supabase.from('library_items').delete().eq('id', id);
        fetchLibraryItems();
    };

    const handleConfirmDeleteConversation = async () => {
        if (deletingConversationId !== null) {
            const id = deletingConversationId;
            
            // Optimistic UI update
            setConversations(prev => prev.filter(c => c.id !== id));
            
            // If deleting the active chat, reset to new chat
            if (activeConversation?.id === id) {
                handleNewChat();
            }

            // Perform DB deletion
            await supabase.from('conversations').delete().eq('id', id).eq('user_id', currentUser?.id);
            
            // Close modal
            setIsDeleteModalOpen(false);
            setDeletingConversationId(null);
        }
    };

    const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
        await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
        const { data } = await supabase.from('profiles').select('*');
        setAllUsers(data as User[] || []);
    };

    const renderContent = () => {
        if (currentView === 'onboarding' && currentUser) return <OnboardingAgent user={currentUser} onComplete={(u) => { setCurrentUser(u); setCurrentView('chat'); }} />;
        if (currentView === 'profile' && currentUser) return <ProfileDashboard user={currentUser} onUpdateUser={setCurrentUser} />;
        if (currentView === 'library') return <Library libraryItems={libraryItems} onSelectExample={() => {}} />;
        if (currentView === 'pricing') return <Pricing onChoosePlan={(plan) => {setSelectedPlanForPayment(plan); setCurrentView('payment');}} onContactSales={() => setCurrentView('contact')} currentUserPlan={currentUser?.plan || 'Free'} />;
        if (currentView === 'payment') return <Payment selectedItemName={selectedPlanForPayment} onBack={() => setCurrentView('pricing')} onPaymentSuccess={(plan) => { setSelectedPlanForPayment(plan); setCurrentView('paymentSuccess'); }} />;
        if (currentView === 'paymentSuccess') return <PaymentSuccess planName={selectedPlanForPayment} onGoToDashboard={handleNewChat} />;
        if (currentView === 'terms') return <TermsOfService />;
        if (currentView === 'privacy') return <PrivacyPolicy />;
        if (currentView === 'contact') return <ContactForm />;
        if (currentView === 'live') return <LiveConversation />;
        if (currentView === 'creative') return <CreativeStudio />;
        if (currentView === 'image') return <CreativeStudio defaultTab="visual" />;
        if (currentView === 'motion') return <CreativeStudio defaultTab="motion" />;
        if (currentView === 'about') return <AboutPage />;
        if (currentView === 'useCases') return <UseCasesPage />;
        if (currentView === 'testimonials') return <TestimonialsPage />;
        if (currentView === 'glossary' && currentUser) return <GlossaryVault userId={currentUser.id} />;
        
        switch(currentMode) {
            case 'script': return <ScriptTranslator />;
            case 'book': return <BookTranslator />;
            case 'meetings': return <MeetingInsights />;
            case 'email': return <EmailTranslator />;
            case 'transcriber': return <AudioTranscriber />;
            case 'studio': return <TranslationStudio userId={currentUser.id} />;
            case 'chat':
                return <Chat 
                    isOffline={isOffline} 
                    messages={activeConversation?.messages || []}
                    onSendMessage={handleChatSendMessage}
                    onRateMessage={handleRateMessage}
                    sourceLang={chatConfig.source}
                    targetLang={chatConfig.target}
                    tone={chatConfig.tone}
                    onSourceLangChange={(lang) => setChatConfig(prev => ({ ...prev, source: lang }))}
                    onTargetLangChange={(lang) => setChatConfig(prev => ({ ...prev, target: lang }))}
                    onToneChange={(tone) => setChatConfig(prev => ({ ...prev, tone }))}
                    isLoading={isLoading}
                />;
            default:
                return <TranslationStudio />;
        }
    };
    
    if (!currentUser) return null;

    if (currentUser.role === 'admin') {
        return <AdminPortal 
            currentLibrary={libraryItems} 
            users={allUsers} 
            onAddItem={handleAddItem} 
            onUpdateItem={handleUpdateItem} 
            onDeleteItem={handleDeleteItem} 
            onLogout={handleLogout} 
            currentUser={currentUser} 
            onUpdateUserRole={handleUpdateUserRole}
        />;
    }
    
    // Identify views that manage their own full-height layout and internal scrolling (App-like behavior)
    // vs views that act like traditional web pages (Page-like behavior)
    const fullHeightViews: (View | TranslationMode)[] = [
        'live', 'chat', 'script', 'book', 'meetings', 'transcriber', 'onboarding', 'studio', 'motion', 'email', 'image', 'glossary', 'creative'
    ];
    const isFullHeightView = fullHeightViews.includes(currentView) || fullHeightViews.includes(currentMode);

    return (
      <div className="flex h-screen w-screen bg-bg-main font-sans text-text-primary overflow-hidden relative">
          <Sidebar
              conversations={conversations}
              currentConversationId={activeConversation?.id || null}
              currentView={currentView}
              currentMode={currentMode}
              onNewChat={handleNewChat}
              onSelectConversation={handleSelectConversation}
              onDeleteConversation={(id) => { setDeletingConversationId(id); setIsDeleteModalOpen(true); }}
              onShowLibrary={() => handleSetView('library')}
              onShowPricing={() => handleSetView('pricing')}
              onChooseAddon={(name) => { setHighlightedPlan(name); setIsUpgradeModalOpen(true); }}
              onSetMode={handleSetMode}
              onSetView={handleSetView}
              currentUser={currentUser}
              isOpen={isSidebarOpen}
              setIsOpen={setIsSidebarOpen}
              onUpgrade={() => { setHighlightedPlan(null); setIsUpgradeModalOpen(true); }}
              isOffline={isOffline}
              offlinePacks={offlinePacks}
              onToggleOfflinePack={() => {}}
          />
          <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden relative md:border-l border-border-default">
              <Header
                  sourceLangName={activeConversation?.source_lang}
                  targetLangName={activeConversation?.target_lang}
                  isChatActive={currentView === 'chat' && currentMode === 'chat'}
                  currentUser={currentUser}
                  onUpgradeClick={() => { setHighlightedPlan(null); setIsUpgradeModalOpen(true); }}
                  onProfileClick={() => handleSetView('profile')}
                  tone={activeConversation?.tone}
                  onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                  isOffline={isOffline}
                  onLogout={handleLogout}
              />
              <main className="flex-1 overflow-hidden bg-[#0d0d0d] relative min-h-0 flex flex-col">
                  <div className={`flex-1 min-h-0 ${isFullHeightView ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'}`}>
                    <div className={!isFullHeightView ? "p-4 sm:p-6 lg:p-8 min-h-full" : "h-full"}>
                        {renderContent()}
                    </div>
                  </div>
                  {!isFullHeightView && (
                      <Footer onShowTerms={() => handleSetView('terms')} onShowPrivacy={() => handleSetView('privacy')} onShowLanding={onShowLanding} />
                  )}
              </main>
          </div>
          <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} highlightedPlan={highlightedPlan} onChoosePlan={(plan) => { setSelectedPlanForPayment(plan); setIsUpgradeModalOpen(false); setCurrentView('payment'); }} onContactSales={() => { setIsUpgradeModalOpen(false); setCurrentView('contact');}} />
          
          {/* Delete Confirmation Modal */}
          <ConfirmationModal 
              isOpen={isDeleteModalOpen}
              onClose={() => { setIsDeleteModalOpen(false); setDeletingConversationId(null); }}
              onConfirm={handleConfirmDeleteConversation}
              title="Delete Conversation?"
              message="This action cannot be undone. This conversation will be permanently removed from your history."
          />
      </div>
    );
};

// --- LANDING PAGE --- //
const LandingPage: React.FC<{ initialView?: View; onStart: (view?: View) => void }> = ({ initialView = 'home', onStart }) => {
    const [currentView, setCurrentView] = useState<View>(initialView);

    const renderContent = () => {
        switch(currentView) {
            case 'about': return <div id="about" className="py-12"><AboutPage isLandingSection /></div>;
            case 'useCases': return <div id="useCases" className="py-12"><UseCasesPage /></div>;
            case 'testimonials': return <div id="testimonials" className="py-12"><TestimonialsPage /></div>;
            case 'home':
            default:
                return (
                    <>
                        {/* HERO SECTION */}
                        <section className="relative py-24 md:py-32 overflow-hidden flex flex-col items-center text-center">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,163,0,0.08),transparent_70%)] pointer-events-none"></div>
                            
                            <div className="relative z-10 container mx-auto px-4 max-w-5xl">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest text-text-secondary uppercase mb-8 animate-fade-in">
                                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                                    The Enterprise Standard for African Localization
                                </div>
                                
                                <h1 className="text-5xl md:text-7xl font-brand font-bold text-white tracking-tight mb-6 animate-slide-in-up leading-[1.1]">
                                    Unlock the World's Next <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow-200">Global Growth Engine.</span>
                                </h1>
                                
                                <p className="mt-6 max-w-2xl mx-auto text-base md:text-lg text-text-secondary leading-relaxed animate-slide-in-up delay-100">
                                    AfriTranslate Studio is the first AI infrastructure designed to bridge the gap between global business and African cultural reality. Scale operations, marketing, and support across 54 countries with culturally intelligent automation.
                                </p>
                                
                                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-in-up delay-200">
                                    <button onClick={() => onStart('chat')} className="px-8 py-4 bg-accent text-bg-main font-bold text-sm rounded-xl hover:scale-105 hover:shadow-[0_0_30px_rgba(244,163,0,0.4)] transition-all duration-300 w-full sm:w-auto">
                                        LAUNCH STUDIO
                                    </button>
                                    <button onClick={() => { 
                                        const demoEl = document.getElementById('demo-section'); 
                                        demoEl?.scrollIntoView({ behavior: 'smooth' });
                                    }} className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold text-sm rounded-xl hover:bg-white/10 transition-all w-full sm:w-auto">
                                        VIEW CAPABILITIES
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* STATS STRIP */}
                        <div className="border-y border-white/5 bg-black/20 backdrop-blur-sm py-8">
                            <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                                {[
                                    { label: 'Countries', value: '54' },
                                    { label: 'Dialects Supported', value: '2,000+' },
                                    { label: 'Cultural Accuracy', value: '99.4%' },
                                    { label: 'Latency (Voice)', value: '<200ms' }
                                ].map((stat, i) => (
                                    <div key={i} className="flex flex-col">
                                        <span className="text-3xl font-black text-white">{stat.value}</span>
                                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1">{stat.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* INTERACTIVE DEMO */}
                        <div id="demo-section" className="py-24 bg-bg-surface/30 border-b border-border-default relative">
                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent"></div>
                            <DemoSection isLandingSection={true} />
                        </div>

                        {/* STRATEGIC ADVANTAGES (Value Props) */}
                        <section className="py-24 container mx-auto px-4 max-w-6xl">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl font-bold text-white mb-4">Strategic Advantages</h2>
                                <p className="text-text-secondary max-w-2xl mx-auto">Why Fortune 500 companies and NGOs choose AfriTranslate for their African expansion strategies.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="p-8 rounded-2xl bg-bg-surface border border-white/5 hover:border-accent/30 transition-colors group">
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
                                        <GlobeIcon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">Hyper-Localization at Scale</h3>
                                    <p className="text-sm text-text-secondary leading-relaxed">
                                        Move beyond generic translation. Our engine adapts content to regional dialects, ensuring your marketing resonates with Hausa speakers in Kano differently than Yoruba speakers in Lagos.
                                    </p>
                                </div>
                                
                                <div className="p-8 rounded-2xl bg-bg-surface border border-white/5 hover:border-accent/30 transition-colors group">
                                    <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6 text-red-400 group-hover:scale-110 transition-transform">
                                        <LockIcon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">Brand Safety & Nuance</h3>
                                    <p className="text-sm text-text-secondary leading-relaxed">
                                        Avoid costly cultural misunderstandings. Our system flags potential taboos and suggests culturally appropriate alternatives for sensitive topics in real-time.
                                    </p>
                                </div>
                                
                                <div className="p-8 rounded-2xl bg-bg-surface border border-white/5 hover:border-accent/30 transition-colors group">
                                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6 text-accent group-hover:scale-110 transition-transform">
                                        <BoltIcon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">Seamless Integration</h3>
                                    <p className="text-sm text-text-secondary leading-relaxed">
                                        Connect AfriTranslate directly into your CMS, CRM, or support platform via our robust API. Designed for developers, optimized for enterprise scale.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* TRUSTED BY / SOCIAL PROOF */}
                        <div className="py-16 border-y border-white/5 bg-black/20">
                            <div className="container mx-auto px-4 text-center">
                                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-8">Trusted by Industry Leaders & Institutions</p>
                                <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                                    {/* Placeholder Logos - using text representation for simplicity but styled as logos */}
                                    <span className="text-xl font-black text-white tracking-tighter">NETFLIX</span>
                                    <span className="text-xl font-bold text-white">Google</span>
                                    <span className="text-xl font-bold text-white italic">Standard Bank</span>
                                    <span className="text-xl font-bold text-white">MTN</span>
                                    <span className="text-xl font-bold text-white tracking-widest">UCT</span>
                                </div>
                            </div>
                        </div>

                        {/* FINAL CTA */}
                        <section className="py-24 text-center px-4">
                            <div className="max-w-3xl mx-auto bg-gradient-to-b from-bg-surface to-bg-main border border-white/10 rounded-3xl p-12 relative overflow-hidden">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-accent/5 blur-3xl rounded-full -z-10"></div>
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to expand your reach?</h2>
                                <p className="text-text-secondary mb-8">Join 10,000+ creators, businesses, and NGOs using AfriTranslate to connect authentically with the African continent.</p>
                                <button onClick={() => onStart('chat')} className="px-10 py-4 bg-accent text-bg-main font-bold rounded-xl hover:bg-white hover:text-accent transition-all shadow-xl text-sm uppercase tracking-wide">
                                    Get Started for Free
                                </button>
                                <p className="mt-4 text-[10px] text-text-secondary uppercase tracking-widest">No credit card required • 14-day Pro trial included</p>
                            </div>
                        </section>
                    </>
                );
        }
    };

    return (
        <div className="bg-bg-main h-full w-full text-text-primary selection:bg-accent selection:text-bg-main overflow-x-hidden overflow-y-auto custom-scrollbar flex flex-col">
            <header className="sticky top-0 z-50 bg-bg-main/80 backdrop-blur-md border-b border-border-default h-16 flex-shrink-0 transition-all">
                <div className="container mx-auto px-6 h-full flex items-center justify-between">
                    <button onClick={() => setCurrentView('home')} className="flex items-center gap-2 hover:opacity-80 transition-opacity group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-yellow-600 flex items-center justify-center text-bg-main shadow-lg group-hover:shadow-accent/20 transition-all">
                            <LogoIcon className="w-5 h-5" />
                        </div>
                        <span className="text-lg font-brand font-bold text-white tracking-tight">AfriTranslate AI</span>
                    </button>
                    <nav className="hidden lg:flex items-center gap-8">
                        <button onClick={() => setCurrentView('about')} className={`text-xs font-bold uppercase tracking-wider transition-colors ${currentView === 'about' ? 'text-accent' : 'text-text-secondary hover:text-white'}`}>Mission</button>
                        <button onClick={() => setCurrentView('useCases')} className={`text-xs font-bold uppercase tracking-wider transition-colors ${currentView === 'useCases' ? 'text-accent' : 'text-text-secondary hover:text-white'}`}>Solutions</button>
                        <button onClick={() => setCurrentView('testimonials')} className={`text-xs font-bold uppercase tracking-wider transition-colors ${currentView === 'testimonials' ? 'text-accent' : 'text-text-secondary hover:text-white'}`}>Stories</button>
                    </nav>
                    <button onClick={() => onStart('chat')} className="px-5 py-2 bg-white/5 border border-white/10 text-white font-bold text-xs rounded-lg hover:bg-white/10 hover:border-accent/30 hover:text-accent transition-all">
                        Log In
                    </button>
                </div>
            </header>
            <main className="flex-1">
                {renderContent()}
            </main>
            <Footer 
                onShowTerms={() => onStart('terms')} 
                onShowPrivacy={() => onStart('privacy')} 
                onShowLanding={() => setCurrentView('home')} 
            />
            {/* Download Manual section in Footer area */}
            <div className="bg-black/30 border-t border-white/5 py-2 text-center">
                <button 
                    onClick={generateOperationalManual} 
                    className="text-[10px] text-text-secondary hover:text-white flex items-center justify-center gap-1.5 mx-auto transition-colors font-mono"
                >
                    <DownloadIcon className="w-3 h-3" />
                    Download User Manual (PDF)
                </button>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const [appState, setAppState] = useState<{ show: boolean; initialView?: View; wasSignup?: boolean }>(() => getInitialAppState());
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isBootstrappingProfile, setIsBootstrappingProfile] = useState(false);
    const [bootstrapError, setBootstrapError] = useState<string | null>(null);
    const wasJustSignedUpRef = useRef(false);
    const { isLoaded, isSignedIn, user } = useUser();
    const { signOut } = useClerk();

    useEffect(() => {
        if (!isLoaded) return;

        if (!isSignedIn || !user) {
            setCurrentUser(null);
            setIsBootstrappingProfile(false);
            setBootstrapError(null);
            wasJustSignedUpRef.current = false;
            return;
        }

        let isCancelled = false;

        const bootstrapProfile = async () => {
            setIsBootstrappingProfile(true);
            setBootstrapError(null);

            try {
                const primaryEmail = getPrimaryEmail(user);
                if (!primaryEmail) {
                    throw new Error('Your Clerk account is missing a primary email address.');
                }

                const clerkUserId = user.id;
                const displayName = getDisplayName(user);
                let matchedExistingUser = false;

                const { data: existingProfile, error: existingProfileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('email', primaryEmail)
                    .maybeSingle();

                if (existingProfileError) {
                    console.error('Profile bootstrap existing profile lookup failed:', existingProfileError);
                    throw existingProfileError;
                }

                if (existingProfile) {
                    matchedExistingUser = true;

                    if (existingProfile.id === clerkUserId) {
                        const { error: refreshProfileError } = await supabase
                            .from('profiles')
                            .update({
                                email: primaryEmail,
                                name: existingProfile.name || displayName
                            })
                            .eq('id', clerkUserId);

                        if (refreshProfileError) {
                            console.error('Profile bootstrap refresh failed:', refreshProfileError);
                            throw refreshProfileError;
                        }
                    } else if (isLegacyProfileId(existingProfile.id)) {
                        const legacyProfileId = existingProfile.id;

                        const { error: profileMigrationError } = await supabase
                            .from('profiles')
                            .update({
                                id: clerkUserId,
                                email: primaryEmail,
                                name: existingProfile.name || displayName
                            })
                            .eq('id', legacyProfileId);

                        if (profileMigrationError) {
                            console.error('Profile bootstrap legacy profile migration failed:', profileMigrationError);
                            throw profileMigrationError;
                        }

                        const ownershipTables = [
                            'conversations',
                            'scheduled_meetings',
                            'meeting_summaries',
                            'brand_glossaries'
                        ] as const;

                        for (const tableName of ownershipTables) {
                            const { error: ownershipError } = await supabase
                                .from(tableName)
                                .update({ user_id: clerkUserId })
                                .eq('user_id', legacyProfileId);

                            if (ownershipError) {
                                console.error(`Profile bootstrap ownership migration failed for ${tableName}:`, ownershipError);
                                throw ownershipError;
                            }
                        }
                    } else {
                        throw new Error(`A profile already exists for ${primaryEmail}, but it is linked to a different Clerk user.`);
                    }
                } else {
                    const { error: insertProfileError } = await supabase
                        .from('profiles')
                        .insert({
                            id: clerkUserId,
                            email: primaryEmail,
                            name: displayName,
                            role: 'user',
                            plan: 'Premium',
                            trial_start_date: new Date().toISOString(),
                            onboarding_completed: false
                        });

                    if (insertProfileError) {
                        console.error('Profile bootstrap insert failed:', insertProfileError);
                        throw insertProfileError;
                    }

                    wasJustSignedUpRef.current = true;
                }

                if (matchedExistingUser) {
                    wasJustSignedUpRef.current = false;
                }

                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', clerkUserId)
                    .single();

                if (profileError) {
                    console.error('Profile bootstrap final profile fetch failed:', profileError);
                    throw profileError;
                }

                if (!isCancelled) {
                    setCurrentUser(profile as User);
                }
            } catch (error) {
                console.error('Profile bootstrap failed with full error object:', error);
                if (!isCancelled) {
                    setBootstrapError(error instanceof Error ? error.message : 'Failed to load your profile.');
                }
            } finally {
                if (!isCancelled) {
                    setIsBootstrappingProfile(false);
                }
            }
        };

        bootstrapProfile();

        return () => {
            isCancelled = true;
        };
    }, [
        isLoaded,
        isSignedIn,
        user?.id,
        user?.primaryEmailAddress?.emailAddress,
        user?.fullName,
        user?.firstName,
        user?.username
    ]);

    const handleLogout = async () => {
        await signOut();
        setCurrentUser(null);
        wasJustSignedUpRef.current = false;
        setAppState({ show: false });
    };

    if (!isLoaded || (isSignedIn && isBootstrappingProfile)) {
        return <div className="bg-bg-main h-screen w-screen flex items-center justify-center"><div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin"></div></div>;
    }

    if (bootstrapError) {
        return (
            <div className="bg-bg-main h-screen w-screen flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-bg-surface border border-border-default rounded-2xl p-6 text-center">
                    <h1 className="text-xl font-bold text-white mb-3">We could not load your studio profile</h1>
                    <p className="text-sm text-text-secondary mb-5">{bootstrapError}</p>
                    <button
                        onClick={handleLogout}
                        className="px-5 py-2.5 bg-accent text-bg-main font-bold rounded-lg hover:bg-accent/90 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    if (!isSignedIn) {
        if (appState.show && !PUBLIC_INFO_VIEWS.includes(appState.initialView!)) {
            return (
                <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4 py-10">
                    <div className="w-full max-w-5xl grid lg:grid-cols-[1.05fr_0.95fr] gap-8 items-center">
                        <div className="hidden lg:block">
                            <div className="inline-flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-yellow-600 flex items-center justify-center text-bg-main shadow-lg">
                                    <LogoIcon className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-lg font-brand font-bold tracking-tight">AfriTranslate AI Studio</p>
                                    <p className="text-xs text-text-secondary uppercase tracking-[0.25em]">Culturally Intelligent Localization</p>
                                </div>
                            </div>
                            <h1 className="text-4xl font-brand font-bold leading-tight mb-4">Secure sign-in for your translation studio.</h1>
                            <p className="text-text-secondary max-w-xl leading-relaxed">
                                Clerk now manages access to the studio while your translations, storage, and product data remain in Supabase.
                            </p>
                        </div>
                        <div className="w-full">
                            <SignIn
                                routing="hash"
                                fallbackRedirectUrl="/"
                                appearance={{
                                    variables: {
                                        colorBackground: '#0a0a0a',
                                        colorPrimary: '#f5a623',
                                        colorText: '#ffffff',
                                        colorInputBackground: '#1a1a1a',
                                        colorInputText: '#ffffff'
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            );
        }

        return <LandingPage initialView={appState.initialView} onStart={(view) => setAppState({ show: true, initialView: view })} />;
    }

    if (!currentUser) {
        return <div className="bg-bg-main h-screen w-screen flex items-center justify-center"><div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin"></div></div>;
    }

    return <TranslatorApp
        initialUser={currentUser}
        onLogout={handleLogout}
        onShowLanding={() => setAppState({ show: false })}
        initialView={appState.initialView}
        wasSignup={wasJustSignedUpRef.current}
    />;
};

export default App;
