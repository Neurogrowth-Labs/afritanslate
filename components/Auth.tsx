
import React, { useState, useEffect, useRef } from 'react';
import type { User } from '../types';
import { UserIcon, EmailIcon, PasswordIcon, GoogleIcon, LogoIcon } from './Icons';

const Spinner = () => <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

const GREETINGS = [
    { lang: 'Swahili', text: 'Karibu!' },
    { lang: 'Twi', text: 'Akwaaba!' },
    { lang: 'Yoruba', text: 'Ẹ ku abọ!' },
    { lang: 'Hausa', text: 'Sannu da zuwa!' },
    { lang: 'Zulu', text: 'Sawubona!' },
];

interface AuthProps {
    onLogin: (email: string, pass: string) => Promise<boolean>;
    onSignUp: (name: string, email: string, pass: string) => Promise<boolean>;
    onGoogleLogin: () => Promise<void>;
    error: string | null;
    setError: (error: string | null) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onSignUp, onGoogleLogin, error, setError }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [greetingIndex, setGreetingIndex] = useState(0);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isAdminLogin, setIsAdminLogin] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setGreetingIndex(prevIndex => (prevIndex + 1) % GREETINGS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        setIsAdminLogin(isLoginView && email.toLowerCase() === 'admin@afritranslate.ai');
    }, [email, isLoginView]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        let success = false;
        if (isLoginView) {
            if (!email || !password) {
                setError("Email and password are required.");
                setIsLoading(false);
                return;
            }
            success = await onLogin(email, password);
        } else {
            if (!name || !email || !password) {
                setError("All fields are required for sign up.");
                setIsLoading(false);
                return;
            }
            // Logic handled in App.tsx handleSignUp to include metadata
            success = await onSignUp(name, email, password);
        }
        
        if (!success) {
            setIsLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setError(null);
        setIsLoading(true);
        try {
            await onGoogleLogin();
        } catch (err: any) {
            // Log for debugging but show friendly message
            console.error("Google Auth Error:", err);
            setError(err.message || "Unable to initiate Google Login. Please check configuration.");
            setIsLoading(false);
        }
    };

    const toggleView = () => {
        setIsLoginView(!isLoginView);
        setError(null);
        setName('');
        setEmail('');
        setPassword('');
        formRef.current?.reset();
    };
    
    const { lang, text } = GREETINGS[greetingIndex];

    const formContent = (isLogin: boolean) => {
        const showAdminUI = isLogin && isAdminLogin;

        return (
            <div className="w-1/2 flex-shrink-0 p-5 sm:p-6 flex flex-col justify-center h-full">
                <div className="text-center w-full">
                    <div className="flex justify-center mb-2 text-accent">
                        <LogoIcon className="w-12 h-12" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">{showAdminUI ? 'Admin Portal' : 'AfriTranslate AI'}</h1>
                     { showAdminUI ? (
                        <p className="text-text-primary h-10 flex flex-col items-center justify-center">
                            <span className="text-sm font-semibold text-amber-500 animate-fade-in">Administrator Access</span>
                        </p>
                    ) : (
                        <p className="text-text-secondary h-10 flex flex-col items-center justify-center">
                            <span className="text-lg font-semibold text-accent animate-fade-in leading-tight">{text}</span>
                            <span className="text-[9px] text-text-secondary animate-fade-in uppercase tracking-widest mt-0.5">{lang} Greeting</span>
                        </p>
                    )}
                </div>

                <form ref={formRef} onSubmit={handleSubmit} className="space-y-2.5 mt-4">
                    {!isLogin && (
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"><UserIcon className="w-3.5 h-3.5" /></span>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-9 p-2.5 bg-bg-main border border-border-default rounded-xl shadow-sm focus:ring-2 focus:ring-accent focus:border-accent transition text-text-primary placeholder-text-secondary/50 text-xs"
                                placeholder="Full Name"
                                required={!isLogin}
                            />
                        </div>
                    )}
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"><EmailIcon className="w-3.5 h-3.5" /></span>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-9 p-2.5 bg-bg-main border border-border-default rounded-xl shadow-sm focus:ring-2 focus:ring-accent focus:border-accent transition text-text-primary placeholder-text-secondary/50 text-xs"
                            placeholder="Email Address"
                            required
                        />
                    </div>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"><PasswordIcon className="w-3.5 h-3.5" /></span>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-9 p-2.5 bg-bg-main border border-border-default rounded-xl shadow-sm focus:ring-2 focus:ring-accent focus:border-accent transition text-text-primary placeholder-text-secondary/50 text-xs"
                            placeholder="Password"
                            required
                        />
                    </div>

                    {error && <p className="text-red-400 text-center text-[10px] font-medium animate-fade-in leading-tight">{error}</p>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-2.5 text-white font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center text-sm
                          ${showAdminUI 
                            ? 'bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-900/20' 
                            : 'bg-accent hover:bg-accent/90 shadow-lg shadow-accent/10'
                          }`
                        }
                    >
                        {isLoading ? <Spinner /> : (isLogin ? (showAdminUI ? 'Access Portal' : 'Log In') : 'Start 7-Day Premium Trial')}
                    </button>
                </form>

                 <div className="my-4 flex items-center">
                    <div className="flex-grow border-t border-border-default"></div>
                    <span className="flex-shrink mx-3 text-[9px] text-text-secondary font-bold uppercase">OR</span>
                    <div className="flex-grow border-t border-border-default"></div>
                </div>

                <div>
                    <button
                        onClick={handleGoogleAuth}
                        disabled={isLoading}
                        className="w-full py-2 bg-bg-main border border-border-default font-semibold rounded-xl transition-all flex items-center justify-center gap-2 hover:bg-border-default/50 disabled:opacity-50 text-text-primary text-[11px]"
                    >
                        <GoogleIcon className="w-3.5 h-3.5" />
                        Continue with Google
                    </button>
                </div>

                <p className="text-center text-[11px] text-text-secondary mt-5">
                    {isLogin ? "New to AfriTranslate?" : "Have an account?"}
                    <button onClick={toggleView} className="font-bold text-accent hover:underline ml-1">
                        {isLogin ? "Join now" : "Sign in"}
                    </button>
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-main text-text-primary p-4 overflow-y-auto">
            <div 
                className={`
                    w-full max-w-[360px] bg-bg-surface rounded-2xl shadow-2xl border border-border-default 
                    animate-fade-in overflow-hidden relative transition-all duration-300 my-auto
                    ${isAdminLogin ? 'ring-2 ring-amber-500 ring-offset-4 ring-offset-bg-main' : ''}
                `}
            >
                <div 
                    className="flex w-[200%] transition-transform duration-500 ease-in-out"
                    style={{ transform: isLoginView ? 'translateX(0%)' : 'translateX(-50%)' }}
                >
                   {formContent(true)}
                   {formContent(false)}
                </div>
            </div>
        </div>
    );
};
