package com.clipboardmax.fresh;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Accessibility Service that monitors clipboard changes in the background.
 * This service runs even when the app is in the background and captures
 * clipboard content when the user copies text from any app.
 */
public class ClipboardAccessibilityService extends AccessibilityService {

    private static final String TAG = "ClipboardAccessibility";
    private static final String PREFS_NAME = "clipboard_monitor_prefs";
    private static final String CLIPS_KEY = "pending_clips";
    private static final int MAX_PENDING_CLIPS = 100;

    private ClipboardManager clipboardManager;
    private String lastClipContent = "";

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "ClipboardAccessibilityService created");
    }

    @Override
    public void onServiceConnected() {
        super.onServiceConnected();
        Log.d(TAG, "ClipboardAccessibilityService connected");

        // Configure the accessibility service
        AccessibilityServiceInfo info = new AccessibilityServiceInfo();
        info.eventTypes = AccessibilityEvent.TYPES_ALL_MASK;
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
        info.notificationTimeout = 100;
        info.flags = AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS;
        
        setServiceInfo(info);

        // Initialize clipboard manager
        clipboardManager = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        
        // Add clipboard listener
        if (clipboardManager != null) {
            clipboardManager.addPrimaryClipChangedListener(new ClipboardManager.OnPrimaryClipChangedListener() {
                @Override
                public void onPrimaryClipChanged() {
                    handleClipboardChange();
                }
            });
            Log.d(TAG, "Clipboard listener registered");
        }

        // Notify plugin that service is connected
        ClipboardMonitorPlugin.notifyServiceConnected(true);
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // We mainly use the clipboard listener, but this method is required
    }

    @Override
    public void onInterrupt() {
        Log.d(TAG, "ClipboardAccessibilityService interrupted");
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "ClipboardAccessibilityService destroyed");
        ClipboardMonitorPlugin.notifyServiceConnected(false);
    }

    private void handleClipboardChange() {
        try {
            if (clipboardManager == null || !clipboardManager.hasPrimaryClip()) {
                return;
            }

            ClipData clipData = clipboardManager.getPrimaryClip();
            if (clipData == null || clipData.getItemCount() == 0) {
                return;
            }

            ClipData.Item item = clipData.getItemAt(0);
            CharSequence text = item.getText();
            
            if (text == null || text.length() == 0) {
                return;
            }

            String content = text.toString().trim();
            
            // Skip if same as last clip
            if (content.equals(lastClipContent)) {
                return;
            }
            
            lastClipContent = content;
            
            // Store the clip for later retrieval
            storeClip(content);
            
            // Notify the plugin
            ClipboardMonitorPlugin.notifyNewClip(content);
            
            Log.d(TAG, "Clipboard content captured: " + content.substring(0, Math.min(50, content.length())));
            
        } catch (Exception e) {
            Log.e(TAG, "Error handling clipboard change", e);
        }
    }

    private void storeClip(String content) {
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String existingClips = prefs.getString(CLIPS_KEY, "[]");
            
            JSONArray clipsArray = new JSONArray(existingClips);
            
            // Create new clip object
            JSONObject newClip = new JSONObject();
            newClip.put("id", String.valueOf(System.currentTimeMillis()));
            newClip.put("content", content);
            newClip.put("timestamp", System.currentTimeMillis());
            newClip.put("synced", false);
            
            // Check for duplicates
            for (int i = 0; i < clipsArray.length(); i++) {
                JSONObject clip = clipsArray.getJSONObject(i);
                if (clip.getString("content").equals(content)) {
                    // Remove duplicate
                    clipsArray.remove(i);
                    break;
                }
            }
            
            // Add new clip at the beginning
            JSONArray newArray = new JSONArray();
            newArray.put(newClip);
            for (int i = 0; i < Math.min(clipsArray.length(), MAX_PENDING_CLIPS - 1); i++) {
                newArray.put(clipsArray.get(i));
            }
            
            // Save
            prefs.edit().putString(CLIPS_KEY, newArray.toString()).apply();
            
        } catch (JSONException e) {
            Log.e(TAG, "Error storing clip", e);
        }
    }

    /**
     * Get all pending clips that haven't been synced to the app yet
     */
    public static String getPendingClips(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getString(CLIPS_KEY, "[]");
    }

    /**
     * Clear all pending clips after they've been synced
     */
    public static void clearPendingClips(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(CLIPS_KEY, "[]").apply();
    }

    /**
     * Mark clips as synced
     */
    public static void markClipsAsSynced(Context context, String[] ids) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String existingClips = prefs.getString(CLIPS_KEY, "[]");
            
            JSONArray clipsArray = new JSONArray(existingClips);
            
            for (int i = 0; i < clipsArray.length(); i++) {
                JSONObject clip = clipsArray.getJSONObject(i);
                String clipId = clip.getString("id");
                for (String id : ids) {
                    if (clipId.equals(id)) {
                        clip.put("synced", true);
                        break;
                    }
                }
            }
            
            prefs.edit().putString(CLIPS_KEY, clipsArray.toString()).apply();
            
        } catch (JSONException e) {
            Log.e(TAG, "Error marking clips as synced", e);
        }
    }
}
