import React, { useState } from 'react';
import { analyzeEmail, localizeEmail, EmailAnalysisResult } from '../../services/geminiService';
import { EmailIcon, CheckIcon, TranslateIcon } from './Icons';

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75H18.5a1.125 1.125 0 011.125 1.125v9.75M9.75 3.75v13.5H3.375" />
    </svg>
);

const TARGET_CULTURES = [
  'Kenya Corporate', 'Nigeria Business', 
  'South Africa Professional', 'Ghana Formal',
  'Ethiopia Government', 'Egypt Corporate',
  'Pan-African General'
];

const EmailTranslator: React.FC = () => {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [targetCulture, setTargetCulture] = useState(TARGET_CULTURES[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState<EmailAnalysisResult | null>(null);
    const [localized, setLocalized] = useState<{ localizedSubject: string; localizedBody: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleAnalyze = async () => {
        if (!body.trim()) {
            setError("Email body is required.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const result = await analyzeEmail(body, targetCulture);
            setAnalysis(result);
            setLocalized(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Analysis failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLocalize = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await localizeEmail(subject, body, targetCulture);
            setLocalized(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Localization failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (!localized) return;
        navigator.clipboard.writeText(`Subject: ${localized.localizedSubject}\n\n${localized.localizedBody}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getScoreColor = (score: number) => {
        if (score < 40) return 'bg-red-500';
        if (score < 70) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <div className="flex flex-col h-full animate-fade-in p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto overflow-hidden">
            <div className="flex-shrink-0 text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Email Localization</h1>
                <p className="text-text-secondary">Bridge cultural etiquette gaps in your global communication.</p>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0 overflow-hidden">
                {/* LEFT PANEL: Email Compose */}
                <div className="flex flex-col min-h-0 bg-bg-surface p-6 rounded-2xl border border-border-default shadow-xl">
                    <h2 className="text-sm font-black text-white uppercase tracking-widest mb-4">Email Compose</h2>
                    <div className="space-y-4 flex-1 flex flex-col min-h-0">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Subject Line</label>
                            <input 
                                type="text" 
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                className="w-full p-2.5 bg-bg-main border border-border-default rounded-xl focus:ring-1 focus:ring-accent outline-none text-[13px] text-white"
                                placeholder="Enter subject..."
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Target Culture</label>
                            <select 
                                value={targetCulture}
                                onChange={e => setTargetCulture(e.target.value)}
                                className="w-full p-2.5 bg-bg-main border border-border-default rounded-xl focus:ring-1 focus:ring-accent outline-none text-[13px] text-white"
                            >
                                {TARGET_CULTURES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="flex-1 min-h-0 space-y-1 flex flex-col">
                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Email Body</label>
                            <textarea 
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                placeholder="Write your email draft here..."
                                className="flex-1 w-full p-3 bg-bg-main border border-border-default rounded-xl focus:ring-1 focus:ring-accent outline-none text-[13px] text-white resize-none custom-scrollbar"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button 
                                onClick={handleAnalyze}
                                disabled={isLoading || !body.trim()}
                                className="flex-1 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all disabled:opacity-50"
                            >
                                🔍 Analyze
                            </button>
                            <button 
                                onClick={handleLocalize}
                                disabled={isLoading || !body.trim()}
                                className="flex-1 py-3 bg-accent text-bg-main font-black rounded-xl hover:scale-[1.01] transition-all disabled:opacity-50"
                            >
                                ✨ Localize Email
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: Intelligence */}
                <div className="flex flex-col min-h-0 bg-bg-surface p-6 rounded-2xl border border-border-default shadow-xl overflow-y-auto custom-scrollbar">
                    <h2 className="text-sm font-black text-white uppercase tracking-widest mb-4">Localization Intelligence</h2>
                    
                    {!analysis && !localized && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-text-secondary opacity-50">
                            <EmailIcon className="w-12 h-12 mb-4" />
                            <p className="text-sm">Write your email and click Analyze to see cultural insights</p>
                        </div>
                    )}

                    {analysis && !localized && (
                        <div className="animate-fade-in space-y-6">
                            {/* Politeness Meter */}
                            <div className="p-4 bg-bg-main/50 rounded-xl border border-border-default">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-text-secondary uppercase">Politeness Score</span>
                                    <span className="text-sm font-black text-white">{analysis.politeness_score}/100</span>
                                </div>
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${getScoreColor(analysis.politeness_score)}`}
                                        style={{ width: `${analysis.politeness_score}%` }}
                                    />
                                </div>
                            </div>

                            {/* Tone Assessment */}
                            <div>
                                <h3 className="text-[10px] font-bold text-text-secondary uppercase mb-2">Tone Assessment</h3>
                                <p className="text-sm text-text-primary p-3 bg-bg-main/50 rounded-xl border border-border-default leading-relaxed">
                                    {analysis.tone_assessment}
                                </p>
                            </div>

                            {/* Cultural Warnings */}
                            {analysis.cultural_warnings.length > 0 && (
                                <div>
                                    <h3 className="text-[10px] font-bold text-text-secondary uppercase mb-2">Cultural Warnings</h3>
                                    <div className="space-y-3">
                                        {analysis.cultural_warnings.map((w, i) => (
                                            <div key={i} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                                <p className="text-xs font-bold text-red-400 mb-1">⚠️ '{w.phrase}'</p>
                                                <p className="text-xs text-text-secondary mb-2">{w.issue}</p>
                                                <p className="text-xs text-white bg-red-500/10 p-2 rounded-lg"><span className="font-bold">💡 Suggestion:</span> {w.suggestion}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recommendations */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-[10px] font-bold text-text-secondary uppercase mb-2">Greeting Recommendation</h3>
                                    <p className="text-xs text-text-primary bg-accent/5 p-3 rounded-xl border border-accent/20">
                                        Consider starting with: <span className="italic font-medium">{analysis.greeting_recommendation}</span>
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-bold text-text-secondary uppercase mb-2">Signature Recommendation</h3>
                                    <p className="text-xs text-text-primary bg-accent/5 p-3 rounded-xl border border-accent/20">
                                        Professional signature format: <span className="italic font-medium">{analysis.signature_recommendation}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {localized && (
                        <div className="animate-fade-in space-y-6">
                            <h2 className="text-sm font-black text-accent uppercase tracking-widest border-b border-white/10 pb-2">Comparison & Localized Version</h2>
                            <div className="space-y-4">
                                <div className="p-3 bg-bg-main/30 rounded-xl border border-border-default opacity-60">
                                    <p className="text-[9px] font-bold text-text-secondary uppercase mb-1">Original Body</p>
                                    <p className="text-[11px] truncate">{body}</p>
                                </div>
                                <div className="p-4 bg-bg-main rounded-xl border border-accent/30 space-y-3">
                                    <p className="text-[10px] font-bold text-accent uppercase">Localized Subject</p>
                                    <p className="text-sm font-bold text-white">{localized.localizedSubject}</p>
                                    <div className="h-px bg-white/5" />
                                    <p className="text-[10px] font-bold text-accent uppercase">Localized Body</p>
                                    <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                                        {localized.localizedBody}
                                    </p>
                                </div>
                                <button 
                                    onClick={handleCopy}
                                    className="w-full py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                >
                                    {copied ? <CheckIcon className="w-4 h-4 text-accent" /> : <CopyIcon />}
                                    {copied ? 'Copied!' : 'Copy Localized Email'}
                                </button>
                                <button onClick={() => setLocalized(null)} className="w-full text-xs text-text-secondary hover:text-white underline">
                                    Back to Analysis
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {error && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center rounded-xl">{error}</div>}
        </div>
    );
};

export default EmailTranslator;