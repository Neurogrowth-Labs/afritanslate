import React, { useState, useEffect, useRef } from 'react';
import type { User } from '../types';
import { UserIcon, EmailIcon, PasswordIcon } from './Icons';

const LogoIcon = () => (
    <div className="w-16 h-16 rounded-full bg-bg-main flex-shrink-0 flex items-center justify-center mb-4 border-2 border-border-default">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-accent">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 18 15.3 15.3 0 0 1-8 0 15.3 15.3 0 0 1 4-18z"></path>
        </svg>
    </div>
);

const Spinner = () => <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

const GREETINGS = [
    { lang: 'Swahili', text: 'Karibu!' },
    { lang: 'Twi', text: 'Akwaaba!' },
    { lang: 'Yoruba', text: 'Ẹ ku abọ!' },
    { lang: 'Hausa', text: 'Sannu da zuwa!' },
    { lang: 'Zulu', text: 'Sawubona!' },
];

interface AuthProps {
    onLogin: (email: string, pass: string) => boolean;
    onSignUp: (name: string, email: string, pass: string) => boolean;
    error: string | null;
    setError: (error: string | null) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onSignUp, error, setError }) => {
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

        // Simulate network delay for better UX
        await new Promise(res => setTimeout(res, 500)); 

        let success = false;
        if (isLoginView) {
            if (!email || !password) {
                setError("Email and password are required.");
                setIsLoading(false);
                return;
            }
            success = onLogin(email, password);
        } else {
            if (!name || !email || !password) {
                setError("All fields are required for sign up.");
                setIsLoading(false);
                return;
            }
            success = onSignUp(name, email, password);
        }
        
        if (!success) {
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
            <div className="w-1/2 flex-shrink-0 p-8 flex flex-col justify-center">
                <div className="text-center w-full">
                    <div className="flex justify-center">
                        <LogoIcon />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">{showAdminUI ? 'Admin Portal' : 'AfriTranslate AI'}</h1>
                     { showAdminUI ? (
                        <p className="text-text-primary h-12 flex flex-col items-center justify-center">
                            <span className="text-lg font-semibold text-amber-500 animate-fade-in">Administrator Access</span>
                        </p>
                    ) : (
                        <p className="text-text-secondary h-12 flex flex-col items-center justify-center">
                            <span className="text-2xl font-semibold text-accent animate-fade-in">{text}</span>
                            <span className="text-xs text-text-secondary animate-fade-in">A {lang} Greeting</span>
                        </p>
                    )}
                </div>

                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mt-8">
                    {!isLogin && (
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"><UserIcon /></span>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-10 p-3 bg-bg-main border border-border-default rounded-lg shadow-sm focus:ring-2 focus:ring-accent focus:border-accent transition text-text-primary placeholder-text-secondary"
                                placeholder="Full Name"
                                required={!isLogin}
                            />
                        </div>
                    )}
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"><EmailIcon /></span>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 p-3 bg-bg-main border border-border-default rounded-lg shadow-sm focus:ring-2 focus:ring-accent focus:border-accent transition text-text-primary placeholder-text-secondary"
                            placeholder="Email Address"
                            required
                        />
                    </div>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"><PasswordIcon /></span>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 p-3 bg-bg-main border border-border-default rounded-lg shadow-sm focus:ring-2 focus:ring-accent focus:border-accent transition text-text-primary placeholder-text-secondary"
                            placeholder="Password"
                            required
                        />
                    </div>

                    {error && <p className="text-red-400 text-center text-sm font-medium animate-fade-in">{error}</p>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3 text-white font-semibold rounded-lg transition-colors flex items-center justify-center
                          ${showAdminUI 
                            ? 'bg-amber-600 hover:bg-amber-700 disabled:bg-amber-600/50' 
                            : 'bg-accent hover:bg-accent/90 disabled:bg-accent/50'
                          }`
                        }
                    >
                        {isLoading ? <Spinner /> : (isLogin ? (showAdminUI ? 'Access Portal' : 'Log In') : 'Create Account')}
                    </button>
                </form>

                <p className="text-center text-sm text-text-secondary mt-6">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button onClick={toggleView} className="font-semibold text-accent hover:underline ml-1">
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-main text-text-primary p-4">
            <div 
                className={`
                    w-full max-w-md bg-bg-surface rounded-2xl shadow-2xl border border-border-default 
                    animate-fade-in overflow-hidden relative transition-all duration-300
                    ${isAdminLogin ? 'ring-2 ring-amber-500 ring-offset-4 ring-offset-bg-main' : ''}
                `}
            >
                <div 
                    className="flex w-[200%] transition-transform duration-700 ease-in-out"
                    style={{ transform: isLoginView ? 'translateX(0%)' : 'translateX(-50%)' }}
                >
                   {formContent(true)}
                   {formContent(false)}
                </div>
            </div>
        </div>
    );
};
