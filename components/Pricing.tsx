import React from 'react';
import { AFRITRANSLATE_MODELS, ADD_ONS } from '../constants';
import { CheckIcon } from './Icons';
import type { UserPlan } from '../types';

interface PricingProps {
    onChoosePlan: (planName: string) => void;
    onContactSales: () => void;
    currentUserPlan: UserPlan;
}

const Pricing: React.FC<PricingProps> = ({ onChoosePlan, onContactSales, currentUserPlan }) => {
    const subscriptionModels = AFRITRANSLATE_MODELS.filter(m => m.name !== 'Free');
    const enterpriseModel = subscriptionModels.find(m => m.name === 'Entreprise');
    const standardModels = subscriptionModels.filter(m => m.name !== 'Entreprise');

    return (
        <div className="animate-fade-in text-text-primary">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-text-primary">Flexible Plans for Every Need</h1>
                <p className="text-lg text-text-secondary mt-4 max-w-2xl mx-auto">
                    Choose the plan that's right for you and unlock the full power of culturally aware translation.
                </p>
            </div>

            {/* Pricing Tiers */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                {standardModels.map((model) => {
                    const isCurrentPlan = model.name === currentUserPlan;
                    return (
                        <div 
                            key={model.name} 
                            className={`bg-bg-surface p-8 rounded-xl border flex flex-col relative transition-all duration-300 ${
                                model.isFeatured && !isCurrentPlan
                                ? 'border-accent ring-2 ring-accent' 
                                : 'border-border-default'
                            } ${isCurrentPlan ? 'border-accent' : 'hover:border-accent/70 hover:-translate-y-1'}`}
                        >
                            {model.isFeatured && !isCurrentPlan && (
                                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">Most Popular</div>
                            )}
                             {isCurrentPlan && (
                                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-border-default text-text-primary text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">Current Plan</div>
                            )}
                            <h3 className="text-2xl font-semibold text-white">{model.name}</h3>
                            <p className="text-4xl font-bold my-4 text-white">{model.price}<span className="text-base font-normal text-text-secondary"></span></p>
                            <p className="text-text-secondary text-sm mb-6 min-h-[40px]">
                                {
                                    model.name === 'Basic' ? 'For casual users and language learners.' :
                                    model.name === 'Premium' ? 'For professionals and frequent users.' :
                                    'For teams and small organizations.'
                                }
                            </p>
                            <ul className="space-y-3 text-text-primary text-sm mb-8 flex-grow">
                                {model.features?.map(feature => (
                                    <li key={feature} className="flex items-start gap-3">
                                        <CheckIcon className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <button 
                                onClick={() => onChoosePlan(model.name)}
                                disabled={isCurrentPlan}
                                className={`w-full mt-auto py-3 font-semibold rounded-lg transition-colors ${
                                isCurrentPlan
                                ? 'bg-bg-main text-text-secondary cursor-default'
                                : model.isFeatured 
                                ? 'bg-accent text-white hover:bg-accent/90' 
                                : 'bg-border-default text-white hover:bg-accent'
                            }`}>
                                {isCurrentPlan ? 'Your Plan' : `Choose ${model.name}`}
                            </button>
                        </div>
                    );
                })}
            </div>
            
            {/* Enterprise Card */}
            {enterpriseModel && (
                 <div className={`mt-8 bg-bg-surface p-8 rounded-xl border  flex flex-col md:flex-row items-center gap-8 ${currentUserPlan === 'Entreprise' ? 'border-accent' : 'border-border-default'}`}>
                    {currentUserPlan === 'Entreprise' && (
                        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-border-default text-text-primary text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">Current Plan</div>
                    )}
                    <div className="flex-grow text-center md:text-left">
                        <h3 className="text-2xl font-semibold text-white">{enterpriseModel.name}</h3>
                        <p className="text-text-secondary mt-2 max-w-xl">
                            Tailored solutions for large-scale deployments, with API access, custom models, and dedicated support.
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                         <button 
                            onClick={onContactSales}
                             disabled={currentUserPlan === 'Entreprise'}
                            className="px-8 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:bg-border-default disabled:text-text-secondary disabled:cursor-default">
                            {currentUserPlan === 'Entreprise' ? 'Your Plan' : 'Contact Sales'}
                        </button>
                    </div>
                </div>
            )}

            {/* Add-ons Section */}
            <div className="mt-24">
                <h2 className="text-3xl font-bold text-white text-center mb-12">Power-up with Add-ons</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {ADD_ONS.map(addon => (
                        <div key={addon.name} className="bg-bg-surface p-6 rounded-xl border border-border-default">
                             <div className="flex items-center gap-4 mb-4">
                                <div className="bg-bg-main p-3 rounded-lg flex-shrink-0">
                                    <addon.icon className="w-6 h-6 text-accent" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white text-lg">{addon.name}</h4>
                                    <p className="text-sm text-text-primary">{addon.price}</p>
                                </div>
                            </div>
                            <ul className="space-y-2 text-text-secondary text-sm">
                                {addon.features?.map(feature => (
                                     <li key={feature} className="flex items-start gap-3">
                                        <span className="text-accent mt-1.5">&#8226;</span>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* How it works Section */}
            <div className="mt-24">
                <h2 className="text-base font-semibold text-center text-accent uppercase tracking-wider mb-2">How It Works</h2>
                <h3 className="text-3xl font-bold text-center text-text-primary mb-12">Get Nuanced Translations in 3 Simple Steps</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-5xl mx-auto">
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-bg-surface rounded-full flex items-center justify-center border-2 border-border-default mb-4 text-accent font-bold text-2xl">1</div>
                        <h4 className="text-xl font-semibold text-white mb-2">Write Your Text</h4>
                        <p className="text-base text-text-secondary">Enter the word, phrase, or document you want to translate.</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-bg-surface rounded-full flex items-center justify-center border-2 border-border-default mb-4 text-accent font-bold text-2xl">2</div>
                        <h4 className="text-xl font-semibold text-white mb-2">Set the Context</h4>
                        <p className="text-base text-text-secondary">Choose your source and target languages, and select a tone—from formal to friendly.</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-bg-surface rounded-full flex items-center justify-center border-2 border-border-default mb-4 text-accent font-bold text-2xl">3</div>
                        <h4 className="text-xl font-semibold text-white mb-2">Receive Nuanced Translation</h4>
                        <p className="text-base text-text-secondary">Get a culturally aware translation, a direct one, and a detailed explanation of the nuances.</p>
                    </div>
                </div>
            </div>

            {/* Testimonials Section */}
            <div className="mt-24">
                <h2 className="text-3xl font-semibold text-center text-text-primary mb-12">Trusted by Users Worldwide</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    <div className="bg-bg-surface p-8 rounded-xl border border-border-default">
                        <blockquote className="text-lg text-text-primary italic leading-relaxed">"AfriTranslate AI is a game-changer for our international business. The tone adjustment feature ensures our marketing copy is always culturally appropriate, which has significantly improved our engagement with local partners in Africa."</blockquote>
                        <div className="flex items-center mt-6">
                            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center font-bold text-white">AK</div>
                            <div className="ml-4">
                                <p className="font-semibold text-white">Amara Koffi</p>
                                <p className="text-sm text-text-secondary">Marketing Director, TechInnovate</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-bg-surface p-8 rounded-xl border border-border-default">
                        <blockquote className="text-lg text-text-primary italic leading-relaxed">"As a second-generation diaspora member, I've struggled to connect with my heritage. AfriTranslate AI's idiom explanations have been an incredible learning tool, helping me understand the wisdom behind the words my elders use."</blockquote>
                        <div className="flex items-center mt-6">
                            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center font-bold text-white">FS</div>
                            <div className="ml-4">
                                <p className="font-semibold text-white">Femi Sowande</p>
                                <p className="text-sm text-text-secondary">Cultural Enthusiast</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-24 max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
                <div className="space-y-4">
                    <details className="bg-bg-surface p-4 rounded-lg border border-border-default group">
                        <summary className="font-semibold text-white cursor-pointer list-none flex justify-between items-center">
                            Can I change my plan later?
                            <span className="text-accent transform transition-transform group-open:rotate-45">+</span>
                        </summary>
                        <p className="text-text-secondary mt-2 pt-2 border-t border-border-default">
                            Absolutely! You can upgrade or downgrade your plan at any time from your account settings. Prorated charges or credits will be applied automatically.
                        </p>
                    </details>
                    <details className="bg-bg-surface p-4 rounded-lg border border-border-default group">
                        <summary className="font-semibold text-white cursor-pointer list-none flex justify-between items-center">
                            What payment methods do you accept?
                             <span className="text-accent transform transition-transform group-open:rotate-45">+</span>
                        </summary>
                        <p className="text-text-secondary mt-2 pt-2 border-t border-border-default">
                            We accept all major credit cards, including Visa, Mastercard, and American Express. For Enterprise plans, we also support invoicing and bank transfers.
                        </p>
                    </details>
                    <details className="bg-bg-surface p-4 rounded-lg border border-border-default group">
                        <summary className="font-semibold text-white cursor-pointer list-none flex justify-between items-center">
                            Can I cancel my subscription anytime?
                             <span className="text-accent transform transition-transform group-open:rotate-45">+</span>
                        </summary>
                        <p className="text-text-secondary mt-2 pt-2 border-t border-border-default">
                            Yes, you can cancel your subscription at any time. You will retain access to your plan's features until the end of your current billing cycle.
                        </p>
                    </details>
                </div>
            </div>

        </div>
    );
};

export default Pricing;