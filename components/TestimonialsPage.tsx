
import React from 'react';
import { UsersIcon } from './Icons';

const TestimonialCard: React.FC<{ 
    quote: string; 
    name: string; 
    title: string; 
    initials: string;
    company?: string;
}> = ({ quote, name, title, initials, company }) => (
    <div className="bg-bg-surface/40 p-6 rounded-2xl border border-white/5 flex flex-col hover:border-white/10 transition-colors shadow-sm">
        <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center font-bold text-lg text-white border border-white/10 shadow-inner">
                {initials}
            </div>
            <div>
                <p className="font-bold text-white text-base">{name}</p>
                <p className="text-xs text-text-secondary uppercase tracking-wide font-medium">{title} {company && <span className="text-white/40">• {company}</span>}</p>
            </div>
        </div>
        <blockquote className="text-text-secondary text-base leading-relaxed italic flex-grow">"{quote}"</blockquote>
    </div>
);

const ImpactStory: React.FC = () => (
    <div className="bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10">
            <UsersIcon className="w-32 h-32 text-accent" />
        </div>
        <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent text-xs font-bold uppercase tracking-widest mb-4">
                Featured Impact
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">Preserving Oral History in Northern Nigeria</h3>
            <p className="text-base text-text-secondary leading-relaxed max-w-2xl mb-6">
                The "Voices of the Sahel" project used AfriTranslate AI to archive over 500 hours of elder stories. 
                Our nuance engine preserved the poetic structure of Hausa proverbs that standard translation would have erased.
            </p>
            <div className="flex gap-8">
                <div>
                    <p className="text-3xl font-black text-white">500+</p>
                    <p className="text-xs text-text-secondary uppercase tracking-wider font-bold mt-1">Hours Archived</p>
                </div>
                <div>
                    <p className="text-3xl font-black text-white">98%</p>
                    <p className="text-xs text-text-secondary uppercase tracking-wider font-bold mt-1">Cultural Accuracy</p>
                </div>
            </div>
        </div>
    </div>
);

const TestimonialsPage: React.FC = () => {
    const testimonials = [
        {
            quote: "A game-changer for our international marketing. The tone adjustment ensures our copy is always culturally appropriate, significantly improving engagement in Africa.",
            name: "Amara Koffi",
            title: "Marketing Director",
            company: "TechInnovate",
            initials: "AK"
        },
        {
            quote: "Translating my work used to feel like losing its soul. AfriTranslate's nuance engine helped adapt my book while preserving my voice and its emotional core.",
            name: "Femi Sowande",
            title: "Playwright",
            initials: "FS"
        },
        {
            quote: "This tool has been invaluable for our cross-continent collaborations. It ensures our academic findings are communicated accurately and respectfully.",
            name: "Dr. Chidi Okoro",
            title: "Lead Researcher",
            company: "Pan-African Inst.",
            initials: "CO"
        },
        {
            quote: "As a diaspora member, the idiom explanations have been an incredible tool for understanding the wisdom behind the words my elders use.",
            name: "Nneka Adebayo",
            title: "Cultural Enthusiast",
            initials: "NA"
        },
        {
            quote: "We reduced our localization costs by 40% while actually increasing the quality of our customer support responses in Swahili and Zulu.",
            name: "David Nkosi",
            title: "Head of Ops",
            company: "FinServe",
            initials: "DN"
        },
        {
            quote: "Finally, an AI that understands that 'respect' looks different in Lagos than it does in London. Indispensable for our diplomatic communications.",
            name: "Sarah Johnson",
            title: "NGO Coordinator",
            initials: "SJ"
        }
    ];

    return (
        <div className="animate-fade-in max-w-5xl mx-auto py-16 px-6">
             <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    Trusted by Global Voices
                </h1>
                <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
                    From enterprise executives to cultural archivists, see how AfriTranslate is bridging the gap between language and meaning.
                </p>
            </div>

            <div className="mb-12">
                <ImpactStory />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((testimonial, index) => (
                    <TestimonialCard key={index} {...testimonial} />
                ))}
            </div>

            <div className="mt-16 text-center border-t border-white/5 pt-10">
                <p className="text-sm text-text-secondary mb-5">Have a story to share?</p>
                <a 
                    href="mailto:info@afritranslate.co.za"
                    className="inline-block px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold rounded-xl transition-all hover:scale-105"
                >
                    Submit Your Review
                </a>
            </div>
        </div>
    );
};

export default TestimonialsPage;
