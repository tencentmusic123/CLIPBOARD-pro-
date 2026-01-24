import React from 'react';

interface BottomNavProps {
  activeTab: 'clipboard' | 'notes';
  onTabChange: (tab: 'clipboard' | 'notes') => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-full p-1 shadow-2xl">
            {/* Clipboard Tab */}
            <button 
                onClick={() => onTabChange('clipboard')}
                className={`flex items-center space-x-2 px-6 py-2.5 rounded-full transition-all duration-300 ${activeTab === 'clipboard' ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'text-zinc-500 hover:text-white'}`}
            >
                <span className={`text-xs font-bold uppercase tracking-wider`}>
                    Clips
                </span>
            </button>

            {/* Notes Tab */}
            <button 
                onClick={() => onTabChange('notes')}
                className={`flex items-center space-x-2 px-6 py-2.5 rounded-full transition-all duration-300 ${activeTab === 'notes' ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'text-zinc-500 hover:text-white'}`}
            >
                <span className={`text-xs font-bold uppercase tracking-wider`}>
                    Notes
                </span>
            </button>
        </div>
    </div>
  );
};

export default BottomNav;