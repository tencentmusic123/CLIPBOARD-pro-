import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SettingsContextType {
  isDarkTheme: boolean;
  toggleTheme: (mode: 'DARK' | 'LIGHT' | 'SYSTEM') => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  readingFontSize: number;
  setReadingFontSize: (size: number) => void;
  
  // Feature Toggles
  isSmartRecognitionOn: boolean;
  toggleSmartRecognition: () => void;
  isAiSupportOn: boolean;
  toggleAiSupport: () => void;

  // Auto Backup
  autoBackupFrequency: string;
  setAutoBackupFrequency: (freq: string) => void;
  backupDestination: string;
  setBackupDestination: (dest: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<'DARK' | 'LIGHT' | 'SYSTEM'>('DARK');
  const [accentColor, setAccentColor] = useState('#D4AF37'); // Default Gold
  const [readingFontSize, setReadingFontSize] = useState(16);
  
  const [isSmartRecognitionOn, setIsSmartRecognitionOn] = useState(true);
  const [isAiSupportOn, setIsAiSupportOn] = useState(true);

  const [autoBackupFrequency, setAutoBackupFrequency] = useState('Off');
  const [backupDestination, setBackupDestination] = useState('Google');

  const isDarkTheme = themeMode === 'DARK' || (themeMode === 'SYSTEM' && true); // Mock system dark

  const toggleTheme = (mode: 'DARK' | 'LIGHT' | 'SYSTEM') => setThemeMode(mode);
  const toggleSmartRecognition = () => setIsSmartRecognitionOn(prev => !prev);
  const toggleAiSupport = () => setIsAiSupportOn(prev => !prev);

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