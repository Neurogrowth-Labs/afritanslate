import React, { useState } from 'react';
import { ADD_ONS } from '../../constants';
import type { UserPlan } from '../types';

interface PricingProps {
    onChoosePlan: (planName: string) => void;
    onContactSales: () => void;
    currentUserPlan: UserPlan;
}

        price: '$7.99/month',
        accent: 'purple',
        icon: ShieldIcon,
        badge: 'MOST POPULAR',
    },
];

const accentClasses = {
];

const addonAccents = ['bg-blue-500/15 text-blue-300', 'bg-purple-500/15 text-purple-300', 'bg-orange-500/15 text-orange-300'];

const Pricing: React.FC<PricingProps> = ({ onChoosePlan, onContactSales, currentUserPlan }) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    return (
        <div className="animate-fade-in text-text-primary max-w-7xl mx-auto py-8 px-4 sm:px-6">
            <div className="text-center mb-8">
                </p>
                <div className="mt-6 inline-flex items-center rounded-full border border-white/10 bg-bg-surface p-1 shadow-2xl shadow-black/20">
                    <button onClick={() => setBillingCycle('monthly')} className={`px-5 py-2 text-sm font-bold rounded-full transition-all ${billingCycle === 'monthly' ? 'bg-white text-black' : 'text-text-secondary hover:text-white'}`}>Monthly</button>
                    <button onClick={() => setBillingCycle('yearly')} className={`px-5 py-2 text-sm font-bold rounded-full transition-all ${billingCycle === 'yearly' ? 'bg-white text-black' : 'text-text-secondary hover:text-white'}`}>Yearly</button>
                    <span className="hidden sm:inline-flex ml-2 px-3 py-1 text-xs font-bold text-emerald-300 bg-emerald-500/10 rounded-full">Save up to 20%</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
                {plans.map(plan => {
                    const Icon = plan.icon;
                    const isCurrentPlan = plan.name === currentUserPlan;
                    const isEnterprise = plan.name === 'Entreprise';
                    const styles = accentClasses[plan.accent as keyof typeof accentClasses];
                    return (
                            <p className="mt-2 text-sm text-text-secondary min-h-[40px]">{plan.subtitle}</p>
                            <p className="mt-5 text-3xl font-black text-white">{plan.price}</p>
                            <ul className="mt-6 space-y-3 flex-grow">
                                {plan.features.map(feature => <li key={feature} className="flex items-start gap-3 text-sm text-text-primary"><CheckIcon className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" /><span>{feature}</span></li>)}
                            </ul>
                                {isCurrentPlan ? 'Active Plan' : isEnterprise ? 'Contact Sales' : `Select ${plan.name}`}
                            </button>
                        </article>
                    );
                })}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 rounded-3xl border border-white/10 bg-bg-surface/70 p-4">
        </div>
    );
};

export default Pricing;
