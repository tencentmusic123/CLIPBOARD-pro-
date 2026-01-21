import React, { useState, useEffect } from 'react';
import { SettingsProvider, useSettings } from './ui/context/SettingsContext';
import SplashScreen from './ui/screens/SplashScreen';
import HomeScreen from './ui/screens/HomeScreen';
import TrashScreen from './ui/screens/TrashScreen';
import FavoriteScreen from './ui/screens/FavoriteScreen';
import ReadScreen from './ui/screens/ReadScreen';
import EditScreen from './ui/screens/EditScreen';
import TagsScreen from './ui/screens/TagsScreen';
import TagDetailScreen from './ui/screens/TagDetailScreen';
import SettingsScreen from './ui/screens/SettingsScreen';
import { ScreenName, ClipboardItem } from './types';

// App Content Component to use Context
const AppContent: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('SPLASH');
  const [selectedItem, setSelectedItem] = useState<ClipboardItem | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const { isDarkTheme } = useSettings();

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentScreen('HOME');
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const navigateTo = (screen: ScreenName) => {
    setCurrentScreen(screen);
  };

  const handleReadItem = (item: ClipboardItem) => {
    setSelectedItem(item);
    setCurrentScreen('READ');
  };

  const handleEditItem = (item: ClipboardItem) => {
    setSelectedItem(item);
    setCurrentScreen('EDIT');
  };

  const handleSelectTag = (tag: string) => {
      setSelectedTag(tag);
      setCurrentScreen('TAG_DETAILS');
  };

  const handleSaveEdit = () => {
    setCurrentScreen('READ');
    navigateTo('HOME'); 
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'SPLASH': return <SplashScreen />;
      case 'HOME': return <HomeScreen onNavigate={navigateTo} onRead={handleReadItem} />;
      case 'TRASH': return <TrashScreen onBack={() => navigateTo('HOME')} />;
      case 'FAVORITE': return <FavoriteScreen onBack={() => navigateTo('HOME')} onRead={handleReadItem} />;
      case 'TAGS': return <TagsScreen onBack={() => navigateTo('HOME')} onSelectTag={handleSelectTag} />;
      case 'TAG_DETAILS': return <TagDetailScreen tag={selectedTag} onBack={() => navigateTo('TAGS')} onRead={handleReadItem} />;
      case 'SETTINGS': return <SettingsScreen onBack={() => navigateTo('HOME')} />;
      case 'READ': return selectedItem ? <ReadScreen item={selectedItem} onBack={() => navigateTo('HOME')} onEdit={handleEditItem} /> : <HomeScreen onNavigate={navigateTo} onRead={handleReadItem} />;
      case 'EDIT': return selectedItem ? <EditScreen item={selectedItem} onBack={() => setCurrentScreen('READ')} onSave={handleSaveEdit} /> : <HomeScreen onNavigate={navigateTo} onRead={handleReadItem} />;
      case 'NOTES': return <HomeScreen onNavigate={navigateTo} onRead={handleReadItem} />;
      default: return <HomeScreen onNavigate={navigateTo} onRead={handleReadItem} />;
    }
  };

  return (
    <div className={`min-h-screen flex justify-center items-center font-sans ${isDarkTheme ? 'bg-black' : 'bg-gray-200'}`}>
      <div className={`w-full h-full max-w-md relative shadow-2xl overflow-hidden min-h-screen ${isDarkTheme ? 'bg-black' : 'bg-white'}`}>
        {renderScreen()}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
};

export default App;