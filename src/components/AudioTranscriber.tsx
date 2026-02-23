
import React, { useState, useCallback } from 'react';
import { transcribeAudio } from '../../services/geminiService';
import { CheckIcon, MicrophoneIcon, WordIcon, PdfIcon } from './Icons';
import type { TranscriptionStyle } from '../types';

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75H18.5a1.125 1.125 0 011.125 1.125v9.75M9.75 3.75v13.5H3.375" />
    </svg>
);

const AudioTranscriber: React.FC = () => {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [transcript, setTranscript] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [transcriptionStyle, setTranscriptionStyle] = useState<TranscriptionStyle>('normal');

    const handleFileChange = (file: File | null) => {
        if (file) {
            // Basic validation for audio types
            if (!file.type.startsWith('audio/') && !file.type.includes('video/mp4') && !file.type.includes('video/webm')) {
                setError("Invalid file type. Please upload a valid audio file (e.g., MP3, WAV, M4A).");
                setAudioFile(null);
                return;
            }

            setAudioFile(file);
            setTranscript('');
            setError(null);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleFileChange(event.target.files?.[0] || null);
    };

    const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        handleFileChange(event.dataTransfer.files?.[0] || null);
    }, []);

    const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handleTranscribe = async () => {
        if (!audioFile) return;
        setIsLoading(true);
        setError(null);
        setTranscript('');
        try {
            const result = await transcribeAudio(audioFile, transcriptionStyle);
            setTranscript(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during transcription.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(transcript);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleExportWord = () => {
        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
            "xmlns:w='urn:schemas-microsoft-com:office:word' "+
            "xmlns='http://www.w3.org/TR/REC-html40'>"+
            "<head><meta charset='utf-8'><title>Transcription</title></head><body>";
        const footer = "</body></html>";
        const content = header + transcript.replace(/\n/g, '<br />') + footer;
        
        const blob = new Blob(['\ufeff', content], {
            type: 'application/msword'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = audioFile?.name.replace(/\.[^/.]+$/, "") || 'transcription';
        a.download = `${fileName}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportPDF = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Transcription</title>');
            printWindow.document.write(`
                <style>
                    body { font-family: sans-serif; line-height: 1.6; padding: 2rem; white-space: pre-wrap; word-wrap: break-word; }
                </style>
            `);
            printWindow.document.write('</head><body>');
            printWindow.document.write(transcript);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
    };
    
    const handleReset = () => {
        setAudioFile(null);
        setTranscript('');
        setError(null);
        setIsLoading(false);
    }

    if (!audioFile) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in p-4">
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-4 border border-accent/20">
                    <MicrophoneIcon className="w-8 h-8 text-accent" />
                </div>
                <h1 className="text-4xl font-bold text-text-primary">Audio Transcriber</h1>
                <p className="text-lg text-text-secondary mt-2 max-w-2xl">Upload an audio file to get a highly accurate text transcription powered by AI.</p>
                <div 
                    onDrop={onDrop} 
                    onDragOver={onDragOver}
                    className="mt-8 w-full max-w-2xl h-64 border-2 border-dashed border-border-default rounded-lg flex flex-col items-center justify-center bg-bg-surface/50 hover:border-accent hover:bg-bg-surface transition-colors"
                >
                    <p className="text-text-primary">Drag & drop your audio file here</p>
                    <p className="text-text-secondary my-2">or</p>
                     <label className="bg-accent text-white font-semibold px-4 py-2 rounded-md cursor-pointer hover:bg-accent/90 transition-colors">
                        Click to upload
                        <input type="file" className="hidden" onChange={handleFileSelect} accept="audio/*" />
                    </label>
                    <p className="text-xs text-text-secondary mt-4">Supports .mp3, .wav, .webm, .m4a, and more.</p>
                </div>
                {error && <p className="text-red-400 text-center mt-4 text-sm bg-red-500/10 p-2 rounded-md animate-fade-in">{error}</p>}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-fade-in p-4">
            <div className="flex-shrink-0 pb-4 mb-4 border-b border-border-default">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent/10 rounded-lg border border-accent/20">
                            <MicrophoneIcon className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Audio Transcriber</h1>
                            <p className="text-sm text-text-secondary truncate max-w-xs sm:max-w-md flex items-center gap-2">
                               {audioFile.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {!transcript && (
                             <button onClick={handleTranscribe} disabled={isLoading} className="px-4 py-2 bg-accent text-white font-semibold rounded-md hover:bg-accent/90 disabled:bg-border-default disabled:cursor-not-allowed transition-colors">
                                {isLoading ? 'Transcribing...' : 'Transcribe Audio'}
                            </button>
                        )}
                        {transcript && (
                            <>
                                <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 bg-bg-surface text-white font-semibold rounded-md hover:bg-border-default transition-colors">
                                    {isCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon />} {isCopied ? 'Copied!' : 'Copy'}
                                </button>
                                <button onClick={handleExportWord} className="flex items-center gap-2 px-4 py-2 bg-bg-surface text-white font-semibold rounded-md hover:bg-border-default transition-colors">
                                    <WordIcon className="w-5 h-5" /> Export Word
                                </button>
                                <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-bg-surface text-white font-semibold rounded-md hover:bg-border-default transition-colors">
                                    <PdfIcon className="w-5 h-5" /> Export PDF
                                </button>
                            </>
                        )}
                        <button onClick={handleReset} className="px-4 py-2 bg-bg-surface text-white font-semibold rounded-md hover:bg-border-default transition-colors">Start Over</button>
                    </div>
                </div>

                {!transcript && !isLoading && (
                    <div className="mt-4 max-w-sm">
                        <label className="block text-sm font-medium text-text-secondary mb-2">Transcription Style</label>
                        <div className="flex bg-bg-main border border-border-default rounded-lg p-1">
                            <button onClick={() => setTranscriptionStyle('normal')} className={`w-1/2 py-1.5 rounded-md text-sm font-semibold transition-colors ${transcriptionStyle === 'normal' ? 'bg-accent text-white' : 'text-text-secondary hover:bg-border-default'}`}>
                                Normal Style
                            </button>
                            <button onClick={() => setTranscriptionStyle('interview')} className={`w-1/2 py-1.5 rounded-md text-sm font-semibold transition-colors ${transcriptionStyle === 'interview' ? 'bg-accent text-white' : 'text-text-secondary hover:bg-border-default'}`}>
                                Interview Style
                            </button>
                        </div>
                    </div>
                )}

                {error && <p className="text-red-400 text-center mt-4 text-sm bg-red-500/10 p-2 rounded-md animate-fade-in">{error}</p>}
            </div>
            
            <div className="flex-1 overflow-y-auto">
                 {isLoading && (
                    <div className="flex items-center justify-center h-full">
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-text-primary">Analyzing audio, please wait...</p>
                        </div>
                    </div>
                 )}
                 {transcript && (
                     <div className="bg-bg-surface p-4 rounded-lg border border-border-default">
                         <p className="text-text-primary whitespace-pre-wrap">{transcript}</p>
                     </div>
                 )}
            </div>
        </div>
    );
};

export default AudioTranscriber;
