import React from 'react';

const SplashScreen: React.FC = () => {
  return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center animate-fade-in">
      <div className="relative mb-8">
        {/* Crown Icon */}
        <div className="absolute -top-10 -right-8 transform rotate-12">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>
        
        {/* Clipboard Icon */}
        <svg width="100" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="4" width="14" height="18" rx="2" stroke="white" strokeWidth="2"/>
            <path d="M9 4V2H15V4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="3" r="1" fill="white"/>
        </svg>
      </div>

      <h1 className="text-3xl font-bold tracking-[0.2em] text-gold uppercase mt-4">
        Clipboard Pro
      </h1>
    </div>
  );
};

export default SplashScreen;