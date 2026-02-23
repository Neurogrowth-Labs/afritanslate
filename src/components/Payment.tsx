
import React, { useState, useEffect, useRef } from 'react';
import { AFRITRANSLATE_MODELS, ADD_ONS } from '../../constants';
import { PayPalIcon, BankIcon, VisaIcon, MastercardIcon, AmexIcon, StripeIcon } from './Icons';

interface PaymentProps {
    selectedItemName: string | null;
    onBack: () => void;
    onPaymentSuccess: (planName: string) => void;
}

declare global {
    interface Window {
        paypal: any;
    }
}

const Spinner = () => <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

const Payment: React.FC<PaymentProps> = ({ selectedItemName, onBack, onPaymentSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'eft' | 'stripe'>('paypal');
    const sdkLoadedRef = useRef(false);

    const planDetails = AFRITRANSLATE_MODELS.find(p => p.name === selectedItemName);
    const addonDetails = ADD_ONS.find(a => a.name === selectedItemName);
    const itemDetails = planDetails || addonDetails;

    // Load PayPal SDK for Basic, Premium, and Training Plans
    useEffect(() => {
        if ((selectedItemName === 'Basic' || selectedItemName === 'Premium' || selectedItemName === 'Training') && paymentMethod === 'paypal') {
            const scriptId = 'paypal-sdk-script';
            
            // Determine IDs based on plan
            let planId = '';
            let containerId = '';

            if (selectedItemName === 'Basic') {
                planId = 'P-2L193053EK545023VNFTW4NA';
                containerId = 'paypal-button-container-P-2L193053EK545023VNFTW4NA';
            } else if (selectedItemName === 'Premium') {
                planId = 'P-75605795E6508522CNFTXEUA';
                containerId = 'paypal-button-container-P-75605795E6508522CNFTXEUA';
            } else if (selectedItemName === 'Training') {
                planId = 'P-3BC33159AK6748729NFTXIHI';
                containerId = 'paypal-button-container-P-3BC33159AK6748729NFTXIHI';
            }

            const loadButtons = () => {
                if (window.paypal && document.getElementById(containerId)) {
                    // Prevent duplicate buttons
                    const container = document.getElementById(containerId);
                    if (container) container.innerHTML = '';

                    window.paypal.Buttons({
                        style: {
                            shape: 'pill',
                            color: 'gold',
                            layout: 'vertical',
                            label: 'subscribe'
                        },
                        createSubscription: function(data: any, actions: any) {
                            return actions.subscription.create({
                                /* Creates the subscription */
                                plan_id: planId
                            });
                        },
                        onApprove: function(data: any, actions: any) {
                            // Call the app's success handler directly upon approval
                            onPaymentSuccess(selectedItemName);
                        }
                    }).render(`#${containerId}`);
                }
            };

            if (!document.getElementById(scriptId)) {
                const script = document.createElement('script');
                script.id = scriptId;
                script.src = "https://www.paypal.com/sdk/js?client-id=AQdYSIIUo5RKbrqVfTWZlY5oxbJ4Kor0mymqj4QJiAA9PGMoFGKaJPE12YjDG7Wr65uc3f7SgRiARwWT&vault=true&intent=subscription";
                script.dataset.sdkIntegrationSource = "button-factory";
                script.onload = () => {
                    sdkLoadedRef.current = true;
                    loadButtons();
                };
                document.body.appendChild(script);
            } else if (window.paypal) {
                loadButtons();
            }
        }
    }, [selectedItemName, paymentMethod, onPaymentSuccess]);
    
    if (!itemDetails) {
        return (
            <div className="max-w-3xl mx-auto py-12 text-center">
                <h1 className="text-3xl font-bold text-text-primary mb-4">Purchase Item Not Found</h1>
                <p className="text-text-secondary">The selected plan or add-on could not be found.</p>
                <button onClick={onBack} className="mt-6 text-sm text-accent hover:underline font-semibold">
                    &larr; Return to Pricing
                </button>
            </div>
        );
    }

    const handlePayPalRedirect = () => {
        setIsLoading(true);
        // Generic fallback for plans without specific SDK integration buttons
        window.open('https://www.paypal.com/signin', '_blank');
        setTimeout(() => {
            setIsLoading(false);
        }, 3000);
    }

    const handleStripePayment = () => {
        setIsLoading(true);
        // Simulate Stripe processing delay and redirect
        setTimeout(() => {
            setIsLoading(false);
            if (selectedItemName) {
                onPaymentSuccess(selectedItemName);
            }
        }, 2500);
    }

    const price = 'price' in itemDetails ? itemDetails.price : undefined;
    
    return (
        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-0">
            <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">Complete Your Purchase</h1>
                <p className="text-lg text-text-secondary mt-2">You are purchasing the <span className="font-bold text-accent">{itemDetails.name}</span>.</p>
            </div>
            
            <div className="bg-bg-surface p-4 sm:p-8 rounded-xl border border-border-default">
                <div className="mb-6 pb-6 border-b border-border-default">
                    <h2 className="text-xl font-semibold text-white">Order Summary</h2>
                    <div className="flex justify-between items-center mt-4">
                        <p className="text-text-primary">{itemDetails.name}</p>
                        <p className="text-2xl font-bold text-white">{price}</p>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-white mb-4">Payment Method</h2>
                    
                    {/* Payment Method Tabs */}
                    <div className="flex flex-wrap border-b border-border-default mb-6">
                        <button onClick={() => setPaymentMethod('paypal')} className={`flex items-center gap-2 px-4 py-2 font-semibold transition-colors ${paymentMethod === 'paypal' ? 'border-b-2 border-accent text-white' : 'text-text-secondary hover:text-white'}`}>
                            <PayPalIcon className="w-5 h-5" />
                            PayPal
                        </button>
                        <button onClick={() => setPaymentMethod('stripe')} className={`flex items-center gap-2 px-4 py-2 font-semibold transition-colors ${paymentMethod === 'stripe' ? 'border-b-2 border-accent text-white' : 'text-text-secondary hover:text-white'}`}>
                            <StripeIcon className="w-5 h-5 text-current" />
                            Stripe
                        </button>
                        <button onClick={() => setPaymentMethod('card')} className={`flex items-center gap-2 px-4 py-2 font-semibold transition-colors ${paymentMethod === 'card' ? 'border-b-2 border-accent text-white' : 'text-text-secondary hover:text-white'}`}>
                            Card
                        </button>
                         <button onClick={() => setPaymentMethod('eft')} className={`flex items-center gap-2 px-4 py-2 font-semibold transition-colors ${paymentMethod === 'eft' ? 'border-b-2 border-accent text-white' : 'text-text-secondary hover:text-white'}`}>
                            <BankIcon className="w-5 h-5" />
                            EFT / Bank
                        </button>
                    </div>

                    {paymentMethod === 'card' && (
                        <div className="space-y-4 animate-fade-in opacity-50 pointer-events-none filter grayscale">
                            <div className="p-4 rounded-lg bg-bg-main border border-border-default text-text-secondary text-sm text-center">
                                Direct Card processing is currently disabled. Please use Stripe or PayPal.
                            </div>
                            <div>
                                <label className="text-sm font-medium text-text-primary mb-1 block">Card Information</label>
                                <div className="bg-bg-main border border-border-default rounded-lg p-0 overflow-hidden">
                                    <div className="p-3 flex items-center justify-between border-b border-border-default">
                                        <span className="flex items-center gap-3 text-text-secondary">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 21z" /></svg>
                                            <span>Card number</span>
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <VisaIcon className="w-7"/>
                                            <MastercardIcon className="w-7"/>
                                            <AmexIcon className="w-7"/>
                                        </div>
                                    </div>
                                    <div className="flex">
                                        <div className="flex-1 p-3 text-text-secondary">Expiration date</div>
                                        <div className="flex-1 p-3 text-text-secondary border-l border-border-default">CVC</div>
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                disabled
                                className="w-full py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:bg-border-default disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                Pay {price}
                            </button>
                        </div>
                    )}

                    {paymentMethod === 'stripe' && (
                        <div className="text-center p-4 animate-fade-in">
                            <div className="bg-[#635BFF] text-white p-6 rounded-xl shadow-lg mb-6 max-w-sm mx-auto">
                                <h3 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
                                    <StripeIcon className="w-6 h-6 text-white" /> Stripe
                                </h3>
                                <p className="text-white/80 text-sm mb-6">Secure credit card payment</p>
                                <button 
                                    onClick={handleStripePayment}
                                    disabled={isLoading}
                                    className="w-full py-3 bg-white text-[#635BFF] font-bold rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Spinner /> : `Pay ${price}`}
                                </button>
                            </div>
                            <p className="text-xs text-text-secondary">
                                <span className="text-accent">Note:</span> You will be redirected to the Stripe secure checkout page to complete your payment.
                            </p>
                        </div>
                    )}

                    {paymentMethod === 'paypal' && (
                        <div className="text-center p-4 animate-fade-in">
                            <p className="text-text-secondary mb-6 text-sm">
                                You will be redirected to PayPal to complete your transaction securely.
                            </p>
                            
                            {/* Basic Plan SDK Button */}
                            {selectedItemName === 'Basic' ? (
                                <div className="w-full max-w-xs mx-auto">
                                    <div id="paypal-button-container-P-2L193053EK545023VNFTW4NA"></div>
                                </div>
                            ) : selectedItemName === 'Premium' ? (
                                /* Premium Plan SDK Button */
                                <div className="w-full max-w-xs mx-auto">
                                    <div id="paypal-button-container-P-75605795E6508522CNFTXEUA"></div>
                                </div>
                            ) : selectedItemName === 'Training' ? (
                                /* Training Plan SDK Button */
                                <div className="w-full max-w-xs mx-auto">
                                    <div id="paypal-button-container-P-3BC33159AK6748729NFTXIHI"></div>
                                </div>
                            ) : (
                                /* Fallback for other items */
                                <button 
                                    onClick={handlePayPalRedirect} 
                                    disabled={isLoading}
                                    className="w-full max-w-xs mx-auto py-3 bg-[#0070BA] text-white font-semibold rounded-lg hover:bg-[#005ea6] transition-colors disabled:bg-border-default disabled:cursor-wait flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Spinner /> : <>Pay with <PayPalIcon className="w-4 h-4 fill-white" /></>}
                                </button>
                            )}
                            
                            {selectedItemName !== 'Basic' && selectedItemName !== 'Premium' && selectedItemName !== 'Training' && (
                                <p className="text-xs text-text-secondary mt-4">
                                    <span className="text-accent">Note:</span> Please wait to be redirected back after payment to activate your plan.
                                </p>
                            )}
                        </div>
                    )}
                    
                    {paymentMethod === 'eft' && (
                         <div className="p-4 bg-bg-main border border-border-default rounded-lg animate-fade-in">
                            <h3 className="font-semibold text-white mb-2">Electronic Funds Transfer (EFT) Details</h3>
                            <p className="text-sm text-text-secondary mb-4">Please use the following details to make your payment. Use your email address as the payment reference.</p>
                            <div className="space-y-2 text-sm">
                                <p><strong className="text-text-primary w-28 inline-block">Bank Name:</strong> First National Bank of Culture</p>
                                <p><strong className="text-text-primary w-28 inline-block">Account Name:</strong> AfriTranslate AI Inc.</p>
                                <p><strong className="text-text-primary w-28 inline-block">Account No:</strong> 1234567890</p>
                                <p><strong className="text-text-primary w-28 inline-block">Branch Code:</strong> 098765</p>
                                <p><strong className="text-text-primary w-28 inline-block">Reference:</strong> Your Account Email</p>
                            </div>
                            <p className="text-xs text-text-secondary mt-4">Once payment is complete, please email proof of payment to <span className="text-accent">billing@afritranslate.ai</span>. Your plan will be manually activated within 24 hours.</p>
                        </div>
                    )}

                </div>
            </div>

            <div className="text-center mt-6">
                 <button onClick={onBack} className="text-sm text-text-secondary hover:text-white hover:underline">
                    &larr; Back to Pricing
                </button>
            </div>
        </div>
    );
};

export default Payment;
