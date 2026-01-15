
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

// --- MAIN APPLICATION IMPORTS --- //
import type { User, View, TranslationMode, Conversation, LibraryItem, ChatMessage } from './types';

// Import all components needed for the app
import { Auth } from './components/Auth';
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
import UpgradeModal from './components/UpgradeModal';
import Studio from './components/Studio';
import Chat from './components/Chat'; // Import Chat component
import AdminPortal from './components/AdminPortal';
import LiveConversation from './components/LiveConversation';
import AudioTranscriber from './components/AudioTranscriber';
import DemoSection from './components/DemoSection';
import AboutPage from './components/AboutPage';
import UseCasesPage from './components/UseCasesPage';
import TestimonialsPage from './components/TestimonialsPage';
import VideoGenerator from './components/VideoGenerator';
import ConfirmationModal from './components/ConfirmationModal';
import ProfileDashboard from './components/ProfileDashboard';
import OnboardingAgent from './components/OnboardingAgent';
import EmailTranslator from './components/EmailTranslator';
import { LogoIcon, SearchIcon, TranslateIcon, LiveIcon, MicrophoneIcon, GlobeIcon, LockIcon, BoltIcon, CheckIcon, ScriptIcon, BookIcon, EmailIcon, ImageIcon, MeetingIcon } from './components/Icons';
import * as geminiService from './services/geminiService'; // Import service for chat logic

// --- PLACEHOLDER COMPONENTS --- //
const ImageGenerator: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in p-3 overflow-hidden">
        <h1 className="text-xl sm:text-2xl font-extrabold text-white mb-1.5">Visual Translation Engine</h1>
        <p className="text-[12px] text-text-secondary mb-3 max-w-lg">Describe cultural concepts and materialize them into art.</p>
        <div className="w-full max-w-4xl flex-1 bg-bg-surface border border-border-default rounded-xl flex items-center justify-center text-text-secondary">
            Feature Loading...
        </div>
    </div>
);

