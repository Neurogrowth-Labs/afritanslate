
import React from 'react';
import { UsersIcon } from './Icons';
import DemoSection from './DemoSection';

const TestimonialCard: React.FC<{ 
    quote: string; 
    name: string; 
    title: string; 
    initials: string;
    company?: string;
    avatarUrl: string;
}> = ({ quote, name, title, initials, company, avatarUrl }) => (
    <div className="bg-bg-surface/40 p-6 rounded-2xl border border-white/5 flex flex-col hover:border-white/10 transition-colors shadow-sm relative overflow-hidden group">
        <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-full border border-white/10 shadow-inner overflow-hidden">
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            </div>
            <div>
                <p className="font-bold text-white text-base">{name}</p>
                <p className="text-xs text-text-secondary uppercase tracking-wide font-medium">{title} {company && <span className="text-white/40">• {company}</span>}</p>
            </div>
        </div>
        <blockquote className="text-text-secondary text-base leading-relaxed italic flex-grow relative z-10">"{quote}"</blockquote>
        <div className="absolute -bottom-4 -right-4 text-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21L14.017 18C14.017 16.896 14.321 15.293 14.922 13.916C15.524 12.541 16.592 11.085 18.127 9.549L17.29 8.283C16.326 9.487 15.602 10.372 15.117 10.939C14.633 11.506 14.325 12.029 14.194 12.508C13.886 11.233 13.12 10.151 11.895 9.261C10.671 8.371 9.227 7.926 7.564 7.926C6.069 7.926 4.793 8.452 3.737 9.503C2.68 10.554 2.152 11.82 2.152 13.3C2.152 14.921 2.658 16.337 3.669 17.549C4.68 18.761 6.002 19.367 7.635 19.367C8.691 19.367 9.638 19.123 10.476 18.635C11.314 18.147 11.837 17.575 12.045 16.92L14.017 21ZM19.264 19.367C20.32 19.367 21.267 19.123 22.105 18.635C22.943 18.147 23.466 17.575 23.674 16.92L25.646 21L25.646 18C25.646 16.896 25.95 15.293 26.551 13.916C27.153 12.541 28.221 11.085 29.756 9.549L28.919 8.283C27.955 9.487 27.231 10.372 26.746 10.939C26.262 11.506 25.954 12.029 25.823 12.508C25.515 11.233 24.749 10.151 23.524 9.261C22.3 8.371 20.856 7.926 19.193 7.926C17.698 7.926 16.422 8.452 15.366 9.503C14.309 10.554 13.781 11.82 13.781 13.3C13.781 14.921 14.287 16.337 15.298 17.549C16.309 18.761 17.631 19.367 19.264 19.367Z" /></svg>
        </div>
    </div>
);

const ImpactStory: React.FC = () => (
    <div className="relative overflow-hidden rounded-2xl border border-accent/20">
        <img 
            src="https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=1200&q=80" 
            alt="Oral History Preservation" 
            className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-main via-bg-main/90 to-transparent"></div>
        
        <div className="relative z-10 p-8">
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
    </div>
);

const TestimonialsPage: React.FC = () => {
    const testimonials = [
        {
            quote: "AfriTranslate's nuance engine allows our subtitles to capture the humor and emotion of our originals, driving deeper engagement across the continent.",
            name: "Zola Mbeki",
            title: "Director of Content",
            company: "Netflix Africa",
            initials: "ZM",
            avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80"
        },
        {
            quote: "We've seen a 30% reduction in support ticket resolution time by using the real-time dialect adaptation for our regional call centers.",
            name: "Kwame Osei",
            title: "Head of Customer Exp.",
            company: "MTN Group",
            initials: "KO",
            avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80"
        },
        {
            quote: "A breakthrough for academic collaboration. We can now translate complex research papers into Xhosa and Zulu without losing scientific precision.",
            name: "Prof. Thabo Molefe",
            title: "Dept. of Linguistics",
            company: "University of Cape Town",
            initials: "TM",
            avatarUrl: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&w=200&q=80"
        },
        {
            quote: "Trust is built on language. AfriTranslate ensures our financial advisory services resonate with clients in their mother tongue, respecting every cultural nuance.",
            name: "Lindiwe Dlamini",
            title: "Chief Operating Officer",
            company: "Standard Bank",
            initials: "LD",
            avatarUrl: "https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?auto=format&fit=crop&w=200&q=80"
        },
        {
            quote: "Our scripts retain their authentic Nigerian voice even when translated for global Francophone audiences. It's essential for our storytelling.",
            name: "Chioma Okeke",
            title: "Senior Script Editor",
            company: "EbonyLife Media",
            initials: "CO",
            avatarUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80"
        },
        {
            quote: "The accuracy in low-resource languages is unmatched. It's helping us make information universally accessible in true local context.",
            name: "David Kalu",
            title: "Localization Lead",
            company: "Google Africa",
            initials: "DK",
            avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {testimonials.map((testimonial, index) => (
                    <TestimonialCard key={index} {...testimonial} />
                ))}
            </div>

            <div className="pt-8 border-t border-white/5">
                <h2 className="text-3xl font-bold text-center text-white mb-8">Experience the Difference</h2>
                <DemoSection />
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
