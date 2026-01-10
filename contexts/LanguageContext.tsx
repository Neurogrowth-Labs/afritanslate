
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { TRANSLATIONS } from '../i18n/translations';

type LanguageCode = keyof typeof TRANSLATIONS;

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: keyof typeof TRANSLATIONS['en']) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<LanguageCode>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_language') as LanguageCode;
    if (savedLang && TRANSLATIONS[savedLang]) {
      setLanguage(savedLang);
      document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = savedLang;
    }
  }, []);

  const handleSetLanguage = (lang: LanguageCode) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const t = (key: keyof typeof TRANSLATIONS['en']) => {
    // @ts-ignore
    return TRANSLATIONS[language][key] || TRANSLATIONS['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, isRTL: language === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
