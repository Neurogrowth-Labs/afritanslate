import React, { useState, useEffect } from 'react';

interface Language {
  code: string;
  name: string;
  native?: string;
}

interface LanguageSelectorProps {
  value: string;
  onChange: (code: string) => void;
  label?: string;
  className?: string;
}

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili' },
  { code: 'zu', name: 'Zulu', native: 'isiZulu' },
  { code: 'xh', name: 'Xhosa', native: 'isiXhosa' },
  { code: 'af', name: 'Afrikaans', native: 'Afrikaans' },
  { code: 'yo', name: 'Yoruba', native: 'Yorùbá' },
  { code: 'ig', name: 'Igbo', native: 'Asụsụ Igbo' },
  { code: 'ha', name: 'Hausa', native: 'Hausa' },
  { code: 'am', name: 'Amharic', native: 'አማርኛ' },
  { code: 'om', name: 'Oromo', native: 'Afaan Oromoo' },
  { code: 'so', name: 'Somali', native: 'Soomaali' },
  { code: 'rw', name: 'Kinyarwanda', native: 'Ikinyarwanda' },
  { code: 'sn', name: 'Shona', native: 'chiShona' },
  { code: 'st', name: 'Sesotho', native: 'Sesotho' },
  { code: 'tn', name: 'Setswana', native: 'Setswana' },
  { code: 'ts', name: 'Tsonga', native: 'Xitsonga' },
  { code: 'wo', name: 'Wolof', native: 'Wolof' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'ss', name: 'Swati', native: 'siSwati' },
  { code: 'nr', name: 'Ndebele', native: 'isiNdebele' },
  { code: 've', name: 'Venda', native: 'Tshivenḓa' },
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  value, 
  onChange, 
  label,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedLang = LANGUAGES.find(l => l.code === value);
  
  const filteredLanguages = LANGUAGES.filter(lang =>
    lang.name.toLowerCase().includes(search.toLowerCase()) ||
    lang.native?.toLowerCase().includes(search.toLowerCase()) ||
    lang.code.toLowerCase().includes(search.toLowerCase())
  );

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearch('');
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearch('');
  };

  const handleBackdropClick = () => {
    setIsOpen(false);
    setSearch('');
  };

  return (
    <>
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {label}
          </label>
        )}
        
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-left flex items-center justify-between hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors"
        >
          <span className="text-gray-100 truncate">
            {selectedLang ? `${selectedLang.name}` : 'Select language'}
          </span>
          <span className="text-gray-400 ml-2">🌍</span>
        </button>
      </div>

      {/* Full-Screen Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-70 p-4"
          onClick={handleBackdropClick}
        >
          <div 
            className="bg-gray-800 border-2 border-gray-700 rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-100">Select Language</h3>
                <button
                  onClick={handleBackdropClick}
                  className="text-gray-400 hover:text-gray-200 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              
              {/* Search Input */}
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Search languages..."
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                autoFocus
              />
            </div>

            {/* Language List */}
            <div className="overflow-y-auto flex-1">
              {(() => {
                console.log('Filtered languages:', filteredLanguages);
                return null;
              })()}
              {filteredLanguages.length > 0 ? (
                <div className="p-2">
                  {filteredLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleSelect(lang.code)}
                      className={`w-full px-4 py-3 rounded-lg text-left flex items-center justify-between transition-all mb-1 ${
                        lang.code === value 
                          ? 'bg-yellow-600 text-black font-semibold shadow-lg' 
                          : 'text-gray-100 hover:bg-gray-700'
                      }`}
                    >
                      <span className="font-medium">{lang.name}</span>
                      <span className={`text-sm ${lang.code === value ? 'text-black opacity-70' : 'text-gray-400'}`}>
                        {lang.native}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-12 text-gray-500 text-center">
                  <p className="text-lg mb-2">🔍</p>
                  <p>No languages found</p>
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="p-3 border-t border-gray-700 text-center text-xs text-gray-500">
              Press <kbd className="px-2 py-1 bg-gray-700 rounded">ESC</kbd> to close
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LanguageSelector;
