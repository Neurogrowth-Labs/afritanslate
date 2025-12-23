import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// --- MAIN APPLICATION IMPORTS --- //
import type { User, View, TranslationMode, Conversation, LibraryItem, ChatMessage, MessageAttachment } from './types';
import * as geminiService from './services/geminiService';
import { getOfflineTranslation } from './services/offlineService';

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
import Chat from './components/Chat';
import Studio from './components/Studio';
import AdminPortal from './components/AdminPortal';
import LiveConversation from './components/LiveConversation';
import AudioTranscriber from './components/AudioTranscriber';
import DemoSection from './components/DemoSection';
import AboutPage from './components/AboutPage';
import DemoPage from './components/DemoPage';
import UseCasesPage from './components/UseCasesPage';
import TestimonialsPage from './components/TestimonialsPage';
import VideoGenerator from './components/VideoGenerator';
import ConfirmationModal from './components/ConfirmationModal';
import { LogoIcon, BusinessIcon, MediaIcon, EducationIcon, HealthcareIcon, LinkedInIcon, TwitterIcon, InstagramIcon, YouTubeIcon } from './components/Icons';


// --- PLACEHOLDER COMPONENTS --- //
const ImageGenerator: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
        <h1 className="text-4xl font-bold text-text-primary">Image Generation</h1>
        <p className="text-lg text-text-secondary mt-2 max-w-2xl">Create stunning cultural visuals. Simply describe the scene you want to visualize.</p>
        <Chat isOffline={false} isVisualMode={true} messages={[]} onSendMessage={() => {}} onRateMessage={() => {}} sourceLang="en" targetLang="sw" tone="Friendly" isLoading={false} onSourceLangChange={() => {}} onTargetLangChange={() => {}} onToneChange={() => {}} />
    </div>
);

const EmailTranslator: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
        <h1 className="text-4xl font-bold text-text-primary">Email Translator</h1>
        <p className="text-lg text-text-secondary mt-2 max-w-2xl">Connect your Gmail account to translate emails directly in your inbox.</p>
        <button className="mt-6 px-6 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50" disabled>
            Coming Soon
        </button>
    </div>
);


