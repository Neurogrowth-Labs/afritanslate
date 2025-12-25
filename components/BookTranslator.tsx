
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { translateBook } from '../services/geminiService';
import { LANGUAGES, TONES } from '../constants';
import LanguageSelector from './LanguageSelector';
import type { BookGenre, BookTranslationStyle, BookDialect, BookAnnotation, TranslationMetrics } from '../types';
import { BookIcon, InfoIcon, DownloadIcon, ThinkingIcon, CloseIcon } from './Icons';

// --- Icons ---
const BrainIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
);

const SlidersIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
    </svg>
);

// --- Highlighter Component --- //
interface SourceReaderProps {
    text: string;
    annotations: BookAnnotation[];
    scrollMode: 'paginated' | 'continuous';
}

const SourceReader: React.FC<SourceReaderProps> = ({ text, annotations, scrollMode }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const charsPerPage = 2000;
    
    const pageCount = Math.ceil(text.length / charsPerPage);
    
    // Process text to insert highlight spans
    const renderHighlightedText = useMemo(() => {
        let content = scrollMode === 'paginated' 
            ? text.slice((currentPage - 1) * charsPerPage, currentPage * charsPerPage)
            : text;

        if (!content) return null;

        // Naive highlighting approach: split text by phrases found in annotations
        // A robust solution would use offset indices, but for this demo, we replace string occurrences.
        // We sort annotations by length (desc) to avoid partial replacements of longer phrases.
        
        let parts: { text: string; annotation?: BookAnnotation }[] = [{ text: content }];

        const sortedAnnotations = [...annotations].sort((a, b) => b.originalPhrase.length - a.originalPhrase.length);

        sortedAnnotations.forEach(ann => {
            const newParts: typeof parts = [];
            parts.forEach(part => {
                if (part.annotation) {
                    newParts.push(part);
                } else {
                    // Split current part by the annotation phrase
                    const regex = new RegExp(`(${ann.originalPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                    const split = part.text.split(regex);
                    split.forEach(s => {
                        if (s.toLowerCase() === ann.originalPhrase.toLowerCase()) {
                            newParts.push({ text: s, annotation: ann });
                        } else if (s) {
                            newParts.push({ text: s });
                        }
                    });
                }
            });
            parts = newParts;
        });

        return (
            <div className="whitespace-pre-wrap leading-relaxed font-serif text-[15px] text-text-primary/90">
                {parts.map((part, i) => {
                    if (part.annotation) {
                        let colorClass = "";
                        switch(part.annotation.type) {
                            case 'idiom': colorClass = "bg-blue-500/30 text-blue-200 border-b border-blue-500/50"; break;
                            case 'cultural': colorClass = "bg-orange-500/30 text-orange-200 border-b border-orange-500/50"; break;
                            case 'proverb': colorClass = "bg-purple-500/30 text-purple-200 border-b border-purple-500/50"; break;
                            case 'entity': colorClass = "bg-green-500/30 text-green-200 border-b border-green-500/50"; break;
                            default: colorClass = "bg-gray-500/30";
                        }
                        return (
                            <span 
                                key={i} 
                                className={`relative group cursor-help rounded-sm px-0.5 mx-0.5 ${colorClass}`}
                            >
                                {part.text}
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-bg-surface border border-border-default rounded shadow-xl text-[11px] text-text-primary z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <strong className="block uppercase text-[9px] mb-1 opacity-70 tracking-widest">{part.annotation.type}</strong>
                                    {part.annotation.explanation}
                                    <span className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-bg-surface border-b border-r border-border-default rotate-45"></span>
                                </span>
                            </span>
                        );
                    }
                    return <span key={i}>{part.text}</span>;
                })}
            </div>
        );
    }, [text, annotations, scrollMode, currentPage]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {renderHighlightedText}
            </div>
            {scrollMode === 'paginated' && pageCount > 1 && (
                <div className="flex justify-between items-center p-3 border-t border-border-default bg-bg-surface/50 text-xs">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="hover:text-white disabled:opacity-30">Previous</button>
                    <span>Page {currentPage} of {pageCount}</span>
                    <button disabled={currentPage === pageCount} onClick={() => setCurrentPage(p => p + 1)} className="hover:text-white disabled:opacity-30">Next</button>
                </div>
            )}
        </div>
    );
};

// --- Cultural Integrity Panel Component ---
interface CulturalIntegrityPanelProps {
    isOpen: boolean;
    onClose: () => void;
    sliders: {
        style: number;
        dialect: number;
        tone: number;
    };
    onSliderChange: (key: 'style' | 'dialect' | 'tone', value: number) => void;
    metrics: TranslationMetrics | null;
}

const CulturalIntegrityPanel: React.FC<CulturalIntegrityPanelProps> = ({ isOpen, onClose, sliders, onSliderChange, metrics }) => {
    if (!isOpen) return null;

    const renderScore = (label: string, score: number, color: string) => (
        <div className="flex flex-col items-center gap-1">
            <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="24" cy="24" r="20" className="text-border-default stroke-current" strokeWidth="4" fill="none" />
                    <circle 
                        cx="24" cy="24" r="20" 
                        className={`stroke-current ${color} transition-all duration-1000 ease-out`} 
                        strokeWidth="4" 
                        fill="none" 
                        strokeDasharray={126} 
                        strokeDashoffset={126 - (126 * score) / 100} 
                    />
                </svg>
                <span className="absolute text-[10px] font-bold text-white">{score}</span>
            </div>
            <span className="text-[9px] text-text-secondary uppercase tracking-wider text-center leading-tight">{label}</span>
        </div>
    );

    const renderSlider = (label: string, leftLabel: string, rightLabel: string, value: number, onChange: (val: number) => void) => (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-text-primary uppercase tracking-widest">{label}</span>
                <span className="text-[10px] text-accent font-bold">{value}%</span>
            </div>
            <input 
                type="range" 
                min="0" 
                max="100" 
                value={value} 
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full h-1.5 bg-border-default rounded-lg appearance-none cursor-pointer accent-accent"
            />
            <div className="flex justify-between text-[9px] text-text-secondary font-medium">
                <span>{leftLabel}</span>
                <span>{rightLabel}</span>
            </div>
        </div>
    );

    return (
        <div className="absolute top-16 right-4 w-72 bg-bg-surface/95 backdrop-blur-md border border-accent/30 rounded-xl shadow-2xl z-50 animate-fade-in flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border-default flex justify-between items-center bg-accent/5">
                <div className="flex items-center gap-2">
                    <BrainIcon className="w-4 h-4 text-accent" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest">Cultural Integrity</h3>
                </div>
                <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors"><CloseIcon className="w-4 h-4"/></button>
            </div>

            {/* Metrics Section */}
            <div className="p-4 grid grid-cols-2 gap-4 border-b border-border-default bg-bg-main/30">
                {renderScore("Cultural Accuracy", metrics?.culturalAccuracy || 0, "text-green-400")}
                {renderScore("Idiom Preservation", metrics?.idiomPreservation || 0, "text-blue-400")}
                {renderScore("Readability", metrics?.readability || 0, "text-yellow-400")}
                {renderScore("Localization Depth", metrics?.localizationDepth || 0, "text-purple-400")}
            </div>

            {/* Controls Section */}
            <div className="p-5 space-y-6">
                {renderSlider("Translation Style", "Literal", "Adaptive", sliders.style, (v) => onSliderChange('style', v))}
                {renderSlider("Dialect Preference", "Modern", "Traditional", sliders.dialect, (v) => onSliderChange('dialect', v))}
                {renderSlider("Tone & Voice", "Academic", "Storytelling", sliders.tone, (v) => onSliderChange('tone', v))}
                
                <div className="pt-2">
                    <p className="text-[10px] text-text-secondary italic text-center">
                        Adjust sliders to refine the next translation chunk.
                    </p>
                </div>
            </div>
        </div>
    );
};


const BookTranslator: React.FC = () => {
    const [sourceText, setSourceText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [culturalNotes, setCulturalNotes] = useState('');
    const [annotations, setAnnotations] = useState<BookAnnotation[]>([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [fileName, setFileName] = useState('');
    const [scrollMode, setScrollMode] = useState<'paginated' | 'continuous'>('continuous');

    // Advanced Configuration States
    const [sourceLang, setSourceLang] = useState<string>('en');
    const [targetLang, setTargetLang] = useState<string>('sw');
    const [genre, setGenre] = useState<BookGenre>('Literary Fiction');
    const [culturalContext, setCulturalContext] = useState('');

    // Integrity Panel State
    const [showIntegrityPanel, setShowIntegrityPanel] = useState(false);
    const [metrics, setMetrics] = useState<TranslationMetrics | null>(null);
    const [sliders, setSliders] = useState({
        style: 50,   // 0=Literal, 100=Adaptive
        dialect: 50, // 0=Modern, 100=Traditional
        tone: 50     // 0=Academic, 100=Storytelling
    });

    useEffect(() => {
        if(isLoading) {
            setTranslatedText(''); 
            setCulturalNotes('');
            setAnnotations([]);
            setMetrics(null);
        }
    }, [isLoading]);

    const handleSliderChange = (key: 'style' | 'dialect' | 'tone', value: number) => {
        setSliders(prev => ({ ...prev, [key]: value }));
    };

    const getSliderDescription = (val: number, type: 'style' | 'dialect' | 'tone'): string => {
        if (type === 'style') {
            if (val < 30) return 'Strictly Literal';
            if (val < 70) return 'Balanced / Adaptive';
            return 'Highly Culturally Localized';
        }
        if (type === 'dialect') {
            if (val < 30) return 'Modern / Urban Standard';
            if (val < 70) return 'Regional / Mixed';
            return 'Deep Traditional / Indigenous';
        }
        // tone
        if (val < 30) return 'Academic / Formal';
        if (val < 70) return 'Neutral / Narrative';
        return 'Storytelling / Poetic / Oral Tradition';
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setSourceText(text);
                setTranslatedText('');
                setCulturalNotes('');
                setAnnotations([]);
                setMetrics(null);
                setError(null);
                setProgress(0);
            };
            reader.readAsText(file);
        }
    };

    const handleProgressUpdate = (newProgress: number, translatedChunk: string, notesChunk: string, newAnnotations: BookAnnotation[], newMetrics: TranslationMetrics) => {
        setProgress(newProgress);
        setTranslatedText(prev => prev + translatedChunk);
        setCulturalNotes(prev => prev + notesChunk);
        setAnnotations(prev => [...prev, ...newAnnotations]);
        // Update metrics with the latest chunk's evaluation
        if (newMetrics.culturalAccuracy > 0) {
            setMetrics(newMetrics);
        }
    };

    const handleTranslate = async () => {
        if (!sourceText) return;
        setIsLoading(true);
        setError(null);
        setShowIntegrityPanel(true); // Auto-open panel on start to show metrics populating

        const styleDesc = getSliderDescription(sliders.style, 'style');
        const dialectDesc = getSliderDescription(sliders.dialect, 'dialect');
        const toneDesc = getSliderDescription(sliders.tone, 'tone');

        try {
            await translateBook(
                sourceText, 
                sourceLang, 
                targetLang, 
                toneDesc,
                { 
                    genre, 
                    style: styleDesc as BookTranslationStyle, // Casting for compat, though string is fine
                    dialect: dialectDesc as BookDialect,
                    culturalContext 
                },
                handleProgressUpdate
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
            setProgress(100);
        }
    };

    const handleDownload = () => {
        const content = `
TITLE: ${fileName || 'Translated Book'}
TARGET CONTEXT: ${culturalContext || 'General'}
METRICS: Accuracy ${metrics?.culturalAccuracy}% | Idioms ${metrics?.idiomPreservation}%
---------------------------------------------------

${translatedText}

---------------------------------------------------
CULTURAL INTELLIGENCE NOTES:
${culturalNotes}
        `;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `translated_${fileName || 'book'}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setSourceText('');
        setTranslatedText('');
        setCulturalNotes('');
        setAnnotations([]);
        setMetrics(null);
        setFileName('');
        setError(null);
        setIsLoading(false);
        setProgress(0);
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
                setTranslatedText('');
                setCulturalNotes('');
                setAnnotations([]);
                setMetrics(null);
                setError(null);
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
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in px-4">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-6">
                    <BookIcon className="w-8 h-8 text-accent" />
                </div>
                <h1 className="text-4xl font-bold text-text-primary">Literary Studio</h1>
                <p className="text-lg text-text-secondary mt-3 max-w-2xl">
                    Professional long-form translation with deep cultural intelligence. 
                    Preserves narrative continuity, adapts idioms, and provides reasoning notes.
                </p>
                
                <div 
                    onDrop={onDrop} 
                    onDragOver={onDragOver}
                    className="mt-10 w-full max-w-2xl h-64 border-2 border-dashed border-border-default rounded-2xl flex flex-col items-center justify-center bg-bg-surface/30 hover:border-accent hover:bg-bg-surface transition-all group cursor-pointer"
                >
                    <p className="text-text-primary font-medium group-hover:scale-105 transition-transform">Drag & drop your manuscript here</p>
                    <p className="text-text-secondary my-2 text-sm">or</p>
                     <label className="bg-accent text-bg-main font-bold px-6 py-2.5 rounded-xl cursor-pointer hover:bg-accent/90 transition-colors shadow-lg shadow-accent/10">
                        Upload File
                        <input type="file" className="hidden" onChange={handleFileChange} accept=".txt,.md,.docx,.pdf" />
                    </label>
                    <p className="text-[10px] text-text-secondary mt-4 uppercase tracking-widest opacity-60">Supports .txt, .md</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-fade-in bg-[#0d0d0d] relative">
            {/* Header Configuration Panel */}
            <div className="flex-shrink-0 p-4 border-b border-border-default bg-bg-surface z-10 shadow-sm">
                <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-4">
                     <div className="flex items-center gap-3">
                        <div className="bg-accent/20 p-2 rounded-lg"><BookIcon className="w-5 h-5 text-accent"/></div>
                        <div>
                            <h1 className="text-xl font-bold text-white leading-none">Literary Studio</h1>
                            <p className="text-[11px] text-text-secondary truncate max-w-xs mt-1 font-mono">{fileName}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3 w-full xl:w-auto">
                         <button 
                            onClick={() => setShowIntegrityPanel(!showIntegrityPanel)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-bold transition-colors ${showIntegrityPanel ? 'bg-accent/10 border-accent text-accent' : 'bg-bg-main border-border-default text-text-secondary hover:text-white'}`}
                         >
                            <BrainIcon className="w-4 h-4"/>
                            <span>Cultural Integrity</span>
                         </button>
                         <div className="h-6 w-px bg-border-default mx-1"></div>
                         <button onClick={handleTranslate} disabled={isLoading} className="flex-1 xl:flex-none px-6 py-2.5 bg-accent text-bg-main font-bold rounded-lg hover:scale-105 active:scale-95 disabled:bg-border-default disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/20">
                            {isLoading ? 'Translating...' : 'Translate Manuscript'}
                        </button>
                        <button onClick={handleDownload} disabled={!translatedText} className="p-2.5 bg-bg-main border border-border-default text-white rounded-lg hover:bg-border-default disabled:opacity-50 transition-colors" title="Download">
                            <DownloadIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={handleReset} className="px-4 py-2.5 bg-bg-main border border-border-default text-text-secondary font-semibold rounded-lg hover:text-white transition-colors">New</button>
                    </div>
                </div>

                {/* Basic Controls */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-bg-main rounded-xl border border-border-default/50">
                    <LanguageSelector label="Source" languages={LANGUAGES} value={sourceLang} onChange={setSourceLang} />
                    <LanguageSelector label="Target" languages={LANGUAGES} value={targetLang} onChange={setTargetLang} />
                    
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Genre</label>
                        <select value={genre} onChange={e => setGenre(e.target.value as BookGenre)} className="w-full p-1.5 bg-bg-surface border border-border-default rounded text-[11px] text-white focus:ring-1 focus:ring-accent outline-none">
                            {['Literary Fiction', 'Academic', 'Business', 'Religious', 'Children', 'Poetry', 'Non-Fiction'].map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Target Context</label>
                        <input 
                            type="text" 
                            value={culturalContext} 
                            onChange={e => setCulturalContext(e.target.value)} 
                            placeholder="e.g. Modern Urban Youth" 
                            className="w-full p-1.5 bg-bg-surface border border-border-default rounded text-[11px] text-white focus:ring-1 focus:ring-accent outline-none placeholder:text-text-secondary/50"
                        />
                    </div>
                </div>

                 {(isLoading || progress > 0) && (
                    <div className="mt-4 relative h-1 bg-border-default rounded-full overflow-hidden">
                        <div className="absolute top-0 left-0 h-full bg-accent transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                    </div>
                )}
                {error && <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs text-center">{error}</div>}
            </div>

            {/* Cultural Integrity Panel (Floating) */}
            <CulturalIntegrityPanel 
                isOpen={showIntegrityPanel} 
                onClose={() => setShowIntegrityPanel(false)}
                sliders={sliders}
                onSliderChange={handleSliderChange}
                metrics={metrics}
            />

            {/* Main 2-Column Editor Layout */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* 1. Source Text Reader */}
                <div className="flex-1 flex flex-col border-r border-border-default min-w-[300px]">
                    <div className="p-2 border-b border-border-default bg-bg-surface/50 flex justify-between items-center sticky top-0">
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Source Book Reader</span>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span><span className="text-[9px] text-text-secondary">Idiom</span>
                                <span className="w-2 h-2 rounded-full bg-orange-500"></span><span className="text-[9px] text-text-secondary">Culture</span>
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span><span className="text-[9px] text-text-secondary">Proverb</span>
                            </div>
                            <button 
                                onClick={() => setScrollMode(prev => prev === 'paginated' ? 'continuous' : 'paginated')}
                                className="text-[9px] font-bold px-2 py-1 bg-bg-main border border-border-default rounded hover:bg-border-default transition-colors uppercase tracking-wider"
                            >
                                {scrollMode} view
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden bg-bg-main">
                        <SourceReader text={sourceText} annotations={annotations} scrollMode={scrollMode} />
                    </div>
                </div>

                {/* 2. Translation Workspace */}
                <div className="flex-1 flex flex-col min-w-[300px] bg-[#111]">
                    <div className="p-2 border-b border-border-default bg-bg-surface/50 flex justify-between items-center sticky top-0">
                        <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Translation Workspace</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-green-400 font-bold uppercase animate-pulse">{isLoading ? 'Syncing...' : 'Live'}</span>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <textarea 
                            value={translatedText}
                            onChange={(e) => setTranslatedText(e.target.value)}
                            placeholder="Translation will generate here..."
                            className="flex-1 w-full p-6 bg-transparent resize-none focus:outline-none text-[15px] leading-relaxed text-text-primary font-serif overflow-y-auto custom-scrollbar" 
                        />
                        {/* Inline Explanations Section (Collapsible) */}
                        {culturalNotes && (
                            <div className="border-t border-border-default bg-bg-surface/20 max-h-[30%] flex flex-col">
                                <div className="p-2 px-4 bg-bg-surface/50 text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2 cursor-pointer hover:text-white">
                                    <InfoIcon className="w-3 h-3"/> AI Explanations & Notes
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                    <div className="prose prose-invert prose-sm max-w-none text-[12px] text-text-secondary leading-normal whitespace-pre-wrap font-mono">
                                        {culturalNotes}
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

export default BookTranslator;
