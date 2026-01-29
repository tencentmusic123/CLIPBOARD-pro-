import React from 'react';

const SplashScreen: React.FC = () => {
  const GOLD = '#D4AF37';

  return (
    <div className="h-screen w-full bg-gradient-to-b from-black via-zinc-950 to-zinc-900 flex flex-col items-center justify-center animate-fade-in font-sans">
      <h1 
        className="text-5xl tracking-[0.2em] font-bold font-sans animate-scale-in"
        style={{ color: GOLD }}
      >
        Clipboard Max
      </h1>
    </div>
  );
};

export default SplashScreen;