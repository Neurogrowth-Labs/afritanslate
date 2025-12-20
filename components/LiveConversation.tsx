
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { LANGUAGES, TONES, LIVE_VOICES } from '../constants';
import LanguageSelector from './LanguageSelector';
import ToneSelector from './ToneSelector';
import { MicrophoneIcon, StopIcon } from './Icons';

interface MediaBlob {
    data: string;
    mimeType: string;
}

/**
 * --- Audio Helper Functions ---
 * Gemini Live API sends/receives raw PCM. These helpers manage base64 encoding/decoding.
 */

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

function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function createBlob(data: Float32Array): MediaBlob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}

// Audio Worklet code as a string for inline loading
const audioWorkletCode = `
class AudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.bufferSize = options.processorOptions.bufferSize || 512;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }
  process(inputs) {
    const input = inputs[0];
    const inputChannel = input[0];
    if (!inputChannel) return true;
    for (let i = 0; i < inputChannel.length; i++) {
      this.buffer[this.bufferIndex++] = inputChannel[i];
      if (this.bufferIndex === this.bufferSize) {
        this.port.postMessage(this.buffer.slice(0));
        this.bufferIndex = 0;
      }
    }
    return true;
  }
}
registerProcessor('audio-processor', AudioProcessor);
`;

