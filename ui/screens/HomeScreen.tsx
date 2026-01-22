import React, { useEffect, useState, useMemo } from 'react';
import GoldCard from '../components/GoldCard';
import BottomNav from '../components/BottomNav';
import SideBar from '../components/SideBar';
import { clipboardRepository } from '../../data/repository/ClipboardRepository';
import { ClipboardItem, ScreenName, ClipboardType, SortOption, SortDirection } from '../../types';
import { useSettings } from '../context/SettingsContext';

interface HomeScreenProps {
    onNavigate: (screen: ScreenName) => void;
    onRead?: (item: ClipboardItem) => void;
}

type FilterSource = 'clipboard' | 'notes';
type FilterType = 'ALL' | ClipboardType;

interface FilterState {
  source: FilterSource;
  type: FilterType;
  tag: string;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, onRead }) => {
  const { accentColor, isDarkTheme } = useSettings();

  // --- STATE: Data & Navigation ---
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'clipboard' | 'notes'>('clipboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- STATE: Selection Mode ---
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // --- STATE: Search & Sort & Filter ---
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('CUSTOM');
  const [sortDirection, setSortDirection] = useState<SortDirection>('DESC');

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filter, setFilter] = useState<FilterState>({ source: 'clipboard', type: 'ALL', tag: 'All' });

  // --- STATE: Dialogs & Overlays ---
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null); 
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  
  const [showMoreOptions, setShowMoreOptions] = useState(false); 
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  const [showHashtagOverlay, setShowHashtagOverlay] = useState(false);
  const [hashtagOverlayId, setHashtagOverlayId] = useState<string | null>(null); 
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  // --- STATE: Item Actions ---
  const [activeItemMenuId, setActiveItemMenuId] = useState<string | null>(null);

  // --- DATA FETCHING ---
  const fetchData = async () => {
    const data = await clipboardRepository.getAllItems(sortOption, sortDirection);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [sortOption, sortDirection]);

  // --- COMPUTED VALUES ---
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach(item => item.tags.forEach(t => tags.add(t)));
    return ['All', ...Array.from(tags)];
  }, [items]);

  const displayItems = useMemo(() => {
    return items.filter(item => {
      // 1. Search Logic
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesContent = (item.displayContent || item.content).toLowerCase().includes(query);
        const matchesTags = item.tags.some(t => t.toLowerCase().includes(query));
        if (!matchesContent && !matchesTags) return false;
      }
      // 2. Filter Logic
      if (filter.source === 'notes' && activeTab === 'clipboard') return true; // simplified mock logic for tab switching
      if (filter.type !== 'ALL' && item.type !== filter.type) return false;
      if (filter.tag !== 'All' && !item.tags.includes(filter.tag)) return false;
      return true;
    });
  }, [items, searchQuery, filter, activeTab]);

  // --- HANDLERS: Selection ---
  const handleLongPress = (item: ClipboardItem) => {
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
        if (onRead) onRead(item);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === displayItems.length) {
        setSelectedIds(new Set());
        setIsSelectionMode(false);
    } else {
        setSelectedIds(new Set(displayItems.map(i => i.id)));
    }
  };

  const exitSelectionMode = () => {
      setIsSelectionMode(false);
      setSelectedIds(new Set());
      setShowMoreOptions(false);
      setShowExportOptions(false);
  };

  // --- HANDLERS: Bulk Actions ---
  const handleBulkDelete = () => {
      if (selectedIds.size === 0) return;
      setIsBulkDelete(true);
      setDeleteConfirmId('bulk'); 
  };

  const handleBulkFavorite = async () => {
      if (selectedIds.size === 0) return;
      const hasUnpinned = items.filter(i => selectedIds.has(i.id)).some(i => !i.isPinned);
      if (hasUnpinned) await clipboardRepository.favoriteItems(Array.from(selectedIds));
      else await clipboardRepository.unfavoriteItems(Array.from(selectedIds));
      fetchData();
  };

  const handleGlobalClick = () => {
      setActiveItemMenuId(null); 
      setIsSortMenuOpen(false); 
      setIsFilterOpen(false); 
      setShowMoreOptions(false); 
      setShowExportOptions(false);
  };

  // --- HANDLERS: Drag & Drop ---
  const handleDragStart = (e: React.DragEvent, item: ClipboardItem) => {
      e.dataTransfer.setData('text/plain', item.id);
  };

  const handleDrop = async (e: React.DragEvent, targetItem: ClipboardItem) => {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData('text/plain');
      if (draggedId && draggedId !== targetItem.id) {
          await clipboardRepository.reorderItem(draggedId, targetItem.id);
          fetchData();
      }
  };

  const handleUnpin = async (item: ClipboardItem) => {
      await clipboardRepository.pinItem(item.id, false);
      fetchData();
  };

  // --- RENDER HELPERS ---
  const textColor = isDarkTheme ? 'text-white' : 'text-black';

  return (
    <div 
        className={`min-h-screen relative flex flex-col max-w-md mx-auto border-x shadow-2xl overflow-hidden h-full ${isDarkTheme ? 'bg-black text-white border-zinc-900' : 'bg-white text-black border-gray-200'}`} 
        onClick={handleGlobalClick}
    >
      
      <SideBar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNavigate={onNavigate} />

      {/* --- HEADER --- */}
      <header className={`px-4 py-4 sticky top-0 backdrop-blur-md z-30 flex items-center h-16 transition-all duration-300 border-b ${isDarkTheme ? 'bg-black/95 border-zinc-900' : 'bg-white/95 border-gray-200'}`}>
        {isSelectionMode ? (
            <SelectionHeader 
                selectedCount={selectedIds.size}
                totalCount={displayItems.length}
                textColor={textColor}
                accentColor={accentColor}
                onExit={exitSelectionMode}
                onSelectAll={handleSelectAll}
                onDelete={handleBulkDelete}
                onFavorite={handleBulkFavorite}
                onMore={(e) => { e.stopPropagation(); setShowMoreOptions(true); }}
            />
        ) : isSearchActive ? (
            <SearchHeader 
                query={searchQuery}
                onQueryChange={setSearchQuery}
                onClose={() => { setIsSearchActive(false); setSearchQuery(''); }}
                textColor={textColor}
                accentColor={accentColor}
            />
        ) : (
            <DefaultHeader 
                accentColor={accentColor}
                textColor={textColor}
                isSortMenuOpen={isSortMenuOpen}
                isFilterOpen={isFilterOpen}
                onMenuOpen={(e) => { e.stopPropagation(); setIsSidebarOpen(true); }}
                onSearchOpen={() => setIsSearchActive(true)}
                onSortToggle={(e) => { e.stopPropagation(); setIsSortMenuOpen(!isSortMenuOpen); setIsFilterOpen(false); }}
                onFilterToggle={(e) => { e.stopPropagation(); setIsFilterOpen(!isFilterOpen); setIsSortMenuOpen(false); }}
            />
        )}
      </header>
      
      {/* --- OVERLAYS --- */}
      {isSortMenuOpen && (
          <div onClick={(e) => e.stopPropagation()} className="absolute top-16 right-4 z-40 w-64 animate-fade-in-down">
              <div className={`rounded-lg p-4 shadow-xl border ${isDarkTheme ? 'text-black border-white/20' : 'text-white border-gray-300'}`} style={{ backgroundColor: accentColor }}>
                  <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                          <span className="font-bold">Sort By</span>
                          <button onClick={() => setSortDirection(prev => prev === 'ASC' ? 'DESC' : 'ASC')} className="p-1 rounded hover:bg-black/10">
                              {sortDirection === 'ASC' ? "ASC" : "DESC"}
                          </button>
                      </div>
                      <div className="flex flex-col space-y-2">
                          {(['CUSTOM', 'DATE', 'LENGTH', 'ALPHABETICAL'] as SortOption[]).map((opt) => (
                              <label key={opt} className="flex items-center space-x-2 cursor-pointer">
                                  <div className={`w-4 h-4 rounded-full border border-black flex items-center justify-center ${sortOption === opt ? 'bg-black' : ''}`}>
                                      {sortOption === opt && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }}></div>}
                                  </div>
                                  <span className="text-sm font-medium capitalize">{opt.toLowerCase()}</span>
                                  <input type="radio" name="sort" className="hidden" checked={sortOption === opt} onChange={() => setSortOption(opt)} />
                              </label>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {isFilterOpen && (
        <div onClick={(e) => e.stopPropagation()} className="absolute top-16 right-0 left-0 z-30 px-4 py-2 animate-fade-in-down">
             <div className={`border-2 rounded-3xl p-5 shadow-2xl relative ${isDarkTheme ? 'bg-black border-zinc-700' : 'bg-white border-gray-300'}`} style={{ borderColor: accentColor }}>
                <div className="absolute -top-3 right-5 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px]" style={{ borderBottomColor: accentColor }}></div>
                <div className="flex items-center justify-center mb-6">
                    <svg className={`w-5 h-5 mr-2 ${textColor}`} fill="currentColor" viewBox="0 0 24 24"><path d="M7 11h10v2H7zM4 7h16v2H4zm6 8h4v2h-4z" /></svg>
                    <span className={`text-xl tracking-wider ${textColor}`}>filter</span>
                </div>
                <div className="flex justify-center mb-6 gap-4">
                    <button onClick={() => setFilter(f => ({ ...f, source: 'clipboard' }))} className={`px-6 py-2 rounded-full border text-lg transition-all ${filter.source === 'clipboard' ? 'text-white shadow-[0_0_10px_rgba(0,0,0,0.5)]' : 'bg-transparent text-gray-400'}`} style={{ borderColor: accentColor, backgroundColor: filter.source === 'clipboard' ? (isDarkTheme ? '#1A1A1A' : accentColor) : 'transparent', color: filter.source === 'clipboard' ? (isDarkTheme ? accentColor : 'white') : undefined }}>clipboard</button>
                    <button onClick={() => setFilter(f => ({ ...f, source: 'notes' }))} className={`px-6 py-2 rounded-full border text-lg transition-all ${filter.source === 'notes' ? 'text-white shadow-[0_0_10px_rgba(0,0,0,0.5)]' : 'bg-transparent text-gray-400'}`} style={{ borderColor: accentColor, backgroundColor: filter.source === 'notes' ? (isDarkTheme ? '#1A1A1A' : accentColor) : 'transparent', color: filter.source === 'notes' ? (isDarkTheme ? accentColor : 'white') : undefined }}>notes</button>
                </div>
                 <div className="grid grid-cols-3 gap-y-4 gap-x-2">
                    {availableTags.map(tag => (
                        <FilterItem key={tag} label={tag} active={filter.tag === tag} onClick={() => setFilter(f => ({...f, tag: tag}))} underline={tag === 'All'} accentColor={accentColor} textColor={textColor} />
                    ))}
                </div>
             </div>
        </div>
      )}

      {/* --- LIST CONTENT --- */}
      <main className="flex-1 px-4 pb-32 pt-4 overflow-y-auto no-scrollbar" onClick={handleGlobalClick}>
          {loading ? (
             <div className="text-center mt-20 font-mono" style={{ color: accentColor }}>Loading Bits...</div>
          ) : displayItems.length === 0 ? (
             <div className="text-gray-500 text-center mt-20 font-light">No items found.</div>
          ) : (
            displayItems.map(item => (
              <GoldCard 
                key={item.id} 
                item={item} 
                searchQuery={searchQuery}
                isSelectionMode={isSelectionMode}
                isSelected={selectedIds.has(item.id)}
                isDraggable={sortOption === 'CUSTOM'}
                onMenuClick={(e, i) => { setActiveItemMenuId(i.id); }}
                onLongPress={handleLongPress}
                onClick={handleCardClick}
                onUnpin={handleUnpin}
                onDragStart={handleDragStart}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              />
            ))
          )}
      </main>

      {/* --- FLOATING ACTION BUTTON --- */}
      {!isSelectionMode && (
        <div className="fixed bottom-24 right-6 z-20">
            <button className={`w-16 h-16 rounded-full border-2 flex items-center justify-center hover:scale-105 transition-transform group ${isDarkTheme ? 'bg-black' : 'bg-white'}`} style={{ borderColor: accentColor, boxShadow: `0 0 15px ${accentColor}4D` }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}1A` }}>
                    <svg className="w-8 h-8" style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </div>
            </button>
        </div>
      )}

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

// --- SUB-COMPONENTS for Header ---

const SelectionHeader = ({ selectedCount, totalCount, textColor, accentColor, onExit, onSelectAll, onDelete, onFavorite, onMore }: any) => (
    <div className="flex items-center justify-between w-full animate-fade-in">
        <div className="flex items-center">
            <button onClick={onExit} className={`mr-4 ${textColor}`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <span className={`text-lg font-medium ${textColor}`}>{selectedCount} Selected</span>
        </div>
        <div className="flex items-center space-x-3">
            <button onClick={onSelectAll} style={{ color: selectedCount === totalCount ? accentColor : undefined }} className={`hover:opacity-80 transition-colors ${textColor}`}>
                    {selectedCount === totalCount && totalCount > 0 ? (
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
            <button onClick={onDelete} className={`hover:text-red-500 transition-colors ${textColor}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
            <button onClick={onFavorite} style={{ color: accentColor }} className="hover:opacity-80 transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </button>
            <button onClick={onMore} style={{ color: accentColor }} className="hover:opacity-80 transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
            </button>
        </div>
    </div>
);

const SearchHeader = ({ query, onQueryChange, onClose, textColor, accentColor }: any) => (
    <div className="flex items-center w-full space-x-3 animate-fade-in">
        <button onClick={onClose} className={textColor}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <div className="flex-1 relative">
            <input 
                type="text" 
                placeholder="Search..." 
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                autoFocus
                className={`w-full bg-transparent border rounded-full py-2 px-4 focus:outline-none focus:ring-1 ${textColor}`}
                style={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}00` }}
            />
        </div>
    </div>
);

const DefaultHeader = ({ accentColor, textColor, isSortMenuOpen, isFilterOpen, onMenuOpen, onSearchOpen, onSortToggle, onFilterToggle }: any) => (
    <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-4">
            <button onClick={onMenuOpen} style={{ color: accentColor }}>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h2 className="text-xl tracking-widest font-normal uppercase" style={{ color: accentColor }}>Clipboard Pro</h2>
        </div>
        <div className="flex items-center space-x-4">
            <button onClick={onSearchOpen} style={{ color: accentColor }} className="opacity-80 hover:opacity-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
            <button onClick={onSortToggle} className={`transition-colors ${isSortMenuOpen ? textColor : 'opacity-80 hover:opacity-100'}`} style={{ color: isSortMenuOpen ? undefined : accentColor }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
            </button>
            <button onClick={onFilterToggle} className={`transition-colors ${isFilterOpen ? textColor : 'opacity-80 hover:opacity-100'}`} style={{ color: isFilterOpen ? undefined : accentColor }}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7 11h10v2H7zM4 7h16v2H4zm6 8h4v2h-4z" /></svg>
            </button>
        </div>
    </div>
);

const FilterItem: React.FC<{ label: string; icon?: React.ReactNode; active: boolean; onClick: () => void; underline?: boolean; accentColor: string; textColor: string }> = ({ label, icon, active, onClick, underline, accentColor, textColor }) => (
    <button onClick={onClick} className={`flex items-center justify-center space-x-1 py-1 transition-colors ${active ? 'font-medium' : 'text-gray-400'}`} style={{ color: active ? textColor : undefined }}>
        {icon} <span className="capitalize">{label}</span>
        {underline && active && <div className="absolute bottom-0 w-8 h-[2px] translate-y-2" style={{ backgroundColor: accentColor }}></div>}
    </button>
);

export default HomeScreen;