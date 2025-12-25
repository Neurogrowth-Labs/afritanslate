import React, { useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { TranslationResult } from '../types';
import * as geminiService from '../services/geminiService';
import { getOfflineTranslation } from '../services/offlineService';
import { LANGUAGES, TONES } from '../constants';
import LanguageSelector from './LanguageSelector';
import ToneSelector from './ToneSelector';
import { TranslateIcon, CheckIcon, InfoIcon } from './Icons';

interface StudioProps {
    isOffline: boolean;
}

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const rawHtml = marked.parse(content, { gfm: true, breaks: true }) as string;
    const sanitizedHtml = DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
    return (
        <div 
            className="prose prose-invert prose-sm max-w-none text-[13px]"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
    );
};

const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className || "w-3.5 h-3.5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75H18.5a1.125 1.125 0 011.125 1.125v9.75M9.75 3.75v13.5H3.375" />
    </svg>
);

const Studio: React.FC<StudioProps> = ({ isOffline }) => {
    const [sourceText, setSourceText] = useState('');
    const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [sourceLang, setSourceLang] = useState('en');
    const [targetLang, setTargetLang] = useState('sw');
    const [tone, setTone] = useState('Friendly');
    const [context, setContext] = useState('');
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
    const [showSettings, setShowSettings] = useState(false);

    const handleTranslate = async () => {
        if (!sourceText.trim()) {
            setError("Please enter some text to translate.");
            return;
        }
        setIsLoading(true);
        setError(null);
        if (window.innerWidth < 1024) setShowSettings(false);

        try {
            let textToTranslate = sourceText;
            if(context.trim()){
                textToTranslate = `CONTEXT: "${context.trim()}"\n\nTEXT: "${sourceText.trim()}"`;
            }

            const result = isOffline
                ? getOfflineTranslation(textToTranslate, sourceLang, targetLang)
                : await geminiService.getNuancedTranslation(textToTranslate, sourceLang, targetLang, tone);
            setTranslationResult(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = (key: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedStates(prev => ({ ...prev, [key]: true }));
        setTimeout(() => {
            setCopiedStates(prev => ({ ...prev, [key]: false }));
        }, 2000);
    };

    const ConfigurationPanel = () => (
        <div className="flex flex-col gap-4 p-3 h-full overflow-y-auto custom-scrollbar">
            <section className="space-y-3">
                <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Input</h3>
                <LanguageSelector label="From" languages={LANGUAGES} value={sourceLang} onChange={setSourceLang} />
                <div className="space-y-1">
                    <label className="text-[10px] text-text-secondary font-medium">Detection</label>
                    <div className="p-1.5 rounded bg-bg-main border border-border-default text-text-secondary text-[12px]">
                        Auto-detect...
                    </div>
                </div>
            </section>

            <div className="h-px bg-border-default"></div>

            <section className="space-y-3">
                <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Output</h3>
                <LanguageSelector label="To" languages={LANGUAGES} value={targetLang} onChange={setTargetLang} />
                <div className="space-y-1">
                    <label className="text-[10px] text-text-secondary font-medium">Dialect</label>
                    <select className="w-full p-1.5 bg-bg-main border border-border-default rounded text-[12px] focus:ring-1 focus:ring-accent outline-none">
                        <option>Standard</option>
                        <option>Colloquial</option>
                        <option>Archaic</option>
                    </select>
                </div>
            </section>

            <div className="h-px bg-border-default"></div>

            <section className="space-y-3">
                <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Context</h3>
                <ToneSelector label="Persona" tones={TONES} value={tone} onChange={setTone} />
                <div className="space-y-1">
                    <label className="text-[10px] text-text-secondary font-medium">Scenario</label>
                    <textarea 
                        value={context}
                        onChange={e => setContext(e.target.value)}
                        placeholder="Describe the setting..."
                        className="w-full h-20 p-2 bg-bg-main border border-border-default rounded text-[12px] focus:ring-1 focus:ring-accent outline-none text-text-primary resize-none placeholder:text-text-secondary/30"
                    />
                </div>
            </section>

            <div className="mt-auto pt-4 border-t border-border-default">
                <div className="p-2 bg-bg-main/40 border border-border-default rounded text-[9px] text-text-secondary/60">
                    <p>AfriTranslate Engine v2.4</p>
                    <p>Status: {isOffline ? 'Offline' : 'Online'}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-full w-full overflow-hidden bg-bg-main relative">
            <div className="hidden lg:block w-52 flex-shrink-0 border-r border-border-default bg-bg-surface/30 h-full overflow-hidden">
                <ConfigurationPanel />
            </div>

            <div className="flex-1 flex flex-col min-w-0 bg-bg-main h-full overflow-hidden">
                <div className="h-12 border-b border-border-default flex items-center justify-between px-3 bg-bg-surface/50 flex-shrink-0">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <button 
                            onClick={() => setShowSettings(!showSettings)}
                            className="lg:hidden p-1.5 text-text-secondary hover:text-white bg-bg-main border border-border-default rounded flex-shrink-0"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                        </button>
                        <span className="text-[12px] font-semibold text-text-primary truncate">Localization Studio</span>
                        <div className="hidden sm:block h-3 w-px bg-border-default flex-shrink-0 mx-1"></div>
                        <span className="hidden sm:block text-[10px] text-text-secondary whitespace-nowrap flex-shrink-0">{sourceText.length} chars</span>
                    </div>
                    <button 
                        onClick={handleTranslate} 
                        disabled={isLoading || !sourceText.trim()}
                        className="h-8 px-3 bg-accent text-bg-main font-bold rounded flex items-center gap-1.5 hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex-shrink-0"
                    >
                        <TranslateIcon className="w-3.5 h-3.5"/>
                        <span className="text-[12px] whitespace-nowrap">{isLoading ? 'Wait...' : 'Translate'}</span>
                    </button>
                </div>

                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="flex-1 relative border-b border-border-default min-h-0">
                        <textarea 
                            value={sourceText}
                            onChange={(e) => setSourceText(e.target.value)}
                            placeholder="Type source text..."
                            className="w-full h-full p-4 bg-transparent resize-none focus:outline-none text-[13px] leading-relaxed text-text-primary placeholder:text-text-secondary/30 font-sans overflow-y-auto custom-scrollbar"
                        />
                        {error && (
                            <div className="absolute bottom-2 left-2 right-2 p-1.5 bg-red-900/20 border border-red-900/50 rounded text-red-400 text-[11px] animate-fade-in z-20">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-h-0 bg-[#0c0c0c] relative overflow-hidden flex flex-col">
                        {isLoading && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg-main/60 backdrop-blur-[1px]">
                                <div className="flex gap-1">
                                    <div className="w-1 h-1 rounded-full bg-accent animate-bounce"></div>
                                    <div className="w-1 h-1 rounded-full bg-accent animate-bounce [animation-delay:0.2s]"></div>
                                    <div className="w-1 h-1 rounded-full bg-accent animate-bounce [animation-delay:0.4s]"></div>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {!translationResult && !isLoading && (
                                <div className="h-full flex flex-col items-center justify-center text-text-secondary opacity-10">
                                    <TranslateIcon className="w-8 h-8 mb-2"/>
                                    <p className="text-[12px]">Results appear here</p>
                                </div>
                            )}

                            {translationResult && (
                                <div className="animate-fade-in max-w-3xl mx-auto space-y-4">
                                    <section>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-[9px] font-bold text-accent uppercase tracking-widest">Cultural Translation</h4>
                                            <button onClick={() => handleCopy('cultural', translationResult.culturallyAwareTranslation)} className="p-1 text-text-secondary hover:text-accent transition-colors bg-bg-surface/50 rounded">
                                                {copiedStates['cultural'] ? <CheckIcon className="w-3.5 h-3.5"/> : <CopyIcon />}
                                            </button>
                                        </div>
                                        <div className="bg-bg-surface/30 p-3 rounded-lg border border-border-default/50 text-[13px] leading-relaxed text-white shadow-inner">
                                            <MarkdownRenderer content={translationResult.culturallyAwareTranslation} />
                                        </div>
                                    </section>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
                                        <section>
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Literal</h4>
                                                <button onClick={() => handleCopy('direct', translationResult.directTranslation)} className="p-1 text-text-secondary hover:text-white transition-colors">
                                                    {copiedStates['direct'] ? <CheckIcon className="w-3 h-3 text-accent"/> : <CopyIcon className="w-3 h-3"/>}
                                                </button>
                                            </div>
                                            <div className="text-[12px] italic text-text-secondary/70 p-2.5 bg-bg-surface/20 rounded border border-border-default/30">
                                                <MarkdownRenderer content={translationResult.directTranslation} />
                                            </div>
                                        </section>

                                        <section>
                                            <h4 className="text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-2">Analysis</h4>
                                            <div className="text-[12px] text-text-secondary/80 leading-relaxed bg-bg-surface/10 p-2.5 rounded border border-border-default/20">
                                                <MarkdownRenderer content={translationResult.explanation} />
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showSettings && (
                <div className="lg:hidden fixed inset-0 z-50 bg-bg-main/90 backdrop-blur-md animate-fade-in flex flex-col overflow-hidden">
                    <div className="h-12 border-b border-border-default flex items-center justify-between px-3 bg-bg-surface flex-shrink-0">
                        <h2 className="text-[12px] font-bold text-white uppercase tracking-widest">Options</h2>
                        <button onClick={() => setShowSettings(false)} className="p-1.5 text-text-secondary">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <ConfigurationPanel />
                    </div>
                    <div className="p-3 border-t border-border-default bg-bg-surface flex-shrink-0">
                        <button 
                            onClick={() => setShowSettings(false)}
                            className="w-full py-2.5 bg-accent text-bg-main font-bold rounded-lg text-[13px]"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const tonalityMapping: Record<string, string> = {
    'Formal': 'Etiquette Precision',
    'Informal': 'Casual Flow',
    'Business': 'Corporate Standard',
    'Friendly': 'Interpersonal Ease',
    'Humorous': 'Cultural Puns',
    'Poetic': 'Wisdom Preservation',
    'Urgent': 'Crisis Clarity',
    'Diplomatic': 'Mediation Balance'
};

export default Studio;