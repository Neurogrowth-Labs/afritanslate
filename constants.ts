
import React from 'react';
import type { Language, AfriTranslateModel, AddOn, LibraryItem, Tone } from './types';
import { VoiceIcon, OfflineIcon, IndustryIcon } from './components/Icons';

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'sw', name: 'Swahili' },
  { code: 'ar', name: 'Arabic' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ha', name: 'Hausa' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'zu', name: 'Zulu' },
  { code: 'ig', name: 'Igbo' },
  { code: 'am', name: 'Amharic' },
  { code: 'rw', name: 'Kinyarwanda' },
  { code: 'ln', name: 'Lingala' },
  { code: 'wo', name: 'Wolof' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'so', name: 'Somali' },
  { code: 'xh', name: 'Xhosa' },
  { code: 'st', name: 'Sotho' },
  { code: 'tn', name: 'Tswana' },
  { code: 'ts', name: 'Tsonga' },
  { code: 'ss', name: 'Swati' },
  { code: 've', name: 'Venda' },
  { code: 'nr', name: 'Ndebele' },
  { code: 'ny', name: 'Chewa' },
  { code: 'sh', name: 'Shona' },
  { code: 'bem', name: 'Bemba' },
  { code: 'lg', name: 'Luganda' },
  { code: 'om', name: 'Oromo' },
  { code: 'ti', name: 'Tigrinya' },
  { code: 'ak', name: 'Akan (Twi)' },
  { code: 'bm', name: 'Bambara' },
  { code: 'ff', name: 'Fula' },
  { code: 'mg', name: 'Malagasy' },
  { code: 'sn', name: 'Shona' },
  { code: 'zh', name: 'Chinese (Mandarin)' },
  { code: 'es', name: 'Spanish' },
  { code: 'de', name: 'German' },
];

export const LANGUAGE_REGIONS: Record<string, string[]> = {
    'en': ['General', 'Nigeria (Pidgin)', 'South Africa', 'Kenya', 'Ghana', 'Liberia', 'UK', 'USA'],
    'fr': ['General', 'DRC (Kinshasa)', 'Senegal', 'Ivory Coast', 'Cameroon', 'France', 'Canada'],
    'pt': ['General', 'Angola', 'Mozambique', 'Cape Verde', 'Guinea-Bissau', 'Brazil', 'Portugal'],
    'ar': ['General (MSA)', 'Egypt', 'Morocco', 'Algeria', 'Sudan', 'Saudi Arabia', 'UAE'],
    'sw': ['General (Standard)', 'Tanzania', 'Kenya (Sheng)', 'DRC (Kingwana)'],
    'ha': ['General', 'Nigeria (Kano)', 'Niger', 'Ghana'],
    'yo': ['General', 'Nigeria (Lagos)', 'Benin'],
    'zu': ['General', 'KwaZulu-Natal', 'Gauteng (Urban)'],
    'ln': ['General', 'Kinshasa (Lingala Facile)', 'Brazzaville'],
    'es': ['General', 'Equatorial Guinea', 'Spain', 'Latin America'],
};

export const TONES: Tone[] = [
  { name: 'Formal', emoji: '👔', description: 'For official documents, business letters, academic papers.' },
  { name: 'Informal', emoji: '👋', description: 'For casual conversations, social media, friendly emails.' },
  { name: 'Business', emoji: '💼', description: 'Professional and clear language for corporate communication.' },
  { name: 'Friendly', emoji: '😊', description: 'Warm, approachable, and personal.' },
  { name: 'Humorous', emoji: '😂', description: 'Playful, witty, and light-hearted.' },
  { name: 'Poetic', emoji: '📜', description: 'Lyrical, expressive, and artistic language.' },
  { name: 'Urgent', emoji: '❗', description: 'Direct and concise to convey importance and immediacy.' },
  { name: 'Diplomatic', emoji: '🤝', description: 'Tactful, polite, and careful for sensitive topics.' },
  { name: 'Persuasive', emoji: '🔥', description: 'Convincing and impactful, ideal for sales.' },
  { name: 'Inspirational', emoji: '✨', description: 'Uplifting and visionary, ideal for awareness.' },
];

export const MOTION_DURATIONS = [
    '30s', '45s', '1m', '1m 30s', '1m 45s', '2m'
];

export const MOTION_CONTEXTS = [
    'Sales', 'Promotional', 'Awareness', 'Entertainment', 'Educational'
];

