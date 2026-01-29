import React, { useEffect, useState } from 'react';
import { clipboardRepository } from '../../data/repository/ClipboardRepository';
import { useSettings } from '../context/SettingsContext';

interface TagsScreenProps {
  onBack: () => void;
  onSelectTag: (tag: string) => void;
}

const TagsScreen: React.FC<TagsScreenProps> = ({ onBack, onSelectTag }) => {
  const { accentColor, isDarkTheme } = useSettings();
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection Mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  
  // Overlays
  const [showAddOverlay, setShowAddOverlay] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showMergeInput, setShowMergeInput] = useState(false);
  const [mergeNameInput, setMergeNameInput] = useState('');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setLoading(true);
    const data = await clipboardRepository.getUniqueTags();
    setTags(data);
    setLoading(false);
  };

  // --- Handlers ---
  const handleTagClick = (tag: string) => {
    if (isSelectionMode) {
      const newSelected = new Set(selectedTags);
      if (newSelected.has(tag)) newSelected.delete(tag);
      else newSelected.add(tag);
      setSelectedTags(newSelected);
      if (newSelected.size === 0) setIsSelectionMode(false);
    } else {
      onSelectTag(tag);
    }
  };

  const handleLongPress = (tag: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedTags(new Set([tag]));
    }
  };

  const handleSelectAll = () => {
      if (selectedTags.size === tags.length) {
          setSelectedTags(new Set());
          setIsSelectionMode(false);
      } else {
          setSelectedTags(new Set(tags));
      }
  };

  const handleRemove = () => {
      if (selectedTags.size === 0) return;
      setShowRemoveConfirm(true);
  };

  const confirmRemove = async () => {
      await clipboardRepository.removeTags(Array.from(selectedTags));
      setShowRemoveConfirm(false);
      setIsSelectionMode(false);
      setSelectedTags(new Set());
      fetchTags();
  };

  const handleMerge = () => {
      if (selectedTags.size < 2) {
          alert("Select at least 2 tags to merge.");
          return;
      }
      setMergeNameInput('');
      setShowMergeInput(true);
  };

  const confirmMerge = async () => {
      if (!mergeNameInput.trim()) return;
      let finalName = mergeNameInput.trim();
      if (!finalName.startsWith('#')) finalName = '#' + finalName;

      await clipboardRepository.mergeTags(Array.from(selectedTags), finalName);
      setShowMergeInput(false);
      setIsSelectionMode(false);
      setSelectedTags(new Set());
      fetchTags();
  };

  const handleAddTag = async () => {
      if (!newTagInput.trim()) return;
      let newTag = newTagInput.trim();
      if (!newTag.startsWith('#')) newTag = '#' + newTag;
      
      await clipboardRepository.addNewTag(newTag);
      setShowAddOverlay(false);
      setNewTagInput('');
      fetchTags();
  };

  const textColor = isDarkTheme ? 'text-white' : 'text-black';
  const bgColor = isDarkTheme ? 'bg-black' : 'bg-zinc-200';
  const headerBg = isDarkTheme ? 'bg-black/80 border-white/5' : 'bg-white/80 border-black/5';

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
                    <h2 className="text-xl font-normal">Tags</h2>
                    <div className="flex items-center space-x-4 text-sm font-medium">
                        <button onClick={handleSelectAll} className="hover:opacity-80 uppercase tracking-wider text-xs" style={{ color: accentColor }}>
                             Select All
                        </button>
                        <button onClick={handleRemove} className="text-zinc-500 hover:text-red-500 uppercase tracking-wider text-xs">
                             Remove
                        </button>
                        <button onClick={handleMerge} className="text-zinc-500 hover:text-yellow-500 uppercase tracking-wider text-xs">
                             Merge
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center">
                    <svg className="w-6 h-6 mr-3" style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    <h2 className="text-2xl tracking-wider font-normal" style={{ color: accentColor }}>Tags</h2>
                </div>
            )}
          </div>
      </header>

      {/* --- LIST --- */}
      <main className="flex-1 p-6 overflow-y-auto">
          {loading ? (
              <div className="text-zinc-500 text-center mt-10 font-mono tracking-widest text-sm animate-pulse">LOADING TAGS...</div>
          ) : (
              <ul className="space-y-6">
                  {tags.map((tag, index) => {
                      const isSelected = selectedTags.has(tag);
                      return (
                          <li 
                            key={tag}
                            onClick={() => handleTagClick(tag)}
                            onContextMenu={(e) => { e.preventDefault(); handleLongPress(tag); }}
                            className="flex items-center cursor-pointer group"
                          >
                              {isSelectionMode && (
                                  <div className={`w-5 h-5 rounded border mr-4 flex items-center justify-center ${isSelected ? 'border-transparent' : 'border-zinc-600'}`} style={{ backgroundColor: isSelected ? accentColor : 'transparent' }}>
                                      {isSelected && <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                  </div>
                              )}
                              <span className={`text-xl font-light tracking-wide transition-colors`} style={{ color: isSelectionMode && isSelected ? accentColor : (isDarkTheme ? 'white' : 'black') }}>
                                  <span className="text-zinc-500 mr-4 font-mono text-base">{index + 1}.</span> 
                                  {tag}
                              </span>
                          </li>
                      );
                  })}
              </ul>
          )}

          {!isSelectionMode && (
              <button 
                onClick={() => { setNewTagInput(''); setShowAddOverlay(true); }}
                className={`mt-8 border px-4 py-2 rounded-xl flex items-center transition-colors ${isDarkTheme ? 'border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600' : 'border-zinc-400 text-zinc-600 hover:text-black'}`}
                style={{ borderColor: undefined }}
              >
                  <span className="mr-2 text-lg" style={{ color: accentColor }}>+</span> Add New Tag
              </button>
          )}
      </main>

      {/* --- ADD OVERLAY --- */}
      {showAddOverlay && (
          <div className={`fixed inset-0 z-50 flex flex-col animate-fade-in ${isDarkTheme ? 'bg-black' : 'bg-white'}`}>
              <div className="p-4 flex items-center">
                  <button onClick={() => setShowAddOverlay(false)} className={textColor}>
                     <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  </button>
                  <span className="ml-4 text-xl tracking-wider" style={{ color: accentColor }}>Tags</span>
              </div>
              <div className="flex-1 flex flex-col justify-center px-8">
                  <div className={`flex items-center text-3xl font-light border-b pb-2 ${isDarkTheme ? 'border-zinc-800' : 'border-zinc-400'}`}>
                      <span className="mr-2" style={{ color: accentColor }}>#</span>
                      <input 
                        type="text" 
                        autoFocus
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        placeholder="_____"
                        className={`bg-transparent focus:outline-none w-full ${textColor} ${isDarkTheme ? 'placeholder-zinc-700' : 'placeholder-gray-300'}`}
                      />
                  </div>
              </div>
              <div className="p-8 flex justify-between items-center text-xl font-light tracking-wide">
                  <button onClick={() => setShowAddOverlay(false)} className="text-zinc-400 hover:opacity-80">Cancel</button>
                  <button onClick={handleAddTag} className="hover:opacity-80" style={{ color: accentColor }}>Done</button>
              </div>
          </div>
      )}

      {/* --- REMOVE CONFIRM --- */}
      {showRemoveConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className={`border rounded-2xl p-6 w-full max-w-sm ${isDarkTheme ? 'bg-black border-zinc-700' : 'bg-white border-zinc-400'}`} style={{ borderColor: accentColor }}>
                  <h3 className={`text-lg text-center font-normal mb-6 ${textColor}`}>
                      Remove selected tags from all items?
                  </h3>
                  <div className="flex justify-between items-center px-4 text-lg">
                      <button onClick={() => setShowRemoveConfirm(false)} className="text-zinc-400 hover:opacity-80">No</button>
                      <button onClick={confirmRemove} className="text-red-500 hover:text-red-400">Yes</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MERGE INPUT --- */}
      {showMergeInput && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className={`border rounded-2xl p-6 w-full max-w-sm ${isDarkTheme ? 'bg-black border-zinc-700' : 'bg-white border-zinc-400'}`} style={{ borderColor: accentColor }}>
                  <h3 className="text-lg mb-4 text-center" style={{ color: accentColor }}>Merge Tags</h3>
                  <input 
                    type="text" 
                    autoFocus
                    value={mergeNameInput}
                    onChange={(e) => setMergeNameInput(e.target.value)}
                    placeholder="New tag name (e.g. #Project)"
                    className={`w-full border rounded-lg p-3 focus:outline-none mb-6 ${isDarkTheme ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-zinc-200 border-zinc-400 text-black'}`}
                    style={{ borderColor: undefined }}
                  />
                  <div className="flex justify-between items-center px-2 text-lg">
                      <button onClick={() => setShowMergeInput(false)} className="text-zinc-400 hover:opacity-80">Cancel</button>
                      <button onClick={confirmMerge} className="hover:opacity-80" style={{ color: accentColor }}>Merge</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default TagsScreen;