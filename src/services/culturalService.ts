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
  brand_name?: string;
  source_lang?: string;
  target_lang?: string;
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

// Save or update a brand glossary term
export async function saveBrandGlossaryTerm(userId: string, term: BrandGlossaryTerm) {
  const { data, error } = await supabase
    .from('brand_glossaries')
    .upsert({ ...term, user_id: userId })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Delete a glossary term
export async function deleteGlossaryTerm(id: number) {
  const { error } = await supabase
    .from('brand_glossaries')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
export async function getUserGlossary(userId: string) {
  const { data, error } = await supabase
    .from('brand_glossaries')
    .select('*')
    .eq('user_id', userId);
  
  if (error) throw error;
  return data || [];
}

// Check if text contains forbidden terms
export async function checkGlossaryCompliance(text: string, userId?: string) {
  if (!userId) {
    return [];
  }

  const glossary = await getUserGlossary(userId);
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
