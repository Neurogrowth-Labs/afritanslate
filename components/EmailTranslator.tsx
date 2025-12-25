import React, { useState } from 'react';
import { localizeEmail } from '../services/geminiService';
import { LANGUAGES, TONES } from '../constants';
import LanguageSelector from './LanguageSelector';
import ToneSelector from './ToneSelector';
import type { EmailLocalizationResult } from '../types';
import { TranslateIcon, CheckIcon, InfoIcon, EmailIcon } from './Icons';

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75H18.5a1.125 1.125 0 011.125 1.125v9.75M9.75 3.75v13.5H3.375" />
    </svg>
);

const EmailTranslator: React.FC = () => {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [context, setContext] = useState('');
    const [targetLang, setTargetLang] = useState('sw');
    const [tone, setTone] = useState('Business');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<EmailLocalizationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

    const handleLocalize = async () => {
        if (!body.trim()) {
            setError("Email body is required.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const localized = await localizeEmail(subject, body, targetLang, tone, context);
            setResult(localized);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = (key: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedStates(prev => ({ ...prev, [key]: true }));
        setTimeout(() => setCopiedStates(prev => ({ ...prev, [key]: false })), 2000);
    };

    const handleReset = () => {
        setSubject('');
        setBody('');
        setContext('');
        setResult(null);
        setError(null);
    };

    return (
        <div className="flex flex-col h-full animate-fade-in p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto overflow-y-auto custom-scrollbar">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-4 mx-auto">
                    <EmailIcon className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Email Localization</h1>
                <p className="text-text-secondary max-w-2xl mx-auto">
                    Bridge cultural etiquette gaps in your global communication. Our AI adapts your professional drafts with perfect local social norms.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Left side: Inputs */}
                <div className="bg-bg-surface p-6 rounded-2xl border border-border-default space-y-6 shadow-xl">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <LanguageSelector label="Target Language" languages={LANGUAGES} value={targetLang} onChange={setTargetLang} />
                            <ToneSelector label="Communication Tone" tones={TONES} value={tone} onChange={setTone} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Interaction Context</label>
                            <input 
                                type="text" 
                                value={context}
                                onChange={e => setContext(e.target.value)}
                                placeholder="e.g. Introducing myself to a high-level executive partner"
                                className="w-full p-2.5 bg-bg-main border border-border-default rounded-xl focus:ring-1 focus:ring-accent outline-none text-[13px] text-white placeholder:text-text-secondary/50"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Subject Line (Optional)</label>
                            <input 
                                type="text" 
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                className="w-full p-2.5 bg-bg-main border border-border-default rounded-xl focus:ring-1 focus:ring-accent outline-none text-[13px] text-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Draft Email Body</label>
                            <textarea 
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                rows={8}
                                placeholder="Write your email here in English or any other language..."
                                className="w-full p-3 bg-bg-main border border-border-default rounded-xl focus:ring-1 focus:ring-accent outline-none text-[13px] text-white resize-none custom-scrollbar"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={handleLocalize}
                            disabled={isLoading || !body.trim()}
                            className="flex-1 py-3 bg-accent text-bg-main font-black rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-bg-main border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <><TranslateIcon className="w-4 h-4" /> LOCALIZE DRAFT</>
                            )}
                        </button>
                        {result && (
                            <button onClick={handleReset} className="px-5 py-3 bg-bg-main border border-border-default text-text-secondary font-bold rounded-xl hover:text-white transition-colors">
                                RESET
                            </button>
                        )}
                    </div>
                    {error && <p className="text-red-400 text-center text-[11px] font-bold uppercase">{error}</p>}
                </div>

                {/* Right side: Results */}
                <div className="space-y-6">
                    {result ? (
                        <div className="animate-fade-in space-y-6">
                            {/* Localized Email Card */}
                            <div className="bg-bg-surface p-6 rounded-2xl border border-border-default shadow-xl space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-border-default">
                                    <h2 className="text-sm font-black text-accent uppercase tracking-widest">Localized Draft</h2>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleCopy('localized', `Subject: ${result.subject}\n\n${result.body}`)} className="p-2 text-text-secondary hover:text-white bg-bg-main rounded-lg border border-border-default transition-all">
                                            {copiedStates['localized'] ? <CheckIcon className="w-4 h-4 text-accent" /> : <CopyIcon />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="p-3 bg-bg-main/50 rounded-xl border border-border-default">
                                        <p className="text-[10px] font-bold text-text-secondary uppercase mb-1">Subject</p>
                                        <p className="text-sm font-semibold text-white">{result.subject}</p>
                                    </div>
                                    <div className="p-4 bg-bg-main/50 rounded-xl border border-border-default whitespace-pre-wrap text-[13px] text-text-primary leading-relaxed min-h-[150px]">
                                        {result.body}
                                    </div>
                                </div>
                            </div>

                            {/* Etiquette Tips Card */}
                            <div className="bg-accent/5 p-6 rounded-2xl border border-accent/20 shadow-xl space-y-4">
                                <div className="flex items-center gap-2">
                                    <InfoIcon className="w-5 h-5 text-accent" />
                                    <h2 className="text-sm font-black text-white uppercase tracking-widest">Cultural Etiquette Tips</h2>
                                </div>
                                <ul className="space-y-3">
                                    {result.culturalTips.map((tip, i) => (
                                        <li key={i} className="flex gap-3 text-[12px] text-text-secondary leading-relaxed">
                                            <span className="text-accent font-black">{i + 1}.</span>
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[400px] border-2 border-dashed border-border-default rounded-2xl flex flex-col items-center justify-center p-8 text-center text-text-secondary opacity-40">
                            <EmailIcon className="w-12 h-12 mb-4" />
                            <p className="text-sm font-medium">Your localized email will appear here.<br/>Specify your target audience and tone to begin.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmailTranslator;