import React from 'react';

const TestimonialsPage: React.FC = () => {
    const testimonials = [
        {
            quote: "A game-changer for our international marketing. The tone adjustment ensures our copy is always culturally appropriate, significantly improving engagement in Africa.",
            name: "Amara Koffi",
            title: "Marketing Director, TechInnovate",
            initials: "AK"
        },
        {
            quote: "Translating my work used to feel like losing its soul. AfriTranslate's nuance engine helped adapt my book while preserving my voice and its emotional core.",
            name: "Femi Sowande",
            title: "Author & Playwright",
            initials: "FS"
        },
        {
            quote: "This tool has been invaluable for our cross-continent collaborations. It ensures our academic findings are communicated accurately and respectfully.",
            name: "Dr. Chidi Okoro",
            title: "Lead Researcher, Pan-African Institute",
            initials: "CO"
        },
        {
            quote: "As a diaspora member, the idiom explanations have been an incredible tool for understanding the wisdom behind the words my elders use.",
            name: "Nneka Adebayo",
            title: "Cultural Enthusiast",
            initials: "NA"
        }
    ];

    return (
        <div className="animate-fade-in max-w-5xl mx-auto py-8">
             <div className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl font-bold text-text-primary">
                    Loved by Global Communicators
                </h1>
                <p className="mt-4 text-lg text-text-secondary max-w-3xl mx-auto">
                    Hear from users who are transforming the way they connect across cultures.
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {testimonials.map((testimonial, index) => (
                    <div key={index} className="bg-bg-surface p-8 rounded-xl border border-border-default flex flex-col">
                        <blockquote className="text-text-primary italic text-lg flex-grow">"{testimonial.quote}"</blockquote>
                        <div className="flex items-center mt-6 pt-6 border-t border-border-default">
                            <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                                {testimonial.initials}
                            </div>
                            <div className="ml-4">
                                <p className="font-semibold text-white">{testimonial.name}</p>
                                <p className="text-sm text-text-secondary">{testimonial.title}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TestimonialsPage;