
import React from 'react';

// --- General App Icons --- //
export const LogoIcon = () => (
    <div className="w-10 h-10 rounded-full bg-brand-surface flex-shrink-0 flex items-center justify-center border-2 border-brand-primary/50">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-brand-primary">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 18 15.3 15.3 0 0 1-8 0 15.3 15.3 0 0 1 4-18z"></path>
        </svg>
    </div>
);
export const GlobeIcon: React.FC<{className?: string}> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className ?? 'w-8 h-8'}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75a9 9 0 0016.5 0M12 3.75a9 9 0 010 16.5" /></svg>;
export const BoltIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>;
export const DocIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
export const EducationIcon: React.FC<{className?: string}> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-10 h-10 ${className}`}><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14v6m-6-3.25v.25a6 6 0 1012 0v-.25" /></svg>;
export const BusinessIcon: React.FC<{className?: string}> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-10 h-10 ${className}`}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h18M3 7.5h18M3 12h18" /></svg>;
export const HealthcareIcon: React.FC<{className?: string}> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-10 h-10 ${className}`}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 12h.01" /></svg>;
export const MediaIcon: React.FC<{className?: string}> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-10 h-10 ${className}`}><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" /></svg>;
export const LinkedInIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-4.481 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/></svg>;
export const TwitterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
export const InstagramIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.585-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.585-.012-4.85-.07c-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.85s.012-3.584.07-4.85c.149-3.227 1.664-4.771 4.919-4.919C8.415 2.175 8.796 2.163 12 2.163zm0 1.802c-3.552 0-3.833.015-5.221.077-2.812.128-4.011 1.323-4.14 4.14-.062 1.388-.077 1.669-.077 5.221s.015 3.833.077 5.221c.129 2.811 1.328 4.011 4.14 4.14 1.388.062 1.669.077 5.221.077s3.833-.015 5.221-.077c2.811-.129 4.011-1.328 4.14-4.14.062-1.388.077-1.669.077-5.221s-.015-3.833-.077-5.221c-.129-2.811-1.328-4.011-4.14-4.14-1.388-.062-1.669-.077-5.221-.077z"/><path d="M12 6.848c-2.841 0-5.152 2.311-5.152 5.152s2.311 5.152 5.152 5.152 5.152-2.311 5.152-5.152S14.841 6.848 12 6.848zm0 8.502c-1.85 0-3.352-1.502-3.352-3.352s1.502-3.352 3.352-3.352 3.352 1.502 3.352 3.352-1.502 3.352-3.352 3.352zM16.965 6.402c-.781 0-1.416.635-1.416 1.416s.635 1.416 1.416 1.416 1.416-.635 1.416-1.416-.635-1.416-1.416-1.416z"/></svg>;
export const YouTubeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zM9.715 15.2V8.8l5.8 3.2z"/></svg>;


// --- Add-on Icons --- //
export const VoiceIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m12 7.5v-1.5a6 6 0 00-6-6m-6 6v-1.5a6 6 0 016-6m0 0a6 6 0 016 6v1.5m-6-7.5a6 6 0 00-6 6v1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75a3 3 0 003-3v-1.5a3 3 0 00-6 0v1.5a3 3 0 003 3z" />
    </svg>
);

export const OfflineIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

export const IndustryIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h18M3 7.5h18M3 12h18m-4.5 9v-6.75" />
    </svg>
);

export const CloseIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const CheckIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

export const SearchIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);

export const LibraryIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
);

export const TranslateIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-1.153 0-2.296.127-3.423.379C6.98 3.746 5.857 5.14 5.857 6.741v8.77z" />
    </svg>
);

export const InfoIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
);

export const PriceTagIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
);

export const AttachmentIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.122 2.122l7.81-7.81" />
    </svg>
);

export const MicrophoneIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 1.5a3.75 3.75 0 0 0-3.75 3.75v6a3.75 3.75 0 0 0 7.5 0v-6A3.75 3.75 0 0 0 12 1.5Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 4.5h-6M15 7.5h-6M15 10.5h-6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 11.25v.75a7.5 7.5 0 0 1-15 0v-.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v3.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 23.25h7.5" />
    </svg>
);

export const StopIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
    </svg>
);

export const SendIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

export const ScriptIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
);

export const BookIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
);

export const MeetingIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.952a4.5 4.5 0 014.5 0m-4.5 0a4.5 4.5 0 00-4.5 0m3.75 0H7.5a3.75 3.75 0 01-3.75-3.75V8.25c0-2.071 1.679-3.75 3.75-3.75h6c2.071 0 3.75 1.679 3.75 3.75v3.75c0 2.071-1.679 3.75-3.75 3.75z" />
    </svg>
);

export const LiveIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5.85 1.5 1.509 0 1.533-2.522 2.776-5.633 2.776-.326 0-.64-.014-.943-.04M5.25 5.25a3 3 0 013-3h8.25a3 3 0 013 3v5.25a3 3 0 01-3 3h-2.25l-3 3-3-3H8.25a3 3 0 01-3-3V5.25z" />
    </svg>
);

export const ImageIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

export const VolumeUpIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
);

export const PronunciationIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-1.153 0-2.296.127-3.423.379C6.98 3.746 5.857 5.14 5.857 6.741v8.771z" />
    </svg>
);

export const MenuIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

export const ThinkingIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 21v-1.5M15.75 3v1.5m0 16.5v-1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m12 7.5v-1.5a6 6 0 00-6-6m-6 6v-1.5a6 6 0 016-6m0 0a6 6 0 016 6v1.5m-6-7.5a6 6 0 00-6 6v1.5" />
    </svg>
);

export const LockIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
);

export const WifiOffIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18m-9-9v.01M4.879 4.879A12.034 12.034 0 0112 3c4.793 0 9.11 2.735 11.121 6.879M9.284 14.716a4.5 4.5 0 016.032-2.43M1.879 9.121A12.013 12.013 0 012.879 6.879m16.242 10.242a12.013 12.013 0 01-1.001 2.243m-2.242 1.001a11.96 11.96 0 01-13.04-13.04" />
    </svg>
);

export const DownloadIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

export const WordIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 13.5l3 3m0 0l3-3m-3 3v-6m1.06-4.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
);

export const PdfIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
    </svg>
);

// --- Payment Icons --- //
export const StripeIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg width="40" height="25" viewBox="0 0 40 25" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <g clipPath="url(#clip0_1_2)">
        <path d="M24.708 8.032c0-1.88-.93-2.83-2.61-2.83-1.21 0-2.07.56-2.73 1.11l-.99-1.39c.81-.66 1.99-1.25 3.66-1.25 2.76 0 4.69 1.63 4.69 4.3v6.33h-2.02V8.032zM12.918 14.332h4.51V12.2h-4.51V9.922h4.88V7.792h-4.88V5.322h-2.1V17.022h7.1v-2.69h-5zM.018 11.832c0-3.32 2.15-4.32 4.49-4.32 2.78 0 4.3 1.34 4.3 3.32v.56H2.118c.02 1.53 1.02 2.27 2.37 2.27 1.05 0 1.68-.42 2.2-1.02l1.66 1.1c-.81 1.08-2.18 1.66-3.8 1.66-2.96 0-4.63-1.57-4.63-4.55zm6.6-1.99c-.06-1.02-.75-1.68-2.09-1.68-1.27 0-1.99.63-2.05 1.68h4.14zM28.008 17.022V3.622h2.09v1.9h.06c.6-1.31 1.9-2.07 3.37-2.07.25 0 .5.03.75.09v2.24c-.28-.06-.56-.09-.84-.09-1.54 0-2.67.99-3.14 2.24v8.89h-2.3z" fill="#635bff"/>
        <path d="M37.898 12.132c-.06-2.58-1.42-3.86-4.24-3.86-1.88 0-3.16.81-3.81 1.83l1.8 1.25c.34-.54.84-1.02 1.9-1.02 1.45 0 2.02.66 2.02 1.77v.22c-1.85-.25-3.13-.19-4.39.81-1.28 1.02-1.22 2.64.09 3.57.99.72 2.27.75 3.4.34 1.13-.42 1.6-1.16 1.8-1.9l-1.96-.5c-.19.45-.6.78-1.22.78-.66 0-1.05-.31-1.16-.6l4.77-1.25v-.44z" fill="#635bff"/>
        </g>
        <defs><clipPath id="clip0_1_2"><path fill="#fff" d="M0 0h40v25H0z"/></clipPath></defs>
    </svg>
);
export const PayPalIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
        <path d="M8.32 21.18a.72.72 0 0 1-.72.64H4.15a.72.72 0 0 1-.72-.73L4.69 10a.72.72 0 0 1 .72-.64h3.45a.72.72 0 0 1 .72.73zM15.42 21a.72.72 0 0 1-.72.64H9.41a.72.72 0 0 1-.72-.73l1.9-10.54a.72.72 0 0 1 .72-.64h2.5a.72.72 0 0 1 .72.64L16.27 21a.72.72 0 0 1-.85.82zm5.79-11.75a.72.72 0 0 0-.72-.64h-3.45a.72.72 0 0 0-.72.73l-1.26 7a.72.72 0 0 0 .72.82h2.5a.72.72 0 0 0 .72-.64l.85-4.75a.72.72 0 0 1 .72-.73H21a.72.72 0 0 0 .72-.73l-.51-2.81zM10.15 2.16H4.8a.72.72 0 0 0-.72.73L3 9.36a.72.72 0 0 0 .72.64h5.36a.72.72 0 0 0 .72-.73l1.17-6.47a.72.72 0 0 0-.72-.73z" />
    </svg>
);
export const BankIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6.375a.75.75 0 01.75.75v3.75a.75.75 0 01-.75.75H9V6.75z" />
    </svg>
);
export const VisaIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="24" className={className} viewBox="0 0 38 24" role="img" aria-labelledby="pi-visa"><title id="pi-visa">Visa</title><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"/><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"/><path d="M28.8 10.1c-.1-3.4-3-5.5-6.3-5.5-3.3 0-5.6 2.1-5.6 5.5 0 3.4 2.3 5.5 5.6 5.5 3.3 0 6.2-2.1 6.3-5.5h-2.9c-.1 2-1.5 3.1-3.4 3.1-1.9 0-3.3-1.1-3.3-3.1 0-2 1.4-3.1 3.3-3.1 1.9 0 3.3 1.1 3.4 3.1h2.9zM21.6 15.6c-.6-1.1-1.3-1.8-2.3-2.3-.5-.2-1-.4-1.5-.5.5-.1.9-.3 1.4-.5.9-.4 1.6-1.2 2.2-2.2h3.1c-.6 1.1-1.3 1.8-2.3 2.3.5.2 1 .4 1.5.5-.5.1-.9.3-1.4-.5-.9-.4-1.6 1.2-2.2 2.2h-3.1zM11.1 4.6h-3.1c-.6 1.1-1.3 1.8-2.3 2.3-.5.2-1 .4-1.5.5.5.1.9.3 1.4.5.9.4 1.6 1.2 2.2 2.2h3.1c-.6-1.1-1.3-1.8-2.3-2.3.5-.2 1-.4 1.5-.5-.5-.1-.9.3-1.4-.5-.9-.4-1.6 1.2-2.2 2.2h3.1z" fill="#142688"/></svg>
);

export const MastercardIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="24" viewBox="0 0 38 24" className={className} role="img" aria-labelledby="pi-mastercard"><title id="pi-mastercard">Mastercard</title><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"/><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"/><circle fill="#EB001B" cx="15" cy="12" r="7"/><circle fill="#F79E1B" cx="23" cy="12" r="7"/><path fill="#FF5F00" d="M22 12c0-3.87-3.13-7-7-7s-7 3.13-7 7 3.13 7 7 7 7-3.13 7-7z"/></svg>
);

export const AmexIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="24" viewBox="0 0 38 24" className={className} role="img" aria-labelledby="pi-amex"><title id="pi-amex">Amex</title><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"/><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"/><rect x="2" y="3" width="34" height="18" rx="2" fill="#0077CC"/><path fill="#fff" d="M14.6 15.2h2.8l2.2 4h2.8l-3.8-6.3 3.8-6.2h-2.8l-2.2 4h-2.8L11.8 3h-2.8L12.8 9l-3.8 6.2h2.8l2.8-4zM22.6 3h2.8l2.2 16.2h-2.8L22.6 3z"/></svg>
);

export const SynopsisIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

export const CharactersIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
);

export const CultureIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A11.953 11.953 0 0112 16.5c-2.998 0-5.74-1.1-7.843-2.918m15.686-5.496A8.959 8.959 0 003 12c0 .778.099 1.533.284 2.253m18.232-2.253A11.953 11.953 0 0012 10.5" />
    </svg>
);

export const AudienceIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.952a4.5 4.5 0 014.5 0m-4.5 0a4.5 4.5 0 00-4.5 0m3.75 0H7.5a3.75 3.75 0 01-3.75-3.75V8.25c0-2.071 1.679-3.75 3.75-3.75h6c2.071 0 3.75 1.679 3.75 3.75v3.75c0 2.071-1.679 3.75-3.75 3.75z" />
    </svg>
);

