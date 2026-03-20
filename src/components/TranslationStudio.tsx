import React, { useState, useEffect, useRef } from 'react';
import TranslationControls from './TranslationControls';
import CulturalInsightsPanel from './CulturalInsightsPanel';
import LanguageSelector from './LanguageSelector';
import { translateWithCulture, CulturalTranslationResult } from '../../services/geminiService';
import { saveBrandGlossaryTerm, getUserGlossary, BrandGlossaryTerm } from '../services/culturalService';
import { SAMPLE_TRANSLATIONS } from '../data/sampleTranslations';

const GlossaryDrawer: React.FC<{ isOpen: boolean, onClose: () => void, userId: string }> = ({ isOpen, onClose, userId }) => {
  const [terms, setTerms] = useState<BrandGlossaryTerm[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newTerm, setNewTerm] = useState<BrandGlossaryTerm>({ term: '', preferred_translation: '', forbidden_terms: [] });
  const [forbiddenText, setForbiddenText] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadGlossary();
    }
  }, [isOpen]);

  const loadGlossary = async () => {
    try {
      const data = await getUserGlossary(userId);
      setTerms(data as BrandGlossaryTerm[]);
    } catch (err) {
      console.error('Failed to load glossary:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const termToSave = {
        ...newTerm,
        forbidden_terms: forbiddenText.split(',').map(t => t.trim()).filter(t => t)
      };
      await saveBrandGlossaryTerm(userId, termToSave);
      setNewTerm({ term: '', preferred_translation: '', forbidden_terms: [] });
      setForbiddenText('');
      setShowForm(false);
      loadGlossary();
    } catch (err) {
      console.error('Failed to save term:', err);
    }
  };

  return (
    <div className={`fixed inset-y-0 right-0 w-[320px] bg-bg-surface border-l border-white/10 shadow-2xl z-[60] transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Brand Glossary</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-white">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {terms.map((t, i) => (
            <div key={i} className="p-3 bg-black/20 rounded-md border border-white/5">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-white text-sm">{t.term}</span>
                <span className="text-accent text-xs">→</span>
                <span className="font-medium text-white text-sm">{t.preferred_translation}</span>
              </div>
              {t.forbidden_terms && t.forbidden_terms.length > 0 && (
                <div className="mt-2">
                  <p className="text-[9px] text-red-400 font-bold uppercase">Forbidden:</p>
                  <p className="text-xs text-red-400/70">{t.forbidden_terms.join(', ')}</p>
                </div>
              )}
            </div>
          ))}
          {terms.length === 0 && !showForm && (
            <p className="text-center text-text-secondary text-sm py-10 opacity-50">No terms yet.</p>
          )}
        </div>

        {showForm ? (
          <form onSubmit={handleSave} className="space-y-3 bg-black/30 p-3 rounded-lg border border-white/10 animate-fade-in">
            <input 
              placeholder="Term" 
              className="w-full bg-bg-surface border border-white/10 p-2 rounded text-xs text-white"
              value={newTerm.term}
              onChange={e => setNewTerm({...newTerm, term: e.target.value})}
              required
            />
            <input 
              placeholder="Preferred Translation" 
              className="w-full bg-bg-surface border border-white/10 p-2 rounded text-xs text-white"
              value={newTerm.preferred_translation}
              onChange={e => setNewTerm({...newTerm, preferred_translation: e.target.value})}
              required
            />
            <textarea 
              placeholder="Forbidden Terms (comma separated)" 
              className="w-full bg-bg-surface border border-white/10 p-2 rounded text-xs text-white h-16 resize-none"
              value={forbiddenText}
              onChange={e => setForbiddenText(e.target.value)}
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-accent text-black font-bold py-2 rounded text-xs">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-white/5 text-white py-2 rounded text-xs">Cancel</button>
            </div>
          </form>
        ) : (
          <button 
            onClick={() => setShowForm(true)}
            className="w-full py-2 bg-white/5 border border-white/10 text-white rounded-md text-sm hover:bg-white/10 transition-all"
          >
            + Add Term
          </button>
        )}
      </div>
    </div>
  );
};

interface TranslationStudioProps {
  userId: string;
}

const TranslationStudio: React.FC<TranslationStudioProps> = ({ userId }) => {
  // Input/Output State
  const [sourceText, setSourceText] = useState('');
  const [targetLang, setTargetLang] = useState('sw');
  const [sourceLang, setSourceLang] = useState('en');
  const [translationResult, setTranslationResult] = useState<CulturalTranslationResult | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  
  // Translation Settings State
  const [dialect, setDialect] = useState('Standard');
  const [tone, setTone] = useState<'Marketing' | 'Legal' | 'Street' | 'Religious' | 'Corporate' | 'Neutral'>('Neutral');
  const [formality, setFormality] = useState<'High' | 'Medium' | 'Low'>('Medium');
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isNaturalizing, setIsNaturalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSamples, setShowSamples] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTranslate = async (isNaturalize: boolean = false) => {
    const textToProcess = isNaturalize ? translationResult?.translation : sourceText;
    if (!textToProcess?.trim()) {
      setError(isNaturalize ? 'No translation to naturalize' : 'Please enter text to translate');
      return;
    }

    if (isNaturalize) setIsNaturalizing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const result = await translateWithCulture(textToProcess, {
        targetLang,
        sourceLang,
        dialect,
        tone,
        formality,
        includeCulturalNotes: true
      }, isNaturalize);

      setTranslationResult(result);
    } catch (err) {
      console.error('Translation error:', err);
      setError(`${isNaturalize ? 'Naturalization' : 'Translation'} failed. Please try again.`);
    } finally {
      setIsLoading(false);
      setIsNaturalizing(false);
    }
  };

  const handleClear = () => {
    setSourceText('');
    setTranslationResult(null);
    setError(null);
    setFilename(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSourceText(event.target?.result as string);
        setFilename(file.name);
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.docx') || file.name.endsWith('.pdf')) {
      alert("Coming Soon - only .txt supported currently");
    } else {
      setError('Unsupported file format. Please upload a .txt file.');
    }
  };

  const loadSample = (sample: typeof SAMPLE_TRANSLATIONS[0]) => {
    setSourceText(sample.sourceText);
    setSourceLang(sample.sourceLang);
    setTargetLang(sample.targetLang);
    setDialect(sample.dialect);
    setTone(sample.tone);
    setFormality(sample.formality);
    setShowSamples(false);
    setFilename(null);
    // Auto-translate after loading
    setTimeout(() => handleTranslate(), 500);
  };

  const highlightRisks = (text: string, riskFlags: CulturalTranslationResult['risk_flags']) => {
    if (!riskFlags || riskFlags.length === 0) return text;

    let highlightedText: (string | JSX.Element)[] = [text];

    riskFlags.forEach(flag => {
      const newHighlightedText: (string | JSX.Element)[] = [];
      highlightedText.forEach(part => {
        if (typeof part !== 'string') {
          newHighlightedText.push(part);
          return;
        }

        const segments = part.split(flag.phrase);
        segments.forEach((segment, i) => {
          newHighlightedText.push(segment);
          if (i < segments.length - 1) {
            const className = flag.severity === 'high' 
              ? "bg-red-900/50 text-red-300 rounded px-1 cursor-help border-b border-red-500"
              : "bg-yellow-900/50 text-yellow-300 rounded px-1 cursor-help border-b border-yellow-500";
            
            newHighlightedText.push(
              <span key={`${flag.phrase}-${i}`} className={className} title={flag.reason}>
                {flag.phrase}
              </span>
            );
          }
        });
      });
      highlightedText = newHighlightedText;
    });

    return highlightedText;
  };

  const handleDownload = () => {
    if (!translationResult) return;

    const content = `
===========================================
AFRITRANSLATE - TRANSLATION EXPORT
===========================================

SOURCE TEXT:
${sourceText}

TRANSLATION:
${translationResult.translation}

-------------------------------------------
CULTURAL INSIGHTS SUMMARY
-------------------------------------------

Risk Score: ${translationResult.risk_score}/100

Tone Analysis:
${translationResult.tone_analysis}

Cultural Notes:
${translationResult.cultural_notes.map((note, i) => `${i + 1}. ${note}`).join('\n')}

Risk Flags:
${translationResult.risk_flags.length > 0 
  ? translationResult.risk_flags.map((flag, i) => 
      `${i + 1}. [${flag.severity.toUpperCase()}] ${flag.phrase}\n   Reason: ${flag.reason}`
    ).join('\n')
  : 'No risk flags detected'}

-------------------------------------------
Translation Settings:
- Source Language: ${sourceLang}
- Target Language: ${targetLang}
- Dialect: ${dialect}
- Tone: ${tone}
- Formality: ${formality}

Generated: ${new Date().toLocaleString()}
===========================================
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `translation-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-bg-main relative">
      <GlossaryDrawer isOpen={isGlossaryOpen} onClose={() => setIsGlossaryOpen(false)} userId={userId} />
      {/* Header */}
      <div className="bg-bg-surface/50 backdrop-blur-md border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Translation Studio</h1>
            <p className="text-sm text-text-secondary">Professional, culturally-intelligent translation</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsGlossaryOpen(true)}
              className="px-4 py-2 text-sm text-text-secondary hover:text-white border border-white/10 rounded-md hover:bg-white/5 transition-all flex items-center gap-2"
            >
              📚 Glossary
            </button>
            <div className="relative">
              <button
                onClick={() => setShowSamples(!showSamples)}
                className="px-4 py-2 text-sm text-black bg-accent hover:bg-white hover:text-accent font-bold rounded-md flex items-center gap-2 transition-all"
              >
                ⚡ Try Samples
              </button>
              
              {showSamples && (
                <div className="absolute right-0 mt-2 w-64 bg-bg-surface border border-white/10 rounded-md shadow-lg z-50">
                  <div className="p-2 border-b border-white/10">
                    <p className="text-xs text-text-secondary">Quick Demo Examples</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {SAMPLE_TRANSLATIONS.map((sample) => (
                      <button
                        key={sample.id}
                        onClick={() => loadSample(sample)}
                        className="w-full px-4 py-3 text-left hover:bg-white/5 border-b border-white/5 last:border-b-0"
                      >
                        <p className="text-sm font-medium text-white">{sample.title}</p>
                        <p className="text-xs text-text-secondary mt-1 truncate">{sample.sourceText}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm text-text-secondary hover:text-white border border-white/10 rounded-md hover:bg-white/5 transition-all"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Main 3-Panel Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-6 overflow-hidden">
        
        {/* LEFT PANEL: Source Input */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="bg-bg-surface rounded-lg border border-white/10 p-4 flex-1 flex flex-col shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-white">Source Text</h2>
              <div className="w-64">
                <LanguageSelector
                  value={sourceLang}
                  onChange={setSourceLang}
                  label=""
                />
              </div>
            </div>
            
            {filename && (
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-md mb-2 animate-fade-in w-fit">
                <span className="text-[10px] text-text-secondary">📄 {filename}</span>
                <button onClick={() => setFilename(null)} className="text-text-secondary hover:text-red-400 text-xs">&times;</button>
              </div>
            )}

            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Enter text to translate..."
              className="flex-1 w-full p-3 bg-black/20 border border-white/10 rounded-md focus:ring-1 focus:ring-accent outline-none text-white placeholder:text-text-secondary/50 resize-none transition-all"
            />
            
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-text-secondary">
                {sourceText.length} characters
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-accent hover:underline flex items-center gap-1"
              >
                📎 Upload .txt
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt" className="hidden" />
              </button>
            </div>
          </div>

          {/* Translation Controls */}
          <TranslationControls
            targetLang={targetLang}
            dialect={dialect}
            tone={tone}
            formality={formality}
            onDialectChange={setDialect}
            onToneChange={(val) => setTone(val as any)}
            onFormalityChange={(val) => setFormality(val as any)}
          />

          {/* Translate Button Group */}
          <div className="flex gap-2">
            <button
              onClick={() => handleTranslate(false)}
              disabled={isLoading || isNaturalizing || !sourceText.trim()}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-600 disabled:to-gray-700 text-black font-bold py-3 rounded-lg transition-all shadow-lg disabled:shadow-none text-sm"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⚙️</span>
                  Analyzing...
                </span>
              ) : (
                '🌍 Translate'
              )}
            </button>
            <button
              onClick={() => handleTranslate(true)}
              disabled={isLoading || isNaturalizing || !translationResult}
              className="flex-1 border border-accent/30 text-accent hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed font-bold py-3 rounded-lg transition-all text-sm"
            >
              {isNaturalizing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">✨</span>
                  Naturalizing...
                </span>
              ) : (
                '✨ Naturalize'
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>

        {/* CENTER PANEL: Translation Output */}
        <div className="lg:col-span-4 bg-bg-surface rounded-lg border border-white/10 p-4 flex flex-col shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white">Translation</h2>
            <div className="w-64">
              <LanguageSelector
                value={targetLang}
                onChange={setTargetLang}
                label=""
              />
            </div>
          </div>

          {translationResult ? (
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 bg-black/20 rounded-md border border-white/5 relative group">
                <div className="text-white whitespace-pre-wrap leading-relaxed">
                  {highlightRisks(translationResult.translation, translationResult.risk_flags)}
                </div>
                
                {translationResult.cultural_notes.length > 0 && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="relative group/tooltip">
                      <button className="text-text-secondary hover:text-accent">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <div className="absolute bottom-full right-0 mb-2 w-64 bg-bg-surface border border-white/10 p-3 rounded-lg shadow-2xl invisible group-hover/tooltip:visible z-50">
                        <p className="text-[10px] font-bold text-accent uppercase mb-2">Cultural Reasoning</p>
                        <ul className="space-y-1">
                          {translationResult.cultural_notes.map((note, i) => (
                            <li key={i} className="text-xs text-white list-disc ml-3">{note}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(translationResult.translation)}
                  className="flex-1 px-4 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-text-secondary hover:text-white rounded-md transition-all"
                >
                  📋 Copy
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 px-4 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-text-secondary hover:text-white rounded-md transition-all"
                >
                  💾 Export
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-secondary">
              <div className="text-center">
                <p className="text-lg mb-2 opacity-50">🌍</p>
                <p className="text-sm">Your translation will appear here</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Cultural Insights */}
        <div className="lg:col-span-4">
          <CulturalInsightsPanel
            riskScore={translationResult?.risk_score || 0}
            toneAnalysis={translationResult?.tone_analysis || ''}
            culturalNotes={translationResult?.cultural_notes || []}
            riskFlags={translationResult?.risk_flags || []}
          />
        </div>
      </div>
    </div>
  );
};

export default TranslationStudio;
