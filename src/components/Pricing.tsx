import React, { useState } from 'react';
import { ADD_ONS } from '../../constants';
import { BankIcon, CheckIcon, IndustryIcon, LockIcon, OfflineIcon, ShieldIcon, VoiceIcon } from './Icons';
import type { UserPlan } from '../types';

interface PricingProps {
    onChoosePlan: (planName: string) => void;
    onContactSales: () => void;
    currentUserPlan: UserPlan;
}

const GraduationCapIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147l7.5-4.125a.75.75 0 01.72 0l7.5 4.125a.75.75 0 010 1.314l-7.5 4.125a.75.75 0 01-.72 0l-7.5-4.125a.75.75 0 010-1.314z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12.75v3.375c0 1.243 2.35 2.25 5.25 2.25s5.25-1.007 5.25-2.25V12.75M19.5 11.25v4.5" />
    </svg>
);

const RefreshIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992V4.356M20.49 9.348A8.25 8.25 0 105.64 15.75M7.977 14.652H2.985v4.992M3.51 14.652A8.25 8.25 0 0018.36 8.25" />
    </svg>
);

const plans = [
    {
        name: 'Basic',
        subtitle: 'Perfect for getting started.',
        price: '$2.99/month',
        accent: 'blue',
        icon: VoiceIcon,
        features: ['1000 translations/month', 'Access to all African languages', 'Text-only translation', 'Standard support'],
    },
    {
        name: 'Premium',
        subtitle: 'For creators and professionals.',
        price: '$7.99/month',
        accent: 'purple',
        icon: ShieldIcon,
        badge: 'MOST POPULAR',
        features: ['Unlimited translations', 'Supported languages + dialects', 'Voice translation', 'Offline mode', 'Priority support'],
    },
    {
        name: 'Training',
        subtitle: 'For teams and educators.',
        price: '$12.99/month',
        accent: 'green',
        icon: GraduationCapIcon,
        features: ['Up to 10 users', '10,000 translations/month', 'WhatsApp/Telegram integration', 'Team dashboard', 'Priority support'],
    },
    {
        name: 'Entreprise',
        displayName: 'Enterprise',
        subtitle: 'For organizations with advanced needs.',
        price: 'Custom',
        accent: 'orange',
        icon: BankIcon,
        features: ['Dedicated account manager', 'Custom AI models', 'SLA & advanced security', 'API access & SSO', 'Custom integrations'],
    },
];

