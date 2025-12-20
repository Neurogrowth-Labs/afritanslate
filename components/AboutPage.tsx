import React from 'react';
import { GlobeIcon, BoltIcon, DocIcon } from './Icons';

const AboutPage: React.FC<{ isLandingSection?: boolean }> = ({ isLandingSection = false }) => {
    const textPrimary = isLandingSection ? 'text-brand-text-primary' : 'text-text-primary';
    const textSecondary = isLandingSection ? 'text-brand-text-secondary' : 'text-text-secondary';
    const iconContainerBg = isLandingSection ? 'bg-brand-primary/10' : 'bg-accent/10';
    const iconColor = isLandingSection ? 'text-brand-primary' : 'text-accent';

    return (
        <div className={`animate-fade-in ${!isLandingSection ? 'max-w-4xl mx-auto py-8' : ''}`}>
            <div className="text-center">
                <h1 className={`text-4xl sm:text-5xl font-bold ${textPrimary}`}>
                    Translate Beyond Words.
                </h1>
                <p className={`mt-4 text-lg ${textSecondary} max-w-3xl mx-auto`}>
                    Our mission is to bridge cultural divides by providing translations that are not just accurate, but authentic. We believe true communication happens when you understand the culture behind the words.
                </p>
            </div>
            
            <div className={`mt-16 grid grid-cols-1 md:grid-cols-3 gap-10 text-center ${!isLandingSection ? 'bg-bg-surface p-8 rounded-xl border border-border-default' : ''}`}>
                <div className="animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className={`inline-flex items-center justify-center w-16 h-16 ${iconContainerBg} rounded-full ${iconColor} mb-4`}><GlobeIcon /></div>
                    <h3 className={`text-xl font-semibold ${textPrimary}`}>Cultural Nuance Engine</h3>
                    <p className={`mt-2 ${textSecondary}`}>Understands and applies local idioms, proverbs, and social etiquette for authentic interactions.</p>
                </div>
                <div className="animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
                    <div className={`inline-flex items-center justify-center w-16 h-16 ${iconContainerBg} rounded-full ${iconColor} mb-4`}><BoltIcon /></div>
                    <h3 className={`text-xl font-semibold ${textPrimary}`}>Real-Time & Accurate</h3>
                    <p className={`mt-2 ${textSecondary}`}>Get instant, reliable translations for conversations, documents, and creative content.</p>
                </div>
                <div className="animate-slide-in-up" style={{ animationDelay: '0.6s' }}>
                    <div className={`inline-flex items-center justify-center w-16 h-16 ${iconContainerBg} rounded-full ${iconColor} mb-4`}><DocIcon /></div>
                    <h3 className={`text-xl font-semibold ${textPrimary}`}>Multi-Format Support</h3>
                    <p className={`mt-2 ${textSecondary}`}>Translate text, voice, documents, and even live meetings with our versatile toolkit.</p>
                </div>
            </div>
            
            {!isLandingSection && (
                 <div className="mt-16 text-center">
                    <h2 className={`text-3xl font-bold ${textPrimary}`}>The Technology Behind the Translation</h2>
                    <p className={`mt-4 ${textSecondary} max-w-3xl mx-auto`}>
                        AfriTranslate AI is powered by state-of-the-art Large Language Models from Google. Our models are fine-tuned on vast, diverse datasets of African languages and cultural contexts. This allows our AI to go beyond literal, word-for-word translations to capture the true essence, tone, and intent of the original message, making every translation feel natural and respectful.
                    </p>
                </div>
            )}
        </div>
    );
};

export default AboutPage;
