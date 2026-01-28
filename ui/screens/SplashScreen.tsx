import React from 'react';
import { useSettings } from '../context/SettingsContext';

const SplashScreen: React.FC = () => {
  const { accentColor } = useSettings();
  const GOLD = '#D4AF37';

  return (
    <div className="h-screen w-full bg-gradient-to-b from-black via-zinc-950 to-zinc-900 flex flex-col items-center justify-center animate-fade-in font-sans">
      <div className="mb-8 animate-bounce">
        <svg className="w-24 h-24" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="40" y="50" width="120" height="100" rx="8" stroke={GOLD} strokeWidth="3" fill="none"/>
          <rect x="60" y="35" width="80" height="20" rx="4" stroke={GOLD} strokeWidth="2" fill="none"/>
          <circle cx="100" cy="42" r="3" fill={GOLD}/>
        </svg>
      </div>
      <h1 
        className="text-5xl tracking-[0.2em] uppercase font-blanka animate-scale-in"
        style={{ color: GOLD }}
      >
        CLIPBOARD MAX
      </h1>
      <p className="text-sm tracking-wider uppercase mt-4 opacity-60" style={{ color: GOLD }}>
        Premium Clipboard Manager
      </p>
    </div>
  );
};

export default SplashScreen;