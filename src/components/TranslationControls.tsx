import React from 'react';

interface TranslationControlsProps {
  targetLang: string;
  dialect: string;
  tone: string;
  formality: string;
  onDialectChange: (value: string) => void;
  onToneChange: (value: string) => void;
  onFormalityChange: (value: string) => void;
}

const DIALECT_OPTIONS: Record<string, string[]> = {
  sw: ['Standard', 'Kenya (Nairobi)', 'Tanzania (Dar es Salaam)', 'Congo (Kinshasa)'],
  yo: ['Standard', 'Lagos', 'Ibadan', 'Diaspora'],
  zu: ['Standard', 'Urban (Johannesburg)', 'Rural (KwaZulu-Natal)'],
  ar: ['Standard (MSA)', 'Egyptian', 'Moroccan (Darija)', 'Gulf', 'Levantine'],
  ha: ['Standard', 'Northern Nigeria', 'Niger'],
  default: ['Standard', 'Urban', 'Rural', 'Formal', 'Informal']
};

const TranslationControls: React.FC<TranslationControlsProps> = ({
  targetLang,
  dialect,
  tone,
  formality,
  onDialectChange,
  onToneChange,
  onFormalityChange,
}) => {
  const currentDialects = DIALECT_OPTIONS[targetLang] || DIALECT_OPTIONS.default;

  return (
    <div className="space-y-4 p-4 bg-bg-surface rounded-lg border border-white/10 shadow-xl">
      <h3 className="font-bold text-white mb-3 uppercase tracking-wider text-[10px]">Translation Settings</h3>
      
      {/* Dialect Selector */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Dialect
        </label>
        <select
          value={dialect}
          onChange={(e) => onDialectChange(e.target.value)}
          className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-md focus:ring-1 focus:ring-accent outline-none text-white transition-all"
        >
          {currentDialects.map(d => (
            <option key={d} value={d} className="bg-bg-surface">{d}</option>
          ))}
        </select>
      </div>
      
      {/* Tone Selector */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Tone
        </label>
        <select
          value={tone}
          onChange={(e) => onToneChange(e.target.value)}
          className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-md focus:ring-1 focus:ring-accent outline-none text-white transition-all"
        >
          <option value="Neutral" className="bg-bg-surface">Neutral</option>
          <option value="Marketing" className="bg-bg-surface">Marketing</option>
          <option value="Legal" className="bg-bg-surface">Legal</option>
          <option value="Street" className="bg-bg-surface">Street / Casual</option>
          <option value="Religious" className="bg-bg-surface">Religious</option>
          <option value="Corporate" className="bg-bg-surface">Corporate</option>
        </select>
      </div>
      
      {/* Formality Slider */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Formality: <span className="font-bold text-accent">{formality}</span>
        </label>
        <select
          value={formality}
          onChange={(e) => onFormalityChange(e.target.value)}
          className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-md focus:ring-1 focus:ring-accent outline-none text-white transition-all"
        >
          <option value="Low" className="bg-bg-surface">Low (Street)</option>
          <option value="Medium" className="bg-bg-surface">Medium (Professional)</option>
          <option value="High" className="bg-bg-surface">High (Diplomatic)</option>
        </select>
      </div>
    </div>
  );
};

export default TranslationControls;
