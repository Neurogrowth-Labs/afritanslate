
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import * as geminiService from './services/geminiService';

// --- MAIN APPLICATION IMPORTS --- //
import type { User, View, TranslationMode, Conversation, LibraryItem, ChatMessage, UserRole, TranslationResult } from './types';

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
import Chat from './components/Chat';
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
import { LogoIcon, SearchIcon, TranslateIcon, LiveIcon, MicrophoneIcon, GlobeIcon, BoltIcon, LockIcon, ThinkingIcon, BusinessIcon } from './components/Icons';

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

    // Trial Expiration Notification State
    const [isTrialExpiredModalOpen, setIsTrialExpiredModalOpen] = useState(false);

    // State for Library->Studio integration
    const [studioInitialText, setStudioInitialText] = useState('');

    // Chat State
    const [sourceLang, setSourceLang] = useState('en');
    const [targetLang, setTargetLang] = useState('sw');
    const [chatTone, setChatTone] = useState('Friendly');

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

    const checkTrialStatus = async (user: User) => {
        if (user.plan === 'Premium' && user.trial_start_date) {
            const startDate = new Date(user.trial_start_date);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 7) {
                // Trial Expired: Downgrade locally and in DB
                const updatedUser = { ...user, plan: 'Free' as const };
                setCurrentUser(updatedUser);
                setIsTrialExpiredModalOpen(true);

                try {
                    await supabase.from('profiles').update({ plan: 'Free' }).eq('id', user.id);
                } catch (error) {
                    console.error("Error downgrading plan:", error);
                }
            }
        }
    };

    const handlePaymentSuccess = async (planName: string) => {
        if (!currentUser) return;
        const updatedUser = { ...currentUser, plan: planName as any };
        setCurrentUser(updatedUser);
        setSelectedPlanForPayment(planName);
        try {
            // Clear trial date if they purchase a plan
            await supabase.from('profiles').update({ plan: planName, trial_start_date: null }).eq('id', currentUser.id);
            const { data: refreshedData } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
            if (refreshedData) setCurrentUser(refreshedData as User);
        } catch (error) { console.error("Error updating plan:", error); }
        setCurrentView('paymentSuccess');
    };

    // Check for payment redirect URL params (safety for redirect-based flows)
    useEffect(() => {
        if (currentUser) {
            const queryParams = new URLSearchParams(window.location.search);
            const success = queryParams.get('payment_success');
            const plan = queryParams.get('plan');

            if (success === 'true' && plan) {
                // Handle success from redirect
                handlePaymentSuccess(plan);
                // Clean URL
                window.history.replaceState({}, '', window.location.pathname);
            }
        }
    }, [currentUser]);

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                let { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                
                // If it was a signup, verify trial data is set (in case DB trigger didn't handle it)
                if (wasSignup && data && (!data.trial_start_date || data.plan !== 'Premium')) {
                     const trialStart = new Date().toISOString();
                     // Force update
                     await supabase.from('profiles').update({
                         plan: 'Premium',
                         trial_start_date: trialStart
                     }).eq('id', session.user.id);
                     
                     // Use updated data for local state
                     data = { ...data, plan: 'Premium', trial_start_date: trialStart };
                }

                if (data) {
                    const user = data as User;
                    setCurrentUser(user);
                    checkTrialStatus(user); // Check if trial has expired
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
    
    const fetchConversations = async () => {
        if (!currentUser) return;
        const { data } = await supabase.from('conversations').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
        setConversations(data || []);
    };

    useEffect(() => {
        if (!currentUser) return;
        fetchLibraryItems();
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
        if (view === 'chat' && currentMode !== 'chat' && currentMode !== 'studio') {
             // Default to Studio if switching back to chat view from other views
             setCurrentMode('studio');
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
        handleSetView('chat');
        setCurrentMode('chat');
    };

    const handleSelectConversation = async (id: number) => {
        setIsLoading(true);
        handleSetView('chat');
        setCurrentMode('chat'); // Assuming history items are chat conversations
        const { data: convoData } = await supabase.from('conversations').select('*').eq('id', id).single();
        if (convoData) {
            const { data: messagesData } = await supabase.from('chat_messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true });
            setActiveConversation({ ...convoData, messages: messagesData as ChatMessage[] });
        }
        setIsLoading(false);
    };

    const handleDeleteConversation = async (id: number) => {
        setDeletingConversationId(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteConversation = async () => {
        if (deletingConversationId) {
            await supabase.from('conversations').delete().eq('id', deletingConversationId);
            if (activeConversation?.id === deletingConversationId) {
                setActiveConversation(null);
                handleNewChat();
            }
            fetchConversations();
        }
        setIsDeleteModalOpen(false);
        setDeletingConversationId(null);
    };

    const handleSendMessage = async (text: string, attachments: File[], audioSourceFileName: string | null) => {
        if (!currentUser) return;
        setIsLoading(true);

        let convoId = activeConversation?.id;

        // Create conversation if it doesn't exist
        if (!convoId) {
            const { data: newConvo, error } = await supabase.from('conversations').insert({
                user_id: currentUser.id,
                title: text.slice(0, 30) + (text.length > 30 ? '...' : ''),
                sourceLang,
                targetLang,
                tone: chatTone
            }).select().single();
            
            if (newConvo) {
                convoId = newConvo.id;
                setActiveConversation({ ...newConvo, messages: [] });
                fetchConversations();
            }
        }

        if (!convoId) {
            setIsLoading(false);
            return;
        }

        // Add User Message Optimistically
        const optimisticUserMsg: ChatMessage = {
            id: Date.now(),
            conversation_id: convoId,
            role: 'user',
            originalText: text,
            attachments: attachments.map(f => ({ name: f.name, type: f.type })),
            originalAudioFileName: audioSourceFileName || undefined,
            created_at: new Date().toISOString()
        };

        setActiveConversation(prev => prev ? ({...prev, messages: [...prev.messages, optimisticUserMsg]}) : null);

        // Save User Message to DB
        await supabase.from('chat_messages').insert({
            conversation_id: convoId,
            role: 'user',
            originalText: text,
            originalAudioFileName: audioSourceFileName
        });

        // Get AI Response
        try {
            const result = await geminiService.getNuancedTranslation(text, sourceLang, targetLang, chatTone, attachments);
            
            const aiMsg: ChatMessage = {
                id: Date.now() + 1,
                conversation_id: convoId,
                role: 'ai',
                originalText: result.directTranslation, // Storing direct as text, nuanced as translation obj
                translation: result,
                created_at: new Date().toISOString()
            };

            // Save AI Message to DB
            await supabase.from('chat_messages').insert({
                conversation_id: convoId,
                role: 'ai',
                originalText: result.directTranslation,
                translation: result
            });

            setActiveConversation(prev => prev ? ({...prev, messages: [...prev.messages, aiMsg]}) : null);

        } catch (error) {
            console.error("Chat error:", error);
            // Add error message to chat
             const errorMsg: ChatMessage = {
                id: Date.now() + 1,
                conversation_id: convoId,
                role: 'ai',
                originalText: "I apologize, but I encountered an error processing your request. Please try again.",
                created_at: new Date().toISOString()
            };
             setActiveConversation(prev => prev ? ({...prev, messages: [...prev.messages, errorMsg]}) : null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectLibraryItem = (item: LibraryItem) => {
        handleSetView('chat');
        setCurrentMode('studio');
        setStudioInitialText(item.text);
    };

    // --- ADMIN ACTIONS ---
    const handleAddItem = async (item: Omit<LibraryItem, 'id'>) => {
        await supabase.from('library_items').insert(item);
        fetchLibraryItems();
    };

    const handleUpdateItem = async (item: LibraryItem) => {
        await supabase.from('library_items').update(item).eq('id', item.id);
        fetchLibraryItems();
    };

    const handleDeleteItem = async (itemId: number) => {
        await supabase.from('library_items').delete().eq('id', itemId);
        fetchLibraryItems();
    };

    const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
        try {
            const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
            if (error) throw error;
            setAllUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error("Error updating user role:", error);
        }
    };

    const renderContent = () => {
        if (currentView === 'onboarding' && currentUser) return <OnboardingAgent user={currentUser} onComplete={(u) => { setCurrentUser(u); setCurrentView('chat'); }} />;
        if (currentView === 'profile' && currentUser) return <ProfileDashboard user={currentUser} onUpdateUser={setCurrentUser} />;
        if (currentView === 'library') return <Library libraryItems={libraryItems} onSelectExample={handleSelectLibraryItem} />;
        if (currentView === 'pricing') return <Pricing onChoosePlan={(plan) => {setSelectedPlanForPayment(plan); setCurrentView('payment');}} onContactSales={() => setCurrentView('contact')} currentUserPlan={currentUser?.plan || 'Free'} />;
        if (currentView === 'payment') return <Payment selectedItemName={selectedPlanForPayment} onBack={() => setCurrentView('pricing')} onPaymentSuccess={handlePaymentSuccess} />;
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
            case 'chat': return <Chat 
                isOffline={isOffline}
                messages={activeConversation?.messages || []}
                onSendMessage={handleSendMessage}
                onRateMessage={() => {}}
                sourceLang={sourceLang}
                targetLang={targetLang}
                tone={chatTone}
                onSourceLangChange={setSourceLang}
                onTargetLangChange={setTargetLang}
                onToneChange={setChatTone}
                isLoading={isLoading}
            />;
            case 'studio':
            default:
                return <Studio isOffline={isOffline} initialText={studioInitialText} />;
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
    
    const viewsWithoutPadding: (View | TranslationMode)[] = ['live', 'chat', 'studio', 'script', 'book', 'meetings', 'transcriber', 'onboarding'];
    const shouldHavePadding = !viewsWithoutPadding.includes(currentView) && !viewsWithoutPadding.includes(currentMode);

    return (
      <div className="flex h-screen w-screen bg-bg-main font-sans text-text-primary overflow-hidden relative">
          <Sidebar
              conversations={conversations}
              currentConversationId={activeConversation?.id || null}
              currentView={currentView}
              currentMode={currentMode}
              onNewChat={handleNewChat}
              onSelectConversation={handleSelectConversation}
              onDeleteConversation={handleDeleteConversation}
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
                  <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                    <div className={shouldHavePadding ? "p-4 sm:p-6 lg:p-8 h-full" : "h-full"}>
                        {renderContent()}
                    </div>
                  </div>
                  <Footer onShowTerms={() => handleSetView('terms')} onShowPrivacy={() => handleSetView('privacy')} onShowLanding={onShowLanding} />
              </main>
          </div>
          <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} highlightedPlan={highlightedPlan} onChoosePlan={(plan) => { setSelectedPlanForPayment(plan); setIsUpgradeModalOpen(false); setCurrentView('payment'); }} onContactSales={() => { setIsUpgradeModalOpen(false); setCurrentView('contact');}} />
          <ConfirmationModal 
            isOpen={isDeleteModalOpen} 
            onClose={() => setIsDeleteModalOpen(false)} 
            onConfirm={confirmDeleteConversation} 
            title="Delete Conversation" 
            message="Are you sure you want to delete this conversation? This action cannot be undone."
          />
          {/* Trial Expiration Modal */}
          <ConfirmationModal 
            isOpen={isTrialExpiredModalOpen}
            onClose={() => setIsTrialExpiredModalOpen(false)}
            onConfirm={() => { setIsTrialExpiredModalOpen(false); setIsUpgradeModalOpen(true); }}
            title="Free Trial Expired"
            message="Your 7-day Premium trial has ended. Your account has been reverted to the Free plan. To continue using Premium features like voice translation and unlimited access, please upgrade."
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
                        <section className="py-24 lg:py-32 relative overflow-hidden bg-bg-main text-center">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(244,163,0,0.08),transparent_50%)]"></div>
                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                            
                            <div className="container mx-auto px-4 relative z-10">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest mb-8 animate-fade-in backdrop-blur-md">
                                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse-slow"></span>
                                    The Enterprise Standard for African Localization
                                </div>
                                
                                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-brand font-bold text-white tracking-tight mb-6 animate-slide-in-up">
                                    Unlock the World's Next <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-yellow-200 to-accent animate-shimmer">Global Growth Engine.</span>
                                </h1>
                                
                                <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-text-secondary leading-relaxed mb-10 animate-slide-in-up [animation-delay:200ms]">
                                    AfriTranslate Studio is the first AI infrastructure designed to bridge the gap between global business and African cultural reality. Scale operations, marketing, and support across 54 countries with culturally intelligent automation.
                                </p>
                                
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-in-up [animation-delay:400ms]">
                                    <button onClick={() => onStart('chat')} className="w-full sm:w-auto px-8 py-4 bg-accent text-bg-main text-sm font-black rounded-xl hover:scale-105 transition-all shadow-[0_0_30px_-5px_rgba(244,163,0,0.4)]">
                                        LAUNCH STUDIO
                                    </button>
                                    <button onClick={() => document.getElementById('capabilities')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white text-sm font-bold rounded-xl hover:bg-white/10 transition-all">
                                        VIEW CAPABILITIES
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section className="py-8 border-y border-white/5 bg-black/40 overflow-hidden">
                            <div className="container mx-auto px-4">
                                <p className="text-center text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-6">Trusted by Industry Leaders & Institutions</p>
                                <div className="flex justify-center items-center gap-12 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                                    {['Netflix', 'MTN', 'Google', 'Standard Bank', 'UCT', 'MultiChoice', 'Microsoft'].map(logo => (
                                        <span key={logo} className="text-lg md:text-xl font-bold text-white whitespace-nowrap">{logo}</span>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section className="py-24 bg-bg-surface/30">
                            <div className="container mx-auto px-4 max-w-6xl">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                                    <div className="space-y-8">
                                        <div>
                                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">The Context Gap</h2>
                                            <div className="h-1 w-20 bg-accent rounded-full"></div>
                                        </div>
                                        <p className="text-lg text-text-secondary leading-relaxed">
                                            Generic AI models treat language as a math problem, stripping away the cultural nuance that drives connection. This leads to costly misunderstandings and brand alienation in high-context African markets.
                                        </p>
                                        <div className="space-y-4">
                                            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex gap-4">
                                                <div className="mt-1 w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
                                                <div>
                                                    <h4 className="text-white font-bold text-sm mb-1">Generic Translation Risk</h4>
                                                    <p className="text-xs text-text-secondary">Literal translations of idioms or slogans often become offensive or nonsensical.</p>
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-xl bg-accent/5 border border-accent/10 flex gap-4">
                                                <div className="mt-1 w-2 h-2 rounded-full bg-accent flex-shrink-0"></div>
                                                <div>
                                                    <h4 className="text-white font-bold text-sm mb-1">The AfriTranslate Advantage</h4>
                                                    <p className="text-xs text-text-secondary">Our Neural Nuance Engine™ adapts tone, hierarchy, and dialect for authentic resonance.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-purple-600/20 rounded-full blur-[100px] opacity-30"></div>
                                        <div className="relative bg-bg-main border border-white/10 rounded-2xl p-8 shadow-2xl animate-float">
                                            <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            </div>
                                            <div className="space-y-4 font-mono text-xs">
                                                <div>
                                                    <p className="text-text-secondary mb-1">// Input: English (Marketing Slogan)</p>
                                                    <p className="text-white bg-white/5 p-2 rounded">"Come alive with our spicy wings."</p>
                                                </div>
                                                <div>
                                                    <p className="text-text-secondary mb-1">// Generic AI Output (Zulu)</p>
                                                    <p className="text-red-400 bg-red-500/10 p-2 rounded">"Vuka ngezimpiko zethu ezibabayo." <br/><span className="text-[10px] opacity-70">(Literal: Wake up from death with our painful wings)</span></p>
                                                </div>
                                                <div>
                                                    <p className="text-text-secondary mb-1">// AfriTranslate Engine (Zulu - Urban)</p>
                                                    <p className="text-accent bg-accent/10 p-2 rounded border-l-2 border-accent">"Izwa umlilo wempilo ngamawings ethu!" <br/><span className="text-[10px] opacity-70">(Nuanced: Feel the fire of life with our wings!)</span></p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section id="capabilities" className="py-24 bg-bg-main">
                            <div className="container mx-auto px-4 max-w-6xl">
                                <div className="text-center mb-16">
                                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Platform Capabilities</h2>
                                    <p className="text-text-secondary">A comprehensive suite of tools for the modern enterprise.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[
                                        { title: "Live Voice Relay", desc: "Real-time audio translation for cross-border meetings with < 2s latency.", icon: <LiveIcon className="w-6 h-6"/>, color: "text-red-400" },
                                        { title: "Script Localization", desc: "Preserve narrative arcs and character voices for media & entertainment.", icon: <ThinkingIcon className="w-6 h-6"/>, color: "text-purple-400" },
                                        { title: "Meeting Intelligence", desc: "Automated transcription and summarization for pan-African teams.", icon: <BusinessIcon className="w-6 h-6"/>, color: "text-blue-400" },
                                        { title: "Email Adaptation", desc: "Adjust formality and etiquette for government or executive correspondence.", icon: <BoltIcon className="w-6 h-6"/>, color: "text-yellow-400" },
                                        { title: "Technical Lexicons", desc: "Specialized models for Medical, Legal, and Engineering terminology.", icon: <LockIcon className="w-6 h-6"/>, color: "text-green-400" },
                                        { title: "Visual Arts Engine", desc: "Generate culturally accurate imagery and motion graphics.", icon: <GlobeIcon className="w-6 h-6"/>, color: "text-pink-400" },
                                    ].map((card, i) => (
                                        <div key={i} className="group p-6 bg-bg-surface border border-white/5 rounded-2xl hover:border-accent/30 transition-all hover:-translate-y-1">
                                            <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 ${card.color} group-hover:bg-white/10 transition-colors`}>
                                                {card.icon}
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-2">{card.title}</h3>
                                            <p className="text-sm text-text-secondary leading-relaxed">{card.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section className="py-20 bg-bg-surface/20 border-y border-white/5">
                            <div className="container mx-auto px-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/5">
                                    {[
                                        { label: "Dialects Supported", val: "2,000+" },
                                        { label: "Cultural Accuracy", val: "99.4%" },
                                        { label: "Latency (Voice)", val: "< 1.5s" },
                                        { label: "Compliant Security", val: "SOC2" }
                                    ].map((stat, i) => (
                                        <div key={i} className="p-4">
                                            <div className="text-3xl md:text-5xl font-black text-white mb-2">{stat.val}</div>
                                            <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <div id="demo-section" className="py-20 border-b border-border-default bg-bg-surface/30">
                            <DemoSection isLandingSection={true} />
                        </div>

                        <section className="py-32 bg-gradient-to-b from-bg-main to-bg-surface border-t border-white/5 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(244,163,0,0.15),transparent_70%)]"></div>
                            <div className="container mx-auto px-4 relative z-10 max-w-4xl">
                                <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">Ready to localize your impact?</h2>
                                <p className="text-lg text-text-secondary mb-12 max-w-2xl mx-auto">
                                    Join the creators, enterprises, and NGOs using AfriTranslate to speak the language of their audience, not just their words.
                                </p>
                                <button onClick={() => onStart('chat')} className="px-12 py-5 bg-accent text-bg-main text-base font-black rounded-2xl hover:scale-105 transition-all shadow-xl shadow-accent/20">
                                    GET STARTED FOR FREE
                                </button>
                                <p className="mt-6 text-xs text-text-secondary uppercase tracking-widest">No credit card required • 7-Day Free Trial</p>
                            </div>
                        </section>
                    </>
                );
        }
    };

    return (
        <div className="bg-bg-main h-screen text-text-primary selection:bg-accent selection:text-bg-main overflow-x-hidden overflow-y-auto custom-scrollbar flex flex-col">
            <header className="sticky top-0 z-50 bg-bg-main/80 backdrop-blur-md border-b border-border-default h-16 flex-shrink-0">
                <div className="container mx-auto px-4 h-full flex items-center justify-between">
                    <button onClick={() => setCurrentView('home')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <LogoIcon className="w-6 h-6 text-accent" />
                        <span className="text-sm sm:text-base font-brand font-bold text-white tracking-tighter">AfriTranslate Studio</span>
                    </button>
                    <nav className="hidden lg:flex items-center gap-8">
                        <button onClick={() => setCurrentView('about')} className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${currentView === 'about' ? 'text-accent' : 'text-text-secondary hover:text-white'}`}>Mission</button>
                        <button onClick={() => setCurrentView('useCases')} className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${currentView === 'useCases' ? 'text-accent' : 'text-text-secondary hover:text-white'}`}>Solutions</button>
                        <button onClick={() => setCurrentView('testimonials')} className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${currentView === 'testimonials' ? 'text-accent' : 'text-text-secondary hover:text-white'}`}>Impact</button>
                    </nav>
                    <button onClick={() => onStart('chat')} className="px-5 py-2 bg-white text-bg-main font-bold text-[11px] rounded-lg hover:bg-accent hover:text-black transition-colors uppercase tracking-wide">
                        Launch App
                    </button>
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
        // On sign up, explicitly set metadata for the trial
        const { error } = await supabase.auth.signUp({ 
            email, 
            password: pass, 
            options: { 
                data: { 
                    name,
                    plan: 'Premium',
                    trial_start_date: new Date().toISOString()
                } 
            } 
        });
        
        return !error;
    };

    const handleGoogleLogin = async () => {
        wasJustSignedUpRef.current = false;
        await supabase.auth.signInWithOAuth({ provider: 'google' });
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
