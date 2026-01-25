import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import GoldCard from '../components/GoldCard';
import BottomNav from '../components/BottomNav';
import SideBar from '../components/SideBar';
import { clipboardRepository } from '../../data/repository/ClipboardRepository';
import { ClipboardItem, ScreenName, ClipboardType, SortOption, SortDirection } from '../../types';
import { useSettings } from '../context/SettingsContext';
import JSZip from 'jszip';
import { Clipboard } from '@capacitor/clipboard';

interface HomeScreenProps {
    onNavigate: (screen: ScreenName) => void;
    onRead?: (item: ClipboardItem) => void;
    onCreateNew?: () => void;
    activeTab: 'clipboard' | 'notes';
    onTabChange: (tab: 'clipboard' | 'notes') => void;
}

type FilterType = 'ALL' | ClipboardType;

interface FilterState {
  type: FilterType;
  tag: string;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, onRead, onCreateNew, activeTab, onTabChange }) => {
  const { accentColor, isDarkTheme, clipboardSyncEnabled, setClipboardSyncEnabled } = useSettings();

  // --- STATE: Data & Navigation ---
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
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
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // --- STATE: Hashtag Overlay ---
  const [showHashtagOverlay, setShowHashtagOverlay] = useState(false);
  const [overlaySelectedTags, setOverlaySelectedTags] = useState<Set<string>>(new Set());
  const [newTagInput, setNewTagInput] = useState('');

  // --- STATE: Item Actions ---
  const [activeItemMenuId, setActiveItemMenuId] = useState<string | null>(null);

  // --- STATE: Animation ---
  const [animationClass, setAnimationClass] = useState('animate-fade-in');
  const prevTabRef = useRef(activeTab);

  // --- REFS: Touch Handling ---
  const touchStartRef = useRef<{x: number, y: number} | null>(null);
  const touchEndRef = useRef<{x: number, y: number} | null>(null);
  const minSwipeDistance = 50;

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

  // --- CLIPBOARD SYNC LOGIC ---

  // Check if we should prompt for permission (ONLY IF not enabled)
  useEffect(() => {
    if (!clipboardSyncEnabled) {
      // Small delay to prevent immediate popup on first render
      const t = setTimeout(() => setShowPermissionModal(true), 1500);
      return () => clearTimeout(t);
    }
  }, [clipboardSyncEnabled]);

  const checkSystemClipboard = async () => {
    try {
      // Pre-check: Browsers often require focus for readText
      if (!document.hasFocus()) return;

      const { value: text } = await Clipboard.read();
      if (!text || !text.trim()) return;

      // Check against the latest item in the repository (to avoid duplicates)
      const latestItems = await clipboardRepository.getAllItems('DATE', 'DESC');
      const latest = latestItems.find(i => i.category === 'clipboard' && !i.isDeleted);

      if (!latest || latest.content !== text) {
        const newItem: ClipboardItem = {
           id: Date.now().toString(),
           content: text,
           type: ClipboardType.TEXT, // Could add logic to detect LINK/PHONE
           category: 'clipboard',
           timestamp: new Date().toLocaleString(),
           tags: ['#synced'],
           isPinned: false,
           isFavorite: false,
           isDeleted: false
        };
        await clipboardRepository.addItem(newItem);
        await fetchData();
        showToast("Synced from Clipboard");
      }
    } catch (err) {
      console.warn("Manual sync failed: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleGrantPermission = async () => {
      try {
          // Triggering read() inside a click handler satisfies "User Gesture" requirements
          await Clipboard.read(); 
          setClipboardSyncEnabled(true);
          setShowPermissionModal(false);
          // Sync immediately when permission is granted
          checkSystemClipboard();
          showToast("Clipboard Access Granted");
      } catch (err: any) {
          console.error("Permission request failed", err);
          if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
              showToast("Permission denied. Check browser settings.");
          } else {
              showToast("Clipboard access blocked by browser.");
          }
      }
  };

  // --- TOAST HELPER ---
  const showToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3000);
  };

  // --- ANIMATION & TAB LOGIC ---
  useEffect(() => {
      if (prevTabRef.current !== activeTab) {
          if (activeTab === 'notes') {
              // Coming from Clipboard (Left) -> Slide In Right
              setAnimationClass('animate-slide-in-right');
          } else {
              // Coming from Notes (Right) -> Slide In Left
              setAnimationClass('animate-slide-in-left');
          }
          prevTabRef.current = activeTab;
      }
  }, [activeTab]);

  // --- TOUCH HANDLERS ---
  const onTouchStart = (e: React.TouchEvent) => {
      touchEndRef.current = null;
      touchStartRef.current = {
          x: e.targetTouches[0].clientX,
          y: e.targetTouches[0].clientY
      };
  };

  const onTouchMove = (e: React.TouchEvent) => {
      touchEndRef.current = {
          x: e.targetTouches[0].clientX,
          y: e.targetTouches[0].clientY
      };
  };

  const onTouchEnd = () => {
      if (!touchStartRef.current || !touchEndRef.current) return;
      
      const distanceX = touchStartRef.current.x - touchEndRef.current.x;
      const distanceY = touchStartRef.current.y - touchEndRef.current.y;
      const isLeftSwipe = distanceX > minSwipeDistance;
      const isRightSwipe = distanceX < -minSwipeDistance;
      
      // We only care about horizontal swipes if they are significantly horizontal
      if (Math.abs(distanceX) > Math.abs(distanceY)) {
          if (isLeftSwipe && activeTab === 'clipboard') {
              onTabChange('notes');
          }
          if (isRightSwipe && activeTab === 'notes') {
              onTabChange('clipboard');
          }
      }
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
        await Clipboard.write({ string: textToCopy });
        showToast("Copied to system clipboard");
      } catch (err) {
        console.warn("Clipboard API failed, trying fallback", err);
        // Fallback for when Clipboard API is blocked or not available
        try {
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            // Ensure it's not visible but part of DOM
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast("Copied to system clipboard");
        } catch (fallbackErr) {
            console.error("Copy failed", fallbackErr);
            showToast("Failed to copy");
        }
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
          await Clipboard.write({ string: textToShare });
          showToast("Copied to clipboard for sharing");
      }
      exitSelectionMode();
  };

  const handleCopyToNotes = async () => {
      // Toggle category: If in Clipboard -> Copy to Notes. If in Notes -> Copy to Clipboard.
      const targetCategory = activeTab === 'clipboard' ? 'notes' : 'clipboard';
      const selectedItems = items.filter(i => selectedIds.has(i.id));
      
      // If we are copying to the "Clipboard" tab, we also want to copy to the SYSTEM clipboard
      if (targetCategory === 'clipboard') {
          const textToCopy = selectedItems.map(i => i.content).join('\n\n');
          try {
            await Clipboard.write({ string: textToCopy });
          } catch (err) {
            console.warn("Failed to write to system clipboard during copy-to-clipboard action");
          }
      }
      
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

  // --- RENDER HELPERS ---
  const textColor = isDarkTheme ? 'text-white' : 'text-gray-900';
  const overlayBg = isDarkTheme ? 'bg-zinc-900/95 border-white/10' : 'bg-white/95 border-gray-200';
  const headerBg = isDarkTheme ? 'bg-black/80 border-white/5' : 'bg-white/80 border-black/5';

  return (
    <div 
        className={`relative flex flex-col h-full ${isDarkTheme ? 'bg-black text-white' : 'bg-[#F2F2F7] text-gray-900'}`} 
        onClick={handleGlobalClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
    >
      
      <SideBar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNavigate={onNavigate} />

      {/* --- HEADER --- */}
      <header className={`px-4 z-30 flex items-center h-16 transition-all duration-300 sticky top-0 backdrop-blur-xl border-b ${headerBg}`}>
        <div className="max-w-5xl mx-auto w-full flex items-center h-full animate-fade-in-down">
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
        </div>
      </header>
      
      {/* --- SORT MENU (Premium Glass Dropdown) --- */}
      {isSortMenuOpen && (
          <div onClick={(e) => e.stopPropagation()} className="absolute top-16 right-4 z-40 w-56 animate-scale-in origin-top-right">
              <div className={`rounded-3xl p-4 shadow-2xl border backdrop-blur-2xl ${overlayBg}`}>
                  <div className="flex justify-between items-center mb-4 px-2">
                      <span className={`text-xs font-bold uppercase tracking-widest ${isDarkTheme ? 'text-zinc-500' : 'text-gray-400'}`}>Sort By</span>
                      <button 
                        onClick={() => setSortDirection(prev => prev === 'ASC' ? 'DESC' : 'ASC')} 
                        className={`text-xs font-bold px-2 py-1 rounded-lg transition-colors ${isDarkTheme ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                        style={{ color: accentColor }}
                      >
                          {sortDirection}
                      </button>
                  </div>
                  <div className="flex flex-col space-y-2">
                      {(['CUSTOM', 'DATE', 'LENGTH', 'ALPHABETICAL'] as SortOption[]).map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setSortOption(opt)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${sortOption === opt ? 'bg-gold/10' : 'hover:bg-gray-100/50'}`}
                            style={{ color: sortOption === opt ? accentColor : textColor }}
                          >
                             {opt.charAt(0) + opt.slice(1).toLowerCase()}
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* --- FILTER MENU (Premium Glass Dropdown) --- */}
      {isFilterOpen && (
        <div onClick={(e) => e.stopPropagation()} className="absolute top-16 right-2 left-2 z-40 animate-fade-in-down origin-top max-w-lg mx-auto">
             <div className={`rounded-3xl p-6 shadow-2xl border backdrop-blur-2xl ${overlayBg}`}>
                
                {/* Section: View */}
                <div className="mb-6">
                    <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDarkTheme ? 'text-zinc-500' : 'text-gray-400'}`}>View</h3>
                    <div className="flex space-x-2 bg-black/5 rounded-full p-1 w-fit">
                        <FilterChip 
                            label="Clipboard" 
                            active={activeTab === 'clipboard'} 
                            onClick={() => onTabChange('clipboard')} 
                            accentColor={accentColor} 
                            textColor={textColor}
                        />
                        <FilterChip 
                            label="Notes" 
                            active={activeTab === 'notes'} 
                            onClick={() => onTabChange('notes')} 
                            accentColor={accentColor} 
                            textColor={textColor}
                        />
                    </div>
                </div>

                {/* Section: Content Type */}
                <div className="mb-6">
                    <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDarkTheme ? 'text-zinc-500' : 'text-gray-400'}`}>Content Type</h3>
                    <div className="flex flex-wrap gap-2">
                        <FilterChip label="All" active={filter.type === 'ALL'} onClick={() => setFilter(f => ({...f, type: 'ALL'}))} accentColor={accentColor} textColor={textColor} />
                        <FilterChip label="Text" active={filter.type === ClipboardType.TEXT} onClick={() => setFilter(f => ({...f, type: ClipboardType.TEXT}))} accentColor={accentColor} textColor={textColor} />
                        <FilterChip label="Link" active={filter.type === ClipboardType.LINK} onClick={() => setFilter(f => ({...f, type: ClipboardType.LINK}))} accentColor={accentColor} textColor={textColor} />
                        <FilterChip label="Phone" active={filter.type === ClipboardType.PHONE} onClick={() => setFilter(f => ({...f, type: ClipboardType.PHONE}))} accentColor={accentColor} textColor={textColor} />
                        <FilterChip label="Location" active={filter.type === ClipboardType.LOCATION} onClick={() => setFilter(f => ({...f, type: ClipboardType.LOCATION}))} accentColor={accentColor} textColor={textColor} />
                        <FilterChip label="Secure" active={filter.type === ClipboardType.SECURE} onClick={() => setFilter(f => ({...f, type: ClipboardType.SECURE}))} accentColor={accentColor} textColor={textColor} />
                    </div>
                </div>

                {/* Section: Tags */}
                <div>
                     <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDarkTheme ? 'text-zinc-500' : 'text-gray-400'}`}>Tags</h3>
                     <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto no-scrollbar">
                        {availableTags.map(tag => (
                            <FilterChip 
                                key={tag} 
                                label={tag} 
                                active={filter.tag === tag} 
                                onClick={() => setFilter(f => ({...f, tag: tag}))} 
                                accentColor={accentColor} 
                                textColor={textColor} 
                            />
                        ))}
                    </div>
                </div>
             </div>
        </div>
      )}

      {/* --- MORE OPTIONS MENU (Selection Mode) --- */}
      {showMoreMenu && isSelectionMode && (
          <div onClick={(e) => e.stopPropagation()} className="absolute top-16 right-4 z-50 animate-scale-in origin-top-right">
              <div className={`border rounded-2xl py-2 w-52 shadow-2xl backdrop-blur-xl ${overlayBg}`}>
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
      <main className="flex-1 px-4 pb-24 pt-4 overflow-y-auto no-scrollbar scroll-smooth w-full" onClick={handleGlobalClick}>
          {/* Key forces re-render to trigger animation when tab changes */}
          <div key={activeTab} className={`max-w-5xl mx-auto w-full ${animationClass}`}>
              {loading ? (
                 <div className="text-center mt-32 font-mono text-sm tracking-widest opacity-60 animate-pulse" style={{ color: accentColor }}>LOADING...</div>
              ) : displayItems.length === 0 ? (
                 <div className="flex flex-col items-center justify-center mt-32 opacity-40">
                     <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                     <span className="font-light tracking-wide">{activeTab === 'clipboard' ? 'Clipboard is empty' : 'No notes found'}</span>
                 </div>
              ) : (
                displayItems.map((item, index) => (
                  <div key={item.id} className="">
                      <GoldCard 
                        item={item} 
                        index={index}
                        searchQuery={searchQuery}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedIds.has(item.id)}
                        isDraggable={sortOption === 'CUSTOM'}
                        onMenuClick={(e, i) => { setActiveItemMenuId(i.id); }}
                        onLongPress={handleLongPress}
                        onClick={handleCardClick}
                        onDragStart={handleDragStart}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                      />
                  </div>
                ))
              )}
          </div>
      </main>

      {/* --- FLOATING ACTION BUTTON --- */}
      {!isSelectionMode && (
        <div className="absolute bottom-24 right-6 z-20 animate-scale-in">
            <button 
                onClick={onCreateNew} 
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 group ${isDarkTheme ? 'bg-black text-white' : 'bg-white text-black'}`} 
                style={{ 
                    boxShadow: `0 0 20px ${accentColor}66`,
                    border: `1px solid ${accentColor}` 
                }}
            >
                <div className="relative">
                    <svg className="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </div>
            </button>
        </div>
      )}

      {/* --- TOAST NOTIFICATION --- */}
      {toastMessage && (
          <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up">
              <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700 text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span className="text-xs font-bold tracking-widest uppercase">{toastMessage}</span>
              </div>
          </div>
      )}

      {/* --- PERMISSION MODAL --- */}
      {showPermissionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
              <div className={`border rounded-2xl p-6 w-full max-w-sm shadow-2xl ${isDarkTheme ? 'bg-black border-zinc-700' : 'bg-white border-gray-300'}`} style={{ borderColor: accentColor }}>
                   {/* ... Content same as before ... */}
                   <div className="flex flex-col items-center text-center mb-6">
                       <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${accentColor}20` }}>
                           <svg className="w-8 h-8" style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                               <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                           </svg>
                       </div>
                       <h3 className={`text-xl font-bold mb-2 uppercase tracking-widest ${textColor}`}>Clipboard Sync</h3>
                       <p className={`text-sm leading-relaxed opacity-80 ${textColor}`}>
                           To automatically manage and sync your history, Clipboard Max requires permission to access your system clipboard.
                       </p>
                   </div>
                   <div className="flex space-x-4">
                       <button 
                           onClick={() => setShowPermissionModal(false)}
                           className={`flex-1 py-3 rounded-xl font-medium text-sm transition-colors ${isDarkTheme ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-black'}`}
                       >
                           Not Now
                       </button>
                       <button 
                           onClick={handleGrantPermission}
                           className="flex-1 py-3 rounded-xl font-bold text-sm text-black transition-opacity hover:opacity-90"
                           style={{ backgroundColor: accentColor }}
                       >
                           Allow Access
                       </button>
                   </div>
              </div>
          </div>
      )}

      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />

      {/* --- MODALS --- */}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowDeleteConfirmation(false)}>
              <div onClick={e => e.stopPropagation()} className="bg-black border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl relative" style={{ borderColor: accentColor }}>
                  <div className="text-center">
                      <h3 className="text-white text-lg font-light mb-8 tracking-wide">Move selected items to Trash?</h3>
                      <div className="flex justify-center space-x-8">
                          <button 
                              onClick={() => setShowDeleteConfirmation(false)} 
                              className="text-zinc-500 text-sm hover:text-white transition-colors uppercase tracking-widest"
                          >
                              Cancel
                          </button>
                          <button 
                              onClick={confirmBulkDelete} 
                              className="text-white text-sm hover:text-red-500 transition-colors uppercase tracking-widest font-bold"
                          >
                              Confirm
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
                  className={`border rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col max-h-[70vh] ${overlayBg}`}
                  style={{ borderColor: accentColor }}
              >
                  <h3 className="text-center text-xs font-bold uppercase tracking-widest mb-6" style={{ color: accentColor }}>Manage Tags</h3>
                  
                  {/* New Tag Input Area */}
                  <div className="flex items-center space-x-2 mb-4 bg-black/5 rounded-xl px-3 py-2">
                       <span className="text-zinc-500 font-light text-lg">#</span>
                       <input 
                           type="text" 
                           placeholder="New tag..." 
                           value={newTagInput}
                           onChange={(e) => setNewTagInput(e.target.value)}
                           className={`bg-transparent w-full focus:outline-none font-medium ${textColor} placeholder-zinc-500`}
                       />
                       <button onClick={handleAddNewTagInOverlay} style={{ color: accentColor }} className="font-bold text-xl px-2">+</button>
                  </div>

                  {/* Tag List */}
                  <div className="flex flex-wrap gap-2 overflow-y-auto pr-1 flex-1 min-h-[100px] content-start">
                      {availableTags.filter(t => t !== 'All').map(tag => {
                          const isSelected = overlaySelectedTags.has(tag);
                          return (
                              <button 
                                key={tag} 
                                onClick={() => toggleOverlayTag(tag)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border`}
                                style={{ 
                                    borderColor: isSelected ? accentColor : 'transparent', 
                                    backgroundColor: isSelected ? `${accentColor}1A` : (isDarkTheme ? '#27272a' : '#f4f4f5'),
                                    color: isSelected ? accentColor : (isDarkTheme ? '#a1a1aa' : '#71717a')
                                }}
                              >
                                  {tag}
                              </button>
                          );
                      })}
                      {availableTags.length <= 1 && (
                          <div className="text-zinc-500 text-xs italic w-full text-center mt-4">No tags available</div>
                      )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center mt-8 pt-4 border-t border-dashed border-zinc-700/30">
                      <button 
                        onClick={() => setShowHashtagOverlay(false)} 
                        className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={saveHashtagOverlay} 
                        className="text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
                        style={{ color: accentColor }}
                      >
                          Save
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

// ... Sub-components remain the same ...
// --- SUB-COMPONENTS ---

const MenuItem: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
    <button onClick={onClick} className="w-full text-left px-6 py-3 hover:bg-white/5 transition-colors text-sm font-medium tracking-wide">
        {label}
    </button>
);

const FilterChip: React.FC<{ label: string; icon?: React.ReactNode; active: boolean; onClick: () => void; accentColor: string; textColor: string }> = ({ label, icon, active, onClick, accentColor, textColor }) => (
    <button 
        onClick={onClick} 
        className={`flex items-center justify-center px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 border ${active ? '' : 'border-transparent'}`}
        style={{ 
            backgroundColor: active ? `${accentColor}1A` : 'transparent',
            color: active ? accentColor : (active ? accentColor : 'gray'), // fallback for inactive text
            borderColor: active ? accentColor : 'transparent'
        }}
    >
        {/* Helper class for inactive state text color since logic above is complex inline */}
        <span className={!active ? 'text-zinc-500 hover:text-zinc-300' : ''}>{label}</span>
    </button>
);

const SelectionHeader = ({ selectedCount, totalCount, textColor, accentColor, onExit, onSelectAll, onDelete, onFavorite, onMore }: any) => (
    <div className="flex items-center justify-between w-full animate-fade-in">
        <div className="flex items-center">
            <button onClick={onExit} className={`mr-4 p-2 rounded-full hover:bg-white/5 transition-all`}>
                <svg className={`w-6 h-6 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <span className={`text-lg font-medium tracking-wide ${textColor}`}>{selectedCount} Selected</span>
        </div>
        <div className="flex items-center space-x-2">
            <button onClick={onSelectAll} style={{ color: selectedCount === totalCount ? accentColor : 'inherit' }} className={`p-2 rounded-full hover:bg-white/5 ${textColor}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </button>
            <button onClick={onFavorite} className={`p-2 rounded-full hover:bg-white/5 ${textColor}`}>
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </button>
            <button onClick={onDelete} className={`p-2 rounded-full hover:bg-white/5 ${textColor} hover:text-red-500`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
            <button onClick={onMore} className={`p-2 rounded-full hover:bg-white/5 ${textColor}`}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
            </button>
        </div>
    </div>
);

const SearchHeader = ({ query, onQueryChange, onClose, textColor, accentColor }: any) => (
    <div className="flex items-center w-full space-x-3 animate-fade-in">
        <button onClick={onClose} className={`p-2 rounded-full hover:bg-white/5 ${textColor}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1 relative">
            <input 
                type="text" 
                placeholder="Search..." 
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                autoFocus
                className={`w-full bg-transparent border-b py-2 px-2 focus:outline-none text-lg font-light ${textColor}`}
                style={{ borderColor: accentColor }}
            />
        </div>
    </div>
);

const DefaultHeader = ({ accentColor, textColor, isSortMenuOpen, isFilterOpen, onMenuOpen, onSearchOpen, onSortToggle, onFilterToggle }: any) => (
    <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-4">
            <button onClick={onMenuOpen} className="p-1 hover:opacity-70 transition-opacity" style={{ color: accentColor }}>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10" /></svg>
            </button>
            <h2 className="text-sm font-bold tracking-widest uppercase" style={{ color: accentColor }}>CLIPBOARD MAX</h2>
        </div>
        <div className="flex items-center space-x-2">
            <button onClick={onSearchOpen} className={`p-2 rounded-full hover:bg-white/5 transition-colors ${textColor}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
            <button onClick={onSortToggle} className={`p-2 rounded-full hover:bg-white/5 transition-colors ${isSortMenuOpen ? 'text-gold' : textColor}`} style={{ color: isSortMenuOpen ? accentColor : undefined }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
            </button>
            <button onClick={onFilterToggle} className={`p-2 rounded-full hover:bg-white/5 transition-colors ${isFilterOpen ? 'text-gold' : textColor}`} style={{ color: isFilterOpen ? accentColor : undefined }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
            </button>
        </div>
    </div>
);

export default HomeScreen;