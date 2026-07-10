import React, { useState } from 'react';
import { AFRITRANSLATE_MODELS, ADD_ONS } from '../../constants';
import { BankIcon, CheckIcon, GoogleIcon, LockIcon, ShieldIcon, VisaIcon, MastercardIcon, AmexIcon, BoltIcon } from './Icons';
import type { User } from '../types';

interface PaymentProps {
    selectedItemName: string | null;
    onBack: () => void;
    onPaymentSuccess: (planName: string) => void;
    currentUser?: User | null;
}

type PaymentMethod = 'googlePay' | 'koPay' | 'card' | 'eft';

const Spinner = () => <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

const methodCopy: Record<PaymentMethod, { label: string; title: string; helper: string; cta: string; powered: string; accent: string }> = {
    googlePay: { label: 'Google Pay', title: 'Pay with Google Pay', helper: 'Fast, secure and private payments', cta: 'Google Pay Subscribe', powered: 'Powered by Google Pay', accent: 'from-blue-500 to-cyan-400' },
    koPay: { label: 'KOPay', title: 'Pay with KOPay', helper: 'Local secure checkout for African payments', cta: 'KOPay Subscribe', powered: 'Powered by KOPay', accent: 'from-emerald-500 to-lime-400' },
    card: { label: 'Card', title: 'Pay by Card', helper: 'Use debit or credit card without leaving AfriTranslate', cta: 'Debit or Credit Card', powered: 'Visa, Mastercard and Amex accepted', accent: 'from-purple-500 to-fuchsia-400' },
    eft: { label: 'EFT / Bank', title: 'Direct Payment EFT', helper: 'Bank transfer with manual activation within 24 hours', cta: 'Submit EFT Proof', powered: 'Direct bank transfer', accent: 'from-orange-500 to-amber-400' },
};

