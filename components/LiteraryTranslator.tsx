
import React, { useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { BookIcon, TranslateIcon, InfoIcon } from './Icons';
import * as geminiService from '../services/geminiService';
import { LANGUAGES } from '../constants';
import LanguageSelector from './LanguageSelector';

interface LiteraryTranslatorProps {
    isOffline?: boolean;
}

interface TranslationVersion {
    type: 'literal' | 'natural' | 'artistic';
    text: string;
    notes: string;
}

const LITERARY_STYLES = [
    { value: 'literal', label: 'Literal', description: 'Word-for-word accuracy' },
    { value: 'adaptive', label: 'Adaptive', description: 'Culturally adapted while preserving meaning' },
    { value: 'artistic', label: 'Artistic', description: 'Creative interpretation for literary flow' }
];

const GENRES = [
    'Poetry', 'Fiction', 'Non-Fiction', 'Drama', 'Children\'s Literature', 
    'Religious Texts', 'Folklore', 'Academic'
];

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const rawHtml = marked.parse(content, { gfm: true, breaks: true }) as string;
    const sanitizedHtml = DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
    return (
        <div 
            className="prose prose-invert prose-sm max-w-none text-[14px]"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
    );
};

const LiteraryTranslator: React.FC<LiteraryTranslatorProps> = ({ isOffline = false }) => {
    const [sourceText, setSourceText] = useState('');
    const [sourceLang, setSourceLang] = useState('en');
    const [targetLang, setTargetLang] = useState('sw');
    const [genre, setGenre] = useState('Fiction');
    const [selectedStyle, setSelectedStyle] = useState('adaptive');
    const [isTranslating, setIsTranslating] = useState(false);
    const [versions, setVersions] = useState<TranslationVersion[]>([]);
    const [activeVersion, setActiveVersion] = useState<'literal' | 'natural' | 'artistic'>('natural');

    const handleTranslate = async () => {
        if (!sourceText.trim()) return;

        setIsTranslating(true);
        try {
            const prompt = `Translate this ${genre} text from ${sourceLang} to ${targetLang} with literary excellence.
            
            Source Text:
            "${sourceText}"
            
            Provide THREE versions:
            1. LITERAL: Word-for-word translation preserving original structure
            2. NATURAL: Culturally adapted translation that reads naturally in the target language
            3. ARTISTIC: Creative literary translation that captures the emotional essence and artistic intent
            
            For each version, include:
            - The translation
            - Translator's notes explaining key decisions
            
            Special considerations:
            - Preserve metaphors or adapt them culturally
            - Maintain rhythm and flow for poetry
            - Adapt idioms and proverbs appropriately
            - Preserve emotional tone and literary devices
            - Consider cultural context and sensitivities
            
            Format as JSON with structure: {literal: {text, notes}, natural: {text, notes}, artistic: {text, notes}}`;

            const response = await geminiService.getAIAssistantResponse(prompt);
            
            try {
                const parsed = JSON.parse(response);
                setVersions([
                    { type: 'literal', text: parsed.literal.text, notes: parsed.literal.notes },
                    { type: 'natural', text: parsed.natural.text, notes: parsed.natural.notes },
                    { type: 'artistic', text: parsed.artistic.text, notes: parsed.artistic.notes }
                ]);
            } catch {
                setVersions([
                    { type: 'literal', text: response, notes: 'Translation generated' },
                    { type: 'natural', text: response, notes: 'Translation generated' },
                    { type: 'artistic', text: response, notes: 'Translation generated' }
                ]);
            }
        } catch (error) {
            console.error('Translation error:', error);
        } finally {
            setIsTranslating(false);
        }
    };

    const activeTranslation = versions.find(v => v.type === activeVersion);

    return (
        <div className="flex flex-col h-full w-full bg-transparent overflow-hidden">
            <div className="flex-shrink-0 px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
                        <BookIcon className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Literary Translator</h1>
                        <p className="text-xs text-text-secondary">High-quality storytelling, poetry, and literary works</p>
                    </div>
                </div>
            </div>

            <div className="flex-shrink-0 px-4 py-3 bg-bg-surface/30">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="min-w-[140px]">
                        <LanguageSelector label="From" languages={LANGUAGES} value={sourceLang} onChange={setSourceLang} />
                    </div>
                    <div className="text-text-secondary">→</div>
                    <div className="min-w-[140px]">
                        <LanguageSelector label="To" languages={LANGUAGES} value={targetLang} onChange={setTargetLang} />
                    </div>
                    
                    <div className="min-w-[140px]">
                        <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider mb-1 block">Genre</label>
                        <select
                            value={genre}
                            onChange={(e) => setGenre(e.target.value)}
                            className="w-full bg-black/20 border border-white/5 rounded-md px-2 py-1.5 text-xs text-white focus:ring-1 focus:ring-accent outline-none"
                        >
                            {GENRES.map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleTranslate}
                        disabled={isTranslating || !sourceText.trim()}
                        className="ml-auto px-6 py-2 bg-accent text-bg-main font-bold rounded-xl hover:bg-white hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                        {isTranslating ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <TranslateIcon className="w-4 h-4" />
                        )}
                        <span className="text-xs">TRANSLATE</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex gap-4 p-4 min-h-0">
                <div className="flex-1 bg-bg-surface/40 border border-white/5 rounded-xl flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-white/5 bg-white/5">
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Source Text</span>
                    </div>
                    <textarea
                        value={sourceText}
                        onChange={(e) => setSourceText(e.target.value)}
                        placeholder="Enter your literary text here..."
                        className="flex-1 w-full p-5 bg-transparent resize-none focus:outline-none text-[14px] leading-relaxed text-text-primary placeholder:text-text-secondary/30 overflow-y-auto custom-scrollbar"
                    />
                </div>

                <div className="flex-1 bg-[#0c0c0c]/80 border border-white/5 rounded-xl flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-white/5 bg-black/40 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Translation</span>
                        {versions.length > 0 && (
                            <div className="flex gap-1">
                                {['literal', 'natural', 'artistic'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setActiveVersion(type as any)}
                                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                                            activeVersion === type
                                                ? 'bg-accent text-bg-main'
                                                : 'bg-white/10 text-text-secondary hover:bg-white/20'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                        {isTranslating && (
                            <div className="h-full flex items-center justify-center">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-[10px] font-bold text-accent uppercase tracking-widest animate-pulse">Crafting Literary Translation...</span>
                                </div>
                            </div>
                        )}

                        {!isTranslating && versions.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-text-secondary opacity-20">
                                <BookIcon className="w-12 h-12 mb-3" />
                                <p className="text-sm font-medium">Ready to translate</p>
                            </div>
                        )}

                        {activeTranslation && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="text-[15px] leading-relaxed text-white">
                                    <MarkdownRenderer content={activeTranslation.text} />
                                </div>

                                <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
                                    <h4 className="text-[9px] font-bold text-accent uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <InfoIcon className="w-3 h-3" /> Translator's Notes
                                    </h4>
                                    <div className="text-xs text-white/80 leading-relaxed">
                                        <MarkdownRenderer content={activeTranslation.notes} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiteraryTranslator;
