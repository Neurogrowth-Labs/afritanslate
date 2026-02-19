import React, { useState } from 'react';
import TranslationControls from './TranslationControls';
import CulturalInsightsPanel from './CulturalInsightsPanel';
import LanguageSelector from './LanguageSelector';
import { translateWithCulture, CulturalTranslationResult } from '../../services/geminiService';
import { saveCulturalInsight } from '../services/culturalService';
import { SAMPLE_TRANSLATIONS } from '../data/sampleTranslations';

const TranslationStudio: React.FC = () => {
  // Input/Output State
  const [sourceText, setSourceText] = useState('');
  const [targetLang, setTargetLang] = useState('sw');
  const [sourceLang, setSourceLang] = useState('en');
  const [translationResult, setTranslationResult] = useState<CulturalTranslationResult | null>(null);
  
  // Translation Settings State
  const [dialect, setDialect] = useState('standard');
  const [tone, setTone] = useState<'Marketing' | 'Legal' | 'Street' | 'Religious' | 'Corporate' | 'Neutral'>('Neutral');
  const [formality, setFormality] = useState<'High' | 'Medium' | 'Low'>('Medium');
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSamples, setShowSamples] = useState(false);

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      setError('Please enter text to translate');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await translateWithCulture(sourceText, {
        targetLang,
        sourceLang,
        dialect,
        tone,
        formality,
        includeCulturalNotes: true
      });

      setTranslationResult(result);
    } catch (err) {
      console.error('Translation error:', err);
      setError('Translation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSourceText('');
    setTranslationResult(null);
    setError(null);
  };

  const loadSample = (sample: typeof SAMPLE_TRANSLATIONS[0]) => {
    setSourceText(sample.sourceText);
    setSourceLang(sample.sourceLang);
    setTargetLang(sample.targetLang);
    setDialect(sample.dialect);
    setTone(sample.tone);
    setFormality(sample.formality);
    setShowSamples(false);
    // Auto-translate after loading
    setTimeout(() => handleTranslate(), 500);
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
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Translation Studio</h1>
            <p className="text-sm text-gray-600">Professional, culturally-intelligent translation</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => setShowSamples(!showSamples)}
                className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-md flex items-center gap-2"
              >
                ⚡ Try Samples
              </button>
              
              {showSamples && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50">
                  <div className="p-2 border-b border-gray-700">
                    <p className="text-xs text-gray-400">Quick Demo Examples</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {SAMPLE_TRANSLATIONS.map((sample) => (
                      <button
                        key={sample.id}
                        onClick={() => loadSample(sample)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-700 border-b border-gray-700 last:border-b-0"
                      >
                        <p className="text-sm font-medium text-gray-100">{sample.title}</p>
                        <p className="text-xs text-gray-400 mt-1 truncate">{sample.sourceText}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 border border-gray-700 rounded-md hover:bg-gray-800"
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
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">Source Text</h2>
              <div className="w-64">
                <LanguageSelector
                  value={sourceLang}
                  onChange={setSourceLang}
                  label=""
                />
              </div>
            </div>
            
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Enter text to translate..."
              className="flex-1 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            
            <div className="text-xs text-gray-500 mt-2">
              {sourceText.length} characters
            </div>
          </div>

          {/* Translation Controls */}
          <TranslationControls
            dialect={dialect}
            tone={tone}
            formality={formality}
            onDialectChange={setDialect}
            onToneChange={(val) => setTone(val as any)}
            onFormalityChange={(val) => setFormality(val as any)}
          />

          {/* Translate Button */}
          <button
            onClick={handleTranslate}
            disabled={isLoading || !sourceText.trim()}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-600 disabled:to-gray-700 text-black font-bold py-3 rounded-lg transition-all shadow-lg disabled:shadow-none"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⚙️</span>
                Analyzing Cultural Context...
              </span>
            ) : (
              '🌍 Translate with Cultural Intelligence'
            )}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>

        {/* CENTER PANEL: Translation Output */}
        <div className="lg:col-span-4 bg-white rounded-lg border border-gray-200 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Translation</h2>
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
              <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {translationResult.translation}
                </p>
              </div>
              
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(translationResult.translation)}
                  className="flex-1 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  📋 Copy
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  💾 Export
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-lg mb-2">🌍</p>
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
