
import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { TranslationResult } from '../types';
import * as geminiService from '../services/geminiService';
import { getOfflineTranslation, getBatchOfflineTranslations } from '../services/offlineService';
import { LANGUAGES, TONES } from '../constants';
import LanguageSelector from './LanguageSelector';
import ToneSelector from './ToneSelector';
import { TranslateIcon, CheckIcon, InfoIcon, BatchIcon } from './Icons';

interface StudioProps {
    isOffline: boolean;
    initialText?: string;
}

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const rawHtml = marked.parse(content, { gfm: true, breaks: true }) as string;
    const sanitizedHtml = DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
    return (
        <div 
            className="prose prose-invert prose-sm max-w-none text-[14px]"
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

const Studio: React.FC<StudioProps> = ({ isOffline, initialText = '' }) => {
    const [sourceText, setSourceText] = useState(initialText);
    const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [sourceLang, setSourceLang] = useState('en');
    const [targetLang, setTargetLang] = useState('sw');
    const [tone, setTone] = useState('Friendly');
    const [context, setContext] = useState('');
    const [isBatchMode, setIsBatchMode] = useState(false);
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

    // Batch results state
    const [batchResults, setBatchResults] = useState<TranslationResult[]>([]);

    useEffect(() => {
        if (initialText) {
            setSourceText(initialText);
        }
    }, [initialText]);

    const handleTranslate = async () => {
        if (!sourceText.trim()) {
            setError("Please enter some text to translate.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setBatchResults([]);
        setTranslationResult(null);

        try {
            if (isBatchMode) {
                const inputs = sourceText.split('\n').filter(line => line.trim() !== '');
                if (inputs.length === 0) throw new Error("No valid lines found.");
                
                if (isOffline) {
                    const results = await getBatchOfflineTranslations(inputs, sourceLang, targetLang);
                    setBatchResults(results);
                } else {
                    const results = await geminiService.getBatchTranslations(inputs, sourceLang, targetLang, tone, context);
                    setBatchResults(results);
                }
            } else {
                // Normal Mode
                let textToTranslate = sourceText;
                if(context.trim()){
                    textToTranslate = `CONTEXT: "${context.trim()}"\n\nTEXT: "${sourceText.trim()}"`;
                }

                const result = isOffline
                    ? getOfflineTranslation(textToTranslate, sourceLang, targetLang)
                    : await geminiService.getNuancedTranslation(textToTranslate, sourceLang, targetLang, tone);
                setTranslationResult(result);
            }
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

    return (
        <div className="flex flex-col h-full w-full bg-transparent overflow-hidden">
            {/* Top Toolbar - Floating Configuration */}
            <div className="flex-shrink-0 px-4 py-3">
                <div className="bg-bg-surface/70 backdrop-blur-xl border border-white/5 rounded-2xl p-2 flex flex-col md:flex-row items-center gap-4 shadow-2xl">
                    <div className="flex-1 flex items-center gap-3 w-full overflow-x-auto no-scrollbar">
                        <div className="min-w-[140px]">
                            <LanguageSelector label="From" languages={LANGUAGES} value={sourceLang} onChange={setSourceLang} />
                        </div>
                        <div className="text-text-secondary">→</div>
                        <div className="min-w-[140px]">
                            <LanguageSelector label="To" languages={LANGUAGES} value={targetLang} onChange={setTargetLang} />
                        </div>
                        <div className="w-px h-8 bg-white/10 mx-2"></div>
                        <div className="min-w-[140px]">
                            <ToneSelector label="Persona" tones={TONES} value={tone} onChange={setTone} />
                        </div>
                        
                        <div className="hidden md:block w-px h-8 bg-white/10 mx-2"></div>
                        
                        {/* Context Toggle (Simple Input for now to save space) */}
                        <div className="hidden md:flex flex-col flex-1 min-w-[150px]">
                            <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider mb-1">Context</label>
                            <input 
                                type="text" 
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                placeholder="e.g. Business meeting..."
                                className="w-full bg-black/20 border border-white/5 rounded-md px-2 py-1 text-xs text-white focus:ring-1 focus:ring-accent outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-end px-2">
                         <button 
                            onClick={() => setIsBatchMode(!isBatchMode)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wide border transition-all ${
                                isBatchMode 
                                ? 'bg-accent/20 border-accent text-accent' 
                                : 'bg-white/5 border-transparent text-text-secondary hover:text-white'
                            }`}
                            title="Batch Mode: Translate multiple lines at once"
                        >
                            <BatchIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Batch</span>
                        </button>

                        <button 
                            onClick={handleTranslate} 
                            disabled={isLoading || !sourceText.trim()}
                            className="h-10 px-6 bg-accent text-bg-main font-black rounded-xl hover:bg-white hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/20 flex items-center gap-2"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <TranslateIcon className="w-4 h-4"/>
                            )}
                            <span className="text-xs tracking-wider">TRANSLATE</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 min-h-0">
                {/* Source Input */}
                <div className="flex-1 bg-bg-surface/40 border border-white/5 rounded-2xl flex flex-col relative focus-within:ring-1 focus-within:ring-accent/50 focus-within:bg-bg-surface/60 transition-all shadow-lg overflow-hidden">
                    <div className="flex justify-between items-center p-3 border-b border-white/5 bg-white/5">
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-1">Source Text</span>
                        {sourceText && (
                            <button onClick={() => setSourceText('')} className="text-text-secondary hover:text-white text-[10px] uppercase font-bold">Clear</button>
                        )}
                    </div>
                    <textarea 
                        value={sourceText}
                        onChange={(e) => setSourceText(e.target.value)}
                        placeholder={isBatchMode ? "Enter multiple lines of text to translate...\nOne sentence per line." : "Type or paste text here to translate..."}
                        className="flex-1 w-full p-5 bg-transparent resize-none focus:outline-none text-[14px] leading-relaxed text-text-primary placeholder:text-text-secondary/30 font-sans overflow-y-auto custom-scrollbar"
                    />
                    <div className="p-2 text-right text-[10px] text-text-secondary/50 border-t border-white/5">
                        {sourceText.length} characters
                    </div>
                </div>

                {/* Target Output */}
                <div className="flex-1 bg-[#0c0c0c]/80 border border-white/5 rounded-2xl flex flex-col relative shadow-inner overflow-hidden">
                    <div className="flex justify-between items-center p-3 border-b border-white/5 bg-black/40">
                        <span className="text-[10px] font-bold text-accent uppercase tracking-widest pl-1">Translation</span>
                        {translationResult && !isBatchMode && (
                            <div className="flex gap-2">
                                <button onClick={() => handleCopy('main', translationResult.culturallyAwareTranslation)} className="text-text-secondary hover:text-white" title="Copy Translation">
                                    {copiedStates['main'] ? <CheckIcon className="w-4 h-4 text-green-400"/> : <CopyIcon className="w-3 h-3"/>}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar relative">
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-bg-main/50 backdrop-blur-sm z-10">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-[10px] font-bold text-accent uppercase tracking-widest animate-pulse">Processing Nuance...</span>
                                </div>
                            </div>
                        )}

                        {!translationResult && batchResults.length === 0 && !isLoading && (
                            <div className="h-full flex flex-col items-center justify-center text-text-secondary opacity-20">
                                <TranslateIcon className="w-12 h-12 mb-3"/>
                                <p className="text-sm font-medium">Ready to translate</p>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Batch Mode Results */}
                        {isBatchMode && batchResults.length > 0 && (
                            <div className="space-y-3">
                                {batchResults.map((item, index) => (
                                    <details key={index} className="group bg-bg-surface/20 border border-white/5 rounded-lg overflow-hidden open:bg-bg-surface/40 transition-colors">
                                        <summary className="p-3 cursor-pointer flex items-center justify-between hover:bg-white/5">
                                            <div className="flex-1 truncate pr-4">
                                                <span className="text-accent font-bold text-sm block mb-0.5">{item.culturallyAwareTranslation}</span>
                                                <span className="text-[11px] text-text-secondary truncate block">{item.original}</span>
                                            </div>
                                            <div className="text-text-secondary group-open:rotate-90 transition-transform">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                            </div>
                                        </summary>
                                        <div className="p-3 pt-0 border-t border-white/5 mt-2">
                                            <div className="grid grid-cols-2 gap-4 text-xs mt-2">
                                                <div>
                                                    <span className="text-[9px] uppercase text-text-secondary font-bold">Literal</span>
                                                    <p className="text-white/70 italic mt-1">{item.directTranslation}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] uppercase text-text-secondary font-bold">Nuance</span>
                                                    <p className="text-white/70 mt-1">{item.explanation}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </details>
                                ))}
                            </div>
                        )}

                        {/* Single Translation Result */}
                        {!isBatchMode && translationResult && (
                            <div className="animate-fade-in space-y-6">
                                <section>
                                    <div className="text-[15px] leading-relaxed text-white font-medium">
                                        <MarkdownRenderer content={translationResult.culturallyAwareTranslation} />
                                    </div>
                                    {translationResult.pronunciation && (
                                        <div className="mt-3 flex items-center gap-2 text-text-secondary text-xs font-mono bg-black/20 p-2 rounded inline-block">
                                            <span className="text-accent">Pronunciation:</span> {translationResult.pronunciation}
                                        </div>
                                    )}
                                </section>

                                <div className="h-px bg-white/10"></div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Literal Meaning</h4>
                                            <button onClick={() => handleCopy('direct', translationResult.directTranslation)} className="text-text-secondary hover:text-white">
                                                {copiedStates['direct'] ? <CheckIcon className="w-3 h-3 text-green-400"/> : <CopyIcon className="w-3 h-3"/>}
                                            </button>
                                        </div>
                                        <div className="text-xs text-white/70 italic">
                                            <MarkdownRenderer content={translationResult.directTranslation} />
                                        </div>
                                    </div>

                                    <div className="bg-accent/5 p-3 rounded-xl border border-accent/10">
                                        <h4 className="text-[9px] font-bold text-accent uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <InfoIcon className="w-3 h-3"/> Cultural Context
                                        </h4>
                                        <div className="text-xs text-white/80 leading-relaxed">
                                            <MarkdownRenderer content={translationResult.explanation} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Studio;
