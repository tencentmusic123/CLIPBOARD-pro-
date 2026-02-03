import React, { useState, useEffect, useCallback } from 'react';
import { SettingsProvider, useSettings } from './ui/context/SettingsContext';
import { AuthProvider } from './ui/context/AuthContext';
import SplashScreen from './ui/screens/SplashScreen';
import HomeScreen from './ui/screens/HomeScreen';
import TrashScreen from './ui/screens/TrashScreen';
import FavoriteScreen from './ui/screens/FavoriteScreen';
import ReadScreen from './ui/screens/ReadScreen';
import EditScreen from './ui/screens/EditScreen';
import TagsScreen from './ui/screens/TagsScreen';
import TagDetailScreen from './ui/screens/TagDetailScreen';
import SettingsScreen from './ui/screens/SettingsScreen';
import PrivacyPolicyOverlay, { usePrivacyPolicyStatus } from './ui/components/PrivacyPolicyOverlay';
import StartIOBannerAd from './ui/components/StartIOBannerAd';
import { ScreenName, ClipboardItem, ClipboardType } from './types';
import { clipboardRepository } from './data/repository/ClipboardRepository';
import { Clipboard } from '@capacitor/clipboard';
import { App as CapApp } from '@capacitor/app';
import { detectPrimaryType, maskContent } from './util/SmartRecognition';
import { Preferences } from '@capacitor/preferences';
import { ClipboardMonitor } from './util/plugins/ClipboardMonitor';

