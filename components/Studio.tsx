import React, { useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { TranslationResult } from '../types';
import * as geminiService from '../services/geminiService';
import { getOfflineTranslation } from '../services/offlineService';
import { LANGUAGES, TONES } from '../constants';
import LanguageSelector from './LanguageSelector';
import ToneSelector from './ToneSelector';
import { TranslateIcon, CheckIcon } from './Icons';

interface StudioProps {
    isOffline: boolean;
}

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const rawHtml = marked.parse(content, { gfm: true, breaks: true }) as string;
    const sanitizedHtml = DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
    return (
        <div 
            className="prose"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
    );
};

const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className || "w-4 h-4"}>
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

    const handleTranslate = async () => {
        if (!sourceText.trim()) {
            setError("Please enter some text to translate.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setTranslationResult(null);

        try {
            // Include context in the prompt if provided
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

    return (
        <div className="flex flex-col lg:flex-row gap-4 h-full">
            {/* Left Panel */}
            <div className="w-full lg:w-1/4 bg-bg-surface p-4 rounded-lg border border-border-default flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-white">Language</h2>
                <LanguageSelector label="From" languages={LANGUAGES} value={sourceLang} onChange={setSourceLang} />
                <div>
                     <label className="text-sm font-medium text-text-secondary mb-1 block">Dialect</label>
                     <select disabled className="w-full p-2 bg-bg-main border border-border-default rounded-md text-text-secondary/50 cursor-not-allowed"><option>Default</option></select>
                </div>
                <LanguageSelector label="To" languages={LANGUAGES} value={targetLang} onChange={setTargetLang} />
                <div>
                     <label className="text-sm font-medium text-text-secondary mb-1 block">Dialect</label>
                     <select disabled className="w-full p-2 bg-bg-main border border-border-default rounded-md text-text-secondary/50 cursor-not-allowed"><option>Default</option></select>
                </div>
            </div>

            {/* Center Panel */}
            <div className="flex-1 flex flex-col gap-4">
                <div className="flex-1 flex flex-col bg-bg-surface p-4 rounded-lg border border-border-default">
                    <textarea 
                        value={sourceText}
                        onChange={(e) => setSourceText(e.target.value)}
                        placeholder="Enter text to translate..."
                        className="w-full flex-1 p-3 bg-bg-main border border-border-default rounded-lg resize-none focus:ring-2 focus:ring-accent text-lg"
                    />
                </div>
                <div className="flex-shrink-0 text-center">
                    <button 
                        onClick={handleTranslate} 
                        disabled={isLoading}
                        className="px-8 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 disabled:bg-border-default disabled:cursor-wait transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                       <TranslateIcon className="w-5 h-5"/>
                       {isLoading ? 'Translating...' : 'Translate'}
                    </button>
                    {error && <p className="text-red-400 text-center text-sm mt-2">{error}</p>}
                </div>
                 <div className="flex-1 flex flex-col bg-bg-surface p-4 rounded-lg border border-border-default overflow-hidden">
                    {isLoading && (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex items-center space-x-1.5">
                                <span className="h-2 w-2 bg-accent rounded-full animate-pulse-warm [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 bg-accent rounded-full animate-pulse-warm [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 bg-accent rounded-full animate-pulse-warm"></span>
                            </div>
                        </div>
                    )}
                    {translationResult && (
                        <div className="overflow-y-auto space-y-4 pr-2">
                             <div>
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-semibold text-accent mb-1">CULTURALLY-AWARE TRANSLATION</h3>
                                    <button onClick={() => handleCopy('cultural', translationResult.culturallyAwareTranslation)} className="p-1.5 text-text-secondary hover:bg-border-default hover:text-text-primary rounded-md" title="Copy">
                                        {copiedStates['cultural'] ? <CheckIcon className="w-4 h-4 text-accent"/> : <CopyIcon className="w-4 h-4"/>}
                                    </button>
                                </div>
                                <div className="p-3 bg-bg-main rounded-md border border-border-default/50">
                                    <MarkdownRenderer content={translationResult.culturallyAwareTranslation} />
                                </div>
                            </div>
                             <div>
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-semibold text-text-secondary mb-1">DIRECT TRANSLATION</h3>
                                     <button onClick={() => handleCopy('direct', translationResult.directTranslation)} className="p-1.5 text-text-secondary hover:bg-border-default hover:text-text-primary rounded-md" title="Copy">
                                        {copiedStates['direct'] ? <CheckIcon className="w-4 h-4 text-accent"/> : <CopyIcon className="w-4 h-4"/>}
                                    </button>
                                </div>
                                 <div className="p-3 bg-bg-main rounded-md border border-border-default/50 text-text-secondary italic">
                                     <MarkdownRenderer content={translationResult.directTranslation} />
                                 </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-text-secondary mb-1">EXPLANATION</h3>
                                 <div className="p-3 bg-bg-main rounded-md border border-border-default/50 text-text-secondary">
                                    <MarkdownRenderer content={translationResult.explanation} />
                                 </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel */}
            <div className="w-full lg:w-1/4 bg-bg-surface p-4 rounded-lg border border-border-default flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-white">Context</h2>
                <ToneSelector label="Tone" tones={TONES} value={tone} onChange={setTone} />
                 <div>
                    <label className="text-sm font-medium text-text-secondary mb-1 block">Cultural Context</label>
                    <textarea 
                        value={context}
                        onChange={e => setContext(e.target.value)}
                        placeholder="e.g., This is a marketing slogan for a young audience."
                        className="w-full h-24 p-2 bg-bg-main border border-border-default rounded-md resize-y text-sm"
                    />
                </div>
                 <div className="flex-grow">
                    <label className="text-sm font-medium text-text-secondary mb-1 block">AI Suggestions</label>
                    <div className="p-4 bg-bg-main border-2 border-dashed border-border-default rounded-md h-full flex items-center justify-center text-center">
                        <p className="text-sm text-text-secondary">AI-powered suggestions for alternative phrasing will appear here.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Studio;
