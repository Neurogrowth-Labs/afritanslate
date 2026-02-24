
import React, { useState, useEffect, useRef } from 'react';
import { translateWithCulture } from '../../services/geminiService';
import { LANGUAGES } from '../../constants';
import LanguageSelector from './LanguageSelector';
import { MicrophoneIcon, StopIcon, VolumeUpIcon, CloseIcon, DownloadIcon } from './Icons';

interface TranscriptEntry {
    time: string;
    speaker: 'You' | 'Partner';
    text: string;
    translation: string;
    lang: string;
}

const LiveConversation: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [myLang, setMyLang] = useState('en');
    const [partnerLang, setPartnerLang] = useState('sw');
    const [isFormal, setIsFormal] = useState(false);
    
    const [currentSubtitle, setCurrentSubtitle] = useState<{ speaker: string, text: string, lang: string } | null>(null);
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);
    const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    const startRecording = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError("Live conversation requires Chrome or Edge browser");
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = myLang;

            recognition.onresult = async (event: any) => {
                const text = event.results[event.results.length - 1][0].transcript;
                handleSpokenText(text, 'You', myLang, partnerLang);
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                if (event.error !== 'no-speech') {
                    setIsRecording(false);
                }
            };

            recognition.onend = () => {
                if (isRecording) recognition.start(); // Restart if still supposed to be recording
            };

            recognition.start();
            recognitionRef.current = recognition;
            setIsRecording(true);
            setError(null);
        } catch (err) {
            setError("Failed to initialize speech recognition");
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.stop();
        }
        setIsRecording(false);
    };

    const handleSpokenText = async (text: string, speaker: 'You' | 'Partner', fromLang: string, toLang: string) => {
        try {
            // Show original text immediately
            updateSubtitle(speaker, text, fromLang);

            // Translate
            const result = await translateWithCulture(text, {
                sourceLang: fromLang,
                targetLang: toLang,
                formality: isFormal ? 'High' : 'Medium',
                tone: 'Neutral'
            });

            // Update transcript
            const entry: TranscriptEntry = {
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                speaker,
                text,
                translation: result.translation,
                lang: toLang.toUpperCase()
            };
            setTranscript(prev => [...prev, entry]);

            // Show translation in subtitle after a short delay or alongside?
            // Requirement says "replaced by new text" after 5s. 
            // Let's show both or just translation for the "Partner" experience.
            updateSubtitle(speaker, result.translation, toLang);

        } catch (err) {
            console.error("Translation failed", err);
        }
    };

    const updateSubtitle = (speaker: string, text: string, lang: string) => {
        if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
        
        setCurrentSubtitle({ speaker, text, lang });
        
        fadeTimerRef.current = setTimeout(() => {
            setCurrentSubtitle(null);
        }, 5000);
    };

    const exportTranscript = () => {
        const text = transcript.map(e => `[${e.time}] ${e.speaker} (${e.lang}): "${e.text}"\nTranslation: "${e.translation}"`).join('\n\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `live-transcript-${Date.now()}.txt`;
        a.click();
    };

    return (
        <div className="flex flex-col h-full bg-bg-main overflow-hidden relative">
            {/* TOP BAR */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-bg-surface/50 border-b border-white/5 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                    <div className="w-40">
                        <label className="block text-[9px] font-bold text-text-secondary uppercase mb-1">My Language</label>
                        <LanguageSelector label="" value={myLang} onChange={setMyLang} />
                    </div>
                    <div className="text-text-secondary mt-4">↔</div>
                    <div className="w-40">
                        <label className="block text-[9px] font-bold text-text-secondary uppercase mb-1">Partner Language</label>
                        <LanguageSelector label="" value={partnerLang} onChange={setPartnerLang} />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-text-secondary uppercase">Formal Mode</span>
                    <button 
                        onClick={() => setIsFormal(!isFormal)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${isFormal ? 'bg-accent' : 'bg-white/10'}`}
                    >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isFormal ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* MAIN AREA */}
                <div className="flex-1 flex flex-col items-center justify-center p-12 relative bg-gradient-to-b from-transparent to-black/20">
                    {currentSubtitle ? (
                        <div className="max-w-4xl text-center animate-fade-in">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <span className="px-3 py-1 bg-accent text-bg-main text-[10px] font-black rounded-full uppercase">{currentSubtitle.speaker}</span>
                                <span className="text-[10px] text-text-secondary font-mono uppercase tracking-widest">{currentSubtitle.lang}</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight drop-shadow-2xl">
                                {currentSubtitle.text}
                            </h2>
                        </div>
                    ) : (
                        <div className="text-center opacity-20">
                            <div className="w-24 h-24 border-2 border-dashed border-white rounded-full flex items-center justify-center mb-6 mx-auto">
                                <MicrophoneIcon className="w-10 h-10 text-white" />
                            </div>
                            <p className="text-xl font-medium text-white italic">Silence... waiting for speech</p>
                        </div>
                    )}

                    {error && (
                        <div className="absolute top-8 px-6 py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm animate-bounce">
                            {error}
                        </div>
                    )}
                </div>

                {/* RIGHT PANEL */}
                <div className="w-80 bg-bg-surface border-l border-white/5 flex flex-col shadow-2xl">
                    <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Transcript</h3>
                        <span className="px-2 py-0.5 bg-white/5 text-[9px] text-text-secondary rounded-md">{transcript.length} entries</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {transcript.map((entry, i) => (
                            <div key={i} className="animate-fade-in group">
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-[9px] font-black uppercase ${entry.speaker === 'You' ? 'text-accent' : 'text-blue-400'}`}>
                                        {entry.speaker} ({entry.lang})
                                    </span>
                                    <span className="text-[8px] text-text-secondary font-mono">{entry.time}</span>
                                </div>
                                <p className="text-xs text-text-secondary italic mb-1">"{entry.text}"</p>
                                <p className="text-sm text-white font-medium leading-relaxed group-hover:text-accent transition-colors">
                                    {entry.translation}
                                </p>
                            </div>
                        ))}
                        <div ref={transcriptEndRef} />
                    </div>
                    <div className="p-4 border-t border-white/5 bg-black/20">
                        <button 
                            disabled={transcript.length === 0}
                            onClick={exportTranscript}
                            className="w-full py-2 bg-white/5 border border-white/10 text-text-secondary hover:text-white hover:bg-white/10 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2"
                        >
                            <DownloadIcon className="w-3.5 h-3.5" /> Export Transcript
                        </button>
                    </div>
                </div>
            </div>

            {/* BOTTOM CONTROLS */}
            <div className="flex-shrink-0 h-24 bg-bg-surface border-t border-white/5 flex items-center justify-between px-12 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-4 w-48">
                    <button className="p-2 text-text-secondary hover:text-white transition-colors">
                        <VolumeUpIcon className="w-6 h-6" />
                    </button>
                    <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-2/3 bg-accent opacity-50" />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <button 
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-2xl relative ${isRecording ? 'bg-red-500 hover:bg-red-600 scale-110' : 'bg-white/10 hover:bg-white/20'}`}
                    >
                        {isRecording ? (
                            <>
                                <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20" />
                                <StopIcon className="w-8 h-8 text-white" />
                            </>
                        ) : (
                            <MicrophoneIcon className="w-8 h-8 text-accent" />
                        )}
                    </button>
                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${isRecording ? 'text-red-400 animate-pulse' : 'text-text-secondary'}`}>
                        {isRecording ? 'Listening...' : 'Tap to Speak'}
                    </span>
                </div>

                <div className="w-48 flex justify-end">
                    <button 
                        onClick={stopRecording}
                        className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-xs font-bold hover:bg-red-500 hover:border-red-500 transition-all flex items-center gap-2"
                    >
                        End Session
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LiveConversation;