const AppContent: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('SPLASH');
  const [historyStack, setHistoryStack] = useState<ScreenName[]>([]);
  
  const [activeHomeTab, setActiveHomeTab] = useState<'clipboard' | 'notes'>('clipboard');

  const [selectedItem, setSelectedItem] = useState<ClipboardItem | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [isNewItem, setIsNewItem] = useState(false);
  const { isDarkTheme } = useSettings();
  
  // Privacy Policy state
  const { isAccepted: isPrivacyAccepted, markAccepted: markPrivacyAccepted } = usePrivacyPolicyStatus();

  // Sync clips captured by the background service
  const syncBackgroundClips = useCallback(async () => {
    try {
      const { clips } = await ClipboardMonitor.getPendingClips();
      
      if (!clips || clips.length === 0) return;

      const syncedIds: string[] = [];

      for (const clip of clips) {
        const detectedType = detectPrimaryType(clip.content);
        const displayContent = detectedType === ClipboardType.SECURE ? maskContent(clip.content) : undefined;
        
        const newItem: ClipboardItem = {
          id: clip.id,
          content: clip.content,
          displayContent: displayContent,
          timestamp: new Date(clip.timestamp).toLocaleString(),
          type: detectedType,
          category: 'clipboard',
          tags: ['#auto'],
          isPinned: false,
          isFavorite: false,
          isDeleted: false
        };

        await clipboardRepository.addItem(newItem);
        syncedIds.push(clip.id);
      }

      // Cleanup: mark as synced and clear
      if (syncedIds.length > 0) {
        await ClipboardMonitor.markClipsAsSynced({ ids: syncedIds });
        await ClipboardMonitor.clearPendingClips();
      }
    } catch (e) {
      console.warn("Background clip sync failed", e);
    }
  }, []);

  // Run sync on mount
  useEffect(() => {
    syncBackgroundClips();
  }, [syncBackgroundClips]);

  // Run sync when app resumes from background
  useEffect(() => {
    const handleAppStateChange = CapApp.addListener('appStateChange', (state) => {
      if (state.isActive) {
        syncBackgroundClips();
      }
    });

    return () => {
      handleAppStateChange.then(listener => listener.remove());
    };
  }, [syncBackgroundClips]);

  useEffect(() => {
    const performStartupSync = async () => {
      const { value } = await Preferences.get({ key: 'clipboard_sync_enabled' });
      if (value !== 'true') return;

      try {
        if (!document.hasFocus()) return;
        const { value: text } = await Clipboard.read();
        if (text && text.trim()) {
           const latestItems = await clipboardRepository.getAllItems('DATE', 'DESC');
           const latest = latestItems.find(i => i.category === 'clipboard' && !i.isDeleted);
           
           if (latest && latest.content === text) return;
           
           const trashedItems = latestItems.filter(i => i.isDeleted);
           if (trashedItems.some(i => i.content === text)) return;
           
           const detectedType = detectPrimaryType(text);
           const displayContent = detectedType === ClipboardType.SECURE ? maskContent(text) : undefined;
           
           await clipboardRepository.addItem({
               id: Date.now().toString(),
               content: text,
               displayContent: displayContent,
               type: detectedType,
               category: 'clipboard',
               timestamp: new Date().toLocaleString(),
               tags: ['#synced'],
               isPinned: false,
               isFavorite: false,
               isDeleted: false
           });
        }
      } catch (e) {
        console.warn("Startup sync skipped", e);
      }
    };

    const t = setTimeout(performStartupSync, 1000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handleBackButton = CapApp.addListener('backButton', () => {
      if (historyStack.length > 0) {
        goBack();
      } else if (currentScreen !== 'HOME') {
        setCurrentScreen('HOME');
      } else {
        CapApp.exitApp();
      }
    });

    return () => {
      handleBackButton.then(listener => listener.remove());
    };
  }, [historyStack, currentScreen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentScreen('HOME');
    }, 1300);
    return () => clearTimeout(timer);
  }, []);

  const navigateTo = (screen: ScreenName) => {
    setHistoryStack(prev => [...prev, currentScreen]);
    setCurrentScreen(screen);
  };

  const goBack = () => {
      if (historyStack.length > 0) {
          const prev = historyStack[historyStack.length - 1];
          setHistoryStack(prevStack => prevStack.slice(0, -1));
          setCurrentScreen(prev);
      } else {
          setCurrentScreen('HOME');
      }
  };

  const handleReadItem = (item: ClipboardItem) => {
    setSelectedItem(item);
    setHistoryStack(prev => [...prev, currentScreen]);
    setCurrentScreen('READ');
  };

  const handleCreateNew = () => {
    const newItem: ClipboardItem = {
      id: Date.now().toString(),
      content: '',
      type: ClipboardType.TEXT,
      category: activeHomeTab,
      timestamp: new Date().toLocaleString(),
      tags: activeHomeTab === 'notes' ? ['#notes'] : [],
      isPinned: false,
      isFavorite: false,
      isDeleted: false,
    };
    setSelectedItem(newItem);
    setIsNewItem(true);
    setHistoryStack(prev => [...prev, currentScreen]);
    setCurrentScreen('EDIT');
  };

  const handleEditItem = (item: ClipboardItem) => {
    setSelectedItem(item);
    setIsNewItem(false);
    setHistoryStack(prev => [...prev, currentScreen]);
    setCurrentScreen('EDIT');
  };

  const handleSelectTag = (tag: string) => {
      setSelectedTag(tag);
      setHistoryStack(prev => [...prev, currentScreen]);
      setCurrentScreen('TAG_DETAILS');
  };

  const handleSaveEdit = (savedItem?: ClipboardItem) => {
    if (savedItem) {
        setSelectedItem(savedItem);
        if (isNewItem) {
             setActiveHomeTab(savedItem.category);
        }
    }
    goBack(); 
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'SPLASH': return <SplashScreen />;
      case 'HOME': return <HomeScreen onNavigate={navigateTo} onRead={handleReadItem} onCreateNew={handleCreateNew} activeTab={activeHomeTab} onTabChange={setActiveHomeTab} />;
      case 'TRASH': return <TrashScreen onBack={goBack} />;
      case 'FAVORITE': return <FavoriteScreen onBack={goBack} onRead={handleReadItem} />;
      case 'TAGS': return <TagsScreen onBack={goBack} onSelectTag={handleSelectTag} />;
      case 'TAG_DETAILS': return <TagDetailScreen tag={selectedTag} onBack={goBack} onRead={handleReadItem} />;
      case 'SETTINGS': return <SettingsScreen onBack={goBack} />;
      case 'READ': return selectedItem ? <ReadScreen item={selectedItem} onBack={goBack} onEdit={handleEditItem} /> : <HomeScreen onNavigate={navigateTo} onRead={handleReadItem} onCreateNew={handleCreateNew} activeTab={activeHomeTab} onTabChange={setActiveHomeTab} />;
      case 'EDIT': return selectedItem ? <EditScreen item={selectedItem} isNew={isNewItem} onBack={goBack} onSave={handleSaveEdit} /> : <HomeScreen onNavigate={navigateTo} onRead={handleReadItem} onCreateNew={handleCreateNew} activeTab={activeHomeTab} onTabChange={setActiveHomeTab} />;
      case 'NOTES': return <HomeScreen onNavigate={navigateTo} onRead={handleReadItem} onCreateNew={handleCreateNew} activeTab={activeHomeTab} onTabChange={setActiveHomeTab} />;
      default: return <HomeScreen onNavigate={navigateTo} onRead={handleReadItem} onCreateNew={handleCreateNew} activeTab={activeHomeTab} onTabChange={setActiveHomeTab} />;
    }
  };

  return (
    <div className={`w-full h-[100dvh] overflow-hidden flex flex-col font-sans transition-colors duration-500 ${isDarkTheme ? 'bg-zinc-950' : 'bg-blue-50'}`}>
      {/* Main content area - leaves room for banner ad at bottom */}
      <div key={currentScreen} className="w-full flex-1 animate-fade-in overflow-hidden" style={{ paddingBottom: '50px' }}>
          {renderScreen()}
      </div>
      
      {/* Start.io Banner Ad at bottom */}
      <StartIOBannerAd />
      
      {/* Privacy Policy Overlay - shown on first launch */}
      {isPrivacyAccepted === false && (
        <PrivacyPolicyOverlay onAccept={markPrivacyAccepted} />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SettingsProvider>
  );
};

export default App;
