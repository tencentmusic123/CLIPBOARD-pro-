import React, { useState } from 'react';
import { ScreenName } from '../../types';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

interface SideBarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: ScreenName) => void;
}

const SideBar: React.FC<SideBarProps> = ({ isOpen, onClose, onNavigate }) => {
  const { accentColor, isDarkTheme } = useSettings();
  const { user, loginWithGoogle, logout, isLoading } = useAuth();

  const handleMenuClick = (screen: ScreenName) => {
    onNavigate(screen);
    onClose();
  };

  const handleLoginClick = async () => {
      await loginWithGoogle();
  };

  const handleLogoutClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      logout();
  };

  // --- Theme Constants ---
  const containerClass = isDarkTheme ? 'bg-black border-zinc-900' : 'bg-[#FAFAFA] border-gray-200';
  const headerClass = isDarkTheme ? 'bg-zinc-900' : 'bg-white';
  const headerOverlayClass = isDarkTheme ? 'from-transparent via-black/50 to-black/90' : 'from-transparent via-white/50 to-white/90';
  const textPrimary = isDarkTheme ? 'text-white' : 'text-gray-900';
  const textSecondary = isDarkTheme ? 'text-zinc-400' : 'text-gray-500';
  const footerClass = isDarkTheme ? 'border-zinc-900 bg-black' : 'border-gray-200 bg-[#FAFAFA]';

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 left-0 h-full w-[85%] max-w-xs z-50 transform transition-transform duration-300 ease-out flex flex-col border-r shadow-2xl ${containerClass} ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header - Fixed Height */}
        <div className={`relative h-48 w-full shrink-0 overflow-hidden flex flex-col justify-between p-6 ${headerClass}`}>
             <div className={`absolute inset-0 opacity-10 bg-[radial-gradient(#888888_1px,transparent_1px)] [background-size:20px_20px]`}></div>
             <div className={`absolute inset-0 bg-gradient-to-b ${headerOverlayClass}`}></div>
             
             <button onClick={onClose} className={`relative z-10 w-fit hover:opacity-80 transition-colors p-1 ${textPrimary}`}>
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
               </svg>
             </button>

             <div className="relative z-10">
                <h1 className="text-2xl font-bold tracking-widest uppercase drop-shadow-sm" style={{ color: accentColor }}>
                  CLIPBOARD MAX
                </h1>
                <p className={`text-xs mt-1 font-medium ${textSecondary}`}>Efficient. Secure. Offline.</p>
             </div>
        </div>

        {/* Navigation - Flexible & Scrollable for Landscape */}
        <nav className="flex-1 overflow-y-auto py-4 min-h-0">
            <MenuItem icon="trash" label="Trash" onClick={() => handleMenuClick('TRASH')} accentColor={accentColor} isDarkTheme={isDarkTheme} />
            <MenuItem icon="hash" label="Tags" onClick={() => handleMenuClick('TAGS')} accentColor={accentColor} isDarkTheme={isDarkTheme} />
            <MenuItem icon="heart" label="Favorite" onClick={() => handleMenuClick('FAVORITE')} accentColor={accentColor} isDarkTheme={isDarkTheme} />
            <MenuItem icon="settings" label="Settings" onClick={() => handleMenuClick('SETTINGS')} accentColor={accentColor} isDarkTheme={isDarkTheme} />
        </nav>

        {/* Footer - Fixed Height */}
        <div className={`shrink-0 p-6 border-t ${footerClass}`}>
            {isLoading ? (
                <div className="flex items-center space-x-4 w-full py-2 animate-pulse">
                     <div className={`w-10 h-10 rounded-full ${isDarkTheme ? 'bg-zinc-800' : 'bg-gray-200'}`}></div>
                     <div className="flex flex-col space-y-2 flex-1">
                         <div className={`h-3 rounded w-3/4 ${isDarkTheme ? 'bg-zinc-800' : 'bg-gray-200'}`}></div>
                         <div className={`h-2 rounded w-1/2 ${isDarkTheme ? 'bg-zinc-800' : 'bg-gray-200'}`}></div>
                     </div>
                </div>
            ) : !user ? (
                <button onClick={handleLoginClick} className="flex items-center space-x-4 w-full group py-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border ${isDarkTheme ? 'bg-zinc-800 border-zinc-700 group-hover:bg-zinc-700' : 'bg-white border-gray-300 group-hover:bg-gray-50 shadow-sm'}`}>
                        <svg className={`w-5 h-5 ${textPrimary}`} fill="currentColor" viewBox="0 0 24 24">
                           <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3 0 1.66-1.34 3-3 3S9 9.66 9 8c0-1.66 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                        </svg>
                    </div>
                    <div className="flex flex-col items-start">
                        <span className={`font-medium text-sm transition-colors ${textPrimary}`}>
                            Login or Sign up
                        </span>
                        <span className={`text-xs ${textSecondary}`}>Sync with Google</span>
                    </div>
                </button>
            ) : (
                 <div className="flex items-center justify-between w-full py-2 group relative">
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md" style={{ backgroundColor: accentColor }}>
                            {user.name.charAt(0)}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className={`text-sm font-medium truncate ${textPrimary}`}>{user.name}</span>
                            <span className={`text-xs truncate ${textSecondary}`}>{user.email}</span>
                        </div>
                    </div>
                    <button onClick={handleLogoutClick} className={`p-2 transition-colors hover:text-red-500 ${isDarkTheme ? 'text-zinc-600' : 'text-gray-400'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                             <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
      </div>
    </>
  );
};

const MenuItem: React.FC<{ icon: string; label: string; onClick: () => void; accentColor: string; isDarkTheme: boolean }> = ({ icon, label, onClick, accentColor, isDarkTheme }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    // Theme Colors
    const textNormal = isDarkTheme ? 'text-white' : 'text-gray-800';
    const bgHover = isDarkTheme ? 'hover:bg-zinc-900 active:bg-zinc-800' : 'hover:bg-gray-100 active:bg-gray-200';
    
    const getIcon = () => {
        switch(icon) {
            case 'trash': return <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />;
            case 'hash': return <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />;
            case 'heart': return <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />;
            case 'settings': return (
                <>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </>
            );
            default: return null;
        }
    }

    return (
        <button 
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`flex items-center w-full px-8 py-5 transition-colors ${bgHover}`}
        >
            <svg className="w-6 h-6 transition-colors mr-6" style={{ color: isHovered ? accentColor : (isDarkTheme ? 'white' : '#4B5563') }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                {getIcon()}
            </svg>
            <span className={`text-lg font-light tracking-wide transition-colors capitalize ${isHovered ? '' : textNormal}`} style={{ color: isHovered ? accentColor : undefined }}>
                {label}
            </span>
        </button>
    )
}

export default SideBar;