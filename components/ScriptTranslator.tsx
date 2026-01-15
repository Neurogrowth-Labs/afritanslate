
import React, { useState, useCallback } from 'react';
import { 
    translateScript, generateSynopsis, analyzeCharacters, generateCulturalReport, analyzeAudienceReception,
    analyzeSceneBreakdown, generateCastingSide, generateDubbingGuide, generateStoryboardPrompts
} from '../services/geminiService';
import { LANGUAGES, TONES } from '../constants';
import LanguageSelector from './LanguageSelector';
import ToneSelector from './ToneSelector';
import type { 
    Synopsis, CharacterProfile, CulturalReport, AudienceReception, AiAnalysisTool,
    SceneBreakdown, CastingSide, DubbingLine, StoryboardPanel
} from '../types';
import { 
    SynopsisIcon, CharactersIcon, CultureIcon, AudienceIcon, CheckIcon, ScriptIcon, 
    ThinkingIcon, DownloadIcon, CloseIcon, ClapperboardIcon, MegaphoneIcon, 
    FilmStripIcon, UsersIcon 
} from './Icons';

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
    const [isDragging, setIsDragging] = useState(false);

    // State for AI analysis results
    const [synopsis, setSynopsis] = useState<Synopsis | null>(null);
    const [characterProfiles, setCharacterProfiles] = useState<CharacterProfile[] | null>(null);
    const [culturalReport, setCulturalReport] = useState<CulturalReport | null>(null);
    const [audienceReception, setAudienceReception] = useState<AudienceReception | null>(null);
    const [sceneBreakdown, setSceneBreakdown] = useState<SceneBreakdown[] | null>(null);
    const [castingSides, setCastingSides] = useState<CastingSide[] | null>(null);
    const [dubbingGuide, setDubbingGuide] = useState<DubbingLine[] | null>(null);
    const [storyboardPrompts, setStoryboardPrompts] = useState<StoryboardPanel[] | null>(null);
    
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            loadFile(file);
        }
    };

    const loadFile = (file: File) => {
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            setSourceText(text);
            resetTranslationAndAnalysis();
        };
        reader.readAsText(file);
    };
    
    const resetTranslationAndAnalysis = useCallback(() => {
        setTranslatedText('');
        setError(null);
        setSynopsis(null);
        setCharacterProfiles(null);
        setCulturalReport(null);
        setAudienceReception(null);
        setSceneBreakdown(null);
        setCastingSides(null);
        setDubbingGuide(null);
        setStoryboardPrompts(null);
    }, []);

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
        if (!translatedText && tool !== 'scene_breakdown' && tool !== 'casting_sheet' && tool !== 'storyboard') {
             if(!sourceText) return;
        } else if (!translatedText && ['dubbing_script', 'cultural', 'audience'].includes(tool)) {
             setError("Please translate the script first for localization tools, or ensure source text is loaded.");
             return;
        }

        setIsAnalyzing(tool);
        setError(null);

        // Clear previous results for the specific tool
        switch (tool) {
            case 'synopsis': setSynopsis(null); break;
            case 'characters': setCharacterProfiles(null); break;
            case 'cultural': setCulturalReport(null); break;
            case 'audience': setAudienceReception(null); break;
            case 'scene_breakdown': setSceneBreakdown(null); break;
            case 'casting_sheet': setCastingSides(null); break;
            case 'dubbing_script': setDubbingGuide(null); break;
            case 'storyboard': setStoryboardPrompts(null); break;
        }

        try {
            const textToAnalyze = ['dubbing_script', 'cultural', 'audience'].includes(tool) ? translatedText : sourceText;

            switch (tool) {
                case 'synopsis':
                    setSynopsis(await generateSynopsis(textToAnalyze, targetLang));
                    break;
                case 'characters':
                    setCharacterProfiles(await analyzeCharacters(textToAnalyze, targetLang));
                    break;
                case 'cultural':
                    setCulturalReport(await generateCulturalReport(sourceText, translatedText, sourceLang, targetLang));
                    break;
                case 'audience':
                    setAudienceReception(await analyzeAudienceReception(textToAnalyze, targetLang));
                    break;
                case 'scene_breakdown':
                    setSceneBreakdown(await analyzeSceneBreakdown(sourceText));
                    break;
                case 'casting_sheet':
                    setCastingSides(await generateCastingSide(sourceText));
                    break;
                case 'dubbing_script':
                    setDubbingGuide(await generateDubbingGuide(translatedText, targetLang));
                    break;
                case 'storyboard':
                    setStoryboardPrompts(await generateStoryboardPrompts(sourceText));
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

    // Drag and Drop Handlers
    const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isDragging) setIsDragging(true);
    }, [isDragging]);

    const onDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        setIsDragging(false);
    }, []);

    const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        const file = event.dataTransfer.files?.[0];
         if (file) {
            loadFile(file);
        }
    }, [loadFile]);


    if (!sourceText) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in p-8" onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}>
                <div className="w-24 h-24 bg-accent/10 rounded-3xl flex items-center justify-center mb-8 border border-accent/20 shadow-[0_0_40px_-10px_rgba(244,163,0,0.3)]">
                    <ScriptIcon className="w-12 h-12 text-accent" />
                </div>
                <h1 className="text-5xl font-black text-white mb-4 tracking-tight">Script Translator Toolkit</h1>
                <p className="text-lg text-text-secondary mb-12 max-w-2xl leading-relaxed mx-auto">
                    The enterprise standard for screenplay localization. 
                    Generate <span className="text-accent">casting sides</span>, <span className="text-accent">dubbing scripts</span>, and <span className="text-accent">cultural reports</span> instantly.
                </p>
                <div 
                    className={`w-full max-w-3xl h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer group mx-auto ${isDragging ? 'border-accent bg-accent/10 scale-105' : 'border-border-default bg-bg-surface/30 hover:border-accent hover:bg-bg-surface/50'}`}
                >
                    {isDragging ? (
                        <div className="pointer-events-none flex flex-col items-center animate-pulse">
                            <CheckIcon className="w-12 h-12 text-accent mb-2" />
                            <p className="text-accent font-bold text-xl">Drop script file here</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-text-primary font-medium group-hover:text-white transition-colors text-lg">Drag & drop your script file</p>
                            <span className="text-xs text-text-secondary/50 my-4 uppercase tracking-widest font-bold">OR</span>
                            <label className="bg-white/10 border border-white/10 text-white font-bold px-8 py-3 rounded-xl cursor-pointer hover:bg-white/20 transition-all shadow-lg backdrop-blur-sm">
                                Browse Files
                                <input type="file" className="hidden" onChange={handleFileChange} accept=".txt,.fountain,.fdx,.pdf" />
                            </label>
                            <p className="text-[10px] text-text-secondary mt-6 font-mono opacity-60">Supports .txt, .fountain, .fdx, .pdf</p>
                        </>
                    )}
                </div>
            </div>
        );
    }
    
    const PRODUCTION_TOOLS = [
        { id: 'scene_breakdown', name: 'Scene Breakdown', icon: <ClapperboardIcon className="w-5 h-5" />, category: 'Production' },
        { id: 'casting_sheet', name: 'Casting Sheet', icon: <UsersIcon className="w-5 h-5" />, category: 'Production' },
        { id: 'dubbing_script', name: 'Dubbing Guide', icon: <MegaphoneIcon className="w-5 h-5" />, category: 'Localization' },
        { id: 'cultural', name: 'Cultural Report', icon: <CultureIcon className="w-5 h-5" />, category: 'Localization' },
        { id: 'storyboard', name: 'Storyboard Prompts', icon: <FilmStripIcon className="w-5 h-5" />, category: 'Visuals' },
        { id: 'synopsis', name: 'Logline & Synopsis', icon: <SynopsisIcon className="w-5 h-5" />, category: 'Narrative' },
    ];

    return (
        <div 
            className="flex flex-col h-full animate-fade-in bg-bg-main overflow-hidden relative"
            onDrop={onDrop} 
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
        >
            {/* Drag Overlay */}
            {isDragging && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in">
                    <div className="border-4 border-accent border-dashed rounded-3xl w-full h-full flex flex-col items-center justify-center">
                        <ScriptIcon className="w-20 h-20 text-accent mb-6 animate-bounce" />
                        <h2 className="text-4xl font-bold text-white">Drop to Replace Script</h2>
                        <p className="text-text-secondary mt-2">Release to load new file</p>
                    </div>
                </div>
            )}

            {/* Main Container for "Space on Edges" */}
            <div className="flex-1 w-full max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col min-h-0">
                
                {/* Header / Control Bar */}
                <div className="flex-shrink-0 bg-bg-surface border border-border-default rounded-2xl p-5 mb-6 shadow-xl relative z-10">
                    <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
                        {/* Title & File Info */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                                <ScriptIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white leading-tight">Script Editor <span className="text-text-secondary font-normal mx-2 hidden sm:inline">|</span> <span className="text-accent text-sm uppercase tracking-wider block sm:inline mt-1 sm:mt-0">Production Mode</span></h1>
                                <p className="text-xs text-text-secondary mt-1 font-mono flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    {fileName}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto mt-4 xl:mt-0">
                             <div className="flex-1 xl:flex-none grid grid-cols-2 md:grid-cols-3 gap-3">
                                <LanguageSelector label="Source" languages={LANGUAGES} value={sourceLang} onChange={setSourceLang} />
                                <LanguageSelector label="Target" languages={LANGUAGES} value={targetLang} onChange={setTargetLang} />
                                <div className="hidden md:block">
                                    <ToneSelector label="Tone" tones={TONES} value={tone} onChange={setTone} />
                                </div>
                            </div>
                            <div className="h-10 w-px bg-border-default mx-2 hidden xl:block"></div>
                            <button onClick={handleTranslate} disabled={isLoading || !!isAnalyzing} className="px-6 py-3 bg-accent text-bg-main font-black text-xs rounded-xl hover:bg-white transition-colors shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest whitespace-nowrap">
                                {isLoading ? 'Translating...' : 'Translate Script'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Workspace Grid */}
                <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-6 overflow-y-auto xl:overflow-hidden">
                    
                    {/* Editors Area (Left) */}
                    <div className="xl:col-span-8 flex flex-col gap-4 min-h-0">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
                            {/* Source Editor */}
                            <div className="flex flex-col min-h-[300px] h-full bg-[#0F0F0F] border border-border-default rounded-2xl overflow-hidden shadow-lg relative group focus-within:border-white/20 transition-all">
                                <div className="flex-shrink-0 p-4 border-b border-border-default bg-white/[0.02] flex justify-between items-center backdrop-blur-md">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">Source Script</span>
                                        <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] text-text-primary font-mono border border-white/5">{sourceLang}</span>
                                    </div>
                                    <button onClick={handleReset} className="text-[10px] font-bold text-text-secondary hover:text-red-400 uppercase tracking-wider transition-colors">Clear</button>
                                </div>
                                <textarea 
                                    readOnly 
                                    value={sourceText} 
                                    className="flex-1 w-full p-6 bg-transparent resize-none font-mono text-sm text-text-primary/90 focus:outline-none custom-scrollbar leading-relaxed" 
                                />
                            </div>

                            {/* Target Editor */}
                            <div className="flex flex-col min-h-[300px] h-full bg-[#050505] border border-border-default rounded-2xl overflow-hidden shadow-lg relative group focus-within:border-accent/50 transition-all">
                                 <div className="flex-shrink-0 p-4 border-b border-border-default bg-white/[0.02] flex justify-between items-center backdrop-blur-md">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-accent uppercase tracking-[0.2em]">Translation</span>
                                        <span className="px-1.5 py-0.5 rounded bg-accent/10 text-[9px] text-accent font-mono border border-accent/20">{targetLang}</span>
                                    </div>
                                    <button onClick={handleDownload} disabled={!translatedText} className="text-text-secondary hover:text-white transition-colors" title="Download Script">
                                        <DownloadIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                <textarea 
                                    readOnly 
                                    value={translatedText} 
                                    placeholder="Translation will generate here..."
                                    className="flex-1 w-full p-6 bg-transparent resize-none font-mono text-sm text-white focus:outline-none custom-scrollbar placeholder:text-text-secondary/30 leading-relaxed" 
                                />
                                {isLoading && (
                                    <div className="absolute inset-0 bg-bg-surface/90 backdrop-blur-sm flex items-center justify-center z-10">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="flex items-center space-x-2">
                                                <span className="h-3 w-3 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                <span className="h-3 w-3 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                <span className="h-3 w-3 bg-accent rounded-full animate-bounce"></span>
                                            </div>
                                            <span className="text-xs font-bold text-accent uppercase tracking-widest animate-pulse">Running Neural Engine...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Production Toolkit Sidebar (Right) */}
                    <div className="xl:col-span-4 flex flex-col min-h-[400px] xl:min-h-0 bg-bg-surface border border-border-default rounded-2xl overflow-hidden shadow-xl mb-6 xl:mb-0">
                        <div className="flex-shrink-0 p-5 border-b border-border-default bg-white/[0.02] backdrop-blur-md">
                            <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                <ThinkingIcon className="w-4 h-4 text-accent"/> 
                                Global Production Toolkit
                            </h2>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar flex flex-col gap-6">
                            {/* Tool Selection Grid */}
                            <div className="grid grid-cols-2 gap-2.5 flex-shrink-0">
                                {PRODUCTION_TOOLS.map(tool => (
                                     <button
                                        key={tool.id}
                                        onClick={() => handleRunAnalysis(tool.id as AiAnalysisTool)}
                                        disabled={!!isAnalyzing}
                                        className={`
                                            flex flex-col items-start justify-between p-3.5 h-24 
                                            bg-bg-main border border-border-default rounded-xl 
                                            hover:border-accent/50 hover:bg-white/5 
                                            disabled:opacity-50 disabled:cursor-not-allowed 
                                            transition-all group relative overflow-hidden
                                            ${isAnalyzing === tool.id ? 'border-accent ring-1 ring-accent/20' : ''}
                                        `}
                                    >
                                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                            {React.cloneElement(tool.icon as React.ReactElement, { className: "w-12 h-12" })}
                                        </div>
                                        <div className={`${isAnalyzing === tool.id ? 'text-accent animate-pulse' : 'text-text-secondary group-hover:text-accent'}`}>
                                            {tool.icon}
                                        </div>
                                        <div>
                                            <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider block mb-0.5 opacity-60">{tool.category}</span>
                                            <span className="text-[11px] font-bold text-white leading-tight">{tool.name}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Results Area */}
                            <div className="space-y-4">
                                {/* Scene Breakdown */}
                                {sceneBreakdown && (
                                    <div className="bg-bg-main rounded-xl border border-border-default overflow-hidden animate-fade-in">
                                        <div className="p-3 border-b border-border-default flex justify-between items-center bg-white/[0.02]">
                                            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Scene Breakdown</h3>
                                            <button onClick={() => handleCopy('breakdown', JSON.stringify(sceneBreakdown, null, 2))} className="p-1.5 hover:bg-white/10 rounded transition-colors"><CopyIcon/></button>
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto">
                                            <table className="w-full text-[10px] text-left">
                                                <thead className="bg-white/5 text-text-secondary uppercase font-bold sticky top-0">
                                                    <tr>
                                                        <th className="p-2 w-10">#</th>
                                                        <th className="p-2">Slugline</th>
                                                        <th className="p-2">Cast</th>
                                                        <th className="p-2 text-right">Dur.</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {sceneBreakdown.map((scene, i) => (
                                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                                            <td className="p-2 text-text-secondary font-mono">{scene.sceneNumber}</td>
                                                            <td className="p-2 font-bold text-white">{scene.slugline} <span className="text-text-secondary font-normal block text-[9px]">{scene.location} • {scene.time}</span></td>
                                                            <td className="p-2 text-text-secondary">{scene.characters.join(', ')}</td>
                                                            <td className="p-2 text-right font-mono text-accent">{scene.estimatedDuration}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Casting Sides */}
                                {castingSides && (
                                    <div className="space-y-3 animate-fade-in">
                                        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest pl-1">Casting Sides</h3>
                                        {castingSides.map((side, i) => (
                                            <div key={i} className="bg-bg-main rounded-xl border border-border-default p-4 hover:border-accent/30 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-white">{side.role}</h4>
                                                        <p className="text-[10px] text-text-secondary">{side.ageRange} • {side.gender} • {side.ethnicity}</p>
                                                    </div>
                                                    <button onClick={() => handleCopy(`cast-${i}`, side.bio)} className="text-text-secondary hover:text-white"><CopyIcon/></button>
                                                </div>
                                                <p className="text-xs text-text-primary mb-3 leading-relaxed">{side.bio}</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {side.requirements.map((req, j) => (
                                                        <span key={j} className="px-2 py-1 bg-accent/10 border border-accent/20 text-accent text-[9px] rounded font-bold">{req}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Dubbing Guide */}
                                {dubbingGuide && (
                                    <div className="bg-bg-main rounded-xl border border-border-default overflow-hidden animate-fade-in">
                                        <div className="p-3 border-b border-border-default flex justify-between items-center bg-white/[0.02]">
                                            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Dubbing Script</h3>
                                            <button onClick={() => handleCopy('dubbing', JSON.stringify(dubbingGuide, null, 2))} className="p-1.5 hover:bg-white/10 rounded transition-colors"><CopyIcon/></button>
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto p-2 space-y-2">
                                            {dubbingGuide.map((line, i) => (
                                                <div key={i} className="bg-white/5 p-3 rounded border border-white/5 flex gap-3">
                                                    <div className="text-[10px] font-mono text-accent pt-0.5">{line.timecode}</div>
                                                    <div className="flex-1">
                                                        <p className="text-xs text-text-secondary italic mb-1">"{line.original}"</p>
                                                        <p className="text-sm font-bold text-white">{line.translated}</p>
                                                        <div className="mt-2 flex items-center gap-1.5 text-[9px] text-orange-300 font-mono uppercase">
                                                            <MegaphoneIcon className="w-3 h-3"/>
                                                            {line.lipSyncNote}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Storyboard Prompts */}
                                {storyboardPrompts && (
                                    <div className="space-y-3 animate-fade-in">
                                        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest pl-1">Visual Prompts</h3>
                                        {storyboardPrompts.map((panel, i) => (
                                            <div key={i} className="bg-bg-main rounded-xl border border-border-default p-3">
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded text-white">Scene {panel.sceneNumber}</span>
                                                    <span className="text-[10px] text-text-secondary font-mono">{panel.cameraAngle}</span>
                                                </div>
                                                <div className="bg-black/40 p-2 rounded border border-white/5 font-mono text-[10px] text-green-400 mb-2 select-all">
                                                    /imagine prompt: {panel.visualPrompt} --ar 16:9
                                                </div>
                                                <p className="text-[11px] text-text-secondary italic">{panel.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Cultural & Other Reports (Existing) */}
                                {culturalReport && (
                                    <div className="bg-bg-main rounded-xl border border-border-default p-4 animate-fade-in">
                                        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Cultural Adaptation Report</h3>
                                        <p className="text-xs text-text-secondary mb-4 leading-relaxed">{culturalReport.summary}</p>
                                        <div className="space-y-2">
                                            {culturalReport.adaptations.slice(0, 3).map((item, index) => (
                                                <div key={index} className="bg-white/5 p-2 rounded border border-white/5">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-xs text-text-secondary line-through opacity-70 truncate max-w-[40%]">"{item.original}"</span>
                                                        <span className="text-xs text-accent font-bold truncate max-w-[40%]">"{item.adapted}"</span>
                                                    </div>
                                                    <p className="text-[10px] text-text-primary">{item.reason}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
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
        </div>
    );
};

export default ScriptTranslator;
