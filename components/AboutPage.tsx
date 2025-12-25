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
                    We bridge cultural divides with translations that are not just accurate, but authentic. True communication begins with cultural understanding.
                </p>
            </div>
            
            <div className={`mt-16 grid grid-cols-1 md:grid-cols-3 gap-10 text-center ${!isLandingSection ? 'bg-bg-surface p-8 rounded-xl border border-border-default' : ''}`}>
                <div className="animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className={`inline-flex items-center justify-center w-16 h-16 ${iconContainerBg} rounded-full ${iconColor} mb-4`}><GlobeIcon /></div>
                    <h3 className={`text-xl font-semibold ${textPrimary}`}>Cultural Nuance Engine</h3>
                    <p className={`mt-2 ${textSecondary}`}>Applies local idioms, proverbs, and social etiquette for truly authentic interactions.</p>
                </div>
                <div className="animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
                    <div className={`inline-flex items-center justify-center w-16 h-16 ${iconContainerBg} rounded-full ${iconColor} mb-4`}><BoltIcon /></div>
                    <h3 className={`text-xl font-semibold ${textPrimary}`}>Real-Time & Accurate</h3>
                    <p className={`mt-2 ${textSecondary}`}>Instant, reliable translations for conversations, documents, and creative projects.</p>
                </div>
                <div className="animate-slide-in-up" style={{ animationDelay: '0.6s' }}>
                    <div className={`inline-flex items-center justify-center w-16 h-16 ${iconContainerBg} rounded-full ${iconColor} mb-4`}><DocIcon /></div>
                    <h3 className={`text-xl font-semibold ${textPrimary}`}>Multi-Format Support</h3>
                    <p className={`mt-2 ${textSecondary}`}>Translate text, voice, documents, and live meetings with one versatile toolkit.</p>
                </div>
            </div>
            
            {!isLandingSection && (
                 <div className="mt-16 text-center">
                    <h2 className={`text-3xl font-bold ${textPrimary}`}>The Technology Behind the Translation</h2>
                    <p className={`mt-4 ${textSecondary} max-w-3xl mx-auto`}>
                        Powered by Google's state-of-the-art AI, our models are fine-tuned on diverse African languages and cultural contexts. This allows us to capture the true essence of your message, making every translation feel natural and respectful.
                    </p>
                </div>
            )}
        </div>
    );
};

export default AboutPage;