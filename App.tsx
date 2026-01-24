import React, { useState, useEffect } from 'react';
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
import { ScreenName, ClipboardItem, ClipboardType } from './types';

// App Content Component to use Context
const AppContent: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('SPLASH');
  // Track previous screen for smarter back navigation
  const [historyStack, setHistoryStack] = useState<ScreenName[]>([]);
  
  // Lifted State for Home Tab persistence
  const [activeHomeTab, setActiveHomeTab] = useState<'clipboard' | 'notes'>('clipboard');

  const [selectedItem, setSelectedItem] = useState<ClipboardItem | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [isNewItem, setIsNewItem] = useState(false);
  const { isDarkTheme } = useSettings();

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentScreen('HOME');
    }, 2500);
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
      category: activeHomeTab, // Create in current tab
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
        // If we saved a new item, ensure we are on the correct tab to see it
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
    <div className={`w-full h-[100dvh] overflow-hidden flex flex-col font-sans transition-colors duration-500 ${isDarkTheme ? 'bg-black' : 'bg-[#F2F2F7]'}`}>
      {renderScreen()}
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