import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Language } from '../types';
import { SearchIcon, CheckIcon } from './Icons';

interface LanguageSelectorProps {
  label: string;
  languages: Language[];
  value: string;
  onChange: (value: string) => void;
}

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-text-secondary">
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
  
  const getHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) {
        return <span>{text}</span>;
    }
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <span key={i} className="font-bold text-accent bg-accent/20 rounded-sm">{part}</span>
                ) : (
                    part
                )
            )}
        </span>
    );
  };
  
  const id = `lang-selector-${label.toLowerCase()}`;

  return (
    <div className="flex flex-col w-full relative" ref={dropdownRef}>
      <label htmlFor={id} className="text-[10px] font-medium text-text-secondary mb-1">{label}</label>
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-1.5 flex items-center justify-between bg-bg-main border border-border-default rounded shadow-sm focus:ring-1 focus:ring-accent outline-none transition text-text-primary text-left text-[12px]"
      >
        <span className="truncate">{selectedLanguage?.name || 'Select'}</span>
        <ChevronDownIcon />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 w-full bg-bg-surface border border-border-default rounded shadow-lg z-50 animate-fade-in">
          <div className="p-1.5">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                    <SearchIcon className="w-3 h-3 text-text-secondary" />
                </div>
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-1 pl-7 bg-bg-main border border-border-default rounded text-[11px] focus:ring-1 focus:ring-accent outline-none transition placeholder-text-secondary"
                    autoFocus
                />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
            {filteredLanguages.map(lang => (
              <li
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`p-1.5 text-[11px] rounded cursor-pointer flex items-center justify-between ${value === lang.code ? 'bg-accent text-bg-main font-bold' : 'hover:bg-border-default text-text-primary'}`}
              >
                {getHighlightedText(lang.name, searchTerm)}
                {value === lang.code && <CheckIcon className="w-3.5 h-3.5" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;