const Payment: React.FC<PaymentProps> = ({ selectedItemName, onBack, onPaymentSuccess, currentUser }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('googlePay');
    const planDetails = AFRITRANSLATE_MODELS.find(p => p.name === selectedItemName);
    const addonDetails = ADD_ONS.find(a => a.name === selectedItemName);
    const itemDetails = planDetails || addonDetails;

    if (!itemDetails) {
        return <div className="max-w-3xl mx-auto py-12 text-center"><h1 className="text-3xl font-bold text-text-primary mb-4">Purchase Item Not Found</h1><p className="text-text-secondary">The selected plan or add-on could not be found.</p><button onClick={onBack} className="mt-6 text-sm text-accent hover:underline font-semibold">&larr; Return to Pricing</button></div>;
    }

    const price = 'price' in itemDetails && itemDetails.price ? itemDetails.price : 'Custom';
    const numericPrice = price.match(/\$[\d.]+/)?.[0] || price;
    const userName = currentUser?.name || currentUser?.email?.split('@')[0] || 'AfriTranslate User';
    const userEmail = currentUser?.email || 'user@afritranslate.ai';
    const selectedMethod = methodCopy[paymentMethod];

    const completePayment = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            if (selectedItemName) onPaymentSuccess(selectedItemName);
        }, 1200);
    };

    return (
        <div className="animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-10">
            <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-6 items-start">
                <section className="space-y-5">
                    <div>
                        <p className="text-xs font-bold tracking-[0.28em] uppercase text-accent mb-3">Purchase Checkout</p>
                        <h1 className="text-3xl md:text-5xl font-black text-white">Complete Your Purchase</h1>
                        <p className="text-text-secondary mt-3">You are purchasing the <span className="font-bold text-accent">{itemDetails.name}</span> plan.</p>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-bg-surface p-6 shadow-2xl shadow-black/20">
                        <h2 className="text-xl font-black text-white">Order Summary</h2>
                        <div className="mt-5 flex items-start justify-between gap-4"><div><p className="text-sm text-text-secondary">Plan</p><h3 className="text-2xl font-black text-white">{itemDetails.name} Plan</h3><p className="text-sm text-text-secondary mt-1">Billed monthly</p></div><p className="text-2xl font-black text-white">{price}</p></div>
                        <div className="my-6 border-t border-white/10" />
                        <div className="space-y-3 text-sm"><div className="flex justify-between text-text-secondary"><span>Subtotal</span><span>{numericPrice}</span></div><div className="flex justify-between text-text-secondary"><span>Tax</span><span>Calculated at checkout</span></div><div className="flex justify-between text-white text-lg font-black pt-3 border-t border-white/10"><span>Total</span><span>{price}</span></div></div>
                        <div className="mt-5 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4 text-sm text-blue-100"><strong>Billing Notice:</strong> Charged monthly. Cancel anytime from account settings.</div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-bg-surface p-6 relative overflow-hidden">
                        <div className="absolute right-6 top-6 w-20 h-20 rounded-full bg-accent/10 blur-xl" />
                        <h2 className="text-xl font-black text-white">What you get with {itemDetails.name}</h2>
                        <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {['Up to 10,000 words', 'AI Assistant', 'Standard translations', 'Email support', '1 Seat'].map(feature => <li key={feature} className="flex items-center gap-3 text-sm text-text-primary"><CheckIcon className="w-4 h-4 text-emerald-300" />{feature}</li>)}
                        </ul>
                        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white"><BoltIcon className="w-4 h-4 text-accent" /> Premium-ready workspace</div>
                    </div>
                </section>

                <section className="rounded-[2rem] border border-blue-400/30 bg-bg-surface/95 p-5 sm:p-7 shadow-2xl shadow-blue-950/20">
                    <div className={`rounded-3xl p-[1px] bg-gradient-to-r ${selectedMethod.accent}`}><div className="rounded-3xl bg-bg-main p-5"><div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center"><GoogleIcon className="w-7 h-7" /></div><div><h2 className="text-2xl font-black text-white">{selectedMethod.title}</h2><p className="text-sm text-text-secondary mt-1">{selectedMethod.helper}</p></div></div></div></div>

                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-2xl border border-white/10 bg-bg-main/50 p-1.5">
                        {(Object.keys(methodCopy) as PaymentMethod[]).map(method => <button key={method} onClick={() => setPaymentMethod(method)} className={`px-3 py-3 rounded-xl text-xs sm:text-sm font-black transition-all ${paymentMethod === method ? 'bg-white text-black' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}>{methodCopy[method].label}</button>)}
                    </div>

                    <div className="mt-6 rounded-3xl border border-white/10 bg-bg-main/60 p-5 space-y-4">
                        <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-tr from-white to-neutral-500 text-black font-black flex items-center justify-center">{userName.charAt(0).toUpperCase()}</div><div><p className="text-sm font-bold text-white">{userName}</p><p className="text-xs text-text-secondary">{userEmail}</p></div></div><span className="text-text-secondary">⌄</span></div>
                        <div className="rounded-2xl bg-white/5 p-4"><p className="text-xs text-text-secondary mb-2">Paying with</p>{paymentMethod === 'eft' ? <div className="text-sm text-text-primary space-y-1"><p><strong className="text-white">Bank:</strong> First National Bank of Culture</p><p><strong className="text-white">Account:</strong> AfriTranslate AI Inc.</p><p><strong className="text-white">Reference:</strong> {userEmail}</p></div> : <div className="flex items-center justify-between"><span className="font-bold text-white">Visa ****4242</span><span className="text-text-secondary">⌄</span></div>}</div>
                        {paymentMethod === 'card' && <div className="flex items-center gap-2"><VisaIcon className="w-9" /><MastercardIcon className="w-9" /><AmexIcon className="w-9" /></div>}
                    </div>

                    <p className="mt-5 text-center text-sm text-text-secondary">You will be redirected to {selectedMethod.label} to complete this secure purchase.</p>
                    <div className="mt-5 grid grid-cols-3 gap-3 text-center"><div className="rounded-2xl bg-white/5 p-3"><ShieldIcon className="w-5 h-5 text-emerald-300 mx-auto" /><p className="text-xs font-bold text-white mt-2">Secure</p><p className="text-[10px] text-text-secondary">Encrypted</p></div><div className="rounded-2xl bg-white/5 p-3"><LockIcon className="w-5 h-5 text-blue-300 mx-auto" /><p className="text-xs font-bold text-white mt-2">Private</p><p className="text-[10px] text-text-secondary">Protected</p></div><div className="rounded-2xl bg-white/5 p-3"><BoltIcon className="w-5 h-5 text-amber-300 mx-auto" /><p className="text-xs font-bold text-white mt-2">Fast</p><p className="text-[10px] text-text-secondary">Instant</p></div></div>
                    <button onClick={completePayment} disabled={isLoading} className={`mt-6 w-full py-4 rounded-full bg-gradient-to-r ${selectedMethod.accent} text-white font-black text-base shadow-lg disabled:opacity-70 flex items-center justify-center gap-2`}>{isLoading ? <Spinner /> : paymentMethod === 'googlePay' ? `Pay ${price} with Google Pay` : paymentMethod === 'koPay' ? `Pay ${price} with KOPay` : selectedMethod.cta}</button>
                    <button onClick={completePayment} disabled={isLoading} className="mt-3 w-full py-3 rounded-full border border-white/10 text-white font-bold hover:bg-white/10 transition-colors">{selectedMethod.cta}</button>
                    <p className="mt-4 text-center text-xs text-text-secondary">{selectedMethod.powered} · <a className="text-white hover:underline" href="#">Terms of Service</a> · <a className="text-white hover:underline" href="#">Privacy Policy</a></p>
                    <p className="mt-3 text-center text-xs text-text-secondary">Cancel anytime from account settings</p>
                </section>
            </div>
            <div className="text-center mt-8"><button onClick={onBack} className="text-sm text-text-secondary hover:text-white hover:underline">&larr; Back to Pricing</button></div>
        </div>
    );
};

export default Payment;
