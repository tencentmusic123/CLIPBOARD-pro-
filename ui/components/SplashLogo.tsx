import React from 'react';

export const SplashLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    version="1.1" 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 480 480"
    className={className}
  >
    <path d="M0 0 C158.4 0 316.8 0 480 0 C480 158.4 480 316.8 480 480 C321.6 480 163.2 480 0 480 C0 321.6 0 163.2 0 0 Z " fill="#010101"/>
    <path d="M240 100 C162.68 100 100 162.68 100 240 C100 317.32 162.68 380 240 380 C317.32 380 380 317.32 380 240 C380 162.68 317.32 100 240 100 Z M240 340 C184.77 340 140 295.23 140 240 C140 184.77 184.77 140 240 140 C295.23 140 340 184.77 340 240 C340 295.23 295.23 340 240 340 Z" fill="#D4AF37"/>
    <path d="M220 180 L260 180 L260 220 L300 220 L300 260 L260 260 L260 300 L220 300 L220 260 L180 260 L180 220 L220 220 Z" fill="#FFFFFF"/>
  </svg>
);