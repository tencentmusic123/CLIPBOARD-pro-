import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Preferences } from '@capacitor/preferences';

interface PrivacyPolicyOverlayProps {
  onAccept: () => void;
}

const PRIVACY_ACCEPTED_KEY = 'privacy_policy_accepted';

const PrivacyPolicyOverlay: React.FC<PrivacyPolicyOverlayProps> = ({ onAccept }) => {
  const { accentColor, isDarkTheme } = useSettings();
  
  const handleAccept = async () => {
    await Preferences.set({ key: PRIVACY_ACCEPTED_KEY, value: 'true' });
    onAccept();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div 
        className={`border-2 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] ${isDarkTheme ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-zinc-300 text-black'}`}
        style={{ borderColor: accentColor }}
      >
        {/* Header */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}20` }}>
            <svg className="w-6 h-6" style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-center mb-2" style={{ color: accentColor }}>Privacy Policy</h2>
        <p className={`text-center text-sm mb-4 ${isDarkTheme ? 'text-zinc-400' : 'text-gray-600'}`}>
          Please review our privacy policy before using the app.
        </p>
        
        {/* Content */}
        <div className={`flex-1 overflow-y-auto rounded-xl p-4 mb-4 text-sm leading-relaxed ${isDarkTheme ? 'bg-black/50' : 'bg-gray-50'}`}>
          <h3 className="font-bold mb-2">Clipboard Max Privacy Policy</h3>
          <p className="mb-3">Last updated: February 2026</p>
          
          <h4 className="font-semibold mb-1">Data Collection</h4>
          <p className="mb-3">
            Clipboard Max stores your clipboard history and notes locally on your device. 
            We do not collect, transmit, or share your personal data with any third parties.
            All your clips and notes remain on your device.
          </p>
          
          <h4 className="font-semibold mb-1">Clipboard Access</h4>
          <p className="mb-3">
            This app requires access to your device clipboard to save and manage your copied content.
            Clipboard content is stored locally and never leaves your device.
          </p>
          
          <h4 className="font-semibold mb-1">Advertisements</h4>
          <p className="mb-3">
            This app displays non-personalized advertisements through Start.io.
            We do not use personalized ads or share your data for advertising purposes.
            The ads shown are not based on your personal information or browsing history.
          </p>
          
          <h4 className="font-semibold mb-1">Data Storage</h4>
          <p className="mb-3">
            All data is stored locally on your device using secure storage mechanisms.
            We recommend using device security features like screen lock to protect your data.
          </p>
          
          <h4 className="font-semibold mb-1">Your Rights</h4>
          <p className="mb-3">
            You can delete all your data at any time by clearing the app data or uninstalling the app.
            You have full control over your clipboard history and notes.
          </p>
          
          <h4 className="font-semibold mb-1">Contact</h4>
          <p>
            If you have any questions about this Privacy Policy, please contact us at tencentmusic123@gmail.com.
          </p>
        </div>
        
        {/* Accept Button */}
        <button
          onClick={handleAccept}
          className="w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-opacity hover:opacity-90"
          style={{ backgroundColor: accentColor, color: isDarkTheme ? 'black' : 'white' }}
        >
          I Accept
        </button>
      </div>
    </div>
  );
};

// Hook to check if privacy policy has been accepted
export const usePrivacyPolicyStatus = () => {
  const [isAccepted, setIsAccepted] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkStatus = async () => {
      const { value } = await Preferences.get({ key: PRIVACY_ACCEPTED_KEY });
      setIsAccepted(value === 'true');
    };
    checkStatus();
  }, []);
  
  const markAccepted = () => {
    setIsAccepted(true);
  };
  
  return { isAccepted, markAccepted };
};

export default PrivacyPolicyOverlay;
