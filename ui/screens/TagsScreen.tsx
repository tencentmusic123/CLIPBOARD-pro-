import React, { useEffect, useState } from 'react';
import { clipboardRepository } from '../../data/repository/ClipboardRepository';

interface TagsScreenProps {
  onBack: () => void;
  onSelectTag: (tag: string) => void;
}

const TagsScreen: React.FC<TagsScreenProps> = ({ onBack, onSelectTag }) => {
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
      // We don't have a direct "create tag" method because tags live on items.
      // But the prompt implies we can add one. 
      // Usually this means adding it to a dummy item or just locally.
      // However, if we follow the pattern "all notes with that hashtag", an empty tag isn't useful until attached.
      // But to satisfy the UI req "#1a6d", we assume we add it to the list. 
      // Since our repo derives tags from items, we can't persist an orphan tag easily without changing the data model.
      // For this prototype, we'll just mock adding it to the UI list or attaching it to a "Welcome" note if needed.
      // Let's just create a dummy item with this tag so it persists.
      /*
      await clipboardRepository.addItem({
          id: Date.now().toString(),
          content: 'New tagged item placeholder',
          type: 'TEXT',
          timestamp: new Date().toLocaleString(),
          tags: [newTagInput.trim().startsWith('#') ? newTagInput.trim() : '#' + newTagInput.trim()],
          isPinned: false,
          isDeleted: false
      });
      */
      // Wait, "Add" overlay usually creates a tag to be used later? 
      // Or maybe it just adds it to the list of "Available Tags" shown in overlays.
      // For now, let's just refresh (and maybe alert if it disappears because no item has it).
      // Actually, let's just assume we strictly display tags that exist on items.
      // So "Add" might be intended to create a new filter context?
      // Let's implement it such that it alerts "Tag created" but unless assigned it might vanish.
      // BETTER UX: Just add it to the local state for now so it shows up until refresh.
      let newTag = newTagInput.trim();
      if (!newTag.startsWith('#')) newTag = '#' + newTag;
      
      setTags(prev => [...prev, newTag].sort());
      setShowAddOverlay(false);
      setNewTagInput('');
  };

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col max-w-md mx-auto border-x border-zinc-900 shadow-2xl h-full animate-fade-in font-sans">
      
      {/* --- HEADER --- */}
      <header className="px-4 py-4 flex items-center justify-between bg-black/95 backdrop-blur-md sticky top-0 z-20 border-b border-zinc-800 h-16">
          <div className="flex items-center w-full">
            <button onClick={() => isSelectionMode ? setIsSelectionMode(false) : onBack()} className="text-white hover:text-gold transition-colors mr-4">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                 </svg>
            </button>
            
            {isSelectionMode ? (
                <div className="flex items-center justify-between w-full">
                    <h2 className="text-white text-xl font-normal">Tags</h2>
                    <div className="flex items-center space-x-4 text-sm font-medium">
                        <button onClick={handleSelectAll} className="text-zinc-300 hover:text-white uppercase tracking-wider text-xs">
                             Select All
                        </button>
                        <button onClick={handleRemove} className="text-zinc-300 hover:text-red-500 uppercase tracking-wider text-xs">
                             Remove
                        </button>
                        <button onClick={handleMerge} className="text-zinc-300 hover:text-gold uppercase tracking-wider text-xs">
                             Merge
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center">
                    <svg className="w-6 h-6 text-gold mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    <h2 className="text-gold text-2xl tracking-wider font-normal">Tags</h2>
                </div>
            )}
          </div>
      </header>

      {/* --- LIST --- */}
      <main className="flex-1 p-6 overflow-y-auto">
          {loading ? (
              <div className="text-zinc-500 text-center mt-10">Loading tags...</div>
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
                                  <div className={`w-5 h-5 rounded border mr-4 flex items-center justify-center ${isSelected ? 'bg-gold border-gold' : 'border-zinc-600'}`}>
                                      {isSelected && <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                  </div>
                              )}
                              <span className={`text-xl font-light tracking-wide ${isSelectionMode && isSelected ? 'text-gold' : 'text-zinc-300 group-hover:text-white'}`}>
                                  <span className="text-zinc-600 mr-4 font-mono text-base">{index + 1}.</span> 
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
                className="mt-8 border border-zinc-700 text-zinc-400 px-4 py-2 rounded flex items-center hover:border-gold hover:text-gold transition-colors"
              >
                  <span className="mr-2 text-lg">+</span> Add
              </button>
          )}
      </main>

      {/* --- ADD OVERLAY --- */}
      {showAddOverlay && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in">
              <div className="p-4 flex items-center">
                  <button onClick={() => setShowAddOverlay(false)} className="text-white">
                     <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  </button>
                  <span className="ml-4 text-gold text-xl tracking-wider">Tags</span>
              </div>
              <div className="flex-1 flex flex-col justify-center px-8">
                  <div className="flex items-center text-3xl text-zinc-500 font-light border-b border-zinc-800 pb-2">
                      <span className="mr-2 text-gold">#</span>
                      <input 
                        type="text" 
                        autoFocus
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        placeholder="_____"
                        className="bg-transparent focus:outline-none text-white w-full placeholder-zinc-700"
                      />
                  </div>
              </div>
              <div className="p-8 flex justify-between items-center text-xl font-light tracking-wide">
                  <button onClick={() => setShowAddOverlay(false)} className="text-zinc-400 hover:text-white">Cancel</button>
                  <button onClick={handleAddTag} className="text-gold hover:text-white">Done</button>
              </div>
          </div>
      )}

      {/* --- REMOVE CONFIRM --- */}
      {showRemoveConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-black border border-gold rounded-2xl p-6 w-full max-w-sm">
                  <h3 className="text-white text-lg text-center font-normal mb-6">
                      Remove selected tags from all items?
                  </h3>
                  <div className="flex justify-between items-center px-4 text-lg">
                      <button onClick={() => setShowRemoveConfirm(false)} className="text-zinc-400 hover:text-white">No</button>
                      <button onClick={confirmRemove} className="text-red-500 hover:text-red-400">Yes</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MERGE INPUT --- */}
      {showMergeInput && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-black border border-gold rounded-2xl p-6 w-full max-w-sm">
                  <h3 className="text-gold text-lg mb-4 text-center">Merge Tags</h3>
                  <input 
                    type="text" 
                    autoFocus
                    value={mergeNameInput}
                    onChange={(e) => setMergeNameInput(e.target.value)}
                    placeholder="New tag name (e.g. #Project)"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white focus:border-gold focus:outline-none mb-6"
                  />
                  <div className="flex justify-between items-center px-2 text-lg">
                      <button onClick={() => setShowMergeInput(false)} className="text-zinc-400 hover:text-white">Cancel</button>
                      <button onClick={confirmMerge} className="text-gold hover:text-white">Merge</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default TagsScreen;