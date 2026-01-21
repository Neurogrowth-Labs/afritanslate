
import React, { useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { ChatMessage, GroundingSource, LinguisticAnalysis } from '../types';
import { AttachmentIcon, VolumeUpIcon, GlobeIcon, MicrophoneIcon, PronunciationIcon, EditIcon, ThinkingIcon } from './Icons';

interface MessageProps {
  message: ChatMessage;
  isLoading?: boolean;
  isEditing?: boolean;
  onSetEditing?: (id: number | null) => void;
  onSaveEdit?: (id: number, newText: string) => void;
  onRegenerate?: (id: number) => void;
  onRate?: (id: number, rating: 'good' | 'bad') => void;
  onPlayTTS?: (text: string) => void;
  isOffline?: boolean;
}

const WifiOffIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18m-9-9v.01M4.879 4.879A12.034 12.034 0 0112 3c4.793 0 9.11 2.735 11.121 6.879M9.284 14.716a4.5 4.5 0 016.032-2.43M1.879 9.121A12.013 12.013 0 012.879 6.879m16.242 10.242a12.013 12.013 0 01-1.001 2.243m-2.242 1.001a11.96 11.96 0 01-13.04-13.04" />
    </svg>
);


// --- Culturally Inspired SVG Icons --- //
const CopyIcon = () => ( // Inspired by Adinkra "Ntesie" (knowledge and wisdom)
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75H18.5a1.125 1.125 0 011.125 1.125v9.75M9.75 3.75v13.5H3.375" />
    </svg>
);
const RegenerateIcon = () => ( // Inspired by Adinkra "Sankofa" (return and get it)
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-3.181-4.991v4.99" />
    </svg>
);
const ThumbsUpIcon = ({ filled }: { filled: boolean }) => ( // Gye Nyame (Supremacy of God) inspired
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${filled ? 'fill-current text-accent' : 'fill-none'}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.422 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M6.633 10.5v-1.86m0 1.86c-.43.032-.848.113-1.228.265A4.501 4.501 0 004.21 12H4.5c.828 0 1.5.672 1.5 1.5v3.75c0 .828-.672 1.5-1.5 1.5H2.25a.75.75 0 01-.75-.75v-6a.75.75 0 01.75-.75h2.25c.43 0 .848.113 1.228.265z" />
    </svg>
);
const ThumbsDownIcon = ({ filled }: { filled: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${filled ? 'fill-current text-text-secondary' : 'fill-none'}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.477 13.917c-.806 0-1.533.422-2.031 1.08a9.04 9.04 0 00-2.86 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 00-.322 1.672V21a.75.75 0 00.75.75c.75 0 1.5-.224 2.176-.642a4.5 4.5 0 001.28-.678 4.5 4.5 0 001.28.678c.676.418 1.426.642 2.176.642a.75.75 0 00.75-.75v-1.313c0-.693-.257-1.355-.723-1.848-.266-.558.107-1.282.725-1.282h3.126c1.026 0 1.945-.694 2.054-1.715.045-.422.068.85.068-1.285a11.95 11.95 0 00-2.649-7.521c-.388-.482-.987.729-1.605-.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M7.477 13.917v1.86m0-1.86c.43-.032.848-.113 1.228-.265A4.501 4.501 0 0110.79 12H11.25c.828 0 1.5-.672 1.5-1.5v-3.75c0-.828-.672-1.5-1.5-1.5H8.25a.75.75 0 00-.75.75v6c0 .414.336.75.75.75h2.25c.43 0 .848.113 1.228.265z" />
    </svg>
);

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const rawHtml = marked.parse(content, { gfm: true, breaks: true }) as string; 
    const sanitizedHtml = DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
    
    return (
        <div 
            className="prose"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
    );
};

