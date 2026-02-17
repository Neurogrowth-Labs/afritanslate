import React from 'react';

interface TranslationControlsProps {
  dialect: string;
  tone: string;
  formality: string;
  onDialectChange: (value: string) => void;
  onToneChange: (value: string) => void;
  onFormalityChange: (value: string) => void;
}

const TranslationControls: React.FC<TranslationControlsProps> = ({
  dialect,
  tone,
  formality,
  onDialectChange,
  onToneChange,
  onFormalityChange,
}) => {
  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="font-semibold text-gray-700 mb-3">Translation Settings</h3>
      
      {/* Dialect Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dialect
        </label>
        <select
          value={dialect}
          onChange={(e) => onDialectChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="standard">Standard</option>
          <option value="swahili-kenya">Swahili (Kenya)</option>
          <option value="swahili-tanzania">Swahili (Tanzania)</option>
          <option value="swahili-congo">Swahili (Congo)</option>
          <option value="zulu-south-africa">Zulu (South Africa)</option>
          <option value="yoruba-nigeria">Yoruba (Nigeria)</option>
          <option value="amharic-ethiopia">Amharic (Ethiopia)</option>
        </select>
      </div>
      
      {/* Tone Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tone
        </label>
        <select
          value={tone}
          onChange={(e) => onToneChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="Neutral">Neutral</option>
          <option value="Marketing">Marketing</option>
          <option value="Legal">Legal</option>
          <option value="Street">Street / Casual</option>
          <option value="Religious">Religious</option>
          <option value="Corporate">Corporate</option>
        </select>
      </div>
      
      {/* Formality Slider */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Formality: <span className="font-bold text-blue-600">{formality}</span>
        </label>
        <select
          value={formality}
          onChange={(e) => onFormalityChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="Low">Low (Street)</option>
          <option value="Medium">Medium (Professional)</option>
          <option value="High">High (Diplomatic)</option>
        </select>
      </div>
    </div>
  );
};

export default TranslationControls;
