
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
            <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
                <div className="max-w-md bg-bg-surface p-8 rounded-2xl border border-border-default shadow-xl">
                    <h2 className="text-2xl font-bold text-white mb-4">Activation Required</h2>
                    <p className="text-text-secondary mb-6">
                        Video generation requires a selected API key from a paid GCP project. 
                        Please ensure your account has billing enabled.
                    </p>
                    <a 
                        href="https://ai.google.dev/gemini-api/docs/billing" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-accent hover:underline text-sm block mb-6"
                    >
                        View Billing Documentation
                    </a>
                    <button 
                        onClick={handleOpenSelectKey}
                        className="w-full py-3 bg-accent text-brand-bg font-bold rounded-xl hover:scale-[1.02] transition-transform"
                    >
                        Select API Key
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-fade-in max-w-5xl mx-auto py-4">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">Cultural Motion Generator</h1>
                <p className="text-lg text-text-secondary mt-2">
                    Bring African visuals to life. Start with a prompt or a single cultural snapshot.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
                {/* Controls */}
                <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="bg-bg-surface p-6 rounded-2xl border border-border-default space-y-4">
                        <div>
                            <label className="text-xs font-bold text-text-secondary uppercase mb-2 block tracking-wider">Describe the Motion</label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., A Maasai warrior performing a traditional jump dance in the golden savanna sunlight, cinematic motion..."
                                className="w-full p-4 bg-bg-main border border-border-default rounded-xl text-text-primary placeholder-text-secondary resize-none h-32 focus:ring-2 focus:ring-accent transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-text-secondary uppercase mb-2 block tracking-wider">Starting Frame (Optional)</label>
                            {previewUrl ? (
                                <div className="relative rounded-xl overflow-hidden group border border-border-default">
                                    <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
                                    <button 
                                        onClick={() => { setImageFile(null); setPreviewUrl(null); }}
                                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
                                    >
                                        <CloseIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-48 border-2 border-dashed border-border-default rounded-xl flex flex-col items-center justify-center gap-3 hover:border-accent hover:bg-bg-main/50 transition-all text-text-secondary"
                                >
                                    <ImageIcon className="w-10 h-10 opacity-30" />
                                    <span className="font-semibold">Upload Initial Frame</span>
                                    <span className="text-xs opacity-50">PNG, JPEG up to 10MB</span>
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

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-text-secondary uppercase mb-2 block tracking-wider">Resolution</label>
                                <div className="flex bg-bg-main border border-border-default rounded-xl p-1">
                                    {(['720p', '1080p'] as const).map(r => (
                                        <button 
                                            key={r}
                                            onClick={() => setResolution(r)}
                                            className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${resolution === r ? 'bg-accent text-brand-bg shadow-sm' : 'text-text-secondary'}`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-text-secondary uppercase mb-2 block tracking-wider">Aspect Ratio</label>
                                <div className="flex bg-bg-main border border-border-default rounded-xl p-1">
                                    {(['16:9', '9:16'] as const).map(a => (
                                        <button 
                                            key={a}
                                            onClick={() => setAspectRatio(a)}
                                            className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${aspectRatio === a ? 'bg-accent text-brand-bg shadow-sm' : 'text-text-secondary'}`}
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
                            className={`w-full py-4 bg-accent text-brand-bg text-lg font-black rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg flex items-center justify-center gap-3 ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-brand-bg border-t-transparent rounded-full animate-spin"></div>
                                    GENERATING...
                                </>
                            ) : 'GENERATE MOTION ART'}
                        </button>
                        {error && <p className="text-red-400 text-sm font-bold text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>}
                    </div>
                </div>

                {/* Output Area */}
                <div className="bg-bg-surface rounded-2xl border border-border-default overflow-hidden relative flex flex-col items-center justify-center min-h-[400px] shadow-2xl">
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-6 animate-pulse">
                            <div className="w-20 h-20 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                            <div className="text-center space-y-2">
                                <p className="text-xl font-bold text-white tracking-wide">{loadingMessage}</p>
                                <p className="text-sm text-text-secondary">This usually takes 1-3 minutes. Sit tight.</p>
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
                                    className={`max-w-full max-h-full ${aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'}`}
                                />
                            </div>
                            <div className="p-4 bg-bg-surface border-t border-border-default flex justify-between items-center">
                                <div className="text-left">
                                    <p className="text-sm font-bold text-white">Generation Complete</p>
                                    <p className="text-xs text-text-secondary">{resolution} | {aspectRatio}</p>
                                </div>
                                <button 
                                    onClick={handleDownload}
                                    className="px-6 py-2.5 bg-accent text-brand-bg font-bold rounded-lg flex items-center gap-2 hover:bg-accent/90 transition-colors"
                                >
                                    <DownloadIcon className="w-4 h-4" /> Download MP4
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-8 space-y-4">
                            <div className="w-24 h-24 bg-bg-main rounded-full flex items-center justify-center mx-auto border-2 border-border-default text-text-secondary opacity-30">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-text-secondary font-medium">Your cinematic motion art will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoGenerator;