const LinguisticInsights: React.FC<{ analysis: LinguisticAnalysis }> = ({ analysis }) => {
    if (!analysis) return null;
    return (
        <details className="group/linguistics mt-3 pt-3 border-t border-border-default/50">
            <summary className="text-xs font-semibold text-accent flex items-center gap-1.5 cursor-pointer hover:text-white list-none mb-2 transition-colors">
                <ThinkingIcon className="w-4 h-4" /> 
                <span>Deep Linguistic DNA</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 transition-transform group-open/linguistics:rotate-90 ml-auto">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
            </summary>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 animate-fade-in bg-black/20 p-3 rounded-lg border border-white/5">
                <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest border-b border-white/5 pb-1">Structural Features</h5>
                    {analysis.structural?.tonality && (
                        <div className="text-[11px] text-text-primary"><span className="text-accent font-bold">Tonality:</span> {analysis.structural.tonality}</div>
                    )}
                    {analysis.structural?.nounClasses && (
                        <div className="text-[11px] text-text-primary"><span className="text-accent font-bold">Class Systems:</span> {analysis.structural.nounClasses}</div>
                    )}
                    {analysis.structural?.phonetics && (
                        <div className="text-[11px] text-text-primary"><span className="text-accent font-bold">Phonetics:</span> {analysis.structural.phonetics}</div>
                    )}
                </div>
                <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest border-b border-white/5 pb-1">Sociolinguistic Context</h5>
                    {analysis.sociolinguistic?.intellectualization && (
                        <div className="text-[11px] text-text-primary"><span className="text-accent font-bold">Intellectualization:</span> {analysis.sociolinguistic.intellectualization}</div>
                    )}
                    {analysis.sociolinguistic?.translanguaging && (
                        <div className="text-[11px] text-text-primary"><span className="text-accent font-bold">Translanguaging:</span> {analysis.sociolinguistic.translanguaging}</div>
                    )}
                    {analysis.sociolinguistic?.culturalContext && (
                        <div className="text-[11px] text-text-primary"><span className="text-accent font-bold">Gaze:</span> {analysis.sociolinguistic.culturalContext}</div>
                    )}
                </div>
            </div>
        </details>
    );
};

const GroundingSources: React.FC<{ sources: GroundingSource[] }> = ({ sources }) => (
    <details className="group/sources mt-3 pt-3 border-t border-border-default/50">
        <summary className="text-xs font-semibold text-text-secondary flex items-center gap-1.5 cursor-pointer hover:text-white list-none mb-2 transition-colors">
            <GlobeIcon className="w-4 h-4" /> 
            <span>Sources ({sources.length})</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 transition-transform group-open/sources:rotate-90 ml-auto">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
        </summary>
        <div className="flex flex-col gap-2 mt-2 pl-1 animate-fade-in">
            {sources.map((source, index) => (
                <a 
                    href={source.uri} 
                    key={index}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex flex-col bg-bg-main/50 px-3 py-2 border border-border-default rounded-lg hover:border-accent/50 hover:bg-bg-main transition-all group/link"
                >
                    <span className="text-xs font-medium text-text-primary group-hover/link:text-accent truncate transition-colors">
                        {source.title || "Web Source"}
                    </span>
                    <span className="text-[10px] text-text-secondary truncate font-mono opacity-70">
                        {source.uri}
                    </span>
                </a>
            ))}
        </div>
    </details>
);

