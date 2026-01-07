
import React from 'react';
import { GlobeIcon, BoltIcon, DocIcon, ThinkingIcon, UsersIcon, LockIcon } from './Icons';

const AboutPage: React.FC<{ isLandingSection?: boolean }> = ({ isLandingSection = false }) => {
    // Style configurations based on context
    const containerClasses = isLandingSection ? 'py-0 max-w-4xl mx-auto' : 'max-w-4xl mx-auto py-12 px-6'; 
    // Increased heading sizes
    const headingClass = "text-3xl md:text-4xl font-bold text-white tracking-tight mb-4";
    // Increased subheading size
    const subHeadingClass = "text-base text-text-secondary max-w-2xl mx-auto leading-relaxed";

    return (
        <div className={`animate-fade-in ${containerClasses} space-y-12`}>
            
            {/* 1. Hero / Mission Section */}
            <div className="text-center">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-widest mb-4">
                    Our Mission
                </div>
                <h1 className={headingClass}>
                    We don't just translate words.<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow-200">We translate culture.</span>
                </h1>
                <p className={subHeadingClass}>
                    Standard tools strip away history. AfriTranslate AI restores the human element, bridging the gap between global connectivity and authentic local expression.
                </p>
            </div>

            {/* 2. The Core Problem vs Solution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-bg-surface/40 p-6 rounded-xl border border-white/5 backdrop-blur-sm"> 
                <div>
                    <h2 className="text-xl font-bold text-white mb-3">The Context Gap</h2>
                    <p className="text-sm text-text-secondary leading-relaxed mb-5">
                        Legacy engines treat language as math, ignoring social nuances like age, time, and setting. This leads to misunderstandings and brand damage.
                    </p>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-start gap-3">
                            <div className="mt-1.5 p-0.5 bg-red-500/10 rounded text-red-400"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div></div>
                            <p className="text-sm text-text-secondary"><strong className="text-white">Generic AI:</strong> Ignores idioms and cultural taboos.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1.5 p-0.5 bg-accent/10 rounded text-accent"><div className="w-1.5 h-1.5 bg-accent rounded-full"></div></div>
                            <p className="text-sm text-text-secondary"><strong className="text-white">AfriTranslate:</strong> Analyzes intent and cultural norms.</p>
                        </div>
                    </div>
                </div>
                <div className="relative">
                    <div className="absolute inset-0 bg-accent/5 blur-2xl rounded-full"></div>
                    <div className="relative bg-bg-main border border-border-default rounded-lg p-5 shadow-xl">
                        <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-3">
                            <ThinkingIcon className="w-5 h-5 text-accent" />
                            <span className="text-xs font-bold text-white uppercase tracking-wider">Nuance Engine</span>
                        </div>
                        <div className="space-y-2">
                            <div className="h-1.5 bg-white/10 rounded w-3/4"></div>
                            <div className="h-1.5 bg-white/10 rounded w-full"></div>
                            <div className="h-1.5 bg-white/10 rounded w-5/6"></div>
                        </div>
                        <div className="mt-5 flex gap-2">
                            <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-text-secondary border border-white/5">Semantic</span>
                            <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-text-secondary border border-white/5">Cultural</span>
                            <span className="px-2 py-1 bg-accent/10 text-accent border border-accent/20 rounded text-[10px] font-bold">Tone</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Three Pillars */}
            <div>
                <h2 className="text-xl font-bold text-center text-white mb-8">Built on Three Pillars</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-bg-surface p-6 rounded-xl border border-border-default hover:border-accent/30 transition-colors group">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                            <GlobeIcon className="w-5 h-5 text-blue-400" />
                        </div>
                        <h3 className="text-base font-bold text-white mb-2">Linguistic Diversity</h3>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            Supporting 2,000+ dialects beyond official languages. Every voice deserves accurate understanding.
                        </p>
                    </div>
                    <div className="bg-bg-surface p-6 rounded-xl border border-border-default hover:border-accent/30 transition-colors group">
                        <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                            <BoltIcon className="w-5 h-5 text-accent" />
                        </div>
                        <h3 className="text-base font-bold text-white mb-2">Real-Time Adaptation</h3>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            Proprietary low-latency architecture for live translation that keeps pace with natural speech.
                        </p>
                    </div>
                    <div className="bg-bg-surface p-6 rounded-xl border border-border-default hover:border-accent/30 transition-colors group">
                        <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                            <UsersIcon className="w-5 h-5 text-green-400" />
                        </div>
                        <h3 className="text-base font-bold text-white mb-2">Ethical AI</h3>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            Prioritizing data sovereignty and ethically sourced datasets to respect the AI value chain.
                        </p>
                    </div>
                </div>
            </div>

            {/* 4. Technology / Stats */}
            {!isLandingSection && (
                <div className="border-t border-border-default pt-10 pb-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <div className="p-2">
                            <div className="text-3xl font-black text-white mb-1">54</div>
                            <div className="text-xs font-bold text-text-secondary uppercase tracking-widest">Countries</div>
                        </div>
                        <div className="p-2">
                            <div className="text-3xl font-black text-white mb-1">2k+</div>
                            <div className="text-xs font-bold text-text-secondary uppercase tracking-widest">Dialects</div>
                        </div>
                        <div className="p-2">
                            <div className="text-3xl font-black text-white mb-1">99%</div>
                            <div className="text-xs font-bold text-text-secondary uppercase tracking-widest">Accuracy</div>
                        </div>
                        <div className="p-2">
                            <div className="text-3xl font-black text-white mb-1">10M+</div>
                            <div className="text-xs font-bold text-text-secondary uppercase tracking-widest">Words</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AboutPage;
