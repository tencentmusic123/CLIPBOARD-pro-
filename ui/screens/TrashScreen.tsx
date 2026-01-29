import React, { useEffect, useState, useMemo } from 'react';
import { clipboardRepository } from '../../data/repository/ClipboardRepository';
import { ClipboardItem, ClipboardType } from '../../types';
import GoldCard from '../components/GoldCard';
import { useSettings } from '../context/SettingsContext';

interface TrashScreenProps {
  onBack: () => void;
}

type FilterType = 'ALL' | ClipboardType;
type CategoryType = 'ALL' | 'clipboard' | 'notes';

interface FilterState {
  type: FilterType;
  tag: string;
  category: CategoryType;
}

const TrashScreen: React.FC<TrashScreenProps> = ({ onBack }) => {
  const { accentColor, isDarkTheme } = useSettings();
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  
  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filter, setFilter] = useState<FilterState>({
    type: 'ALL',
    tag: 'All',
    category: 'ALL'
  });

  useEffect(() => {
    fetchTrash();
  }, []);

  const fetchTrash = async () => {
    setLoading(true);
    const data = await clipboardRepository.getTrashItems();
    setItems(data);
    
    const tags = await clipboardRepository.getUniqueTags();
    setAvailableTags(['All', ...tags]);
    
    setLoading(false);
  };

  // --- Filtering Logic ---
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 0. Filter by Category
      if (filter.category !== 'ALL' && item.category !== filter.category) return false;

      // 1. Filter by Type
      if (filter.type !== 'ALL' && item.type !== filter.type) return false;

      // 2. Filter by Tag
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
        // Normal click behavior (if any)
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      // Deselect All
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } else {
      // Select All
      const allIds = new Set(filteredItems.map(i => i.id));
      setSelectedIds(allIds);
    }
  };

  const handleRestoreSelected = async () => {
    if (selectedIds.size === 0) return;
    await clipboardRepository.restoreItems(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsSelectionMode(false);
    fetchTrash();
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    await clipboardRepository.deleteItemsForever(Array.from(selectedIds));
    setShowDeleteConfirm(false);
    setSelectedIds(new Set());
    setIsSelectionMode(false);
    fetchTrash();
  };

  // --- Render Helpers ---
  const textColor = isDarkTheme ? 'text-white' : 'text-black';
  const bgColor = isDarkTheme ? 'bg-black' : 'bg-gray-50';
  const headerBg = isDarkTheme ? 'bg-black/80 border-white/5' : 'bg-white/80 border-black/5';
  const overlayBg = isDarkTheme ? 'bg-zinc-900/95 border-white/10' : 'bg-white/95 border-zinc-400';

  return (
    <div className={`h-full w-full flex flex-col relative animate-fade-in font-sans ${bgColor} ${textColor}`} onClick={() => setIsFilterOpen(false)}>
      
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
                    <svg className="w-6 h-6" style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                )}
                <h2 className="text-2xl tracking-wider font-normal" style={{ color: isSelectionMode ? undefined : accentColor }}>
                    {isSelectionMode ? `${selectedIds.size} Selected` : 'Trash'}
                </h2>
            </div>
        </div>

        {isSelectionMode ? (
             <div className="flex items-center space-x-3 text-sm font-medium">
                 <button onClick={handleSelectAll} style={{ color: accentColor }} className="hover:opacity-80 whitespace-nowrap">
                     {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? 'Deselect All' : 'Select All'}
                 </button>
                 <button onClick={handleDeleteSelected} className="text-red-500 hover:text-red-600">Delete</button>
                 <button onClick={handleRestoreSelected} className="text-green-500 hover:text-green-400">Restore</button>
             </div>
        ) : (
            <button 
                onClick={(e) => { e.stopPropagation(); setIsFilterOpen(!isFilterOpen); }} 
                className="hover:opacity-80 transition-opacity"
            >
                <div className="flex items-center gap-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M3 4C3 3.44772 3.44772 3 4 3H20C20.5523 3 21 3.44772 21 4V6.58579C21 6.851 20.8946 7.10536 20.7071 7.29289L14.2929 13.7071C14.1054 13.8946 14 14.149 14 14.4142V17L10 21V14.4142C10 14.149 9.89464 13.8946 9.70711 13.7071L3.29289 7.29289C3.10536 7.10536 3 6.851 3 6.58579V4Z" fill="#D4AF37"/>
                    </svg>
                </div>
            </button>
        )}
      </header>

      {/* --- FILTER DROPDOWN OVERLAY --- */}
      {isFilterOpen && !isSelectionMode && (
        <div onClick={(e) => e.stopPropagation()} className="absolute top-16 right-0 left-0 z-30 px-4 py-2 animate-fade-in-down">
             <div className={`border-2 rounded-3xl p-5 shadow-2xl relative backdrop-blur-xl ${overlayBg}`} style={{ borderColor: accentColor }}>
                
                <div className="flex items-center justify-center mb-6">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                        <path fillRule="evenodd" clipRule="evenodd" d="M3 4C3 3.44772 3.44772 3 4 3H20C20.5523 3 21 3.44772 21 4V6.58579C21 6.851 20.8946 7.10536 20.7071 7.29289L14.2929 13.7071C14.1054 13.8946 14 14.149 14 14.4142V17L10 21V14.4142C10 14.149 9.89464 13.8946 9.70711 13.7071L3.29289 7.29289C3.10536 7.10536 3 6.851 3 6.58579V4Z" fill="#D4AF37"/>
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
                    <FilterItem 
                        label="All" 
                        active={filter.type === 'ALL'} 
                        onClick={() => setFilter(f => ({...f, type: 'ALL'}))} 
                        accentColor={accentColor} 
                        textColor={textColor}
                        underline
                    />
                     <FilterItem 
                        label="Phone" 
                        icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z"/></svg>}
                        active={filter.type === ClipboardType.PHONE} 
                        onClick={() => setFilter(f => ({...f, type: ClipboardType.PHONE}))} 
                        accentColor={accentColor} 
                        textColor={textColor}
                    />
                     <FilterItem 
                        label="Email" 
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                        active={filter.type === ClipboardType.EMAIL} 
                        onClick={() => setFilter(f => ({...f, type: ClipboardType.EMAIL}))} 
                        accentColor={accentColor} 
                        textColor={textColor}
                    />
                     <FilterItem 
                        label="Link" 
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}
                        active={filter.type === ClipboardType.LINK} 
                        onClick={() => setFilter(f => ({...f, type: ClipboardType.LINK}))} 
                        accentColor={accentColor} 
                        textColor={textColor}
                    />
                     <FilterItem 
                        label="Location" 
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
                        active={filter.type === ClipboardType.LOCATION} 
                        onClick={() => setFilter(f => ({...f, type: ClipboardType.LOCATION}))} 
                        accentColor={accentColor} 
                        textColor={textColor}
                    />
                     <FilterItem 
                        label="Secure" 
                        icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-9h-1V6a5 5 0 00-10 0v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zM9 6a3 3 0 116 0v2H9V6z"/></svg>}
                        active={filter.type === ClipboardType.SECURE} 
                        onClick={() => setFilter(f => ({...f, type: ClipboardType.SECURE}))} 
                        accentColor={accentColor} 
                        textColor={textColor}
                    />
                </div>

                {/* Tags Grid */}
                <div className="grid grid-cols-3 gap-y-4 gap-x-2">
                    {availableTags.map(tag => (
                        <FilterItem 
                            key={tag}
                            label={tag} 
                            active={filter.tag === tag} 
                            onClick={() => setFilter(f => ({...f, tag: tag}))}
                            underline={tag === 'All'}
                            accentColor={accentColor}
                            textColor={textColor}
                        />
                    ))}
                </div>
             </div>
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 px-4 py-6 overflow-y-auto no-scrollbar relative z-0">
          {loading ? (
             <div className="text-center mt-20 font-mono text-sm tracking-widest opacity-60 animate-pulse" style={{ color: accentColor }}>LOADING TRASH...</div>
          ) : filteredItems.length === 0 ? (
             <div className="flex flex-col items-center justify-center mt-32 opacity-40">
                 <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                 <span className="font-light tracking-wide">Trash is empty</span>
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
                        
                        {/* Selection Checkmark Overlay */}
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

      {/* --- CONFIRM DELETE MODAL --- */}
      {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-black border border-gold rounded-2xl p-6 w-full max-w-sm shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                  <h3 className="text-white text-xl text-center font-normal mb-8 leading-relaxed">
                      Delete selected items Permanently ?
                  </h3>
                  <div className="flex justify-between items-center px-4">
                      <button 
                        onClick={() => setShowDeleteConfirm(false)}
                        className="text-white text-lg hover:text-gray-300 transition-colors"
                      >
                          No
                      </button>
                      <button 
                        onClick={confirmDelete}
                        className="text-white text-lg hover:text-red-500 transition-colors"
                      >
                          Yes
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

// --- Helper Component for Filter Popup Items ---
const FilterItem: React.FC<{ label: string; icon?: React.ReactNode; active: boolean; onClick: () => void; underline?: boolean; accentColor: string; textColor: string }> = ({ label, icon, active, onClick, underline, accentColor, textColor }) => (
    <button 
        onClick={onClick}
        className={`flex items-center justify-center space-x-1 py-1 transition-colors ${active ? 'font-medium' : 'text-gray-400'}`}
        style={{ color: active ? textColor : undefined }}
    >
        {icon}
        <span className="capitalize">{label}</span>
        {underline && active && <div className="absolute bottom-0 w-8 h-[2px] translate-y-2" style={{ backgroundColor: accentColor }}></div>}
    </button>
);

export default TrashScreen;