import React, { useEffect, useState } from 'react';
import { clipboardRepository } from '../../data/repository/ClipboardRepository';
import { ClipboardItem } from '../../types';
import GoldCard from '../components/GoldCard';
import { useSettings } from '../context/SettingsContext';

interface TagDetailScreenProps {
  tag: string;
  onBack: () => void;
  onRead: (item: ClipboardItem) => void;
}

const TagDetailScreen: React.FC<TagDetailScreenProps> = ({ tag, onBack, onRead }) => {
  const { accentColor, isDarkTheme } = useSettings();
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection Mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Overlays
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [tag]);

  const fetchItems = async () => {
    setLoading(true);
    const data = await clipboardRepository.getItemsByTag(tag);
    setItems(data);
    setLoading(false);
  };

  // --- Handlers ---
  const handleLongPress = (item: ClipboardItem) => {
      if (!isSelectionMode) {
          setIsSelectionMode(true);
          setSelectedIds(new Set([item.id]));
      }
  };

  const handleCardClick = (item: ClipboardItem) => {
      if (isSelectionMode) {
          const newSelected = new Set(selectedIds);
          if (newSelected.has(item.id)) newSelected.delete(item.id);
          else newSelected.add(item.id);
          setSelectedIds(newSelected);
          if (newSelected.size === 0) setIsSelectionMode(false);
      } else {
          onRead(item);
      }
  };

  const handleSelectAll = () => {
      if (selectedIds.size === items.length) {
          setSelectedIds(new Set());
          setIsSelectionMode(false);
      } else {
          setSelectedIds(new Set(items.map(i => i.id)));
      }
  };

  const handleDeleteRequest = () => {
      if (selectedIds.size > 0) setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
      await clipboardRepository.softDeleteItems(Array.from(selectedIds));
      setShowDeleteConfirm(false);
      setIsSelectionMode(false);
      setSelectedIds(new Set());
      fetchItems();
  };

  const handleFavoriteToggle = async () => {
      if (selectedIds.size === 0) return;
      const hasUnpinned = items.filter(i => selectedIds.has(i.id)).some(i => !i.isPinned);
      if (hasUnpinned) await clipboardRepository.favoriteItems(Array.from(selectedIds));
      else await clipboardRepository.unfavoriteItems(Array.from(selectedIds));
      
      setIsSelectionMode(false);
      setSelectedIds(new Set());
      fetchItems();
  };

  const textColor = isDarkTheme ? 'text-white' : 'text-black';
  const bgColor = isDarkTheme ? 'bg-black' : 'bg-gray-50';
  const headerBg = isDarkTheme ? 'bg-black/80 border-white/5' : 'bg-white/80 border-black/5';
  const overlayBg = isDarkTheme ? 'bg-zinc-900/95 border-white/10' : 'bg-white/95 border-zinc-400';

  return (
    <div className={`h-full w-full flex flex-col relative animate-fade-in font-sans ${bgColor} ${textColor}`}>
      
      {/* --- HEADER --- */}
      <header className={`px-4 py-4 flex items-center justify-between sticky top-0 z-20 border-b h-16 flex-shrink-0 backdrop-blur-xl ${headerBg}`}>
        <div className="flex items-center w-full">
            <button onClick={() => isSelectionMode ? setIsSelectionMode(false) : onBack()} className={`hover:opacity-80 transition-opacity mr-4 ${textColor}`} style={{ color: isSelectionMode ? undefined : accentColor }}>
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                 </svg>
            </button>
            
            {isSelectionMode ? (
                <div className="flex items-center justify-between w-full animate-fade-in">
                    <span className="text-lg font-medium">Select</span>
                    <div className="flex items-center space-x-4">
                         {/* Select All */}
                         <button onClick={handleSelectAll} className="hover:opacity-80" style={{ color: accentColor }}>
                            {selectedIds.size === items.length && items.length > 0 ? (
                                <svg className="w-6 h-6" style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 7l4 4L15 5" opacity="0.5" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 6l2 2 4-4" />
                                </svg>
                            )}
                         </button>

                         {/* Trash */}
                         <button onClick={handleDeleteRequest} className="text-red-500 hover:text-red-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         </button>

                         {/* Heart */}
                         <button onClick={handleFavoriteToggle} className="hover:opacity-80" style={{ color: accentColor }}>
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                         </button>

                         {/* More */}
                         <button onClick={() => setShowMoreOptions(!showMoreOptions)} className="hover:opacity-80 relative" style={{ color: accentColor }}>
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                             {showMoreOptions && (
                                 <div className={`absolute right-0 top-8 border rounded-lg w-32 shadow-xl z-50 py-1 backdrop-blur-xl ${overlayBg}`} style={{ borderColor: accentColor }}>
                                     <div className={`px-4 py-2 text-sm text-left cursor-pointer ${isDarkTheme ? 'hover:bg-black text-white' : 'hover:bg-gray-100 text-black'}`}>Export</div>
                                     <div className={`px-4 py-2 text-sm text-left cursor-pointer ${isDarkTheme ? 'hover:bg-black text-white' : 'hover:bg-gray-100 text-black'}`}>Merge</div>
                                 </div>
                             )}
                         </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center">
                    <span className="text-2xl tracking-wider font-normal" style={{ color: accentColor }}>{tag}</span>
                </div>
            )}
        </div>
      </header>

      {/* --- CONTENT --- */}
      <main className="flex-1 p-4 overflow-y-auto">
          {loading ? (
             <div className="text-center text-zinc-500 mt-10">Loading items...</div>
          ) : items.length === 0 ? (
             <div className="text-center text-zinc-500 mt-10">No items with this tag.</div>
          ) : (
             items.map(item => {
                 const isSelected = selectedIds.has(item.id);
                 return (
                     <div 
                        key={item.id}
                        onClick={() => handleCardClick(item)}
                        onContextMenu={(e) => { e.preventDefault(); handleLongPress(item); }}
                        className="relative"
                     >
                         <GoldCard item={item} />
                         {isSelectionMode && (
                             <div className={`absolute inset-0 z-10 flex items-center justify-end pr-4 rounded-3xl transition-colors ${isSelected ? 'bg-gold/10 ring-2 ring-gold' : 'bg-black/40'}`}>
                                {isSelected ? (
                                    <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <div className="w-6 h-6 rounded-full border-2 border-gray-500"></div>
                                )}
                             </div>
                         )}
                     </div>
                 );
             })
          )}
      </main>

      {/* --- DELETE CONFIRM --- */}
      {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className={`border rounded-2xl p-6 w-full max-w-sm ${isDarkTheme ? 'bg-black border-zinc-700' : 'bg-white border-zinc-400'}`} style={{ borderColor: accentColor }}>
                  <h3 className={`text-xl text-center font-normal mb-8 leading-relaxed ${textColor}`}>
                      Move selected items to Trash?
                  </h3>
                  <div className="flex justify-between items-center px-4">
                      <button onClick={() => setShowDeleteConfirm(false)} className="text-zinc-500 hover:opacity-80">No</button>
                      <button onClick={confirmDelete} className="text-red-500 hover:opacity-80">Yes</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default TagDetailScreen;