
import React, { useState, useCallback } from 'react';
import { 
    translateScript, generateSynopsis, analyzeCharacters, generateCulturalReport, analyzeAudienceReception,
    analyzeSceneBreakdown, generateCastingSide, generateDubbingGuide, generateStoryboardPrompts
} from '../../services/geminiService';
import { LANGUAGES, TONES } from '../../constants';
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
                <div className="w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center mb-6 border border-accent/20 shadow-[0_0_40px_-10px_rgba(244,163,0,0.3)]">
                    <ScriptIcon className="w-10 h-10 text-accent" />
                </div>
                <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Script Toolkit</h1>
                <p className="text-sm text-text-secondary mb-10 max-w-lg leading-relaxed mx-auto">
                    Generate <span className="text-accent">casting sides</span>, <span className="text-accent">dubbing scripts</span>, and <span className="text-accent">cultural reports</span> instantly.
                </p>
                <div 
                    className={`w-full max-w-2xl h-56 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer group mx-auto ${isDragging ? 'border-accent bg-accent/10 scale-105' : 'border-border-default bg-bg-surface/30 hover:border-accent hover:bg-bg-surface/50'}`}
                >
                    {isDragging ? (
                        <div className="pointer-events-none flex flex-col items-center animate-pulse">
                            <CheckIcon className="w-10 h-10 text-accent mb-2" />
                            <p className="text-accent font-bold text-lg">Drop script file here</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-text-primary font-medium group-hover:text-white transition-colors text-sm">Drag & drop your script file</p>
                            <span className="text-[10px] text-text-secondary/50 my-3 uppercase tracking-widest font-bold">OR</span>
                            <label className="bg-white/10 border border-white/10 text-white font-bold px-6 py-2.5 rounded-lg cursor-pointer hover:bg-white/20 transition-all shadow-lg backdrop-blur-sm text-xs">
                                Browse Files
                                <input type="file" className="hidden" onChange={handleFileChange} accept=".txt,.fountain,.fdx,.pdf" />
                            </label>
                            <p className="text-[9px] text-text-secondary mt-4 font-mono opacity-60">Supports .txt, .fountain, .fdx, .pdf</p>
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
        { id: 'storyboard', name: 'Visual Prompts', icon: <FilmStripIcon className="w-5 h-5" />, category: 'Visuals' },
        { id: 'synopsis', name: 'Logline & Synopsis', icon: <SynopsisIcon className="w-5 h-5" />, category: 'Narrative' },
    ];

    return (
        <div 
            className="flex flex-col h-full animate-fade-in bg-bg-main overflow-hidden relative w-full"
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

            {/* Main Container */}
            <div className="flex-1 w-full max-w-[1920px] mx-auto flex flex-col min-h-0">
                
                {/* Header / Control Bar */}
                <div className="flex-shrink-0 bg-bg-surface border-b border-border-default p-4 shadow-sm z-10">
                    <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
                        {/* Title & File Info */}
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600/10 border border-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                                <ScriptIcon className="w-4 h-4" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white leading-tight">Script Editor</h1>
                                <p className="text-[10px] text-text-secondary font-mono flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                    {fileName}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full xl:w-auto">
                             <div className="flex-1 xl:flex-none grid grid-cols-2 md:grid-cols-3 gap-2">
                                <LanguageSelector label="Source" languages={LANGUAGES} value={sourceLang} onChange={setSourceLang} />
                                <LanguageSelector label="Target" languages={LANGUAGES} value={targetLang} onChange={setTargetLang} />
                                <div className="hidden md:block">
                                    <ToneSelector label="Tone" tones={TONES} value={tone} onChange={setTone} />
                                </div>
                            </div>
                            <div className="h-8 w-px bg-border-default mx-1 hidden xl:block"></div>
                            <button onClick={handleTranslate} disabled={isLoading || !!isAnalyzing} className="px-5 py-2 bg-accent text-bg-main font-black text-[10px] rounded-lg hover:bg-white transition-colors shadow-lg shadow-accent/10 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest whitespace-nowrap">
                                {isLoading ? 'Translating...' : 'Translate Script'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Workspace Grid */}
                <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-0 xl:gap-0 overflow-hidden">
                    
                    {/* Editors Area (Left) */}
                    <div className="xl:col-span-8 flex flex-col min-h-0 bg-[#0F0F0F] relative">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-px bg-border-default min-h-0">
                            {/* Source Editor */}
                            <div className="flex flex-col h-full bg-[#0F0F0F] overflow-hidden">
                                <div className="flex-shrink-0 p-2 px-3 border-b border-border-default bg-bg-surface/50 flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.2em]">Source</span>
                                    <button onClick={handleReset} className="text-[9px] font-bold text-text-secondary hover:text-red-400 uppercase tracking-wider transition-colors">Clear</button>
                                </div>
                                <textarea 
                                    readOnly 
                                    value={sourceText} 
                                    className="flex-1 w-full p-4 bg-transparent resize-none font-mono text-xs text-text-primary/90 focus:outline-none custom-scrollbar leading-relaxed" 
                                />
                            </div>

                            {/* Target Editor */}
                            <div className="flex flex-col h-full bg-[#080808] overflow-hidden relative">
                                 <div className="flex-shrink-0 p-2 px-3 border-b border-border-default bg-bg-surface/50 flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-accent uppercase tracking-[0.2em]">Translation</span>
                                    <button onClick={handleDownload} disabled={!translatedText} className="text-text-secondary hover:text-white transition-colors" title="Download Script">
                                        <DownloadIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <textarea 
                                    readOnly 
                                    value={translatedText} 
                                    placeholder="Translation will generate here..."
                                    className="flex-1 w-full p-4 bg-transparent resize-none font-mono text-xs text-white focus:outline-none custom-scrollbar placeholder:text-text-secondary/30 leading-relaxed" 
                                />
                                {isLoading && (
                                    <div className="absolute inset-0 bg-bg-surface/80 backdrop-blur-sm flex items-center justify-center z-10">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="flex items-center space-x-1.5">
                                                <span className="h-2 w-2 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                <span className="h-2 w-2 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                <span className="h-2 w-2 bg-accent rounded-full animate-bounce"></span>
                                            </div>
                                            <span className="text-[10px] font-bold text-accent uppercase tracking-widest animate-pulse">Running Neural Engine...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Production Toolkit Sidebar (Right) */}
                    <div className="xl:col-span-4 flex flex-col min-h-0 bg-bg-surface border-l border-border-default shadow-xl z-20">
                        <div className="flex-shrink-0 p-3 border-b border-border-default bg-white/[0.02]">
                            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                <ThinkingIcon className="w-3.5 h-3.5 text-accent"/> 
                                Production Toolkit
                            </h2>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
                            {/* Tool Selection Grid */}
                            <div className="grid grid-cols-2 gap-2 flex-shrink-0">
                                {PRODUCTION_TOOLS.map(tool => (
                                     <button
                                        key={tool.id}
                                        onClick={() => handleRunAnalysis(tool.id as AiAnalysisTool)}
                                        disabled={!!isAnalyzing}
                                        className={`
                                            flex flex-col items-center justify-center p-3 h-20 
                                            bg-bg-main border border-border-default rounded-lg 
                                            hover:border-accent/50 hover:bg-white/5 
                                            disabled:opacity-50 disabled:cursor-not-allowed 
                                            transition-all group relative overflow-hidden text-center gap-2
                                            ${isAnalyzing === tool.id ? 'border-accent ring-1 ring-accent/20' : ''}
                                        `}
                                    >
                                        <div className={`${isAnalyzing === tool.id ? 'text-accent animate-pulse' : 'text-text-secondary group-hover:text-accent'}`}>
                                            {tool.icon}
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-white leading-tight block">{tool.name}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Results Area */}
                            <div className="space-y-4">
                                {/* Scene Breakdown */}
                                {sceneBreakdown && (
                                    <div className="bg-bg-main rounded-lg border border-border-default overflow-hidden animate-fade-in">
                                        <div className="p-2 px-3 border-b border-border-default flex justify-between items-center bg-white/[0.02]">
                                            <h3 className="text-[10px] font-bold text-white uppercase tracking-wider">Scene Breakdown</h3>
                                            <button onClick={() => handleCopy('breakdown', JSON.stringify(sceneBreakdown, null, 2))} className="p-1 hover:bg-white/10 rounded transition-colors"><CopyIcon className="w-3 h-3"/></button>
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto">
                                            <table className="w-full text-[10px] text-left">
                                                <thead className="bg-white/5 text-text-secondary uppercase font-bold sticky top-0">
                                                    <tr>
                                                        <th className="p-2 w-8">#</th>
                                                        <th className="p-2">Slugline</th>
                                                        <th className="p-2">Cast</th>
                                                        <th className="p-2 text-right">Dur.</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {sceneBreakdown.map((scene, i) => (
                                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                                            <td className="p-2 text-text-secondary font-mono">{scene.sceneNumber}</td>
                                                            <td className="p-2 font-bold text-white">{scene.slugline} <span className="text-text-secondary font-normal block text-[9px] opacity-70">{scene.location} • {scene.time}</span></td>
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
                                        <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-1">Casting Sides</h3>
                                        {castingSides.map((side, i) => (
                                            <div key={i} className="bg-bg-main rounded-lg border border-border-default p-3 hover:border-accent/30 transition-colors">
                                                <div className="flex justify-between items-start mb-1">
                                                    <div>
                                                        <h4 className="text-xs font-bold text-white">{side.role}</h4>
                                                        <p className="text-[9px] text-text-secondary">{side.ageRange} • {side.gender} • {side.ethnicity}</p>
                                                    </div>
                                                    <button onClick={() => handleCopy(`cast-${i}`, side.bio)} className="text-text-secondary hover:text-white"><CopyIcon className="w-3 h-3"/></button>
                                                </div>
                                                <p className="text-[10px] text-text-primary mb-2 leading-relaxed opacity-80">{side.bio}</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {side.requirements.map((req, j) => (
                                                        <span key={j} className="px-1.5 py-0.5 bg-accent/10 border border-accent/20 text-accent text-[8px] rounded font-bold">{req}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Dubbing Guide */}
                                {dubbingGuide && (
                                    <div className="bg-bg-main rounded-lg border border-border-default overflow-hidden animate-fade-in">
                                        <div className="p-2 px-3 border-b border-border-default flex justify-between items-center bg-white/[0.02]">
                                            <h3 className="text-[10px] font-bold text-white uppercase tracking-wider">Dubbing Script</h3>
                                            <button onClick={() => handleCopy('dubbing', JSON.stringify(dubbingGuide, null, 2))} className="p-1 hover:bg-white/10 rounded transition-colors"><CopyIcon className="w-3 h-3"/></button>
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto p-2 space-y-1.5">
                                            {dubbingGuide.map((line, i) => (
                                                <div key={i} className="bg-white/5 p-2 rounded border border-white/5 flex gap-2.5">
                                                    <div className="text-[9px] font-mono text-accent pt-0.5 opacity-80">{line.timecode}</div>
                                                    <div className="flex-1">
                                                        <p className="text-[10px] text-text-secondary italic mb-0.5">"{line.original}"</p>
                                                        <p className="text-xs font-bold text-white">{line.translated}</p>
                                                        <div className="mt-1 flex items-center gap-1 text-[8px] text-orange-300 font-mono uppercase">
                                                            <MegaphoneIcon className="w-2.5 h-2.5"/>
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
                                        <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-1">Visual Prompts</h3>
                                        {storyboardPrompts.map((panel, i) => (
                                            <div key={i} className="bg-bg-main rounded-lg border border-border-default p-2.5">
                                                <div className="flex justify-between mb-1.5">
                                                    <span className="text-[9px] font-bold bg-white/10 px-1.5 py-0.5 rounded text-white">Scene {panel.sceneNumber}</span>
                                                    <span className="text-[9px] text-text-secondary font-mono">{panel.cameraAngle}</span>
                                                </div>
                                                <div className="bg-black/40 p-1.5 rounded border border-white/5 font-mono text-[9px] text-green-400 mb-1.5 select-all">
                                                    /imagine prompt: {panel.visualPrompt} --ar 16:9
                                                </div>
                                                <p className="text-[10px] text-text-secondary italic opacity-70">{panel.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Cultural & Other Reports (Existing) */}
                                {culturalReport && (
                                    <div className="bg-bg-main rounded-lg border border-border-default p-3 animate-fade-in">
                                        <h3 className="text-[10px] font-bold text-white uppercase tracking-wider mb-2">Cultural Adaptation Report</h3>
                                        <p className="text-[10px] text-text-secondary mb-3 leading-relaxed">{culturalReport.summary}</p>
                                        <div className="space-y-1.5">
                                            {culturalReport.adaptations.slice(0, 3).map((item, index) => (
                                                <div key={index} className="bg-white/5 p-2 rounded border border-white/5">
                                                    <div className="flex justify-between mb-0.5">
                                                        <span className="text-[10px] text-text-secondary line-through opacity-70 truncate max-w-[40%]">"{item.original}"</span>
                                                        <span className="text-[10px] text-accent font-bold truncate max-w-[40%]">"{item.adapted}"</span>
                                                    </div>
                                                    <p className="text-[9px] text-text-primary opacity-80">{item.reason}</p>
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
                        <CloseIcon className="w-3.5 h-3.5" />
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScriptTranslator;
