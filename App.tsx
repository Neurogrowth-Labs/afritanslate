
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

// --- MAIN APPLICATION IMPORTS --- //
import type { User, View, TranslationMode, Conversation, LibraryItem, ChatMessage, UserRole } from './types';

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

        // Update database and verify
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ plan: planName })
                .eq('id', currentUser.id);
            
            if (error) throw error;

            // Re-fetch profile to ensure sync and get any triggered fields
            const { data: refreshedData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single();
            
            if (refreshedData) {
                setCurrentUser(refreshedData as User);
            }
        } catch (error) {
            console.error("Error updating plan:", error);
        }

        setCurrentView('paymentSuccess');
    };

    const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
        try {
            const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
            if (error) throw error;
            
            // Refresh users list locally
            setAllUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error("Error updating user role:", error);
            // Optionally set an error state here to display in the admin portal
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
        return <AdminPortal 
            currentLibrary={libraryItems} 
            users={allUsers} 
            onAddItem={() => fetchLibraryItems()} 
            onUpdateItem={() => fetchLibraryItems()} 
            onDeleteItem={() => fetchLibraryItems()} 
            onLogout={handleLogout} 
            currentUser={currentUser}
            onUpdateUserRole={handleUpdateUserRole}
        />;
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
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(244,163,0,0.08),transparent)]"></div>
                            <div className="container mx-auto px-4 relative z-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold uppercase tracking-widest mb-6 animate-fade-in">
                                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                                    The Enterprise Standard for African Localization
                                </div>
                                <h1 className="text-4xl sm:text-6xl md:text-7xl font-brand font-bold text-white tracking-tighter mb-6 animate-slide-in-up leading-tight">
                                    Unlock the World's Next <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow-200">Global Growth Engine.</span>
                                </h1>
                                <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base text-text-secondary leading-relaxed mb-10 animate-slide-in-up">
                                    AfriTranslate Studio is the first AI infrastructure designed to bridge the gap between global business and African cultural reality. Scale operations, marketing, and support across 54 countries with culturally intelligent automation.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-in-up">
                                    <button onClick={() => onStart('chat')} className="px-8 py-4 bg-accent text-bg-main text-xs font-black rounded-xl hover:scale-105 transition-all shadow-xl shadow-accent/20 flex items-center gap-2">
                                        LAUNCH STUDIO <span className="text-lg">→</span>
                                    </button>
                                    <button onClick={() => setCurrentView('about')} className="px-8 py-4 bg-bg-surface border border-border-default text-white text-xs font-bold rounded-xl hover:bg-white/5 transition-all">
                                        VIEW CAPABILITIES
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Strategic Stats */}
                        <section className="py-10 border-y border-border-default bg-bg-surface/30">
                            <div className="container mx-auto px-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                                    <div>
                                        <p className="text-3xl font-bold text-white">2,000+</p>
                                        <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">Dialects Supported</p>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold text-white">99.8%</p>
                                        <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">Cultural Accuracy</p>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold text-white">500ms</p>
                                        <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">Latency (Voice)</p>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold text-white">GDPR</p>
                                        <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">Compliant Security</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Value Proposition Grid */}
                        <section className="py-20 bg-bg-main">
                            <div className="container mx-auto px-4">
                                <div className="text-center mb-16">
                                    <h2 className="text-3xl font-bold text-white mb-4">Strategic Advantages</h2>
                                    <p className="text-text-secondary max-w-2xl mx-auto">Why Fortune 500 companies and NGOs choose AfriTranslate for their African expansion strategies.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Card 1 */}
                                    <div className="p-8 rounded-2xl bg-bg-surface border border-border-default hover:border-accent/50 transition-all group">
                                        <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-accent group-hover:text-bg-main transition-colors text-accent">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-3">Hyper-Localization at Scale</h3>
                                        <p className="text-sm text-text-secondary leading-relaxed">
                                            Move beyond generic translation. Our engine adapts content to regional dialects, ensuring your marketing resonates with Hausa speakers in Kano differently than Yoruba speakers in Lagos.
                                        </p>
                                    </div>
                                    {/* Card 2 */}
                                    <div className="p-8 rounded-2xl bg-bg-surface border border-border-default hover:border-accent/50 transition-all group">
                                        <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-accent group-hover:text-bg-main transition-colors text-accent">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" /></svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-3">Brand Safety & Nuance</h3>
                                        <p className="text-sm text-text-secondary leading-relaxed">
                                            Avoid costly cultural misunderstandings. Our system flags potential taboos and suggests culturally appropriate alternatives for sensitive topics.
                                        </p>
                                    </div>
                                    {/* Card 3 */}
                                    <div className="p-8 rounded-2xl bg-bg-surface border border-border-default hover:border-accent/50 transition-all group">
                                        <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-accent group-hover:text-bg-main transition-colors text-accent">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-3">Seamless Integration</h3>
                                        <p className="text-sm text-text-secondary leading-relaxed">
                                            Connect AfriTranslate directly into your CMS, CRM, or support platform via our robust API. Designed for developers, optimized for enterprise.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Partners / Trusted By Section */}
                        <section className="py-16 bg-[#0a0a0a] border-y border-border-default">
                            <div className="container mx-auto px-4 text-center">
                                <p className="text-xs text-text-secondary uppercase tracking-[0.2em] font-bold mb-12">Trusted by Industry Leaders & Institutions</p>
                                <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-10 opacity-60 hover:opacity-100 transition-opacity duration-500">
                                    <h3 className="text-2xl font-bold text-white font-serif">Harvard</h3>
                                    <h3 className="text-2xl font-bold text-white tracking-tighter">NETFLIX</h3>
                                    <h3 className="text-2xl font-bold text-white italic">MTN</h3>
                                    <h3 className="text-2xl font-bold text-white font-mono">Google</h3>
                                    <h3 className="text-lg font-bold text-white tracking-wide">UNIVERSITY OF CAPE TOWN</h3>
                                    <h3 className="text-2xl font-bold text-white tracking-widest font-black">CANAL+</h3>
                                    <h3 className="text-2xl font-bold text-white font-serif italic">Standard Bank</h3>
                                    <h3 className="text-2xl font-bold text-white font-brand">EbonyLife</h3>
                                    <h3 className="text-2xl font-bold text-white tracking-[0.2em]">UNILEVER</h3>
                                    <h3 className="text-2xl font-bold text-white font-black">DANGOTE</h3>
                                </div>
                            </div>
                        </section>

                        {/* Interactive Demo Wrapper */}
                        <div id="demo-section" className="py-20 bg-bg-surface/30">
                            <DemoSection isLandingSection={true} />
                        </div>

                        {/* CTA Section */}
                        <section className="py-24 text-center">
                            <div className="container mx-auto px-4">
                                <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">Ready to expand your reach?</h2>
                                <p className="text-text-secondary max-w-xl mx-auto mb-10">Join 10,000+ creators, businesses, and NGOs using AfriTranslate to connect authentically with the African continent.</p>
                                <button onClick={() => onStart('chat')} className="px-10 py-4 bg-white text-bg-main font-bold rounded-xl hover:bg-gray-200 transition-colors shadow-2xl">
                                    Get Started for Free
                                </button>
                            </div>
                        </section>
                    </>
                );
        }
    };

    return (
        <div className="bg-bg-main h-full text-text-primary selection:bg-accent selection:text-bg-main overflow-x-hidden overflow-y-auto custom-scrollbar flex flex-col">
            <header className="sticky top-0 z-50 bg-bg-main/80 backdrop-blur-md border-b border-border-default h-14 flex-shrink-0">
                <div className="container mx-auto px-4 h-full flex items-center justify-between">
                    <button onClick={() => setCurrentView('home')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <LogoIcon />
                        <span className="text-sm sm:text-base font-brand font-bold text-white tracking-tighter">AfriTranslate AI</span>
                    </button>
                    <nav className="hidden lg:flex items-center gap-6">
                        <button onClick={() => setCurrentView('about')} className={`text-[11px] font-semibold transition-colors ${currentView === 'about' ? 'text-accent' : 'text-text-secondary hover:text-white'}`}>About</button>
                        <button onClick={() => setCurrentView('useCases')} className={`text-[11px] font-semibold transition-colors ${currentView === 'useCases' ? 'text-accent' : 'text-text-secondary hover:text-white'}`}>Use Cases</button>
                        <button onClick={() => setCurrentView('testimonials')} className={`text-[11px] font-semibold transition-colors ${currentView === 'testimonials' ? 'text-accent' : 'text-text-secondary hover:text-white'}`}>Testimonials</button>
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