export const AFRITRANSLATE_MODELS: AfriTranslateModel[] = [
  { 
    name: 'Free', 
    features: [
        '100 translations/month',
        'Access to all languages',
        'Ads/branding watermark'
    ]
  },
  { 
    name: 'Basic', 
    price: '$2.99/month',
    features: [
        '1,000 translations/month',
        'Access to all African languages',
        'Text-only translation',
        'Standard support'
    ]
  },
  { 
    name: 'Premium', 
    price: '$7.99/month',
    isFeatured: true,
    features: [
        'Unlimited translations',
        'All supported languages + dialects',
        'Voice translation',
        'Offline mode',
        'Priority support'
    ]
  },
  { 
    name: 'Training', 
    price: '$12.99/month',
    features: [
        'Up to 10 users',
        '10,000 translations/ month',
        'WhatsApp/Telegram integration',
        'Team dashboard'
    ]
  },
  { 
    name: 'Entreprise', 
    features: [
        'Unlimited translations',
        'API & platform integration',
        'Custom language/ dialect support',
        'Data privacy & analytics',
        'White-label options',
        'Dedicated account manager'
    ]
  },
];

export const ADD_ONS: AddOn[] = [
    {
        name: 'Voice Pack',
        description: 'Translate spoken conversations in real-time.',
        price: '$4.99/mo',
        icon: VoiceIcon,
        features: ['Real-time voice-to-voice', 'Supports 10+ languages', 'Conversation mode']
    },
    {
        name: 'Offline Language Packs',
        description: 'Download languages for use without internet.',
        price: '$9.99 one-time',
        icon: OfflineIcon,
        features: ['Unlimited offline access', 'Perfect for travel', 'Download any language']
    },
    {
        name: 'Industry Packs',
        description: 'Terminology for legal, medical, and tech fields.',
        price: '$7.99/mo',
        icon: IndustryIcon,
        features: ['Legal, medical & tech terminology', 'Higher accuracy for jargon', 'Formal tone presets']
    },
];

export const LIVE_VOICES = [
  { id: 'Zephyr', name: 'Zephyr (Friendly Male)' },
  { id: 'Puck', name: 'Puck (Calm Male)' },
  { id: 'Charon', name: 'Charon (Deep Male)' },
  { id: 'Kore', name: 'Kore (Warm Female)' },
  { id: 'Fenrir', name: 'Fenrir (Serious Male)' },
];

export const FOOTER_LINKS: { [key: string]: { name: string; href: string }[] } = {};


export const MOCK_MEETING_TRANSCRIPT = `
Amara: Good morning, everyone. Thanks for joining. Let's kick off with the Q3 marketing campaign updates. Femi, how are we looking?

Femi: Morning, Amara. We're on track. The creative assets for the "Local Voices" campaign are finalized and have been sent to the regional teams for cultural review. We've received positive feedback from the Nigerian and Kenyan teams already.

Chidi: That's great to hear. I was a bit concerned about the proverb we used in the Swahili version. Did the Kenyan team have any notes on that?

Femi: They did. They suggested a slight wording change to make it more impactful for a younger audience. The meaning is preserved, but it sounds more contemporary. We've implemented that change.

Amara: Perfect. That's exactly why we have the review process. What's the timeline for the launch video?

Femi: The final cut is scheduled for delivery this Friday. It's looking really powerful. The video highlights three local artisans, and their stories are very compelling.

Amara: Excellent. Now, let's talk budget. Have we had any unexpected expenses?

Chidi: We're slightly over on the video production side due to some extra licensing fees for a music track. It's about a 5% overage on that line item, but we have some buffer in the digital ad spend that we can reallocate to cover it. Overall, we're still within the total budget.

Amara: Okay, I'm comfortable with that as long as the overall budget isn't impacted. Make sure that reallocation is documented, Chidi.

Chidi: Will do. I'll send you the updated budget sheet after this meeting.

Amara: Great. Final point: action items. Femi, you'll chase the final video delivery for Friday.

Femi: Correct.

Amara: Chidi, you'll update and circulate the budget reallocation document.

Chidi: Yes, by end of day.

Amara: And I will draft the internal announcement to the company about the campaign launch, which is set for two weeks from today. Anything else from anyone?

(Silence)

Amara: Alright, then. Great work, team. Let's make this our most successful campaign yet. Have a productive day.
`;
