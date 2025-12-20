

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage, GeolocationCoordinates, MessageAttachment } from '../types';
import { LANGUAGES, TONES, AFRITRANSLATE_MODELS, ADD_ONS } from '../constants';
import * as geminiService from '../services/geminiService';
import { getOfflineTranslation } from '../services/offlineService';
import { Message } from './Message';
import LanguageSelector from './LanguageSelector';
import ToneSelector from './ToneSelector';
import { AttachmentIcon, MicrophoneIcon, SendIcon, StopIcon, ThinkingIcon } from './Icons';

// --- Audio Helper Functions --- //

// Base64 decoder
function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// Raw PCM to AudioBuffer decoder
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

// --- Mock Payment API Function --- //
const mockCreatePayment = (item: string, payment_method: string): Promise<{ payment_url?: string; error?: string }> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const plan = AFRITRANSLATE_MODELS.find(m => m.name.toLowerCase() === item.toLowerCase());
            const addon = ADD_ONS.find(a => a.name.toLowerCase() === item.toLowerCase());

            const details = plan || addon;
            const price = details && 'price' in details ? details.price : null;

            if (!price) {
                resolve({ error: `I couldn't find a price for "${item}". Please specify a valid plan or add-on.` });
                return;
            }

            const amount = price.match(/[\d.]+/)?.[0];
            if (!amount) {
                resolve({ error: `I was unable to determine the price for "${item}".` });
                return;
            }
            
            console.log('Simulating backend API call with:', {
              action: "create_payment",
              item: item,
              amount: amount,
              currency: "USD",
              payment_method: payment_method
            });
            
            if (Math.random() > 0.9) { // 10% chance of failure
                resolve({ error: "The payment provider is currently unavailable. Please try again later." });
            } else {
                const paymentId = Math.random().toString(36).substring(7);
                resolve({ payment_url: `https://secure-payment-demo.com/checkout/${paymentId}` });
            }

        }, 1500);
    });
};


