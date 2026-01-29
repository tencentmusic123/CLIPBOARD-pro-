import React, { useState, useRef, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { clipboardRepository } from '../../data/repository/ClipboardRepository';

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  // --- Context State ---
  const { 
    isDarkTheme, toggleTheme, 
    accentColor, 
    readingFontSize, setReadingFontSize,
    isSmartRecognitionOn, toggleSmartRecognition,
    isAiSupportOn, toggleAiSupport,
    autoBackupFrequency, setAutoBackupFrequency,
    backupDestination, setBackupDestination
  } = useSettings();

  const { user, loginWithGoogle, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // --- UI Local State ---
  const [showBackupFreq, setShowBackupFreq] = useState(false);
  const [showBackupDest, setShowBackupDest] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  
  // Backup/Restore States
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State for Manual Actions
  const [actionModalType, setActionModalType] = useState<'BACKUP' | 'RESTORE' | null>(null);

  // --- Refs for Click Outside Logic ---
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Helpers ---
  const showToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3000);
  };

  const handleFeedbackSubmit = () => {
      if (!feedbackText.trim()) return;
      const subject = encodeURIComponent("CLIPBOARD MAX Feedback");
      const body = encodeURIComponent(feedbackText);
      window.location.href = `mailto:tencentmusic123@gmail.com?subject=${subject}&body=${body}`;
      setShowFeedbackModal(false);
      setFeedbackText('');
  };

  // Logic for Auto Backup Destination Setting
  const handleBackupDestinationSelect = async (dest: string) => {
      if (dest === 'Google' && !isAuthenticated) {
          await loginWithGoogle();
      }
      setBackupDestination(dest);
      setShowBackupDest(false);
  };

  // Logic for Manual Actions (Popup Flow)
  const handleManualActionStart = (type: 'BACKUP' | 'RESTORE') => {
      if (isBackingUp || isRestoring) return;
      setActionModalType(type);
  };

  const handleDestinationConfirm = async (destination: 'Google' | 'Local') => {
      // 1. Check Auth if Google
      if (destination === 'Google' && !isAuthenticated) {
          await loginWithGoogle();
      }
      
      const destLabel = destination === 'Google' ? 'Google Drive' : 'Local Storage';
      
      // Close Modal immediately so we can show loading state on main screen or via toast
      setActionModalType(null);

      // 2. Perform Action based on destination
      if (destination === 'Google') {
           // --- SIMULATED GOOGLE ACTION ---
           if (actionModalType === 'BACKUP') {
              setIsBackingUp(true);
              setTimeout(() => {
                  setIsBackingUp(false);
                  showToast(`Backup successfully saved to ${destLabel}`);
              }, 2000);
           } else {
               setIsRestoring(true);
               setTimeout(() => {
                   setIsRestoring(false);
                   showToast(`Data restored from ${destLabel}`);
               }, 2000);
           }
      } else {
          // --- LOCAL STORAGE ACTION ---
          if (actionModalType === 'BACKUP') {
              try {
                  const data = await clipboardRepository.exportData();
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  
                  // Trigger Download
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `clipboard_max_backup_${new Date().toISOString().slice(0, 10)}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  
                  showToast("Backup downloaded successfully");
              } catch (e) {
                  showToast("Backup generation failed");
                  console.error(e);
              }
          } else if (actionModalType === 'RESTORE') {
              // Trigger File Picker
              if (fileInputRef.current) {
                  fileInputRef.current.click();
              }
          }
      }
  };

  const handleFileRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      
      setIsRestoring(true);
      
      const reader = new FileReader();
      reader.onload = async (e) => {
          try {
              const content = e.target?.result as string;
              const success = await clipboardRepository.importData(content);
              
              if (success) {
                  showToast("Data restored successfully");
              } else {
                  showToast("Failed to restore: Invalid file format");
              }
          } catch (err) {
              console.error(err);
              showToast("Error parsing backup file");
          } finally {
              setIsRestoring(false);
              // Reset file input
              if (fileInputRef.current) fileInputRef.current.value = '';
          }
      };
      reader.onerror = () => {
          setIsRestoring(false);
          showToast("Error reading file");
          if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsText(file);
  };

  // --- Styles & Classes ---
  // Updated: Changed min-h-screen to h-full to fit within animated container without breaking overflow
  const containerClass = `h-full flex flex-col font-sans animate-fade-in ${isDarkTheme ? 'bg-black text-white' : 'bg-zinc-200 text-black'}`;
  const headerClass = `px-6 py-5 flex items-center justify-center sticky top-0 z-20 border-b relative ${isDarkTheme ? 'bg-black/95 border-zinc-800' : 'bg-white/95 border-zinc-400'}`;
  const sectionTitleClass = `text-xs font-bold tracking-[0.15em] uppercase mb-3 mt-8 px-4 opacity-50`;
  const cardClass = `mx-4 rounded-2xl border ${isDarkTheme ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-400 shadow-sm'}`;
  const itemClass = `flex items-center justify-between p-4 transition-colors ${isDarkTheme ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-50'}`;
  const dividerClass = `h-[1px] w-full ${isDarkTheme ? 'bg-zinc-800' : 'bg-gray-100'}`;

  return (
    <div className={containerClass}>
      
      {/* Hidden File Input for Restore */}
      <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".json" 
          onChange={handleFileRestore} 
      />

      {/* --- HEADER --- */}
      <header className={headerClass}>
         <button onClick={onBack} className="absolute left-4 p-2 rounded-full hover:bg-gray-500/10 transition-colors">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
             </svg>
         </button>
         <h1 className="text-base font-semibold tracking-wide">Settings</h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-32 no-scrollbar">
          
          {/* --- APPEARANCE --- */}
          <h3 className={sectionTitleClass}>Appearance</h3>
          <div className={cardClass}>
              {/* Theme Segmented Control */}
              <div className={`${itemClass} rounded-t-2xl`}>
                 <div className="flex items-center space-x-3">
                    <div className={`p-1.5 rounded-lg ${isDarkTheme ? 'bg-zinc-800 text-white' : 'bg-gray-100 text-black'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                    </div>
                    <span className="text-base font-medium">Theme</span>
                 </div>
                 <div className={`flex p-1 rounded-lg ${isDarkTheme ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                    {['Dark', 'Light', 'System'].map(t => {
                        const active = (t.toUpperCase() === 'DARK' && isDarkTheme) || (t.toUpperCase() === 'LIGHT' && !isDarkTheme); 
                        return (
                            <button 
                                key={t}
                                onClick={() => toggleTheme(t.toUpperCase() as any)}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${active ? (isDarkTheme ? 'bg-zinc-600 text-white shadow' : 'bg-white text-black shadow') : 'opacity-50'}`}
                            >
                                {t}
                            </button>
                        );
                    })}
                 </div>
              </div>

              <div className={dividerClass}></div>

              {/* Font Size Stepper */}
              <div className={`${itemClass} rounded-b-2xl`}>
                 <div className="flex items-center space-x-3">
                    <div className={`p-1.5 rounded-lg ${isDarkTheme ? 'bg-zinc-800 text-white' : 'bg-gray-100 text-black'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                    </div>
                    <span className="text-base font-medium">Text Size</span>
                 </div>
                 <div className="flex items-center space-x-4">
                     <button onClick={() => setReadingFontSize(Math.max(10, readingFontSize - 1))} className="w-8 h-8 rounded-full border border-gray-500/30 flex items-center justify-center hover:bg-gray-500/10 text-lg font-medium">-</button>
                     <span className="font-mono w-8 text-center">{readingFontSize}</span>
                     <button onClick={() => setReadingFontSize(Math.min(32, readingFontSize + 1))} className="w-8 h-8 rounded-full border border-gray-500/30 flex items-center justify-center hover:bg-gray-500/10 text-lg font-medium">+</button>
                 </div>
              </div>
          </div>

          {/* --- INTELLIGENCE --- */}
          <h3 className={sectionTitleClass}>Intelligence</h3>
          <div className={cardClass}>
              <SettingToggle 
                label="Smart Recognition" 
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                isOn={isSmartRecognitionOn} 
                onToggle={toggleSmartRecognition} 
                accentColor={accentColor} 
                isDarkTheme={isDarkTheme}
                className="rounded-t-2xl"
              />
              <div className={dividerClass}></div>
              <SettingToggle 
                label="AI Assist" 
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                isOn={isAiSupportOn} 
                onToggle={toggleAiSupport} 
                accentColor={accentColor} 
                isDarkTheme={isDarkTheme}
                className="rounded-b-2xl"
              />
          </div>

          {/* --- BACKUP & DATA --- */}
          <h3 className={sectionTitleClass}>Backup & Data</h3>
          <div className={cardClass}>
               {/* Manual Action Buttons Row */}
               <div className="flex items-center p-2 rounded-t-2xl">
                   <button 
                       onClick={() => handleManualActionStart('BACKUP')}
                       disabled={isBackingUp || isRestoring}
                       className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all ${isDarkTheme ? 'text-white hover:bg-zinc-800 active:bg-zinc-700' : 'text-black hover:bg-gray-100 active:bg-gray-200'}`}
                       style={{ color: accentColor }}
                   >
                       {isBackingUp ? 'Backing up...' : 'Backup Now'}
                   </button>
                   <div className={`w-[1px] h-6 ${isDarkTheme ? 'bg-zinc-800' : 'bg-gray-200'}`}></div>
                   <button 
                       onClick={() => handleManualActionStart('RESTORE')}
                       disabled={isBackingUp || isRestoring}
                       className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all ${isDarkTheme ? 'text-white hover:bg-zinc-800 active:bg-zinc-700' : 'text-black hover:bg-gray-100 active:bg-gray-200'}`}
                   >
                       {isRestoring ? 'Restoring...' : 'Restore Now'}
                   </button>
               </div>

               <div className={dividerClass}></div>

               {/* Combined Auto Backup & Destination Row */}
               <div className={`${itemClass} rounded-b-2xl`}>
                   <div className="flex items-center space-x-3">
                       <div className={`p-1.5 rounded-lg ${isDarkTheme ? 'bg-zinc-800 text-white' : 'bg-gray-100 text-black'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                       </div>
                       <span className="text-base font-medium">Auto Backup</span>
                   </div>
                   
                   <div className="flex items-center space-x-2">
                       {/* Frequency Trigger */}
                       <div className="relative">
                           <button 
                                onClick={(e) => { e.stopPropagation(); setShowBackupFreq(!showBackupFreq); setShowBackupDest(false); }}
                                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${isDarkTheme ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                           >
                               {autoBackupFrequency}
                           </button>
                           {/* Frequency Dropdown */}
                           {showBackupFreq && (
                                <div className={`absolute top-full right-0 mt-2 z-30 w-40 rounded-xl shadow-xl border overflow-hidden ${isDarkTheme ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-400'}`}>
                                    {['Off', 'Every Day', 'Every 15 days', 'Every Month'].map(opt => (
                                        <button 
                                            key={opt}
                                            onClick={(e) => { e.stopPropagation(); setAutoBackupFrequency(opt); setShowBackupFreq(false); }}
                                            className={`w-full text-left px-4 py-3 text-sm hover:opacity-80 ${isDarkTheme ? 'text-white hover:bg-zinc-800' : 'text-black hover:bg-gray-100'} ${autoBackupFrequency === opt ? (isDarkTheme ? 'bg-zinc-800' : 'bg-gray-100') : ''}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                           )}
                       </div>

                       {/* Destination Trigger */}
                       <div className="relative">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowBackupDest(!showBackupDest); setShowBackupFreq(false); }}
                                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors flex items-center space-x-1 ${isDarkTheme ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                <span className="max-w-[80px] truncate">{backupDestination}</span>
                            </button>
                             {/* Destination Dropdown */}
                           {showBackupDest && (
                                <div className={`absolute top-full right-0 mt-2 z-30 w-48 rounded-xl shadow-xl border overflow-hidden ${isDarkTheme ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-400'}`}>
                                     <button onClick={(e) => { e.stopPropagation(); handleBackupDestinationSelect('Google'); }} className={`w-full text-left px-4 py-3 text-sm hover:opacity-80 flex flex-col ${isDarkTheme ? 'text-white hover:bg-zinc-800' : 'text-black hover:bg-gray-100'}`}>
                                         <span>Google Drive</span>
                                         {isAuthenticated && backupDestination === 'Google' && <span className="text-[10px] opacity-50">{user?.email}</span>}
                                     </button>
                                     <button onClick={(e) => { e.stopPropagation(); handleBackupDestinationSelect('Local files'); }} className={`w-full text-left px-4 py-3 text-sm hover:opacity-80 ${isDarkTheme ? 'text-white hover:bg-zinc-800' : 'text-black hover:bg-gray-100'}`}>
                                         Local Files
                                     </button>
                                </div>
                           )}
                       </div>
                   </div>
               </div>
          </div>

          {/* --- SUPPORT --- */}
          <h3 className={sectionTitleClass}>Support</h3>
          <div className={cardClass}>
              <SettingsRow 
                 label="Send Feedback" 
                 icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>}
                 isDarkTheme={isDarkTheme}
                 onClick={() => setShowFeedbackModal(true)}
                 className="rounded-t-2xl"
              />
              <div className={dividerClass}></div>
              <SettingsRow 
                 label="Rate Us" 
                 icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
                 isDarkTheme={isDarkTheme}
                 onClick={() => showToast('Opening Play Store...')}
              />
              <div className={dividerClass}></div>
              <SettingsRow 
                 label="Remove Ads" 
                 icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
                 isDarkTheme={isDarkTheme}
                 onClick={() => showToast('In-App Purchase coming soon')}
                 className="rounded-b-2xl"
              />
          </div>
          <div className="p-4 flex justify-between items-center opacity-50 mx-4">
               <div className="flex items-center space-x-3">
                   <div className="w-8"></div> {/* Spacer for alignment */}
                   <span className="text-sm font-medium">Version</span>
               </div>
               <span className="text-sm font-mono">1.0.0</span>
          </div>
      </main>

      {/* --- TOAST NOTIFICATION --- */}
      {toastMessage && (
          <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up">
              <div className="bg-zinc-900 border border-zinc-700 text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium tracking-wide">{toastMessage}</span>
              </div>
          </div>
      )}

      {/* --- ACTION DESTINATION MODAL --- */}
      {actionModalType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div 
                  className={`border rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col ${isDarkTheme ? 'bg-black border-zinc-700 text-white' : 'bg-white border-zinc-400 text-black'}`}
                  style={{ borderColor: accentColor }}
              >
                  <h3 className="text-xl text-center mb-6 font-medium tracking-wide">
                      {actionModalType === 'BACKUP' ? 'Backup Destination' : 'Restore Source'}
                  </h3>
                  
                  <div className="space-y-3">
                      <button 
                          onClick={() => handleDestinationConfirm('Google')}
                          className={`w-full flex items-center p-4 rounded-xl border transition-all relative overflow-hidden group ${isDarkTheme ? 'hover:bg-zinc-900 border-zinc-800' : 'hover:bg-gray-50 border-zinc-400'}`}
                      >
                          <svg className="w-6 h-6 mr-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 0.507 5.387 0 12s5.36 12 12.48 12c3.6 0 6.347-1.173 8.4-3.253 2.187-2.187 2.867-5.333 2.867-8.133 0-.8-.08-1.453-.173-2.08H12.48z"/>
                          </svg>
                          <div className="text-left flex-1">
                              <div className="font-medium text-base">Google Drive</div>
                              <div className={`text-xs ${isDarkTheme ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                  {isAuthenticated ? `As ${user?.email}` : 'Sign in required'}
                              </div>
                          </div>
                      </button>

                      <button 
                          onClick={() => handleDestinationConfirm('Local')}
                          className={`w-full flex items-center p-4 rounded-xl border transition-all ${isDarkTheme ? 'hover:bg-zinc-900 border-zinc-800' : 'hover:bg-gray-50 border-zinc-400'}`}
                      >
                           <svg className="w-6 h-6 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                          <div className="text-left">
                              <div className="font-medium text-base">Local Storage</div>
                              <div className={`text-xs ${isDarkTheme ? 'text-zinc-400' : 'text-zinc-600'}`}>Device Internal Storage</div>
                          </div>
                      </button>
                  </div>

                  <button 
                      onClick={() => setActionModalType(null)}
                      className={`mt-6 w-full py-3 text-center text-sm uppercase tracking-wider font-medium hover:opacity-100 transition-opacity ${isDarkTheme ? 'text-zinc-500 hover:text-white' : 'text-zinc-600 hover:text-black'}`}
                  >
                      Cancel
                  </button>
              </div>
          </div>
      )}

      {/* --- FEEDBACK MODAL --- */}
      {showFeedbackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className={`border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col ${isDarkTheme ? 'bg-black border-zinc-700' : 'bg-white border-zinc-400'}`} style={{ borderColor: accentColor }}>
                  <div className={`p-4 border-b flex justify-between items-center ${isDarkTheme ? 'border-zinc-800 bg-zinc-900' : 'border-gray-100 bg-gray-50'}`}>
                      <h3 className="font-semibold tracking-wide" style={{ color: accentColor }}>Send Feedback</h3>
                      <button onClick={() => setShowFeedbackModal(false)}>
                          <svg className="w-6 h-6 opacity-50 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                  </div>
                  <div className="p-4">
                      <textarea
                          className={`w-full h-32 p-3 border rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-offset-0 ${isDarkTheme ? 'bg-zinc-900 border-zinc-700 text-white focus:border-white' : 'bg-white border-zinc-400 text-black focus:border-black'}`}
                          placeholder="Tell us what you think..."
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                      />
                      <button 
                          onClick={handleFeedbackSubmit}
                          className={`w-full mt-4 py-3 rounded-lg font-medium text-sm uppercase tracking-wider hover:opacity-90 transition-opacity ${isDarkTheme ? 'text-black' : 'text-white'}`}
                          style={{ backgroundColor: accentColor }}
                      >
                          Submit
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

// --- Sub-components for cleaner code ---

const SettingToggle: React.FC<{ label: string; icon: React.ReactNode; isOn: boolean; onToggle: () => void; accentColor: string; isDarkTheme: boolean; className?: string }> = ({ label, icon, isOn, onToggle, accentColor, isDarkTheme, className }) => (
    <div className={`flex items-center justify-between p-4 ${isDarkTheme ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-50'} ${className}`}>
        <div className="flex items-center space-x-3">
            <div className={`p-1.5 rounded-lg ${isDarkTheme ? 'bg-zinc-800 text-white' : 'bg-gray-100 text-black'}`}>
                {icon}
            </div>
            <span className="text-base font-medium">{label}</span>
        </div>
        <button 
            onClick={onToggle}
            className={`w-11 h-6 rounded-full relative transition-colors duration-200 focus:outline-none`}
            style={{ backgroundColor: isOn ? accentColor : (isDarkTheme ? '#333' : '#e5e7eb') }}
        >
            <div 
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-sm ${isOn ? 'left-6' : 'left-1'}`}
            />
        </button>
    </div>
);

const SettingsRow: React.FC<{ label: string; icon: React.ReactNode; isDarkTheme: boolean; onClick: () => void; className?: string }> = ({ label, icon, isDarkTheme, onClick, className }) => (
    <button onClick={onClick} className={`w-full flex items-center justify-between p-4 transition-colors ${isDarkTheme ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-50'} ${className}`}>
        <div className="flex items-center space-x-3">
            <div className={`p-1.5 rounded-lg ${isDarkTheme ? 'bg-zinc-800 text-white' : 'bg-gray-100 text-black'}`}>
                {icon}
            </div>
            <span className="text-base font-medium">{label}</span>
        </div>
        <svg className="w-4 h-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
    </button>
);

export default SettingsScreen;