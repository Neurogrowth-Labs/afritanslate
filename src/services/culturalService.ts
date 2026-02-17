import { supabase } from '../../supabaseClient';

export interface CulturalInsight {
  id?: number;
  translation_id: number;
  risk_score: number;
  tone_analysis: string;
  cultural_notes: any[];
  risk_flags: any[];
}

export interface BrandGlossaryTerm {
  id?: number;
  user_id?: string;
  term: string;
  preferred_translation: string;
  forbidden_terms: string[];
  context_note?: string;
}

// Save cultural insights for a translation
export async function saveCulturalInsight(insight: CulturalInsight) {
  const { data, error } = await supabase
    .from('cultural_insights')
    .insert(insight)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Get cultural insights for a specific message
export async function getCulturalInsights(translationId: number) {
  const { data, error } = await supabase
    .from('cultural_insights')
    .select('*')
    .eq('translation_id', translationId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // Ignore "not found"
  return data;
}

// Save a brand glossary term
export async function saveBrandGlossaryTerm(term: BrandGlossaryTerm) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  
  const { data, error } = await supabase
    .from('brand_glossaries')
    .insert({ ...term, user_id: user.id })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Get all glossary terms for current user
export async function getUserGlossary() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  
  const { data, error } = await supabase
    .from('brand_glossaries')
    .select('*')
    .eq('user_id', user.id);
  
  if (error) throw error;
  return data || [];
}

// Check if text contains forbidden terms
export async function checkGlossaryCompliance(text: string) {
  const glossary = await getUserGlossary();
  const violations: Array<{ term: string; forbidden: string }> = [];
  
  glossary.forEach(entry => {
    entry.forbidden_terms?.forEach(forbidden => {
      if (text.toLowerCase().includes(forbidden.toLowerCase())) {
        violations.push({ term: entry.term, forbidden });
      }
    });
  });
  
  return violations;
}
