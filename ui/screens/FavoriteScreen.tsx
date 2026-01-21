import React, { useEffect, useState, useMemo } from 'react';
import { clipboardRepository } from '../../data/repository/ClipboardRepository';
import { ClipboardItem, ClipboardType } from '../../types';
import GoldCard from '../components/GoldCard';

interface FavoriteScreenProps {
  onBack: () => void;
  onRead?: (item: ClipboardItem) => void;
}

type FilterSource = 'clipboard' | 'notes';
type FilterType = 'ALL' | ClipboardType;

interface FilterState {
  source: FilterSource;
  type: FilterType;
  tag: string;
}

const FavoriteScreen: React.FC<FavoriteScreenProps> = ({ onBack, onRead }) => {
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Dialog/Overlay States
  const [showMoveToTrashConfirm, setShowMoveToTrashConfirm] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showHashtagOverlay, setShowHashtagOverlay] = useState(false);
  
  // Hashtag State
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filter, setFilter] = useState<FilterState>({
    source: 'clipboard',
    type: 'ALL',
    tag: 'All'
  });

  // Unique Tags logic
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach(item => item.tags.forEach(t => tags.add(t)));
    return ['All', ...Array.from(tags)];
  }, [items]);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    const data = await clipboardRepository.getFavoriteItems();
    setItems(data);
    setLoading(false);
  };

  // --- Filtering Logic ---
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (filter.source === 'notes') return false; 
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
    setShowExportOptions(false);
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
      const textToShare = filteredItems
        .filter(i => selectedIds.has(i.id))
        .map(i => i.content).join('\n\n');
        
      if (navigator.share) {
          navigator.share({ title: 'Shared Clips', text: textToShare });
      } else {
          navigator.clipboard.writeText(textToShare);
          alert("Copied to clipboard for sharing");
      }
      exitSelectionMode();
  };

  const handleExport = (format: 'txt' | 'pdf') => {
      const textToExport = filteredItems
        .filter(i => selectedIds.has(i.id))
        .map(i => i.content).join('\n\n-------------------\n\n');
        
      const element = document.createElement("a");
      const file = new Blob([textToExport], {type: format === 'pdf' ? 'application/pdf' : 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `favorites_export_${Date.now()}.${format}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
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

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col max-w-md mx-auto border-x border-zinc-900 shadow-2xl h-full animate-fade-in font-sans" onClick={() => { setShowMoreOptions(false); setShowExportOptions(false); }}>
      
      {/* --- HEADER --- */}
      <header className="px-4 py-4 flex items-center justify-between bg-black/95 backdrop-blur-md sticky top-0 z-20 border-b border-zinc-800 h-16">
        <div className="flex items-center">
            <button onClick={() => isSelectionMode ? setIsSelectionMode(false) : onBack()} className="text-white hover:text-gold transition-colors mr-3">
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
                <h2 className={`text-2xl tracking-wider font-normal ${isSelectionMode ? 'text-white' : 'text-gold'}`}>
                    {isSelectionMode ? `${selectedIds.size} Selected` : 'Favorite'}
                </h2>
            </div>
        </div>

        {isSelectionMode ? (
             <div className="flex items-center space-x-3">
                 {/* Double Right Mark (Select All) */}
                 <button onClick={handleSelectAll} className="text-white hover:text-gold transition-colors">
                    {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? (
                        <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
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
                 <button onClick={handleRemoveFavorites} className="text-white hover:text-gold transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                 </button>

                 {/* 3 Dots (More) */}
                 <button onClick={(e) => { e.stopPropagation(); setShowMoreOptions(true); }} className="text-white hover:text-gold transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                 </button>
             </div>
        ) : (
            <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)} 
                className={`transition-colors ${isFilterOpen ? 'text-gold' : 'text-white hover:text-gold'}`}
            >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 11h10v2H7zM4 7h16v2H4zm6 8h4v2h-4z" />
                </svg>
            </button>
        )}
      </header>

      {/* Decorative Line */}
      <div className="h-[2px] w-full bg-gold/50 shadow-[0_0_10px_rgba(212,175,55,0.5)] z-10"></div>

      {/* --- FILTER DROPDOWN OVERLAY --- */}
      {isFilterOpen && !isSelectionMode && (
        <div className="absolute top-16 right-0 left-0 z-30 px-4 py-2 animate-fade-in-down">
             <div className="bg-black border-2 border-gold rounded-3xl p-5 shadow-2xl relative">
                <div className="absolute -top-3 right-5 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-gold"></div>
                <div className="flex items-center justify-center mb-6">
                    <svg className="w-5 h-5 text-white mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M7 11h10v2H7zM4 7h16v2H4zm6 8h4v2h-4z" /></svg>
                    <span className="text-white text-xl tracking-wider">filter</span>
                </div>
                <div className="flex justify-center mb-6 gap-4">
                    <button onClick={() => setFilter(f => ({ ...f, source: 'clipboard' }))} className={`px-6 py-2 rounded-full border border-gold text-lg transition-all ${filter.source === 'clipboard' ? 'bg-black text-white shadow-[0_0_10px_#D4AF37]' : 'bg-transparent text-gray-400'}`}>clipboard</button>
                    <button onClick={() => setFilter(f => ({ ...f, source: 'notes' }))} className={`px-6 py-2 rounded-full border border-gold text-lg transition-all ${filter.source === 'notes' ? 'bg-black text-white shadow-[0_0_10px_#D4AF37]' : 'bg-transparent text-gray-400'}`}>notes</button>
                </div>
                <div className="grid grid-cols-3 gap-y-4 gap-x-2 mb-6">
                    <FilterItem label="All" active={filter.type === 'ALL'} onClick={() => setFilter(f => ({...f, type: 'ALL'}))} underline />
                    <FilterItem label="Phone" active={filter.type === ClipboardType.PHONE} onClick={() => setFilter(f => ({...f, type: ClipboardType.PHONE}))} />
                    <FilterItem label="Link" active={filter.type === ClipboardType.LINK} onClick={() => setFilter(f => ({...f, type: ClipboardType.LINK}))} />
                    <FilterItem label="Location" active={filter.type === ClipboardType.LOCATION} onClick={() => setFilter(f => ({...f, type: ClipboardType.LOCATION}))} />
                    <FilterItem label="Secure" active={filter.type === ClipboardType.SECURE} onClick={() => setFilter(f => ({...f, type: ClipboardType.SECURE}))} />
                </div>
                <div className="grid grid-cols-3 gap-y-4 gap-x-2">
                    {availableTags.map(tag => (
                        <FilterItem key={tag} label={tag} active={filter.tag === tag} onClick={() => setFilter(f => ({...f, tag: tag}))} underline={tag === 'All'} />
                    ))}
                </div>
             </div>
        </div>
      )}

      {/* --- MORE OPTIONS MENU OVERLAY --- */}
      {showMoreOptions && (
          <div onClick={(e) => e.stopPropagation()} className="absolute top-16 right-4 z-40 animate-fade-in-down w-56">
              <div className="bg-zinc-900 border border-gold rounded-xl overflow-hidden shadow-2xl flex flex-col">
                  {showExportOptions ? (
                     <>
                        <div className="px-4 py-3 text-gold text-center border-b border-zinc-800 font-bold">Export As</div>
                        <MenuItem label="TXT File" onClick={() => handleExport('txt')} />
                        <MenuItem label="PDF File" onClick={() => handleExport('pdf')} />
                        <MenuItem label="< Back" onClick={() => setShowExportOptions(false)} textColor='text-zinc-500' />
                     </>
                  ) : (
                    <>
                      <MenuItem label="Merge" onClick={handleMerge} />
                      <MenuItem label="Share" onClick={handleShare} />
                      <div className="group relative">
                          <button onClick={() => setShowExportOptions(true)} className="w-full px-4 py-3 text-left text-white hover:bg-zinc-800 border-b border-zinc-800 flex justify-between items-center text-sm font-medium">
                              Export <span>▸</span>
                          </button>
                      </div>
                      <MenuItem label="Copy to Notes" onClick={handleCopyToNotes} />
                      <MenuItem label="Print" onClick={handlePrint} />
                      <MenuItem label="Add #Tag" onClick={handleAddHashtagStart} />
                    </>
                  )}
              </div>
          </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 px-4 py-6 overflow-y-auto no-scrollbar relative z-0">
          {loading ? (
             <div className="text-gold text-center mt-20 font-mono">Loading Favorites...</div>
          ) : filteredItems.length === 0 ? (
             <div className="text-gray-500 text-center mt-20 font-light italic">No favorites yet</div>
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
                                    <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
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
const FilterItem: React.FC<{ label: string; icon?: React.ReactNode; active: boolean; onClick: () => void; underline?: boolean }> = ({ label, icon, active, onClick, underline }) => (
    <button onClick={onClick} className={`flex items-center justify-center space-x-1 py-1 transition-colors ${active ? 'text-white font-medium' : 'text-gray-400 hover:text-white'}`}>
        {icon} <span className="capitalize">{label}</span>
        {underline && active && <div className="absolute bottom-0 w-8 h-[2px] bg-gold translate-y-2"></div>}
    </button>
);

const MenuItem: React.FC<{ label: string; onClick: () => void; textColor?: string }> = ({ label, onClick, textColor = 'text-white' }) => (
    <button onClick={onClick} className={`text-left w-full px-4 py-3 hover:bg-zinc-800 ${textColor} text-sm font-medium border-b border-zinc-800 last:border-0`}>
        {label}
    </button>
);

export default FavoriteScreen;