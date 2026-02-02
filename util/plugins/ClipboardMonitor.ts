import { registerPlugin } from '@capacitor/core';

export interface PendingClip {
  id: string;
  content: string;
  timestamp: number;
  synced: boolean;
}

export interface ClipboardChangedEvent {
  content: string;
  timestamp: number;
  id: string;
}

export interface ServiceStatusEvent {
  connected: boolean;
}

export interface ClipboardMonitorPlugin {
  /**
   * Check if the Accessibility Service is enabled
   */
  isAccessibilityEnabled(): Promise<{ enabled: boolean; serviceConnected: boolean }>;

  /**
   * Open the Android Accessibility Settings screen
   */
  openAccessibilitySettings(): Promise<void>;

  /**
   * Get pending clips captured by the background service
   */
  getPendingClips(): Promise<{ clips: PendingClip[] }>;

  /**
   * Clear all pending clips
   */
  clearPendingClips(): Promise<void>;

  /**
   * Mark specific clips as synced
   */
  markClipsAsSynced(options: { ids: string[] }): Promise<void>;

  /**
   * Add listener for clipboard changes
   */
  addListener(
    eventName: 'clipboardChanged',
    listenerFunc: (event: ClipboardChangedEvent) => void
  ): Promise<{ remove: () => Promise<void> }>;

  /**
   * Add listener for service status changes
   */
  addListener(
    eventName: 'serviceStatusChanged',
    listenerFunc: (event: ServiceStatusEvent) => void
  ): Promise<{ remove: () => Promise<void> }>;

  /**
   * Remove all listeners
   */
  removeAllListeners(): Promise<void>;
}

// Create a fallback implementation for web/non-native platforms
const ClipboardMonitorWeb: ClipboardMonitorPlugin = {
  async isAccessibilityEnabled() {
    return { enabled: false, serviceConnected: false };
  },
  async openAccessibilitySettings() {
    console.log('Accessibility settings not available on web');
  },
  async getPendingClips() {
    return { clips: [] };
  },
  async clearPendingClips() {
    // No-op on web
  },
  async markClipsAsSynced(_options: { ids: string[] }) {
    // No-op on web
  },
  async addListener(_eventName: string, _listenerFunc: any) {
    return { remove: async () => {} };
  },
  async removeAllListeners() {
    // No-op on web
  }
};

// Register the plugin with fallback
export const ClipboardMonitor = registerPlugin<ClipboardMonitorPlugin>('ClipboardMonitor', {
  web: () => Promise.resolve(ClipboardMonitorWeb)
});
