import React, { useState } from 'react';

const Spinner = () => <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);


const ContactForm: React.FC = () => {
    const [name, setName] = useState('');
    const [company, setCompany] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Replace this with your own Formspree form endpoint ID.
    // Create a form at formspree.io and set the recipient to sales@neurogrowthlabs.co.za
    const FORMSPREE_ENDPOINT = "https://formspree.io/f/YOUR_UNIQUE_ID";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!name.trim() || !email.trim() || !message.trim()) {
            setError("Please fill out all required fields.");
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('name', name);
        formData.append('company', company);
        formData.append('email', email);
        formData.append('message', message);

        try {
            const response = await fetch(FORMSPREE_ENDPOINT, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                setSuccess(true);
                setName('');
                setCompany('');
                setEmail('');
                setMessage('');
            } else {
                 const data = await response.json();
                if (data.errors) {
                    setError(data.errors.map((err: { message: string }) => err.message).join(', '));
                } else if (data.error) {
                     setError(data.error);
                } else {
                    setError("An unexpected error occurred. Please try again.");
                }
            }
        } catch (err) {
            setError("An error occurred. Please check your network and try again.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (success) {
        return (
            <div className="max-w-2xl mx-auto py-8 animate-fade-in text-center">
                 <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-500 mb-6 mx-auto">
                    <CheckIcon />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Thank You!</h2>
                <p className="text-lg text-text-secondary">Your enquiry has been sent successfully. Our team will get back to you shortly.</p>
                 <button onClick={() => setSuccess(false)} className="mt-8 text-sm text-accent hover:underline font-semibold">
                    Send another enquiry
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto py-8 animate-fade-in">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-text-primary">Contact Sales</h1>
                <p className="text-lg text-text-secondary mt-2">Tell us about your needs, and we'll get in touch to discuss a tailored solution.</p>
            </div>
            
            <div className="bg-bg-surface p-8 rounded-xl border border-border-default">
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
                            <input 
                                type="text" 
                                id="name"
                                name="name" 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                className="w-full p-3 bg-bg-main border border-border-default rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition text-text-primary placeholder-text-secondary" 
                                placeholder="e.g. Amara Koffi"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="company" className="block text-sm font-medium text-text-secondary mb-1">Company Name</label>
                            <input 
                                type="text" 
                                id="company" 
                                name="company"
                                value={company} 
                                onChange={e => setCompany(e.target.value)} 
                                className="w-full p-3 bg-bg-main border border-border-default rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition text-text-primary placeholder-text-secondary"
                                placeholder="e.g. TechInnovate"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">Work Email</label>
                        <input 
                            type="email" 
                            id="email" 
                            name="email"
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            className="w-full p-3 bg-bg-main border border-border-default rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition text-text-primary placeholder-text-secondary"
                            placeholder="you@company.com"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-text-secondary mb-1">How can we help?</label>
                        <textarea 
                            id="message" 
                            name="message"
                            value={message} 
                            onChange={e => setMessage(e.target.value)} 
                            rows={5} 
                            className="w-full p-3 bg-bg-main border border-border-default rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition text-text-primary placeholder-text-secondary resize-y"
                            placeholder="Please describe your requirements, such as API access, custom dialect support, or high-volume translation needs."
                            required
                        />
                    </div>
                    {error && (
                        <p className="text-red-400 text-center text-sm bg-red-500/10 p-2 rounded-md">{error}</p>
                    )}
                    <div>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:bg-border-default disabled:cursor-wait flex items-center justify-center"
                        >
                            {isSubmitting ? <Spinner /> : 'Send Enquiry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ContactForm;