const UserMessage: React.FC<{ message: ChatMessage; isEditing: boolean; onSetEditing: (id: number | null) => void; onSaveEdit: (id: number, newText: string) => void }> = ({ message, isEditing, onSetEditing, onSaveEdit }) => {
    const [editText, setEditText] = useState(message.originalText);

    const handleSave = () => {
        onSaveEdit(message.id, editText);
        onSetEditing(null);
    }
    
    return (
        <div className="flex justify-end animate-fade-in">
            <div className="group relative max-w-xl">
                <div className="bg-accent text-white p-3 rounded-xl rounded-br-lg shadow-sm">
                    {isEditing ? (
                        <div>
                            <textarea 
                                value={editText} 
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full bg-accent/80 p-2 rounded-md focus:ring-2 focus:ring-white/50 outline-none text-sm"
                                rows={3}
                                autoFocus
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => onSetEditing(null)} className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30">Cancel</button>
                                <button onClick={handleSave} className="text-xs px-2 py-1 rounded bg-white text-accent font-semibold hover:bg-gray-200">Save</button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-base whitespace-pre-wrap">{message.originalText}</p>
                    )}
                    {message.attachments && message.attachments.length > 0 && (
                         <ul className="mt-2 pt-2 border-t border-white/20">
                            {message.attachments.map((file, index) => (
                                <li key={index} className="flex items-center gap-2 text-sm text-white/80">
                                    <AttachmentIcon className="w-4 h-4" />
                                    <span>{file.name}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                    {message.originalAudioFileName && (
                         <div className="mt-2 pt-2 border-t border-white/20 flex items-center gap-2 text-sm text-white/80">
                            <MicrophoneIcon className="w-4 h-4"/>
                            <span>Transcribed from: <em className="italic">{message.originalAudioFileName}</em></span>
                        </div>
                    )}
                </div>
                {!isEditing && (
                    <>
                        {/* Mobile actions */}
                        <div className="mt-1 flex justify-end md:hidden">
                            <button onClick={() => onSetEditing(message.id)} className="p-2 text-text-secondary hover:text-white bg-bg-surface rounded-full border border-border-default">
                                <EditIcon className="w-5 h-5"/>
                            </button>
                        </div>
                        {/* Desktop actions */}
                        <div className="absolute left-[-40px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex flex-col items-center gap-1">
                            <button onClick={() => onSetEditing(message.id)} className="p-2 text-text-secondary hover:text-white bg-bg-surface rounded-full border border-border-default" title="Edit">
                                <EditIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};


const AIMessage: React.FC<{ message: ChatMessage; onRegenerate: (id: number) => void; onRate: (id: number, rating: 'good' | 'bad') => void; onPlayTTS: (text: string) => void; isOffline?: boolean }> = ({ message, onRegenerate, onRate, onPlayTTS, isOffline = false }) => {
    const handleCopy = (text: string) => navigator.clipboard.writeText(text);
    
    const textToPlay = message.translation ? message.translation.culturallyAwareTranslation : message.originalText;

    return (
        <div className="flex justify-start animate-fade-in">
            <div className="group relative max-w-xl">
                 <div className="bg-bg-surface text-text-primary p-4 rounded-xl rounded-bl-lg shadow-sm border border-border-default">
                    {message.isOfflineTranslation && (
                        <div className="flex items-center gap-2 text-xs text-yellow-300 bg-yellow-900/50 px-2 py-1 rounded-md mb-3">
                            <WifiOffIcon className="w-4 h-4" />
                            <span>Basic Offline Translation</span>
                        </div>
                    )}
                    {message.translation ? (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-accent mb-1">Culturally-Aware Translation</h3>
                                <MarkdownRenderer content={message.translation.culturallyAwareTranslation} />
                                
                                {message.translation.pronunciation && (
                                    <div className="mt-3 pt-3 border-t border-border-default/50">
                                        <h4 className="text-xs font-semibold text-text-secondary mb-1 flex items-center gap-1.5">
                                            <PronunciationIcon className="w-4 h-4" />
                                            Pronunciation Guide
                                        </h4>
                                        <p className="text-sm text-text-primary font-mono tracking-wider">{message.translation.pronunciation}</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* NEW: Linguistic Deep Dive */}
                            {message.translation.linguisticAnalysis && (
                                <LinguisticInsights analysis={message.translation.linguisticAnalysis} />
                            )}

                            <details className="group/details">
                                <summary className="text-xs font-medium text-text-secondary cursor-pointer hover:text-white list-none flex items-center mt-3 pt-3 border-t border-border-default/50">
                                    View Translation Details
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 ml-1.5 transition-transform group-open/details:rotate-90">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                    </svg>
                                </summary>
                                <div className="mt-3 space-y-3 animate-fade-in">
                                    <div>
                                        <h4 className="text-sm font-semibold text-text-primary mb-1">Direct Translation</h4>
                                        <div className="text-sm text-text-secondary italic">
                                            <MarkdownRenderer content={message.translation.directTranslation} />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-text-primary mb-1">Explanation of Nuances</h4>
                                        <div className="text-sm text-text-secondary">
                                            <MarkdownRenderer content={message.translation.explanation} />
                                        </div>
                                    </div>
                                </div>
                            </details>
                        </div>
                    ) : (
                        <MarkdownRenderer content={message.originalText} />
                    )}
                    {message.imageURL && <img src={message.imageURL} alt="Generated content" className="mt-3 rounded-lg" />}
                    
                    {/* Display Grounding Sources if available */}
                    {message.groundingSources && message.groundingSources.length > 0 && (
                        <GroundingSources sources={message.groundingSources} />
                    )}

                    {/* --- Mobile Actions --- */}
                    <div className="mt-4 pt-4 border-t border-border-default/50 flex items-center justify-start gap-2 flex-wrap md:hidden">
                        <button onClick={() => handleCopy(textToPlay)} className="p-3 text-text-secondary hover:text-white bg-bg-main rounded-full border border-border-default" title="Copy"><CopyIcon /></button>
                        <button onClick={() => onRegenerate(message.id)} disabled={isOffline} className="p-3 text-text-secondary hover:text-white bg-bg-main rounded-full border border-border-default disabled:opacity-50 disabled:cursor-not-allowed" title={isOffline ? "Unavailable offline" : "Regenerate"}><RegenerateIcon /></button>
                        <button onClick={() => onPlayTTS(textToPlay)} disabled={isOffline} className="p-3 text-text-secondary hover:text-white bg-bg-main rounded-full border border-border-default disabled:opacity-50 disabled:cursor-not-allowed" title={isOffline ? "Unavailable offline" : "Listen"}><VolumeUpIcon className="w-5 h-5" /></button>
                        <div className="flex-grow"></div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-secondary">Feedback:</span>
                          <button onClick={() => onRate(message.id, 'good')} className={`p-3 rounded-full text-text-secondary hover:text-accent transition-colors ${message.rating === 'good' ? 'bg-accent/20 text-accent' : 'hover:bg-bg-main'}`} title="Good"><ThumbsUpIcon filled={message.rating === 'good'} /></button>
                          <button onClick={() => onRate(message.id, 'bad')} className={`p-3 rounded-full text-text-secondary hover:text-white transition-colors ${message.rating === 'bad' ? 'bg-border-default' : 'hover:bg-bg-main'}`} title="Bad"><ThumbsDownIcon filled={message.rating === 'bad'} /></button>
                        </div>
                    </div>
                </div>
                {/* --- Desktop Actions --- */}
                <div className="absolute right-[-16px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex">
                    <div className="flex flex-col items-center gap-1.5 bg-bg-surface p-2 rounded-lg border border-border-default shadow-lg">
                        <button onClick={() => handleCopy(textToPlay)} className="p-2.5 text-text-secondary hover:text-white bg-bg-surface rounded-md" title="Copy">
                            <CopyIcon />
                        </button>
                        <button onClick={() => onRegenerate(message.id)} disabled={isOffline} className="p-2.5 text-text-secondary hover:text-white bg-bg-surface rounded-md disabled:opacity-50 disabled:cursor-not-allowed" title={isOffline ? "Unavailable offline" : "Regenerate"}><RegenerateIcon /></button>
                         <button onClick={() => onPlayTTS(textToPlay)} disabled={isOffline} className="p-2.5 text-text-secondary hover:text-white bg-bg-surface rounded-md disabled:opacity-50 disabled:cursor-not-allowed" title={isOffline ? "Unavailable offline" : "Listen"}>
                            <VolumeUpIcon className="w-5 h-5" />
                        </button>
                        <div className="h-px w-4/5 bg-border-default my-1"></div>
                        <button onClick={() => onRate(message.id, 'good')} className="p-2.5 text-text-secondary hover:text-accent rounded-md" title="Good">
                            <ThumbsUpIcon filled={message.rating === 'good'} />
                        </button>
                        <button onClick={() => onRate(message.id, 'bad')} className="p-2.5 text-text-secondary hover:text-white rounded-md" title="Bad">
                            <ThumbsDownIcon filled={message.rating === 'bad'} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LoadingMessage: React.FC = () => {
  return (
    <div className="flex justify-start animate-fade-in">
        <div className="bg-bg-surface text-text-primary p-4 rounded-xl rounded-bl-lg shadow-sm border border-border-default flex flex-col gap-2 min-w-[180px]">
            <div className="flex items-center space-x-1.5">
                <span className="h-2 w-2 bg-accent rounded-full animate-pulse-warm [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 bg-accent rounded-full animate-pulse-warm [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 bg-accent rounded-full animate-pulse-warm"></span>
            </div>
            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.1em] animate-pulse">AfriTranslate is thinking...</p>
        </div>
    </div>
  );
};

// --- Main Message Component --- //
export const Message: React.FC<MessageProps> = ({
    message,
    isLoading = false,
    isEditing = false,
    onSetEditing = () => {},
    onSaveEdit = () => {},
    onRegenerate = () => {},
    onRate = () => {},
    onPlayTTS = () => {},
    isOffline = false,
}) => {
    if (isLoading) {
        return <LoadingMessage />;
    }

    if (message.role === 'user') {
        return <UserMessage message={message} isEditing={isEditing} onSetEditing={onSetEditing} onSaveEdit={onSaveEdit} />;
    }
    
    return <AIMessage message={message} onRegenerate={onRegenerate} onRate={onRate} onPlayTTS={onPlayTTS} isOffline={isOffline} />;
};