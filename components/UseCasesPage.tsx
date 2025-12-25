import React from 'react';
import { BusinessIcon, MediaIcon, EducationIcon, HealthcareIcon } from './Icons';

const UseCasesPage: React.FC = () => {
    const useCases = [
        {
            title: "Business & Marketing",
            icon: BusinessIcon,
            description: "Craft resonant marketing campaigns and translate business documents with the right cultural tone to build trust and close deals."
        },
        {
            title: "Media & Creatives",
            icon: MediaIcon,
            description: "Translate scripts, novels, and subtitles while preserving artistic intent. Our AI acts as a cultural consultant to ensure your work connects authentically."
        },
        {
            title: "Education & Research",
            icon: EducationIcon,
            description: "Make educational materials accessible across linguistic barriers. Accurately translate academic papers and research to facilitate global collaboration."
        },
        {
            title: "Healthcare & NGOs",
            icon: HealthcareIcon,
            description: "Communicate vital health information with clarity and respect. Translate patient instructions and outreach materials with the required empathy for sensitive interactions."
        }
    ];

    return (
        <div className="animate-fade-in max-w-5xl mx-auto py-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl font-bold text-text-primary">
                    For Every Conversation
                </h1>
                <p className="mt-4 text-lg text-text-secondary max-w-3xl mx-auto">
                    AfriTranslate AI empowers professionals across industries to communicate effectively and build stronger global relationships.
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {useCases.map((useCase, index) => (
                    <div key={index} className="bg-bg-surface p-8 rounded-xl border border-border-default flex flex-col items-center text-center hover:border-accent transition-colors hover:-translate-y-1">
                        <div className="bg-accent/10 p-4 rounded-full mb-4">
                            <useCase.icon className="w-10 h-10 text-accent" />
                        </div>
                        <h3 className="text-2xl font-semibold text-white mb-2">{useCase.title}</h3>
                        <p className="text-text-secondary">{useCase.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UseCasesPage;