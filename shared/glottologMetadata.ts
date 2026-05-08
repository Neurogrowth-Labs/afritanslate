/**
 * Scientific (Glottolog) classification metadata used by the AfriTranslate
 * AI prompts to enforce structural rules per language family.
 *
 * Lives in `shared/` so the Vercel serverless functions in `api/` can read
 * it without importing `constants.ts`, which transitively pulls React, the
 * 7000-entry `LANGUAGES` array, and SVG icon components.
 */

export interface GlottologData {
    family: string;
    parent: string;
    glottocode: string;
    features: string;
}

export const GLOTTOLOG_METADATA: Record<string, GlottologData> = {
    sw: { family: 'Atlantic-Congo', parent: 'Northeast Coastal Bantu', features: 'Agglutinative, 18 Noun Classes, SVO', glottocode: 'swah1253' },
    yo: { family: 'Atlantic-Congo', parent: 'Yoruboid', features: 'Isolating, 3-Level Tone System, SVO, Serial Verbs', glottocode: 'yoru1245' },
    ha: { family: 'Afroasiatic', parent: 'West Chadic', features: 'Gender (M/F), Tone, Implosives/Ejectives, SVO', glottocode: 'haus1257' },
    zu: { family: 'Atlantic-Congo', parent: 'Nguni', features: 'Agglutinative, Clicks (q, c, x), 15+ Noun Classes', glottocode: 'zulu1248' },
    ig: { family: 'Atlantic-Congo', parent: 'Igboid', features: 'Tonal (High/Low/Downstep), Agglutinative, Vowel Harmony', glottocode: 'igbo1259' },
    am: { family: 'Afroasiatic', parent: 'Ethiosemitic', features: 'SOV, Ejectives, Palatalization, Gemination', glottocode: 'amha1242' },
    rw: { family: 'Atlantic-Congo', parent: 'Rwanda-Rundi', features: 'Complex Verbal Morphology, 16 Noun Classes, Tonal', glottocode: 'kiny1244' },
    ln: { family: 'Atlantic-Congo', parent: 'Bangi-Ntomba', features: 'Noun Classes, Vowel Harmony, SVO', glottocode: 'ling1263' },
    wo: { family: 'Atlantic-Congo', parent: 'Fula-Wolof', features: 'Noun Class (Consonant Mutation), Non-Tonal', glottocode: 'wolo1247' },
    so: { family: 'Afroasiatic', parent: 'Lowland East Cushitic', features: 'SOV, Tonal Accent, Gender, Pharyngeal Consonants', glottocode: 'soma1255' },
    xh: { family: 'Atlantic-Congo', parent: 'Nguni', features: 'Clicks (q, c, x), Noun Classes, Agglutinative', glottocode: 'xhos1239' },
    lg: { family: 'Atlantic-Congo', parent: 'West Nyanza', features: 'Agglutinative, Tonal, Noun Classes (Augments)', glottocode: 'gand1255' },
    om: { family: 'Afroasiatic', parent: 'Oromoid', features: 'SOV, Ejectives, Pitch Accent', glottocode: 'west2720' },
    ak: { family: 'Atlantic-Congo', parent: 'Potou-Tano', features: 'Tonal, Vowel Harmony, SVO', glottocode: 'akan1250' },
    bm: { family: 'Mande', parent: 'Bambara-Dyula', features: 'Tonal (High/Low), SOV, Isolating', glottocode: 'bamb1269' },
    ff: { family: 'Atlantic-Congo', parent: 'Senegambian', features: 'Noun Classes (Initial Mutation), SVO', glottocode: 'fula1264' }
};
