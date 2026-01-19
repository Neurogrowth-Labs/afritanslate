
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { startVideoGeneration, pollVideoOperation } from '../services/geminiService';
import { DownloadIcon, CloseIcon, ImageIcon, ThinkingIcon, EditIcon } from './Icons';
import { LANGUAGE_REGIONS, MOTION_DURATIONS, MOTION_CONTEXTS, TONES } from '../constants';
import ToneSelector from './ToneSelector';

const REASSURING_MESSAGES = [
    "Synthesizing cultural motion dynamics...",
    "Crafting African visual narrative...",
    "Localizing temporal frames...",
    "Rendering nuanced visual story...",
    "Polishing cultural aesthetic continuity...",
    "Applying regional lighting textures...",
    "Finalizing cinematic motion transfer..."
];

const VideoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    
    // New Features
    const [duration, setDuration] = useState('1m');
    const [tone, setTone] = useState('Inspirational');
    const [context, setContext] = useState('Promotional');
    const [isDeepLocalized, setIsDeepLocalized] = useState(false);
    
    // Localization States
    const [isManualRegion, setIsManualRegion] = useState(false);
    const [targetRegion, setTargetRegion] = useState(''); // Selected from dropdown
    const [manualRegionName, setManualRegionName] = useState(''); // Manual input
    const [manualNuanceDetails, setManualNuanceDetails] = useState(''); // Manual details
    
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(REASSURING_MESSAGES[0]);
    const [error, setError] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [hasApiKey, setHasApiKey] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Populate regions based on available constants, focusing on African + Global majors
    const availableRegions = useMemo(() => {
        const allRegions = new Set<string>();
        Object.values(LANGUAGE_REGIONS).forEach(regions => {
            regions.forEach(r => allRegions.add(r));
        });
        return Array.from(allRegions).sort();
    }, []);

    useEffect(() => {
        checkApiKey();
    }, []);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isLoading) {
            let index = 0;
            interval = setInterval(() => {
                index = (index + 1) % REASSURING_MESSAGES.length;
                setLoadingMessage(REASSURING_MESSAGES[index]);
            }, 6000);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const checkApiKey = async () => {
        if (process.env.API_KEY) {
            setHasApiKey(true);
            return;
        }
        if (window.aistudio) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setHasApiKey(hasKey);
        }
    };

    const handleOpenSelectKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            setHasApiKey(true);
            setError(null);
        } else {
            setError("API Key configuration required.");
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const processFile = (file: File) => {
        if (file.type.startsWith('image/')) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = () => setPreviewUrl(reader.result as string);
            reader.readAsDataURL(file);
            setError(null);
        } else {
            setError("Please upload a valid image file.");
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim() && !imageFile) {
            setError("Please provide a prompt or an image.");
            return;
        }

        // Determine final region string
        let finalRegion = '';
        if (isDeepLocalized) {
            if (isManualRegion) {
                if (!manualRegionName.trim()) {
                    setError("Please enter a Custom Region Name.");
                    return;
                }
                finalRegion = `${manualRegionName} ${manualNuanceDetails ? `(Nuance: ${manualNuanceDetails})` : ''}`;
            } else {
                if (!targetRegion) {
                    setError("Please select a target region for deep localization.");
                    return;
                }
                finalRegion = targetRegion;
            }
        }

        setIsLoading(true);
        setError(null);
        setVideoUrl(null);

        try {
            let operation = await startVideoGeneration(prompt, imageFile || undefined, { 
                resolution, 
                aspectRatio,
                duration,
                tone,
                context,
                region: finalRegion,
                isDeepLocalized
            });
            
            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await pollVideoOperation(operation);
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                setVideoUrl(`${downloadLink}&key=${process.env.API_KEY}`);
            } else {
                throw new Error("No video was generated.");
            }
        } catch (err: any) {
            console.error("Video generation error:", err);
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!videoUrl) return;
        try {
            const response = await fetch(videoUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `motion-art-${Date.now()}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError("Failed to download video.");
        }
    };

    const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isDragging) setIsDragging(true);
    }, [isDragging]);

    const onDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    }, []);

    const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file) processFile(file);
    }, []);

    if (!hasApiKey) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 animate-fade-in">
                <div className="max-w-md bg-bg-surface p-6 rounded-xl border border-border-default shadow-xl">
                    <h2 className="text-lg font-bold text-white mb-2">Authentication Required</h2>
                    <button onClick={handleOpenSelectKey} className="w-full py-2 bg-accent text-brand-bg font-bold text-xs rounded-lg">
                        Select API Key
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-fade-in max-w-6xl mx-auto py-4 px-4 overflow-y-auto custom-scrollbar">
            <div className="text-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">Motion Generator</h1>
                <p className="text-xs text-text-secondary mt-1">
                    Bring African visuals to life with deep cultural awareness.
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Column: Creative Input */}
                <div className="lg:w-1/2 space-y-4">
                    <div className="bg-bg-surface p-5 rounded-xl border border-border-default shadow-lg h-full flex flex-col">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-accent rounded-full"></span> Creative Input
                        </h3>
                        
                        <div className="space-y-4 flex-1">
                            <div>
                                <label className="text-[10px] font-bold text-text-secondary uppercase mb-1.5 block tracking-wider">Visual Prompt</label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="e.g., A Maasai warrior performing a traditional jump dance during sunset, hyper-realistic, cinematic lighting..."
                                    className="w-full p-4 bg-bg-main border border-border-default rounded-xl text-xs text-text-primary placeholder:text-text-secondary/50 resize-none h-32 focus:ring-1 focus:ring-accent transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-text-secondary uppercase mb-1.5 block tracking-wider">Reference Image (Optional)</label>
                                {previewUrl ? (
                                    <div className="relative rounded-xl overflow-hidden group border border-border-default h-40 w-full">
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => { setImageFile(null); setPreviewUrl(null); }}
                                            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
                                        >
                                            <CloseIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div 
                                        onDrop={onDrop}
                                        onDragOver={onDragOver}
                                        onDragLeave={onDragLeave}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${isDragging ? 'border-accent bg-accent/10' : 'border-border-default hover:border-accent hover:bg-bg-main/50 text-text-secondary'}`}
                                    >
                                        <ImageIcon className={`w-8 h-8 ${isDragging ? 'text-accent' : 'opacity-30'}`} />
                                        <span className={`text-xs font-semibold ${isDragging ? 'text-accent' : ''}`}>{isDragging ? 'Drop Image' : 'Upload Reference'}</span>
                                    </div>
                                )}
                                <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Configuration */}
                <div className="lg:w-1/2 space-y-4">
                    <div className="bg-bg-surface p-5 rounded-xl border border-border-default shadow-lg">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span> Configuration
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Duration</label>
                                <select value={duration} onChange={e => setDuration(e.target.value)} className="w-full p-2 bg-bg-main border border-border-default rounded-lg text-xs text-white focus:ring-1 focus:ring-accent outline-none">
                                    {MOTION_DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Context</label>
                                <select value={context} onChange={e => setContext(e.target.value)} className="w-full p-2 bg-bg-main border border-border-default rounded-lg text-xs text-white focus:ring-1 focus:ring-accent outline-none">
                                    {MOTION_CONTEXTS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <ToneSelector label="Narrator's Tone" tones={TONES} value={tone} onChange={setTone} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Resolution</label>
                                <div className="flex bg-bg-main border border-border-default rounded-lg p-0.5">
                                    {(['720p', '1080p'] as const).map(r => (
                                        <button key={r} onClick={() => setResolution(r)} className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${resolution === r ? 'bg-accent text-brand-bg shadow-sm' : 'text-text-secondary'}`}>{r}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Aspect Ratio</label>
                                <div className="flex bg-bg-main border border-border-default rounded-lg p-0.5">
                                    {(['16:9', '9:16'] as const).map(a => (
                                        <button key={a} onClick={() => setAspectRatio(a)} className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${aspectRatio === a ? 'bg-accent text-brand-bg shadow-sm' : 'text-text-secondary'}`}>{a}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className={`p-4 rounded-xl border transition-all duration-300 ${isDeepLocalized ? 'bg-accent/10 border-accent' : 'bg-bg-main border-border-default'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <ThinkingIcon className={`w-4 h-4 ${isDeepLocalized ? 'text-accent' : 'text-text-secondary'}`} />
                                    <span className={`text-xs font-bold ${isDeepLocalized ? 'text-white' : 'text-text-secondary'}`}>Deep Regional Localization</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={isDeepLocalized} onChange={e => setIsDeepLocalized(e.target.checked)} />
                                    <div className="w-9 h-5 bg-border-default peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                                </label>
                            </div>
                            
                            {isDeepLocalized && (
                                <div className="animate-fade-in space-y-3 pt-1">
                                    <div className="flex bg-bg-main border border-border-default rounded-lg p-0.5 mb-2">
                                        <button 
                                            onClick={() => setIsManualRegion(false)} 
                                            className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${!isManualRegion ? 'bg-white/10 text-white' : 'text-text-secondary'}`}
                                        >
                                            Preset Regions
                                        </button>
                                        <button 
                                            onClick={() => setIsManualRegion(true)} 
                                            className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${isManualRegion ? 'bg-accent text-brand-bg' : 'text-text-secondary'}`}
                                        >
                                            Manual Definition
                                        </button>
                                    </div>

                                    {!isManualRegion ? (
                                        <>
                                            <label className="text-[9px] font-bold text-accent uppercase tracking-wider block mb-1">Target Region / Culture</label>
                                            <select 
                                                value={targetRegion} 
                                                onChange={e => setTargetRegion(e.target.value)} 
                                                className="w-full p-2 bg-bg-surface border border-accent/30 rounded-lg text-xs text-white focus:ring-1 focus:ring-accent outline-none"
                                            >
                                                <option value="">Select a region...</option>
                                                {availableRegions.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                            <p className="text-[10px] text-text-secondary italic">Applies idiomatic visual cues specific to this region.</p>
                                        </>
                                    ) : (
                                        <div className="space-y-3 bg-bg-surface/50 p-2 rounded-lg border border-white/5">
                                            <div>
                                                <label className="text-[9px] font-bold text-accent uppercase tracking-wider block mb-1">Custom Region Name</label>
                                                <input 
                                                    type="text"
                                                    value={manualRegionName}
                                                    onChange={e => setManualRegionName(e.target.value)}
                                                    placeholder="e.g. Nairobi (Eastlands)"
                                                    className="w-full p-2 bg-bg-main border border-border-default rounded-lg text-xs text-white focus:ring-1 focus:ring-accent outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block mb-1">Specific Nuances / Instructions</label>
                                                <textarea 
                                                    value={manualNuanceDetails}
                                                    onChange={e => setManualNuanceDetails(e.target.value)}
                                                    placeholder="e.g. Use 90s Sheng slang, gritty urban aesthetic, matatu culture references..."
                                                    rows={2}
                                                    className="w-full p-2 bg-bg-main border border-border-default rounded-lg text-xs text-white focus:ring-1 focus:ring-accent outline-none resize-none"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full py-4 bg-accent text-brand-bg font-black text-sm rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-accent/10 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-brand-bg border-t-transparent rounded-full animate-spin"></div>
                                GENERATING...
                            </>
                        ) : 'GENERATE MOTION'}
                    </button>
                    {error && <p className="text-red-400 text-xs font-bold text-center bg-red-500/10 p-2 rounded border border-red-500/20">{error}</p>}
                </div>
            </div>

            {/* Output Display */}
            {(videoUrl || isLoading) && (
                <div className="mt-6 bg-bg-surface rounded-xl border border-border-default overflow-hidden relative flex flex-col items-center justify-center min-h-[400px] shadow-2xl">
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-4 animate-pulse px-4">
                            <div className="w-12 h-12 border-3 border-accent border-t-transparent rounded-full animate-spin"></div>
                            <div className="text-center space-y-2">
                                <p className="text-lg font-bold text-white tracking-wide">{loadingMessage}</p>
                                <p className="text-xs text-text-secondary uppercase font-medium tracking-widest">Processing...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col">
                            <div className="flex-1 bg-black flex items-center justify-center p-4">
                                <video 
                                    src={videoUrl || ''} 
                                    controls 
                                    autoPlay 
                                    loop 
                                    className={`max-w-full max-h-[60vh] rounded-lg shadow-2xl ${aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'}`}
                                />
                            </div>
                            <div className="p-4 bg-bg-surface border-t border-border-default flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-white">Generation Complete</p>
                                    <p className="text-[10px] text-text-secondary">{resolution} • {duration}</p>
                                </div>
                                <button 
                                    onClick={handleDownload}
                                    className="px-5 py-2 bg-white/10 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-white/20 transition-colors border border-white/5"
                                >
                                    <DownloadIcon className="w-4 h-4" /> Save Video
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VideoGenerator;
