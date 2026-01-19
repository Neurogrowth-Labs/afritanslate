
import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { ChatMessage } from '../types';
import { LANGUAGES, TONES, LIVE_VOICES, LANGUAGE_REGIONS } from '../constants';
import * as geminiService from '../services/geminiService';
import { Message } from './Message';
import LanguageSelector from './LanguageSelector';
import ToneSelector from './ToneSelector';
import { AttachmentIcon, MicrophoneIcon, SendIcon, StopIcon, ThinkingIcon, EditIcon } from './Icons';

// --- Audio Helper Functions (Keep existing) ---
function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
}

interface ChatProps {
    isOffline: boolean;
    isVisualMode?: boolean;
    messages: ChatMessage[];
    onSendMessage: (text: string, attachments: File[], audioSourceFileName: string | null) => void;
    onRateMessage: (id: number, rating: 'good' | 'bad') => void;
    sourceLang: string;
    targetLang: string;
    tone: string;
    onSourceLangChange: (lang: string) => void;
    onTargetLangChange: (lang: string) => void;
    onToneChange: (tone: string) => void;
    isLoading: boolean;
}

const Chat: React.FC<ChatProps> = ({ 
    isOffline, isVisualMode = false, messages, onSendMessage, onRateMessage,
    sourceLang, targetLang, tone, onSourceLangChange, onTargetLangChange, onToneChange, isLoading
}) => {
    const [inputText, setInputText] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    
    // New Region State
    const [targetRegion, setTargetRegion] = useState('');
    const [showRegionSelect, setShowRegionSelect] = useState(false);
    const [isCustomRegion, setIsCustomRegion] = useState(false);

    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcribedFrom, setTranscribedFrom] = useState<string | null>(null);
    const [preferredVoice, setPreferredVoice] = useState('Kore');
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Filter regions based on target language
    const availableRegions = useMemo(() => {
        return LANGUAGE_REGIONS[targetLang] || LANGUAGE_REGIONS['en']; // Fallback
    }, [targetLang]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

    // Reset region when lang changes, but keep custom if user typed it
    useEffect(() => {
        if (!isCustomRegion) {
            setTargetRegion(availableRegions[0] || 'General');
        }
    }, [targetLang, availableRegions, isCustomRegion]);

    const handleSendMessage = () => {
        const textToSend = inputText.trim();
        if (!textToSend && attachments.length === 0) { setError("Please enter a message or add an attachment."); return; }
        
        let finalInput = textToSend;
        if (targetRegion && targetRegion !== 'General') {
             // Inject region into prompt context for the service
             finalInput = `[Target Region: ${targetRegion}] ${textToSend}`; 
        }

        setError(null);
        onSendMessage(finalInput, attachments, transcribedFrom);
        setInputText('');
        setAttachments([]);
        setTranscribedFrom(null);
    };
    
    // ... existing handleFileUpload, handleMicRecording, handlePlayTTS ...
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);
            const audioFiles = files.filter((f): f is File => f instanceof File && f.type.startsWith('audio/'));
            const otherFiles = files.filter((f): f is File => f instanceof File && !f.type.startsWith('audio/'));
            const audioToTranscribe = audioFiles[0];

            setAttachments(prev => [...prev, ...otherFiles, ...audioFiles.slice(1)]);
            if (error) setError(null);

            if (audioToTranscribe) {
                setIsTranscribing(true);
                const originalInput = inputText;
                setInputText('Transcribing audio file...');
                try {
                    const transcribedText = await geminiService.transcribeAudio(audioToTranscribe);
                    setInputText(prev => (prev === 'Transcribing audio file...' ? transcribedText : `${originalInput}\n${transcribedText}`).trim());
                    setTranscribedFrom(audioToTranscribe.name);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Transcription failed.');
                    setInputText(originalInput);
                } finally {
                    setIsTranscribing(false);
                }
            }
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleMicRecording = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream);
                audioChunksRef.current = [];
                mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
                mediaRecorderRef.current.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const audioFile = new File([audioBlob], "voice-input.webm", { type: "audio/webm" });
                    stream.getTracks().forEach(track => track.stop());
                    
                    try {
                        setIsTranscribing(true);
                        setInputText('Transcribing your recording...');
                        const transcribedText = await geminiService.transcribeAudio(audioFile);
                        setInputText(transcribedText);
                        setTranscribedFrom(audioFile.name);
                    } catch (err) {
                        setError(err instanceof Error ? err.message : 'Transcription failed.');
                        setInputText('');
                    } finally {
                        setIsTranscribing(false);
                    }
                };
                mediaRecorderRef.current.start();
                setIsRecording(true);
            } catch (err) {
                setError("Microphone access denied.");
            }
        }
    };

    const handlePlayTTS = async (text: string) => {
        try {
            const base64Audio = await geminiService.textToSpeech(text, preferredVoice);
            if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.start();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Text-to-speech failed.');
        }
    };

    const WelcomeScreen = () => (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="max-w-md animate-fade-in">
                 <div className="w-20 h-20 rounded-2xl bg-bg-surface/50 backdrop-blur-sm flex-shrink-0 flex items-center justify-center mb-6 mx-auto border border-white/5 shadow-2xl">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-accent">
                        <circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3(12 2a15.3 0 0 1 4 18 15.3 15.3 0 0 1-8 0 15.3 15.3 0 0 1 4-18z"></path>
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">AfriTranslate AI</h1>
                <p className="text-text-secondary mt-3 text-sm leading-relaxed">
                    Your culturally intelligent translation partner. Start a conversation to begin bridging worlds.
                </p>
            </div>
        </div>
    );
    
    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-transparent relative">
            <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 custom-scrollbar pb-32">
                {messages.length === 0 && !isVisualMode && !isLoading ? <WelcomeScreen /> : (
                    <div className="max-w-4xl mx-auto space-y-8">
                        {messages.map((msg) => (
                            <Message 
                                key={msg.id} 
                                message={msg}
                                isEditing={editingMessageId === msg.id}
                                onSetEditing={setEditingMessageId}
                                onSaveEdit={() => {}}
                                onRegenerate={() => {}}
                                onRate={onRateMessage}
                                onPlayTTS={handlePlayTTS}
                                isOffline={isOffline}
                            />
                        ))}
                        {isLoading && <Message message={{id:0, conversation_id: 0, role:'ai', originalText:'', created_at: ''}} isLoading={true} />}
                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                )}
            </div>

            {/* Floating Input Area */}
            <div className="flex-shrink-0 absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-bg-main via-bg-main to-transparent z-20 pointer-events-none">
                <div className="max-w-4xl mx-auto pointer-events-auto">
                    {/* Attachments preview */}
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 overflow-x-auto mb-2 px-2">
                            {attachments.map((file, index) => (
                                <div key={index} className="bg-bg-surface/90 border border-white/10 p-2 rounded-lg flex items-center gap-2 text-[10px] shadow-lg animate-fade-in">
                                    <span className="truncate max-w-[150px] text-white">{file.name}</span>
                                    <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))} className="text-text-secondary hover:text-red-400">&times;</button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="bg-bg-surface/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 flex flex-col gap-2 relative group focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/20 transition-all">
                        {/* Config Bar (Compact) */}
                        {!isVisualMode && (
                            <div className="flex items-center gap-2 px-2 pt-1 pb-2 border-b border-white/5 overflow-x-auto no-scrollbar">
                                <div className="min-w-[100px]"><LanguageSelector label="From" languages={LANGUAGES} value={sourceLang} onChange={onSourceLangChange} /></div>
                                <div className="text-text-secondary/50">→</div>
                                <div className="min-w-[100px]"><LanguageSelector label="To" languages={LANGUAGES} value={targetLang} onChange={onTargetLangChange} /></div>
                                <div className="w-px h-4 bg-white/10 mx-1"></div>
                                <div className="min-w-[100px]"><ToneSelector label="Tone" tones={TONES} value={tone} onChange={onToneChange} /></div>
                                
                                <div className="ml-auto flex items-center gap-2">
                                    {/* Region Selector Trigger */}
                                    <button 
                                        onClick={() => setShowRegionSelect(!showRegionSelect)}
                                        className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors text-[10px] font-bold uppercase tracking-wide border ${targetRegion && targetRegion !== 'General' ? 'bg-accent/10 border-accent text-accent' : 'bg-white/5 border-transparent text-text-secondary hover:text-white'}`}
                                        title="Deep Regional Localization"
                                    >
                                        <ThinkingIcon className="w-3.5 h-3.5"/>
                                        <span className="truncate max-w-[100px]">
                                            {targetRegion && targetRegion !== 'General' ? targetRegion.split('-')[0].trim() : 'Region'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {/* Expandable Region Selector */}
                        {showRegionSelect && !isVisualMode && (
                            <div className="px-2 pb-2 border-b border-white/5 animate-fade-in">
                                <div className="flex justify-between items-end mb-1">
                                    <label className="text-[9px] font-bold text-text-secondary uppercase">Specific Regional Variant</label>
                                    <button 
                                        onClick={() => { setIsCustomRegion(!isCustomRegion); if(!isCustomRegion) setTargetRegion(''); }}
                                        className="text-[9px] text-accent hover:underline flex items-center gap-1"
                                    >
                                        {isCustomRegion ? 'Pick Preset' : 'Enter Manual'} <EditIcon className="w-3 h-3"/>
                                    </button>
                                </div>
                                
                                {isCustomRegion ? (
                                    <input 
                                        type="text" 
                                        value={targetRegion} 
                                        onChange={e => setTargetRegion(e.target.value)} 
                                        placeholder="Type region (e.g. Nairobi Eastlands - Sheng)" 
                                        className="w-full p-2 bg-black/20 border border-accent/30 rounded text-xs text-white focus:ring-1 focus:ring-accent outline-none placeholder:text-text-secondary/50"
                                        autoFocus
                                    />
                                ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                        {availableRegions.map(r => (
                                            <button 
                                                key={r}
                                                onClick={() => setTargetRegion(r)}
                                                className={`px-2 py-1 rounded text-[10px] border transition-all ${targetRegion === r ? 'bg-accent text-brand-bg border-accent font-bold' : 'bg-bg-main border-white/10 text-text-secondary hover:text-white'}`}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-end gap-2 px-2">
                            {!isVisualMode && (
                                <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="p-2.5 mb-1.5 text-text-secondary hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                                    <AttachmentIcon className="w-5 h-5" />
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
                                </button>
                            )}
                            
                            <textarea
                                value={inputText}
                                onChange={(e) => { setInputText(e.target.value); setError(null); }}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                placeholder={isTranscribing ? "Transcribing..." : isRecording ? "Recording..." : "Type your message..."}
                                className="flex-1 bg-transparent py-3 max-h-[150px] resize-none outline-none text-sm text-white placeholder:text-text-secondary/50 custom-scrollbar"
                                rows={1}
                                disabled={isTranscribing || isLoading}
                            />

                            {!isVisualMode && (
                                <button onClick={handleMicRecording} disabled={isLoading} className={`p-2.5 mb-1.5 rounded-xl transition-colors ${isRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-text-secondary hover:text-white hover:bg-white/10'}`}>
                                    {isRecording ? <StopIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
                                </button>
                            )}

                            <button 
                                onClick={handleSendMessage} 
                                disabled={isLoading || isTranscribing || (!inputText.trim() && attachments.length === 0)} 
                                className="p-2.5 mb-1.5 bg-accent text-bg-main rounded-xl hover:bg-white hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                            >
                                {isLoading ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <SendIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                    {error && <div className="mt-2 text-center text-xs text-red-400 font-medium bg-black/50 py-1 rounded backdrop-blur-sm">{error}</div>}
                </div>
            </div>
        </div>
    );
};

export default Chat;
