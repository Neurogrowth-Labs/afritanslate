
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { summarizeMeeting } from '../services/geminiService';
import { MOCK_MEETING_TRANSCRIPT, LANGUAGES } from '../constants';
import { GoogleMeetIcon, TeamsIcon, ZoomIcon, CalendarIcon, ClockIcon, TrashIcon, MicrophoneIcon } from './Icons';
import type { MeetingMode, User, ScheduledMeeting } from '../types';
import LanguageSelector from './LanguageSelector';
import ToneSelector from './ToneSelector';
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
    const [summary, setSummary] = useState('');
    const [editedSummary, setEditedSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // States for Live Transcription
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState('');
    const [transcriptionLang, setTranscriptionLang] = useState('en');
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
    const sessionRef = useRef<any>(null); // LiveSession type is inferred
    const audioContextRef = useRef<AudioContext | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const workletUrlRef = useRef<string | null>(null);

    const isZoomLink = meetingLink.includes('zoom.us');
    const isMeetingLinkValid = isZoomLink || meetingLink.includes('meet.google.com') || meetingLink.includes('teams.microsoft.com');

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
            .gte('scheduled_at', new Date().toISOString()) // Only future or current meetings
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

            // Reset form and refresh list
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
        setSummary('');
        try {
            const summaryLangName = LANGUAGES.find(l => l.code === summaryLang)?.name || 'English';
            const result = await summarizeMeeting(transcriptToUse, meetingLink, summaryLangName);
            setSummary(result);
            setEditedSummary(result);

            // Store meeting activity in Supabase
            if (currentUser) {
                const { error: dbError } = await supabase.from('meeting_summaries').insert({
                    user_id: currentUser.id,
                    meeting_link: meetingLink,
                    file_name: fileName || (mode === 'live' ? 'Live Session' : 'Uploaded File'),
                    transcript: transcriptToUse,
                    summary: result,
                    language: summaryLang,
                    mode: mode,
                    created_at: new Date().toISOString()
                });

                if (dbError) {
                    console.error("Failed to save meeting summary:", dbError.message || JSON.stringify(dbError));
                }
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
            // Check if there is a close method, depends on SDK version, otherwise just nullify
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
            // 1. Capture System Audio (e.g., from Zoom/Teams tab/window)
            // video: true is required for getDisplayMedia to capture audio, but we ignore the video track.
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            
            // Check if user shared audio
            if (stream.getAudioTracks().length === 0) {
                stream.getTracks().forEach(t => t.stop());
                throw new Error("No audio track detected. Please make sure to check 'Share audio' when selecting the window/tab.");
            }

            setCaptureStream(stream);
            setConnectionStatus('Connecting to Gemini Live...');

            // 2. Setup Audio Context & Worklet
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
            // We do NOT connect to destination to avoid feedback loop (hearing yourself/meeting twice)

            // 3. Connect to Gemini Live
            const sessionPromise = aiRef.current.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                config: {
                    responseModalities: [Modality.AUDIO], // We need audio to keep connection alive, but we ignore it
                    inputAudioTranscription: { model: "google-speech-v1" }, // Request transcription of input
                    systemInstruction: "You are a passive meeting scribe. Your only task is to listen and transcribe. Do not speak. Do not answer questions.",
                },
                callbacks: {
                    onopen: () => {
                        setIsConnecting(false);
                        setIsTranscribing(true);
                        setConnectionStatus('Connected & Listening...');
                        
                        // Start piping audio data
                        worklet.port.onmessage = (event) => {
                            const pcmBlob = createBlob(event.data);
                            sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                    },
                    onmessage: (msg: LiveServerMessage) => {
                        // Capture transcription of the INPUT audio (the meeting)
                        if (msg.serverContent?.inputTranscription) {
                            const text = msg.serverContent.inputTranscription.text;
                            if (text) {
                                setLiveTranscript(prev => prev + text);
                            }
                        }
                    },
                    onclose: () => {
                        console.log("Session closed");
                        handleStopLiveTranscription();
                    },
                    onerror: (err) => {
                        console.error("Session error:", err);
                        setError("Connection lost. Please restart.");
                        handleStopLiveTranscription();
                    }
                }
            });
            
            sessionRef.current = sessionPromise;

            // Handle stream stop (user clicks "Stop sharing" in browser UI)
            stream.getVideoTracks()[0].onended = () => {
                handleStopLiveTranscription();
            };

        } catch (err: any) {
            console.error("Transcription start error:", err);
            cleanupAudio();
            setIsConnecting(false);
            setError(err.message || "Failed to start transcription.");
        }
    };

    const handleStopLiveTranscription = () => {
        cleanupAudio();
        setIsTranscribing(false);
        setIsConnecting(false);
        
        // Auto-generate summary if we have content
        if (liveTranscript.trim().length > 0) {
            const finalTranscript = liveTranscript;
            setTranscript(finalTranscript);
            setFileName('Live Meeting Transcript');
            handleGenerate(finalTranscript);
        }
    };

    const renderSummaryHtml = (markdown: string): string => {
        let html = '';
        let inList = false;
        const lines = markdown.split('\n');
        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                html += `<h2>${trimmedLine.substring(2, trimmedLine.length - 2)}</h2>`;
            } else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
                if (!inList) {
                    html += '<ul>';
                    inList = true;
                }
                html += `<li>${trimmedLine.substring(2)}</li>`;
            } else {
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                if (trimmedLine) {
                    html += `<p>${trimmedLine}</p>`;
                }
            }
        });

        if (inList) {
            html += '</ul>';
        }
        return html;
    }

    const handleExportWord = () => {
        const htmlSummary = renderSummaryHtml(editedSummary);
        const content = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Meeting Summary</title></head>
            <body>
                <h1>Meeting Summary</h1>
                ${fileName ? `<p><strong>File:</strong> ${fileName}</p>` : ''}
                ${meetingLink ? `<p><strong>Meeting Link:</strong> ${meetingLink}</p>` : ''}
                ${htmlSummary}
            </body>
            </html>
        `;
        const blob = new Blob([content], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `summary-${fileName || 'meeting'}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExportPDF = () => {
        const printWindow = window.open('', '_blank', 'height=800,width=600');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Meeting Summary</title>');
            printWindow.document.write(`
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                        line-height: 1.6; 
                        color: #111827; 
                        margin: 2rem;
                    }
                    h1 {
                        font-size: 1.5rem;
                        font-weight: 600;
                        color: #000;
                        border-bottom: 2px solid #e5e7eb;
                        padding-bottom: 0.5rem;
                        margin-bottom: 1.5rem;
                    }
                    h2 { 
                        font-size: 1.25rem;
                        font-weight: 600;
                        color: #D97706; /* Accent color */
                        margin-top: 2rem;
                        margin-bottom: 1rem;
                    } 
                    ul { 
                        padding-left: 1.5rem; 
                        margin-top: 0.5rem;
                        margin-bottom: 1rem;
                    } 
                    li { 
                        margin-bottom: 0.5rem; 
                    }
                    p {
                        margin-bottom: 1rem;
                    }
                    strong {
                        font-weight: 600;
                    }
                     a {
                        color: #0284c7;
                        text-decoration: none;
                    }
                </style>
            `);
            printWindow.document.write('</head><body>');

            const htmlSummary = renderSummaryHtml(editedSummary);

            let htmlContent = `<h1>Meeting Summary</h1>`;
            if (fileName) {
                htmlContent += `<p><strong>File:</strong> ${fileName}</p>`;
            }
            if (meetingLink) {
                 htmlContent += `<p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>`;
            }
            htmlContent += htmlSummary;

            printWindow.document.write(htmlContent);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    };
    
    const handleReset = () => {
        setMode('live');
        setTranscript('');
        setMeetingLink('');
        setSummary('');
        setEditedSummary('');
        setIsLoading(false);
        setError(null);
        setFileName('');
        setIsEditing(false);
        setIsTranscribing(false);
        setLiveTranscript('');
        setConnectionStatus('');
        setNewMeetingTitle('');
        setNewMeetingDate('');
        setNewMeetingTime('');
        setNewMeetingLink('');
        cleanupAudio();
    };

    // --- Calendar Helper Functions ---
    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const changeMonth = (offset: number) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
    };

    if (isTranscribing || isConnecting) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in p-4">
                 {isConnecting ? (
                     <>
                        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
                        <h2 className="text-xl font-bold text-text-primary">Establishing Link...</h2>
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
                            Stop & Summarize
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
                    <h1 className="text-3xl font-bold text-text-primary">AI Meeting Insights</h1>
                    <p className="text-sm text-text-secondary mt-1 max-w-lg mx-auto">
                        Automated summarization and action item extraction.
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
                        <h1 className="text-xl font-bold text-white">Meeting Insights</h1>
                        {fileName && <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-text-secondary border border-white/5 truncate max-w-[200px]">{fileName}</span>}
                    </div>
                     <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => setIsEditing(!isEditing)} className="px-3 py-1.5 text-[10px] font-bold bg-bg-surface border border-border-default text-text-secondary hover:text-white rounded-md transition-colors uppercase tracking-wider">
                            {isEditing ? 'View' : 'Edit'}
                        </button>
                        <button onClick={handleExportPDF} className="px-3 py-1.5 text-[10px] font-bold bg-bg-surface border border-border-default text-text-secondary hover:text-white rounded-md transition-colors uppercase tracking-wider">PDF</button>
                        <button onClick={handleExportWord} className="px-3 py-1.5 text-[10px] font-bold bg-bg-surface border border-border-default text-text-secondary hover:text-white rounded-md transition-colors uppercase tracking-wider">Word</button>
                        <button onClick={handleReset} className="px-3 py-1.5 text-[10px] font-bold bg-bg-surface border border-border-default text-text-secondary hover:text-white rounded-md transition-colors uppercase tracking-wider">New</button>
                    </div>
                </div>
                 
                <div className="mt-3 flex items-end gap-3">
                    <div className="flex-grow max-w-xs">
                        <LanguageSelector label="Summary Language" languages={LANGUAGES} value={summaryLang} onChange={setSummaryLang} />
                    </div>
                    <button onClick={() => handleGenerate()} disabled={isLoading} className="px-4 py-2 bg-accent text-bg-main text-xs font-bold rounded-md hover:bg-white hover:text-accent disabled:opacity-50 transition-colors uppercase tracking-wide">
                        {isLoading ? 'Processing...' : (summary ? 'Regenerate' : 'Generate')}
                    </button>
                </div>
                {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
            </div>

            <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4 overflow-hidden">
                <div className="flex-1 flex flex-col min-h-0 bg-bg-surface rounded-lg border border-border-default overflow-hidden">
                    <div className="p-2 border-b border-border-default bg-bg-main/50">
                        <h2 className="text-xs font-bold text-text-secondary uppercase tracking-widest">Transcript</h2>
                    </div>
                    <textarea readOnly value={transcript} className="flex-1 w-full p-4 bg-transparent resize-none text-xs leading-relaxed text-text-primary focus:outline-none custom-scrollbar font-mono" />
                </div>
                 <div className="flex-1 flex flex-col min-h-0 bg-bg-surface rounded-lg border border-border-default overflow-hidden relative">
                    <div className="p-2 border-b border-border-default bg-bg-main/50">
                        <h2 className="text-xs font-bold text-accent uppercase tracking-widest">AI Summary</h2>
                    </div>
                    {isLoading && !summary ? (
                         <div className="absolute inset-0 bg-bg-surface/80 flex items-center justify-center z-10">
                            <div className="flex items-center space-x-1.5">
                                <span className="h-2 w-2 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="h-2 w-2 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="h-2 w-2 bg-accent rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isEditing ? (
                                <textarea
                                    value={editedSummary}
                                    onChange={(e) => setEditedSummary(e.target.value)}
                                    className="flex-1 w-full p-4 bg-transparent resize-none text-sm leading-relaxed text-text-primary focus:outline-none custom-scrollbar"
                                />
                            ) : (
                                <div 
                                    className="flex-1 w-full p-4 overflow-y-auto custom-scrollbar prose prose-invert prose-sm max-w-none prose-headings:text-sm prose-headings:font-bold prose-headings:text-white prose-p:text-xs prose-li:text-xs prose-li:marker:text-accent"
                                    dangerouslySetInnerHTML={{ __html: renderSummaryHtml(summary) }}
                                ></div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MeetingSummarizer;