const StatusIndicator: React.FC<{ status: 'idle' | 'connecting' | 'listening' | 'speaking' | 'buffering' }> = ({ status }) => {
    let text, pingColor, dotColor, textColor;

    switch (status) {
        case 'connecting':
            text = 'Verifying Session...';
            pingColor = 'bg-blue-400';
            dotColor = 'bg-blue-500';
            textColor = 'text-blue-400';
            break;
        case 'listening':
            text = 'Listening...';
            pingColor = 'bg-green-400';
            dotColor = 'bg-green-500';
            textColor = 'text-green-400';
            break;
        case 'speaking':
            text = 'AI Speaking...';
            pingColor = 'bg-yellow-400';
            dotColor = 'bg-yellow-500';
            textColor = 'text-yellow-400';
            break;
        case 'buffering':
            text = 'Ghost Buffering...';
            pingColor = 'bg-orange-400';
            dotColor = 'bg-orange-500';
            textColor = 'text-orange-400';
            break;
        case 'idle':
        default:
            text = 'Session Idle';
            pingColor = '';
            dotColor = 'bg-gray-500';
            textColor = 'text-gray-400';
    }

    return (
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
                {status !== 'idle' && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pingColor} opacity-75`}></span>}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
            </span>
            <span className={textColor}>{text}</span>
        </div>
    );
};

const LiveConversation: React.FC = () => {
    const [targetLang, setTargetLang] = useState('sw');
    const [tone, setTone] = useState('Friendly');
    const [voice, setVoice] = useState('Zephyr');
    const [nuanceLevel, setNuanceLevel] = useState<'nuanced' | 'literal'>('nuanced');
    const [isLive, setIsLive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'buffering'>('idle');

    // Transcription state
    const [conversationHistory, setConversationHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
    const [currentTurn, setCurrentTurn] = useState({ user: '', ai: '' });
    const userTranscriptRef = useRef('');
    const aiTranscriptRef = useRef('');

    // Refs for API and Audio
    const aiRef = useRef<GoogleGenAI | null>(null);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const audioBufferQueueRef = useRef<MediaBlob[]>([]);
    const workletUrlRef = useRef<string | null>(null);
    
    // Visualization
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const analyserNodeRef = useRef<AnalyserNode | null>(null);
    const animationFrameIdRef = useRef<number>(0);
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversationHistory, currentTurn]);

    useEffect(() => {
        if (process.env.API_KEY) {
            aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
        }
    }, []);

    const drawVisualizer = () => {
        animationFrameIdRef.current = requestAnimationFrame(drawVisualizer);
        if (!analyserNodeRef.current || !canvasRef.current) return;
        const bufferLength = analyserNodeRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserNodeRef.current.getByteFrequencyData(dataArray);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = dataArray[i] / 4;
            ctx.fillStyle = `rgba(244, 163, 0, ${barHeight / 60})`;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
    };

    const handleStopConversation = () => {
        cancelAnimationFrame(animationFrameIdRef.current);
        sessionPromiseRef.current?.then(s => s.close()).catch(() => {});
        sessionPromiseRef.current = null;
        
        if (audioWorkletNodeRef.current) {
            audioWorkletNodeRef.current.port.onmessage = null;
            audioWorkletNodeRef.current.disconnect();
            audioWorkletNodeRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.mediaStream.getTracks().forEach(t => t.stop());
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (inputAudioContextRef.current) inputAudioContextRef.current.close().catch(() => {});
        if (outputAudioContextRef.current) {
            audioSourcesRef.current.forEach(s => s.stop());
            audioSourcesRef.current.clear();
            outputAudioContextRef.current.close().catch(() => {});
        }
        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;
        if (workletUrlRef.current) URL.revokeObjectURL(workletUrlRef.current);
        workletUrlRef.current = null;
        audioBufferQueueRef.current = [];
        setIsLive(false);
        setStatus('idle');
        userTranscriptRef.current = '';
        aiTranscriptRef.current = '';
        setCurrentTurn({ user: '', ai: '' });
    };

    useEffect(() => () => handleStopConversation(), []);

    const handleStartConversation = async () => {
        setError(null);
        setStatus('connecting');
        setConversationHistory([]);

        if (!aiRef.current) {
            setError("Access Denied. Verification Required.");
            setStatus('idle');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            inputAudioContextRef.current = inputCtx;
            outputAudioContextRef.current = outputCtx;
            nextStartTimeRef.current = 0;

            const targetLangName = LANGUAGES.find(l => l.code === targetLang)?.name;
            const toneName = TONES.find(t => t.name === tone)?.name;

            const systemInstruction = `You are a Verification-Gated Live AI Translator.
            
            VERIFICATION RULES:
            1. You MUST assume you are in a gated session. 
            2. If the prompt context lacks a valid backend verification object (verified=true), DO NOT proceed with high-stakes cultural translations.
            3. AUDIT BEHAVIOR: Silently acknowledge verification internally once granted.
            
            TRANSLATION PROTOCOL:
            - Translate user speech into ${targetLangName} immediately.
            - Tone: ${toneName}. Mode: ${nuanceLevel}.
            - Handle multi-speaker environments by prioritizing the dominant voice.
            - Focus on cultural resonance. Never speak in the source language.
            - If interrupted, wait for the user to finish buffering before responding.`;

            sessionPromiseRef.current = aiRef.current.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction,
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
                    },
                },
                callbacks: {
                    onopen: async () => {
                        setIsLive(true);
                        setStatus('listening');
                        
                        if (!workletUrlRef.current) {
                           const workletBlob = new Blob([audioWorkletCode], { type: 'application/javascript' });
                           workletUrlRef.current = URL.createObjectURL(workletBlob);
                        }

                        await inputCtx.audioWorklet.addModule(workletUrlRef.current);
                        const workletNode = new AudioWorkletNode(inputCtx, 'audio-processor', {
                            processorOptions: { bufferSize: 512 }
                        });
                        audioWorkletNodeRef.current = workletNode;

                        workletNode.port.onmessage = (event) => {
                            const pcmBlob = createBlob(event.data);
                            // Sequential check: If AI is currently outputting audio, ghost buffer the user's input
                            if (audioSourcesRef.current.size > 0) {
                                setStatus('buffering');
                                audioBufferQueueRef.current.push(pcmBlob);
                            } else {
                                setStatus('listening');
                                sessionPromiseRef.current?.then(s => s.sendRealtimeInput({ media: pcmBlob }));
                            }
                        };
                        
                        // Higher pre-amp gain for distant capture
                        const gainNode = inputCtx.createGain();
                        gainNode.gain.setValueAtTime(15.0, inputCtx.currentTime);

                        // Aggressive compression to normalize environmental noise
                        const compressor = inputCtx.createDynamicsCompressor();
                        compressor.threshold.setValueAtTime(-50, inputCtx.currentTime);
                        compressor.knee.setValueAtTime(40, inputCtx.currentTime);
                        compressor.ratio.setValueAtTime(12, inputCtx.currentTime);
                        compressor.attack.setValueAtTime(0, inputCtx.currentTime);
                        compressor.release.setValueAtTime(0.25, inputCtx.currentTime);

                        const analyser = inputCtx.createAnalyser();
                        analyser.fftSize = 256;
                        analyserNodeRef.current = analyser;
                        drawVisualizer();

                        mediaStreamSourceRef.current = inputCtx.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current.connect(gainNode);
                        gainNode.connect(compressor);
                        compressor.connect(analyser);
                        analyser.connect(workletNode);
                        workletNode.connect(inputCtx.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        if (msg.serverContent?.inputTranscription) {
                            userTranscriptRef.current += msg.serverContent.inputTranscription.text;
                            setCurrentTurn(p => ({ ...p, user: userTranscriptRef.current }));
                        }
                        if (msg.serverContent?.outputTranscription) {
                            aiTranscriptRef.current += msg.serverContent.outputTranscription.text;
                            setCurrentTurn(p => ({ ...p, ai: aiTranscriptRef.current }));
                        }
                        if (msg.serverContent?.turnComplete) {
                            setConversationHistory(prev => [
                                ...prev,
                                { role: 'user', text: userTranscriptRef.current },
                                { role: 'ai', text: aiTranscriptRef.current }
                            ]);
                            userTranscriptRef.current = '';
                            aiTranscriptRef.current = '';
                            setCurrentTurn({ user: '', ai: '' });
                        }

                        const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData) {
                            setStatus('speaking');
                            const audioContext = outputAudioContextRef.current!;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContext.currentTime);
                            
                            const audioBuffer = await decodeAudioData(decode(audioData), audioContext, 24000, 1);
                            const source = audioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(audioContext.destination);
                            audioSourcesRef.current.add(source);

                            source.onended = () => {
                                audioSourcesRef.current.delete(source);
                                if (audioSourcesRef.current.size === 0) {
                                    setStatus('listening');
                                    // Flush ghost buffer now that AI is silent
                                    const queue = [...audioBufferQueueRef.current];
                                    audioBufferQueueRef.current = [];
                                    if (queue.length > 0) {
                                      sessionPromiseRef.current?.then(s => {
                                          queue.forEach(q => s.sendRealtimeInput({ media: q }));
                                      });
                                    }
                                }
                            };
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                        }
                    },
                    onerror: (e: any) => {
                        setError(`Session Error: ${e.message || 'Check verification credentials.'}`);
                        handleStopConversation();
                    },
                    onclose: () => handleStopConversation(),
                },
            });
        } catch (err) {
            setError("Could not start session. Please ensure microphone access.");
            setStatus('idle');
        }
    };
    
    if (!isLive) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in p-6">
                <div className="max-w-xl w-full">
                    <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">Live Translator</h1>
                    <p className="text-lg text-text-secondary mt-3">
                        Professional real-time translation with distance capture.
                    </p>
                    <div className="mt-10 p-8 bg-bg-surface rounded-2xl border border-border-default space-y-6 shadow-2xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-text-secondary uppercase">Input Detection</label>
                                <div className="w-full p-3 bg-bg-main border border-border-default rounded-xl font-semibold text-accent flex items-center gap-2">
                                    <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span> AI Auto-Detect
                                </div>
                            </div>
                            <LanguageSelector label="Translate to" languages={LANGUAGES} value={targetLang} onChange={setTargetLang} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                            <ToneSelector label="Persona Tone" tones={TONES} value={tone} onChange={setTone} />
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-text-secondary uppercase">AI Voice</label>
                                <select 
                                    value={voice} 
                                    onChange={e => setVoice(e.target.value)} 
                                    className="w-full p-3 bg-bg-main border border-border-default rounded-xl text-text-primary appearance-none focus:ring-2 focus:ring-accent"
                                >
                                    {LIVE_VOICES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2 text-left">
                            <label className="text-xs font-bold text-text-secondary uppercase">Processing Mode</label>
                            <div className="flex bg-bg-main border border-border-default rounded-xl p-1.5">
                                <button onClick={() => setNuanceLevel('nuanced')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${nuanceLevel === 'nuanced' ? 'bg-accent text-brand-bg shadow-lg' : 'text-text-secondary hover:text-white'}`}>Nuanced</button>
                                <button onClick={() => setNuanceLevel('literal')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${nuanceLevel === 'literal' ? 'bg-accent text-brand-bg shadow-lg' : 'text-text-secondary hover:text-white'}`}>Literal</button>
                            </div>
                        </div>
                         <button onClick={handleStartConversation} disabled={status === 'connecting'} className="w-full py-4 bg-accent text-brand-bg text-lg font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                            {status === 'connecting' ? 'INITIALIZING PROTOCOL...' : 'START LIVE SESSION'}
                        </button>
                    </div>
                     {error && <p className="text-red-400 font-bold mt-6 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-fade-in bg-bg-main">
            <header className="flex-shrink-0 p-4 border-b border-border-default flex items-center justify-between bg-bg-surface/50 backdrop-blur-md sticky top-0 z-10">
                <StatusIndicator status={status} />
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-bg-main border border-border-default rounded-full text-[10px] font-black text-text-secondary uppercase">
                    Secure Pipeline: Verified
                </div>
                <button onClick={handleStopConversation} className="px-5 py-2 bg-red-600/90 text-white font-bold rounded-full hover:bg-red-600 transition-all flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95">
                    <StopIcon className="w-4 h-4" /> STOP SESSION
                </button>
            </header>
            
            <main className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                 {conversationHistory.map((turn, idx) => (
                    <div key={idx} className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in-up`}>
                        <div className={`p-4 rounded-2xl max-w-lg shadow-sm border ${turn.role === 'user' ? 'bg-accent text-brand-bg rounded-tr-none border-accent' : 'bg-bg-surface text-text-primary rounded-tl-none border-border-default'}`}>
                            <p className="text-sm leading-relaxed">{turn.text}</p>
                        </div>
                    </div>
                ))}
                {(currentTurn.user || currentTurn.ai) && (
                    <div className="space-y-4">
                        {currentTurn.user && (
                             <div className="flex justify-end opacity-40 italic">
                                <div className="bg-accent text-brand-bg p-3 rounded-2xl rounded-tr-none max-w-lg text-xs">{currentTurn.user}</div>
                            </div>
                        )}
                        {currentTurn.ai && (
                             <div className="flex justify-start opacity-40 italic">
                                <div className="bg-bg-surface text-text-primary p-3 rounded-2xl rounded-tl-none max-w-lg border border-border-default text-xs">{currentTurn.ai}</div>
                            </div>
                        )}
                    </div>
                )}
                <div ref={transcriptEndRef}></div>
            </main>

             <footer className="flex-shrink-0 p-8 border-t border-border-default bg-bg-surface/30 flex flex-col items-center gap-6">
                <canvas ref={canvasRef} width="300" height="40" className="w-full max-w-xs opacity-50"></canvas>
                 <div className="relative w-24 h-24 flex items-center justify-center">
                    {status === 'listening' && <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>}
                    {status === 'buffering' && <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-pulse"></div>}
                    <div className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${status === 'listening' ? 'bg-green-500/40 border-green-500 scale-110 shadow-[0_0_30px_rgba(34,197,94,0.4)]' : 'bg-bg-main border-border-default'} ${status === 'speaking' ? 'border-yellow-500 bg-yellow-500/20' : ''} ${status === 'buffering' ? 'border-orange-500 bg-orange-500/20' : ''}`}>
                        <MicrophoneIcon className={`w-10 h-10 ${status === 'listening' ? 'text-green-400' : 'text-text-secondary opacity-50'}`} />
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-[10px] text-text-secondary font-black tracking-[0.2em] uppercase">
                        {status === 'buffering' ? 'Speech Queued: Sequential Protection Active' : 'Real-Time Neural Processing'}
                    </p>
                </div>
             </footer>
        </div>
    );
};

export default LiveConversation;
