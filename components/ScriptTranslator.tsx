

import React, { useState, useCallback } from 'react';
import { translateScript, generateSynopsis, analyzeCharacters, generateCulturalReport, analyzeAudienceReception } from '../services/geminiService';
import { LANGUAGES, TONES } from '../constants';
import LanguageSelector from './LanguageSelector';
import ToneSelector from './ToneSelector';
import type { Synopsis, CharacterProfile, CulturalReport, AudienceReception, AiAnalysisTool } from '../types';
import { SynopsisIcon, CharactersIcon, CultureIcon, AudienceIcon, CheckIcon } from './Icons';

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75H18.5a1.125 1.125 0 011.125 1.125v9.75M9.75 3.75v13.5H3.375" />
    </svg>
);

const ScriptTranslator: React.FC = () => {
    const [sourceText, setSourceText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState<AiAnalysisTool | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [sourceLang, setSourceLang] = useState<string>('en');
    const [targetLang, setTargetLang] = useState<string>('sw');
    const [tone, setTone] = useState<string>('Formal');
    const [fileName, setFileName] = useState('');

    // State for AI analysis results
    const [synopsis, setSynopsis] = useState<Synopsis | null>(null);
    const [characterProfiles, setCharacterProfiles] = useState<CharacterProfile[] | null>(null);
    const [culturalReport, setCulturalReport] = useState<CulturalReport | null>(null);
    const [audienceReception, setAudienceReception] = useState<AudienceReception | null>(null);
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setSourceText(text);
                resetTranslationAndAnalysis();
            };
            reader.readAsText(file);
        }
    };
    
    const resetTranslationAndAnalysis = () => {
        setTranslatedText('');
        setError(null);
        setSynopsis(null);
        setCharacterProfiles(null);
        setCulturalReport(null);
        setAudienceReception(null);
    };

    const handleTranslate = async () => {
        if (!sourceText) return;
        setIsLoading(true);
        resetTranslationAndAnalysis();
        try {
            const result = await translateScript(sourceText, sourceLang, targetLang, tone);
            setTranslatedText(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRunAnalysis = async (tool: AiAnalysisTool) => {
        if (!translatedText) return;
        setIsAnalyzing(tool);
        setError(null);

        // Clear previous results for the specific tool to provide clear user feedback
        switch (tool) {
            case 'synopsis': setSynopsis(null); break;
            case 'characters': setCharacterProfiles(null); break;
            case 'cultural': setCulturalReport(null); break;
            case 'audience': setAudienceReception(null); break;
        }

        try {
            switch (tool) {
                case 'synopsis':
                    setSynopsis(await generateSynopsis(translatedText, targetLang));
                    break;
                case 'characters':
                    setCharacterProfiles(await analyzeCharacters(translatedText, targetLang));
                    break;
                case 'cultural':
                    setCulturalReport(await generateCulturalReport(sourceText, translatedText, sourceLang, targetLang));
                    break;
                case 'audience':
                    setAudienceReception(await analyzeAudienceReception(translatedText, targetLang));
                    break;
            }
        } catch (err) {
             setError(`Failed to generate ${tool} analysis. ${err instanceof Error ? err.message : ''}`);
        } finally {
            setIsAnalyzing(null);
        }
    };
    
    const handleCopy = (key: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedStates(prev => ({ ...prev, [key]: true }));
        setTimeout(() => {
            setCopiedStates(prev => ({ ...prev, [key]: false }));
        }, 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([translatedText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `translated_${fileName || 'script'}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setSourceText('');
        setTranslatedText('');
        setFileName('');
        setError(null);
        setIsLoading(false);
        resetTranslationAndAnalysis();
    };

    const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const file = event.dataTransfer.files?.[0];
         if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setSourceText(text);
                resetTranslationAndAnalysis();
            };
            reader.readAsText(file);
        }
    }, []);

    const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };


    if (!sourceText) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
                <h1 className="text-4xl font-bold text-text-primary">Script Translator</h1>
                <p className="text-lg text-text-secondary mt-2 max-w-2xl">Our Culture-Intelligent AI agent translates your scripts, preserving formatting while adapting nuances, slang, and idioms to ensure cultural and linguistic integrity.</p>
                <div 
                    onDrop={onDrop} 
                    onDragOver={onDragOver}
                    className="mt-8 w-full max-w-2xl h-64 border-2 border-dashed border-border-default rounded-lg flex flex-col items-center justify-center bg-bg-surface/50 hover:border-accent hover:bg-bg-surface transition-colors"
                >
                    <p className="text-text-primary">Drag & drop your script file here</p>
                    <p className="text-text-secondary my-2">or</p>
                     <label className="bg-accent text-white font-semibold px-4 py-2 rounded-md cursor-pointer hover:bg-accent/90 transition-colors">
                        Click to upload
                        <input type="file" className="hidden" onChange={handleFileChange} accept=".txt,.fountain,.fdx,.pdf" />
                    </label>
                    <p className="text-xs text-text-secondary mt-4">Supports .txt, .fountain, .fdx, .pdf</p>
                </div>
            </div>
        );
    }
    
    const AI_ANALYSIS_TOOLS = [
        { id: 'synopsis', name: 'Logline & Synopsis', icon: <SynopsisIcon className="w-5 h-5" /> },
        { id: 'characters', name: 'Character Profiles', icon: <CharactersIcon className="w-5 h-5" /> },
        { id: 'cultural', name: 'Cultural Report', icon: <CultureIcon className="w-5 h-5" /> },
        { id: 'audience', name: 'Audience Insights', icon: <AudienceIcon className="w-5 h-5" /> },
    ];

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="flex-shrink-0 pb-4 mb-4 border-b border-border-default">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Script Translator Toolkit</h1>
                        <p className="text-sm text-text-secondary truncate max-w-xs sm:max-w-md">File: {fileName}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                         <button onClick={handleTranslate} disabled={isLoading || !!isAnalyzing} className="px-4 py-2 bg-accent text-white font-semibold rounded-md hover:bg-accent/90 disabled:bg-border-default disabled:cursor-not-allowed transition-colors">
                            {isLoading ? 'Translating...' : 'Translate'}
                        </button>
                        <button onClick={handleDownload} disabled={!translatedText || isLoading} className="px-4 py-2 bg-bg-surface text-white font-semibold rounded-md hover:bg-border-default disabled:bg-border-default/50 disabled:text-text-secondary disabled:cursor-not-allowed transition-colors">Download</button>
                        <button onClick={handleReset} className="px-4 py-2 bg-bg-surface text-white font-semibold rounded-md hover:bg-border-default transition-colors">Start Over</button>
                    </div>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <LanguageSelector label="From" languages={LANGUAGES} value={sourceLang} onChange={setSourceLang} />
                    <LanguageSelector label="To" languages={LANGUAGES} value={targetLang} onChange={setTargetLang} />
                    <ToneSelector label="Tone" tones={TONES} value={tone} onChange={setTone} />
                </div>
                 {error && <p className="text-red-400 text-center mt-2 text-sm bg-red-500/10 p-2 rounded-md">{error}</p>}
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
                <div className="flex flex-col md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
                    <div className="flex flex-col">
                        <h2 className="text-lg font-semibold mb-2 text-text-secondary">Source ({sourceLang})</h2>
                        <textarea readOnly value={sourceText} className="w-full h-full p-3 bg-bg-surface border border-border-default rounded-md resize-none font-mono text-sm" />
                    </div>
                     <div className="flex flex-col relative">
                        <h2 className="text-lg font-semibold mb-2 text-text-secondary">Translation ({targetLang})</h2>
                        <textarea readOnly value={translatedText} className="w-full h-full p-3 bg-bg-surface border border-border-default rounded-md resize-none font-mono text-sm" />
                        {isLoading && (
                            <div className="absolute inset-0 bg-bg-surface/80 flex items-center justify-center rounded-md">
                                <div className="flex items-center space-x-1.5">
                                    <span className="h-3 w-3 bg-accent rounded-full animate-pulse-warm [animation-delay:-0.3s]"></span>
                                    <span className="h-3 w-3 bg-accent rounded-full animate-pulse-warm [animation-delay:-0.15s]"></span>
                                    <span className="h-3 w-3 bg-accent rounded-full animate-pulse-warm"></span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col overflow-y-auto pr-2">
                    <h2 className="text-lg font-semibold mb-2 text-accent">AI Analysis Toolkit</h2>
                    {!translatedText ? (
                         <div className="flex-1 flex items-center justify-center text-center bg-bg-surface border-2 border-dashed border-border-default rounded-md p-4">
                            <p className="text-text-secondary">Translate your script to unlock advanced AI analysis tools.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                {AI_ANALYSIS_TOOLS.map(tool => (
                                     <button
                                        key={tool.id}
                                        onClick={() => handleRunAnalysis(tool.id as AiAnalysisTool)}
                                        disabled={!!isAnalyzing}
                                        className="flex items-center justify-center gap-2 p-2 bg-bg-surface border border-border-default rounded-md hover:bg-border-default hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isAnalyzing === tool.id ? (
                                             <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        ) : tool.icon}
                                        <span className="text-sm">{tool.name}</span>
                                    </button>
                                ))}
                            </div>
                            
                            {synopsis && (
                                <div className="bg-bg-surface p-4 rounded-md border border-border-default animate-fade-in relative">
                                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-border-default">
                                        <h3 className="font-semibold text-white">Logline & Synopsis</h3>
                                        <button onClick={() => handleCopy('synopsis', `Logline: ${synopsis.logline}\n\nSynopsis: ${synopsis.synopsis}`)} className="p-1.5 text-text-secondary hover:bg-border-default hover:text-text-primary rounded-md" title="Copy Synopsis">
                                            {copiedStates['synopsis'] ? <CheckIcon className="w-4 h-4 text-accent"/> : <CopyIcon />}
                                        </button>
                                    </div>
                                    <h4 className="font-semibold text-text-primary mb-1">Logline</h4>
                                    <p className="text-sm text-text-secondary italic mb-3">"{synopsis.logline}"</p>
                                    <h4 className="font-semibold text-text-primary mb-1">Synopsis</h4>
                                    <p className="text-sm text-text-secondary">{synopsis.synopsis}</p>
                                </div>
                            )}

                            {characterProfiles && (
                                 <div className="bg-bg-surface p-4 rounded-md border border-border-default animate-fade-in relative">
                                     <div className="flex justify-between items-center mb-2 pb-2 border-b border-border-default">
                                        <h3 className="font-semibold text-white">Character Profiles</h3>
                                        <button onClick={() => handleCopy('characters', characterProfiles.map(p => `Character: ${p.name}\nDescription: ${p.description}\nMotivation: ${p.motivation}\nEmotional Arc: ${p.emotionalArc}`).join('\n\n---\n\n'))} className="p-1.5 text-text-secondary hover:bg-border-default hover:text-text-primary rounded-md" title="Copy Profiles">
                                            {copiedStates['characters'] ? <CheckIcon className="w-4 h-4 text-accent"/> : <CopyIcon />}
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {characterProfiles.map(char => (
                                            <div key={char.name} className="border-b border-border-default/50 pb-3 last:border-b-0 last:pb-0">
                                                <h4 className="font-semibold text-text-primary">{char.name}</h4>
                                                <p className="text-xs text-text-secondary mt-1">{char.description}</p>
                                                <p className="text-xs text-text-secondary mt-2"><strong className="text-text-primary/80">Motivation:</strong> {char.motivation}</p>
                                                <p className="text-xs text-text-secondary mt-1"><strong className="text-text-primary/80">Emotional Arc:</strong> {char.emotionalArc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                             {culturalReport && (
                                <div className="bg-bg-surface p-4 rounded-md border border-border-default animate-fade-in relative">
                                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-border-default">
                                        <h3 className="font-semibold text-white">Cultural Adaptation Report</h3>
                                        <button onClick={() => handleCopy('cultural', `Summary: ${culturalReport.summary}\n\n${culturalReport.adaptations.map(a => `Original: "${a.original}"\nAdapted: "${a.adapted}"\nReason: ${a.reason}`).join('\n\n')}`)} className="p-1.5 text-text-secondary hover:bg-border-default hover:text-text-primary rounded-md" title="Copy Report">
                                             {copiedStates['cultural'] ? <CheckIcon className="w-4 h-4 text-accent"/> : <CopyIcon />}
                                        </button>
                                    </div>
                                    <p className="text-sm text-text-secondary mb-4">{culturalReport.summary}</p>
                                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                        {culturalReport.adaptations.map((item, index) => (
                                            <div key={index} className="text-xs border-t border-border-default/50 pt-2">
                                                <p><strong className="text-text-primary">Original:</strong> "{item.original}"</p>
                                                <p><strong className="text-accent">Adapted:</strong> "{item.adapted}"</p>
                                                <p><strong className="text-text-primary">Reason:</strong> {item.reason}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {audienceReception && (
                                 <div className="bg-bg-surface p-4 rounded-md border border-border-default animate-fade-in relative">
                                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-border-default">
                                        <h3 className="font-semibold text-white">Audience Reception</h3>
                                        <button onClick={() => handleCopy('audience', `Target Demographic: ${audienceReception.targetDemographic}\nGenre Appeal: ${audienceReception.genreAppeal}\nKey Strengths: ${audienceReception.keyStrengths.join(', ')}\nPotential Challenges: ${audienceReception.potentialChallenges.join(', ')}`)} className="p-1.5 text-text-secondary hover:bg-border-default hover:text-text-primary rounded-md" title="Copy Insights">
                                            {copiedStates['audience'] ? <CheckIcon className="w-4 h-4 text-accent"/> : <CopyIcon />}
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                        <p className="text-text-secondary"><strong className="text-text-primary">Target Demo:</strong> {audienceReception.targetDemographic}</p>
                                        <p className="text-text-secondary"><strong className="text-text-primary">Genre Appeal:</strong> {audienceReception.genreAppeal}</p>
                                        <div>
                                            <strong className="text-text-primary">Key Strengths:</strong>
                                            <ul className="list-disc list-inside text-text-secondary pl-2">
                                                {audienceReception.keyStrengths.map(s => <li key={s}>{s}</li>)}
                                            </ul>
                                        </div>
                                        <div>
                                            <strong className="text-text-primary">Potential Challenges:</strong>
                                            <ul className="list-disc list-inside text-text-secondary pl-2">
                                                {audienceReception.potentialChallenges.map(c => <li key={c}>{c}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScriptTranslator;
