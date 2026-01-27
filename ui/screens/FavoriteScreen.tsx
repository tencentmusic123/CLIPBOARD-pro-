import React, { useEffect, useState, useMemo } from 'react';
import { clipboardRepository } from '../../data/repository/ClipboardRepository';
import { ClipboardItem, ClipboardType } from '../../types';
import GoldCard from '../components/GoldCard';
import JSZip from 'jszip';
import { useSettings } from '../context/SettingsContext';
import { Clipboard } from '@capacitor/clipboard';

interface FavoriteScreenProps {
  onBack: () => void;
  onRead?: (item: ClipboardItem) => void;
}

type FilterType = 'ALL' | ClipboardType;
type CategoryType = 'ALL' | 'clipboard' | 'notes';

interface FilterState {
  type: FilterType;
  tag: string;
  category: CategoryType;
}

const FavoriteScreen: React.FC<FavoriteScreenProps> = ({ onBack, onRead }) => {
  const { accentColor, isDarkTheme } = useSettings();
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  
  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Dialog/Overlay States
  const [showMoveToTrashConfirm, setShowMoveToTrashConfirm] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showHashtagOverlay, setShowHashtagOverlay] = useState(false);
  
  // Hashtag State
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filter, setFilter] = useState<FilterState>({
    type: 'ALL',
    tag: 'All',
    category: 'ALL'
  });

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    const data = await clipboardRepository.getFavoriteItems();
    setItems(data);
    
    const tags = await clipboardRepository.getUniqueTags();
    setAvailableTags(['All', ...tags]);
    
    setLoading(false);
  };

  // --- Filtering Logic ---
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (filter.category !== 'ALL' && item.category !== filter.category) return false;
      if (filter.type !== 'ALL' && item.type !== filter.type) return false;
      if (filter.tag !== 'All' && !item.tags.includes(filter.tag)) return false;
      return true;
    });
  }, [items, filter]);


  // --- Selection Logic ---
  const handleLongClick = (item: ClipboardItem) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedIds(new Set([item.id]));
    }
  };

  const handleCardClick = (item: ClipboardItem) => {
    if (isSelectionMode) {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(item.id)) {
        newSelected.delete(item.id);
        if (newSelected.size === 0) setIsSelectionMode(false);
      } else {
        newSelected.add(item.id);
      }
      setSelectedIds(newSelected);
    } else {
        // Navigate to Read Mode
        if (onRead) onRead(item);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set()); // Deselect
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id))); // Select All
    }
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
    setShowMoreOptions(false);
  };

  // --- Action Handlers ---

  const handleRemoveFavorites = async () => {
    if (selectedIds.size === 0) return;
    await clipboardRepository.unfavoriteItems(Array.from(selectedIds));
    exitSelectionMode();
    fetchFavorites();
  };

  const handleMoveToTrashRequest = () => {
    if (selectedIds.size === 0) return;
    setShowMoveToTrashConfirm(true);
  };

  const confirmMoveToTrash = async () => {
    await clipboardRepository.softDeleteItems(Array.from(selectedIds));
    setShowMoveToTrashConfirm(false);
    exitSelectionMode();
    fetchFavorites();
  };

  const handleMerge = async () => {
      await clipboardRepository.mergeItems(Array.from(selectedIds));
      exitSelectionMode();
      fetchFavorites();
  };

  const handleShare = () => {
    const handleShare = async () => {
      const textToShare = filteredItems
        .filter(i => selectedIds.has(i.id))
        .map(i => i.content).join('\n\n');
        
      if (navigator.share) {
          navigator.share({ title: 'Shared Clips', text: textToShare });
      } else {
          await Clipboard.write({ string: textToShare });
          alert("Copied to clipboard for sharing");
      }
      exitSelectionMode();
  };

  const handleExport = async () => {
      const selectedItems = filteredItems.filter(i => selectedIds.has(i.id));
      if (selectedItems.length === 0) return;

      if (selectedItems.length === 1) {
          // Single export
          const item = selectedItems[0];
          const filename = (item.title ? item.title.replace(/[^a-z0-9_\-\. ]/gi, '') : `Clip`) + '.txt';
          const blob = new Blob([item.content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      } else {
          // ZIP export
          const zip = new JSZip();
          selectedItems.forEach((item, index) => {
              const safeTitle = item.title ? item.title.replace(/[^a-z0-9_\-\. ]/gi, '') : `Clip`;
              const filename = `${safeTitle}_${index + 1}.txt`;
              zip.file(filename, item.content);
          });

          const content = await zip.generateAsync({ type: 'blob' });
          const url = URL.createObjectURL(content);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Favorites_Export_${Date.now()}.zip`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      }
      
      exitSelectionMode();
  };

  const handleCopyToNotes = () => {
      alert("Selected items copied to Notes!");
      exitSelectionMode();
  };

  const handlePrint = () => {
      window.print();
      exitSelectionMode();
  };

  const handleAddHashtagStart = () => {
      setShowMoreOptions(false);
      setShowHashtagOverlay(true);
  };

  const handleAddHashtagDone = async () => {
      await clipboardRepository.addTagsToItems(Array.from(selectedIds), Array.from(selectedTags));
      setShowHashtagOverlay(false);
      setSelectedTags(new Set());
      exitSelectionMode();
      fetchFavorites();
  };

  // --- Render ---
  const textColor = isDarkTheme ? 'text-white' : 'text-black';
  const bgColor = isDarkTheme ? 'bg-black' : 'bg-gray-50';
  const headerBg = isDarkTheme ? 'bg-black/80 border-white/5' : 'bg-white/80 border-black/5';
  const overlayBg = isDarkTheme ? 'bg-zinc-900/95 border-white/10' : 'bg-white/95 border-gray-200';

  return (
    <div className={`h-full w-full flex flex-col relative animate-fade-in font-sans ${bgColor} ${textColor}`} onClick={() => setShowMoreOptions(false)}>
      
      {/* --- HEADER --- */}
      <header className={`px-4 py-4 flex items-center justify-between sticky top-0 z-20 border-b h-16 flex-shrink-0 backdrop-blur-xl ${headerBg}`}>
        <div className="flex items-center">
            <button onClick={() => isSelectionMode ? setIsSelectionMode(false) : onBack()} className={`hover:opacity-80 transition-opacity mr-3 ${textColor}`} style={{ color: isSelectionMode ? undefined : accentColor }}>
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                 </svg>
            </button>
            
            <div className="flex items-center space-x-2">
                {!isSelectionMode && (
                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                )}
                <h2 className={`text-2xl tracking-wider font-normal`} style={{ color: isSelectionMode ? textColor : accentColor }}>
                    {isSelectionMode ? `${selectedIds.size} Selected` : 'Favorite'}
                </h2>
            </div>
        </div>

        {isSelectionMode ? (
             <div className="flex items-center space-x-3">
                 {/* Double Right Mark (Select All) */}
                 <button onClick={handleSelectAll} style={{ color: accentColor }} className="hover:opacity-80 transition-colors">
                    {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? (
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                             <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                             <path strokeLinecap="round" strokeLinejoin="round" d="M5 7l4 4L15 5" opacity="0.5" />
                        </svg>
                    ) : (
                         <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                             <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                             <path strokeLinecap="round" strokeLinejoin="round" d="M11 6l2 2 4-4" />
                         </svg>
                    )}
                 </button>
                 
                 {/* Trash */}
                 <button onClick={handleMoveToTrashRequest} className="text-white hover:text-red-500 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                 </button>

                 {/* Heart (Remove Fav) */}
                 <button onClick={handleRemoveFavorites} style={{ color: accentColor }} className="hover:opacity-80 transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                 </button>

                 {/* 3 Dots (More) */}
                 <button onClick={(e) => { e.stopPropagation(); setShowMoreOptions(true); }} style={{ color: accentColor }} className="hover:opacity-80 transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                 </button>
             </div>
        ) : (
            <button 
                onClick={(e) => { e.stopPropagation(); setIsFilterOpen(!isFilterOpen); }} 
                className="hover:opacity-80 transition-opacity"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M3 4C3 3.44772 3.44772 3 4 3H20C20.5523 3 21 3.44772 21 4V6.58579C21 6.851 20.8946 7.10536 20.7071 7.29289L14.2929 13.7071C14.1054 13.8946 14 14.149 14 14.4142V17L10 21V14.4142C10 14.149 9.89464 13.8946 9.70711 13.7071L3.29289 7.29289C3.10536 7.10536 3 6.851 3 6.58579V4Z" fill="#EAC336"/>
                </svg>
            </button>
        )}
      </header>

      {/* --- FILTER DROPDOWN OVERLAY --- */}
      {isFilterOpen && !isSelectionMode && (
        <div onClick={(e) => e.stopPropagation()} className="absolute top-16 right-0 left-0 z-30 px-4 py-2 animate-fade-in-down">
             <div className={`border-2 rounded-3xl p-5 shadow-2xl relative backdrop-blur-xl ${overlayBg}`} style={{ borderColor: accentColor }}>
                <div className="flex items-center justify-center mb-6">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                        <path fillRule="evenodd" clipRule="evenodd" d="M3 4C3 3.44772 3.44772 3 4 3H20C20.5523 3 21 3.44772 21 4V6.58579C21 6.851 20.8946 7.10536 20.7071 7.29289L14.2929 13.7071C14.1054 13.8946 14 14.149 14 14.4142V17L10 21V14.4142C10 14.149 9.89464 13.8946 9.70711 13.7071L3.29289 7.29289C3.10536 7.10536 3 6.851 3 6.58579V4Z" fill="#EAC336"/>
                    </svg>
                    <span className={`text-xl tracking-wider ${textColor}`}>filter</span>
                </div>
                
                {/* Category Switching - NEW */}
                <div className="flex justify-center space-x-6 mb-6 border-b pb-4" style={{ borderColor: isDarkTheme ? '#333' : '#eee' }}>
                    <FilterItem 
                        label="All" 
                        active={filter.category === 'ALL'} 
                        onClick={() => setFilter(f => ({...f, category: 'ALL'}))} 
                        accentColor={accentColor} 
                        textColor={textColor}
                        underline
                    />
                    <FilterItem 
                        label="Clipboard" 
                        active={filter.category === 'clipboard'} 
                        onClick={() => setFilter(f => ({...f, category: 'clipboard'}))} 
                        accentColor={accentColor} 
                        textColor={textColor}
                        underline
                    />
                     <FilterItem 
                        label="Notes" 
                        active={filter.category === 'notes'} 
                        onClick={() => setFilter(f => ({...f, category: 'notes'}))} 
                        accentColor={accentColor} 
                        textColor={textColor}
                        underline
                    />
                </div>

                {/* Types Grid */}
                <div className="grid grid-cols-3 gap-y-4 gap-x-2 mb-6 border-b pb-4" style={{ borderColor: isDarkTheme ? '#333' : '#eee' }}>
                    <FilterItem label="All" active={filter.type === 'ALL'} onClick={() => setFilter(f => ({...f, type: 'ALL'}))} underline accentColor={accentColor} textColor={textColor} />
                    <FilterItem label="Phone" active={filter.type === ClipboardType.PHONE} onClick={() => setFilter(f => ({...f, type: ClipboardType.PHONE}))} accentColor={accentColor} textColor={textColor} />
                    <FilterItem label="Link" active={filter.type === ClipboardType.LINK} onClick={() => setFilter(f => ({...f, type: ClipboardType.LINK}))} accentColor={accentColor} textColor={textColor} />
                    <FilterItem label="Location" active={filter.type === ClipboardType.LOCATION} onClick={() => setFilter(f => ({...f, type: ClipboardType.LOCATION}))} accentColor={accentColor} textColor={textColor} />
                    <FilterItem label="Secure" active={filter.type === ClipboardType.SECURE} onClick={() => setFilter(f => ({...f, type: ClipboardType.SECURE}))} accentColor={accentColor} textColor={textColor} />
                </div>
                <div className="grid grid-cols-3 gap-y-4 gap-x-2">
                    {availableTags.map(tag => (
                        <FilterItem key={tag} label={tag} active={filter.tag === tag} onClick={() => setFilter(f => ({...f, tag: tag}))} underline={tag === 'All'} accentColor={accentColor} textColor={textColor} />
                    ))}
                </div>
             </div>
        </div>
      )}

      {/* --- MORE OPTIONS MENU OVERLAY --- */}
      {showMoreOptions && (
          <div onClick={(e) => e.stopPropagation()} className="absolute top-16 right-4 z-40 animate-fade-in-down w-56">
              <div className={`border rounded-xl overflow-hidden shadow-2xl flex flex-col backdrop-blur-xl ${overlayBg}`} style={{ borderColor: accentColor }}>
                  <MenuItem label="Merge" onClick={handleMerge} textColor={textColor} />
                  <MenuItem label="Share" onClick={handleShare} textColor={textColor} />
                  <MenuItem label="Export" onClick={handleExport} textColor={textColor} />
                  <MenuItem label="Copy to Notes" onClick={handleCopyToNotes} textColor={textColor} />
                  <MenuItem label="Print" onClick={handlePrint} textColor={textColor} />
                  <MenuItem label="Add #Tag" onClick={handleAddHashtagStart} textColor={textColor} />
              </div>
          </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 px-4 py-6 overflow-y-auto no-scrollbar relative z-0">
          {loading ? (
             <div className="text-center mt-20 font-mono text-sm tracking-widest opacity-60 animate-pulse" style={{ color: accentColor }}>LOADING FAVORITES...</div>
          ) : filteredItems.length === 0 ? (
             <div className="flex flex-col items-center justify-center mt-32 opacity-40">
                 <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                 <span className="font-light tracking-wide">No favorites yet</span>
             </div>
          ) : (
            filteredItems.map(item => {
                const isSelected = selectedIds.has(item.id);
                return (
                    <div 
                        key={item.id} 
                        onClick={() => handleCardClick(item)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            handleLongClick(item);
                        }}
                        className={`relative transition-all duration-200 ${isSelectionMode ? 'cursor-pointer' : ''}`}
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

      {/* --- CONFIRM MOVE TO TRASH MODAL --- */}
      {showMoveToTrashConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-black border border-gold rounded-2xl p-6 w-full max-w-sm shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                  <h3 className="text-white text-xl text-center font-normal mb-8 leading-relaxed">
                      Move selected items to Trash?
                  </h3>
                  <div className="flex justify-between items-center px-4">
                      <button onClick={() => setShowMoveToTrashConfirm(false)} className="text-white text-lg hover:text-gray-300 transition-colors">No</button>
                      <button onClick={confirmMoveToTrash} className="text-white text-lg hover:text-red-500 transition-colors">Yes</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- ADD HASHTAG OVERLAY --- */}
      {showHashtagOverlay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-black border border-gold rounded-2xl p-6 w-full max-w-sm">
                   <h3 className="text-gold text-lg mb-4 text-center">Select Tags</h3>
                   <div className="grid grid-cols-2 gap-3 mb-6">
                       {availableTags.filter(t => t !== 'All').map(tag => (
                           <button 
                                key={tag}
                                onClick={() => {
                                    const newSet = new Set(selectedTags);
                                    if (newSet.has(tag)) newSet.delete(tag);
                                    else newSet.add(tag);
                                    setSelectedTags(newSet);
                                }}
                                className={`px-3 py-2 rounded-lg border text-sm ${selectedTags.has(tag) ? 'bg-gold text-black border-gold' : 'border-zinc-700 text-zinc-300'}`}
                           >
                               {tag}
                           </button>
                       ))}
                       {/* Mock "Add New" button */}
                       <button className="px-3 py-2 rounded-lg border border-zinc-700 text-zinc-500 text-sm border-dashed">+ New Tag</button>
                   </div>
                   <div className="flex justify-between items-center px-2">
                      <button onClick={() => setShowHashtagOverlay(false)} className="text-white text-lg hover:text-gray-300">Cancel</button>
                      <button onClick={handleAddHashtagDone} className="text-gold text-lg hover:text-white">Done</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

// --- Helper Component ---
const FilterItem: React.FC<{ label: string; icon?: React.ReactNode; active: boolean; onClick: () => void; underline?: boolean; accentColor: string; textColor: string }> = ({ label, icon, active, onClick, underline, accentColor, textColor }) => (
    <button onClick={onClick} className={`flex items-center justify-center space-x-1 py-1 transition-colors ${active ? 'font-medium' : 'text-gray-400'}`} style={{ color: active ? textColor : undefined }}>
        {icon} <span className="capitalize">{label}</span>
        {underline && active && <div className="absolute bottom-0 w-8 h-[2px] translate-y-2" style={{ backgroundColor: accentColor }}></div>}
    </button>
);

const MenuItem: React.FC<{ label: string; onClick: () => void; textColor?: string }> = ({ label, onClick, textColor }) => (
    <button onClick={onClick} className={`text-left w-full px-4 py-3 hover:bg-opacity-20 hover:bg-gray-500 ${textColor} text-sm font-medium border-b border-gray-700 last:border-0`}>
        {label}
    </button>
);

export default FavoriteScreen;
