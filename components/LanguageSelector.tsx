import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Language } from '../types';
import { SearchIcon } from './Icons';

interface LanguageSelectorProps {
  label: string;
  languages: Language[];
  value: string;
  onChange: (value: string) => void;
}

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-text-secondary">
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ label, languages, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLanguage = useMemo(() => languages.find(lang => lang.code === value) || null, [languages, value]);

  const filteredLanguages = useMemo(() => {
    if (!searchTerm) return languages;
    return languages.filter(lang => lang.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [languages, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearchTerm('');
  };
  
  const id = `lang-selector-${label.toLowerCase()}`;

  return (
    <div className="flex flex-col w-full relative" ref={dropdownRef}>
      <label htmlFor={id} className="text-sm font-medium text-text-secondary mb-1">{label}</label>
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 flex items-center justify-between bg-bg-main border border-border-default rounded-md shadow-sm focus:ring-2 focus:ring-accent focus:border-accent transition text-text-primary text-left"
      >
        <span>{selectedLanguage?.name || 'Select Language'}</span>
        <ChevronDownIcon />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 w-full bg-bg-surface border border-border-default rounded-md shadow-lg z-20 animate-fade-in">
          <div className="p-2">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <SearchIcon className="w-4 h-4 text-text-secondary" />
                </div>
                <input
                    type="text"
                    placeholder="Search language..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-2 pl-9 bg-bg-main border border-border-default rounded-md text-sm focus:ring-2 focus:ring-accent focus:border-accent transition placeholder-text-secondary"
                    autoFocus
                />
            </div>
          </div>
          <ul className="max-h-60 overflow-y-auto p-1">
            {filteredLanguages.map(lang => (
              <li
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`p-2 text-sm rounded-md cursor-pointer ${value === lang.code ? 'bg-accent text-white' : 'hover:bg-border-default text-text-primary'}`}
              >
                {lang.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;