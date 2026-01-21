import React from 'react';

interface BottomNavProps {
  activeTab: 'clipboard' | 'notes';
  onTabChange: (tab: 'clipboard' | 'notes') => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black pt-2 pb-6 px-10 flex justify-between items-end z-20">
        {/* Clipboard Tab */}
        <button 
            onClick={() => onTabChange('clipboard')}
            className="flex flex-col items-center flex-1"
        >
            <span className={`text-xl tracking-wider ${activeTab === 'clipboard' ? 'text-white' : 'text-gray-500'}`}>
                clipboard
            </span>
            {activeTab === 'clipboard' && (
                <div className="h-1 w-full bg-gold mt-1 rounded-full" />
            )}
        </button>

        {/* Notes Tab */}
        <button 
            onClick={() => onTabChange('notes')}
            className="flex flex-col items-center flex-1 ml-4"
        >
            <span className={`text-xl tracking-wider ${activeTab === 'notes' ? 'text-white' : 'text-gray-500'}`}>
                notes
            </span>
            {activeTab === 'notes' && (
                <div className="h-1 w-full bg-gold mt-1 rounded-full" />
            )}
        </button>
    </div>
  );
};

export default BottomNav;