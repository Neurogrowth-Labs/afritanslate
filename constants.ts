import React from 'react';
import type { Language, AfriTranslateModel, AddOn, LibraryItem, Tone } from './types';
import { VoiceIcon, OfflineIcon, IndustryIcon } from './components/Icons';

export const LANGUAGES: Language[] = [
  { code: 'ab', name: 'Abkhazian' },
  { code: 'aa', name: 'Afar' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'ak', name: 'Akan (Twi)' },
  { code: 'sq', name: 'Albanian' },
  { code: 'am', name: 'Amharic' },
  { code: 'ar', name: 'Arabic' },
  { code: 'an', name: 'Aragonese' },
  { code: 'hy', name: 'Armenian' },
  { code: 'as', name: 'Assamese' },
  { code: 'av', name: 'Avaric' },
  { code: 'ae', name: 'Avestan' },
  { code: 'ay', name: 'Aymara' },
  { code: 'az', name: 'Azerbaijani' },
  { code: 'bm', name: 'Bambara' },
  { code: 'ba', name: 'Bashkir' },
  { code: 'eu', name: 'Basque' },
  { code: 'be', name: 'Belarusian' },
  { code: 'bn', name: 'Bengali' },
  { code: 'bem', name: 'Bemba' },
  { code: 'ber', name: 'Berber' },
  { code: 'bi', name: 'Bislama' },
  { code: 'bs', name: 'Bosnian' },
  { code: 'br', name: 'Breton' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'my', name: 'Burmese' },
  { code: 'ca', name: 'Catalan' },
  { code: 'ch', name: 'Chamorro' },
  { code: 'ce', name: 'Chechen' },
  { code: 'ny', name: 'Chewa (Nyanja)' },
  { code: 'zh', name: 'Chinese (Mandarin)' },
  { code: 'cv', name: 'Chuvash' },
  { code: 'kw', name: 'Cornish' },
  { code: 'co', name: 'Corsican' },
  { code: 'cr', name: 'Cree' },
  { code: 'hr', name: 'Croatian' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'dv', name: 'Divehi' },
  { code: 'nl', name: 'Dutch' },
  { code: 'dz', name: 'Dzongkha' },
  { code: 'en', name: 'English' },
  { code: 'eo', name: 'Esperanto' },
  { code: 'et', name: 'Estonian' },
  { code: 'ee', name: 'Ewe' },
  { code: 'fo', name: 'Faroese' },
  { code: 'fj', name: 'Fijian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'ff', name: 'Fula' },
  { code: 'gl', name: 'Galician' },
  { code: 'lg', name: 'Ganda' },
  { code: 'ka', name: 'Georgian' },
  { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' },
  { code: 'gn', name: 'Guarani' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'ht', name: 'Haitian Creole' },
  { code: 'ha', name: 'Hausa' },
  { code: 'he', name: 'Hebrew' },
  { code: 'hz', name: 'Herero' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ho', name: 'Hiri Motu' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'is', name: 'Icelandic' },
  { code: 'io', name: 'Ido' },
  { code: 'ig', name: 'Igbo' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ia', name: 'Interlingua' },
  { code: 'ie', name: 'Interlingue' },
  { code: 'iu', name: 'Inuktitut' },
  { code: 'ik', name: 'Inupiaq' },
  { code: 'ga', name: 'Irish' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'jv', name: 'Javanese' },
  { code: 'kl', name: 'Kalaallisut' },
  { code: 'kn', name: 'Kannada' },
  { code: 'kr', name: 'Kanuri' },
  { code: 'ks', name: 'Kashmiri' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'km', name: 'Khmer' },
  { code: 'ki', name: 'Kikuyu' },
  { code: 'rw', name: 'Kinyarwanda' },
  { code: 'ky', name: 'Kirghiz' },
  { code: 'kv', name: 'Komi' },
  { code: 'kg', name: 'Kongo' },
  { code: 'ko', name: 'Korean' },
  { code: 'ku', name: 'Kurdish' },
  { code: 'kj', name: 'Kwanyama' },
  { code: 'lo', name: 'Lao' },
  { code: 'la', name: 'Latin' },
  { code: 'lv', name: 'Latvian' },
  { code: 'li', name: 'Limburgish' },
  { code: 'ln', name: 'Lingala' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'lu', name: 'Luba-Katanga' },
  { code: 'lb', name: 'Luxembourgish' },
  { code: 'mk', name: 'Macedonian' },
  { code: 'mg', name: 'Malagasy' },
  { code: 'ms', name: 'Malay' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mt', name: 'Maltese' },
  { code: 'gv', name: 'Manx' },
  { code: 'mi', name: 'Maori' },
  { code: 'mr', name: 'Marathi' },
  { code: 'mh', name: 'Marshallese' },
  { code: 'mn', name: 'Mongolian' },
  { code: 'na', name: 'Nauru' },
  { code: 'nv', name: 'Navajo' },
  { code: 'nd', name: 'Ndebele, North' },
  { code: 'nr', name: 'Ndebele, South' },
  { code: 'ng', name: 'Ndonga' },
  { code: 'ne', name: 'Nepali' },
  { code: 'no', name: 'Norwegian' },
  { code: 'nb', name: 'Norwegian Bokmål' },
  { code: 'nn', name: 'Norwegian Nynorsk' },
  { code: 'oc', name: 'Occitan' },
  { code: 'oj', name: 'Ojibwa' },
  { code: 'cu', name: 'Old Church Slavonic' },
  { code: 'or', name: 'Oriya' },
  { code: 'om', name: 'Oromo' },
  { code: 'os', name: 'Ossetian' },
  { code: 'pi', name: 'Pali' },
  { code: 'ps', name: 'Pashto' },
  { code: 'fa', name: 'Persian' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'qu', name: 'Quechua' },
  { code: 'ro', name: 'Romanian' },
  { code: 'rm', name: 'Romansh' },
  { code: 'rn', name: 'Rundi' },
  { code: 'ru', name: 'Russian' },
  { code: 'sm', name: 'Samoan' },
  { code: 'sg', name: 'Sango' },
  { code: 'sa', name: 'Sanskrit' },
  { code: 'sc', name: 'Sardinian' },
  { code: 'gd', name: 'Scottish Gaelic' },
  { code: 'sr', name: 'Serbian' },
  { code: 'sn', name: 'Shona' },
  { code: 'ii', name: 'Sichuan Yi' },
  { code: 'sd', name: 'Sindhi' },
  { code: 'si', name: 'Sinhala' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'so', name: 'Somali' },
  { code: 'st', name: 'Sotho, Southern' },
  { code: 'es', name: 'Spanish' },
  { code: 'su', name: 'Sundanese' },
  { code: 'sw', name: 'Swahili' },
  { code: 'ss', name: 'Swati' },
  { code: 'sv', name: 'Swedish' },
  { code: 'tl', name: 'Tagalog' },
  { code: 'ty', name: 'Tahitian' },
  { code: 'tg', name: 'Tajik' },
  { code: 'ta', name: 'Tamil' },
  { code: 'tt', name: 'Tatar' },
  { code: 'te', name: 'Telugu' },
  { code: 'th', name: 'Thai' },
  { code: 'bo', name: 'Tibetan' },
  { code: 'ti', name: 'Tigrinya' },
  { code: 'to', name: 'Tonga' },
  { code: 'ts', name: 'Tsonga' },
  { code: 'tn', name: 'Tswana' },
  { code: 'tr', name: 'Turkish' },
  { code: 'tk', name: 'Turkmen' },
  { code: 'ug', name: 'Uighur' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'ur', name: 'Urdu' },
  { code: 'uz', name: 'Uzbek' },
  { code: 've', name: 'Venda' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'vo', name: 'Volapük' },
  { code: 'wa', name: 'Walloon' },
  { code: 'cy', name: 'Welsh' },
  { code: 'fy', name: 'Western Frisian' },
  { code: 'wo', name: 'Wolof' },
  { code: 'xh', name: 'Xhosa' },
  { code: 'yi', name: 'Yiddish' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'za', name: 'Zhuang' },
  { code: 'zu', name: 'Zulu' },
];

export const TONES: Tone[] = [
  { name: 'Formal', emoji: '👔', description: 'For official documents, business letters, academic papers.' },
  { name: 'Informal', emoji: '👋', description: 'For casual conversations, social media, friendly emails.' },
  { name: 'Business', emoji: '💼', description: 'Professional and clear language for corporate communication.' },
  { name: 'Friendly', emoji: '😊', description: 'Warm, approachable, and personal.' },
  { name: 'Humorous', emoji: '😂', description: 'Playful, witty, and light-hearted.' },
  { name: 'Poetic', emoji: '📜', description: 'Lyrical, expressive, and artistic language.' },
  { name: 'Urgent', emoji: '❗', description: 'Direct and concise to convey importance and immediacy.' },
  { name: 'Diplomatic', emoji: '🤝', description: 'Tactful, polite, and careful for sensitive topics.' },
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
    price: '$9.99/mo',
    features: [
        '1,000 translations/month',
        'Access to all African languages',
        'Text-only translation',
        'Standard support'
    ]
  },
  { 
    name: 'Premium', 
    price: '$19.99/mo',
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
    price: '$49/mo',
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