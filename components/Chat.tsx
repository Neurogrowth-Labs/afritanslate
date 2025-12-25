import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage, GeolocationCoordinates, MessageAttachment } from '../types';
import { LANGUAGES, TONES, LIVE_VOICES } from '../constants';
import * as geminiService from '../services/geminiService';
import { Message } from './Message';
import LanguageSelector from './LanguageSelector';
import ToneSelector from './ToneSelector';
import { AttachmentIcon, MicrophoneIcon, SendIcon, StopIcon, ThinkingIcon } from './Icons';

// --- Audio Helper Functions --- //

function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
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
    isOffline, 
    isVisualMode = false, 
    messages, 
    onSendMessage,
    onRateMessage,
    sourceLang,
    targetLang,
    tone,
    onSourceLangChange,
    onTargetLangChange,
    onToneChange,
    isLoading
}) => {
    const [inputText, setInputText] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isThinkingMode, setIsThinkingMode] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcribedFrom, setTranscribedFrom] = useState<string | null>(null);
    const [preferredVoice, setPreferredVoice] = useState('Kore'); // Default female
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSendMessage = () => {
        const textToSend = inputText.trim();
        if (!textToSend && attachments.length === 0) {
            setError("Please enter a message or add an attachment.");
            return;
        }
        setError(null);
        onSendMessage(textToSend, attachments, transcribedFrom);
        setInputText('');
        setAttachments([]);
        setTranscribedFrom(null);
    };
    
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
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputText(e.target.value);
        if (error) {
            setError(null);
        }
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
                setError("Microphone access denied. Please allow microphone access in your browser settings.");
            }
        }
    };

    const handlePlayTTS = async (text: string) => {
        try {
            const base64Audio = await geminiService.textToSpeech(text, preferredVoice);
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.start();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Text-to-speech failed.');
        }
    };
    
    // These would eventually be passed up to App.tsx to update DB
    const handleRegenerate = (id: number) => { console.log('Regenerate:', id)};
    const handleSaveEdit = (id: number, newText: string) => { console.log('Save Edit:', {id, newText})};

    const WelcomeScreen = () => (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="max-w-md">
                 <div className="w-16 h-16 rounded-full bg-bg-surface flex-shrink-0 flex items-center justify-center mb-6 mx-auto border-2 border-border-default">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-accent">
                        <circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3(12 2a15.3 0 0 1 4 18 15.3 15.3 0 0 1-8 0 15.3 15.3 0 0 1 4-18z"></path>
                    </svg>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Your Translation Assistant</h1>
                <p className="text-text-secondary mt-2 text-sm md:text-base">Start a new conversation. Your chat history is saved automatically.</p>
            </div>
        </div>
    );
    
    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-bg-main relative">
            {/* Scrollable Message Area - min-h-0 is key for nested flex scroll */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                {messages.length === 0 && !isVisualMode && !isLoading ? <WelcomeScreen /> : (
                    <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 pb-10">
                        {messages.map((msg) => (
                            <Message 
                                key={msg.id} 
                                message={msg}
                                isEditing={editingMessageId === msg.id}
                                onSetEditing={setEditingMessageId}
                                onSaveEdit={handleSaveEdit}
                                onRegenerate={handleRegenerate}
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

            {/* Input Footer Area */}
            <div className="flex-shrink-0 border-t border-border-default bg-bg-surface/30 backdrop-blur-md p-3 md:p-4 z-10">
                <div className="max-w-3xl mx-auto space-y-3 md:space-y-4">
                    {error && <p className="text-red-400 text-center text-xs bg-red-500/10 py-2 rounded border border-red-500/20 px-2">{error}</p>}
                    
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {attachments.map((file, index) => (
                                <div key={index} className="bg-bg-main p-1.5 pl-2.5 rounded flex items-center gap-2 text-[10px] md:text-[11px] border border-border-default flex-shrink-0 max-w-[200px]">
                                    <span className="truncate">{file.name}</span>
                                    <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))} className="text-text-secondary hover:text-red-400 transition-colors p-1 flex-shrink-0">&times;</button>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {!isVisualMode && (
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 md:gap-3">
                            <LanguageSelector label="From" languages={LANGUAGES} value={sourceLang} onChange={onSourceLangChange} />
                            <LanguageSelector label="To" languages={LANGUAGES} value={targetLang} onChange={onTargetLangChange} />
                            <ToneSelector label="Tone" tones={TONES} value={tone} onChange={onToneChange} />
                            <div className="flex flex-col">
                                <label className="text-[10px] font-medium text-text-secondary mb-1">AI Voice</label>
                                <select 
                                    value={preferredVoice} 
                                    onChange={e => setPreferredVoice(e.target.value)}
                                    className="w-full p-1.5 bg-bg-main border border-border-default rounded text-[12px] text-text-primary focus:ring-1 focus:ring-accent outline-none"
                                >
                                    {LIVE_VOICES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="relative">
                        {isLoading && (
                            <div className="absolute -top-5 left-0 right-0 flex justify-center z-10 pointer-events-none">
                                <span className="text-[9px] md:text-[10px] font-bold text-accent uppercase tracking-widest bg-bg-surface px-2 rounded-full border border-border-default animate-pulse">
                                    Processing Nuances...
                                </span>
                            </div>
                        )}
                        <div className={`transition-all duration-300 rounded-xl overflow-hidden bg-bg-main border ${isLoading ? 'border-accent shadow-[0_0_15px_rgba(244,163,0,0.15)]' : 'border-border-default'}`}>
                            <textarea
                                value={inputText}
                                onChange={handleInputChange}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 768) { e.preventDefault(); handleSendMessage(); } }}
                                placeholder={isTranscribing ? "Transcribing audio..." : isRecording ? "Recording..." : isVisualMode ? "Describe the image..." : "Type your message..."}
                                className="w-full p-3 md:p-4 pr-32 md:pr-32 bg-transparent resize-none focus:outline-none text-sm text-text-primary placeholder:text-text-secondary/40 custom-scrollbar"
                                rows={1}
                                style={{ minHeight: '48px', maxHeight: '180px' }}
                                disabled={isTranscribing || isLoading}
                            />
                            
                            <div className="absolute right-2 bottom-1.5 md:right-3 md:bottom-3 flex items-center gap-1">
                                {!isVisualMode && (
                                    <>
                                        <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="p-2 text-text-secondary hover:text-white transition-colors" title="Attach file">
                                            <AttachmentIcon className="w-5 h-5" />
                                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
                                        </button>
                                        <button onClick={handleMicRecording} disabled={isLoading} className={`p-2 transition-colors ${isRecording ? 'text-red-500' : 'text-text-secondary hover:text-white'}`} title={isRecording ? 'Stop recording' : 'Record audio'}>
                                            {isRecording ? <StopIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
                                        </button>
                                    </>
                                )}
                                <button 
                                    onClick={handleSendMessage} 
                                    disabled={isLoading || isTranscribing || (!inputText.trim() && attachments.length === 0)} 
                                    className="p-2 text-bg-main bg-accent rounded-lg hover:bg-accent/90 disabled:bg-border-default disabled:text-text-secondary transition-all flex items-center justify-center min-w-[36px] h-[36px] md:min-w-[40px] md:h-[40px]" 
                                    title="Send message"
                                >
                                    {isLoading ? (
                                        <div className="w-4 h-4 border-2 border-bg-main border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <SendIcon className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {!isVisualMode && (
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1 overflow-hidden">
                            <label className="flex items-center gap-2 cursor-pointer group flex-shrink-0">
                                <div className="relative flex items-center">
                                    <input 
                                        type="checkbox" 
                                        checked={isThinkingMode} 
                                        onChange={(e) => setIsThinkingMode(e.target.checked)} 
                                        className="sr-only peer" 
                                    />
                                    <div className="w-8 h-4 bg-border-default rounded-full peer peer-checked:bg-accent/30 transition-all"></div>
                                    <div className="absolute left-0 w-4 h-4 bg-text-secondary rounded-full peer-checked:translate-x-full peer-checked:bg-accent transition-all shadow-sm"></div>
                                </div>
                                <span className="text-[10px] md:text-[11px] font-medium text-text-secondary group-hover:text-text-primary transition-colors flex items-center gap-1.5 truncate">
                                    <ThinkingIcon className={`w-3.5 h-3.5 ${isThinkingMode ? 'text-accent' : ''}`}/>
                                    Nuance Engine Pro
                                </span>
                            </label>
                            <span className="hidden sm:block text-[10px] text-text-secondary/50 font-medium uppercase tracking-widest truncate">Shift + Enter for new line</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Chat;