// --- TRANSLATOR APP --- //
const TranslatorApp: React.FC<{ onShowLanding: () => void; initialView?: View; wasSignup?: boolean }> = ({ onShowLanding, initialView = 'chat', wasSignup = false }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    
    const [conversations, setConversations] = useState<(Omit<Conversation, 'messages'>)[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
    
    const [currentView, setCurrentView] = useState<View>(initialView);
    const [currentMode, setCurrentMode] = useState<TranslationMode>('chat');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [highlightedPlan, setHighlightedPlan] = useState<string | null>(null);
    const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingConversationId, setDeletingConversationId] = useState<number | null>(null);

    // Chat local state (if no conversation selected)
    const [tempChatState, setTempChatState] = useState({
        sourceLang: 'en',
        targetLang: 'sw',
        tone: 'Friendly'
    });

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

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                if (data) {
                    const user = data as User;
                    setCurrentUser(user);
                    if (wasSignup && !user.onboarding_completed) {
                        setCurrentView('onboarding');
                    }
                }
            }
        };
        fetchUserData();
    }, [wasSignup]);

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
        await supabase.auth.signOut();
        setCurrentUser(null);
        onShowLanding();
    };

    const handleSetView = (view: View) => {
        setCurrentView(view);
        if (view !== 'chat' && view !== 'profile') setCurrentMode('chat');
        setIsSidebarOpen(false);
    };

    const handleSetMode = (mode: TranslationMode) => {
        setCurrentView('chat');
        setCurrentMode(mode);
        setIsSidebarOpen(false);
    };

    const handleNewChat = () => {
        setActiveConversation(null);
        handleSetView('chat');
        setCurrentMode('chat');
    };

    const handleSelectConversation = async (id: number) => {
        setIsLoading(true);
        handleSetView('chat');
        setCurrentMode('chat'); // Ensure we are in chat mode
        const { data: convoData } = await supabase.from('conversations').select('*').eq('id', id).single();
        if (convoData) {
            const { data: messagesData } = await supabase.from('chat_messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true });
            setActiveConversation({ ...convoData, messages: messagesData as ChatMessage[] });
        }
        setIsLoading(false);
    };

    // --- CHAT LOGIC ---
    const handleChatSubmit = async (text: string, attachments: File[], audioSourceFileName: string | null) => {
        setIsLoading(true);
        
        // 1. Determine effective config
        const effectiveSourceLang = activeConversation?.sourceLang || tempChatState.sourceLang;
        const effectiveTargetLang = activeConversation?.targetLang || tempChatState.targetLang;
        const effectiveTone = activeConversation?.tone || tempChatState.tone;

        // 2. Create optimistic user message
        const newUserMsg: ChatMessage = {
            id: Date.now(),
            conversation_id: activeConversation?.id || 0,
            role: 'user',
            originalText: text,
            created_at: new Date().toISOString(),
            originalAudioFileName: audioSourceFileName || undefined,
            attachments: attachments.map(f => ({ name: f.name, type: f.type }))
        };

        // Update UI immediately
        if (activeConversation) {
            setActiveConversation(prev => prev ? ({ ...prev, messages: [...prev.messages, newUserMsg] }) : null);
        } else {
            // Temporary local state for new unsaved chat
            setActiveConversation({
                id: 0,
                user_id: currentUser?.id || '',
                title: 'New Conversation',
                messages: [newUserMsg],
                sourceLang: effectiveSourceLang,
                targetLang: effectiveTargetLang,
                tone: effectiveTone,
                created_at: new Date().toISOString()
            });
        }

        try {
            // 3. Get AI Response
            const result = await geminiService.getNuancedTranslation(
                text, 
                effectiveSourceLang, 
                effectiveTargetLang, 
                effectiveTone, 
                attachments
            );

            const newAiMsg: ChatMessage = {
                id: Date.now() + 1,
                conversation_id: activeConversation?.id || 0,
                role: 'ai',
                originalText: '', // AI translation is in the result object
                translation: result,
                created_at: new Date().toISOString(),
            };

            // 4. Save to DB (if not a temp chat, or create if it is)
            if (currentUser) {
                let convoId = activeConversation?.id;

                if (!convoId || convoId === 0) {
                    // Create new conversation
                    const { data: newConvo, error: convoError } = await supabase
                        .from('conversations')
                        .insert({
                            user_id: currentUser.id,
                            title: text.substring(0, 30) + '...',
                            sourceLang: effectiveSourceLang,
                            targetLang: effectiveTargetLang,
                            tone: effectiveTone
                        })
                        .select()
                        .single();
                    
                    if (newConvo) {
                        convoId = newConvo.id;
                        // Refresh conversation list sidebar
                        const { data: convos } = await supabase.from('conversations').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
                        setConversations(convos || []);
                    }
                }

                if (convoId) {
                    // Save messages
                    await supabase.from('chat_messages').insert([
                        { 
                            conversation_id: convoId, 
                            role: 'user', 
                            originalText: text,
                            // Simplification: Not storing attachments blobs in this demo
                        },
                        {
                            conversation_id: convoId,
                            role: 'ai',
                            originalText: '',
                            translation: result // JSONB column
                        }
                    ]);
                    
                    // Update active conversation with real ID
                    setActiveConversation(prev => prev ? ({ ...prev, id: convoId!, messages: [...prev.messages, newAiMsg] }) : null);
                } else {
                     // Fallback local update if DB save fails
                     setActiveConversation(prev => prev ? ({ ...prev, messages: [...prev.messages, newAiMsg] }) : null);
                }
            }

        } catch (error) {
            console.error("Chat error:", error);
            // Add error system message
            const errorMsg: ChatMessage = {
                id: Date.now() + 2,
                conversation_id: activeConversation?.id || 0,
                role: 'ai',
                originalText: "I apologize, but I encountered an error processing your request. Please check your connection or quota and try again.",
                created_at: new Date().toISOString()
            };
            setActiveConversation(prev => prev ? ({ ...prev, messages: [...prev.messages, errorMsg] }) : null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateConfig = (key: 'sourceLang' | 'targetLang' | 'tone', value: string) => {
        if (activeConversation && activeConversation.id !== 0) {
            // Update existing conversation settings
            const updates = { [key]: value };
            setActiveConversation(prev => prev ? ({ ...prev, ...updates }) : null);
            supabase.from('conversations').update(updates).eq('id', activeConversation.id).then();
        } else {
            // Update temp state
            setTempChatState(prev => ({ ...prev, [key]: value }));
            if (activeConversation) {
                 setActiveConversation(prev => prev ? ({ ...prev, [key]: value }) : null);
            }
        }
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
        if (currentView === 'image') return <ImageGenerator />;
        if (currentView === 'motion') return <VideoGenerator />;
        if (currentView === 'about') return <AboutPage />;
        if (currentView === 'useCases') return <UseCasesPage />;
        if (currentView === 'testimonials') return <TestimonialsPage />;
        
        switch(currentMode) {
            case 'script': return <ScriptTranslator />;
            case 'book': return <BookTranslator />;
            case 'meetings': return <MeetingSummarizer currentUser={currentUser} />;
            case 'email': return <EmailTranslator />;
            case 'transcriber': return <AudioTranscriber />;
            case 'studio': return <Studio isOffline={isOffline} />; // Explicit Studio Mode
            case 'chat':
            default:
                return (
                    <Chat 
                        isOffline={isOffline}
                        messages={activeConversation?.messages || []}
                        onSendMessage={handleChatSubmit}
                        onRateMessage={() => {}}
                        isLoading={isLoading}
                        sourceLang={activeConversation?.sourceLang || tempChatState.sourceLang}
                        targetLang={activeConversation?.targetLang || tempChatState.targetLang}
                        tone={activeConversation?.tone || tempChatState.tone}
                        onSourceLangChange={(v) => handleUpdateConfig('sourceLang', v)}
                        onTargetLangChange={(v) => handleUpdateConfig('targetLang', v)}
                        onToneChange={(v) => handleUpdateConfig('tone', v)}
                    />
                );
        }
    };
    
    if (!currentUser) return null;

    if (currentUser.role === 'admin') {
        return <AdminPortal currentLibrary={libraryItems} users={allUsers} onAddItem={() => fetchLibraryItems()} onUpdateItem={() => fetchLibraryItems()} onDeleteItem={() => fetchLibraryItems()} onLogout={handleLogout} currentUser={currentUser} />;
    }
    
    // Determine padding based on view
    const viewsWithFullHeight = ['live', 'chat', 'script', 'book', 'meetings', 'transcriber', 'onboarding', 'studio'];
    const shouldUseFullHeight = viewsWithFullHeight.includes(currentView) || viewsWithFullHeight.includes(currentMode);

    return (
      <div className="flex h-[100dvh] w-screen bg-bg-main font-sans text-text-primary overflow-hidden relative">
          {/* Mobile Sidebar Backdrop */}
          {isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity" 
                onClick={() => setIsSidebarOpen(false)}
            />
          )}
          
          <Sidebar
              conversations={conversations}
              currentConversationId={activeConversation?.id || null}
              currentView={currentView}
              currentMode={currentMode}
              onNewChat={handleNewChat}
              onSelectConversation={handleSelectConversation}
              onDeleteConversation={() => {}}
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
                  sourceLangName={activeConversation?.sourceLang}
                  targetLangName={activeConversation?.targetLang}
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
                  {/* Chat/Studio views handle their own scrolling/layout */}
                  <div className={`flex-1 min-h-0 ${shouldUseFullHeight ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'}`}>
                    <div className={!shouldUseFullHeight ? "p-4 sm:p-6 lg:p-8 h-full" : "h-full"}>
                        {renderContent()}
                    </div>
                  </div>
                  {/* Hide footer for full-height interactive tools on mobile to save space, or if the view is chat/studio which has internal footers */}
                  {!shouldUseFullHeight && (
                      <Footer onShowTerms={() => handleSetView('terms')} onShowPrivacy={() => handleSetView('privacy')} onShowLanding={onShowLanding} />
                  )}
              </main>
          </div>
          <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} highlightedPlan={highlightedPlan} onChoosePlan={(plan) => { setSelectedPlanForPayment(plan); setIsUpgradeModalOpen(false); setCurrentView('payment'); }} onContactSales={() => { setIsUpgradeModalOpen(false); setCurrentView('contact');}} />
      </div>
    );
};

// --- LANDING PAGE --- //
const LandingPage: React.FC<{ initialView?: View; onStart: (view?: View) => void }> = ({ initialView = 'home', onStart }) => {
    const [currentView, setCurrentView] = useState<View>(initialView);

    const renderContent = () => {
        switch(currentView) {
            case 'about': return <div className="py-12"><AboutPage isLandingSection={false} /></div>;
            case 'useCases': return <div className="py-12"><UseCasesPage /></div>;
            case 'testimonials': return <div className="py-12"><TestimonialsPage /></div>;
            case 'home':
            default:
                return (
                    <>
                        {/* HERO SECTION */}
                        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-accent/5 rounded-full blur-[120px]"></div>
                                <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]"></div>
                            </div>
                            
                            <div className="container mx-auto px-6 relative z-10 text-center">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-accent text-[10px] font-bold uppercase tracking-widest mb-8 animate-fade-in backdrop-blur-md">
                                    The Enterprise Standard for African Localization
                                </div>
                                <h1 className="text-5xl md:text-7xl lg:text-8xl font-brand font-bold text-white tracking-tighter mb-8 leading-[1.1] animate-slide-in-up">
                                    Unlock the World's Next <br/>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow-200">Global Growth Engine.</span>
                                </h1>
                                <p className="max-w-2xl mx-auto text-lg text-text-secondary leading-relaxed mb-12 animate-slide-in-up [animation-delay:0.1s]">
                                    AfriTranslate Studio is the first AI infrastructure designed to bridge the gap between global business and African cultural reality. Scale operations across 54 countries with culturally intelligent automation.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-in-up [animation-delay:0.2s]">
                                    <button onClick={() => onStart('chat')} className="px-8 py-4 bg-accent text-bg-main font-black text-sm rounded-xl hover:bg-white hover:scale-105 transition-all shadow-[0_0_40px_-10px_rgba(244,163,0,0.4)] w-full sm:w-auto uppercase tracking-wide">
                                        Start Translating
                                    </button>
                                    <button onClick={() => setCurrentView('demo')} className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold text-sm rounded-xl hover:bg-white/10 transition-all w-full sm:w-auto uppercase tracking-wide backdrop-blur-md">
                                        View Demo
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* PARTNERS SECTION */}
                        <section className="py-12 border-y border-white/5 bg-black/20">
                            <div className="container mx-auto px-6">
                                <p className="text-center text-[10px] font-bold text-text-secondary uppercase tracking-[0.3em] mb-8 opacity-70">Trusted by Global Industry Leaders</p>
                                <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
                                    {['NETFLIX', 'GOOGLE', 'MTN', 'STANDARD BANK', 'UNICEF', 'CANAL+', 'SPOTIFY', 'UBER', 'MICROSOFT', 'BBC AFRICA', 'COCA-COLA', 'TOYOTA', 'JUMIA', 'MPESA'].map((partner) => (
                                        <h3 key={partner} className="text-xl md:text-2xl font-brand font-bold text-white tracking-tight cursor-default hover:text-accent transition-colors">{partner}</h3>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* STATS SECTION */}
                        <section className="py-20 border-b border-white/5 bg-bg-surface/10 backdrop-blur-sm">
                            <div className="container mx-auto px-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                                    {[
                                        { value: '2,000+', label: 'Dialects Supported' },
                                        { value: '99.4%', label: 'Cultural Accuracy' },
                                        { value: '<200ms', label: 'Voice Latency' },
                                        { value: 'SOC-2', label: 'Compliant Security' }
                                    ].map((stat, i) => (
                                        <div key={i} className="space-y-2 group cursor-default">
                                            <div className="text-4xl md:text-5xl font-black text-white group-hover:text-accent transition-colors">{stat.value}</div>
                                            <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* CONTEXT GAP SECTION */}
                        <section className="py-24 bg-bg-surface/30 border-y border-white/5 relative overflow-hidden">
                            {/* Decorative background elements */}
                            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                                <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[100px]"></div>
                                <div className="absolute -bottom-[20%] -right-[10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px]"></div>
                            </div>

                            <div className="container mx-auto px-6 relative z-10">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                                    <div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                                            The Problem
                                        </div>
                                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                                            Standard AI has a <br/>
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">Context Blindspot.</span>
                                        </h2>
                                        <p className="text-lg text-text-secondary leading-relaxed mb-8">
                                            Legacy translation engines treat language as math. They ignore social hierarchy, historical idioms, and emotional subtext.
                                            <br/><br/>
                                            In Africa, where context defines meaning, this leads to catastrophic misunderstandings and brand damage.
                                        </p>
                                        <div className="space-y-4">
                                            <div className="p-4 rounded-xl bg-bg-main border border-border-default opacity-60">
                                                <p className="text-xs text-text-secondary uppercase font-bold mb-2">Generic Engine Input</p>
                                                <p className="text-white italic">"The elder is coming."</p>
                                                <div className="mt-2 text-red-400 text-xs font-mono">⚠ Missing honorifics. Disrespectful tone detected.</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-purple-500/20 blur-3xl rounded-full opacity-30"></div>
                                        <div className="relative bg-bg-main border border-white/10 rounded-2xl p-8 shadow-2xl">
                                            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                                                <div>
                                                    <h3 className="text-xl font-bold text-white">AfriTranslate Core</h3>
                                                    <p className="text-xs text-accent">Cultural Intelligence Module Active</p>
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                                                    <BoltIcon className="w-5 h-5"/>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-6">
                                                <div className="flex gap-4">
                                                    <div className="w-1 h-full bg-border-default rounded-full relative">
                                                        <div className="absolute top-0 left-0 w-full h-1/2 bg-accent rounded-full"></div>
                                                    </div>
                                                    <div className="flex-1 space-y-4">
                                                        <div>
                                                            <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Analysis</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                <span className="px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] text-white">Age: Elder (70+)</span>
                                                                <span className="px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] text-white">Region: Yoruba (SW)</span>
                                                                <span className="px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] text-white">Setting: Formal</span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Output Generation</p>
                                                            <p className="text-lg font-serif text-white">"Baba agba n bo."</p>
                                                            <p className="text-xs text-green-400 mt-1 flex items-center gap-1"><CheckIcon className="w-3 h-3"/> Honorifics applied. Cultural resonance 99%.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* PLATFORM CAPABILITIES */}
                        <section className="py-24 bg-bg-main">
                            <div className="container mx-auto px-6">
                                <div className="text-center max-w-3xl mx-auto mb-20">
                                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Complete Cultural Infrastructure</h2>
                                    <p className="text-text-secondary text-lg">
                                        One platform to manage every aspect of your localization strategy. From real-time voice to legal documentation.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {/* Card 1 */}
                                    <div className="bg-bg-surface p-8 rounded-3xl border border-white/5 hover:border-accent/30 transition-all group hover:-translate-y-1">
                                        <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform">
                                            <MicrophoneIcon className="w-7 h-7"/>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-3">Live Voice Relay</h3>
                                        <p className="text-sm text-text-secondary leading-relaxed mb-6">
                                            Real-time speech-to-speech translation that adapts accents and dialects instantly for Zoom, Teams, and physical meetings.
                                        </p>
                                        <div className="flex items-center gap-2 text-xs font-bold text-white/50 group-hover:text-purple-400 transition-colors">
                                            <span>Explore Live</span> <span className="text-lg">→</span>
                                        </div>
                                    </div>

                                    {/* Card 2 */}
                                    <div className="bg-bg-surface p-8 rounded-3xl border border-white/5 hover:border-accent/30 transition-all group hover:-translate-y-1">
                                        <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
                                            <ScriptIcon className="w-7 h-7"/>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-3">Script Studio</h3>
                                        <p className="text-sm text-text-secondary leading-relaxed mb-6">
                                            Automated screenplay localization. Generates casting sides, dubbing guides, and cultural reports for film & TV production.
                                        </p>
                                        <div className="flex items-center gap-2 text-xs font-bold text-white/50 group-hover:text-blue-400 transition-colors">
                                            <span>Localize Scripts</span> <span className="text-lg">→</span>
                                        </div>
                                    </div>

                                    {/* Card 3 */}
                                    <div className="bg-bg-surface p-8 rounded-3xl border border-white/5 hover:border-accent/30 transition-all group hover:-translate-y-1">
                                        <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 text-orange-400 group-hover:scale-110 transition-transform">
                                            <BookIcon className="w-7 h-7"/>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-3">Literary Engine</h3>
                                        <p className="text-sm text-text-secondary leading-relaxed mb-6">
                                            Long-form translation for books and research papers. Maintains narrative continuity and adapts metaphors for local readers.
                                        </p>
                                        <div className="flex items-center gap-2 text-xs font-bold text-white/50 group-hover:text-orange-400 transition-colors">
                                            <span>Translate Books</span> <span className="text-lg">→</span>
                                        </div>
                                    </div>

                                    {/* Card 4 */}
                                    <div className="bg-bg-surface p-8 rounded-3xl border border-white/5 hover:border-accent/30 transition-all group hover:-translate-y-1">
                                        <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 text-green-400 group-hover:scale-110 transition-transform">
                                            <EmailIcon className="w-7 h-7"/>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-3">Enterprise Comm.</h3>
                                        <p className="text-sm text-text-secondary leading-relaxed mb-6">
                                            Context-aware email and document localization. Ensures professional etiquette matches the recipient's cultural status.
                                        </p>
                                        <div className="flex items-center gap-2 text-xs font-bold text-white/50 group-hover:text-green-400 transition-colors">
                                            <span>Business Tools</span> <span className="text-lg">→</span>
                                        </div>
                                    </div>

                                    {/* Card 5 */}
                                    <div className="bg-bg-surface p-8 rounded-3xl border border-white/5 hover:border-accent/30 transition-all group hover:-translate-y-1">
                                        <div className="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center mb-6 text-pink-400 group-hover:scale-110 transition-transform">
                                            <ImageIcon className="w-7 h-7"/>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-3">Visual & Motion</h3>
                                        <p className="text-sm text-text-secondary leading-relaxed mb-6">
                                            Generative visual arts adapted for African aesthetics. Create video and imagery that feels native to the region.
                                        </p>
                                        <div className="flex items-center gap-2 text-xs font-bold text-white/50 group-hover:text-pink-400 transition-colors">
                                            <span>Create Visuals</span> <span className="text-lg">→</span>
                                        </div>
                                    </div>

                                    {/* Card 6 */}
                                    <div className="bg-bg-surface p-8 rounded-3xl border border-white/5 hover:border-accent/30 transition-all group hover:-translate-y-1">
                                        <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-6 text-yellow-400 group-hover:scale-110 transition-transform">
                                            <MeetingIcon className="w-7 h-7"/>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-3">Meeting Intelligence</h3>
                                        <p className="text-sm text-text-secondary leading-relaxed mb-6">
                                            Automated meeting summaries and action items, translated into multiple languages for cross-border teams.
                                        </p>
                                        <div className="flex items-center gap-2 text-xs font-bold text-white/50 group-hover:text-yellow-400 transition-colors">
                                            <span>Analyze Meetings</span> <span className="text-lg">→</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* VALUE PROPS */}
                        <section className="py-24 bg-bg-main border-t border-white/5">
                            <div className="container mx-auto px-6">
                                <div className="text-center max-w-3xl mx-auto mb-20">
                                    <h2 className="text-3xl font-bold text-white mb-4">Strategic Advantages</h2>
                                    <p className="text-text-secondary">Why Fortune 500 companies and NGOs choose AfriTranslate for their African expansion strategies.</p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {[
                                        { title: 'Hyper-Localization', desc: 'Move beyond generic translation. Our engine adapts content to regional dialects, ensuring your marketing resonates deeply.', icon: <GlobeIcon className="w-6 h-6"/> },
                                        { title: 'Brand Safety', desc: 'Avoid costly cultural misunderstandings. Our system flags potential taboos and suggests culturally appropriate alternatives.', icon: <LockIcon className="w-6 h-6"/> },
                                        { title: 'Seamless Integration', desc: 'Connect AfriTranslate directly into your CMS, CRM, or support platform via our robust API. Optimized for enterprise.', icon: <BoltIcon className="w-6 h-6"/> }
                                    ].map((feature, i) => (
                                        <div key={i} className="bg-bg-surface p-10 rounded-3xl border border-white/5 hover:border-accent/30 transition-all group hover:-translate-y-1 duration-300">
                                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 text-accent group-hover:scale-110 transition-transform">
                                                {feature.icon}
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                                            <p className="text-text-secondary leading-relaxed text-sm">{feature.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* DEMO SECTION */}
                        <div id="demo" className="py-24 border-t border-white/5 bg-bg-surface/20">
                            <DemoSection isLandingSection={true} />
                        </div>

                        {/* CTA */}
                        <section className="py-32 relative overflow-hidden">
                            <div className="absolute inset-0 bg-accent/5"></div>
                            <div className="container mx-auto px-6 relative z-10 text-center">
                                <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Ready to expand your reach?</h2>
                                <p className="text-text-secondary max-w-2xl mx-auto mb-12 text-lg">
                                    Join 10,000+ creators, businesses, and NGOs using AfriTranslate to connect authentically with the African continent.
                                </p>
                                <button onClick={() => onStart('chat')} className="px-12 py-5 bg-accent text-bg-main font-black text-sm rounded-xl hover:bg-white hover:scale-105 transition-all shadow-2xl uppercase tracking-wider">
                                    GET STARTED FOR FREE
                                </button>
                            </div>
                        </section>
                    </>
                );
        }
    };

    return (
        <div className="bg-bg-main h-full w-full text-text-primary selection:bg-accent selection:text-bg-main overflow-x-hidden overflow-y-auto custom-scrollbar flex flex-col">
            <header className="sticky top-0 z-50 bg-bg-main/80 backdrop-blur-md border-b border-border-default h-20 transition-all duration-300 flex-shrink-0">
                <div className="container mx-auto px-6 h-full flex items-center justify-between">
                    <button onClick={() => setCurrentView('home')} className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
                        <div className="text-accent group-hover:scale-110 transition-transform"><LogoIcon className="w-8 h-8" /></div>
                        <span className="text-lg font-brand font-bold text-white tracking-tighter">AfriTranslate AI</span>
                    </button>
                    <nav className="hidden lg:flex items-center gap-10">
                        <button onClick={() => setCurrentView('home')} className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${currentView === 'home' ? 'text-accent' : 'text-text-secondary hover:text-white'}`}>Home</button>
                        <button onClick={() => setCurrentView('about')} className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${currentView === 'about' ? 'text-accent' : 'text-text-secondary hover:text-white'}`}>Mission</button>
                        <button onClick={() => setCurrentView('useCases')} className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${currentView === 'useCases' ? 'text-accent' : 'text-text-secondary hover:text-white'}`}>Solutions</button>
                        <button onClick={() => setCurrentView('testimonials')} className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${currentView === 'testimonials' ? 'text-accent' : 'text-text-secondary hover:text-white'}`}>Partners</button>
                    </nav>
                    <div className="flex items-center gap-6">
                        <button onClick={() => onStart('chat')} className="text-xs font-bold text-white hover:text-accent transition-colors hidden sm:block uppercase tracking-wide">Log In</button>
                        <button onClick={() => onStart('chat')} className="px-6 py-2.5 bg-accent text-bg-main font-black text-xs rounded-lg hover:bg-white hover:scale-105 transition-all shadow-lg shadow-accent/20 uppercase tracking-wide">
                            LAUNCH STUDIO
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {renderContent()}
            </main>

            <Footer onShowTerms={() => onStart('terms')} onShowPrivacy={() => onStart('privacy')} onShowLanding={() => setCurrentView('home')} />
        </div>
    );
};

