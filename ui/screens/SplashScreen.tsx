import React from 'react';
import { useSettings } from '../context/SettingsContext';

const SplashScreen: React.FC = () => {
  const { accentColor } = useSettings();
  const GOLD = '#D4AF37';

  return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center animate-fade-in font-sans">
      <svg 
        className="w-24 h-24 mb-8 text-white" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        {/* Board Outline */}
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        {/* Clip */}
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        {/* Clip Hole */}
        <circle cx="12" cy="4" r="1.5" />
      </svg>
      <h1 
        className="text-4xl tracking-[0.2em] uppercase font-blanka"
        style={{ color: GOLD }}
      >
        CLIPBOARD MAX
      </h1>
    </div>
  );
};

export default SplashScreen;