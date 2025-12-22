

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage, GeolocationCoordinates, MessageAttachment } from '../types';
import { LANGUAGES, TONES } from '../constants';
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
    onSendMessage: (text: string, attachments: File[]) => void;
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
        if (!textToSend && attachments.length === 0) return;
        setError(null);
        onSendMessage(textToSend, attachments);
        setInputText('');
        setAttachments([]);
    };
    
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setAttachments(prev => [...prev, ...Array.from(event.target.files!)]);
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
                        const transcribedText = await geminiService.transcribeAudio(audioFile);
                        setInputText(transcribedText);
                    } catch (err) {
                        setError(err instanceof Error ? err.message : 'Transcription failed.');
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
            const base64Audio = await geminiService.textToSpeech(text);
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
    const handleRateMessage = (id: number, rating: 'good' | 'bad') => { console.log('Rating:', {id, rating})};
    const handleRegenerate = (id: number) => { console.log('Regenerate:', id)};
    const handleSaveEdit = (id: number, newText: string) => { console.log('Save Edit:', {id, newText})};

    const WelcomeScreen = () => (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="max-w-md">
                 <div className="w-16 h-16 rounded-full bg-bg-surface flex-shrink-0 flex items-center justify-center mb-6 mx-auto border-2 border-border-default">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-accent">
                        <circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 18 15.3 15.3 0 0 1-8 0 15.3 15.3 0 0 1 4-18z"></path>
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-text-primary">Your Translation Assistant</h1>
                <p className="text-text-secondary mt-2">Start a new conversation. Your chat history is saved automatically.</p>
            </div>
        </div>
    );
    
    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 && !isVisualMode && !isLoading ? <WelcomeScreen /> : (
                    <div className="space-y-6">
                        {messages.map((msg) => (
                            <Message 
                                key={msg.id} 
                                message={msg}
                                isEditing={editingMessageId === msg.id}
                                onSetEditing={setEditingMessageId}
                                onSaveEdit={handleSaveEdit}
                                onRegenerate={handleRegenerate}
                                onRate={handleRateMessage}
                                onPlayTTS={handlePlayTTS}
                                isOffline={isOffline}
                            />
                        ))}
                        {isLoading && <Message message={{id:0, conversation_id: 0, role:'ai', originalText:'', created_at: ''}} isLoading={true} />}
                    </div>
                )}
                 <div ref={messagesEndRef} />
            </div>

            <div className="flex-shrink-0 p-4 bg-bg-main border-t border-border-default">
                 {error && <p className="text-red-400 text-center mb-2 text-sm bg-red-500/10 p-2 rounded-md">{error}</p>}
                
                {attachments.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                        {attachments.map((file, index) => (
                            <div key={index} className="bg-bg-surface p-1.5 pl-2.5 rounded-full flex items-center gap-2 text-sm border border-border-default">
                                <span className="truncate max-w-xs">{file.name}</span>
                                <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))} className="text-text-secondary hover:text-white">&times;</button>
                            </div>
                        ))}
                    </div>
                )}
                
                {!isVisualMode && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                        <LanguageSelector label="From" languages={LANGUAGES} value={sourceLang} onChange={onSourceLangChange} />
                        <LanguageSelector label="To" languages={LANGUAGES} value={targetLang} onChange={onTargetLangChange} />
                        <ToneSelector label="Tone" tones={TONES} value={tone} onChange={onToneChange} />
                    </div>
                )}

                <div className="relative">
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                        placeholder={isRecording ? "Recording..." : isVisualMode ? "Describe the image you want to create..." : "Type your message, or upload a file..."}
                        className="w-full p-3 pr-32 bg-bg-surface border border-border-default rounded-lg resize-none focus:ring-2 focus:ring-accent focus:border-accent transition text-text-primary placeholder:text-text-secondary"
                        rows={1}
                        style={{ minHeight: '48px', maxHeight: '200px' }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {!isVisualMode && (
                            <>
                                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-text-secondary hover:text-white" title="Attach file">
                                    <AttachmentIcon className="w-5 h-5" />
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
                                </button>
                                <button onClick={handleMicRecording} className={`p-2 hover:text-white ${isRecording ? 'text-red-500' : 'text-text-secondary'}`} title={isRecording ? 'Stop recording' : 'Record audio'}>
                                    {isRecording ? <StopIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
                                </button>
                            </>
                        )}
                        <button onClick={handleSendMessage} disabled={isLoading} className="p-2 text-white bg-accent rounded-full hover:bg-accent/90 disabled:bg-border-default transition-colors" title="Send message">
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {!isVisualMode && (
                    <div className="flex justify-between items-center mt-2 text-xs text-text-secondary">
                        <label htmlFor="thinking-mode" className="flex items-center gap-2 cursor-pointer">
                            <input id="thinking-mode" type="checkbox" checked={isThinkingMode} onChange={(e) => setIsThinkingMode(e.target.checked)} className="h-4 w-4 rounded bg-bg-surface border-border-default text-accent focus:ring-accent" />
                            <ThinkingIcon className={`w-4 h-4 ${isThinkingMode ? 'text-accent' : ''}`}/>
                            Enable Thinking Mode (slower, more complex answers)
                        </label>
                        <span>Shift+Enter for new line</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;