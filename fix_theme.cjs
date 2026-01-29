const fs = require('fs');
const path = require('path');

console.log("Applying Light Mode fixes...");

// --- 1. Fix index.html ---
const indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>CLIPBOARD MAX</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            colors: {
              gold: '#D4AF37',
              midnight: '#000000',
              'gold-dim': '#B4941F',
            },
            fontFamily: {
              sans: ['Inter', 'sans-serif'],
              mono: ['Fira Code', 'monospace'],
              blanka: ['Blanka', 'sans-serif'],
            },
            animation: {
              'fade-in': 'fadeIn 0.4s ease-out',
              'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
              'fade-in-down': 'fadeInDown 0.4s ease-out forwards',
              'scale-in': 'scaleIn 0.3s ease-out forwards',
              'slide-in-right': 'slideInRight 0.3s ease-out forwards',
              'slide-in-left': 'slideInLeft 0.3s ease-out forwards',
              'pulse-slow': 'pulse 3s infinite',
              'bounce-subtle': 'bounceSubtle 2s infinite',
            },
            keyframes: {
              fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
              fadeInUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
              fadeInDown: { '0%': { opacity: '0', transform: 'translateY(-10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
              scaleIn: { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
              slideInRight: { '0%': { opacity: '0', transform: 'translateX(20px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
              slideInLeft: { '0%': { opacity: '0', transform: 'translateX(-20px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
              bounceSubtle: { '0%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-5px)' }, '100%': { transform: 'translateY(0)' } }
            },
          },
        },
      }
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code&display=swap" rel="stylesheet">
    <link href="https://fonts.cdnfonts.com/css/blanka" rel="stylesheet">
    <style>
      :root {
        --scrollbar-bg: #ffffff;
        --scrollbar-thumb: #cccccc;
      }
      :root.dark {
        --scrollbar-bg: #000000;
        --scrollbar-thumb: #333333;
      }
      
      body {
        margin: 0;
        padding: 0;
      }

      ::-webkit-scrollbar {
        width: 6px;
      }
      ::-webkit-scrollbar-track {
        background: var(--scrollbar-bg); 
      }
      ::-webkit-scrollbar-thumb {
        background: var(--scrollbar-thumb); 
        border-radius: 3px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #D4AF37;
      }
    </style>
  <script type="importmap">
{
  "imports": {
    "react-dom/": "https://esm.sh/react-dom@^19.2.3/",
    "react/": "https://esm.sh/react@^19.2.3/",
    "react": "https://esm.sh/react@^19.2.3",
    "jszip": "https://esm.sh/jszip@3.10.1"
  }
}
</script>
</head>
  <body>
    <div id="root"></div>
  </body>
  <script type="module" src="/index.tsx"></script>
</html>`;

fs.writeFileSync('index.html', indexHtmlContent);
console.log("✔ index.html updated");

// --- 2. Fix SettingsContext.tsx ---
const settingsPath = path.join('ui', 'context', 'SettingsContext.tsx');
const settingsContent = `import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface SettingsContextType {
  isDarkTheme: boolean;
  toggleTheme: (mode: 'DARK' | 'LIGHT' | 'SYSTEM') => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  readingFontSize: number;
  setReadingFontSize: (size: number) => void;
  
  isSmartRecognitionOn: boolean;
  toggleSmartRecognition: () => void;
  isAiSupportOn: boolean;
  toggleAiSupport: () => void;
  
  clipboardSyncEnabled: boolean;
  setClipboardSyncEnabled: (enabled: boolean) => void;

  autoBackupFrequency: string;
  setAutoBackupFrequency: (freq: string) => void;
  backupDestination: string;
  setBackupDestination: (dest: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<'DARK' | 'LIGHT' | 'SYSTEM'>('DARK');
  const [accentColor, setAccentColorState] = useState('#D4AF37'); // Default Gold
  const [readingFontSize, setReadingFontSizeState] = useState(16);
  
  const [isSmartRecognitionOn, setIsSmartRecognitionOn] = useState(true);
  const [isAiSupportOn, setIsAiSupportOn] = useState(true);
  
  const [clipboardSyncEnabled, setClipboardSyncEnabledState] = useState(false);

  const [autoBackupFrequency, setAutoBackupFrequencyState] = useState('Off');
  const [backupDestination, setBackupDestinationState] = useState('Google');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme_mode');
    if (storedTheme) setThemeModeState(storedTheme as 'DARK' | 'LIGHT' | 'SYSTEM');
    
    const storedAccent = localStorage.getItem('accent_color');
    if (storedAccent) setAccentColorState(storedAccent);
    
    const storedFontSize = localStorage.getItem('reading_font_size');
    if (storedFontSize) setReadingFontSizeState(Number(storedFontSize));
    
    const storedSmartRecognition = localStorage.getItem('smart_recognition_enabled');
    if (storedSmartRecognition) setIsSmartRecognitionOn(JSON.parse(storedSmartRecognition));
    
    const storedAiSupport = localStorage.getItem('ai_support_enabled');
    if (storedAiSupport) setIsAiSupportOn(JSON.parse(storedAiSupport));
    
    const storedSync = localStorage.getItem('clipboard_sync_enabled');
    if (storedSync) setClipboardSyncEnabledState(JSON.parse(storedSync));
    
    const storedBackupFreq = localStorage.getItem('auto_backup_frequency');
    if (storedBackupFreq) setAutoBackupFrequencyState(storedBackupFreq);
    
    const storedBackupDest = localStorage.getItem('backup_destination');
    if (storedBackupDest) setBackupDestinationState(storedBackupDest);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = themeMode === 'DARK' || (themeMode === 'SYSTEM' && isSystemDark);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [themeMode]);

  const setClipboardSyncEnabled = (enabled: boolean) => {
      setClipboardSyncEnabledState(enabled);
      localStorage.setItem('clipboard_sync_enabled', JSON.stringify(enabled));
  };
  
  const toggleTheme = (mode: 'DARK' | 'LIGHT' | 'SYSTEM') => {
      setThemeModeState(mode);
      localStorage.setItem('theme_mode', mode);
  };
  
  const setAccentColor = (color: string) => {
      setAccentColorState(color);
      localStorage.setItem('accent_color', color);
  };
  
  const setReadingFontSize = (size: number) => {
      setReadingFontSizeState(size);
      localStorage.setItem('reading_font_size', String(size));
  };
  
  const toggleSmartRecognition = () => {
      setIsSmartRecognitionOn(prev => {
          const newValue = !prev;
          localStorage.setItem('smart_recognition_enabled', JSON.stringify(newValue));
          return newValue;
      });
  };
  
  const toggleAiSupport = () => {
      setIsAiSupportOn(prev => {
          const newValue = !prev;
          localStorage.setItem('ai_support_enabled', JSON.stringify(newValue));
          return newValue;
      });
  };
  
  const setAutoBackupFrequency = (freq: string) => {
      setAutoBackupFrequencyState(freq);
      localStorage.setItem('auto_backup_frequency', freq);
  };
  
  const setBackupDestination = (dest: string) => {
      setBackupDestinationState(dest);
      localStorage.setItem('backup_destination', dest);
  };

  const isDarkTheme = themeMode === 'DARK' || (themeMode === 'SYSTEM' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <SettingsContext.Provider value={{
      isDarkTheme,
      toggleTheme,
      accentColor,
      setAccentColor,
      readingFontSize,
      setReadingFontSize,
      isSmartRecognitionOn,
      toggleSmartRecognition,
      isAiSupportOn,
      toggleAiSupport,
      clipboardSyncEnabled,
      setClipboardSyncEnabled,
      autoBackupFrequency,
      setAutoBackupFrequency,
      backupDestination,
      setBackupDestination
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
`;

fs.writeFileSync(settingsPath, settingsContent);
console.log("✔ SettingsContext.tsx updated");

// --- 3. Fix App.tsx Background ---
const appPath = 'App.tsx';
if (fs.existsSync(appPath)) {
    let appContent = fs.readFileSync(appPath, 'utf8');
    appContent = appContent.replace('bg-[#D1E5F4]', 'bg-blue-50');
    fs.writeFileSync(appPath, appContent);
    console.log("✔ App.tsx updated");
}

console.log("All fixes applied successfully!");
