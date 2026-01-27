import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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
  
  // Clipboard Sync
  clipboardSyncEnabled: boolean;
  setClipboardSyncEnabled: (enabled: boolean) => void;

  // Auto Backup
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
  
  const [isSmartRecognitionOn, setIsSmartRecognitionOnState] = useState(true);
  const [isAiSupportOn, setIsAiSupportOnState] = useState(true);
  
  const [clipboardSyncEnabled, setClipboardSyncEnabledState] = useState(false);

  const [autoBackupFrequency, setAutoBackupFrequencyState] = useState('Off');
  const [backupDestination, setBackupDestinationState] = useState('Google');

  // Load Persistence
  useEffect(() => {
    // Load all settings from localStorage
    const storedTheme = localStorage.getItem('theme_mode');
    if (storedTheme) setThemeModeState(storedTheme as 'DARK' | 'LIGHT' | 'SYSTEM');
    
    const storedAccent = localStorage.getItem('accent_color');
    if (storedAccent) setAccentColorState(storedAccent);
    
    const storedFontSize = localStorage.getItem('reading_font_size');
    if (storedFontSize) setReadingFontSizeState(parseInt(storedFontSize));
    
    const storedSmartRecognition = localStorage.getItem('smart_recognition_enabled');
    if (storedSmartRecognition) setIsSmartRecognitionOnState(JSON.parse(storedSmartRecognition));
    
    const storedAiSupport = localStorage.getItem('ai_support_enabled');
    if (storedAiSupport) setIsAiSupportOnState(JSON.parse(storedAiSupport));
    
    const storedSync = localStorage.getItem('clipboard_sync_enabled');
    if (storedSync) setClipboardSyncEnabledState(JSON.parse(storedSync));
    
    const storedBackupFreq = localStorage.getItem('auto_backup_frequency');
    if (storedBackupFreq) setAutoBackupFrequencyState(storedBackupFreq);
    
    const storedBackupDest = localStorage.getItem('backup_destination');
    if (storedBackupDest) setBackupDestinationState(storedBackupDest);
  }, []);

  const setClipboardSyncEnabled = (enabled: boolean) => {
      setClipboardSyncEnabledState(enabled);
      localStorage.setItem('clipboard_sync_enabled', JSON.stringify(enabled));
  };

  const setAccentColor = (color: string) => {
      setAccentColorState(color);
      localStorage.setItem('accent_color', color);
  };

  const setReadingFontSize = (size: number) => {
      setReadingFontSizeState(size);
      localStorage.setItem('reading_font_size', size.toString());
  };

  const setAutoBackupFrequency = (freq: string) => {
      setAutoBackupFrequencyState(freq);
      localStorage.setItem('auto_backup_frequency', freq);
  };

  const setBackupDestination = (dest: string) => {
      setBackupDestinationState(dest);
      localStorage.setItem('backup_destination', dest);
  };

  const isDarkTheme = themeMode === 'DARK' || (themeMode === 'SYSTEM' && true); // Mock system dark

  const toggleTheme = (mode: 'DARK' | 'LIGHT' | 'SYSTEM') => {
      setThemeModeState(mode);
      localStorage.setItem('theme_mode', mode);
  };
  
  const toggleSmartRecognition = () => {
      setIsSmartRecognitionOnState(prev => {
          const newValue = !prev;
          localStorage.setItem('smart_recognition_enabled', JSON.stringify(newValue));
          return newValue;
      });
  };
  
  const toggleAiSupport = () => {
      setIsAiSupportOnState(prev => {
          const newValue = !prev;
          localStorage.setItem('ai_support_enabled', JSON.stringify(newValue));
          return newValue;
      });
  };

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