const Chat: React.FC<{ isOffline: boolean }> = ({ isOffline }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sourceLang, setSourceLang] = useState('en');
    const [targetLang, setTargetLang] = useState('sw');
    const [tone, setTone] = useState('Friendly');
    const [inputText, setInputText] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isThinkingMode, setIsThinkingMode] = useState(false);
    const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    
    const [paymentFlow, setPaymentFlow] = useState<{
        isActive: boolean;
        step: 'awaiting_item' | 'awaiting_method' | 'awaiting_confirmation';
        item?: string;
        method?: string;
    }>({ isActive: false, step: 'awaiting_item' });

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);
    
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (err) => console.warn(`Geolocation error: ${err.message}`)
            );
        }
    }, []);

    const addAiMessage = (text: string) => {
        const aiMessage: ChatMessage = {
            id: Date.now(),
            role: 'ai',
            originalText: text,
            sourceLang,
            targetLang,
            tone,
        };
        setMessages(prev => [...prev, aiMessage]);
    };

    const handlePaymentFlow = async (userInput: string) => {
        setIsLoading(true);
        setError(null);
        setInputText('');

        switch (paymentFlow.step) {
            case 'awaiting_item': {
                const item = userInput.trim();
                const plan = AFRITRANSLATE_MODELS.find(m => m.name.toLowerCase() === item.toLowerCase());
                const addon = ADD_ONS.find(a => a.name.toLowerCase() === item.toLowerCase());

                if (plan || addon) {
                    setPaymentFlow({ ...paymentFlow, step: 'awaiting_method', item: (plan || addon)!.name });
                    addAiMessage("Got it. And how would you like to pay? We accept credit card, PayPal, or mobile money.");
                } else {
                    addAiMessage("I'm sorry, I couldn't find that item. Please choose from our available plans (Basic, Premium, Training) or add-ons (Voice Pack, Offline Language Packs, Industry Packs).");
                    setPaymentFlow({ isActive: false, step: 'awaiting_item' }); // Reset flow
                }
                break;
            }

            case 'awaiting_method': {
                const method = userInput.toLowerCase();
                const supportedMethods = ['card', 'paypal', 'mobile money'];
                const extractedMethod = supportedMethods.find(m => method.includes(m));

                if (extractedMethod) {
                    setPaymentFlow({ ...paymentFlow, step: 'awaiting_confirmation', method: extractedMethod });
                    addAiMessage(`Great. Just to confirm, you'd like to purchase the ${paymentFlow.item} plan using ${extractedMethod}. Is that correct?`);
                } else {
                    addAiMessage("I didn't recognize that payment method. Please choose from credit card, PayPal, or mobile money.");
                }
                break;
            }

            case 'awaiting_confirmation': {
                if (['yes', 'correct', 'yep', 'yeah', 'y'].some(w => userInput.toLowerCase().includes(w))) {
                    addAiMessage("Perfect. I'm creating your secure payment link now. One moment...");
                    const result = await mockCreatePayment(paymentFlow.item!, paymentFlow.method!);
                    
                    if (result.payment_url) {
                        addAiMessage(`Please click the link below to complete your secure payment.\n${result.payment_url}`);
                    } else {
                        addAiMessage(`I'm sorry, an error occurred: ${result.error || 'An unexpected issue happened.'} Please try again.`);
                    }
                } else {
                    addAiMessage("Okay, I've cancelled the payment process. How can I help you?");
                }
                setPaymentFlow({ isActive: false, step: 'awaiting_item' }); // Reset flow
                break;
            }
        }
        setIsLoading(false);
    };

    const handleSendMessage = async () => {
        const textToSend = inputText.trim();
        if (!textToSend && attachments.length === 0) return;

        setError(null);
        const userMessage: ChatMessage = {
            id: Date.now(),
            role: 'user',
            originalText: textToSend,
            sourceLang,
            targetLang,
            tone,
            attachments: attachments.map(f => ({ name: f.name, type: f.type })),
        };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setAttachments([]);
        
        if (paymentFlow.isActive) {
            await handlePaymentFlow(textToSend);
            return;
        }

        const paymentIntentKeywords = ['pay', 'subscribe', 'buy', 'purchase', 'upgrade my plan'];
        if (!isOffline && paymentIntentKeywords.some(keyword => textToSend.toLowerCase().includes(keyword))) {
            setPaymentFlow({ isActive: true, step: 'awaiting_item' });
            addAiMessage("Of course. What item or service would you like to purchase today?");
            return;
        }

        setIsLoading(true);
        try {
            if (isOffline) {
                const translation = getOfflineTranslation(textToSend, sourceLang, targetLang);
                const aiMessage: ChatMessage = {
                    id: Date.now() + 1, role: 'ai', originalText: translation.culturallyAwareTranslation, translation,
                    sourceLang, targetLang, tone, isOfflineTranslation: true,
                };
                setMessages(prev => [...prev, aiMessage]);
            } else {
                 const translation = await geminiService.getNuancedTranslation(textToSend, sourceLang, targetLang, tone, attachments);
                 const aiMessage: ChatMessage = {
                    id: Date.now() + 1, role: 'ai', originalText: translation.culturallyAwareTranslation, translation,
                    sourceLang, targetLang, tone,
                };
                setMessages(prev => [...prev, aiMessage]);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            const errorAiMessage: ChatMessage = {
                id: Date.now() + 1, role: 'ai', originalText: `Sorry, I encountered an error: ${errorMessage}`,
                sourceLang, targetLang, tone,
            };
            setMessages(prev => [...prev, errorAiMessage]);
        } finally {
            setIsLoading(false);
        }
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
                    
                    setIsLoading(true);
                    try {
                        const transcribedText = await geminiService.transcribeAudio(audioFile);
                        setInputText(transcribedText);
                    } catch (err) {
                        setError(err instanceof Error ? err.message : 'Transcription failed.');
                    } finally {
                        setIsLoading(false);
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

    const handleRateMessage = (id: number, rating: 'good' | 'bad') => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, rating } : m));
    };

    const handleRegenerate = (id: number) => {
        const originalUserMessage = messages.find(m => m.id === id - 1 && m.role === 'user');
        if (originalUserMessage) {
            setMessages(prev => prev.filter(m => m.id !== id));
            setInputText(originalUserMessage.originalText);
            // Re-sending will be handled by a useEffect or manual send click
            // For now, let's just trigger it directly for simplicity
            handleSendMessage();
        }
    };

    const handleSaveEdit = (id: number, newText: string) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, originalText: newText } : m));
        setEditingMessageId(null);
    };


    const WelcomeScreen = () => (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="max-w-md">
                 <div className="w-16 h-16 rounded-full bg-bg-surface flex-shrink-0 flex items-center justify-center mb-6 mx-auto border-2 border-border-default">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-accent">
                        <circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 18 15.3 15.3 0 0 1-8 0 15.3 15.3 0 0 1 4-18z"></path>
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-text-primary">Your Translation Assistant</h1>
                <p className="text-text-secondary mt-2">Translate with cultural nuance. Your conversation will appear here.</p>
            </div>
        </div>
    );
    
    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 ? <WelcomeScreen /> : (
                    <div className="space-y-6">
                        {messages.map((msg) => (
                            <Message 
                                key={msg.id} 
                                message={msg}
                                isLoading={false} // Loading is handled separately
                                isEditing={editingMessageId === msg.id}
                                onSetEditing={setEditingMessageId}
                                onSaveEdit={handleSaveEdit}
                                onRegenerate={handleRegenerate}
                                onRate={handleRateMessage}
                                onPlayTTS={handlePlayTTS}
                                isOffline={isOffline}
                            />
                        ))}
                        {/* FIX: Add missing properties to the ChatMessage object for the loading state. */}
                        {isLoading && <Message message={{id:0, role:'ai', originalText:'', sourceLang, targetLang, tone}} isLoading={true} />}
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
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                    <LanguageSelector label="From" languages={LANGUAGES} value={sourceLang} onChange={setSourceLang} />
                    <LanguageSelector label="To" languages={LANGUAGES} value={targetLang} onChange={setTargetLang} />
                    <ToneSelector label="Tone" tones={TONES} value={tone} onChange={setTone} />
                </div>

                <div className="relative">
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                        placeholder={isRecording ? "Recording..." : "Type your message, or upload a file..."}
                        className="w-full p-3 pr-32 bg-bg-surface border border-border-default rounded-lg resize-none focus:ring-2 focus:ring-accent focus:border-accent transition text-text-primary placeholder:text-text-secondary"
                        rows={1}
                        style={{ minHeight: '48px', maxHeight: '200px' }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-text-secondary hover:text-white" title="Attach file">
                            <AttachmentIcon className="w-5 h-5" />
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
                        </button>
                        <button onClick={handleMicRecording} className={`p-2 hover:text-white ${isRecording ? 'text-red-500' : 'text-text-secondary'}`} title={isRecording ? 'Stop recording' : 'Record audio'}>
                            {isRecording ? <StopIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
                        </button>
                        <button onClick={handleSendMessage} disabled={isLoading} className="p-2 text-white bg-accent rounded-full hover:bg-accent/90 disabled:bg-border-default transition-colors" title="Send message">
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex justify-between items-center mt-2 text-xs text-text-secondary">
                    <label htmlFor="thinking-mode" className="flex items-center gap-2 cursor-pointer">
                        <input id="thinking-mode" type="checkbox" checked={isThinkingMode} onChange={(e) => setIsThinkingMode(e.target.checked)} className="h-4 w-4 rounded bg-bg-surface border-border-default text-accent focus:ring-accent" />
                        <ThinkingIcon className={`w-4 h-4 ${isThinkingMode ? 'text-accent' : ''}`}/>
                        Enable Thinking Mode (slower, more complex answers)
                    </label>
                    <span>Shift+Enter for new line</span>
                </div>
            </div>
        </div>
    );
};

export default Chat;