const App: React.FC = () => {
    const [appState, setAppState] = useState<{ show: boolean; initialView?: View; wasSignup?: boolean }>({ show: false });
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const wasJustSignedUpRef = useRef(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = async (email: string, pass: string) => {
        wasJustSignedUpRef.current = false;
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        return !error;
    };

    const handleSignUp = async (name: string, email: string, pass: string) => {
        wasJustSignedUpRef.current = true;
        const { error } = await supabase.auth.signUp({ email, password: pass, options: { data: { name } } });
        return !error;
    };

    const handleGoogleLogin = async () => {
        wasJustSignedUpRef.current = false;
        // Include redirect URL to current origin to handle dynamic preview domains
        const { error } = await supabase.auth.signInWithOAuth({ 
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) throw error;
    };

    if (loading) return <div className="bg-bg-main h-screen w-screen flex items-center justify-center"><div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin"></div></div>;

    // PUBLIC VIEWS - These don't require session unless the user wants to enter the 'Studio'
    const PUBLIC_INFO_VIEWS: View[] = ['about', 'useCases', 'testimonials'];

    if (!session) {
        // If the appState wants to show the functional app but there's no session, show Auth.
        // UNLESS the initialView is a public info view.
        if (appState.show && !PUBLIC_INFO_VIEWS.includes(appState.initialView!)) {
            return <Auth 
                onLogin={handleLogin} 
                onSignUp={handleSignUp} 
                onGoogleLogin={handleGoogleLogin} 
                error={null} 
                setError={() => {}} 
            />;
        }
        // Otherwise show the informational Landing Page
        return <LandingPage initialView={appState.initialView} onStart={(view) => setAppState({ show: true, initialView: view })} />;
    }

    return <TranslatorApp 
        onShowLanding={() => setAppState({ show: false })} 
        initialView={appState.initialView} 
        wasSignup={wasJustSignedUpRef.current}
    />;
};

export default App;