// --- TRANSLATOR APP --- //
const TranslatorApp: React.FC<{ onShowLanding: () => void; initialView?: View; }> = ({ onShowLanding, initialView = 'chat' }) => {
    // --- STATE MANAGEMENT --- //
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [authError, setAuthError] = useState<string | null>(null);

    const [conversations, setConversations] = useState<(Omit<Conversation, 'messages'>)[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
    
    const [currentView, setCurrentView] = useState<View>(initialView);
    const [currentMode, setCurrentMode] = useState<TranslationMode>('chat');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Modals & Payment
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

    // --- EFFECTS --- //
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
        localStorage.setItem('offlinePacks', JSON.stringify(offlinePacks));
    }, [offlinePacks]);

    // Supabase Auth and Profile Listener
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                if (data) setCurrentUser(data as User);
            } else {
                setCurrentUser(null);
                setConversations([]);
                setActiveConversation(null);
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    const fetchLibraryItems = async () => {
        const { data, error } = await supabase.from('library_items').select('*').order('id', { ascending: false });
        if (error) console.error("Error fetching library items", error);
        else setLibraryItems(data || []);
    };
    
    // Data Fetching Effects
    useEffect(() => {
        if (!currentUser) return;
        
        fetchLibraryItems();

        const fetchConversations = async () => {
            const { data, error } = await supabase.from('conversations').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
            if (error) console.error("Error fetching conversations", error);
            else setConversations(data || []);
        };
        fetchConversations();

        if (currentUser.role === 'admin') {
            const fetchAllUsers = async () => {
                const { data, error } = await supabase.from('profiles').select('*');
                if (error) console.error("Error fetching users for admin", error);
                else setAllUsers(data as User[] || []);
            };
            fetchAllUsers();
        }
    }, [currentUser]);

    // --- AUTH HANDLERS --- //
    const handleLogin = async (email: string, pass: string): Promise<boolean> => {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) { setAuthError(error.message); return false; }
        setAuthError(null); return true;
    };

    const handleSignUp = async (name: string, email: string, pass: string): Promise<boolean> => {
        const { error } = await supabase.auth.signUp({ email, password: pass, options: { data: { name } } });
        if (error) { setAuthError(error.message); return false; }
        setAuthError(null); return true;
    };
    
    const handleLogout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
    };

    // --- LIBRARY HANDLERS --- //
    const handleAddItem = async (item: Omit<LibraryItem, 'id'>) => {
        const { error } = await supabase.from('library_items').insert(item);
        if(error) console.error("Error adding item", error); else await fetchLibraryItems();
    };
    
    const handleUpdateLibraryItem = async (updatedItem: LibraryItem) => {
        const { error } = await supabase.from('library_items').update(updatedItem).eq('id', updatedItem.id);
        if(error) console.error("Error updating item", error); else await fetchLibraryItems();
    };

    const handleDeleteLibraryItem = async (id: number) => {
        const { error } = await supabase.from('library_items').delete().eq('id', id);
        if(error) console.error("Error deleting item", error); else await fetchLibraryItems();
    };
    
    // --- VIEW & MODE HANDLERS --- //
    const handleSetView = (view: View) => {
        setCurrentView(view);
        if (view !== 'chat') setCurrentMode('chat');
        setIsSidebarOpen(false);
    };

    const handleSetMode = (mode: TranslationMode) => {
        setCurrentView('chat');
        setCurrentMode(mode);
        setIsSidebarOpen(false);
    };

    const handleToggleOfflinePack = (langCode: string) => {
        setOfflinePacks(prev => prev.includes(langCode) ? prev.filter(code => code !== langCode) : [...prev, langCode]);
    };
    
    // --- CHAT HANDLERS --- //
    const handleNewChat = () => {
        setActiveConversation(null);
        handleSetView('chat');
        setCurrentMode('chat');
    };

    const handleSelectConversation = async (id: number) => {
        setIsLoading(true);
        handleSetView('chat');
        const { data: convoData, error: convoError } = await supabase.from('conversations').select('*').eq('id', id).single();
        if (convoData) {
            const { data: messagesData, error: messagesError } = await supabase.from('chat_messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true });
            if (messagesData) {
                setActiveConversation({ ...convoData, messages: messagesData as ChatMessage[] });
            }
        }
        setIsLoading(false);
    };

    const openDeleteConversationModal = (id: number) => {
        setDeletingConversationId(id);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConversation = async () => {
        if (!deletingConversationId) return;
        const { error } = await supabase.from('conversations').delete().eq('id', deletingConversationId);
        if (error) console.error("Error deleting conversation", error);
        else {
            setConversations(prev => prev.filter(c => c.id !== deletingConversationId));
            if (activeConversation?.id === deletingConversationId) setActiveConversation(null);
        }
        setIsDeleteModalOpen(false);
        setDeletingConversationId(null);
    };

    const handlePaymentSuccess = async (plan: string) => {
        if (currentUser) {
            const newPlan = plan as User['plan'];
            const { error } = await supabase.from('profiles').update({ plan: newPlan }).eq('id', currentUser.id);
            if (error) console.error("Error updating user plan:", error.message);
            else setCurrentUser(prev => prev ? { ...prev, plan: newPlan } : null);
        }
        setSelectedPlanForPayment(plan);
        setCurrentView('paymentSuccess');
    };
    
    // --- RENDER LOGIC --- //
    const renderContent = () => {
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
        if (currentView === 'demo') return <DemoPage />;
        if (currentView === 'useCases') return <UseCasesPage />;
        if (currentView === 'testimonials') return <TestimonialsPage />;
        
        // Default to 'chat' view which handles different modes
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
    
    if (!currentUser) return <Auth onLogin={handleLogin} onSignUp={handleSignUp} error={authError} setError={setAuthError} />;

    if (currentUser.role === 'admin') {
        return <AdminPortal currentLibrary={libraryItems} users={allUsers} onAddItem={handleAddItem} onUpdateItem={handleUpdateLibraryItem} onDeleteItem={handleDeleteLibraryItem} onLogout={handleLogout} currentUser={currentUser} />;
    }
    
    return (
      <div className="flex h-[100dvh] bg-bg-main font-sans text-text-primary overflow-hidden">
          <Sidebar
              conversations={conversations}
              currentConversationId={activeConversation?.id || null}
              currentView={currentView}
              currentMode={currentMode}
              onNewChat={handleNewChat}
              onSelectConversation={handleSelectConversation}
              onDeleteConversation={openDeleteConversationModal}
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
              onToggleOfflinePack={handleToggleOfflinePack}
          />
          <div className="flex flex-col flex-1 h-full overflow-hidden relative">
              <Header
                  sourceLangName={activeConversation?.sourceLang}
                  targetLangName={activeConversation?.targetLang}
                  isChatActive={currentView === 'chat' && currentMode === 'chat'}
                  currentUser={currentUser}
                  onUpgradeClick={() => { setHighlightedPlan(null); setIsUpgradeModalOpen(true); }}
                  tone={activeConversation?.tone}
                  onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                  isOffline={isOffline}
                  onLogout={handleLogout}
              />
              <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-bg-main scroll-smooth">
                  {renderContent()}
              </main>
              <Footer onShowTerms={() => handleSetView('terms')} onShowPrivacy={() => handleSetView('privacy')} onShowLanding={onShowLanding} />
          </div>
          <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} highlightedPlan={highlightedPlan} onChoosePlan={(plan) => { setSelectedPlanForPayment(plan); setIsUpgradeModalOpen(false); setCurrentView('payment'); }} onContactSales={() => { setIsUpgradeModalOpen(false); setCurrentView('contact');}} />
          <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConversation} title="Delete Conversation" message="Are you sure you want to permanently delete this conversation and all its messages?" />
      </div>
    );
};


