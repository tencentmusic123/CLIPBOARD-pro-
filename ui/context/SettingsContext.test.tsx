import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { SettingsProvider, useSettings } from './SettingsContext';

describe('SettingsContext', () => {
  
  beforeEach(() => {
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SettingsProvider>{children}</SettingsProvider>
  );

  describe('Theme Management', () => {
    it('should initialize with dark theme', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      
      expect(result.current.isDarkTheme).toBe(true);
    });

    it('should toggle to light theme', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      
      act(() => {
        result.current.toggleTheme('LIGHT');
      });
      
      expect(result.current.isDarkTheme).toBe(false);
    });

    it('should toggle to dark theme', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      
      act(() => {
        result.current.toggleTheme('LIGHT');
      });
      
      act(() => {
        result.current.toggleTheme('DARK');
      });
      
      expect(result.current.isDarkTheme).toBe(true);
    });

    it('should handle system theme mode', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      
      act(() => {
        result.current.toggleTheme('SYSTEM');
      });
      
      // System mode should resolve to a boolean
      expect(typeof result.current.isDarkTheme).toBe('boolean');
    });
  });

  describe('Accent Color', () => {
    it('should initialize with default gold color', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      
      expect(result.current.accentColor).toBe('#D4AF37');
    });

    it('should change accent color', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      
      act(() => {
        result.current.setAccentColor('#FF5733');
      });
      
      expect(result.current.accentColor).toBe('#FF5733');
    });
  });

  describe('Font Size', () => {
    it('should initialize with default font size of 16', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      
      expect(result.current.readingFontSize).toBe(16);
    });

    it('should update font size', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      
      act(() => {
        result.current.setReadingFontSize(20);
      });
      
      expect(result.current.readingFontSize).toBe(20);
    });

    it('should handle various font sizes', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      
      const sizes = [12, 14, 16, 18, 20, 24];
      
      sizes.forEach(size => {
        act(() => {
          result.current.setReadingFontSize(size);
        });
        expect(result.current.readingFontSize).toBe(size);
      });
    });
  });

  describe('Smart Recognition Toggle', () => {
    it('should initialize with smart recognition enabled', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      
      expect(result.current.isSmartRecognitionOn).toBe(true);
    });

    it('should toggle smart recognition off', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      
      act(() => {
        result.current.toggleSmartRecognition();
      });
      
      expect(result.current.isSmartRecognitionOn).toBe(false);
    });

    it('should toggle smart recognition on and off multiple times', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      
      act(() => {
        result.current.toggleSmartRecognition(); // off
      });
      expect(result.current.isSmartRecognitionOn).toBe(false);
      
      act(() => {
        result.current.toggleSmartRecognition(); // on
      });
      expect(result.current.isSmartRecognitionOn).toBe(true);
      
      act(() => {
        result.current.toggleSmartRecognition(); // off
      });
      expect(result.current.isSmartRecognitionOn).toBe(false);
    });
  });

  describe('AI Support Toggle', () => {
    it('should initialize with AI support enabled', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      
      expect(result.current.isAiSupportOn).toBe(true);
    });

    it('should toggle AI support off', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      
      act(() => {
        result.current.toggleAiSupport();
      });
      
      expect(result.current.isAiSupportOn).toBe(false);
    });

    it('should toggle AI support on and off multiple times', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      
      act(() => {
        result.current.toggleAiSupport(); // off
      });
      expect(result.current.isAiSupportOn).toBe(false);
      
      act(() => {
        result.current.toggleAiSupport(); // on
      });
      expect(result.current.isAiSupportOn).toBe(true);
    });
  });

  describe('Clipboard Sync', () => {
    it('should initialize with clipboard sync disabled', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      
      expect(result.current.clipboardSyncEnabled).toBe(false);
    });

    it('should enable clipboard sync', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      
      act(() => {
        result.current.setClipboardSyncEnabled(true);
      });
      
      expect(result.current.clipboardSyncEnabled).toBe(true);
    });

    it('should disable clipboard sync', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      
      act(() => {
        result.current.setClipboardSyncEnabled(true);
      });
      
      act(() => {
        result.current.setClipboardSyncEnabled(false);
      });
      
      expect(result.current.clipboardSyncEnabled).toBe(false);
    });

    it('should persist clipboard sync to localStorage', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      
      act(() => {
        result.current.setClipboardSyncEnabled(true);
      });
      
      const stored = localStorage.getItem('clipboard_sync_enabled');
      expect(stored).toBe('true');
    });

    it('should load clipboard sync from localStorage', () => {
      localStorage.setItem('clipboard_sync_enabled', 'true');
      
      const { result } = renderHook(() => useSettings(), { wrapper });
      
      // Should load from localStorage on mount
      expect(result.current.clipboardSyncEnabled).toBe(true);
    });
  });

  describe('Auto Backup Settings', () => {
    it('should initialize with backup frequency "Off"', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      
      expect(result.current.autoBackupFrequency).toBe('Off');
    });

    it('should change backup frequency', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      
      act(() => {
        result.current.setAutoBackupFrequency('Daily');
      });
      
      expect(result.current.autoBackupFrequency).toBe('Daily');
    });

    it('should handle various backup frequencies', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      
      const frequencies = ['Off', 'Daily', 'Weekly', 'Monthly'];
      
      frequencies.forEach(freq => {
        act(() => {
          result.current.setAutoBackupFrequency(freq);
        });
        expect(result.current.autoBackupFrequency).toBe(freq);
      });
    });

    it('should initialize with backup destination "Google"', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      
      expect(result.current.backupDestination).toBe('Google');
    });

    it('should change backup destination', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      
      act(() => {
        result.current.setBackupDestination('Dropbox');
      });
      
      expect(result.current.backupDestination).toBe('Dropbox');
    });
  });

  describe('Context Provider', () => {
    it('should throw error when useSettings is used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = () => {};
      
      expect(() => {
        renderHook(() => useSettings());
      }).toThrow('useSettings must be used within a SettingsProvider');
      
      console.error = originalError;
    });
  });

  describe('Multiple Settings Changes', () => {
    it('should handle multiple simultaneous setting changes', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      
      act(() => {
        result.current.toggleTheme('LIGHT');
        result.current.setAccentColor('#00FF00');
        result.current.setReadingFontSize(24);
        result.current.toggleSmartRecognition();
        result.current.toggleAiSupport();
        result.current.setClipboardSyncEnabled(true);
        result.current.setAutoBackupFrequency('Weekly');
      });
      
      expect(result.current.isDarkTheme).toBe(false);
      expect(result.current.accentColor).toBe('#00FF00');
      expect(result.current.readingFontSize).toBe(24);
      expect(result.current.isSmartRecognitionOn).toBe(false);
      expect(result.current.isAiSupportOn).toBe(false);
      expect(result.current.clipboardSyncEnabled).toBe(true);
      expect(result.current.autoBackupFrequency).toBe('Weekly');
    });
  });
});
