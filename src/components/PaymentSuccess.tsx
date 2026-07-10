import React from 'react';
import { CheckIcon, ShieldIcon, BoltIcon, LockIcon } from './Icons';

interface PaymentSuccessProps {
    planName: string | null;
    onGoToDashboard: () => void;
}

const nextSteps = [
    'Premium workspace unlocked',
    'Billing receipt sent to your email',
    'Plan controls available in account settings',
];

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ planName, onGoToDashboard }) => {
    const purchasedPlan = planName || 'your new';

    return (
        <div className="animate-fade-in max-w-5xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
            <section className="relative overflow-hidden rounded-[2rem] border border-emerald-400/25 bg-bg-surface p-6 sm:p-10 text-center shadow-2xl shadow-emerald-950/20">
                <div className="absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
                <div className="relative mx-auto w-24 h-24 rounded-full bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center shadow-xl shadow-emerald-950/20">
                    <CheckIcon className="w-12 h-12 text-emerald-300" />
                </div>

                <p className="relative mt-6 text-xs font-black tracking-[0.28em] uppercase text-emerald-300">Purchase Complete</p>
                <h1 className="relative mt-3 text-3xl md:text-5xl font-black text-white">Payment Successful</h1>
                <p className="relative mt-4 text-base md:text-lg text-text-secondary max-w-2xl mx-auto">
                    Welcome to the <span className="font-black text-white">{purchasedPlan}</span> plan. Your AfriTranslate AI premium features are ready to use.
                </p>

                <div className="relative mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                    {nextSteps.map(step => (
                        <div key={step} className="rounded-2xl border border-white/10 bg-bg-main/60 p-4 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center flex-shrink-0"><CheckIcon className="w-4 h-4" /></div>
                            <p className="text-sm font-bold text-white">{step}</p>
                        </div>
                    ))}
                </div>

                <div className="relative mt-8 rounded-3xl border border-white/10 bg-bg-main/60 p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div><ShieldIcon className="w-6 h-6 text-emerald-300 mx-auto" /><p className="mt-2 text-sm font-black text-white">Secure</p><p className="text-xs text-text-secondary">Protected billing</p></div>
                    <div><BoltIcon className="w-6 h-6 text-amber-300 mx-auto" /><p className="mt-2 text-sm font-black text-white">Instant</p><p className="text-xs text-text-secondary">Features activated</p></div>
                    <div><LockIcon className="w-6 h-6 text-blue-300 mx-auto" /><p className="mt-2 text-sm font-black text-white">Flexible</p><p className="text-xs text-text-secondary">Cancel anytime</p></div>
                </div>

                <button
                    onClick={onGoToDashboard}
                    className="relative mt-8 px-8 py-4 bg-emerald-500 text-white font-black rounded-full hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-950/20"
                >
                    Start Translating
                </button>
            </section>
        </div>
    );
};

export default PaymentSuccess;