// --- LANDING PAGE --- //
const LandingHeader = ({ onStart, onNavigate } : { onStart: () => void, onNavigate: (view: View) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const navLinks = [
        { href: '#about', label: 'About', view: 'about' as View },
        { href: '#demo', label: 'Demo', view: 'demo' as View },
        { href: '#use-cases', label: 'Use Cases', view: 'useCases' as View },
        { href: '#testimonials', label: 'Testimonials', view: 'testimonials' as View },
    ];

    const handleNavClick = (view: View) => {
        onNavigate(view);
        setIsOpen(false);
    }
    
    return (
        <header className="sticky top-0 z-50 bg-brand-bg/80 backdrop-blur-md">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center gap-3">
                        <LogoIcon />
                        <span className="text-xl font-bold text-brand-text-primary">AfriTranslate AI</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8">
                         {navLinks.map(link => (
                            <button key={link.view} onClick={() => handleNavClick(link.view)} className="text-sm font-medium text-brand-text-secondary hover:text-brand-text-primary transition-colors">{link.label}</button>
                         ))}
                    </nav>
                    <div className="flex items-center gap-4">
                        <button onClick={onStart} className="hidden sm:block text-sm font-semibold text-brand-text-primary hover:text-brand-primary transition-colors">Log In</button>
                        <button onClick={onStart} className="px-5 py-2.5 bg-brand-primary text-brand-bg font-bold rounded-lg hover:bg-brand-primary/90 transition-transform hover:scale-105">Try Now</button>
                        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-brand-text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                        </button>
                    </div>
                </div>
            </div>
             {/* Mobile Menu */}
             {isOpen && (
                <div className="md:hidden bg-brand-surface animate-fade-in">
                    <nav className="flex flex-col items-center gap-4 py-4">
                        {navLinks.map(link => (
                            <button key={link.view} onClick={() => handleNavClick(link.view)} className="text-lg font-medium text-brand-text-secondary hover:text-brand-text-primary transition-colors">{link.label}</button>
                        ))}
                    </nav>
                </div>
            )}
        </header>
    );
};

const HeroSection = ({ onStart }: { onStart: () => void }) => (
    <section className="py-20 sm:py-32 bg-brand-bg text-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-brand-text-primary animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
                Translate Beyond Words. <br />
                <span className="text-brand-primary">Connect With Culture.</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-brand-text-secondary animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
                AfriTranslate AI is your bridge to authentic communication, providing real-time, culturally nuanced translations that respect regional idioms, social norms, and tone.
            </p>
            <button onClick={onStart} className="mt-10 px-8 py-4 bg-brand-primary text-brand-bg text-lg font-bold rounded-lg hover:bg-brand-primary/90 transition-transform hover:scale-105 animate-slide-in-up" style={{ animationDelay: '0.5s' }}>
                Start Translating for Free
            </button>
        </div>
    </section>
);

const AboutSection = () => (
    <section id="about" className="py-20 sm:py-24 bg-brand-surface">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <AboutPage isLandingSection />
        </div>
    </section>
);

const AppMockupSection = () => (
    <section className="py-20 sm:py-24 bg-brand-bg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold text-brand-text-primary">A Glimpse Inside AfriTranslate AI</h2>
                <p className="mt-4 text-brand-text-secondary">Experience an intuitive interface designed for seamless, culturally-aware conversations and content creation.</p>
            </div>
            <div className="relative flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
                {/* Mockup 1: Chat Interface */}
                <div className="w-full max-w-lg xl:max-w-xl bg-bg-main rounded-xl border-2 border-border-default/50 p-4 shadow-2xl animate-slide-in-up" style={{ animationDelay: '0.2s', transform: 'rotate(-2deg)' }}>
                    <div className="flex items-center gap-2 pb-3 border-b border-border-default">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <p className="text-xs text-text-secondary ml-auto">Chat Assistant</p>
                    </div>
                    <div className="pt-4 space-y-4 h-64 overflow-hidden">
                        {/* User Message */}
                        <div className="flex justify-end animate-fade-in">
                            <div className="bg-accent text-white p-3 rounded-xl rounded-br-lg max-w-xs text-sm">
                                The early bird catches the worm.
                            </div>
                        </div>
                        {/* AI Message */}
                        <div className="flex justify-start animate-fade-in" style={{animationDelay: '0.5s'}}>
                            <div className="bg-bg-surface text-text-primary p-3 rounded-xl rounded-bl-lg max-w-sm border border-border-default">
                                <p className="text-xs font-semibold text-accent mb-1">Swahili Translation</p>
                                <p className="text-sm">"Ndege wa mapema ndiye apatao mtego."</p>
                                <div className="mt-2 pt-2 border-t border-border-default/50">
                                    <p className="text-xs text-text-secondary">This proverb conveys the same meaning of gaining an advantage by acting early, adapted for cultural resonance.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Mockup 2: Script Translator */}
                <div className="w-full max-w-lg xl:max-w-xl bg-bg-main rounded-xl border-2 border-border-default/50 p-4 shadow-2xl animate-slide-in-up" style={{ animationDelay: '0.4s', transform: 'rotate(2deg)' }}>
                     <div className="flex items-center gap-2 pb-3 border-b border-border-default">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <p className="text-xs text-text-secondary ml-auto">Script Translator</p>
                    </div>
                    <div className="pt-4 font-mono text-xs text-text-secondary h-64 overflow-hidden bg-bg-surface p-2 rounded-md">
                        <p className="text-text-primary uppercase">INT. CAFE - DAY</p><br/>
                        <p className="ml-4 text-text-primary">FEMI</p>
                        <p className="ml-8">I have to go.</p>
                        <p className="ml-8 text-accent/80">Swahili: Lazima niende.</p><br/>
                        <p className="ml-4 text-text-primary">AMARA</p>
                        <p className="ml-8">Already? But you just got here.</p>
                        <p className="ml-8 text-accent/80">Swahili: Tayari? Lakini ndio umefika.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const UseCasesSection = () => (
    <section id="use-cases" className="py-20 sm:py-24 bg-brand-bg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-brand-text-primary">For Every Conversation</h2>
                <p className="mt-4 text-brand-text-secondary">AfriTranslate AI empowers professionals across industries to communicate effectively and build stronger global relationships.</p>
            </div>
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-brand-surface p-6 rounded-lg border border-brand-primary/20 text-center"><BusinessIcon className="mx-auto text-brand-primary" /><h3 className="mt-4 text-lg font-semibold text-brand-text-primary">Business & Marketing</h3></div>
                <div className="bg-brand-surface p-6 rounded-lg border border-brand-primary/20 text-center"><MediaIcon className="mx-auto text-brand-primary" /><h3 className="mt-4 text-lg font-semibold text-brand-text-primary">Media & Creatives</h3></div>
                <div className="bg-brand-surface p-6 rounded-lg border border-brand-primary/20 text-center"><EducationIcon className="mx-auto text-brand-primary" /><h3 className="mt-4 text-lg font-semibold text-brand-text-primary">Education & Research</h3></div>
                <div className="bg-brand-surface p-6 rounded-lg border border-brand-primary/20 text-center"><HealthcareIcon className="mx-auto text-brand-primary" /><h3 className="mt-4 text-lg font-semibold text-brand-text-primary">Healthcare & NGOs</h3></div>
            </div>
        </div>
    </section>
);

const TestimonialsSection = () => (
    <section id="testimonials" className="py-20 sm:py-24 bg-brand-surface">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-brand-text-primary">Loved by Global Communicators</h2>
            </div>
            <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-brand-bg p-8 rounded-lg border border-brand-primary/20">
                    <p className="text-brand-text-primary italic">"This is a game-changer for our international marketing. The tone adjustment ensures our copy is always culturally appropriate, which has significantly improved engagement with local partners in Africa."</p>
                    <div className="flex items-center mt-6">
                        <div className="w-12 h-12 rounded-full bg-brand-primary text-brand-bg flex items-center justify-center font-bold">AK</div>
                        <div className="ml-4">
                            <p className="font-semibold text-brand-text-primary">Amara Koffi</p>
                            <p className="text-sm text-brand-text-secondary">Marketing Director, TechInnovate</p>
                        </div>
                    </div>
                </div>
                <div className="bg-brand-bg p-8 rounded-lg border border-brand-primary/20">
                    <p className="text-brand-text-primary italic">"As a writer, translating my work felt like losing its soul. AfriTranslate's nuance engine helped me adapt my book into Swahili in a way that preserved my voice and the story's emotional core."</p>
                     <div className="flex items-center mt-6">
                        <div className="w-12 h-12 rounded-full bg-brand-primary text-brand-bg flex items-center justify-center font-bold">FS</div>
                        <div className="ml-4">
                            <p className="font-semibold text-brand-text-primary">Femi Sowande</p>
                            <p className="text-sm text-brand-text-secondary">Author & Playwright</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const FinalCTA = ({ onStart }: { onStart: () => void }) => (
    <section className="py-20 sm:py-24 bg-brand-bg">
         <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-text-primary">Ready to Bridge Cultural Divides?</h2>
            <p className="mt-4 max-w-xl mx-auto text-brand-text-secondary">Join thousands of users who are communicating with confidence and cultural awareness.</p>
            <button onClick={onStart} className="mt-8 px-8 py-4 bg-brand-primary text-brand-bg text-lg font-bold rounded-lg hover:bg-brand-primary/90 transition-transform hover:scale-105">
                Sign Up for Free
            </button>
        </div>
    </section>
);

const LandingFooter = ({ onNavigate }: { onNavigate: (view: View) => void }) => (
    <footer className="bg-brand-bg border-t border-brand-primary/20 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                    <h3 className="text-sm font-semibold text-brand-text-primary tracking-wider uppercase">Product</h3>
                    <ul className="mt-4 space-y-2">
                        <li><button onClick={() => onNavigate('about')} className="text-brand-text-secondary hover:text-brand-primary">Features</button></li>
                        <li><button onClick={() => onNavigate('pricing')} className="text-brand-text-secondary hover:text-brand-primary">Pricing</button></li>
                        <li><button onClick={() => onNavigate('demo')} className="text-brand-text-secondary hover:text-brand-primary">Demo</button></li>
                    </ul>
                </div>
                 <div>
                    <h3 className="text-sm font-semibold text-brand-text-primary tracking-wider uppercase">Company</h3>
                    <ul className="mt-4 space-y-2">
                        <li><button onClick={() => onNavigate('about')} className="text-brand-text-secondary hover:text-brand-primary">About Us</button></li>
                        <li><button className="text-brand-text-secondary hover:text-brand-primary cursor-not-allowed opacity-50">Careers</button></li>
                        <li><button onClick={() => onNavigate('contact')} className="text-brand-text-secondary hover:text-brand-primary">Contact</button></li>
                    </ul>
                </div>
                 <div>
                    <h3 className="text-sm font-semibold text-brand-text-primary tracking-wider uppercase">Resources</h3>
                    <ul className="mt-4 space-y-2">
                        <li><button className="text-brand-text-secondary hover:text-brand-primary cursor-not-allowed opacity-50">Blog</button></li>
                        <li><button className="text-brand-text-secondary hover:text-brand-primary cursor-not-allowed opacity-50">API Docs</button></li>
                        <li><button className="text-brand-text-secondary hover:text-brand-primary cursor-not-allowed opacity-50">Support</button></li>
                    </ul>
                </div>
                 <div>
                    <h3 className="text-sm font-semibold text-brand-text-primary tracking-wider uppercase">Legal</h3>
                    <ul className="mt-4 space-y-2">
                        <li><button onClick={() => onNavigate('privacy')} className="text-brand-text-secondary hover:text-brand-primary">Privacy Policy</button></li>
                        <li><button onClick={() => onNavigate('terms')} className="text-brand-text-secondary hover:text-brand-primary">Terms of Service</button></li>
                    </ul>
                </div>
            </div>
            <div className="mt-12 pt-8 border-t border-brand-primary/20 flex flex-col sm:flex-row justify-between items-center">
                <p className="text-sm text-brand-text-secondary">&copy; {new Date().getFullYear()} <button onClick={() => onNavigate('chat')} className="hover:text-brand-primary transition-colors">AfriTranslate AI</button>. All rights reserved.</p>
                <div className="flex gap-6 mt-4 sm:mt-0">
                    <a href="#" className="text-brand-text-secondary hover:text-brand-primary"><TwitterIcon /></a>
                    <a href="#" className="text-brand-text-secondary hover:text-brand-primary"><LinkedInIcon /></a>
                    <a href="#" className="text-brand-text-secondary hover:text-brand-primary"><InstagramIcon /></a>
                    <a href="#" className="text-brand-text-secondary hover:text-brand-primary"><YouTubeIcon /></a>
                </div>
            </div>
        </div>
    </footer>
);

const LandingPage: React.FC<{onStart: (initialView?: View) => void}> = ({ onStart }) => {
    return (
        <div className="bg-brand-bg text-brand-text-primary">
            <LandingHeader onStart={() => onStart()} onNavigate={onStart} />
            <main>
                <HeroSection onStart={() => onStart()} />
                <AboutSection />
                <AppMockupSection />
                <DemoSection isLandingSection={true} />
                <UseCasesSection />
                <TestimonialsSection />
                <FinalCTA onStart={() => onStart()} />
            </main>
            <LandingFooter onNavigate={(view) => onStart(view)} />
        </div>
    );
};

const App: React.FC = () => {
    const [appState, setAppState] = useState<{ show: boolean; initialView?: View }>({ show: false });
    const [sessionLoaded, setSessionLoaded] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setAppState({ show: true, initialView: 'chat' });
            }
            setSessionLoaded(true);
        };
        checkSession();
    }, []);

    const handleStartApp = (initialView: View = 'chat') => {
        setAppState({ show: true, initialView });
    };

    const handleShowLandingPage = () => {
        setAppState({ show: false });
    };

    if (!sessionLoaded) {
        return <div className="bg-bg-main h-screen w-screen"></div>; // Or a loading spinner
    }

    if (appState.show) {
        return <TranslatorApp onShowLanding={handleShowLandingPage} initialView={appState.initialView} />;
    }

    return <LandingPage onStart={handleStartApp} />;
};

export default App;
