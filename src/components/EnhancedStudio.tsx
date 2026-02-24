
import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { TranslationResult, LinguisticAnalysis } from '../types';
import * as geminiService from '../services/geminiService';
import { getOfflineTranslation } from '../services/offlineService';
import { LANGUAGES, TONES, DIALECTS, FORMALITY_LEVELS } from '../constants';
import LanguageSelector from './LanguageSelector';
import ToneSelector from './ToneSelector';
import { TranslateIcon, CheckIcon, InfoIcon, AlertIcon, ThinkingIcon, GlobeIcon, BookIcon, ShieldIcon } from './Icons';

interface EnhancedStudioProps {
    isOffline: boolean;
    initialText?: string;
}

interface CulturalRisk {
    phrase: string;
    severity: 'high' | 'medium' | 'low';
    reason: string;
    suggestion: string;
}

interface CulturalInsight {
    category: string;
    insight: string;
    relevance: string;
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

const CulturalRiskPanel: React.FC<{ risks: CulturalRisk[] }> = ({ risks }) => {
    if (risks.length === 0) return null;

    return (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 animate-fade-in">
            <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertIcon className="w-4 h-4"/> Cultural Risk Radar
            </h4>
            <div className="space-y-3">
                {risks.map((risk, idx) => (
                    <div key={idx} className="bg-black/30 p-3 rounded-lg border border-red-500/20">
                        <div className="flex items-start gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                risk.severity === 'high' ? 'bg-red-500 text-white' :
                                risk.severity === 'medium' ? 'bg-yellow-500 text-black' :
                                'bg-blue-500 text-white'
                            }`}>{risk.severity}</span>
                            <span className="text-white font-mono text-xs flex-1">"{risk.phrase}"</span>
                        </div>
                        <p className="text-[11px] text-text-secondary mb-2">{risk.reason}</p>
                        <div className="bg-green-500/10 border border-green-500/20 rounded p-2">
                            <span className="text-[9px] text-green-400 font-bold uppercase block mb-1">Suggested Alternative</span>
                            <p className="text-xs text-white">{risk.suggestion}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CulturalInsightsPanel: React.FC<{ insights: CulturalInsight[], targetLang: string, dialect: string }> = ({ insights, targetLang, dialect }) => {
    return (
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
            <h4 className="text-[10px] font-black text-accent uppercase tracking-widest mb-3 flex items-center gap-2">
                <GlobeIcon className="w-4 h-4"/> Cultural Intelligence
            </h4>
            
            <div className="mb-4 p-3 bg-black/30 rounded-lg border border-white/10">
                <div className="text-[9px] text-text-secondary uppercase font-bold mb-1">Active Context</div>
                <div className="text-sm text-white">
                    {LANGUAGES.find(l => l.code === targetLang)?.name || targetLang}
                    {dialect && dialect !== 'standard' && <span className="text-accent ml-2">• {dialect}</span>}
                </div>
            </div>

            <div className="space-y-3">
                {insights.map((insight, idx) => (
                    <div key={idx} className="bg-white/5 p-3 rounded-lg border border-white/5">
                        <div className="text-[9px] text-accent font-bold uppercase mb-1">{insight.category}</div>
                        <p className="text-xs text-white mb-2">{insight.insight}</p>
                        <div className="text-[10px] text-text-secondary italic">{insight.relevance}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const EnhancedStudio: React.FC<EnhancedStudioProps> = ({ isOffline, initialText = '' }) => {
    const [sourceText, setSourceText] = useState(initialText);
    const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [sourceLang, setSourceLang] = useState('en');
    const [targetLang, setTargetLang] = useState('sw');
    const [tone, setTone] = useState('Friendly');
    const [dialect, setDialect] = useState('standard');
    const [formality, setFormality] = useState(50);
    const [context, setContext] = useState('');
    const [useGlossary, setUseGlossary] = useState(false);
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

    const [culturalRisks, setCulturalRisks] = useState<CulturalRisk[]>([]);
    const [culturalInsights, setCulturalInsights] = useState<CulturalInsight[]>([]);
    const [showNaturalize, setShowNaturalize] = useState(false);

    useEffect(() => {
        if (initialText) {
            setSourceText(initialText);
        }
    }, [initialText]);

    const getFormalityLabel = (value: number): string => {
        if (value < 25) return 'Street';
        if (value < 50) return 'Corporate';
        if (value < 75) return 'Diplomatic';
        return 'Legal';
    };

    const handleTranslate = async () => {
        if (!sourceText.trim()) {
            setError("Please enter some text to translate.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setTranslationResult(null);
        setCulturalRisks([]);
        setCulturalInsights([]);

        try {
            let textToTranslate = sourceText;
            if(context.trim()){
                textToTranslate = `CONTEXT: "${context.trim()}"\n\nTEXT: "${sourceText.trim()}"`;
            }

            const formalityLevel = getFormalityLabel(formality);
            const enhancedTone = `${tone} (${formalityLevel} formality)`;

            const result = isOffline
                ? getOfflineTranslation(textToTranslate, sourceLang, targetLang)
                : await geminiService.getEnhancedTranslation(
                    textToTranslate, 
                    sourceLang, 
                    targetLang, 
                    enhancedTone,
                    dialect,
                    useGlossary
                );
            
            setTranslationResult(result);

            const risks = await geminiService.detectCulturalRisks(sourceText, targetLang, dialect);
            setCulturalRisks(risks);

            const insights = await geminiService.getCulturalInsights(targetLang, dialect, context);
            setCulturalInsights(insights);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNaturalize = async () => {
        if (!translationResult) return;
        setIsLoading(true);
        try {
            const naturalized = await geminiService.naturalizeTranslation(
                translationResult.culturallyAwareTranslation,
                targetLang,
                dialect
            );
            setTranslationResult({ ...translationResult, culturallyAwareTranslation: naturalized });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Naturalization failed.');
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

    const availableDialects = DIALECTS[targetLang] || [{ code: 'standard', name: 'Standard' }];

    return (
        <div className="flex flex-col h-full w-full bg-transparent overflow-hidden">
            <div className="flex-shrink-0 px-4 py-3">
                <div className="bg-bg-surface/70 backdrop-blur-xl border border-white/5 rounded-2xl p-3 shadow-2xl">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="min-w-[140px]">
                                <LanguageSelector label="From" languages={LANGUAGES} value={sourceLang} onChange={setSourceLang} />
                            </div>
                            <div className="text-text-secondary">→</div>
                            <div className="min-w-[140px]">
                                <LanguageSelector label="To" languages={LANGUAGES} value={targetLang} onChange={setTargetLang} />
                            </div>
                            
                            <div className="min-w-[140px]">
                                <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider mb-1 block">Dialect</label>
                                <select 
                                    value={dialect}
                                    onChange={(e) => setDialect(e.target.value)}
                                    className="w-full bg-black/20 border border-white/5 rounded-md px-2 py-1.5 text-xs text-white focus:ring-1 focus:ring-accent outline-none"
                                >
                                    {availableDialects.map(d => (
                                        <option key={d.code} value={d.code}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="min-w-[140px]">
                                <ToneSelector label="Tone" tones={TONES} value={tone} onChange={setTone} />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex-1 min-w-[200px]">
                                <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider mb-1 block">
                                    Formality: {getFormalityLabel(formality)}
                                </label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={formality}
                                    onChange={(e) => setFormality(Number(e.target.value))}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
                                />
                                <div className="flex justify-between text-[8px] text-text-secondary mt-1">
                                    <span>Street</span>
                                    <span>Corporate</span>
                                    <span>Diplomatic</span>
                                    <span>Legal</span>
                                </div>
                            </div>

                            <div className="flex-1 min-w-[150px]">
                                <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider mb-1 block">Context</label>
                                <input 
                                    type="text" 
                                    value={context}
                                    onChange={(e) => setContext(e.target.value)}
                                    placeholder="e.g. Business meeting, Youth campaign..."
                                    className="w-full bg-black/20 border border-white/5 rounded-md px-2 py-1.5 text-xs text-white focus:ring-1 focus:ring-accent outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={useGlossary}
                                        onChange={(e) => setUseGlossary(e.target.checked)}
                                        className="w-4 h-4 accent-accent"
                                    />
                                    <span className="text-[10px] font-bold text-text-secondary uppercase">Use Glossary</span>
                                </label>
                            </div>

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
            </div>

            <div className="flex-1 flex gap-4 p-4 min-h-0 overflow-hidden">
                <div className="flex-1 bg-bg-surface/40 border border-white/5 rounded-2xl flex flex-col relative focus-within:ring-1 focus-within:ring-accent/50 transition-all shadow-lg overflow-hidden">
                    <div className="flex justify-between items-center p-3 border-b border-white/5 bg-white/5">
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Source</span>
                        {sourceText && (
                            <button onClick={() => setSourceText('')} className="text-text-secondary hover:text-white text-[10px] uppercase font-bold">Clear</button>
                        )}
                    </div>
                    <textarea 
                        value={sourceText}
                        onChange={(e) => setSourceText(e.target.value)}
                        placeholder="Type or paste text here to translate..."
                        className="flex-1 w-full p-5 bg-transparent resize-none focus:outline-none text-[14px] leading-relaxed text-text-primary placeholder:text-text-secondary/30 overflow-y-auto custom-scrollbar"
                    />
                    <div className="p-2 text-right text-[10px] text-text-secondary/50 border-t border-white/5">
                        {sourceText.length} characters
                    </div>
                </div>

                <div className="flex-1 bg-[#0c0c0c]/80 border border-white/5 rounded-2xl flex flex-col relative shadow-inner overflow-hidden">
                    <div className="flex justify-between items-center p-3 border-b border-white/5 bg-black/40">
                        <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Translation</span>
                        <div className="flex gap-2">
                            {translationResult && (
                                <>
                                    <button 
                                        onClick={handleNaturalize}
                                        className="px-3 py-1 bg-accent/20 text-accent text-[10px] font-bold uppercase rounded hover:bg-accent/30 transition-all"
                                    >
                                        Naturalize
                                    </button>
                                    <button onClick={() => handleCopy('main', translationResult.culturallyAwareTranslation)} className="text-text-secondary hover:text-white">
                                        {copiedStates['main'] ? <CheckIcon className="w-4 h-4 text-green-400"/> : <CopyIcon className="w-3 h-3"/>}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar relative">
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-bg-main/50 backdrop-blur-sm z-10">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-[10px] font-bold text-accent uppercase tracking-widest animate-pulse">Processing Cultural Nuance...</span>
                                </div>
                            </div>
                        )}

                        {!translationResult && !isLoading && (
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

                        {translationResult && (
                            <div className="animate-fade-in space-y-4">
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

                                <div className="grid grid-cols-1 gap-3">
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Literal Translation</h4>
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

                <div className="w-80 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                    <CulturalRiskPanel risks={culturalRisks} />
                    <CulturalInsightsPanel insights={culturalInsights} targetLang={targetLang} dialect={dialect} />
                </div>
            </div>
        </div>
    );
};

export default EnhancedStudio;
