import React, { useEffect, useState, useMemo } from 'react';
import GoldCard from '../components/GoldCard';
import BottomNav from '../components/BottomNav';
import SideBar from '../components/SideBar';
import { clipboardRepository } from '../../data/repository/ClipboardRepository';
import { ClipboardItem, ScreenName, ClipboardType, SortOption, SortDirection } from '../../types';
import { useSettings } from '../context/SettingsContext';
import JSZip from 'jszip';

interface HomeScreenProps {
    onNavigate: (screen: ScreenName) => void;
    onRead?: (item: ClipboardItem) => void;
    onCreateNew?: () => void;
}

type FilterType = 'ALL' | ClipboardType;

interface FilterState {
  type: FilterType;
  tag: string;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, onRead, onCreateNew }) => {
  const { accentColor, isDarkTheme } = useSettings();

  // --- STATE: Data & Navigation ---
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>(['All']);
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
  const [filter, setFilter] = useState<FilterState>({ type: 'ALL', tag: 'All' });

  // --- STATE: Dialogs & Overlays ---
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- STATE: Hashtag Overlay ---
  const [showHashtagOverlay, setShowHashtagOverlay] = useState(false);
  const [overlaySelectedTags, setOverlaySelectedTags] = useState<Set<string>>(new Set());
  const [newTagInput, setNewTagInput] = useState('');

  // --- STATE: Item Actions ---
  const [activeItemMenuId, setActiveItemMenuId] = useState<string | null>(null);

  // --- DATA FETCHING ---
  const fetchData = async () => {
    const data = await clipboardRepository.getAllItems(sortOption, sortDirection);
    setItems(data);
    
    const tags = await clipboardRepository.getUniqueTags();
    setAvailableTags(['All', ...tags]);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [sortOption, sortDirection]);

  // --- TOAST HELPER ---
  const showToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3000);
  };

  // --- COMPUTED VALUES ---
  const displayItems = useMemo(() => {
    return items.filter(item => {
      // 0. Tab Logic (Folder separation)
      if (item.category !== activeTab) return false;

      // 1. Search Logic
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesContent = (item.displayContent || item.content).toLowerCase().includes(query);
        const matchesTags = item.tags.some(t => t.toLowerCase().includes(query));
        if (!matchesContent && !matchesTags) return false;
      }
      
      // 2. Filter Logic
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
      setShowMoreMenu(false);
      setShowDeleteConfirmation(false);
      setShowHashtagOverlay(false);
  };

  // --- HANDLERS: Actions ---
  const handleBulkDelete = () => {
      if (selectedIds.size === 0) return;
      setShowDeleteConfirmation(true);
  };

  const confirmBulkDelete = async () => {
      await clipboardRepository.softDeleteItems(Array.from(selectedIds));
      fetchData();
      showToast(`${selectedIds.size} items moved to Trash`);
      exitSelectionMode();
  };

  const handleBulkFavorite = async () => {
      if (selectedIds.size === 0) return;
      const hasUnfavorite = items.filter(i => selectedIds.has(i.id)).some(i => !i.isFavorite);
      if (hasUnfavorite) {
          await clipboardRepository.favoriteItems(Array.from(selectedIds));
          showToast("Added to Favorites");
      } else {
          await clipboardRepository.unfavoriteItems(Array.from(selectedIds));
          showToast("Removed from Favorites");
      }
      fetchData();
  };

  const handleBulkCopy = async () => {
      const selectedItems = items.filter(i => selectedIds.has(i.id));
      if (selectedItems.length === 0) return;

      const textToCopy = selectedItems.map(i => i.content).join('\n\n');
      
      try {
        await navigator.clipboard.writeText(textToCopy);
        showToast("Copied to system clipboard");
      } catch (err) {
        console.error("Copy failed", err);
        showToast("Failed to copy");
      }
      
      setShowMoreMenu(false);
      exitSelectionMode();
  };

  const handleMerge = async () => {
      if (selectedIds.size < 2) {
          showToast("Select at least 2 items to merge");
          return;
      }
      await clipboardRepository.mergeItems(Array.from(selectedIds));
      fetchData();
      showToast("Items merged successfully");
      exitSelectionMode();
  };

  const handleShare = async () => {
      const selectedItems = items.filter(i => selectedIds.has(i.id));
      const textToShare = selectedItems.map(i => i.content).join('\n\n');
      if (navigator.share) {
          try {
              await navigator.share({ title: 'Shared Clips', text: textToShare });
          } catch (err) {
              console.error(err);
          }
      } else {
          navigator.clipboard.writeText(textToShare);
          showToast("Copied to clipboard for sharing");
      }
      exitSelectionMode();
  };

  const handleCopyToNotes = async () => {
      // Simulate copying to the other category
      const targetCategory = activeTab === 'clipboard' ? 'notes' : 'clipboard';
      const selectedItems = items.filter(i => selectedIds.has(i.id));
      
      for (const item of selectedItems) {
          await clipboardRepository.addItem({
              ...item,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
              category: targetCategory,
              tags: [...item.tags, '#copy'],
              timestamp: new Date().toLocaleString()
          });
      }
      showToast(`Copied ${selectedItems.length} items to ${targetCategory}`);
      exitSelectionMode();
      fetchData();
  };

  const handleBulkPin = async () => {
      const selectedItems = items.filter(i => selectedIds.has(i.id));
      if (selectedItems.length === 0) return;

      const shouldPin = selectedItems.some(i => !i.isPinned);
      
      // Reverse iteration order when pinning to ensure they stack in the expected order at the top
      const itemsToProcess = [...selectedItems].reverse();

      for (const item of itemsToProcess) {
          if (item.isPinned !== shouldPin) {
              await clipboardRepository.pinItem(item.id, shouldPin);
          }
      }

      showToast(shouldPin ? "Pinned selected items" : "Unpinned selected items");
      exitSelectionMode();
      fetchData();
  };

  const handleExport = async () => {
      const selectedItems = items.filter(i => selectedIds.has(i.id));
      if (selectedItems.length === 0) return;

      if (selectedItems.length === 1) {
          // Single export as normal txt
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
          showToast("Export successful: .txt file downloaded");
      } else {
          // Multiple export as ZIP containing individual txt files
          const zip = new JSZip();
          selectedItems.forEach((item, index) => {
              const safeTitle = item.title ? item.title.replace(/[^a-z0-9_\-\. ]/gi, '') : `Clip`;
              // Add index to ensure uniqueness
              const filename = `${safeTitle}_${index + 1}.txt`; 
              zip.file(filename, item.content);
          });

          const content = await zip.generateAsync({ type: 'blob' });
          const url = URL.createObjectURL(content);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Export_${Date.now()}.zip`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast("Export successful: .zip file downloaded");
      }

      setShowMoreMenu(false);
      exitSelectionMode();
  };

  // --- HASHTAG OVERLAY LOGIC ---
  const handleAddHashtagStart = async () => {
      setShowMoreMenu(false);
      // 1. Fetch all available unique tags from the system
      const allTags = await clipboardRepository.getUniqueTags();
      setAvailableTags(['All', ...allTags]); // Ensure availableTags is synced for consistency

      // 2. Determine initial selection (Union of tags from selected items)
      const selectedItems = items.filter(i => selectedIds.has(i.id));
      const unionTags = new Set<string>();
      selectedItems.forEach(item => {
          item.tags.forEach(tag => unionTags.add(tag));
      });
      setOverlaySelectedTags(unionTags);

      setShowHashtagOverlay(true);
  };

  const toggleOverlayTag = (tag: string) => {
      const newSet = new Set(overlaySelectedTags);
      if (newSet.has(tag)) {
          newSet.delete(tag);
      } else {
          newSet.add(tag);
      }
      setOverlaySelectedTags(newSet);
  };

  const handleAddNewTagInOverlay = () => {
      if (!newTagInput.trim()) return;
      let tag = newTagInput.trim();
      if (!tag.startsWith('#')) tag = '#' + tag;
      
      const newSet = new Set(overlaySelectedTags);
      newSet.add(tag);
      setOverlaySelectedTags(newSet);
      
      // Also add to system list view temporarily
      if (!availableTags.includes(tag)) {
          setAvailableTags(prev => [...prev, tag]);
          clipboardRepository.addNewTag(tag); // Persist immediately
      }
      setNewTagInput('');
  };

  const saveHashtagOverlay = async () => {
      // Apply the current state of overlaySelectedTags to ALL selected items (Replace/Sync logic)
      await clipboardRepository.replaceTagsForItems(Array.from(selectedIds), Array.from(overlaySelectedTags));
      
      showToast("Tags updated successfully");
      setShowHashtagOverlay(false);
      exitSelectionMode(); // Or stay in selection mode? Usually better to exit after action.
      fetchData();
  };

  const handleGlobalClick = () => {
      setActiveItemMenuId(null); 
      setIsSortMenuOpen(false); 
      setIsFilterOpen(false); 
      setShowMoreMenu(false);
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
        className={`relative flex flex-col h-full ${isDarkTheme ? 'bg-black text-white' : 'bg-white text-black'}`} 
        onClick={handleGlobalClick}
    >
      
      <SideBar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNavigate={onNavigate} />

      {/* --- HEADER --- */}
      <header className={`px-4 py-4 z-30 flex items-center h-16 transition-all duration-300 border-b flex-shrink-0 ${isDarkTheme ? 'bg-black/95 border-zinc-900' : 'bg-white/95 border-gray-200'}`}>
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
                onMore={(e: React.MouseEvent) => { e.stopPropagation(); setShowMoreMenu(!showMoreMenu); }}
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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`mr-2 ${textColor}`}>
                        <path fillRule="evenodd" clipRule="evenodd" d="M3 4C3 3.44772 3.44772 3 4 3H20C20.5523 3 21 3.44772 21 4V6.58579C21 6.851 20.8946 7.10536 20.7071 7.29289L14.2929 13.7071C14.1054 13.8946 14 14.149 14 14.4142V17L10 21V14.4142C10 14.149 9.89464 13.8946 9.70711 13.7071L3.29289 7.29289C3.10536 7.10536 3 6.851 3 6.58579V4Z" fill="currentColor"/>
                    </svg>
                    <span className={`text-xl tracking-wider ${textColor}`}>filter</span>
                </div>
                
                {/* Category Switching */}
                <div className="flex justify-center space-x-8 mb-6 border-b pb-4" style={{ borderColor: isDarkTheme ? '#333' : '#eee' }}>
                    <FilterItem 
                        label="Clipboard" 
                        active={activeTab === 'clipboard'} 
                        onClick={() => setActiveTab('clipboard')} 
                        accentColor={accentColor} 
                        textColor={textColor}
                        underline
                    />
                     <FilterItem 
                        label="Notes" 
                        active={activeTab === 'notes'} 
                        onClick={() => setActiveTab('notes')} 
                        accentColor={accentColor} 
                        textColor={textColor}
                        underline
                    />
                </div>

                {/* Type Filtering - NEW SECTION */}
                <div className="grid grid-cols-3 gap-y-4 gap-x-2 mb-6 border-b pb-4" style={{ borderColor: isDarkTheme ? '#333' : '#eee' }}>
                    <FilterItem 
                        label="All" 
                        active={filter.type === 'ALL'} 
                        onClick={() => setFilter(f => ({...f, type: 'ALL'}))} 
                        accentColor={accentColor} 
                        textColor={textColor}
                        underline={filter.type === 'ALL'}
                    />
                    <FilterItem 
                        label="Text" 
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                        active={filter.type === ClipboardType.TEXT} 
                        onClick={() => setFilter(f => ({...f, type: ClipboardType.TEXT}))} 
                        accentColor={accentColor} 
                        textColor={textColor}
                    />
                    <FilterItem 
                        label="Link" 
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}
                        active={filter.type === ClipboardType.LINK} 
                        onClick={() => setFilter(f => ({...f, type: ClipboardType.LINK}))} 
                        accentColor={accentColor} 
                        textColor={textColor}
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
                        label="Location" 
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
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

                 <div className="grid grid-cols-3 gap-y-4 gap-x-2">
                    {availableTags.map(tag => (
                        <FilterItem key={tag} label={tag} active={filter.tag === tag} onClick={() => setFilter(f => ({...f, tag: tag}))} underline={tag === 'All'} accentColor={accentColor} textColor={textColor} />
                    ))}
                </div>
             </div>
        </div>
      )}

      {/* --- MORE OPTIONS MENU (Selection Mode) --- */}
      {showMoreMenu && isSelectionMode && (
          <div onClick={(e) => e.stopPropagation()} className="absolute top-16 right-2 z-50 animate-fade-in-down">
              <div className="bg-black border-2 rounded-xl py-2 w-48 shadow-2xl shadow-black/50" style={{ borderColor: accentColor }}>
                  <MenuItem label="Copy" onClick={handleBulkCopy} />
                  <MenuItem label="Merge" onClick={handleMerge} />
                  <MenuItem label="Share" onClick={handleShare} />
                  <MenuItem label="Export" onClick={handleExport} />
                  <MenuItem label={`Copy to ${activeTab === 'clipboard' ? 'Notes' : 'Clipboard'}`} onClick={handleCopyToNotes} />
                  <MenuItem 
                    label={items.filter(i => selectedIds.has(i.id)).some(i => !i.isPinned) ? "Pin" : "Unpin"} 
                    onClick={handleBulkPin} 
                  />
                  <MenuItem label="Add Hashtag" onClick={handleAddHashtagStart} />
              </div>
          </div>
      )}

      {/* --- LIST CONTENT --- */}
      <main className="flex-1 px-4 pb-32 pt-4 overflow-y-auto no-scrollbar" onClick={handleGlobalClick}>
          {loading ? (
             <div className="text-center mt-20 font-mono" style={{ color: accentColor }}>Loading Bits...</div>
          ) : displayItems.length === 0 ? (
             <div className="text-gray-500 text-center mt-20 font-light">
                 {activeTab === 'clipboard' ? 'Clipboard is empty.' : 'No notes found.'}
             </div>
          ) : (
            displayItems.map(item => (
              <div key={item.id} className="">
                  <GoldCard 
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
              </div>
            ))
          )}
      </main>

      {/* --- FLOATING ACTION BUTTON --- */}
      {!isSelectionMode && (
        <div className="absolute bottom-24 right-6 z-20">
            <button onClick={onCreateNew} className={`w-16 h-16 rounded-full border-2 flex items-center justify-center hover:scale-105 transition-transform group ${isDarkTheme ? 'bg-black' : 'bg-white'}`} style={{ borderColor: accentColor, boxShadow: `0 0 15px ${accentColor}4D` }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}1A` }}>
                    <svg className="w-8 h-8" style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </div>
            </button>
        </div>
      )}

      {/* --- TOAST NOTIFICATION --- */}
      {toastMessage && (
          <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up">
              <div className="bg-zinc-900 border border-zinc-700 text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium tracking-wide">{toastMessage}</span>
              </div>
          </div>
      )}

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* --- MODALS --- */}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowDeleteConfirmation(false)}>
              <div onClick={e => e.stopPropagation()} className="bg-black border-2 rounded-xl p-6 w-full max-w-sm shadow-2xl relative" style={{ borderColor: accentColor }}>
                  <div className="text-center">
                      <h3 className="text-white text-xl font-normal mb-8 tracking-wide">Move selected items to Trash ?</h3>
                      <div className="flex justify-between items-center px-8">
                          <button 
                              onClick={() => setShowDeleteConfirmation(false)} 
                              className="text-gray-400 text-lg hover:text-white transition-colors"
                          >
                              No
                          </button>
                          <button 
                              onClick={confirmBulkDelete} 
                              className="text-white text-lg hover:text-red-500 transition-colors"
                          >
                              Yes
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- HASHTAG OVERLAY --- */}
      {showHashtagOverlay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
              <div 
                  onClick={e => e.stopPropagation()} 
                  className="bg-black border-2 rounded-3xl p-6 w-full max-w-sm shadow-[0_0_20px_rgba(212,175,55,0.15)] flex flex-col max-h-[70vh]" 
                  style={{ borderColor: accentColor }}
              >
                  {/* New Tag Input Area */}
                  <div className="flex items-center space-x-2 mb-4 border-b border-zinc-800 pb-2">
                       <input 
                           type="text"
                           placeholder="#Add new tag"
                           value={newTagInput}
                           onChange={(e) => setNewTagInput(e.target.value)}
                           className="bg-transparent text-white w-full focus:outline-none placeholder-zinc-600 font-mono"
                       />
                       <button onClick={handleAddNewTagInOverlay} style={{ color: accentColor }} className="font-bold text-xl">+</button>
                  </div>

                  {/* Tag List */}
                  <div className="flex flex-col gap-2 overflow-y-auto pr-1 flex-1 min-h-[150px]">
                      {availableTags.filter(t => t !== 'All').map(tag => {
                          const isSelected = overlaySelectedTags.has(tag);
                          return (
                              <button 
                                key={tag} 
                                onClick={() => toggleOverlayTag(tag)}
                                className={`w-fit px-4 py-1.5 rounded-full border text-sm font-medium transition-all duration-200 text-left`}
                                style={{ 
                                    borderColor: isSelected ? accentColor : '#333', 
                                    backgroundColor: isSelected ? `${accentColor}33` : 'transparent',
                                    color: isSelected ? accentColor : '#888'
                                }}
                              >
                                  {tag}
                              </button>
                          );
                      })}
                      {availableTags.length <= 1 && (
                          <div className="text-zinc-600 text-sm italic py-4 text-center">No tags found. Add one above.</div>
                      )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center mt-6 pt-2 border-t border-zinc-900">
                      <button 
                        onClick={() => setShowHashtagOverlay(false)} 
                        className="text-gray-400 hover:text-white text-sm font-medium uppercase tracking-wider"
                      >
                          CANCEL
                      </button>
                      <button 
                        onClick={saveHashtagOverlay} 
                        className="text-white text-sm font-medium uppercase tracking-wider hover:opacity-80 transition-opacity"
                      >
                          DONE
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

// --- SUB-COMPONENTS ---

const MenuItem: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
    <button onClick={onClick} className="w-full text-left px-4 py-3 text-white hover:bg-zinc-900 transition-colors text-sm font-light tracking-wide border-b border-zinc-800/50 last:border-0">
        {label}
    </button>
);

const SelectionHeader = ({ selectedCount, totalCount, textColor, accentColor, onExit, onSelectAll, onDelete, onFavorite, onMore }: any) => (
    <div className="flex items-center justify-between w-full animate-fade-in">
        <div className="flex items-center">
            <button onClick={onExit} className={`mr-4 text-white hover:opacity-80 transition-opacity`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
        </div>
        <div className="flex items-center space-x-4">
            <button onClick={onSelectAll} style={{ color: selectedCount === totalCount ? accentColor : 'white' }} className={`hover:opacity-80 transition-colors`}>
                    {selectedCount === totalCount && totalCount > 0 ? (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 7l4 4L15 5" opacity="0.5" />
                    </svg>
                    ) : (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    )}
            </button>
            <button onClick={onDelete} className={`text-white hover:text-red-500 transition-colors`}>
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
            <button onClick={onFavorite} className="text-white hover:text-red-600 transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </button>
            <button onClick={onMore} className="text-white hover:opacity-80 transition-colors relative">
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
        <div className="flex items-center space-x-6">
            <button onClick={onMenuOpen} style={{ color: accentColor }}>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h2 className="text-xl tracking-widest font-normal uppercase" style={{ color: accentColor }}>CLIPBOARD MAX</h2>
        </div>
        <div className="flex items-center space-x-4">
            <button onClick={onSearchOpen} style={{ color: accentColor }} className="opacity-80 hover:opacity-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
            <button onClick={onSortToggle} className={`transition-colors ${isSortMenuOpen ? textColor : 'opacity-80 hover:opacity-100'}`} style={{ color: isSortMenuOpen ? undefined : accentColor }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
            </button>
            <button onClick={onFilterToggle} className="hover:opacity-80 transition-opacity">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M3 4C3 3.44772 3.44772 3 4 3H20C20.5523 3 21 3.44772 21 4V6.58579C21 6.851 20.8946 7.10536 20.7071 7.29289L14.2929 13.7071C14.1054 13.8946 14 14.149 14 14.4142V17L10 21V14.4142C10 14.149 9.89464 13.8946 9.70711 13.7071L3.29289 7.29289C3.10536 7.10536 3 6.851 3 6.58579V4Z" fill="#EAC336"/>
                </svg>
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