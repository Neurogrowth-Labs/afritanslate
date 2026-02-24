
import React, { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import * as geminiService from '../services/geminiService';
import { SparklesIcon, SendIcon, CloseIcon, MinimizeIcon, MaximizeIcon } from './Icons';

interface AIAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    contextText?: string;
    sourceLang?: string;
    targetLang?: string;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface QuickAction {
    label: string;
    prompt: string;
    icon: string;
}

const QUICK_ACTIONS: QuickAction[] = [
    { label: 'Rewrite', prompt: 'Rewrite this text to be more natural', icon: '✍️' },
    { label: 'Simplify', prompt: 'Simplify this text for easier understanding', icon: '📝' },
    { label: 'Localize', prompt: 'Localize this for African market', icon: '🌍' },
    { label: 'Formalize', prompt: 'Make this more formal and professional', icon: '👔' },
    { label: 'Youth Tone', prompt: 'Rewrite this for youth audience', icon: '🎯' },
    { label: 'Etiquette Check', prompt: 'Check cultural etiquette and suggest improvements', icon: '🤝' }
];

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const rawHtml = marked.parse(content, { gfm: true, breaks: true }) as string;
    const sanitizedHtml = DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
    return (
        <div 
            className="prose prose-invert prose-sm max-w-none text-[13px]"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
    );
};

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, contextText, sourceLang, targetLang }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "👋 I'm your African cultural consultant. How can I help you today?\n\nI can:\n- Localize campaigns for specific African markets\n- Adjust tone and formality\n- Check cultural etiquette\n- Generate speeches and proposals\n- Provide cross-border communication advice",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (customPrompt?: string) => {
        const messageText = customPrompt || input.trim();
        if (!messageText || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: messageText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            let fullPrompt = messageText;
            if (contextText) {
                fullPrompt = `Context Text: "${contextText}"\n\nUser Request: ${messageText}`;
            }
            if (sourceLang && targetLang) {
                fullPrompt += `\n\nLanguage Context: From ${sourceLang} to ${targetLang}`;
            }

            const response = await geminiService.getAIAssistantResponse(fullPrompt);

            const assistantMessage: Message = {
                role: 'assistant',
                content: response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: Message = {
                role: 'assistant',
                content: '❌ Sorry, I encountered an error. Please try again.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickAction = (action: QuickAction) => {
        handleSend(action.prompt);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col bg-bg-surface border border-accent/30 rounded-2xl shadow-2xl shadow-accent/20 animate-slide-in-up"
             style={{ 
                 width: isMinimized ? '320px' : '420px', 
                 height: isMinimized ? '60px' : '600px',
                 maxHeight: '90vh'
             }}>
            
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-accent/10 to-transparent">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                        <SparklesIcon className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">AI Cultural Copilot</h3>
                        <p className="text-[10px] text-text-secondary">Your African localization expert</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="text-text-secondary hover:text-white transition-colors"
                    >
                        <MinimizeIcon className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={onClose}
                        className="text-text-secondary hover:text-white transition-colors"
                    >
                        <CloseIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/20">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-xl p-3 ${
                                    msg.role === 'user' 
                                        ? 'bg-accent text-bg-main' 
                                        : 'bg-white/5 border border-white/10 text-white'
                                }`}>
                                    {msg.role === 'assistant' ? (
                                        <MarkdownRenderer content={msg.content} />
                                    ) : (
                                        <p className="text-sm">{msg.content}</p>
                                    )}
                                    <div className={`text-[9px] mt-1 ${msg.role === 'user' ? 'text-bg-main/60' : 'text-text-secondary'}`}>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                                        <div className="w-2 h-2 bg-accent rounded-full animate-pulse delay-100"></div>
                                        <div className="w-2 h-2 bg-accent rounded-full animate-pulse delay-200"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-3 border-t border-white/10">
                        <div className="flex flex-wrap gap-2 mb-3">
                            {QUICK_ACTIONS.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleQuickAction(action)}
                                    disabled={isLoading}
                                    className="px-2 py-1 bg-white/5 hover:bg-accent/20 border border-white/10 hover:border-accent/30 rounded-lg text-[10px] font-bold text-text-secondary hover:text-accent transition-all disabled:opacity-50"
                                >
                                    <span className="mr-1">{action.icon}</span>
                                    {action.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask me anything about localization..."
                                className="flex-1 bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-text-secondary/50 focus:ring-1 focus:ring-accent outline-none resize-none"
                                rows={2}
                                disabled={isLoading}
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={isLoading || !input.trim()}
                                className="px-4 bg-accent text-bg-main rounded-xl hover:bg-white hover:text-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                <SendIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AIAssistant;
