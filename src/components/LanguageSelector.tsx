import React, { useState, useRef, useEffect } from 'react';
import { Globe, Languages, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../types';

interface LanguageSelectorProps {
  variant?: 'header' | 'sidebar' | 'compact';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { language, setLanguage, supportedLanguages, currentLanguageInfo, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  if (variant === 'sidebar') {
    return (
      <div className={`w-full p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 ${className}`}>
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2 px-1">
          <span className="flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-blue-400" />
            <span>{t('selectLanguage', 'Language')}</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">{currentLanguageInfo.label}</span>
        </div>

        <div className="grid grid-cols-2 gap-1">
          {supportedLanguages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                id={`lang-btn-sidebar-${lang.code}`}
                type="button"
                onClick={() => setLanguage(lang.code)}
                title={lang.description}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <span className="text-sm">{lang.flag}</span>
                <span className="text-[11px] truncate w-full text-center mt-0.5">{lang.nativeLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        id="header-btn-language-selector"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
          isOpen
            ? 'bg-blue-600/30 text-blue-200 border-blue-400/50'
            : 'bg-slate-800 hover:bg-slate-700/90 text-slate-200 border-slate-700 hover:border-slate-600'
        }`}
        title="Change Language"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        <span className="text-base leading-none">{currentLanguageInfo.flag}</span>
        <span className="hidden sm:inline font-bold">{currentLanguageInfo.nativeLabel}</span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-slate-900 border border-slate-700/90 shadow-2xl z-50 overflow-hidden py-1.5 animate-in fade-in-50 zoom-in-95">
          <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <Languages className="w-3.5 h-3.5 text-blue-400" />
              <span>{t('changeLanguage', 'Select Language')}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">2 Languages</span>
          </div>

          <div className="p-1 space-y-1">
            {supportedLanguages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  id={`lang-option-${lang.code}`}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/20 text-white border border-blue-500/40'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl shrink-0 select-none">{lang.flag}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{lang.nativeLabel}</span>
                        <span className="text-[10px] text-slate-400 font-medium">({lang.label})</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {lang.description}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-blue-500/30 border border-blue-400/50 flex items-center justify-center shrink-0 ml-2">
                      <Check className="w-3 h-3 text-blue-300" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="px-3 py-1.5 border-t border-slate-800 bg-slate-950/60 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Housing Worlds CRM</span>
            <span className="text-emerald-400 font-semibold">Auto-saved</span>
          </div>
        </div>
      )}
    </div>
  );
};
