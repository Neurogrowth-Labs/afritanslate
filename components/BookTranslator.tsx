

import React, { useState, useCallback, useEffect } from 'react';
import { translateBook } from '../services/geminiService';
import { LANGUAGES, TONES } from '../constants';
import LanguageSelector from './LanguageSelector';
import ToneSelector from './ToneSelector';

const BookTranslator: React.FC = () => {
    const [sourceText, setSourceText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sourceLang, setSourceLang] = useState<string>('en');
    const [targetLang, setTargetLang] = useState<string>('sw');
    const [tone, setTone] = useState<string>('Friendly');
    const [fileName, setFileName] = useState('');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if(isLoading) {
            setTranslatedText(''); // Clear previous translation when starting a new one
        }
    }, [isLoading]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setSourceText(text);
                setTranslatedText('');
                setError(null);
                setProgress(0);
            };
            reader.readAsText(file);
        }
    };

    const handleProgressUpdate = (newProgress: number, translatedChunk: string) => {
        setProgress(newProgress);
        setTranslatedText(prev => prev + translatedChunk);
    };

    const handleTranslate = async () => {
        if (!sourceText) return;
        setIsLoading(true);
        setError(null);
        try {
            await translateBook(sourceText, sourceLang, targetLang, tone, handleProgressUpdate);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
            setProgress(100);
        }
    };

    const handleDownload = () => {
        const blob = new Blob([translatedText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `translated_${fileName || 'book'}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setSourceText('');
        setTranslatedText('');
        setFileName('');
        setError(null);
        setIsLoading(false);
        setProgress(0);
    };

     const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const file = event.dataTransfer.files?.[0];
         if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setSourceText(text);
                setTranslatedText('');
                setError(null);
            };
            reader.readAsText(file);
        }
    }, []);

    const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };


    if (!sourceText) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
                <h1 className="text-4xl font-bold text-text-primary">Book Translator</h1>
                <p className="text-lg text-text-secondary mt-2 max-w-2xl">Our Culture-Intelligent AI agent translates your book paragraph by paragraph, adapting cultural nuances and idioms to preserve the story's original soul for a new audience.</p>
                <div 
                    onDrop={onDrop} 
                    onDragOver={onDragOver}
                    className="mt-8 w-full max-w-2xl h-64 border-2 border-dashed border-border-default rounded-lg flex flex-col items-center justify-center bg-bg-surface/50 hover:border-accent hover:bg-bg-surface transition-colors"
                >
                    <p className="text-text-primary">Drag & drop your book file here</p>
                    <p className="text-text-secondary my-2">or</p>
                     <label className="bg-accent text-white font-semibold px-4 py-2 rounded-md cursor-pointer hover:bg-accent/90 transition-colors">
                        Click to upload
                        <input type="file" className="hidden" onChange={handleFileChange} accept=".txt,.md,.docx,.pdf" />
                    </label>
                    <p className="text-xs text-text-secondary mt-4">Supports .txt, .md, and other text formats</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="flex-shrink-0 pb-4 mb-4 border-b border-border-default">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                     <div>
                        <h1 className="text-2xl font-bold text-white">Book Translator</h1>
                        <p className="text-sm text-text-secondary truncate max-w-xs sm:max-w-md">Translating: {fileName}</p>
                    </div>
                     <div className="flex items-center gap-2">
                         <button onClick={handleTranslate} disabled={isLoading} className="px-4 py-2 bg-accent text-white font-semibold rounded-md hover:bg-accent/90 disabled:bg-border-default disabled:cursor-not-allowed transition-colors">
                            {isLoading ? 'Translating...' : 'Translate'}
                        </button>
                        <button onClick={handleDownload} disabled={!translatedText || isLoading} className="px-4 py-2 bg-bg-surface text-white font-semibold rounded-md hover:bg-border-default disabled:bg-border-default/50 disabled:text-text-secondary disabled:cursor-not-allowed transition-colors">Download</button>
                        <button onClick={handleReset} className="px-4 py-2 bg-bg-surface text-white font-semibold rounded-md hover:bg-border-default transition-colors">Start Over</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <LanguageSelector label="From" languages={LANGUAGES} value={sourceLang} onChange={setSourceLang} />
                    <LanguageSelector label="To" languages={LANGUAGES} value={targetLang} onChange={setTargetLang} />
                    <ToneSelector label="Tone" tones={TONES} value={tone} onChange={setTone} />
                </div>
                 {(isLoading || progress > 0) && (
                    <div className="mt-4">
                        <div className="w-full bg-border-default rounded-full h-2.5">
                            <div className="bg-accent h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
                        </div>
                        <p className="text-center text-sm text-text-secondary mt-1">{progress}% Complete</p>
                    </div>
                )}
                {error && <p className="text-red-400 text-center mt-2 text-sm bg-red-500/10 p-2 rounded-md">{error}</p>}
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
                <div className="flex flex-col">
                    <h2 className="text-lg font-semibold mb-2">Source Text</h2>
                    <textarea readOnly value={sourceText} className="w-full h-full p-3 bg-bg-surface border border-border-default rounded-md resize-none" />
                </div>
                 <div className="flex flex-col">
                    <h2 className="text-lg font-semibold mb-2">Translation</h2>
                    <textarea readOnly value={translatedText} className="w-full h-full p-3 bg-bg-surface border border-border-default rounded-md resize-none" />
                </div>
            </div>
        </div>
    );
};

export default BookTranslator;