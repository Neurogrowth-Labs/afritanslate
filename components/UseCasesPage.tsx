
import React from 'react';
import { BusinessIcon, MediaIcon, EducationIcon, HealthcareIcon, CheckIcon } from './Icons';

const UseCaseSection: React.FC<{ 
    title: string; 
    subtitle: string; 
    description: string; 
    points: string[]; 
    icon: React.ReactNode; 
    isReversed?: boolean;
    colorClass: string;
}> = ({ title, subtitle, description, points, icon, isReversed = false, colorClass }) => (
    <div className={`flex flex-col ${isReversed ? 'md:flex-row-reverse' : 'md:flex-row'} gap-10 items-center py-12 border-b border-white/5 last:border-0`}>
        <div className="flex-1 space-y-5">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${colorClass} bg-opacity-10 text-current mb-2`}>
                <div className={colorClass.replace('bg-', 'text-')}>{React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}</div>
            </div>
            <div>
                <h3 className="text-sm font-bold text-accent uppercase tracking-widest mb-2">{subtitle}</h3>
                <h2 className="text-3xl font-bold text-white">{title}</h2>
            </div>
            <p className="text-text-secondary text-lg leading-relaxed">
                {description}
            </p>
            <ul className="space-y-3 mt-4">
                {points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                        <CheckIcon className={`w-5 h-5 mt-0.5 ${colorClass.replace('bg-', 'text-')}`} />
                        <span className="text-white/90 text-sm">{point}</span>
                    </li>
                ))}
            </ul>
        </div>
        <div className="flex-1 w-full">
            <div className="aspect-video bg-bg-surface border border-border-default rounded-2xl p-8 flex items-center justify-center relative overflow-hidden group shadow-lg">
                <div className={`absolute inset-0 ${colorClass} bg-opacity-5 blur-3xl group-hover:bg-opacity-10 transition-all duration-500`}></div>
                <div className="relative z-10 text-center space-y-4 max-w-sm">
                    <div className="w-16 h-16 bg-bg-main rounded-full flex items-center justify-center mx-auto border border-white/10 shadow-xl">
                        {React.cloneElement(icon as React.ReactElement, { className: "w-8 h-8 opacity-60" })}
                    </div>
                    <div className="space-y-2">
                        <div className="h-2 bg-white/10 rounded-full w-3/4 mx-auto"></div>
                        <div className="h-2 bg-white/10 rounded-full w-1/2 mx-auto"></div>
                    </div>
                    <div className="pt-3">
                        <span className="text-xs font-mono text-text-secondary opacity-70">AI Simulation</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const UseCasesPage: React.FC = () => {
    return (
        <div className="animate-fade-in max-w-5xl mx-auto py-16 px-6">
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                    Solutions for Every Sector
                </h1>
                <p className="text-lg text-text-secondary max-w-3xl mx-auto leading-relaxed">
                    From Nollywood scriptwriters to pan-African bank executives, AfriTranslate AI adapts to the specific vocabulary and cultural expectations of your industry.
                </p>
            </div>
            
            <div className="space-y-6 bg-bg-surface/30 p-8 rounded-3xl border border-white/5 backdrop-blur-sm">
                <UseCaseSection 
                    title="Media & Entertainment"
                    subtitle="Creative Arts"
                    description="Storytelling relies on subtext. A literal translation of a joke or a culturally specific proverb can ruin a scene. We help scriptwriters and content creators retain the emotional core of their work across languages."
                    points={[
                        "Script localization preserving humor and idioms.",
                        "Character profile analysis for consistent voice.",
                        "Subtitle generation that fits reading speeds and cultural context."
                    ]}
                    icon={<MediaIcon />}
                    colorClass="text-purple-400 bg-purple-500"
                />

                <UseCaseSection 
                    title="Enterprise & Finance"
                    subtitle="Global Business"
                    description="Trust is the currency of business in Africa. Generic emails can sound cold or disrespectful. Our tools ensure your communications respect hierarchy, formality, and local business etiquette."
                    points={[
                        "Formal email adaptation for executives and government officials.",
                        "Real-time meeting summarization with decision tracking.",
                        "Marketing copy localization that resonates with local values."
                    ]}
                    icon={<BusinessIcon />}
                    isReversed
                    colorClass="text-blue-400 bg-blue-500"
                />

                <UseCaseSection 
                    title="Healthcare & NGOs"
                    subtitle="Social Impact"
                    description="In health and humanitarian work, clarity saves lives. We help organizations communicate critical information accurately, using terms that are familiar and non-threatening to local communities."
                    points={[
                        "Medical terminology simplification for patient understanding.",
                        "Culturally sensitive public health announcements.",
                        "Offline capabilities for remote field work."
                    ]}
                    icon={<HealthcareIcon />}
                    colorClass="text-green-400 bg-green-500"
                />

                <UseCaseSection 
                    title="Education & Research"
                    subtitle="Academic Access"
                    description="Knowledge should have no borders. We facilitate the translation of educational materials and research papers, making high-level academic concepts accessible in indigenous languages."
                    points={[
                        "Translating complex STEM concepts into local languages.",
                        "Facilitating cross-border academic collaboration.",
                        "Preserving oral histories and indigenous knowledge systems."
                    ]}
                    icon={<EducationIcon />}
                    isReversed
                    colorClass="text-yellow-400 bg-yellow-500"
                />
            </div>

            <div className="mt-16 bg-gradient-to-r from-accent/10 to-transparent rounded-2xl p-10 text-center border border-accent/20 relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold text-white mb-3">Ready to localize your impact?</h2>
                    <p className="text-base text-text-secondary max-w-xl mx-auto mb-8">Join the thousands of professionals using AfriTranslate to bridge the cultural gap.</p>
                    <button className="px-8 py-3 bg-accent text-bg-main text-sm font-bold rounded-xl hover:scale-105 transition-transform shadow-xl">
                        Get Started Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UseCasesPage;
