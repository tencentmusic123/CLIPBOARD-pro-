import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ClipboardItem, ClipboardType } from '../../types';
import { clipboardRepository } from '../../data/repository/ClipboardRepository';
import { useSettings } from '../context/SettingsContext';
import { removeDuplicates, cleanupFormat, convertToList, fixGrammar, changeCase } from '../../util/AITextProcessor';
import { Clipboard } from '@capacitor/clipboard';
import { detectSmartItems } from '../../util/SmartRecognition';

interface EditScreenProps {
  item: ClipboardItem;
  isNew?: boolean;
  onBack: () => void;
  onSave: (item?: ClipboardItem) => void;
}

const EditScreen: React.FC<EditScreenProps> = ({ item, isNew, onBack, onSave }) => {
  const { accentColor, isDarkTheme, isAiSupportOn, readingFontSize } = useSettings();
  
  // --- Local State ---
  const [title, setTitle] = useState(item.title || '');
  const [fontSize, setFontSize] = useState(readingFontSize);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  
  // Editor State for UI toggles
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  const [isUnderlineActive, setIsUnderlineActive] = useState(false);
  const [isStrikeActive, setIsStrikeActive] = useState(false);
  
  // --- Refs ---
  const editorRef = useRef<HTMLDivElement>(null);
  const caseModeRef = useRef<number>(0);
  
  // --- CUSTOM HISTORY ENGINE ---
  // We use Refs for history to prevent re-renders while typing which causes cursor jumping
  const historyStack = useRef<string[]>([]);
  const historyIndex = useRef<number>(-1);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Initialization ---
  useEffect(() => {
    if (editorRef.current) {
        // Initialize content
        const initialContent = item.htmlContent || item.content || '';
        if (item.htmlContent) {
            editorRef.current.innerHTML = item.htmlContent;
        } else {
            editorRef.current.innerText = item.content;
        }
        
        // Set initial content state
        setHasContent(!!(item.content || item.htmlContent));

        // Initialize History
        historyStack.current = [editorRef.current.innerHTML];
        historyIndex.current = 0;
    }
  }, [item]);

  // --- History Logic ---

  /**
   * Pushes the current state of the editor to the history stack.
   * Should be called AFTER a significant change (AI action, button press).
   */
  const saveSnapshot = useCallback(() => {
      if (!editorRef.current) return;
      
      const currentContent = editorRef.current.innerHTML;
      const currentIndex = historyIndex.current;
      const currentStack = historyStack.current;

      // Don't save if it's identical to the current state
      if (currentStack[currentIndex] === currentContent) return;

      // If we are in the middle of the stack (did undo), chop off the future
      const newStack = currentStack.slice(0, currentIndex + 1);
      
      newStack.push(currentContent);
      historyStack.current = newStack;
      historyIndex.current = newStack.length - 1;
  }, []);

  /**
   * Handles typing input. Debounces the snapshot save so we don't 
   * save every single character, but save when the user pauses.
   */
  const handleInput = () => {
      // Update placeholder visibility
      setHasContent(!!(editorRef.current?.innerText?.trim()));
      
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      
      debounceTimer.current = setTimeout(() => {
          saveSnapshot();
      }, 500); // Save 500ms after last keystroke
  };

  const performUndo = () => {
      if (!editorRef.current) return;
      if (historyIndex.current > 0) {
          historyIndex.current--;
          const prevContent = historyStack.current[historyIndex.current];
          editorRef.current.innerHTML = prevContent;
          placeCaretAtEnd(editorRef.current); // Move cursor to end to prevent getting stuck
      }
  };

  const performRedo = () => {
      if (!editorRef.current) return;
      if (historyIndex.current < historyStack.current.length - 1) {
          historyIndex.current++;
          const nextContent = historyStack.current[historyIndex.current];
          editorRef.current.innerHTML = nextContent;
          placeCaretAtEnd(editorRef.current);
      }
  };

  const placeCaretAtEnd = (el: HTMLElement) => {
      el.focus();
      if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
          const range = document.createRange();
          range.selectNodeContents(el);
          range.collapse(false);
          const sel = window.getSelection();
          if (sel) {
              sel.removeAllRanges();
              sel.addRange(range);
          }
      }
  };

  // --- Editor Helpers ---

  /**
   * Updates content programmatically (for AI/Case tools).
   * Automatically saves history before and after to ensure Undo works.
   */
  const updateContentProgrammatically = (newText: string) => {
      if (!editorRef.current) return;
      
      // 1. Force save current state before changing (if distinct)
      saveSnapshot();

      // 2. Apply change
      // Note: Replacing innerText removes bold/italic tags. 
      // This is expected for "Text Transformers" like Case Converter.
      // But because we saved history above, Undo will restore the tags!
      editorRef.current.innerText = newText;

      // 3. Save new state
      saveSnapshot();
  };

  const checkActiveStyles = () => {
      if (!document) return;
      setIsBoldActive(document.queryCommandState('bold'));
      setIsItalicActive(document.queryCommandState('italic'));
      setIsUnderlineActive(document.queryCommandState('underline'));
      setIsStrikeActive(document.queryCommandState('strikeThrough'));
  };

  const handleEditorInteraction = () => {
      checkActiveStyles();
      // Close menus on interaction
      if (isAiMenuOpen) setIsAiMenuOpen(false);
  };

  // Helper to prevent focus loss when clicking toolbar buttons
  const handleToolbarMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
      // 1. Execute Native Command
      document.execCommand(command, false, value);
      
      // 2. Force Snapshot immediately so this formatting change is undoable
      if (editorRef.current) {
          // Clear any pending typing debounce to keep timeline clean
          if (debounceTimer.current) clearTimeout(debounceTimer.current);
          
          const newStack = historyStack.current.slice(0, historyIndex.current + 1);
          newStack.push(editorRef.current.innerHTML);
          historyStack.current = newStack;
          historyIndex.current = newStack.length - 1;
      }
      
      if (editorRef.current) editorRef.current.focus();
      checkActiveStyles();
  };

  const handleChangeCase = () => {
      if (!editorRef.current) return;
      const text = editorRef.current.innerText;
      
      const mode = (caseModeRef.current + 1) % 4;
      caseModeRef.current = mode;
      
      const newText = changeCase(text, mode);
      updateContentProgrammatically(newText);
  };

  // --- Input Handlers ---
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value.length <= 30) setTitle(e.target.value);
  };

  // --- AI / Text Processing Handlers ---
  const handleAiAction = (action: string) => {
      if (!editorRef.current) return;
      const text = editorRef.current.innerText;
      let newText = text;

      switch(action) {
          case 'DUPLICATES':
              newText = removeDuplicates(text);
              break;

          case 'CLEANUP':
              newText = cleanupFormat(text);
              break;

          case 'LIST':
              newText = convertToList(text);
              break;

          case 'GRAMMAR':
              newText = fixGrammar(text);
              break;
      }
      
      updateContentProgrammatically(newText);
      setIsAiMenuOpen(false);
  };

  // --- Save Handler ---
  const performSave = async (destination: 'CLIPBOARD' | 'NOTES') => {
      const htmlContent = editorRef.current?.innerHTML || '';
      const content = editorRef.current?.innerText || '';
      
      const category = destination === 'CLIPBOARD' ? 'clipboard' : 'notes';
      const timestamp = new Date().toLocaleString();
      
      // Auto-detect type using smart recognition
      let detectedType = item.type || ClipboardType.TEXT;
      const smartItems = detectSmartItems(content);
      if (smartItems.length > 0) {
        const firstType = smartItems[0].type;
        switch (firstType) {
          case 'PHONE':
            detectedType = ClipboardType.PHONE;
            break;
          case 'EMAIL':
            detectedType = ClipboardType.EMAIL;
            break;
          case 'LINK':
            detectedType = ClipboardType.LINK;
            break;
          case 'LOCATION':
            detectedType = ClipboardType.LOCATION;
            break;
          default:
            detectedType = item.type || ClipboardType.TEXT;
        }
      }
      
      let finalItem: ClipboardItem;

      if (isNew) {
         finalItem = {
             ...item,
             id: Date.now().toString(),
             title,
             content,
             htmlContent,
             type: detectedType,
             timestamp,
             category,
             tags: category === 'notes' ? ['#notes'] : []
         };
         await clipboardRepository.addItem(finalItem);
      } else {
          finalItem = {
              ...item,
              title,
              content,
              htmlContent,
              type: detectedType,
              timestamp,
              category: category
          };
          await clipboardRepository.updateItem(item.id, { 
              title, 
              content, 
              htmlContent,
              type: detectedType,
              timestamp,
              category: category
          });
          
          if (destination === 'NOTES') {
              await clipboardRepository.addTagsToItems([item.id], ['#notes']);
              const newTags = Array.from(new Set([...finalItem.tags, '#notes']));
              finalItem.tags = newTags;
          }
      }
      
      if (destination === 'CLIPBOARD') {
          await Clipboard.write({ string: content });
      }
      
      setShowSaveDialog(false);
      onSave(finalItem);
  };

  // --- Render Styles ---
  const bgColor = isDarkTheme ? 'bg-black' : 'bg-[#F2F2F7]';
  const textColor = isDarkTheme ? 'text-white' : 'text-black';
  const headerBg = isDarkTheme ? 'bg-black/80 border-zinc-900' : 'bg-white/80 border-gray-200';
  const toolbarBg = isDarkTheme ? 'bg-[#121212] border-zinc-800' : 'bg-white border-gray-200';
  const toolbarBtnClass = `w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200`;
  
  const getBtnStyle = (isActive: boolean) => {
      if (isDarkTheme) {
          return isActive 
            ? { backgroundColor: accentColor, color: '#000000' } // Active Dark Mode (Gold Bg, Black Text)
            : { color: '#A1A1AA' }; // Inactive Dark Mode (Zinc Text)
      } else {
          return isActive
            ? { backgroundColor: accentColor, color: '#000000' } // Active Light Mode (Gold Bg, Black Text)
            : { color: '#6B7280' }; // Inactive Light Mode (Gray Text)
      }
  };

  return (
    <div className={`h-screen w-full flex flex-col animate-fade-in font-sans relative ${bgColor} ${textColor}`}>
      
      {/* --- HEADER --- */}
      <header className={`px-4 py-3 flex items-center justify-between border-b sticky top-0 z-30 backdrop-blur-xl ${headerBg}`}>
        <div className="flex items-center flex-1 max-w-4xl mx-auto w-full">
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
            
            <div className="flex items-center space-x-4 pl-4">
                 <div className={`flex items-center space-x-3 ${isDarkTheme ? 'text-zinc-400' : 'text-gray-500'}`}>
                     <button 
                        onMouseDown={handleToolbarMouseDown}
                        onClick={performUndo} 
                        className="hover:opacity-75" style={{ color: isDarkTheme ? undefined : accentColor }}
                     >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                     </button>
                     <button 
                        onMouseDown={handleToolbarMouseDown}
                        onClick={performRedo} 
                        className="hover:opacity-75" style={{ color: isDarkTheme ? undefined : accentColor }}
                     >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
                     </button>
                 </div>
                 <button onClick={() => setShowSaveDialog(true)} className="font-medium text-lg hover:opacity-80 transition-colors px-2" style={{ color: accentColor }}>Save</button>
            </div>
        </div>
      </header>

      {/* --- CONTENT AREA --- */}
      <main className="flex-1 relative overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full min-h-full flex flex-col">
            <div 
                ref={editorRef}
                contentEditable
                spellCheck={true}
                onInput={handleInput}
                onKeyUp={handleEditorInteraction}
                onMouseUp={handleEditorInteraction}
                onTouchEnd={handleEditorInteraction}
                className={`w-full flex-1 p-6 focus:outline-none leading-relaxed whitespace-pre-wrap pb-48 ${isDarkTheme ? 'bg-black text-zinc-100' : 'bg-[#F2F2F7] text-gray-900'}`}
                style={{ fontSize: `${fontSize}px` }}
            />
            {!hasContent && (
                <div className="absolute top-6 left-6 text-zinc-600 pointer-events-none text-base pl-4 md:pl-0">Type here...</div>
            )}
        </div>

        {/* Help Overlay */}
        {isHelpOpen && (
            <div className={`absolute inset-x-4 top-4 bottom-4 border rounded-2xl p-6 z-40 overflow-y-auto backdrop-blur-md shadow-2xl animate-fade-in max-w-lg mx-auto ${isDarkTheme ? 'bg-[#121212]/95 border-gold/50' : 'bg-white/95 border-gray-300'}`} style={{ borderColor: isDarkTheme ? undefined : accentColor }}>
                 <h3 className="text-lg font-bold mb-4" style={{ color: accentColor }}>AI Tools Guide</h3>
                 <ul className={`space-y-4 text-sm leading-relaxed font-light ${isDarkTheme ? 'text-zinc-300' : 'text-gray-700'}`}>
                    <li><strong className={isDarkTheme ? 'text-white' : 'text-black'}>Remove Duplicates:</strong> Finds and deletes any repeated lines to make lists shorter.</li>
                    <li><strong className={isDarkTheme ? 'text-white' : 'text-black'}>Clean Up:</strong> The "Fix All" button. Removes extra spaces, empty lines, and bad formatting.</li>
                    <li><strong className={isDarkTheme ? 'text-white' : 'text-black'}>Make List:</strong> Turns long text (lines, sentences, or commas) into a clean bulleted list.</li>
                    <li><strong className={isDarkTheme ? 'text-white' : 'text-black'}>Grammar Check:</strong> Fixes common mistakes like extra spaces, capitalization, and enables spell check.</li>
                 </ul>
            </div>
        )}
      </main>

      {/* --- AI MENU OVERLAY --- */}
      {isAiMenuOpen && (
          <div className="absolute bottom-24 left-4 right-4 z-50 animate-fade-in-up max-w-2xl mx-auto">
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
                   <AiButton label="Remove Duplicates" onClick={() => handleAiAction('DUPLICATES')} isDark={isDarkTheme} accentColor={accentColor} />
                   <AiButton label="Clean Up" onClick={() => handleAiAction('CLEANUP')} isDark={isDarkTheme} accentColor={accentColor} />
                   <AiButton label="Make List" onClick={() => handleAiAction('LIST')} isDark={isDarkTheme} accentColor={accentColor} />
                   <AiButton label="Grammar Check" onClick={() => handleAiAction('GRAMMAR')} isDark={isDarkTheme} accentColor={accentColor} />
               </div>
          </div>
      )}

      {/* --- TOOLBAR --- */}
      <div className={`border-t flex items-center justify-center w-full sticky bottom-0 z-40 ${toolbarBg}`}>
          <div className="flex items-center w-full max-w-3xl px-4 py-4 justify-between">
              
              {/* AI Button */}
              {isAiSupportOn && (
                 <button 
                   onClick={() => { setIsAiMenuOpen(!isAiMenuOpen); if (isAiMenuOpen) setIsHelpOpen(false); }}
                   className={`flex items-center justify-center w-12 h-12 rounded-xl transition-colors ${isAiMenuOpen ? 'text-black' : ''}`}
                   style={{ backgroundColor: isAiMenuOpen ? accentColor : 'transparent', color: isAiMenuOpen ? 'black' : accentColor }}
                 >
                    <span className="font-bold text-xl font-serif italic">Ai</span>
                 </button>
              )}

              {/* Formatting Tools - Evenly Spaced */}
              
              <button 
                onMouseDown={handleToolbarMouseDown}
                onClick={() => execCmd('bold')} 
                className={toolbarBtnClass}
                style={getBtnStyle(isBoldActive)}
              >
                  <span className="font-bold font-serif text-xl">B</span>
              </button>
              
              <button 
                onMouseDown={handleToolbarMouseDown}
                onClick={() => execCmd('italic')} 
                className={toolbarBtnClass}
                style={getBtnStyle(isItalicActive)}
              >
                  <span className="italic font-serif text-xl">I</span>
              </button>
              
              <button 
                onMouseDown={handleToolbarMouseDown}
                onClick={() => execCmd('underline')} 
                className={toolbarBtnClass}
                style={getBtnStyle(isUnderlineActive)}
              >
                  <span className="underline font-serif text-xl">U</span>
              </button>
              
              <button 
                onMouseDown={handleToolbarMouseDown}
                onClick={() => execCmd('strikeThrough')} 
                className={toolbarBtnClass}
                style={getBtnStyle(isStrikeActive)}
              >
                  <span className="line-through font-serif text-xl">S</span>
              </button>

              <button 
                  onMouseDown={handleToolbarMouseDown}
                  onClick={handleChangeCase}
                  className={toolbarBtnClass}
                  style={getBtnStyle(false)}
               >
                  <span className="font-serif text-xl">Aa</span>
               </button>
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