import React from 'react';
import type { Tone } from '../types';

interface ToneSelectorProps {
  label: string;
  tones: Tone[];
  value: string;
  onChange: (value: string) => void;
}

const ToneSelector: React.FC<ToneSelectorProps> = ({ label, tones, value, onChange }) => {
  const selectedTone = tones.find(t => t.name === value);
  const id = `tone-selector-${label.toLowerCase().replace(/\s/g, '-')}`;

  return (
    <div className="w-full">
      <label htmlFor={id} className="text-sm font-medium text-text-secondary mb-1 block">{label}</label>
      <div className="relative">
        {selectedTone && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none z-10">
            {selectedTone.emoji}
          </span>
        )}
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-2 pl-10 bg-bg-main border border-border-default rounded-md shadow-sm focus:ring-2 focus:ring-accent focus:border-accent transition text-text-primary appearance-none"
        >
          {tones.map((tone) => (
            <option key={tone.name} value={tone.name}>
              {tone.emoji} {tone.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default ToneSelector;
