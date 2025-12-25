
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
import { LogoIcon, SearchIcon, TranslateIcon, LiveIcon, MicrophoneIcon } from './components/Icons';

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
        const { data: convoData } = await supabase.from('conversations').select('*').eq('id', id).single();
        if (convoData) {
            const { data: messagesData } = await supabase.from('chat_messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true });
            setActiveConversation({ ...convoData, messages: messagesData as ChatMessage[] });
        }
        setIsLoading(false);
    };

    const handlePaymentSuccess = async (planName: string) => {
        if (!currentUser) return;

        // Optimistically update local state to reflect plan change immediately
        const updatedUser = { ...currentUser, plan: planName as any };
        setCurrentUser(updatedUser);
        setSelectedPlanForPayment(planName);

        // Update database
        try {
            await supabase
                .from('profiles')
                .update({ plan: planName })
                .eq('id', currentUser.id);
        } catch (error) {
            console.error("Error updating plan:", error);
        }

        setCurrentView('paymentSuccess');
    };

    const renderContent = () => {
        if (currentView === 'onboarding' && currentUser) return <OnboardingAgent user={currentUser} onComplete={(u) => { setCurrentUser(u); setCurrentView('chat'); }} />;
        if (currentView === 'profile' && currentUser) return <ProfileDashboard user={currentUser} onUpdateUser={setCurrentUser} />;
        if (currentView === 'library') return <Library libraryItems={libraryItems} onSelectExample={() => {}} />;
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
            case 'meetings': return <MeetingSummarizer />;
            case 'email': return <EmailTranslator />;
            case 'transcriber': return <AudioTranscriber />;
            case 'chat':
            default:
                return <Studio isOffline={isOffline} />;
        }
    };
    
    if (!currentUser) return null;

    if (currentUser.role === 'admin') {
        return <AdminPortal currentLibrary={libraryItems} users={allUsers} onAddItem={() => fetchLibraryItems()} onUpdateItem={() => fetchLibraryItems()} onDeleteItem={() => fetchLibraryItems()} onLogout={handleLogout} currentUser={currentUser} />;
    }
    
    const viewsWithoutPadding: (View | TranslationMode)[] = ['live', 'chat', 'script', 'book', 'meetings', 'transcriber', 'onboarding'];
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
                  <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                    <div className={shouldHavePadding ? "p-4 sm:p-6 lg:p-8 h-full" : "h-full"}>
                        {renderContent()}
                    </div>
                  </div>
                  <Footer onShowTerms={() => handleSetView('terms')} onShowPrivacy={() => handleSetView('privacy')} onShowLanding={onShowLanding} />
              </main>
          </div>
          <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} highlightedPlan={highlightedPlan} onChoosePlan={(plan) => { setSelectedPlanForPayment(plan); setIsUpgradeModalOpen(false); setCurrentView('payment'); }} onContactSales={() => { setIsUpgradeModalOpen(false); setCurrentView('contact');}} />
      </div>
    );
};

// --- LANDING PAGE --- //
const LandingPage: React.FC<{ initialView?: View; onStart: (view?: View) => void }> = ({ initialView = 'home', onStart }) => {
    // FIX: With 'home' added to the View type, the 'as any' cast is no longer needed.
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
                        <section className="py-20 md:py-32 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(244,163,0,0.04),transparent)]"></div>
                            <div className="container mx-auto px-4 relative z-10">
                                <h1 className="text-3xl sm:text-5xl md:text-6xl font-brand font-bold text-white tracking-tighter mb-4 animate-slide-in-up">
                                    Beyond Words. <br />
                                    <span className="text-accent">Pure Culture.</span>
                                </h1>
                                <p className="mt-4 max-w-lg mx-auto text-xs sm:text-sm text-text-secondary leading-relaxed mb-8 animate-slide-in-up">
                                    World's most advanced cultural localization engine. We bridge heritage, idioms, and social nuances in real-time.
                                </p>
                                <button onClick={() => onStart('chat')} className="px-8 py-3 bg-accent text-bg-main text-[12px] font-black rounded-lg hover:scale-105 transition-all shadow-xl">
                                    START LOCALIZING
                                </button>
                            </div>
                        </section>
                        <div id="demo-section" className="py-12 border-y border-border-default bg-bg-surface/30">
                            <DemoSection isLandingSection={true} />
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="bg-bg-main min-h-screen text-text-primary selection:bg-accent selection:text-bg-main overflow-x-hidden overflow-y-auto custom-scrollbar flex flex-col">
            <header className="sticky top-0 z-50 bg-bg-main/80 backdrop-blur-md border-b border-border-default h-14 flex-shrink-0">
                <div className="container mx-auto px-4 h-full flex items-center justify-between">
                    <button onClick={() => setCurrentView('home')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <LogoIcon />
                        <span className="text-sm sm:text-base font-brand font-bold text-white tracking-tighter">AfriTranslate AI</span>
                    </button>
                    <nav className="hidden lg:flex items-center gap-6">
                        <button onClick={() => setCurrentView('about')} className={`text-[11px] font-semibold transition-colors ${currentView === 'about' ? 'text-accent' : 'text-text-secondary hover:text-white'}`}>About</button>
                        <button onClick={() => setCurrentView('useCases')} className={`text-[11px] font-semibold transition-colors ${currentView === 'useCases' ? 'text-accent' : 'text-text-secondary hover:text-white'}`}>Use Cases</button>
                        <button onClick={() => setCurrentView('testimonials')} className={`text-[11px] font-semibold transition-colors ${currentView === 'testimonials' ? 'text-accent' : 'text-text-secondary hover:text-white'}`}>Users</button>
                    </nav>
                    <button onClick={() => onStart('chat')} className="px-4 py-1.5 bg-accent text-bg-main font-bold text-[11px] rounded hover:scale-105 transition-all">Launch Studio</button>
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
