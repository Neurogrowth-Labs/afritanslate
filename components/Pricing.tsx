
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
        <div className="animate-fade-in text-text-primary max-w-4xl mx-auto py-2">
            <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Account & Billing</h1>
                <p className="text-sm text-text-secondary mt-1 max-w-lg mx-auto">
                    Manage your subscription and billing details.
                </p>
            </div>

            {/* Pricing Tiers */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                {standardModels.map((model) => {
                    const isCurrentPlan = model.name === currentUserPlan;
                    return (
                        <div 
                            key={model.name} 
                            className={`bg-bg-surface p-5 rounded-lg border flex flex-col relative transition-all duration-300 ${
                                model.isFeatured && !isCurrentPlan
                                ? 'border-accent ring-1 ring-accent' 
                                : 'border-border-default'
                            } ${isCurrentPlan ? 'border-accent bg-accent/5' : 'hover:border-accent/70 hover:-translate-y-0.5'}`}
                        >
                            {model.isFeatured && !isCurrentPlan && (
                                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">Popular</div>
                            )}
                             {isCurrentPlan && (
                                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-border-default text-text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">Current</div>
                            )}
                            <h3 className="text-lg font-semibold text-white">{model.name}</h3>
                            <p className="text-2xl font-bold my-2 text-white">{model.price}</p>
                            <p className="text-text-secondary text-xs mb-4 min-h-[32px] leading-tight">
                                {
                                    model.name === 'Basic' ? 'For casual users.' :
                                    model.name === 'Premium' ? 'For professionals.' :
                                    'For small teams.'
                                }
                            </p>
                            <ul className="space-y-2 text-text-primary text-xs mb-6 flex-grow">
                                {model.features?.map(feature => (
                                    <li key={feature} className="flex items-start gap-2">
                                        <CheckIcon className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <button 
                                onClick={() => onChoosePlan(model.name)}
                                disabled={isCurrentPlan}
                                className={`w-full mt-auto py-2 text-xs font-bold rounded transition-colors ${
                                isCurrentPlan
                                ? 'bg-bg-main text-text-secondary cursor-default border border-border-default'
                                : model.isFeatured 
                                ? 'bg-accent text-white hover:bg-accent/90' 
                                : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                            }`}>
                                {isCurrentPlan ? 'Active Plan' : 'Select Plan'}
                            </button>
                        </div>
                    );
                })}
            </div>
            
            {/* Enterprise Card */}
            {enterpriseModel && (
                 <div className={`mt-4 bg-bg-surface p-4 rounded-lg border flex flex-col md:flex-row items-center gap-4 ${currentUserPlan === 'Entreprise' ? 'border-accent bg-accent/5' : 'border-border-default'}`}>
                    <div className="flex-grow text-center md:text-left">
                        <h3 className="text-lg font-semibold text-white">{enterpriseModel.name}</h3>
                        <p className="text-text-secondary text-xs mt-1">
                            Custom solutions with API access and dedicated support.
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                         <button 
                            onClick={onContactSales}
                             disabled={currentUserPlan === 'Entreprise'}
                            className="px-4 py-2 bg-white/5 border border-white/10 text-white text-xs font-bold rounded hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-default">
                            {currentUserPlan === 'Entreprise' ? 'Active' : 'Contact Sales'}
                        </button>
                    </div>
                </div>
            )}

            {/* Add-ons Section */}
            <div className="mt-8 pt-8 border-t border-border-default">
                <h2 className="text-lg font-bold text-white mb-4">Add-ons</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {ADD_ONS.map(addon => (
                        <div key={addon.name} className="bg-bg-surface p-3 rounded-lg border border-border-default flex gap-3 hover:border-accent/50 transition-colors">
                             <div className="bg-bg-main p-2 rounded-md h-fit flex-shrink-0">
                                <addon.icon className="w-4 h-4 text-accent" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-white text-xs">{addon.name}</h4>
                                <p className="text-xs text-accent font-bold mt-0.5">{addon.price}</p>
                                <p className="text-[10px] text-text-secondary mt-1 leading-tight">{addon.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-8 pt-8 border-t border-border-default">
                <h2 className="text-lg font-bold text-white mb-4">FAQ</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-bg-surface p-3 rounded-lg border border-border-default">
                        <h4 className="text-xs font-bold text-white mb-1">Change plan later?</h4>
                        <p className="text-[11px] text-text-secondary">Yes, upgrade or downgrade anytime. Prorated charges apply.</p>
                    </div>
                    <div className="bg-bg-surface p-3 rounded-lg border border-border-default">
                        <h4 className="text-xs font-bold text-white mb-1">Cancel anytime?</h4>
                        <p className="text-[11px] text-text-secondary">Yes, cancel anytime. Access remains until billing cycle ends.</p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Pricing;
