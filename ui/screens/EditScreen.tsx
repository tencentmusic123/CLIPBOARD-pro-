import React, { useState, useRef, useEffect } from 'react';
import { ClipboardItem } from '../../types';
import { clipboardRepository } from '../../data/repository/ClipboardRepository';
import { useSettings } from '../context/SettingsContext';

interface EditScreenProps {
  item: ClipboardItem;
  onBack: () => void;
  onSave: () => void;
}

const EditScreen: React.FC<EditScreenProps> = ({ item, onBack, onSave }) => {
  const { accentColor, isDarkTheme, isAiSupportOn } = useSettings();
  
  // --- Local State ---
  const [title, setTitle] = useState(item.title || '');
  const [fontSize, setFontSize] = useState(16);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  // --- Refs ---
  const editorRef = useRef<HTMLDivElement>(null);
  const caseModeRef = useRef<number>(0);

  // --- Effects ---
  useEffect(() => {
    if (editorRef.current) {
        editorRef.current.innerText = item.content;
    }
  }, [item.content]);

  // --- Helpers ---
  const updateContent = (newText: string) => {
      if (editorRef.current) editorRef.current.innerText = newText;
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
      document.execCommand(command, false, value);
      if (editorRef.current) editorRef.current.focus();
  };

  // --- Input Handlers ---
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value.length <= 30) setTitle(e.target.value);
  };

  const handleFontSize = (delta: number) => setFontSize(Math.max(12, Math.min(32, fontSize + delta)));

  // --- AI / Text Processing Handlers ---
  const handleAiAction = (action: string) => {
      if (!editorRef.current) return;
      const text = editorRef.current.innerText;
      let newText = text;

      switch(action) {
          case 'DUPLICATES':
              newText = [...new Set(text.split('\n'))].join('\n');
              break;
          case 'CLEANUP':
              newText = text.split('\n').map(l => l.trim().replace(/\s+/g, ' ')).filter(l => l.length > 0).join('\n');
              break;
          case 'LIST':
              if (text.includes('\n')) newText = text.split('\n').map(l => l.trim() ? `• ${l.trim()}` : l).join('\n');
              else if (text.includes('. ')) newText = text.split('. ').filter(s => s.trim()).map(s => `• ${s.trim()}`).join('\n');
              else newText = `• ${text}`;
              break;
          case 'GRAMMAR':
              // Mock grammar fix: Sentence case and single spacing
              newText = text.replace(/\s+/g, ' ').replace(/([.,!?])(?=[^\s])/g, '$1 ');
              newText = newText.charAt(0).toUpperCase() + newText.slice(1);
              break;
          case 'CASE':
              const mode = (caseModeRef.current + 1) % 4;
              caseModeRef.current = mode;
              switch (mode) {
                  case 0: newText = text.toUpperCase(); break;
                  case 1: newText = text.toLowerCase(); break;
                  case 2: newText = text.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); break;
                  case 3: newText = text.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, c => c.toUpperCase()); break;
              }
              break;
          case 'TRANSLATE':
              alert("Language packs not found.");
              return; // Don't close menu or update text
      }
      
      updateContent(newText);
      setIsAiMenuOpen(false);
  };

  // --- Save Handler ---
  const performSave = async (destination: 'CLIPBOARD' | 'NOTES') => {
      const content = editorRef.current?.innerText || '';
      await clipboardRepository.updateItem(item.id, { 
          title, content, timestamp: new Date().toLocaleString(),
          metadata: { ...item.metadata, source: destination }
      });
      if (destination === 'CLIPBOARD') navigator.clipboard.writeText(content);
      else await clipboardRepository.addTagsToItems([item.id], ['#notes']);
      setShowSaveDialog(false);
      onSave();
  };

  // --- Render Styles ---
  const bgColor = isDarkTheme ? 'bg-black' : 'bg-gray-100';
  const textColor = isDarkTheme ? 'text-white' : 'text-black';
  const headerBg = isDarkTheme ? 'bg-black border-zinc-900' : 'bg-white border-gray-200';
  const toolbarBg = isDarkTheme ? 'bg-[#121212] border-zinc-800' : 'bg-white border-gray-300';

  return (
    <div className={`h-screen w-full flex flex-col animate-fade-in font-sans relative ${bgColor} ${textColor}`}>
      
      {/* --- HEADER --- */}
      <header className={`px-4 py-3 flex items-center justify-between border-b sticky top-0 z-30 ${headerBg}`}>
        <div className="flex items-center flex-1">
            <button onClick={onBack} className={`mr-3 ${isDarkTheme ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <input 
                type="text" 
                value={title}
                onChange={handleTitleChange}
                placeholder="TITLE (optional)"
                className={`bg-transparent text-lg focus:outline-none w-full font-medium ${isDarkTheme ? 'text-zinc-300 placeholder-zinc-600' : 'text-gray-800 placeholder-gray-400'}`}
            />
        </div>
        
        <div className="flex items-center space-x-4">
             <div className={`flex items-center space-x-3 ${isDarkTheme ? 'text-zinc-400' : 'text-gray-500'}`}>
                 <button onClick={() => execCmd('undo')} className="hover:opacity-75" style={{ color: isDarkTheme ? undefined : accentColor }}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg></button>
                 <button onClick={() => execCmd('redo')} className="hover:opacity-75" style={{ color: isDarkTheme ? undefined : accentColor }}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg></button>
             </div>
             <button onClick={() => setShowSaveDialog(true)} className="font-medium text-lg hover:opacity-80 transition-colors px-2" style={{ color: accentColor }}>Save</button>
        </div>
      </header>

      {/* --- CONTENT AREA --- */}
      <main className="flex-1 relative overflow-y-auto">
        <div 
            ref={editorRef}
            contentEditable
            className={`w-full min-h-full p-6 focus:outline-none leading-relaxed whitespace-pre-wrap pb-48 ${isDarkTheme ? 'bg-black text-zinc-100' : 'bg-gray-50 text-gray-900'}`}
            style={{ fontSize: `${fontSize}px` }}
        />
        {!editorRef.current?.innerText && (
            <div className="absolute top-6 left-6 text-zinc-600 pointer-events-none text-base">Content</div>
        )}

        {/* Help Overlay */}
        {isHelpOpen && (
            <div className={`absolute inset-x-4 top-4 bottom-4 border rounded-2xl p-6 z-40 overflow-y-auto backdrop-blur-md shadow-2xl animate-fade-in ${isDarkTheme ? 'bg-[#121212]/95 border-gold/50' : 'bg-white/95 border-gray-300'}`} style={{ borderColor: isDarkTheme ? undefined : accentColor }}>
                 <h3 className="text-lg font-bold mb-4" style={{ color: accentColor }}>AI Tools Guide</h3>
                 <ul className={`space-y-4 text-sm leading-relaxed font-light ${isDarkTheme ? 'text-zinc-300' : 'text-gray-700'}`}>
                    <li><strong className={isDarkTheme ? 'text-white' : 'text-black'}>Remove Duplicates:</strong> Finds and deletes any repeated lines.</li>
                    <li><strong className={isDarkTheme ? 'text-white' : 'text-black'}>Clean Up:</strong> Removes empty lines and extra spaces.</li>
                 </ul>
            </div>
        )}
      </main>

      {/* --- AI MENU OVERLAY --- */}
      {isAiMenuOpen && (
          <div className="absolute bottom-16 left-2 right-2 z-50 animate-fade-in-up">
               <div className="flex justify-end mb-2 mr-1">
                   <button 
                       onClick={() => setIsHelpOpen(!isHelpOpen)}
                       className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors shadow-lg ${isHelpOpen ? 'text-black' : 'text-zinc-400'}`}
                       style={{ backgroundColor: isHelpOpen ? accentColor : (isDarkTheme ? 'black' : 'white'), borderColor: isHelpOpen ? accentColor : (isDarkTheme ? '#333' : '#ddd') }}
                   >
                       {isHelpOpen ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> : <span className="font-serif font-bold text-lg">?</span>}
                   </button>
               </div>
               <div className={`border rounded-xl p-2 grid grid-cols-2 gap-2 shadow-2xl ${isDarkTheme ? 'bg-[#0A0A0A] border-zinc-800' : 'bg-white border-gray-200'}`}>
                   {/* Cleaned up button generation */}
                   <AiButton label="Remove Duplicates" onClick={() => handleAiAction('DUPLICATES')} isDark={isDarkTheme} accentColor={accentColor} />
                   <AiButton label="Clean Up" onClick={() => handleAiAction('CLEANUP')} isDark={isDarkTheme} accentColor={accentColor} />
                   <AiButton label="Case Converter" onClick={() => handleAiAction('CASE')} isDark={isDarkTheme} accentColor={accentColor} />
                   <AiButton label="Make List" onClick={() => handleAiAction('LIST')} isDark={isDarkTheme} accentColor={accentColor} />
                   <AiButton label="Grammer Check" onClick={() => handleAiAction('GRAMMAR')} isDark={isDarkTheme} accentColor={accentColor} />
                   <AiButton label="Translate" onClick={() => handleAiAction('TRANSLATE')} isDark={isDarkTheme} accentColor={accentColor} />
               </div>
          </div>
      )}

      {/* --- TOOLBAR --- */}
      <div className={`border-t px-2 py-3 flex items-center justify-between sticky bottom-0 z-40 w-full overflow-x-auto no-scrollbar ${toolbarBg}`}>
          {isAiSupportOn && (
              <button 
                onClick={() => { setIsAiMenuOpen(!isAiMenuOpen); if (isAiMenuOpen) setIsHelpOpen(false); }}
                className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors shrink-0 ${isAiMenuOpen ? 'text-black' : ''}`}
                style={{ backgroundColor: isAiMenuOpen ? accentColor : 'transparent', color: isAiMenuOpen ? 'black' : accentColor }}
              >
                 <span className="font-bold text-lg font-serif italic">Ai</span>
              </button>
          )}

          <div className={`w-[1px] h-6 mx-1 ${isDarkTheme ? 'bg-zinc-800' : 'bg-gray-300'}`}></div>

          <div className="flex items-center space-x-1 shrink-0">
              <button onClick={() => handleFontSize(-2)} className={`w-8 h-8 flex items-center justify-center text-xl ${isDarkTheme ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>-</button>
              <span className={`font-mono w-8 text-center text-xs ${isDarkTheme ? 'text-white' : 'text-black'}`}>{fontSize}</span>
              <button onClick={() => handleFontSize(2)} className={`w-8 h-8 flex items-center justify-center text-xl ${isDarkTheme ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>+</button>
          </div>

          <div className={`w-[1px] h-6 mx-1 ${isDarkTheme ? 'bg-zinc-800' : 'bg-gray-300'}`}></div>

          <div className="flex items-center space-x-1 shrink-0">
              <button onClick={() => execCmd('underline')} className={`w-10 h-10 flex items-center justify-center rounded-lg ${isDarkTheme ? 'text-zinc-400 hover:bg-zinc-800' : 'text-gray-500 hover:bg-gray-100'}`}><span className="underline font-serif text-xl">U</span></button>
              <button onClick={() => execCmd('hiliteColor', accentColor)} className={`w-10 h-10 flex items-center justify-center rounded-lg ${isDarkTheme ? 'text-zinc-400 hover:bg-zinc-800' : 'text-gray-500 hover:bg-gray-100'}`}><div className="w-4 h-4 rounded-full" style={{ backgroundColor: accentColor }}></div></button>
              <button onClick={() => execCmd('bold')} className={`w-10 h-10 flex items-center justify-center rounded-lg ${isDarkTheme ? 'text-zinc-400 hover:bg-zinc-800' : 'text-gray-500 hover:bg-gray-100'}`}><span className="font-bold font-serif text-xl">B</span></button>
          </div>
      </div>

      {/* --- SAVE DIALOG --- */}
      {showSaveDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
              <div className={`border rounded-xl w-full max-w-sm overflow-hidden shadow-2xl ${isDarkTheme ? 'bg-[#121212] border-zinc-700' : 'bg-white border-gray-300'}`}>
                  <div className={`p-6 text-center border-b ${isDarkTheme ? 'border-zinc-800 text-white' : 'border-gray-200 text-black'}`}>
                      <h3 className="text-xl font-light">Save to :</h3>
                  </div>
                  <div className="flex items-center">
                      <button onClick={() => performSave('CLIPBOARD')} className={`flex-1 py-4 text-center border-r text-lg font-light ${isDarkTheme ? 'text-zinc-300 hover:bg-zinc-800 border-zinc-800' : 'text-gray-700 hover:bg-gray-100 border-gray-200'}`}>Clipboard</button>
                      <button onClick={() => performSave('NOTES')} className={`flex-1 py-4 text-center text-lg font-light ${isDarkTheme ? 'text-zinc-300 hover:bg-zinc-800' : 'text-gray-700 hover:bg-gray-100'}`}>Notes</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const AiButton: React.FC<{ label: string; onClick: () => void; isDark: boolean; accentColor: string }> = ({ label, onClick, isDark, accentColor }) => (
    <button 
        onClick={onClick} 
        className={`border py-3 px-2 rounded-lg text-sm transition-all ${isDark ? 'border-zinc-800 bg-[#1A1A1A] text-zinc-300 hover:text-white' : 'border-gray-200 bg-gray-50 text-gray-700 hover:text-black'}`}
        style={{ borderColor: 'transparent' }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = accentColor} 
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
    >
        {label}
    </button>
);

export default EditScreen;