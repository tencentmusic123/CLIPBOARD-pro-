import React, { useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Capacitor } from '@capacitor/core';

/**
 * Start.io Banner Ad Component
 * Displays non-personalized banner ads at the bottom of the screen.
 * 
 * For full integration, you need to:
 * 1. Add Start.io SDK to the Android project (build.gradle)
 * 2. Initialize Start.io in the native code
 * 3. Use Capacitor plugin to communicate with native ad SDK
 * 
 * This component provides the UI placeholder and will integrate with the native SDK.
 */
const StartIOBannerAd: React.FC = () => {
  const { isDarkTheme } = useSettings();
  const adContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Initialize Start.io banner ad when running on native platform
    const initBannerAd = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // Start.io SDK integration will be handled by native plugin
          // The native layer will inject the ad into the WebView or display it natively
          console.log('Start.io Banner Ad: Initializing for native platform');
          
          // Note: Actual Start.io implementation requires:
          // 1. Adding Start.io SDK to android/app/build.gradle
          // 2. Creating a Capacitor plugin to bridge with Start.io SDK
          // 3. Calling native methods to display banner ads
          // 
          // For non-personalized ads, set:
          // StartAppSDK.setUserConsent(context, "pas", timestamp, false);
          
        } catch (error) {
          console.warn('Start.io Banner Ad initialization failed:', error);
        }
      }
    };
    
    initBannerAd();
  }, []);
  
  // Banner dimensions: Standard mobile banner is 320x50
  return (
    <div 
      ref={adContainerRef}
      id="startio-banner-container"
      className={`fixed bottom-0 left-0 right-0 z-10 flex items-center justify-center ${isDarkTheme ? 'bg-zinc-900' : 'bg-gray-100'}`}
      style={{ 
        height: '50px',
        minHeight: '50px'
      }}
    >
      {/* Placeholder shown until native ad loads */}
      <div 
        className={`w-full h-full flex items-center justify-center text-xs ${isDarkTheme ? 'text-zinc-600' : 'text-gray-400'}`}
      >
        {Capacitor.isNativePlatform() ? (
          // On native, the ad SDK will populate this area
          <span className="opacity-50">Advertisement</span>
        ) : (
          // On web, show placeholder
          <span className="opacity-50">Ad Space (Build APK for ads)</span>
        )}
      </div>
    </div>
  );
};

export default StartIOBannerAd;
