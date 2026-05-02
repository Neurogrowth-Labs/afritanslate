import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, FilmStripIcon, SparklesIcon } from '../Icons';
import MotionTab from './MotionTab';
import VisualArtsTab from './VisualArtsTab';

export type CreativeTab = 'motion' | 'visual';

interface CreativeStudioProps {
    defaultTab?: CreativeTab;
}

const PlayIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653Z" />
    </svg>
);

const TABS: { id: CreativeTab; label: string; sublabel: string; icon: React.ReactNode }[] = [
    {
        id: 'motion',
        label: 'Motion Generator',
        sublabel: 'Cinematic AI video for African stories',
        icon: <PlayIcon className="w-4 h-4" />,
    },
    {
        id: 'visual',
        label: 'Visual Arts',
        sublabel: 'Culturally-rich AI imagery & patterns',
        icon: <ImageIcon className="w-4 h-4" />,
    },
];

const readTabFromUrl = (): CreativeTab | null => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tab');
    if (t === 'motion' || t === 'visual') return t;
    return null;
};

const CreativeStudio: React.FC<CreativeStudioProps> = ({ defaultTab = 'motion' }) => {
    const [activeTab, setActiveTab] = useState<CreativeTab>(() => readTabFromUrl() ?? defaultTab);

    useEffect(() => {
        const onPop = () => {
            const next = readTabFromUrl();
            if (next) setActiveTab(next);
        };
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, []);

    const handleSelectTab = useCallback((tab: CreativeTab) => {
        setActiveTab(tab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.pathname = '/studio/creative';
            url.searchParams.set('tab', tab);
            window.history.replaceState({}, '', url.toString());
        }
    }, []);

    return (
        <div className="flex flex-col h-full w-full overflow-hidden animate-fade-in">
            <header className="relative px-4 sm:px-6 pt-4 pb-3 border-b border-border-default/60 bg-gradient-to-b from-white/[0.02] to-transparent">
                <div className="absolute inset-0 pointer-events-none opacity-50" aria-hidden>
                    <div className="absolute -top-16 left-1/3 w-72 h-72 rounded-full bg-accent/10 blur-3xl" />
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-fuchsia-500/5 blur-3xl" />
                </div>

                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center shadow-[0_0_30px_-10px_rgba(244,163,0,0.45)]">
                            <SparklesIcon className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Creative Studio</h1>
                            <p className="text-[12px] text-text-secondary">
                                One canvas for African motion + visual storytelling. Powered by AfriTranslate AI.
                            </p>
                        </div>
                    </div>

                    <div
                        role="tablist"
                        aria-label="Creative Studio tabs"
                        className="relative inline-flex p-1 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md self-start sm:self-auto"
                    >
                        {TABS.map(tab => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    role="tab"
                                    aria-selected={isActive}
                                    aria-controls={`creative-panel-${tab.id}`}
                                    id={`creative-tab-${tab.id}`}
                                    onClick={() => handleSelectTab(tab.id)}
                                    className={`relative z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                                        isActive ? 'text-white' : 'text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    {isActive && (
                                        <motion.span
                                            layoutId="creative-tab-bg"
                                            className="absolute inset-0 rounded-lg bg-gradient-to-r from-accent/30 to-accent/10 border border-accent/40 shadow-[0_0_20px_-6px_rgba(244,163,0,0.55)]"
                                            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                        />
                                    )}
                                    <span className="relative">{tab.icon}</span>
                                    <span className="relative whitespace-nowrap">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="relative mt-3 text-[11px] text-text-secondary/80">
                    {TABS.find(t => t.id === activeTab)?.sublabel}
                </div>
            </header>

            <main className="flex-1 min-h-0 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    {activeTab === 'motion' && (
                        <motion.section
                            key="motion"
                            id="creative-panel-motion"
                            role="tabpanel"
                            aria-labelledby="creative-tab-motion"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute inset-0 overflow-y-auto custom-scrollbar"
                        >
                            <MotionTab />
                        </motion.section>
                    )}
                    {activeTab === 'visual' && (
                        <motion.section
                            key="visual"
                            id="creative-panel-visual"
                            role="tabpanel"
                            aria-labelledby="creative-tab-visual"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute inset-0 overflow-y-auto custom-scrollbar"
                        >
                            <VisualArtsTab />
                        </motion.section>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default CreativeStudio;
