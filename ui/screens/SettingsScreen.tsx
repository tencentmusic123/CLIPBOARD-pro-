import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { GOOGLE_TRANSLATE_LANGUAGES } from '../../util/Constants';

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  // --- Context State ---
  const { 
    isDarkTheme, toggleTheme, 
    accentColor, 
    readingFontSize, setReadingFontSize,
    isSmartRecognitionOn, toggleSmartRecognition,
    isPopupViewOn, togglePopupView,
    isAiSupportOn, toggleAiSupport,
    translateLanguage, setTranslateLanguage,
    autoBackupFrequency, setAutoBackupFrequency,
    backupDestination, setBackupDestination
  } = useSettings();

  // --- UI Local State ---
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showBackupFreq, setShowBackupFreq] = useState(false);
  const [showBackupDest, setShowBackupDest] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  // --- Refs for Click Outside Logic ---
  const freqRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (freqRef.current && !freqRef.current.contains(event.target as Node)) {
              setShowBackupFreq(false);
          }
          if (destRef.current && !destRef.current.contains(event.target as Node)) {
              setShowBackupDest(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Helpers ---
  // Sort languages: Selected one first, then alphabetical
  const sortedLanguages = useMemo(() => {
      const others = GOOGLE_TRANSLATE_LANGUAGES.filter(l => l !== translateLanguage).sort();
      return [translateLanguage, ...others];
  }, [translateLanguage]);

  const handleFeedbackSubmit = () => {
      if (!feedbackText.trim()) return;
      const subject = encodeURIComponent("CLIPBOARD MAX Feedback");
      const body = encodeURIComponent(feedbackText);
      window.location.href = `mailto:tencentmusic123@gmail.com?subject=${subject}&body=${body}`;
  };

  // --- Render Styles ---
  const containerClass = `min-h-screen flex flex-col font-sans animate-fade-in ${isDarkTheme ? 'bg-black text-white' : 'bg-gray-100 text-black'}`;
  const headerClass = `px-4 py-4 flex items-center sticky top-0 z-20 border-b ${isDarkTheme ? 'bg-black border-zinc-900' : 'bg-white border-gray-200'}`;
  const dropdownClass = `absolute top-full right-0 mt-1 z-10 w-40 shadow-xl border ${isDarkTheme ? 'bg-black border-zinc-700' : 'bg-white border-gray-300'}`;
  const dropdownItemClass = (active: boolean) => `w-full text-left px-3 py-2 text-sm hover:opacity-80 ${isDarkTheme ? 'text-white hover:bg-zinc-800' : 'text-black hover:bg-gray-100'} ${active ? (isDarkTheme ? 'bg-zinc-800' : 'bg-gray-100') : ''}`;

  return (
    <div className={containerClass}>
      
      {/* --- HEADER --- */}
      <header className={headerClass}>
         <button onClick={onBack} className="mr-4">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
             </svg>
         </button>
         <h1 className="text-xl tracking-wider font-normal" style={{ color: accentColor }}>CLIPBOARD MAX</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* --- SECTION: SETTINGS & PREFERENCE --- */}
          <section>
              <div className="flex items-center space-x-3 mb-6">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.58 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
                  <h2 className="text-lg font-light underline decoration-1 underline-offset-4">Settings and preference</h2>
              </div>

              <div className="space-y-6">
                  {/* Theme Selector */}
                  <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded-full border border-gray-500 flex items-center justify-center overflow-hidden">
                              <div className="w-3 h-6 bg-white"></div>
                              <div className="w-3 h-6 bg-black"></div>
                          </div>
                          <span className="text-lg">Theme</span>
                      </div>
                      <div className="flex items-center space-x-4">
                          <button onClick={() => toggleTheme('DARK')} className={isDarkTheme ? 'text-white' : 'text-gray-400'}>
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>
                          </button>
                          <button onClick={() => toggleTheme('LIGHT')} className={!isDarkTheme ? 'text-black' : 'text-zinc-600'}>
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/></svg>
                          </button>
                          <button onClick={() => toggleTheme('SYSTEM')} className="text-sm font-light uppercase">system</button>
                      </div>
                  </div>

                  {/* Font Size Selector */}
                  <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                          <span className="text-xl font-serif">Aa</span>
                          <span className="text-lg">Font Size</span>
                      </div>
                      <div className="flex items-center space-x-3">
                          <button onClick={() => setReadingFontSize(Math.max(10, readingFontSize - 1))} className="text-2xl hover:text-gray-400">-</button>
                          <span className="text-lg w-6 text-center">{readingFontSize}</span>
                          <button onClick={() => setReadingFontSize(Math.min(32, readingFontSize + 1))} className="text-2xl hover:text-gray-400">+</button>
                      </div>
                  </div>
              </div>
          </section>

          {/* --- SECTION: AI AND FEATURES --- */}
          <section>
              <div className="flex items-center space-x-3 mb-6">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   <h2 className="text-lg font-light underline decoration-1 underline-offset-4">Ai and Features</h2>
              </div>
              
              <div className="space-y-6">
                  <SettingToggle label="Smart recognition" iconPath="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" isFill={true} isOn={isSmartRecognitionOn} onToggle={toggleSmartRecognition} accentColor={accentColor} />
                  <SettingToggle label="Pop up view" iconPath="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" isFill={false} isOn={isPopupViewOn} onToggle={togglePopupView} accentColor={accentColor} />
                  <SettingToggle label="Ai support" iconPath="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" isFill={false} isOn={isAiSupportOn} onToggle={toggleAiSupport} accentColor={accentColor} />

                  {/* Translate */}
                  <div 
                      className="flex items-center justify-between cursor-pointer group"
                      onClick={() => setShowLanguageSelector(true)}
                  >
                      <div className="flex items-center space-x-3">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                          <span className="text-lg group-hover:opacity-80 transition-opacity">Ai Translate Language</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-transparent rounded px-2 py-1">
                          <span className={`text-sm ${isDarkTheme ? 'text-zinc-400' : 'text-gray-600'}`}>{translateLanguage}</span>
                          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </div>
                  </div>
              </div>
          </section>

          {/* --- SECTION: BACKUP --- */}
          <section>
               <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-lg">Auto Backup</span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                         {/* Frequency Dropdown */}
                         <div className="relative" ref={freqRef}>
                            <button 
                                onClick={() => { setShowBackupFreq(!showBackupFreq); setShowBackupDest(false); }}
                                className={`border px-3 py-1 text-sm min-w-[90px] text-left transition-colors flex justify-between items-center ${isDarkTheme ? 'border-zinc-700 bg-black text-white hover:border-zinc-500' : 'border-gray-300 bg-white text-black hover:border-gray-400'}`}
                            >
                                <span className="truncate">{autoBackupFrequency}</span>
                            </button>
                            {showBackupFreq && (
                                <div className={dropdownClass}>
                                    {['Off', 'Every Day', 'Every 15 days', 'Every Month'].map(opt => (
                                        <button 
                                            key={opt}
                                            onClick={() => { setAutoBackupFrequency(opt); setShowBackupFreq(false); }}
                                            className={dropdownItemClass(autoBackupFrequency === opt)}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}
                         </div>

                         {/* Destination Dropdown */}
                         <div className="relative" ref={destRef}>
                            <button 
                                onClick={() => { setShowBackupDest(!showBackupDest); setShowBackupFreq(false); }}
                                className={`border px-3 py-1 text-sm min-w-[90px] text-left transition-colors flex justify-between items-center ${isDarkTheme ? 'border-zinc-700 bg-black text-white hover:border-zinc-500' : 'border-gray-300 bg-white text-black hover:border-gray-400'}`}
                            >
                                <span className="truncate">{backupDestination}</span>
                            </button>
                             {showBackupDest && (
                                <div className={dropdownClass}>
                                    {['Google', 'Local files'].map(opt => (
                                        <button 
                                            key={opt}
                                            onClick={() => { setBackupDestination(opt); setShowBackupDest(false); }}
                                            className={dropdownItemClass(backupDestination === opt)}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}
                         </div>
                    </div>
               </div>
          </section>

           {/* --- SECTION: FEEDBACK & SUPPORT --- */}
           <section className="pt-4 border-t border-gray-800 space-y-6">
               
               {/* Feedback Form */}
               <div className="mt-4">
                    <div className="relative mb-4">
                        <div className="inline-block border-2 px-2 py-0.5 font-bold text-sm tracking-widest uppercase mb-2" style={{ borderColor: accentColor, color: accentColor }}>
                            Feedback
                        </div>
                        <textarea
                            className={`w-full h-32 p-3 border focus:outline-none resize-none rounded-md transition-colors ${isDarkTheme ? 'bg-black border-zinc-700 text-white placeholder-zinc-600' : 'bg-white border-gray-300 text-black placeholder-gray-400'}`}
                            style={{ borderColor: isDarkTheme ? undefined : accentColor }}
                            placeholder="Feedback...."
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-between items-center mb-6">
                        <button 
                            onClick={() => setFeedbackText('')} 
                            className={`border p-1 hover:opacity-80 transition-opacity ${isDarkTheme ? 'border-zinc-700 text-white' : 'border-gray-300 text-black'}`}
                        >
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </button>
                        <button 
                            onClick={handleFeedbackSubmit}
                            className={`border px-6 py-1.5 text-sm uppercase tracking-wider font-medium hover:bg-opacity-10 transition-colors ${isDarkTheme ? 'bg-black' : 'bg-white'}`}
                            style={{ borderColor: accentColor, color: accentColor }}
                        >
                            Submit
                        </button>
                    </div>
               </div>

               {/* Standard Links */}
               <div className="flex items-center space-x-3">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                   <span className="text-lg">Rate Us</span>
               </div>
               <div className="flex items-center space-x-3">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   <div className="flex items-center justify-between flex-1">
                        <span className="text-lg">version</span>
                        <span className="bg-gray-700 px-2 py-0.5 rounded text-xs text-white">v 0.0.1</span>
                   </div>
               </div>

                <div className="flex items-center space-x-3 pt-6">
                   <div className="relative">
                       <span className="text-xl font-bold">AD</span>
                       <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white transform -rotate-12"></div>
                   </div>
                   <span className="text-lg">Remove Ads</span>
               </div>
           </section>
      </main>

      {/* --- OVERLAY: LANGUAGE SELECTOR --- */}
      {showLanguageSelector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
              <div 
                  className={`border rounded-xl w-full max-w-sm max-h-[70vh] flex flex-col shadow-2xl overflow-hidden ${isDarkTheme ? 'bg-[#121212] border-zinc-700' : 'bg-white border-gray-300'}`} 
                  style={{ borderColor: accentColor }}
              >
                  <div className={`p-4 border-b flex justify-between items-center ${isDarkTheme ? 'border-zinc-800' : 'border-gray-200'}`}>
                      <h3 className="text-lg font-medium" style={{ color: accentColor }}>Select Language</h3>
                      <button onClick={() => setShowLanguageSelector(false)} className={isDarkTheme ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-black'}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                  </div>
                  <div className="overflow-y-auto p-2 scrollbar-thin">
                      {sortedLanguages.map((lang, index) => {
                          const isSelected = lang === translateLanguage;
                          return (
                              <React.Fragment key={lang}>
                                  <button 
                                      onClick={() => { setTranslateLanguage(lang); setShowLanguageSelector(false); }}
                                      className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-colors ${isDarkTheme ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'} ${isSelected ? (isDarkTheme ? 'bg-zinc-800/50' : 'bg-gray-50') : ''}`}
                                  >
                                      <span className={`${isSelected ? 'font-bold' : 'font-normal'} ${isDarkTheme ? 'text-zinc-200' : 'text-gray-800'}`}>{lang}</span>
                                      {isSelected && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }}></div>}
                                  </button>
                                  {index === 0 && sortedLanguages.length > 1 && (
                                      <div className={`mx-2 my-2 border-b ${isDarkTheme ? 'border-zinc-800' : 'border-gray-200'}`}></div>
                                  )}
                              </React.Fragment>
                          );
                      })}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

// --- Sub-components for cleaner code ---
const SettingToggle: React.FC<{ label: string; iconPath: string; isFill: boolean; isOn: boolean; onToggle: () => void; accentColor: string }> = ({ label, iconPath, isFill, isOn, onToggle, accentColor }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
            <svg className="w-6 h-6" fill={isFill ? "currentColor" : "none"} stroke={isFill ? "none" : "currentColor"} viewBox="0 0 24 24" strokeWidth={isFill ? 0 : 2}><path strokeLinecap="round" strokeLinejoin="round" d={iconPath} /></svg>
            <span className="text-lg">{label}</span>
        </div>
        <Toggle switchOn={isOn} onToggle={onToggle} accentColor={accentColor} />
    </div>
);

const Toggle: React.FC<{ switchOn: boolean; onToggle: () => void; accentColor: string }> = ({ switchOn, onToggle, accentColor }) => (
    <button 
        onClick={onToggle}
        className="w-12 h-6 rounded-full relative transition-colors duration-200"
        style={{ backgroundColor: switchOn ? accentColor : '#333' }}
    >
        <div 
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-md ${switchOn ? 'left-7' : 'left-1'}`}
        />
    </button>
);

export default SettingsScreen;