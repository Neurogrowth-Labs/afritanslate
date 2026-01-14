
import React, { useState, useCallback } from 'react';
import { translateScript, generateSynopsis, analyzeCharacters, generateCulturalReport, analyzeAudienceReception } from '../services/geminiService';
import { LANGUAGES, TONES } from '../constants';
import LanguageSelector from './LanguageSelector';
import ToneSelector from './ToneSelector';
import type { Synopsis, CharacterProfile, CulturalReport, AudienceReception, AiAnalysisTool } from '../types';
import { SynopsisIcon, CharactersIcon, CultureIcon, AudienceIcon, CheckIcon, ScriptIcon, ThinkingIcon, DownloadIcon, CloseIcon } from './Icons';

const CopyIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className || "w-4 h-4"}>
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
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in p-8">
                <div className="w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center mb-6 border border-accent/20 shadow-xl shadow-accent/5">
                    <ScriptIcon className="w-10 h-10 text-accent" />
                </div>
                <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Script Translator Toolkit</h1>
                <p className="text-lg text-text-secondary mb-10 max-w-xl leading-relaxed mx-auto">
                    Professional localization for screenplays. Adapt nuance, slang, and idioms while preserving standard script formatting.
                </p>
                <div 
                    onDrop={onDrop} 
                    onDragOver={onDragOver}
                    className="w-full max-w-2xl h-64 border-2 border-dashed border-border-default rounded-2xl flex flex-col items-center justify-center bg-bg-surface/30 hover:border-accent hover:bg-bg-surface/50 transition-all cursor-pointer group mx-auto"
                >
                    <p className="text-text-primary font-medium group-hover:text-white transition-colors">Drag & drop your script file</p>
                    <span className="text-xs text-text-secondary/50 my-3 uppercase tracking-widest font-bold">OR</span>
                     <label className="bg-white/10 border border-white/10 text-white font-semibold px-6 py-2.5 rounded-lg cursor-pointer hover:bg-white/20 transition-all shadow-sm">
                        Browse Files
                        <input type="file" className="hidden" onChange={handleFileChange} accept=".txt,.fountain,.fdx,.pdf" />
                    </label>
                    <p className="text-[10px] text-text-secondary mt-6 font-mono opacity-60">Supports .txt, .fountain, .fdx, .pdf</p>
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
        <div className="flex flex-col h-full animate-fade-in p-6 bg-bg-main overflow-hidden">
            {/* Header / Control Bar */}
            <div className="flex-shrink-0 bg-bg-surface border border-border-default rounded-xl p-5 mb-6 shadow-sm">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    {/* Title & File Info */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                            <ScriptIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white leading-tight">Script Editor</h1>
                            <p className="text-xs text-text-secondary mt-1 font-mono flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                {fileName}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                         <div className="flex-1 lg:flex-none grid grid-cols-3 gap-2">
                            <LanguageSelector label="Source" languages={LANGUAGES} value={sourceLang} onChange={setSourceLang} />
                            <LanguageSelector label="Target" languages={LANGUAGES} value={targetLang} onChange={setTargetLang} />
                            <ToneSelector label="Tone" tones={TONES} value={tone} onChange={setTone} />
                        </div>
                        <div className="h-8 w-px bg-border-default mx-1 hidden lg:block"></div>
                        <button onClick={handleTranslate} disabled={isLoading || !!isAnalyzing} className="px-5 py-2.5 bg-accent text-bg-main font-bold text-xs rounded-lg hover:bg-white transition-colors shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide whitespace-nowrap">
                            {isLoading ? 'Translating...' : 'Translate'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Workspace Grid */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Editors Area */}
                <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-4 min-h-0">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
                        {/* Source Editor */}
                        <div className="flex flex-col h-full bg-bg-surface border border-border-default rounded-xl overflow-hidden shadow-sm relative group focus-within:border-white/20 transition-colors">
                            <div className="flex-shrink-0 p-3 border-b border-border-default bg-white/[0.02] flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Original Script</span>
                                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] text-text-primary font-mono">{sourceLang}</span>
                                </div>
                                <button onClick={handleReset} className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">Clear</button>
                            </div>
                            <textarea 
                                readOnly 
                                value={sourceText} 
                                className="flex-1 w-full p-5 bg-transparent resize-none font-mono text-sm text-text-primary/80 focus:outline-none custom-scrollbar" 
                            />
                        </div>

                        {/* Target Editor */}
                        <div className="flex flex-col h-full bg-[#0a0a0a] border border-border-default rounded-xl overflow-hidden shadow-sm relative group focus-within:border-accent/50 transition-colors">
                             <div className="flex-shrink-0 p-3 border-b border-border-default bg-white/[0.02] flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Translation</span>
                                    <span className="px-1.5 py-0.5 rounded bg-accent/10 text-[9px] text-accent font-mono">{targetLang}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={handleDownload} disabled={!translatedText} className="p-1.5 text-text-secondary hover:text-white rounded hover:bg-white/10 disabled:opacity-50 transition-colors" title="Download Script">
                                        <DownloadIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <textarea 
                                readOnly 
                                value={translatedText} 
                                placeholder="Translation will appear here..."
                                className="flex-1 w-full p-5 bg-transparent resize-none font-mono text-sm text-white focus:outline-none custom-scrollbar placeholder:text-text-secondary/30" 
                            />
                            {isLoading && (
                                <div className="absolute inset-0 bg-bg-surface/90 backdrop-blur-sm flex items-center justify-center z-10">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="flex items-center space-x-1.5">
                                            <span className="h-3 w-3 bg-accent rounded-full animate-pulse-warm [animation-delay:-0.3s]"></span>
                                            <span className="h-3 w-3 bg-accent rounded-full animate-pulse-warm [animation-delay:-0.15s]"></span>
                                            <span className="h-3 w-3 bg-accent rounded-full animate-pulse-warm"></span>
                                        </div>
                                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest animate-pulse">Adapting Nuances...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Analysis Sidebar */}
                <div className="lg:col-span-4 xl:col-span-3 flex flex-col min-h-0 bg-bg-surface border border-border-default rounded-xl overflow-hidden shadow-sm">
                    <div className="flex-shrink-0 p-4 border-b border-border-default bg-white/[0.02]">
                        <h2 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            <ThinkingIcon className="w-4 h-4 text-accent"/> 
                            Production Toolkit
                        </h2>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
                        {!translatedText ? (
                             <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-white/5 rounded-lg opacity-50">
                                <ThinkingIcon className="w-8 h-8 text-text-secondary mb-2" />
                                <p className="text-xs text-text-secondary">Translate your script to unlock AI production insights.</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-2 flex-shrink-0">
                                    {AI_ANALYSIS_TOOLS.map(tool => (
                                         <button
                                            key={tool.id}
                                            onClick={() => handleRunAnalysis(tool.id as AiAnalysisTool)}
                                            disabled={!!isAnalyzing}
                                            className={`flex flex-col items-center justify-center gap-2 p-3 bg-bg-main border border-border-default rounded-lg hover:border-accent/50 hover:bg-accent/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all group ${isAnalyzing === tool.id ? 'border-accent' : ''}`}
                                        >
                                            <div className={`${isAnalyzing === tool.id ? 'text-accent animate-pulse' : 'text-text-secondary group-hover:text-white'}`}>
                                                {tool.icon}
                                            </div>
                                            <span className="text-[10px] font-bold text-text-secondary group-hover:text-white uppercase tracking-tight text-center leading-tight">{tool.name}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Results Area */}
                                <div className="space-y-4">
                                    {/* Synopsis Card */}
                                    {synopsis && (
                                        <div className="bg-bg-main rounded-lg border border-border-default overflow-hidden animate-fade-in">
                                            <div className="p-3 border-b border-border-default flex justify-between items-center bg-white/[0.02]">
                                                <h3 className="text-xs font-bold text-white">Logline & Synopsis</h3>
                                                <button onClick={() => handleCopy('synopsis', `Logline: ${synopsis.logline}\n\nSynopsis: ${synopsis.synopsis}`)} className="p-1 rounded hover:bg-white/10 transition-colors">
                                                    {copiedStates['synopsis'] ? <CheckIcon className="w-3.5 h-3.5 text-green-400"/> : <CopyIcon className="w-3.5 h-3.5 text-text-secondary hover:text-white"/>}
                                                </button>
                                            </div>
                                            <div className="p-3 text-xs space-y-3">
                                                <div>
                                                    <span className="text-[9px] font-bold text-text-secondary uppercase block mb-1">Logline</span>
                                                    <p className="text-text-primary italic leading-relaxed">"{synopsis.logline}"</p>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-bold text-text-secondary uppercase block mb-1">Synopsis</span>
                                                    <p className="text-text-secondary leading-relaxed">{synopsis.synopsis}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Characters Card */}
                                    {characterProfiles && (
                                         <div className="bg-bg-main rounded-lg border border-border-default overflow-hidden animate-fade-in">
                                             <div className="p-3 border-b border-border-default flex justify-between items-center bg-white/[0.02]">
                                                <h3 className="text-xs font-bold text-white">Character Analysis</h3>
                                                <button onClick={() => handleCopy('characters', characterProfiles.map(p => `Character: ${p.name}\nDescription: ${p.description}`).join('\n---\n'))} className="p-1 rounded hover:bg-white/10 transition-colors">
                                                    {copiedStates['characters'] ? <CheckIcon className="w-3.5 h-3.5 text-green-400"/> : <CopyIcon className="w-3.5 h-3.5 text-text-secondary hover:text-white"/>}
                                                </button>
                                            </div>
                                            <div className="p-3 text-xs space-y-3">
                                                {characterProfiles.map(char => (
                                                    <div key={char.name} className="border-b border-border-default/50 pb-2 last:border-b-0 last:pb-0">
                                                        <h4 className="font-bold text-accent mb-1">{char.name}</h4>
                                                        <p className="text-text-secondary leading-relaxed mb-1">{char.description}</p>
                                                        <p className="text-[10px] text-text-primary"><span className="text-text-secondary">Motivation:</span> {char.motivation}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                     {/* Cultural Report Card */}
                                     {culturalReport && (
                                        <div className="bg-bg-main rounded-lg border border-border-default overflow-hidden animate-fade-in">
                                            <div className="p-3 border-b border-border-default flex justify-between items-center bg-white/[0.02]">
                                                <h3 className="text-xs font-bold text-white">Cultural Report</h3>
                                                <button onClick={() => handleCopy('cultural', culturalReport.summary)} className="p-1 rounded hover:bg-white/10 transition-colors">
                                                     {copiedStates['cultural'] ? <CheckIcon className="w-3.5 h-3.5 text-green-400"/> : <CopyIcon className="w-3.5 h-3.5 text-text-secondary hover:text-white"/>}
                                                </button>
                                            </div>
                                            <div className="p-3 text-xs space-y-3">
                                                <p className="text-text-secondary leading-relaxed">{culturalReport.summary}</p>
                                                <div className="space-y-2 mt-2">
                                                    {culturalReport.adaptations.slice(0, 3).map((item, index) => (
                                                        <div key={index} className="bg-white/5 p-2 rounded border border-white/5">
                                                            <div className="flex justify-between mb-1">
                                                                <span className="text-text-secondary line-through opacity-70">"{item.original}"</span>
                                                                <span className="text-accent font-bold">"{item.adapted}"</span>
                                                            </div>
                                                            <p className="text-[10px] text-text-secondary">{item.reason}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Audience Reception Card */}
                                    {audienceReception && (
                                         <div className="bg-bg-main rounded-lg border border-border-default overflow-hidden animate-fade-in">
                                            <div className="p-3 border-b border-border-default flex justify-between items-center bg-white/[0.02]">
                                                <h3 className="text-xs font-bold text-white">Audience Reception</h3>
                                                <button onClick={() => handleCopy('audience', audienceReception.targetDemographic)} className="p-1 rounded hover:bg-white/10 transition-colors">
                                                    {copiedStates['audience'] ? <CheckIcon className="w-3.5 h-3.5 text-green-400"/> : <CopyIcon className="w-3.5 h-3.5 text-text-secondary hover:text-white"/>}
                                                </button>
                                            </div>
                                            <div className="p-3 text-xs space-y-2">
                                                <p><strong className="text-text-primary">Target:</strong> <span className="text-text-secondary">{audienceReception.targetDemographic}</span></p>
                                                <p><strong className="text-text-primary">Genre Fit:</strong> <span className="text-text-secondary">{audienceReception.genreAppeal}</span></p>
                                                <div>
                                                    <strong className="text-green-400 block mb-1">Strengths</strong>
                                                    <div className="flex flex-wrap gap-1">
                                                        {audienceReception.keyStrengths.map(s => <span key={s} className="px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded border border-green-500/20 text-[10px]">{s}</span>)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            
            {error && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-2xl text-xs font-bold animate-slide-in-up flex items-center gap-2 z-50">
                    <CloseIcon className="w-4 h-4" />
                    {error}
                </div>
            )}
        </div>
    );
};

export default ScriptTranslator;
