
import React, { useState, useEffect, useRef } from 'react';
import { summarizeMeeting, translateMeetingChunk } from '../services/geminiService';
import { parseZoomLink, authenticateZoom, connectBotToMeeting } from '../services/zoomService';
import { MOCK_MEETING_TRANSCRIPT, LANGUAGES, TONES } from '../constants';
import { GoogleMeetIcon, TeamsIcon, ZoomIcon } from './Icons';
import type { MeetingMode, User } from '../types';
import LanguageSelector from './LanguageSelector';
import ToneSelector from './ToneSelector';
import { supabase } from '../supabaseClient';

interface MeetingSummarizerProps {
    currentUser: User;
}

const MeetingSummarizer: React.FC<MeetingSummarizerProps> = ({ currentUser }) => {
    const [mode, setMode] = useState<MeetingMode>('live');
    const [transcript, setTranscript] = useState('');
    const [meetingLink, setMeetingLink] = useState('');
    const [summary, setSummary] = useState('');
    const [editedSummary, setEditedSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // States for live transcription simulation
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState('');
    const [transcriptionLang, setTranscriptionLang] = useState('en');
    const [transcriptionTone, setTranscriptionTone] = useState('Business');
    const [summaryLang, setSummaryLang] = useState('en');
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<string>('');

    const transcriptEndRef = useRef<HTMLDivElement>(null);

    const isZoomLink = meetingLink.includes('zoom.us');
    const isMeetingLinkValid = isZoomLink || meetingLink.includes('meet.google.com') || meetingLink.includes('teams.microsoft.com');

    // Auto-scroll to bottom of transcript
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [liveTranscript]);

    // Live Transcription & Translation Loop
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        let currentLine = 0;
        const transcriptLines = MOCK_MEETING_TRANSCRIPT.trim().split('\n');

        const processNextLine = async () => {
            if (currentLine < transcriptLines.length) {
                const line = transcriptLines[currentLine];
                if (line.trim()) {
                    // Translate the line on the fly if needed
                    let processedLine = line;
                    if (transcriptionLang !== 'en') {
                        const targetLangName = LANGUAGES.find(l => l.code === transcriptionLang)?.name || 'English';
                        processedLine = await translateMeetingChunk(line, targetLangName, transcriptionTone);
                    }
                    setLiveTranscript(prev => prev + processedLine + '\n');
                } else {
                    setLiveTranscript(prev => prev + '\n');
                }
                currentLine++;
            } else {
                clearInterval(interval);
            }
        };

        if (isTranscribing) {
            // Speed up simulation slightly for demo purposes
            interval = setInterval(processNextLine, 1500); 
        }
        return () => clearInterval(interval);
    }, [isTranscribing, transcriptionLang, transcriptionTone]);

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
                    console.error("Failed to save meeting summary:", dbError);
                    // Non-blocking error, user still sees summary
                }
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartLiveTranscription = async () => {
        setIsConnecting(true);
        setError(null);
        setConnectionStatus('Initializing connection...');

        try {
            // Special handling for Zoom links using the Zoom Service
            if (isZoomLink) {
                const zoomDetails = parseZoomLink(meetingLink);
                if (!zoomDetails) {
                    throw new Error("Invalid Zoom link format.");
                }

                setConnectionStatus('Authenticating with Zoom App...');
                const isAuthenticated = await authenticateZoom();
                
                if (!isAuthenticated) {
                    throw new Error("Zoom authentication failed. Check credentials.");
                }

                setConnectionStatus(`Joining meeting ${zoomDetails.meetingId}...`);
                const connectionMsg = await connectBotToMeeting(zoomDetails.meetingId);
                console.log(connectionMsg); // "AfriTranslate Bot connected..."
            } else {
                // Fallback for simulation of other platforms
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            setConnectionStatus('Connected. Starting transcription stream...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setIsConnecting(false);
            setLiveTranscript(''); // Clear previous
            setIsTranscribing(true);

        } catch (err) {
            setIsConnecting(false);
            setError(err instanceof Error ? err.message : "Connection failed.");
        }
    };

    const handleStopLiveTranscription = () => {
        setIsTranscribing(false);
        const finalTranscript = liveTranscript || MOCK_MEETING_TRANSCRIPT;
        setTranscript(finalTranscript);
        setFileName('Live Meeting Transcript');
        handleGenerate(finalTranscript);
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
    };

    if (isTranscribing || isConnecting) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in p-4">
                 {isConnecting ? (
                     <>
                        <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
                        <h2 className="text-2xl font-bold text-text-primary">Connecting...</h2>
                        <p className="text-text-secondary mt-2">{connectionStatus}</p>
                     </>
                 ) : (
                    <>
                        <div className="flex items-center gap-3 mb-4">
                            {isZoomLink && <div className="bg-blue-600 p-1.5 rounded-full"><ZoomIcon className="w-5 h-5 text-white" /></div>}
                            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                Transcription Active
                            </h2>
                        </div>
                        <div className="mb-2 text-xs text-accent uppercase tracking-widest font-bold">
                            Live Translation: {LANGUAGES.find(l=>l.code===transcriptionLang)?.name} ({transcriptionTone})
                        </div>
                        <div className="w-full max-w-3xl h-96 bg-bg-surface border border-border-default rounded-lg p-4 text-left overflow-y-auto font-mono text-sm whitespace-pre-wrap shadow-inner relative">
                            {liveTranscript}
                            <div ref={transcriptEndRef} />
                        </div>
                        <button onClick={handleStopLiveTranscription} className="mt-6 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-lg">
                            Stop Transcription & Generate Summary
                        </button>
                    </>
                 )}
             </div>
        )
    }

    if (!transcript) {
        return (
            <div className="flex flex-col items-center h-full animate-fade-in p-4">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-text-primary">AI Meeting Summarizer</h1>
                    <p className="text-lg text-text-secondary mt-2 max-w-2xl">
                        Generate key discussion points, decisions, and action items automatically from a live meeting or transcript file.
                    </p>
                </div>

                <div className="mt-8 w-full max-w-2xl">
                     <div className="flex justify-center border-b border-border-default mb-6">
                        <button onClick={() => setMode('live')} className={`px-4 py-2 text-sm font-semibold ${mode === 'live' ? 'border-b-2 border-accent text-white' : 'text-text-secondary'}`}>Live Meeting</button>
                        <button onClick={() => setMode('upload')} className={`px-4 py-2 text-sm font-semibold ${mode === 'upload' ? 'border-b-2 border-accent text-white' : 'text-text-secondary'}`}>Upload Transcript</button>
                    </div>

                    {mode === 'live' ? (
                        <div className="bg-bg-surface p-6 rounded-lg border border-border-default space-y-4 animate-fade-in">
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">Meeting Link</label>
                                <input
                                    type="url"
                                    value={meetingLink}
                                    onChange={(e) => setMeetingLink(e.target.value)}
                                    placeholder="Paste your Zoom, Teams, or Meet link here..."
                                    className="w-full p-3 bg-bg-main border border-border-default rounded-lg shadow-sm focus:ring-2 focus:ring-accent focus:border-accent transition text-text-primary placeholder-text-secondary"
                                />
                                <div className="flex items-center gap-4 mt-2 text-text-secondary">
                                    <span className="text-xs">Supported:</span>
                                    <div className="flex items-center gap-3">
                                        <div className={`transition-opacity ${meetingLink.includes('zoom.us') ? 'opacity-100' : 'opacity-50'}`}><ZoomIcon className="w-5 h-5" /></div>
                                        <div className={`transition-opacity ${meetingLink.includes('teams.microsoft') ? 'opacity-100' : 'opacity-50'}`}><TeamsIcon className="w-5 h-5" /></div>
                                        <div className={`transition-opacity ${meetingLink.includes('meet.google') ? 'opacity-100' : 'opacity-50'}`}><GoogleMeetIcon className="w-5 h-5" /></div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                               <LanguageSelector label="Live Output Language" languages={LANGUAGES} value={transcriptionLang} onChange={setTranscriptionLang} />
                               <ToneSelector label="Live Output Tone" tones={TONES} value={transcriptionTone} onChange={setTranscriptionTone} />
                               <LanguageSelector label="Summary Language" languages={LANGUAGES} value={summaryLang} onChange={setSummaryLang} />
                            </div>
                             <button onClick={handleStartLiveTranscription} disabled={!isMeetingLinkValid} className="w-full py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 disabled:bg-border-default disabled:cursor-not-allowed transition-colors">
                                Start Live Transcription
                            </button>
                            {error && <p className="text-red-400 text-center mt-4 text-sm bg-red-500/10 p-2 rounded-md">{error}</p>}
                        </div>
                    ) : (
                        <div className="bg-bg-surface p-6 rounded-lg border border-border-default animate-fade-in">
                            <label className="block text-sm font-medium text-text-primary mb-2">Meeting Transcript (.txt)</label>
                            <textarea
                                value={transcript}
                                onChange={(e) => setTranscript(e.target.value)}
                                placeholder="Paste your meeting transcript here..."
                                className="w-full p-3 bg-bg-main border border-border-default rounded-lg shadow-sm focus:ring-2 focus:ring-accent focus:border-accent transition text-text-primary placeholder-text-secondary resize-y"
                                rows={8}
                            />
                            <div className="flex items-center justify-center my-4">
                                <span className="text-text-secondary text-sm">OR</span>
                            </div>
                            <label className="w-full flex justify-center px-4 py-2 border-2 border-dashed border-border-default rounded-md cursor-pointer hover:border-accent transition-colors">
                                <span className="text-accent font-semibold">{fileName ? `Selected: ${fileName}` : "Upload .txt file"}</span>
                                <input type="file" className="hidden" onChange={handleFileChange} accept=".txt" />
                            </label>
                            <div className="mt-6">
                                <LanguageSelector label="Generate Summary In" languages={LANGUAGES} value={summaryLang} onChange={setSummaryLang} />
                            </div>
                             <button onClick={() => handleGenerate()} disabled={isLoading || !transcript.trim()} className="w-full mt-6 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 disabled:bg-border-default disabled:cursor-not-allowed transition-colors">
                                {isLoading ? 'Generating Summary...' : 'Generate Summary'}
                            </button>
                             {error && <p className="text-red-400 text-center mt-4 text-sm bg-red-500/10 p-2 rounded-md">{error}</p>}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="flex-shrink-0 pb-4 mb-4 border-b border-border-default">
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-white">Meeting Summary</h1>
                     <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => setIsEditing(!isEditing)} className="px-4 py-2 bg-bg-surface text-white font-semibold rounded-md hover:bg-border-default transition-colors">
                            {isEditing ? 'View Summary' : 'Edit Summary'}
                        </button>
                        <button onClick={handleExportPDF} className="px-4 py-2 bg-bg-surface text-white font-semibold rounded-md hover:bg-border-default transition-colors">Export PDF</button>
                        <button onClick={handleExportWord} className="px-4 py-2 bg-bg-surface text-white font-semibold rounded-md hover:bg-border-default transition-colors">Export Word</button>
                        <button onClick={handleReset} className="px-4 py-2 bg-bg-surface text-white font-semibold rounded-md hover:bg-border-default transition-colors">New Summary</button>
                    </div>
                </div>
                {fileName && <p className="text-sm text-text-secondary mt-1">Source: {fileName}</p>}
                 
                <div className="mt-4 flex items-end gap-4">
                    <div className="flex-grow">
                        <LanguageSelector label="Summary Language" languages={LANGUAGES} value={summaryLang} onChange={setSummaryLang} />
                    </div>
                    <button onClick={() => handleGenerate()} disabled={isLoading} className="px-4 py-2 bg-accent text-white font-semibold rounded-md hover:bg-accent/90 disabled:bg-border-default disabled:cursor-not-allowed transition-colors whitespace-nowrap">
                        {isLoading 
                            ? (summary ? 'Regenerating...' : 'Generating...') 
                            : (summary ? 'Regenerate Summary' : 'Generate Summary')
                        }
                    </button>
                </div>
                {error && <p className="text-red-400 text-center mt-4 text-sm bg-red-500/10 p-2 rounded-md">{error}</p>}
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
                <div className="flex flex-col">
                    <h2 className="text-lg font-semibold mb-2">Original Transcript</h2>
                    <textarea readOnly value={transcript} className="w-full h-full p-3 bg-bg-surface border border-border-default rounded-md resize-none text-sm" />
                </div>
                 <div className="flex flex-col relative">
                    <h2 className="text-lg font-semibold mb-2">AI-Generated Summary</h2>
                    {isLoading && !summary ? (
                         <div className="absolute inset-0 bg-bg-surface/80 flex items-center justify-center rounded-md">
                            <div className="flex items-center space-x-1.5">
                                <span className="h-3 w-3 bg-accent rounded-full animate-pulse-warm [animation-delay:-0.3s]"></span>
                                <span className="h-3 w-3 bg-accent rounded-full animate-pulse-warm [animation-delay:-0.15s]"></span>
                                <span className="h-3 w-3 bg-accent rounded-full animate-pulse-warm"></span>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isEditing ? (
                                <textarea
                                    value={editedSummary}
                                    onChange={(e) => setEditedSummary(e.target.value)}
                                    className="w-full h-full p-3 bg-bg-main border border-accent ring-1 ring-accent rounded-md resize-y text-sm"
                                />
                            ) : (
                                <div 
                                    className="w-full h-full p-4 bg-bg-surface border border-border-default rounded-md overflow-y-auto prose prose-invert prose-h2:text-accent prose-h2:text-lg prose-h2:font-semibold prose-li:my-1"
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
