
import React, { useState, useEffect } from 'react';
import * as geminiService from '../../services/geminiService';
import type { TranslationResult } from '../types';
import { LANGUAGES } from '../../constants';
import LanguageSelector from './LanguageSelector';

interface DemoSectionProps {
    isLandingSection?: boolean;
}

const DemoSection: React.FC<DemoSectionProps> = ({ isLandingSection = false }) => {
    const [sourceText, setSourceText] = useState("A roaring lion kills no game.");
    const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [targetLang, setTargetLang] = useState('sw');

    // UI color theming based on context (landing vs in-app)
    const textPrimary = isLandingSection ? 'text-brand-text-primary' : 'text-text-primary';
    const textSecondary = isLandingSection ? 'text-brand-text-secondary' : 'text-text-secondary';
    const accentColor = isLandingSection ? 'brand-primary' : 'accent';
    const surfaceBg = isLandingSection ? 'bg-brand-surface' : 'bg-bg-surface';
    const mainBg = isLandingSection ? 'bg-brand-bg' : 'bg-bg-main';
    const buttonTextColor = isLandingSection ? 'text-brand-bg' : 'text-white';


    const handleTranslate = async () => {
        if (!sourceText) return;
        setIsLoading(true);
        setError(null);
        setTranslationResult(null);
        try {
            const result = await geminiService.getNuancedTranslation(sourceText, 'en', targetLang, 'Poetic');
            setTranslationResult(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <section id="demo" className={isLandingSection ? 'py-20 sm:py-24 bg-brand-surface' : ''}>
             <div className={isLandingSection ? 'container mx-auto px-4 sm:px-6 lg:px-8' : ''}>
                {isLandingSection && (
                    <div className="text-center max-w-3xl mx-auto">
                        <h2 className="text-3xl sm:text-4xl font-bold text-brand-text-primary">Experience It Yourself</h2>
                        <p className="mt-4 text-brand-text-secondary">Enter an English proverb to see our nuance engine in action. See how a literal translation compares to one that captures the true cultural meaning.</p>
                    </div>
                )}
                <div className={`mt-12 max-w-4xl mx-auto ${mainBg} p-6 sm:p-8 rounded-xl border border-${accentColor}/20`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={`text-sm font-semibold ${textSecondary} mb-2 block`}>English Proverb</label>
                            <textarea value={sourceText} onChange={e => setSourceText(e.target.value)} rows={3} className={`w-full p-3 ${surfaceBg} border border-${accentColor}/30 rounded-lg ${textPrimary} focus:ring-2 focus:ring-${accentColor} transition resize-none`}></textarea>
                        </div>
                        <div>
                            <LanguageSelector 
                                label="Translate To" 
                                languages={LANGUAGES} 
                                value={targetLang} 
                                onChange={setTargetLang} 
                            />
                        </div>
                    </div>
                    <div className="mt-6 text-center">
                        <button onClick={handleTranslate} disabled={isLoading} className={`px-8 py-3 bg-${accentColor} ${buttonTextColor} font-bold rounded-lg hover:bg-${accentColor}/90 disabled:opacity-50 disabled:cursor-wait transition-colors`}>
                            {isLoading ? 'Translating...' : 'Translate'}
                        </button>
                    </div>
                    {error && <p className="text-center text-red-400 mt-4">{error}</p>}
                    {translationResult && (
                        <div className={`mt-8 pt-6 border-t border-${accentColor}/20 animate-fade-in`}>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className={`font-semibold text-${accentColor}`}>Culturally-Aware Translation</h4>
                                    <p className={`mt-2 ${textPrimary} text-lg italic`}>"{translationResult.culturallyAwareTranslation}"</p>
                                </div>
                                <div className="text-sm">
                                    <h4 className={`font-semibold ${textSecondary}`}>Direct Translation</h4>
                                    <p className={`mt-1 ${textSecondary}/80 italic`}>"{translationResult.directTranslation}"</p>
                                    <h4 className={`font-semibold ${textSecondary} mt-3`}>Explanation</h4>
                                    <p className={`mt-1 ${textSecondary}/80`}>{translationResult.explanation}</p>
                                </div>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default DemoSection;
