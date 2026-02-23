import React from 'react';
import DemoSection from './DemoSection';

const DemoPage: React.FC = () => {
    return (
        <div className="animate-fade-in max-w-5xl mx-auto py-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl font-bold text-text-primary">
                    Interactive Demo
                </h1>
                <p className="mt-4 text-lg text-text-secondary max-w-3xl mx-auto">
                    Experience our nuance engine in action. Enter an English proverb to see how a literal translation compares to one that captures the true cultural meaning.
                </p>
            </div>
            <DemoSection />
        </div>
    );
};

export default DemoPage;
