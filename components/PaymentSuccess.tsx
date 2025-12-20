import React from 'react';

interface PaymentSuccessProps {
    planName: string | null;
    onGoToDashboard: () => void;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ planName, onGoToDashboard }) => {
    return (
        <div className="max-w-2xl mx-auto py-12 text-center animate-fade-in flex flex-col items-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-500 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h1 className="text-4xl font-bold text-text-primary mb-4">Payment Successful!</h1>
            <p className="text-lg text-text-secondary">
                {planName 
                    ? `Welcome to the ${planName} plan! Your new features are now active.` 
                    : "Your purchase was successful. Your new features are now active."}
            </p>
            <button 
                onClick={onGoToDashboard}
                className="mt-8 px-6 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors"
            >
                Start Translating
            </button>
        </div>
    );
};

export default PaymentSuccess;
