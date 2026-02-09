
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { summarizeMeeting } from '../services/geminiService';
import { MOCK_MEETING_TRANSCRIPT, LANGUAGES } from '../constants';
import { GoogleMeetIcon, TeamsIcon, ZoomIcon, CalendarIcon, ClockIcon, TrashIcon, MicrophoneIcon, MeetingIcon, CheckIcon, DownloadIcon, SearchIcon, ThinkingIcon, UsersIcon } from './Icons';
import type { MeetingMode, User, ScheduledMeeting, MeetingAnalysisResult, ActionItem } from '../types';
import LanguageSelector from './LanguageSelector';
import { supabase } from '../supabaseClient';

interface MeetingSummarizerProps {
    currentUser: User;
}

// --- Audio Helper Functions for Real-Time Capture ---
const audioWorkletCode = `
class AudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.bufferSize = options.processorOptions.bufferSize || 4096;
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

function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
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

const MeetingSummarizer: React.FC<MeetingSummarizerProps> = ({ currentUser }) => {
    const [mode, setMode] = useState<MeetingMode | 'schedule'>('live');
    const [transcript, setTranscript] = useState('');
    const [meetingLink, setMeetingLink] = useState('');
    
    // Structured Analysis State
    const [analysisResult, setAnalysisResult] = useState<MeetingAnalysisResult | null>(null);
    const [activeTab, setActiveTab] = useState<'transcript' | 'notes' | 'analytics'>('transcript');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // States for Live Transcription
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState('');
    const [summaryLang, setSummaryLang] = useState('en');
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<string>('');
    const [captureStream, setCaptureStream] = useState<MediaStream | null>(null);

    // Scheduling States
    const [scheduledMeetings, setScheduledMeetings] = useState<ScheduledMeeting[]>([]);
    const [newMeetingTitle, setNewMeetingTitle] = useState('');
    const [newMeetingDate, setNewMeetingDate] = useState('');
    const [newMeetingTime, setNewMeetingTime] = useState('');
    const [newMeetingLink, setNewMeetingLink] = useState('');
    const [isScheduling, setIsScheduling] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Refs for Audio Processing
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const aiRef = useRef<GoogleGenAI | null>(null);
    const sessionRef = useRef<any>(null); 
    const audioContextRef = useRef<AudioContext | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const workletUrlRef = useRef<string | null>(null);

    // Initialize Gemini Client
    useEffect(() => {
        if (process.env.API_KEY) {
            aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
        }
    }, []);

    // Auto-scroll
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [liveTranscript]);

    // Fetch scheduled meetings when entering schedule mode
    useEffect(() => {
        if (mode === 'schedule') {
            fetchScheduledMeetings();
        }
    }, [mode]);

    const fetchScheduledMeetings = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('scheduled_meetings')
            .select('*')
            .eq('user_id', currentUser.id)
            .gte('scheduled_at', new Date().toISOString()) 
            .order('scheduled_at', { ascending: true });
        
        if (error) {
            console.error("Error fetching meetings:", error.message || JSON.stringify(error));
        } else {
            setScheduledMeetings(data as ScheduledMeeting[]);
        }
        setIsLoading(false);
    };

    const handleScheduleMeeting = async () => {
        if (!newMeetingTitle || !newMeetingDate || !newMeetingTime) {
            setError("Please fill in the meeting title, date, and time.");
            return;
        }

        setIsScheduling(true);
        setError(null);

        const scheduledAt = new Date(`${newMeetingDate}T${newMeetingTime}`);

        try {
            const { error } = await supabase.from('scheduled_meetings').insert({
                user_id: currentUser.id,
                title: newMeetingTitle,
                meeting_link: newMeetingLink,
                scheduled_at: scheduledAt.toISOString(),
            });

            if (error) throw error;

            setNewMeetingTitle('');
            setNewMeetingDate('');
            setNewMeetingTime('');
            setNewMeetingLink('');
            fetchScheduledMeetings();

        } catch (err: any) {
            setError(err.message || "Failed to schedule meeting.");
        } finally {
            setIsScheduling(false);
        }
    };

    const handleDeleteMeeting = async (id: number) => {
        try {
            const { error } = await supabase.from('scheduled_meetings').delete().eq('id', id);
            if (error) throw error;
            fetchScheduledMeetings();
        } catch (err: any) {
            console.error("Failed to delete meeting:", err.message || err);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'text/plain') {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (e) => {
                setTranscript(e.target?.result as string);
                setError(null);
            };
            reader.readAsText(file);
        } else {
            setError("Please upload a valid .txt file.");
        }
    };
    
    const handleGenerate = async (transcriptOverride?: string) => {
        const transcriptToUse = transcriptOverride || transcript;
        if (!transcriptToUse.trim()) {
            setError("Transcript cannot be empty.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        
        try {
            const summaryLangName = LANGUAGES.find(l => l.code === summaryLang)?.name || 'English';
            // Call structured summarizer
            const result = await summarizeMeeting(transcriptToUse, meetingLink, summaryLangName);
            setAnalysisResult(result);
            setActiveTab('notes');

            // Store meeting activity in Supabase
            if (currentUser) {
                await supabase.from('meeting_summaries').insert({
                    user_id: currentUser.id,
                    meeting_link: meetingLink,
                    file_name: fileName || (mode === 'live' ? 'Live Session' : 'Uploaded File'),
                    transcript: transcriptToUse,
                    summary: result.summary, // Store string summary
                    language: summaryLang,
                    mode: mode,
                    created_at: new Date().toISOString()
                });
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    // --- REAL-TIME TRANSCRIPTION LOGIC ---

    const cleanupAudio = () => {
        if (captureStream) {
            captureStream.getTracks().forEach(track => track.stop());
            setCaptureStream(null);
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => {});
            audioContextRef.current = null;
        }
        if (sessionRef.current) {
            sessionRef.current = null;
        }
        if (workletUrlRef.current) {
            URL.revokeObjectURL(workletUrlRef.current);
            workletUrlRef.current = null;
        }
    };

    const handleStartLiveTranscription = async () => {
        if (!aiRef.current) {
            setError("AI Service not initialized.");
            return;
        }

        setIsConnecting(true);
        setError(null);
        setConnectionStatus('Initializing audio capture...');
        setLiveTranscript('');

        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            
            if (stream.getAudioTracks().length === 0) {
                stream.getTracks().forEach(t => t.stop());
                throw new Error("No audio track detected. Please make sure to check 'Share audio' when selecting the window/tab.");
            }

            setCaptureStream(stream);
            setConnectionStatus('Connecting to Gemini Live...');

            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            const blob = new Blob([audioWorkletCode], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            workletUrlRef.current = url;
            
            await audioContext.audioWorklet.addModule(url);

            const source = audioContext.createMediaStreamSource(stream);
            sourceNodeRef.current = source;
            
            const worklet = new AudioWorkletNode(audioContext, 'audio-processor');
            workletNodeRef.current = worklet;

            source.connect(worklet);

            const sessionPromise = aiRef.current.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: { model: "google-speech-v1" },
                    systemInstruction: "You are a passive meeting scribe. Your only task is to listen and transcribe. Do not speak.",
                },
                callbacks: {
                    onopen: () => {
                        setIsConnecting(false);
                        setIsTranscribing(true);
                        setConnectionStatus('Connected & Listening...');
                        
                        worklet.port.onmessage = (event) => {
                            const pcmBlob = createBlob(event.data);
                            sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                    },
                    onmessage: (msg: LiveServerMessage) => {
                        if (msg.serverContent?.inputTranscription) {
                            const text = msg.serverContent.inputTranscription.text;
                            if (text) {
                                setLiveTranscript(prev => prev + text);
                            }
                        }
                    },
                    onclose: () => {
                        handleStopLiveTranscription();
                    },
                    onerror: (err) => {
                        setError("Connection lost. Please restart.");
                        handleStopLiveTranscription();
                    }
                }
            });
            
            sessionRef.current = sessionPromise;

            stream.getVideoTracks()[0].onended = () => {
                handleStopLiveTranscription();
            };

        } catch (err: any) {
            cleanupAudio();
            setIsConnecting(false);
            setError(err.message || "Failed to start transcription.");
        }
    };

    const handleStopLiveTranscription = () => {
        cleanupAudio();
        setIsTranscribing(false);
        setIsConnecting(false);
        
        if (liveTranscript.trim().length > 0) {
            const finalTranscript = liveTranscript;
            setTranscript(finalTranscript);
            setFileName('Live Meeting Transcript');
            handleGenerate(finalTranscript);
        }
    };

    const handleExport = (format: 'txt' | 'doc') => {
        if (!analysisResult) return;
        
        let content = '';
        const title = `Meeting Summary - ${new Date().toLocaleDateString()}`;
        
        content += `${title}\n\n`;
        content += `SUMMARY\n${analysisResult.summary}\n\n`;
        
        content += `DECISIONS\n`;
        analysisResult.decisions.forEach(d => content += `- ${d}\n`);
        content += `\n`;
        
        content += `ACTION ITEMS\n`;
        analysisResult.actionItems.forEach(item => content += `[ ] ${item.task} (Owner: ${item.owner}, By: ${item.deadline})\n`);
        content += `\n`;
        
        content += `CULTURAL INSIGHTS\n${analysisResult.culturalInsights}\n`;

        const mimeType = format === 'doc' ? 'application/msword' : 'text/plain';
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `meeting_notes.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleReset = () => {
        setMode('live');
        setTranscript('');
        setMeetingLink('');
        setAnalysisResult(null);
        setIsLoading(false);
        setError(null);
        setFileName('');
        setIsTranscribing(false);
        setLiveTranscript('');
        setConnectionStatus('');
        setActiveTab('transcript');
        cleanupAudio();
    };

    // --- Calendar Helper Functions ---
    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const changeMonth = (offset: number) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
    };

    const renderActionItem = (item: ActionItem, index: number) => (
        <div key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/5 hover:border-accent/30 transition-colors">
            <div className={`mt-1 w-2 h-2 rounded-full ${item.priority === 'High' ? 'bg-red-500' : item.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            <div className="flex-1">
                <p className="text-sm text-white font-medium">{item.task}</p>
                <p className="text-xs text-text-secondary mt-1 flex justify-between">
                    <span>Owner: <strong className="text-white">{item.owner}</strong></span>
                    <span>Due: {item.deadline}</span>
                </p>
            </div>
            <button className="text-text-secondary hover:text-green-400">
                <div className="w-5 h-5 border-2 border-current rounded-md"></div>
            </button>
        </div>
    );

    const getFilteredTranscript = () => {
        if (!searchTerm) return transcript;
        // Simple highlight logic
        const parts = transcript.split(new RegExp(`(${searchTerm})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) => 
                    part.toLowerCase() === searchTerm.toLowerCase() ? <span key={i} className="bg-yellow-500/30 text-yellow-200 font-bold px-1 rounded">{part}</span> : part
                )}
            </span>
        );
    };

    if (isTranscribing || isConnecting) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in p-4">
                 {isConnecting ? (
                     <>
                        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
                        <h2 className="text-xl font-bold text-text-primary">Establishing Secure Link...</h2>
                        <p className="text-sm text-text-secondary mt-2">{connectionStatus}</p>
                        <button onClick={handleStopLiveTranscription} className="mt-6 text-xs text-red-400 hover:text-red-300">Cancel</button>
                     </>
                 ) : (
                    <>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-red-600/20 p-2 rounded-full border border-red-500/30 animate-pulse">
                                <MicrophoneIcon className="w-5 h-5 text-red-500" />
                            </div>
                            <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
                                Live Transcription Active
                            </h2>
                        </div>
                        <div className="mb-2 text-[10px] text-accent uppercase tracking-widest font-bold">
                            Listening to System Audio
                        </div>
                        <div className="w-full max-w-3xl h-96 bg-bg-surface border border-border-default rounded-lg p-6 text-left overflow-y-auto font-mono text-xs whitespace-pre-wrap shadow-inner relative custom-scrollbar">
                            {liveTranscript || <span className="text-text-secondary italic">Waiting for speech...</span>}
                            <div ref={transcriptEndRef} />
                        </div>
                        <button onClick={handleStopLiveTranscription} className="mt-6 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-lg flex items-center gap-2 text-sm">
                            <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>
                            Stop & Analyze
                        </button>
                    </>
                 )}
             </div>
        )
    }

    if (mode === 'schedule') {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const blanks = Array.from({ length: firstDay }, (_, i) => i);

        // Map meetings to dates for calendar highlighting
        const meetingsByDate = scheduledMeetings.reduce((acc, meeting) => {
            const dateStr = new Date(meeting.scheduled_at).toDateString();
            acc[dateStr] = (acc[dateStr] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return (
            <div className="flex flex-col h-full animate-fade-in">
                <div className="flex-shrink-0 flex justify-between items-center mb-4 border-b border-border-default pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">Meeting Scheduler</h1>
                        <p className="text-xs text-text-secondary mt-1">Plan and manage upcoming transcription sessions.</p>
                    </div>
                    <div className="flex border border-border-default rounded-lg overflow-hidden">
                        <button onClick={() => setMode('live')} className="px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-white/5 transition-colors">Live</button>
                        <button onClick={() => setMode('upload')} className="px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-white/5 transition-colors border-l border-border-default">Upload</button>
                        <button onClick={() => setMode('schedule')} className="px-3 py-1.5 text-xs font-semibold bg-accent text-bg-main border-l border-border-default">Schedule</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
                        {/* Left Column: Calendar & Upcoming */}
                        <div className="space-y-4">
                            <div className="bg-bg-surface p-4 rounded-lg border border-border-default">
                                <div className="flex justify-between items-center mb-3">
                                    <button onClick={() => changeMonth(-1)} className="text-text-secondary hover:text-white px-2">&lt;</button>
                                    <h3 className="text-sm font-bold text-white">
                                        {currentMonth.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                                    </h3>
                                    <button onClick={() => changeMonth(1)} className="text-text-secondary hover:text-white px-2">&gt;</button>
                                </div>
                                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                        <div key={day} className="text-text-secondary font-bold py-1">{day}</div>
                                    ))}
                                    {blanks.map(i => <div key={`blank-${i}`} className="py-1"></div>)}
                                    {days.map(day => {
                                        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                                        const dateStr = date.toDateString();
                                        const hasMeeting = meetingsByDate[dateStr];
                                        const isToday = new Date().toDateString() === dateStr;
                                        
                                        return (
                                            <div 
                                                key={day} 
                                                className={`
                                                    py-1 rounded relative cursor-default
                                                    ${isToday ? 'bg-white/10 text-white font-bold' : 'text-text-primary hover:bg-white/5'}
                                                    ${hasMeeting ? 'border border-accent/50' : ''}
                                                `}
                                            >
                                                {day}
                                                {hasMeeting && <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full"></div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-bg-surface p-4 rounded-lg border border-border-default h-64 overflow-y-auto custom-scrollbar">
                                <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-widest">Upcoming</h3>
                                {scheduledMeetings.length === 0 ? (
                                    <p className="text-text-secondary text-[10px] italic text-center mt-8">No upcoming meetings scheduled.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {scheduledMeetings.map(meeting => (
                                            <div key={meeting.id} className="flex justify-between items-start p-2 bg-bg-main border border-border-default rounded-md group hover:border-accent/30 transition-colors">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-white truncate">{meeting.title}</p>
                                                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-text-secondary">
                                                        <span className="flex items-center gap-1"><CalendarIcon className="w-2.5 h-2.5" />{new Date(meeting.scheduled_at).toLocaleDateString()}</span>
                                                        <span className="flex items-center gap-1"><ClockIcon className="w-2.5 h-2.5" />{new Date(meeting.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleDeleteMeeting(meeting.id)}
                                                    className="text-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                >
                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Schedule Form */}
                        <div className="bg-bg-surface p-4 rounded-lg border border-border-default h-fit">
                            <h3 className="text-sm font-bold text-white mb-3">Add New Meeting</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Title</label>
                                    <input 
                                        type="text" 
                                        value={newMeetingTitle}
                                        onChange={(e) => setNewMeetingTitle(e.target.value)}
                                        placeholder="e.g., Q3 Strategy Review"
                                        className="w-full p-2 bg-bg-main border border-border-default rounded text-xs text-white focus:ring-1 focus:ring-accent outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Date</label>
                                        <input 
                                            type="date" 
                                            value={newMeetingDate}
                                            onChange={(e) => setNewMeetingDate(e.target.value)}
                                            className="w-full p-2 bg-bg-main border border-border-default rounded text-xs text-white focus:ring-1 focus:ring-accent outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Time</label>
                                        <input 
                                            type="time" 
                                            value={newMeetingTime}
                                            onChange={(e) => setNewMeetingTime(e.target.value)}
                                            className="w-full p-2 bg-bg-main border border-border-default rounded text-xs text-white focus:ring-1 focus:ring-accent outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Link (Optional)</label>
                                    <input 
                                        type="text" 
                                        value={newMeetingLink}
                                        onChange={(e) => setNewMeetingLink(e.target.value)}
                                        placeholder="Zoom, Teams, or Meet URL"
                                        className="w-full p-2 bg-bg-main border border-border-default rounded text-xs text-white focus:ring-1 focus:ring-accent outline-none"
                                    />
                                </div>
                                
                                {error && <p className="text-red-400 text-[10px] mt-1">{error}</p>}

                                <button 
                                    onClick={handleScheduleMeeting} 
                                    disabled={isScheduling}
                                    className="w-full py-2 bg-accent text-bg-main font-bold rounded hover:bg-accent/90 disabled:opacity-50 transition-colors text-xs mt-1"
                                >
                                    {isScheduling ? 'Scheduling...' : 'Add to Schedule'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!transcript) {
        return (
            <div className="flex flex-col items-center h-full animate-fade-in justify-center p-4">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-accent/20 shadow-[0_0_30px_-10px_rgba(244,163,0,0.3)]">
                        <MeetingIcon className="w-8 h-8 text-accent" />
                    </div>
                    <h1 className="text-3xl font-bold text-text-primary">AI Meeting Insights</h1>
                    <p className="text-sm text-text-secondary mt-1 max-w-lg mx-auto">
                        Automated summarization, action item extraction, and cultural intelligence analysis.
                    </p>
                </div>

                <div className="w-full max-w-xl bg-bg-surface border border-border-default rounded-xl p-6 shadow-xl">
                     <div className="flex justify-center border-b border-border-default mb-6 pb-2">
                        <button onClick={() => setMode('live')} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${mode === 'live' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-white'}`}>Live Meeting</button>
                        <button onClick={() => setMode('upload')} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${mode === 'upload' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-white'}`}>Upload Transcript</button>
                        <button onClick={() => setMode('schedule')} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-white transition-colors">Schedule</button>
                    </div>

                    {mode === 'live' ? (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Meeting Link</label>
                                <div className="relative">
                                    <input
                                        type="url"
                                        value={meetingLink}
                                        onChange={(e) => setMeetingLink(e.target.value)}
                                        placeholder="Paste your Zoom, Teams, or Meet link here..."
                                        className="w-full p-3 bg-bg-main border border-border-default rounded-lg text-sm text-white focus:ring-1 focus:ring-accent outline-none"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-50">
                                        <ZoomIcon className="w-4 h-4" />
                                        <TeamsIcon className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                            
                            <LanguageSelector label="Generate Summary In" languages={LANGUAGES} value={summaryLang} onChange={setSummaryLang} />
                            
                            <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg text-[10px] text-yellow-200">
                                <strong>Note:</strong> Select the meeting window/tab and enable <strong>"Share audio"</strong> when prompted.
                            </div>

                             <button onClick={handleStartLiveTranscription} className="w-full py-3 bg-accent text-bg-main font-bold rounded-lg hover:bg-white hover:text-accent transition-all shadow-lg text-sm uppercase tracking-wide">
                                Start Capturing
                            </button>
                            {error && <p className="text-red-400 text-center text-xs bg-red-500/10 p-2 rounded-md">{error}</p>}
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Transcript Content</label>
                                <textarea
                                    value={transcript}
                                    onChange={(e) => setTranscript(e.target.value)}
                                    placeholder="Paste text directly..."
                                    className="w-full p-3 bg-bg-main border border-border-default rounded-lg text-xs text-white focus:ring-1 focus:ring-accent outline-none resize-none h-32 custom-scrollbar"
                                />
                            </div>
                            
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-default"></div></div>
                                <div className="relative flex justify-center"><span className="px-2 bg-bg-surface text-[10px] text-text-secondary uppercase font-bold">OR</span></div>
                            </div>

                            <label className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border-default rounded-lg cursor-pointer hover:border-accent hover:bg-bg-main transition-all group">
                                <span className="text-xs font-bold text-text-secondary group-hover:text-white transition-colors">{fileName ? `Selected: ${fileName}` : "Upload .txt file"}</span>
                                <input type="file" className="hidden" onChange={handleFileChange} accept=".txt" />
                            </label>

                            <LanguageSelector label="Summary Language" languages={LANGUAGES} value={summaryLang} onChange={setSummaryLang} />

                             <button onClick={() => handleGenerate()} disabled={isLoading || !transcript.trim()} className="w-full py-3 bg-accent text-bg-main font-bold rounded-lg hover:bg-white hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm uppercase tracking-wide">
                                {isLoading ? 'Generating...' : 'Generate Summary'}
                            </button>
                             {error && <p className="text-red-400 text-center text-xs bg-red-500/10 p-2 rounded-md">{error}</p>}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-fade-in w-full">
            <div className="flex-shrink-0 pb-3 mb-3 border-b border-border-default">
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent/10 rounded-lg border border-accent/20">
                            <MeetingIcon className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Meeting Insights</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                {fileName && <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-text-secondary border border-white/5 truncate max-w-[200px]">{fileName}</span>}
                                {analysisResult && <span className="text-[10px] text-green-400 font-bold bg-green-900/20 px-2 py-0.5 rounded border border-green-500/20">Analyzed</span>}
                            </div>
                        </div>
                    </div>
                     <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => handleExport('doc')} className="px-3 py-1.5 text-[10px] font-bold bg-bg-surface border border-border-default text-text-secondary hover:text-white rounded-md transition-colors uppercase tracking-wider flex items-center gap-1.5">
                            <DownloadIcon className="w-3.5 h-3.5" /> Export
                        </button>
                        <button onClick={handleReset} className="px-3 py-1.5 text-[10px] font-bold bg-bg-surface border border-border-default text-text-secondary hover:text-white rounded-md transition-colors uppercase tracking-wider">New</button>
                    </div>
                </div>
                 
                <div className="mt-4 flex gap-4 border-b border-border-default">
                    <button 
                        onClick={() => setActiveTab('transcript')}
                        className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'transcript' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-white'}`}
                    >
                        Transcript
                    </button>
                    <button 
                        onClick={() => setActiveTab('notes')}
                        className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'notes' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-white'}`}
                    >
                        Smart Notes
                    </button>
                    <button 
                        onClick={() => setActiveTab('analytics')}
                        className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'analytics' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-white'}`}
                    >
                        Analytics
                    </button>
                </div>
                {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
                {activeTab === 'transcript' && (
                    <div className="h-full flex flex-col bg-bg-surface rounded-lg border border-border-default overflow-hidden">
                        <div className="p-2 border-b border-border-default bg-bg-main/50 flex items-center gap-2">
                            <SearchIcon className="w-4 h-4 text-text-secondary" />
                            <input 
                                type="text" 
                                placeholder="Search transcript..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent border-none text-xs text-white focus:ring-0 w-full outline-none"
                            />
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar whitespace-pre-wrap text-sm text-text-primary font-mono leading-relaxed">
                            {searchTerm ? getFilteredTranscript() : transcript}
                        </div>
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="h-full overflow-y-auto custom-scrollbar space-y-6 pb-10">
                        {isLoading && !analysisResult ? (
                            <div className="flex flex-col items-center justify-center h-48 gap-3">
                                <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-xs text-accent font-bold uppercase tracking-widest animate-pulse">Structuring Notes...</span>
                            </div>
                        ) : analysisResult ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Summary Card */}
                                <div className="md:col-span-2 bg-bg-surface p-5 rounded-xl border border-border-default shadow-sm">
                                    <h3 className="text-xs font-bold text-accent uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Executive Summary</h3>
                                    <p className="text-sm text-text-primary leading-relaxed">{analysisResult.summary}</p>
                                </div>

                                {/* Action Items */}
                                <div className="bg-bg-surface p-5 rounded-xl border border-border-default shadow-sm">
                                    <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <CheckIcon className="w-4 h-4 text-accent" /> Action Items
                                    </h3>
                                    <div className="space-y-2">
                                        {analysisResult.actionItems.map(renderActionItem)}
                                    </div>
                                </div>

                                {/* Key Decisions */}
                                <div className="bg-bg-surface p-5 rounded-xl border border-border-default shadow-sm">
                                    <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <ThinkingIcon className="w-4 h-4 text-blue-400" /> Key Decisions
                                    </h3>
                                    <ul className="space-y-2">
                                        {analysisResult.decisions.map((decision, i) => (
                                            <li key={i} className="flex gap-2 text-sm text-text-secondary">
                                                <span className="text-blue-400 font-bold">•</span>
                                                {decision}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}

                {activeTab === 'analytics' && analysisResult && (
                    <div className="h-full overflow-y-auto custom-scrollbar p-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Cultural Insights */}
                            <div className="bg-gradient-to-br from-purple-900/20 to-bg-surface p-6 rounded-xl border border-purple-500/20">
                                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">Cultural Intelligence</h3>
                                <p className="text-sm text-text-primary italic leading-relaxed">
                                    "{analysisResult.culturalInsights}"
                                </p>
                            </div>

                            {/* Sentiment Analysis */}
                            <div className="bg-bg-surface p-6 rounded-xl border border-border-default">
                                <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Meeting Sentiment</h3>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`text-2xl font-bold ${
                                        analysisResult.sentiment === 'Positive' ? 'text-green-400' : 
                                        analysisResult.sentiment === 'Negative' ? 'text-red-400' : 'text-yellow-400'
                                    }`}>
                                        {analysisResult.sentiment}
                                    </div>
                                    <div className="flex-1 h-3 bg-bg-main rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${
                                                analysisResult.sentiment === 'Positive' ? 'bg-green-500' : 
                                                analysisResult.sentiment === 'Negative' ? 'bg-red-500' : 'bg-yellow-500'
                                            }`} 
                                            style={{ width: `${analysisResult.sentimentScore}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs font-mono text-text-secondary">{analysisResult.sentimentScore}/100</span>
                                </div>
                                <p className="text-xs text-text-secondary">
                                    Based on tonal analysis of speaker interactions and vocabulary choice.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MeetingSummarizer;
