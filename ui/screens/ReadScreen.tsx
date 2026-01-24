import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ClipboardItem, ClipboardType } from '../../types';
import { clipboardRepository } from '../../data/repository/ClipboardRepository';
import { useSettings } from '../context/SettingsContext';

interface ReadScreenProps {
  item: ClipboardItem;
  onBack: () => void;
  onEdit: (item: ClipboardItem) => void;
}

interface SmartItem {
  type: 'PHONE' | 'EMAIL' | 'LINK' | 'LOCATION' | 'DATE';
  value: string;
  label?: string;
}

const ReadScreen: React.FC<ReadScreenProps> = ({ item, onBack, onEdit }) => {
  const { isDarkTheme, accentColor, readingFontSize, isSmartRecognitionOn } = useSettings();
  
  const [isSmartMenuOpen, setIsSmartMenuOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Hashtag Logic
  const [isHashtagOverlayOpen, setIsHashtagOverlayOpen] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set(item.tags));

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [currentItem, setCurrentItem] = useState(item);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      setCurrentItem(item);
      setSelectedTags(new Set(item.tags));
  }, [item]);

  const showToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3000);
  };

  const smartItems = useMemo<SmartItem[]>(() => {
    if (!isSmartRecognitionOn) return [];
    
    // We use plain content for smart recognition even if it's rich text
    const text = currentItem.content;
    const items: SmartItem[] = [];

    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = text.match(phoneRegex);
    if (phones) phones.forEach(p => items.push({ type: 'PHONE', value: p, label: 'Call' }));

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailRegex);
    if (emails) emails.forEach(e => items.push({ type: 'EMAIL', value: e, label: 'Email' }));

    const linkRegex = /https?:\/\/[^\s]+/g;
    const links = text.match(linkRegex);
    if (links) links.forEach(l => items.push({ type: 'LINK', value: l, label: 'Open' }));

    if (currentItem.type === ClipboardType.LOCATION || text.includes('Street') || text.includes('Avenue')) {
         items.push({ type: 'LOCATION', value: currentItem.content.split('\n')[0], label: 'Map' });
    }
    
    if (currentItem.type === ClipboardType.PHONE && items.length === 0) items.push({ type: 'PHONE', value: currentItem.content, label: 'Call' });
    if (currentItem.type === ClipboardType.LINK && items.length === 0) items.push({ type: 'LINK', value: currentItem.content, label: 'Open' });

    return items;
  }, [currentItem, isSmartRecognitionOn]);

  const handleSmartAction = (smartItem: SmartItem) => {
      switch(smartItem.type) {
          case 'PHONE': window.open(`tel:${smartItem.value}`); break;
          case 'EMAIL': window.open(`mailto:${smartItem.value}`); break;
          case 'LINK': window.open(smartItem.value, '_blank'); break;
          case 'LOCATION': window.open(`https://maps.google.com/?q=${encodeURIComponent(smartItem.value)}`, '_blank'); break;
      }
      setIsSmartMenuOpen(false);
  };

  const handleMenuAction = async (action: string) => {
      switch(action) {
          case 'EDIT': onEdit(currentItem); break;
          case 'COPY':
              try {
                  await navigator.clipboard.writeText(currentItem.content);
                  showToast("Copied to clipboard");
              } catch (e) {
                  showToast("Failed to copy");
              }
              break;
          case 'SHARE': 
              if (navigator.share) navigator.share({ title: 'Clip', text: currentItem.content });
              else { 
                  navigator.clipboard.writeText(currentItem.content); 
                  showToast("Copied to clipboard");
              }
              break;
          case 'EXPORT': 
              const blob = new Blob([currentItem.content], {type: 'text/plain'});
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `clip_${currentItem.id}.txt`;
              a.click();
              break;
          case 'TOGGLE_CATEGORY_COPY':
               const targetCategory = currentItem.category === 'clipboard' ? 'notes' : 'clipboard';
               
               // If copying TO clipboard, try to sync with system
               if (targetCategory === 'clipboard') {
                   try {
                       await navigator.clipboard.writeText(currentItem.content);
                   } catch (e) {
                       console.warn("System clipboard write failed");
                   }
               }

               await clipboardRepository.addItem({
                   ...currentItem,
                   id: Date.now().toString(),
                   category: targetCategory,
                   tags: [...currentItem.tags, '#copy'],
                   timestamp: new Date().toLocaleString()
               });
               showToast(`Copied to ${targetCategory === 'clipboard' ? 'Clipboard' : 'Notes'}`);
               break;
          case 'HASHTAG': 
               // Fetch fresh tags before showing overlay
               const tags = await clipboardRepository.getUniqueTags();
               setAllTags(tags);
               // Sync selected state with current item
               setSelectedTags(new Set(currentItem.tags));
               setIsHashtagOverlayOpen(true); 
               break;
          case 'FAVORITE':
              const newPinnedState = !currentItem.isPinned;
              await clipboardRepository.pinItem(currentItem.id, newPinnedState);
              setCurrentItem({...currentItem, isPinned: newPinnedState});
              showToast(newPinnedState ? "Added to Favorites" : "Removed from Favorites");
              break;
      }
      setIsMenuOpen(false);
  };

  const handleSaveHashtags = async () => {
      // Logic to replace tags for this single item
      await clipboardRepository.replaceTagsForItems([currentItem.id], Array.from(selectedTags));
      const updatedItem = { ...currentItem, tags: Array.from(selectedTags) };
      setCurrentItem(updatedItem); 
      setIsHashtagOverlayOpen(false);
      showToast("Tags updated");
  };

  // Helper for search highlighting on plain text
  const highlightText = (text: string, query: string) => {
      if (!query) return text;
      const parts = text.split(new RegExp(`(${query})`, 'gi'));
      return parts.map((part, index) => 
        part.toLowerCase() === query.toLowerCase() ? (
            <span key={index} className="text-black px-0.5 rounded-sm font-semibold" style={{ backgroundColor: accentColor }}>{part}</span>
        ) : part
      );
  };

  const textColor = isDarkTheme ? 'text-zinc-100' : 'text-gray-900';
  const bgColor = isDarkTheme ? 'bg-black' : 'bg-white';
  const iconColor = isDarkTheme ? 'text-zinc-300 hover:text-white' : 'text-gray-600 hover:text-black';

  // Determine what to display
  const shouldRenderHtml = !isSearchActive && !!currentItem.htmlContent;

  return (
    <div className={`h-screen w-full flex flex-col relative font-sans animate-fade-in ${bgColor} ${isDarkTheme ? 'text-white' : 'text-black'}`}>
      
      {/* --- HEADER --- */}
      <header className={`px-4 py-4 flex items-center justify-between sticky top-0 z-30 h-16 border-b transition-colors ${isDarkTheme ? 'bg-black/95 border-zinc-900/50' : 'bg-white/95 border-gray-200'}`}>
        <div className="flex items-center flex-1">
            <button onClick={onBack} className={`mr-4 p-1 ${iconColor}`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </button>
            
            {isSearchActive ? (
                <div className="flex-1 relative animate-fade-in-right">
                    <input 
                        ref={searchInputRef}
                        type="text" 
                        autoFocus
                        placeholder="Find in text..." 
                        className={`bg-transparent border rounded-full py-1 px-4 text-lg w-full focus:outline-none focus:ring-1 ${isDarkTheme ? 'text-white placeholder-zinc-500' : 'text-black placeholder-gray-400'}`}
                        style={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}00` }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            ) : (
                <h1 className={`text-xl font-normal truncate pr-4 ${isDarkTheme ? 'text-zinc-300' : 'text-gray-800'}`}>
                    {currentItem.title && currentItem.title.trim() 
                        ? currentItem.title 
                        : (currentItem.content.substring(0, 20) + (currentItem.content.length > 20 ? '...' : ''))}
                </h1>
            )}
        </div>

        <div className="flex items-center space-x-2">
            {!isSearchActive && (
                <>
                {isSmartRecognitionOn && (
                    <div onClick={() => setIsSmartMenuOpen(!isSmartMenuOpen)} className={`p-2 cursor-pointer ${iconColor}`}>
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                               <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                         </svg>
                    </div>
                )}
                <button onClick={() => setIsSearchActive(true)} className={`p-2 ${iconColor}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} className={`p-2 ${iconColor}`}>
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                </button>
                </>
            )}
        </div>
      </header>

      {/* --- MENU DROPDOWN --- */}
      {isMenuOpen && (
          <div className="absolute top-16 right-4 z-50 w-56 animate-fade-in-down">
              <div className={`border-2 rounded-xl overflow-hidden shadow-2xl flex flex-col font-mono text-sm ${isDarkTheme ? 'bg-black border-zinc-700' : 'bg-white border-gray-300'}`} style={{ borderColor: accentColor }}>
                  <MenuBtn label="Copy" onClick={() => handleMenuAction('COPY')} isDark={isDarkTheme} />
                  <MenuBtn label="Edit" onClick={() => handleMenuAction('EDIT')} isDark={isDarkTheme} />
                  <MenuBtn label="Share" onClick={() => handleMenuAction('SHARE')} isDark={isDarkTheme} />
                  <MenuBtn label="Export" onClick={() => handleMenuAction('EXPORT')} isDark={isDarkTheme} />
                  <MenuBtn 
                    label={currentItem.category === 'clipboard' ? 'Copy to Notes' : 'Copy to Clipboard'} 
                    onClick={() => handleMenuAction('TOGGLE_CATEGORY_COPY')} 
                    isDark={isDarkTheme} 
                  />
                  <MenuBtn label="Add a Hashtag" onClick={() => handleMenuAction('HASHTAG')} isDark={isDarkTheme} />
                  <MenuBtn label={currentItem.isPinned ? "Remove Favorite" : "Add to Favorite"} onClick={() => handleMenuAction('FAVORITE')} isDark={isDarkTheme} />
              </div>
          </div>
      )}

      {/* --- CONTENT --- */}
      <main className="flex-1 overflow-y-auto p-6 scroll-smooth" onClick={() => { setIsSearchActive(false); setIsMenuOpen(false); setIsSmartMenuOpen(false); }}>
         {/* Metadata */}
         <div className="flex flex-wrap gap-2 mb-6">
            <span className={`text-xs uppercase tracking-widest ${isDarkTheme ? 'text-zinc-500' : 'text-gray-500'}`}>{currentItem.timestamp}</span>
            {currentItem.tags.map(tag => (
                <span key={tag} className="text-xs border px-2 rounded-full" style={{ borderColor: `${accentColor}4D`, color: accentColor }}>{tag}</span>
            ))}
         </div>

         {/* Text Display */}
         <div 
            className={`w-full max-w-full break-words leading-relaxed whitespace-pre-wrap font-sans tracking-wide ${textColor}`} 
            style={{ fontSize: `${readingFontSize}px`, wordSpacing: '2px' }}
         >
             {shouldRenderHtml ? (
                 // Render HTML content if available and not searching
                 <div dangerouslySetInnerHTML={{ __html: currentItem.htmlContent || '' }} />
             ) : (
                 // Render Plain text (with search highlighting if active)
                 highlightText(currentItem.displayContent || currentItem.content, searchQuery)
             )}
         </div>
         <div className="h-32"></div>
      </main>

      {/* --- TOAST NOTIFICATION --- */}
      {toastMessage && (
          <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up">
              <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700 text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span className="text-xs font-bold tracking-widest uppercase">{toastMessage}</span>
              </div>
          </div>
      )}

      {/* --- HASHTAG OVERLAY --- */}
      {isHashtagOverlayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
             <div className={`border rounded-2xl p-6 w-full max-w-sm ${isDarkTheme ? 'bg-black border-zinc-700' : 'bg-white border-gray-300'}`} style={{ borderColor: accentColor }}>
                <h3 className="text-lg mb-4 text-center font-bold tracking-widest uppercase" style={{ color: accentColor }}>Manage Tags</h3>
                
                <div className="flex flex-wrap gap-2 mb-6 max-h-60 overflow-y-auto">
                    {allTags.map(tag => (
                        <button 
                            key={tag}
                            onClick={() => {
                                const newSet = new Set(selectedTags);
                                if (newSet.has(tag)) newSet.delete(tag);
                                else newSet.add(tag);
                                setSelectedTags(newSet);
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors`}
                            style={{ 
                                borderColor: selectedTags.has(tag) ? accentColor : (isDarkTheme ? '#333' : '#ddd'),
                                backgroundColor: selectedTags.has(tag) ? `${accentColor}20` : 'transparent',
                                color: selectedTags.has(tag) ? accentColor : (isDarkTheme ? '#aaa' : '#666')
                            }}
                        >
                            {tag}
                        </button>
                    ))}
                    {allTags.length === 0 && <p className="w-full text-center text-xs opacity-50">No tags found</p>}
                </div>

                <div className="flex justify-between items-center px-2">
                    <button 
                        onClick={() => setIsHashtagOverlayOpen(false)} 
                        className={`text-sm ${isDarkTheme ? 'text-zinc-500 hover:text-white' : 'text-gray-500 hover:text-black'}`}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSaveHashtags} 
                        className="text-sm font-bold" 
                        style={{ color: accentColor }}
                    >
                        Save
                    </button>
                </div>
             </div>
        </div>
      )}

      {/* --- SMART SELECT OVERLAY --- */}
      {isSmartMenuOpen && (
          <div className="absolute bottom-6 right-6 left-6 z-40 flex justify-end animate-fade-in-up">
              <div className={`border rounded-xl shadow-2xl overflow-hidden max-h-[60vh] overflow-y-auto w-full max-w-xs ${isDarkTheme ? 'bg-[#1A1A1A] border-zinc-700' : 'bg-white border-gray-300'}`}>
                  <div className={`px-4 py-3 border-b sticky top-0 ${isDarkTheme ? 'bg-black/50 border-zinc-800' : 'bg-white/50 border-gray-200'}`}>
                      <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: accentColor }}>Smart Recognition</h3>
                  </div>
                  {smartItems.length === 0 ? (
                      <div className="p-4 text-center text-zinc-500 text-sm">No actionable items found.</div>
                  ) : (
                      <div className="flex flex-col">
                          {smartItems.map((sItem, idx) => (
                              <button 
                                key={idx} 
                                onClick={() => handleSmartAction(sItem)}
                                className={`flex items-center px-4 py-4 border-b last:border-0 transition-colors text-left group ${isDarkTheme ? 'hover:bg-zinc-800 border-zinc-800' : 'hover:bg-gray-50 border-gray-200'}`}
                              >
                                  <div className="mr-4 shrink-0" style={{ color: accentColor }}>{getSmartIcon(sItem.type)}</div>
                                  <div className="flex flex-col overflow-hidden">
                                      <span className={`text-sm font-medium truncate transition-colors ${isDarkTheme ? 'text-white group-hover:text-gold' : 'text-black'}`}>{sItem.value}</span>
                                      <span className="text-zinc-500 text-xs">{sItem.label}</span>
                                  </div>
                              </button>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

const MenuBtn: React.FC<{ label: string; onClick: () => void; isDark: boolean }> = ({ label, onClick, isDark }) => (
    <button onClick={onClick} className={`text-left w-full px-6 py-4 border-b last:border-0 transition-colors capitalize ${isDark ? 'text-white hover:bg-zinc-900 border-zinc-800' : 'text-black hover:bg-gray-100 border-gray-200'}`}>
        {label}
    </button>
);

const getSmartIcon = (type: SmartItem['type']) => {
    switch(type) {
        case 'PHONE': return <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z"/></svg>;
        case 'EMAIL': return <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
        case 'LINK': return <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>;
        default: return <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>;
    }
}

export default ReadScreen;