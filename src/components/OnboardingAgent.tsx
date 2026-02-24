import React, { useState, useEffect, useRef } from 'react';
import type { User } from '../types';
import { supabase } from '../../supabaseClient';
import { GoogleGenAI } from "@google/genai";
import { SendIcon, LogoIcon } from './Icons';

interface OnboardingAgentProps {
    user: User;
    onComplete: (updatedUser: User) => void;
}

const OnboardingAgent: React.FC<OnboardingAgentProps> = ({ user, onComplete }) => {
    const [messages, setMessages] = useState<{ role: 'ai' | 'user', text: string }[]>([
        { role: 'ai', text: `Jambo, ${user.name}! I'm your AfriTranslate Cultural Guide. I'm here to help you set up your professional profile so I can provide the most relevant linguistic nuances for your work. To start, what is your primary profession?` }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [step, setStep] = useState(0);
    const [data, setData] = useState({ profession: '', interests: '', goals: '' });
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!inputValue.trim() || isTyping) return;

        const userMsg = inputValue.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInputValue('');
        setIsTyping(true);

        // Simulation of AI thinking and responding based on step
        setTimeout(async () => {
            let nextAiMsg = "";
            let nextStep = step;
            let nextData = { ...data };

            try {
                if (step === 0) {
                    nextData.profession = userMsg;
                    nextAiMsg = "Excellent! Understanding your professional context helps me adapt formal versus informal tones correctly. Next, what specific African regions, cultures, or languages are you most interested in or working with?";
                    nextStep = 1;
                } else if (step === 1) {
                    nextData.interests = userMsg;
                    nextAiMsg = "Those are rich cultural areas! Finally, what is your main goal with AfriTranslate AI? Are you translating scripts, localizing marketing copy, or something else entirely?";
                    nextStep = 2;
                } else if (step === 2) {
                    nextData.goals = userMsg;
                    nextAiMsg = "Fantastic! I've captured everything. Your profile is now optimized for cultural intelligence. Click below to enter the Studio!";
                    nextStep = 3;
                    
                    // Final update to Supabase
                    const { error } = await supabase
                        .from('profiles')
                        .update({ 
                            profession: nextData.profession,
                            interests: nextData.interests,
                            goals: nextData.goals,
                            onboarding_completed: true 
                        })
                        .eq('id', user.id);
                    
                    if (error) {
                        console.error("Error updating onboarding:", error.message || error);
                        // We still allow user to continue locally but warn them
                        nextAiMsg = "I've captured your details locally, though I had a small sync issue with our servers. Let's head to the Studio anyway!";
                    }
                }

                setMessages(prev => [...prev, { role: 'ai', text: nextAiMsg }]);
                setStep(nextStep);
                setData(nextData);
            } catch (err: any) {
                console.error("Critical onboarding error:", err.message || err);
                setMessages(prev => [...prev, { role: 'ai', text: "Forgive me, I had a small glitch in my neural network. Could you repeat that?" }]);
            } finally {
                setIsTyping(false);
            }
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-50 bg-bg-main flex flex-col md:flex-row items-stretch overflow-hidden animate-fade-in">
            {/* Visual Side Panel */}
            <div className="hidden md:flex w-1/3 bg-bg-surface border-r border-border-default p-12 flex-col justify-center items-center text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(244,163,0,0.1),transparent)]"></div>
                <div className="relative z-10 space-y-8">
                    <div className="w-24 h-24 bg-accent/20 rounded-3xl rotate-12 flex items-center justify-center mx-auto border-2 border-accent shadow-2xl">
                        <LogoIcon />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-3xl font-brand font-bold text-white tracking-tight">Cultural Intelligence<br/><span className="text-accent">Activated.</span></h1>
                        <p className="text-text-secondary text-base leading-relaxed">Let's fine-tune your AI agent to understand your professional voice and cultural goals.</p>
                    </div>
                    <div className="pt-8 flex justify-center gap-3">
                        {[0, 1, 2].map(i => (
                            <div key={i} className={`h-1.5 w-8 rounded-full transition-all duration-500 ${step >= i ? 'bg-accent shadow-[0_0_10px_rgba(244,163,0,0.5)]' : 'bg-border-default'}`}></div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chat Agent Panel */}
            <div className="flex-1 flex flex-col h-full relative">
                <header className="h-16 border-b border-border-default flex items-center px-6 bg-bg-surface/50 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                            <span className="text-bg-main font-bold">AI</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white leading-none">AfriTranslate Onboarding</p>
                            <p className="text-[10px] text-accent uppercase font-bold tracking-widest mt-1 animate-pulse">Personalizing Agent...</p>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 custom-scrollbar pb-32">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in-up`}>
                            <div className={`p-4 rounded-2xl max-w-lg shadow-xl border leading-relaxed ${m.role === 'user' ? 'bg-accent text-bg-main font-semibold rounded-tr-none border-accent' : 'bg-bg-surface text-text-primary rounded-tl-none border-border-default'}`}>
                                {m.text}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start animate-fade-in">
                            <div className="bg-bg-surface p-4 rounded-2xl rounded-tl-none border border-border-default flex gap-1.5">
                                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </main>

                <footer className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 bg-gradient-to-t from-bg-main via-bg-main to-transparent">
                    {step === 3 ? (
                        <button 
                            onClick={() => onComplete({ ...user, profession: data.profession, interests: data.interests, goals: data.goals, onboarding_completed: true })}
                            className="w-full py-4 bg-accent text-bg-main font-black text-lg rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl animate-bounce"
                        >
                            ENTER TRANSLATION STUDIO
                        </button>
                    ) : (
                        <div className="relative max-w-3xl mx-auto shadow-2xl">
                            <input 
                                type="text" 
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                                placeholder="Share your thoughts here..."
                                className="w-full p-5 pr-16 bg-bg-surface border-2 border-border-default rounded-2xl focus:border-accent outline-none text-text-primary transition-all placeholder:text-text-secondary/50"
                            />
                            <button 
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isTyping}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-accent text-bg-main rounded-xl hover:bg-accent/90 disabled:opacity-50 transition-all"
                            >
                                <SendIcon className="w-6 h-6" />
                            </button>
                        </div>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default OnboardingAgent;