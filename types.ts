

import type React from 'react';

export type TranslationMode = 'chat' | 'script' | 'book' | 'meetings' | 'email' | 'transcriber';

export type TranscriptionStyle = 'normal' | 'interview';

export type View = 'chat' | 'library' | 'pricing' | 'payment' | 'terms' | 'privacy' | 'contact' | 'paymentSuccess' | 'live' | 'image' | 'about' | 'demo' | 'useCases' | 'testimonials' | 'motion';

export type MeetingMode = 'live' | 'upload';

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface Language {
  code: string;
  name:string;
}

export interface Tone {
  name: string;
  emoji: string;
  description: string;
}

export interface TranslationResult {
  directTranslation: string;
  culturallyAwareTranslation: string;
  explanation: string;
  pronunciation?: string;
}

export interface MessageAttachment {
    name: string;
    type: string;
}

export interface GroundingSource {
    uri: string;
    title: string;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  role: 'user' | 'ai';
  originalText: string;
  translation?: TranslationResult;
  rating?: 'good' | 'bad';
  attachments?: MessageAttachment[];
  groundingSources?: GroundingSource[];
  imageURL?: string;
  originalAudioFileName?: string;
  isOfflineTranslation?: boolean;
  created_at: string;
}

export interface AfriTranslateModel {
  name: string;
  price?: string;
  features?: string[];
  isFeatured?: boolean;
}

export interface Conversation {
  id: number;
  user_id: string;
  title: string;
  messages: ChatMessage[];
  sourceLang: string;
  targetLang: string;
  tone: string;
  created_at: string;
}

export interface AddOn {
  name: string;
  description: string;
  price: string;
  icon: React.FC<{className?: string}>;
  features?: string[];
}

export type LibraryItemType = 'Proverb' | 'Idiom' | 'Word' | 'Phrase' | 'Sentence' | 'Paragraph';

export interface LibraryItem {
  id: number;
  type: LibraryItemType;
  text: string;
  source: string;
  target: string;
  tone: string;
  meaning: string;
  audioUrl?: string; // URL for the recorded voice input
}

export type UserPlan = 'Free' | 'Basic' | 'Premium' | 'Training' | 'Entreprise';

export type UserRole = 'user' | 'admin';

export interface User {
  id: string; // Supabase auth user id (UUID)
  name: string;
  email: string;
  role: UserRole;
  plan: UserPlan;
}

// --- Script Translator AI Toolkit Types --- //
export type AiAnalysisTool = 'synopsis' | 'characters' | 'cultural' | 'audience';

export interface Synopsis {
  logline: string;
  synopsis: string;
}

export interface CharacterProfile {
  name: string;
  description: string;
  motivation: string;
  emotionalArc: string;
}

export interface CulturalAdaptation {
  original: string;
  adapted: string;
  reason: string;
}

export interface CulturalReport {
  summary: string;
  adaptations: CulturalAdaptation[];
}

export interface AudienceReception {
  targetDemographic: string;
  keyStrengths: string[];
  potentialChallenges: string[];
  genreAppeal: string;
}