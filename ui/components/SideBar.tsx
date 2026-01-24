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
  const { accentColor } = useSettings();
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

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/80 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 left-0 h-full w-[85%] max-w-xs bg-black border-r border-zinc-900 z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="relative h-48 w-full bg-zinc-900 overflow-hidden flex flex-col justify-between p-6">
             <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black/90"></div>
             
             <button onClick={onClose} className="relative z-10 text-white w-fit hover:opacity-80 transition-colors p-1" style={{ color: 'white' }}>
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
               </svg>
             </button>

             <div className="relative z-10">
                <h1 className="text-2xl font-bold tracking-widest uppercase shadow-black drop-shadow-md" style={{ color: accentColor }}>
                  CLIPBOARD MAX
                </h1>
                <p className="text-zinc-400 text-xs mt-1">Efficient. Secure. Offline.</p>
             </div>
        </div>

        <nav className="flex flex-col py-4">
            <MenuItem icon="trash" label="Trash" onClick={() => handleMenuClick('TRASH')} accentColor={accentColor} />
            <MenuItem icon="hash" label="Tags" onClick={() => handleMenuClick('TAGS')} accentColor={accentColor} />
            <MenuItem icon="heart" label="Favorite" onClick={() => handleMenuClick('FAVORITE')} accentColor={accentColor} />
            <MenuItem icon="settings" label="Settings" onClick={() => handleMenuClick('SETTINGS')} accentColor={accentColor} />
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-zinc-900 bg-black">
            {isLoading ? (
                <div className="flex items-center space-x-4 w-full py-2 animate-pulse">
                     <div className="w-10 h-10 rounded-full bg-zinc-800"></div>
                     <div className="flex flex-col space-y-2 flex-1">
                         <div className="h-3 bg-zinc-800 rounded w-3/4"></div>
                         <div className="h-2 bg-zinc-800 rounded w-1/2"></div>
                     </div>
                </div>
            ) : !user ? (
                <button onClick={handleLoginClick} className="flex items-center space-x-4 w-full group py-2">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors border border-zinc-700">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                           <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3 0 1.66-1.34 3-3 3S9 9.66 9 8c0-1.66 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                        </svg>
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-white font-medium text-sm transition-colors" style={{ color: 'white' }}>
                            Login or Sign up
                        </span>
                        <span className="text-zinc-500 text-xs">Sync with Google</span>
                    </div>
                </button>
            ) : (
                 <div className="flex items-center justify-between w-full py-2 group relative">
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-black font-bold text-lg shrink-0" style={{ backgroundColor: accentColor }}>
                            {user.name.charAt(0)}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-white text-sm font-medium truncate">{user.name}</span>
                            <span className="text-zinc-500 text-xs truncate">{user.email}</span>
                        </div>
                    </div>
                    <button onClick={handleLogoutClick} className="p-2 text-zinc-600 hover:text-red-500 transition-colors">
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

const MenuItem: React.FC<{ icon: string; label: string; onClick: () => void; accentColor: string }> = ({ icon, label, onClick, accentColor }) => {
    const [isHovered, setIsHovered] = useState(false);
    
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
            className="flex items-center w-full px-8 py-5 hover:bg-zinc-900 active:bg-zinc-800 transition-colors"
        >
            <svg className="w-6 h-6 transition-colors mr-6" style={{ color: isHovered ? accentColor : 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                {getIcon()}
            </svg>
            <span className="text-lg font-light tracking-wide transition-colors capitalize" style={{ color: isHovered ? accentColor : 'white' }}>
                {label}
            </span>
        </button>
    )
}

export default SideBar;