const accentClasses = {
    blue: { icon: 'bg-blue-500/15 text-blue-300 border-blue-400/20', button: 'border-blue-400/40 text-blue-100 hover:bg-blue-500/10', ring: 'hover:border-blue-300/60' },
    purple: { icon: 'bg-purple-500/15 text-purple-300 border-purple-400/20', button: 'bg-blue-500 hover:bg-blue-400 text-white border-blue-400', ring: 'border-blue-400/80 ring-2 ring-blue-500/20' },
    green: { icon: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20', button: 'border-emerald-400/40 text-emerald-100 hover:bg-emerald-500/10', ring: 'hover:border-emerald-300/60' },
    orange: { icon: 'bg-orange-500/15 text-orange-300 border-orange-400/20', button: 'border-orange-400/40 text-orange-100 hover:bg-orange-500/10', ring: 'hover:border-orange-300/60' },
};

const trustItems = [
    { icon: LockIcon, title: 'Secure Payments', description: 'Encrypted checkout keeps every subscription protected.' },
    { icon: RefreshIcon, title: 'Cancel Anytime', description: 'Change, pause, or cancel your plan from account settings.' },
    { icon: ShieldIcon, title: '7-Day Guarantee', description: 'Try premium translation workflows with confidence.' },
];

const addonAccents = ['bg-blue-500/15 text-blue-300', 'bg-purple-500/15 text-purple-300', 'bg-orange-500/15 text-orange-300'];

const Pricing: React.FC<PricingProps> = ({ onChoosePlan, onContactSales, currentUserPlan }) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    return (
        <div className="animate-fade-in text-text-primary max-w-7xl mx-auto py-8 px-4 sm:px-6">
            <div className="text-center mb-8">
                <h1 className="text-3xl md:text-5xl font-black text-white">Choose the perfect plan for you</h1>
                <p className="text-base text-text-secondary mt-4 max-w-2xl mx-auto">
                    Unlock powerful AI translation and creative tools.
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
                        <article key={plan.name} className={`relative bg-bg-surface/90 p-6 rounded-2xl border border-white/10 flex flex-col min-h-[460px] shadow-xl shadow-black/10 transition-all duration-300 hover:-translate-y-1 ${styles.ring} ${isCurrentPlan ? 'border-white bg-white/5' : ''}`}>
                            {plan.badge && <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-blue-500 text-white text-[10px] font-black tracking-widest">{plan.badge}</div>}
                            {isCurrentPlan && <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-white text-black text-[10px] font-black tracking-widest">CURRENT</div>}
                            <div className={`w-12 h-12 rounded-full border flex items-center justify-center ${styles.icon}`}><Icon className="w-6 h-6" /></div>
                            <h2 className="mt-5 text-2xl font-black text-white">{plan.displayName || plan.name}</h2>
                            <p className="mt-2 text-sm text-text-secondary min-h-[40px]">{plan.subtitle}</p>
                            <p className="mt-5 text-3xl font-black text-white">{plan.price}</p>
                            <ul className="mt-6 space-y-3 flex-grow">
                                {plan.features.map(feature => <li key={feature} className="flex items-start gap-3 text-sm text-text-primary"><CheckIcon className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" /><span>{feature}</span></li>)}
                            </ul>
                            <button onClick={() => isEnterprise ? onContactSales() : onChoosePlan(plan.name)} disabled={isCurrentPlan} className={`mt-8 w-full py-3 rounded-full border text-sm font-black transition-all disabled:opacity-60 disabled:cursor-default ${isCurrentPlan ? 'bg-bg-main text-text-secondary border-white/10' : styles.button}`}>
                                {isCurrentPlan ? 'Active Plan' : isEnterprise ? 'Contact Sales' : `Select ${plan.name}`}
                            </button>
                        </article>
                    );
                })}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 rounded-3xl border border-white/10 bg-bg-surface/70 p-4">
                {trustItems.map(item => <div key={item.title} className="flex items-center gap-4 p-4"><div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-300 flex items-center justify-center"><item.icon className="w-5 h-5" /></div><div><h3 className="font-bold text-white">{item.title}</h3><p className="text-xs text-text-secondary mt-1">{item.description}</p></div></div>)}
            </div>

            <section className="mt-8 rounded-3xl border border-white/10 bg-bg-surface/70 p-6 md:p-8 shadow-2xl shadow-black/10">
                <div className="text-center mb-6"><h2 className="text-2xl font-black text-white">Power-up with Add-ons</h2><p className="mt-2 text-sm text-text-secondary">Enhance your plan with powerful add-ons.</p></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {ADD_ONS.map((addon, index) => {
                        const Icon = index === 1 ? OfflineIcon : index === 2 ? IndustryIcon : VoiceIcon;
                        const displayPrice = addon.name === 'Offline Language Packs' ? '$9.99/mo' : addon.price;
                        return <div key={addon.name} className="bg-bg-main/60 p-5 rounded-2xl border border-white/10 hover:border-white/30 transition-colors"><div className={`w-11 h-11 rounded-full flex items-center justify-center ${addonAccents[index]}`}><Icon className="w-5 h-5" /></div><div className="mt-4 flex items-start justify-between gap-3"><h3 className="font-black text-white">{addon.name}</h3><span className="px-2.5 py-1 rounded-full bg-white/10 text-xs font-black text-white whitespace-nowrap">{displayPrice}</span></div><p className="mt-3 text-sm text-text-secondary min-h-[42px]">{addon.description}</p><button onClick={() => onChoosePlan(addon.name)} className="mt-5 w-full py-2.5 rounded-full border border-white/10 text-sm font-bold text-white hover:bg-white/10 transition-colors">Add to Plan</button></div>;
                    })}
                </div>
            </section>

            <footer className="mt-8 flex items-center justify-center gap-3 text-center text-sm text-text-secondary">
                <ShieldIcon className="w-5 h-5 text-emerald-300 flex-shrink-0" />
                <span>Trusted by 10,000+ creators, businesses & teams across Africa and beyond.</span>
            </footer>
        </div>
    );
};

export default Pricing;