export const GoogleMeetIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fill="#00832d" d="M12.35 15.17L7.5 12.43V5.41h9.17v5.41l-2.09 1.5v-3.75h-5v3.34z"/>
        <path fill="#0066da" d="M7.5 12.43l-2.5 1.83V7.5l2.5-1.92z"/>
        <path fill="#e94235" d="M7.5 5.58v6.85l-5 3.66V9.23z"/>
        <path fill="#2684fc" d="M16.67 17.83V10.8l2.5 1.92v3.25z"/>
        <path fill="#00a150" d="M16.67 10.8v-5.4l5 3.58v5.58z"/>
        <path fill="#ffba00" d="M16.67 17.83l-4.75 2.75l-4.42-2.75l2.08-1.5l2.34 1.33l2.67-1.58z"/>
    </svg>
);

export const TeamsIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} color="#464EB8">
        <path d="M18.15 7.5c-.33 0-.6-.13-.85-.38-.49-.49-.49-1.28 0-1.77.24-.24.52-.37.85-.37s.6.13.85.38c.49.49.49 1.28 0 1.77-.25.24-.52.37-.85.37zm-3.3-1.63c0-.49.39-.88.88-.88h3.5c.24 0 .48.1.66.27.42.42.53 1.05.3 1.58-.23.53-.78.88-1.37.88h-3.09c-.49 0-.88-.39-.88-.88zm-1.8 1.63c-.33 0-.6-.13-.85-.38-.49-.49-.49-1.28 0-1.77.24-.24.52-.37.85-.37s.6.13.85.38c.49.49.49 1.28 0 1.77-.25.24-.52.37-.85.37zm-2.25-1.63c0-.49.39-.88.88-.88h3.5c.24 0 .48.1.66.27.42.42.53 1.05.3 1.58-.23.53-.78.88-1.37.88h-3.09c-.49 0-.88-.39-.88-.88zm-1.8 1.63c-.33 0-.6-.13-.85-.38-.49-.49-.49-1.28 0-1.77.24-.24.52-.37.85-.37s.6.13.85.38c.49.49.49 1.28 0 1.77-.25.24-.52.37-.85.37zm8.85 2.25h-5.25v-.38c0-.49.39-.87.88-.87h3.5c.48 0 .87.39.87.88v.37zm-6.75 0h-5.25v-.38c0-.49.39-.87.88-.87h3.5c.48 0 .87.39.87.88v.37zM21.9 9.75H18v-2.25h1.13c.49 0 .87.39.87.88v.5c.55-.02 1.1-.02 1.65-.02.16 0 .3 0 .45.02v.87zm-11.25 0H6.75v-2.25h1.13c.49 0 .87.39.87.88v.5c.55-.02 1.1-.02 1.65-.02.16 0 .3 0 .45.02v.87zM22.5 12h-21c-.49 0-.88.39-.88.88v.25c0 .49.39.87.88.87h21c.49 0 .88-.39.88-.88v-.25c0-.48-.39-.87-.88-.87zm-1.62 4.16c-.44 0-.8.36-.8.81v3.31c0 .44.36.8.8.8h.01c.44 0 .8-.36.8-.8v-3.31c0-.45-.35-.81-.79-.81zM11.25 21v-5.25H9.75V21h1.5zm-5.25 0v-5.25H4.5V21h1.5zm-3 0v-5.25H1.5V21h1.5z"/>
    </svg>
);

export const ZoomIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} color="#2D8CFF">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.58 12.5l-3.32-1.9c-.31-.18-.51-.51-.51-.88v-3.4c0-.75.61-1.36 1.36-1.36s1.36.61 1.36 1.36v2.79l2.5 1.45c.66.38.88 1.2.5 1.86-.38.66-1.2.88-1.86.5z"/>
    </svg>
);

// --- Admin & Auth Icons --- //
export const GoogleIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className} width="24px" height="24px">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.617-3.356-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.904,36.213,44,30.556,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
);
export const DashboardIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
);
export const UsersIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.952a4.5 4.5 0 014.5 0m-4.5 0a4.5 4.5 0 00-4.5 0m3.75 0H7.5a3.75 3.75 0 01-3.75-3.75V8.25c0-2.071 1.679-3.75 3.75-3.75h6c2.071 0 3.75 1.679 3.75 3.75v3.75c0 2.071-1.679 3.75-3.75 3.75z" />
    </svg>
);
export const EditIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 19.82a2.25 2.25 0 01-1.06.59l-3 1 .998-2.995a2.25 2.25 0 01.59-1.06l10.582-10.582z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L16.862 4.487" />
    </svg>
);
export const UserIcon: React.FC<{className?: string}> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);
export const EmailIcon: React.FC<{className?: string}> = ({ className = "h-5 w-5" }) => (
     <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);
export const PasswordIcon: React.FC<{className?: string}> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);
export const LogoutIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
);
export const TrashIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-4 h-4"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);
export const BatchIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 00-2.25 2.25v6" />
    </svg>
);
