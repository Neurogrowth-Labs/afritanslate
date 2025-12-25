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
    let text, dotColor, textColor;

    switch (status) {
        case 'connecting': text = 'Syncing...'; dotColor = 'bg-blue-500'; textColor = 'text-blue-400'; break;
        case 'listening': text = 'Ready'; dotColor = 'bg-green-500'; textColor = 'text-green-400'; break;
        case 'speaking': text = 'AI Active'; dotColor = 'bg-yellow-500'; textColor = 'text-yellow-400'; break;
        case 'buffering': text = 'Buffering'; dotColor = 'bg-orange-500'; textColor = 'text-orange-400'; break;
        case 'idle':
        default: text = 'Idle'; dotColor = 'bg-gray-500'; textColor = 'text-gray-400';
    }

    return (
        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${status !== 'idle' ? 'animate-pulse' : ''}`}></span>
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

    const [conversationHistory, setConversationHistory] = useState<{ role: 'user' | 'ai', text: string, mode: string }[]>([]);
    const [currentTurn, setCurrentTurn] = useState({ user: '', ai: '' });
    const userTranscriptRef = useRef('');
    const aiTranscriptRef = useRef('');

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
        const barWidth = (canvas.width / bufferLength) * 2;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = dataArray[i] / 5;
            ctx.fillStyle = `rgba(244, 163, 0, ${barHeight / 50})`;
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
            setError("Linguistic Neural Engine Initialization Failed.");
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

            let modeInstruction = "";
            if (nuanceLevel === 'nuanced') {
                modeInstruction = `You are a Cultural Ambassador. Goal: CULTURAL RESONANCE. Translate speech into ${targetLangName} using a ${toneName} tone. Aggressively adapt idioms, metaphors, and social etiquette to sound like a local native speaker. Adopt an authentic regional accent. Prioritize feeling over word-for-word accuracy.`;
            } else {
                modeInstruction = `You are a strict Linguistic Engine. Goal: LITERAL ACCURACY. Translate speech into ${targetLangName} exactly as spoken. Do not adapt idioms—translate them word-for-word even if they sound unusual. Prioritize verbatim meaning. Sound like a precise technical translator.`;
            }

            const systemInstruction = `${modeInstruction} Respond using the specified voice: ${voice}. Responses must be in ${targetLangName} only.`;

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
                        const workletNode = new AudioWorkletNode(inputCtx, 'audio-processor', { processorOptions: { bufferSize: 512 } });
                        audioWorkletNodeRef.current = workletNode;
                        workletNode.port.onmessage = (event) => {
                            const pcmBlob = createBlob(event.data);
                            if (audioSourcesRef.current.size > 0) { setStatus('buffering'); audioBufferQueueRef.current.push(pcmBlob); }
                            else { setStatus('listening'); sessionPromiseRef.current?.then(s => s.sendRealtimeInput({ media: pcmBlob })); }
                        };
                        const analyser = inputCtx.createAnalyser();
                        analyser.fftSize = 128;
                        analyserNodeRef.current = analyser;
                        drawVisualizer();
                        mediaStreamSourceRef.current = inputCtx.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current.connect(analyser);
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
                                { role: 'user', text: userTranscriptRef.current, mode: 'user' },
                                { role: 'ai', text: aiTranscriptRef.current, mode: nuanceLevel }
                            ]);
                            userTranscriptRef.current = ''; aiTranscriptRef.current = '';
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
                                    const queue = [...audioBufferQueueRef.current];
                                    audioBufferQueueRef.current = [];
                                    if (queue.length > 0) sessionPromiseRef.current?.then(s => queue.forEach(q => s.sendRealtimeInput({ media: q })));
                                }
                            };
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                        }
                    },
                    onerror: (e: any) => { setError(`Linguistic conflict: ${e.message || 'System error.'}`); handleStopConversation(); },
                    onclose: () => handleStopConversation(),
                },
            });
        } catch (err) { setError("Could not engage audio input."); setStatus('idle'); }
    };
    
    if (!isLive) {
        return (
            <div className="flex items-center justify-center h-full animate-fade-in p-4 sm:p-6 bg-bg-main overflow-y-auto custom-scrollbar">
                <div className="max-w-[420px] w-full bg-bg-surface p-6 sm:p-8 rounded-2xl border border-border-default space-y-6 shadow-2xl">
                    <div className="text-center">
                        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Voice Studio</h1>
                        <p className="text-[10px] text-text-secondary mt-1 uppercase tracking-[0.2em] font-bold">Real-time Cultural Relay</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <LanguageSelector label="Output" languages={LANGUAGES} value={targetLang} onChange={setTargetLang} />
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-text-secondary uppercase">Voice Persona</label>
                            <select value={voice} onChange={e => setVoice(e.target.value)} className="w-full p-1.5 bg-bg-main border border-border-default rounded-lg text-[12px] text-text-primary outline-none focus:ring-1 focus:ring-accent">
                                {LIVE_VOICES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                        <ToneSelector label="Target Tone" tones={TONES} value={tone} onChange={setTone} />
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-text-secondary uppercase">Philosophy</label>
                            <div className="flex bg-bg-main border border-border-default rounded-lg p-1 gap-1">
                                <button onClick={() => setNuanceLevel('nuanced')} className={`flex-1 py-1.5 rounded text-[10px] font-black transition-all uppercase ${nuanceLevel === 'nuanced' ? 'bg-accent text-bg-main shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>Nuanced</button>
                                <button onClick={() => setNuanceLevel('literal')} className={`flex-1 py-1.5 rounded text-[10px] font-black transition-all uppercase ${nuanceLevel === 'literal' ? 'bg-accent text-bg-main shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>Literal</button>
                            </div>
                            <p className="text-[9px] text-text-secondary leading-relaxed italic text-center px-2">
                                {nuanceLevel === 'nuanced' ? "Nuanced: Prioritizes cultural context, idioms, and local accents." : "Literal: Prioritizes word-for-word accuracy and technical precision."}
                            </p>
                        </div>
                    </div>

                    <button onClick={handleStartConversation} disabled={status === 'connecting'} className="w-full py-3.5 bg-accent text-bg-main text-sm font-black rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2">
                        {status === 'connecting' ? 'SYNCING...' : 'ENGAGE VOICE RELAY'}
                    </button>
                    {error && <p className="text-red-400 text-center text-[10px] font-bold bg-red-500/5 p-2 rounded border border-red-500/10 uppercase">{error}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-fade-in bg-bg-main overflow-hidden">
            <header className="flex-shrink-0 p-3 border-b border-border-default flex items-center justify-between bg-bg-surface/50 backdrop-blur-md">
                <StatusIndicator status={status} />
                <div className="flex items-center gap-3">
                    <div className="bg-bg-main px-2 py-1 rounded border border-border-default text-[8px] font-black text-accent uppercase tracking-widest">{nuanceLevel} mode</div>
                    <button onClick={handleStopConversation} className="px-3 py-1.5 bg-red-600/90 text-white text-[10px] font-black rounded-lg hover:bg-red-600 transition-all flex items-center gap-1.5 uppercase tracking-wider">
                        <StopIcon className="w-2.5 h-2.5" /> Stop
                    </button>
                </div>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                 {conversationHistory.map((turn, idx) => (
                    <div key={idx} className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-2.5 rounded-xl max-w-[85%] text-xs shadow-sm border ${
                            turn.role === 'user' 
                            ? 'bg-accent/10 text-accent rounded-tr-none border-accent/20' 
                            : 'bg-bg-surface text-text-primary rounded-tl-none border-border-default'
                        }`}>
                            <div className="flex items-center justify-between gap-4 mb-1">
                                <span className={`text-[8px] font-black uppercase tracking-widest ${turn.role === 'user' ? 'text-accent/60' : 'text-text-secondary'}`}>{turn.role === 'user' ? 'You' : 'AI'}</span>
                                {turn.role === 'ai' && <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-bg-main text-text-secondary uppercase">{turn.mode}</span>}
                            </div>
                            <p className="leading-relaxed">{turn.text}</p>
                        </div>
                    </div>
                ))}
                {(currentTurn.user || currentTurn.ai) && (
                    <div className="space-y-3 opacity-40 italic">
                        {currentTurn.user && <div className="flex justify-end"><div className="bg-accent/5 p-2 rounded-lg max-w-[80%] text-[11px] border border-accent/10">{currentTurn.user}</div></div>}
                        {currentTurn.ai && <div className="flex justify-start"><div className="bg-bg-surface p-2 rounded-lg max-w-[80%] text-[11px] border border-border-default">{currentTurn.ai}</div></div>}
                    </div>
                )}
                <div ref={transcriptEndRef}></div>
            </main>

             <footer className="flex-shrink-0 p-4 border-t border-border-default bg-bg-surface/30 flex flex-col items-center gap-3">
                <canvas ref={canvasRef} width="180" height="15" className="opacity-30"></canvas>
                <div className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${status === 'listening' ? 'bg-green-500/10 border-green-500 scale-110 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'bg-bg-main border-border-default opacity-50'} ${status === 'speaking' ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : ''}`}>
                    <MicrophoneIcon className={`w-5 h-5 ${status === 'listening' ? 'text-green-400' : 'text-text-secondary'}`} />
                </div>
                <p className="text-[8px] text-text-secondary font-black uppercase tracking-[0.3em] opacity-50">Neural Relay Active</p>
             </footer>
        </div>
    );
};

export default LiveConversation;