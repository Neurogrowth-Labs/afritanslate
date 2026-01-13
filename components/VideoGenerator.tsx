
import React, { useState, useRef, useEffect } from 'react';
import { startVideoGeneration, pollVideoOperation } from '../services/geminiService';
import { DownloadIcon, CloseIcon, ImageIcon } from './Icons';

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
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(REASSURING_MESSAGES[0]);
    const [error, setError] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [hasApiKey, setHasApiKey] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

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
        // Fallback: If running in standard env, process.env.API_KEY is likely set
        if (process.env.API_KEY) {
            setHasApiKey(true);
            return;
        }
        
        // Google AI Studio Context
        if (window.aistudio) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setHasApiKey(hasKey);
        }
    };

    const handleOpenSelectKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            setHasApiKey(true); // Proceed as if successful per race condition notes
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = () => setPreviewUrl(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim() && !imageFile) {
            setError("Please provide a prompt or an image.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setVideoUrl(null);

        try {
            let operation = await startVideoGeneration(prompt, imageFile || undefined, { resolution, aspectRatio });
            
            // Polling loop
            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await pollVideoOperation(operation);
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                setVideoUrl(`${downloadLink}&key=${process.env.API_KEY}`);
            } else {
                throw new Error("No video was generated in the final response.");
            }
        } catch (err: any) {
            if (err.message?.includes("Requested entity was not found")) {
                setHasApiKey(false);
                setError("API Key verification failed. Please re-select your key.");
            } else {
                setError(err instanceof Error ? err.message : "An unexpected error occurred.");
            }
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
            setError("Failed to download video. Please try again.");
        }
    };

    if (!hasApiKey) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 animate-fade-in">
                <div className="max-w-md bg-bg-surface p-6 rounded-xl border border-border-default shadow-xl">
                    <h2 className="text-lg font-bold text-white mb-2">Activation Required</h2>
                    <p className="text-text-secondary mb-4 text-xs">
                        Video generation requires a selected API key from a paid GCP project. 
                        Please ensure your account has billing enabled.
                    </p>
                    <a 
                        href="https://ai.google.dev/gemini-api/docs/billing" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-accent hover:underline text-xs block mb-4"
                    >
                        View Billing Documentation
                    </a>
                    <button 
                        onClick={handleOpenSelectKey}
                        className="w-full py-2 bg-accent text-brand-bg font-bold text-xs rounded-lg hover:scale-[1.02] transition-transform"
                    >
                        Select API Key
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-fade-in max-w-4xl mx-auto py-2 px-4 overflow-y-auto custom-scrollbar">
            <div className="text-center mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">Motion Generator</h1>
                <p className="text-xs text-text-secondary mt-1">
                    Bring African visuals to life. Start with a prompt or a cultural snapshot.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                {/* Controls */}
                <div className="space-y-3">
                    <div className="bg-bg-surface p-4 rounded-xl border border-border-default space-y-3">
                        <div>
                            <label className="text-[9px] font-bold text-text-secondary uppercase mb-1 block tracking-wider">Describe Motion</label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., A Maasai warrior performing a traditional jump dance..."
                                className="w-full p-3 bg-bg-main border border-border-default rounded-lg text-xs text-text-primary placeholder:text-text-secondary/50 resize-none h-20 focus:ring-1 focus:ring-accent transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-[9px] font-bold text-text-secondary uppercase mb-1 block tracking-wider">Reference Frame</label>
                            {previewUrl ? (
                                <div className="relative rounded-lg overflow-hidden group border border-border-default h-24 w-full">
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <button 
                                        onClick={() => { setImageFile(null); setPreviewUrl(null); }}
                                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
                                    >
                                        <CloseIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-24 border-2 border-dashed border-border-default rounded-lg flex flex-col items-center justify-center gap-1 hover:border-accent hover:bg-bg-main/50 transition-all text-text-secondary"
                                >
                                    <ImageIcon className="w-5 h-5 opacity-30" />
                                    <span className="text-[10px] font-semibold">Upload Image</span>
                                </button>
                            )}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleImageChange} 
                                className="hidden" 
                                accept="image/*" 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[9px] font-bold text-text-secondary uppercase mb-1 block tracking-wider">Resolution</label>
                                <div className="flex bg-bg-main border border-border-default rounded-lg p-0.5">
                                    {(['720p', '1080p'] as const).map(r => (
                                        <button 
                                            key={r}
                                            onClick={() => setResolution(r)}
                                            className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${resolution === r ? 'bg-accent text-brand-bg shadow-sm' : 'text-text-secondary'}`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-text-secondary uppercase mb-1 block tracking-wider">Aspect Ratio</label>
                                <div className="flex bg-bg-main border border-border-default rounded-lg p-0.5">
                                    {(['16:9', '9:16'] as const).map(a => (
                                        <button 
                                            key={a}
                                            onClick={() => setAspectRatio(a)}
                                            className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${aspectRatio === a ? 'bg-accent text-brand-bg shadow-sm' : 'text-text-secondary'}`}
                                        >
                                            {a}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className={`w-full py-2.5 bg-accent text-brand-bg text-xs font-bold rounded-lg hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg flex items-center justify-center gap-2 ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-brand-bg border-t-transparent rounded-full animate-spin"></div>
                                    GENERATING...
                                </>
                            ) : 'GENERATE'}
                        </button>
                        {error && <p className="text-red-400 text-[10px] font-bold text-center bg-red-500/10 p-2 rounded border border-red-500/20">{error}</p>}
                    </div>
                </div>

                {/* Output Area */}
                <div className="bg-bg-surface rounded-xl border border-border-default overflow-hidden relative flex flex-col items-center justify-center min-h-[300px] shadow-lg">
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-3 animate-pulse px-4">
                            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                            <div className="text-center space-y-1">
                                <p className="text-sm font-bold text-white tracking-wide">{loadingMessage}</p>
                                <p className="text-[9px] text-text-secondary uppercase font-medium">Processing may take 1-2 minutes.</p>
                            </div>
                        </div>
                    ) : videoUrl ? (
                        <div className="w-full h-full flex flex-col">
                            <div className="flex-1 bg-black flex items-center justify-center">
                                <video 
                                    src={videoUrl} 
                                    controls 
                                    autoPlay 
                                    loop 
                                    className={`max-w-full max-h-full ${aspectRatio === '9:16' ? 'aspect-[9/16] h-full' : 'aspect-video w-full'}`}
                                />
                            </div>
                            <div className="p-3 bg-bg-surface border-t border-border-default flex items-center justify-between">
                                <div className="text-left">
                                    <p className="text-xs font-bold text-white">Result Ready</p>
                                </div>
                                <button 
                                    onClick={handleDownload}
                                    className="px-4 py-1.5 bg-accent text-brand-bg text-[10px] font-bold rounded flex items-center justify-center gap-1.5 hover:bg-accent/90 transition-colors"
                                >
                                    <DownloadIcon className="w-3 h-3" /> Download
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-6 space-y-2">
                            <div className="w-12 h-12 bg-bg-main rounded-full flex items-center justify-center mx-auto border-2 border-border-default text-text-secondary opacity-30">
                                <ImageIcon className="w-6 h-6" />
                            </div>
                            <p className="text-text-secondary font-medium text-xs">Video preview will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoGenerator;
