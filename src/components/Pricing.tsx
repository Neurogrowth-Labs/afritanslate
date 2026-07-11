import React, { useState } from 'react';
import { ADD_ONS } from '../../constants';
import { BankIcon, BoltIcon, CheckIcon, IndustryIcon, LockIcon, OfflineIcon, ShieldIcon, VoiceIcon } from './Icons';
import type { UserPlan } from '../types';

interface PricingProps {
    onChoosePlan: (planName: string) => void;
    onContactSales: () => void;
    currentUserPlan: UserPlan;
}

const plans = [
    {
        name: 'Basic',
        subtitle: 'Perfect for getting started',
        price: '$2.99/month',
        accent: 'blue',
        icon: BoltIcon,
        features: ['1,000 translations', 'African languages', 'Text-only', 'Standard support'],
    },
    {
        name: 'Premium',
        subtitle: 'For power users and creators',
        price: '$7.99/month',
        accent: 'purple',
        icon: ShieldIcon,
        badge: 'MOST POPULAR',
        features: ['Unlimited translations', 'Dialects', 'Voice translation', 'Offline mode', 'Priority support'],
    },
    {
        name: 'Training',
        subtitle: 'Collaboration for teams',
        price: '$12.99/month',
        accent: 'green',
        icon: VoiceIcon,
        features: ['Up to 10 users', 'WhatsApp integration', 'Team dashboard', 'Priority support'],
    },
    {
        name: 'Entreprise',
        subtitle: 'Custom scale and governance',
        price: 'Custom',
        accent: 'orange',
        icon: BankIcon,
        features: ['Dedicated manager', 'AI models', 'SLA', 'API', 'Integrations'],
    },
];

const accentClasses = {
    blue: { icon: 'bg-blue-500/15 text-blue-300 border-blue-400/20', button: 'bg-blue-500 hover:bg-blue-400 text-white', ring: 'hover:border-blue-300/60' },
    purple: { icon: 'bg-purple-500/15 text-purple-300 border-purple-400/20', button: 'bg-purple-500 hover:bg-purple-400 text-white', ring: 'border-purple-400/70 ring-2 ring-purple-500/20' },
    green: { icon: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20', button: 'bg-emerald-500 hover:bg-emerald-400 text-white', ring: 'hover:border-emerald-300/60' },
    orange: { icon: 'bg-orange-500/15 text-orange-300 border-orange-400/20', button: 'bg-orange-500 hover:bg-orange-400 text-white', ring: 'hover:border-orange-300/60' },
};

const trustItems = [
    { icon: ShieldIcon, title: 'Secure Payments', description: 'Encrypted checkout and bank-grade payment handling.' },
    { icon: LockIcon, title: 'Cancel Anytime', description: 'Manage or cancel your plan from account settings.' },
    { icon: CheckIcon, title: '7-Day Guarantee', description: 'Try premium translation workflows with confidence.' },
];

const addonAccents = ['bg-blue-500/15 text-blue-300', 'bg-purple-500/15 text-purple-300', 'bg-orange-500/15 text-orange-300'];

const Pricing: React.FC<PricingProps> = ({ onChoosePlan, onContactSales, currentUserPlan }) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    return (
        <div className="animate-fade-in text-text-primary max-w-7xl mx-auto py-8 px-4 sm:px-6">
            <div className="text-center mb-8">
                <p className="text-xs font-bold tracking-[0.28em] uppercase text-accent mb-3">Pricing Page</p>
                <h1 className="text-3xl md:text-5xl font-black text-white">Choose the perfect plan for you</h1>
                <p className="text-base text-text-secondary mt-4 max-w-2xl mx-auto">
                    Unlock powerful AI translation, African language coverage, and premium collaboration tools.
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
                        <article key={plan.name} className={`relative bg-bg-surface/90 p-6 rounded-2xl border border-white/10 flex flex-col min-h-[460px] transition-all duration-300 hover:-translate-y-1 ${styles.ring} ${isCurrentPlan ? 'border-white bg-white/5' : ''}`}>
                            {plan.badge && <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-purple-500 text-white text-[10px] font-black tracking-widest">{plan.badge}</div>}
                            {isCurrentPlan && <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-white text-black text-[10px] font-black tracking-widest">CURRENT</div>}
                            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${styles.icon}`}><Icon className="w-6 h-6" /></div>
                            <h2 className="mt-5 text-2xl font-black text-white">{plan.name === 'Entreprise' ? 'Enterprise' : plan.name}</h2>
                            <p className="mt-2 text-sm text-text-secondary min-h-[40px]">{plan.subtitle}</p>
                            <p className="mt-5 text-3xl font-black text-white">{plan.price}</p>
                            <ul className="mt-6 space-y-3 flex-grow">
                                {plan.features.map(feature => <li key={feature} className="flex items-start gap-3 text-sm text-text-primary"><CheckIcon className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" /><span>{feature}</span></li>)}
                            </ul>
                            <button onClick={() => isEnterprise ? onContactSales() : onChoosePlan(plan.name)} disabled={isCurrentPlan} className={`mt-8 w-full py-3 rounded-full text-sm font-black transition-all disabled:opacity-60 disabled:cursor-default ${isCurrentPlan ? 'bg-bg-main text-text-secondary border border-white/10' : styles.button}`}>
                                {isCurrentPlan ? 'Active Plan' : isEnterprise ? 'Contact Sales' : `Select ${plan.name}`}
                            </button>
                        </article>
                    );
                })}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 rounded-3xl border border-white/10 bg-bg-surface/70 p-4">
                {trustItems.map(item => <div key={item.title} className="flex items-center gap-4 p-4"><div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-300 flex items-center justify-center"><item.icon className="w-5 h-5" /></div><div><h3 className="font-bold text-white">{item.title}</h3><p className="text-xs text-text-secondary mt-1">{item.description}</p></div></div>)}
            </div>

            <section className="mt-8 rounded-3xl border border-white/10 bg-bg-surface/70 p-6 md:p-8">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-5"><h2 className="text-2xl font-black text-white">Power-up with Add-ons</h2><span className="text-xs text-text-secondary">Optional monthly boosts for your plan</span></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {ADD_ONS.map((addon, index) => {
                        const Icon = index === 1 ? OfflineIcon : index === 2 ? IndustryIcon : VoiceIcon;
                        return <div key={addon.name} className="bg-bg-main/60 p-5 rounded-2xl border border-white/10 hover:border-white/30 transition-colors"><div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${addonAccents[index]}`}><Icon className="w-5 h-5" /></div><h3 className="mt-4 font-black text-white">{addon.name}</h3><p className="mt-1 text-xl font-black text-white">{addon.price}</p><p className="mt-2 text-sm text-text-secondary min-h-[42px]">{addon.description}</p><button onClick={() => onChoosePlan(addon.name)} className="mt-5 w-full py-2.5 rounded-full border border-white/10 text-sm font-bold text-white hover:bg-white/10 transition-colors">Add to Plan</button></div>;
                    })}
                </div>
            </section>
        </div>
    );
};

export default Pricing;
