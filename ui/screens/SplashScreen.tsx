import React from 'react';
import { useSettings } from '../context/SettingsContext';

const SplashScreen: React.FC = () => {
  const { accentColor } = useSettings();
  const GOLD = '#D4AF37';

  return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center animate-fade-in font-sans">
      <h1 
        className="text-4xl tracking-[0.2em] uppercase font-blanka"
        style={{ color: GOLD }}
      >
        Clipboard Pro
      </h1>
    </div>
  );
};

export default SplashScreen;