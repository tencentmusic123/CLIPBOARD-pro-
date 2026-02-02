package com.clipboardmax.fresh;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Capacitor plugin for clipboard monitoring functionality.
 * This plugin bridges the native Accessibility Service with the web app.
 */
@CapacitorPlugin(name = "ClipboardMonitor")
public class ClipboardMonitorPlugin extends Plugin {

    private static final String TAG = "ClipboardMonitorPlugin";
    private static ClipboardMonitorPlugin instance;
    private static boolean isServiceConnected = false;

    @Override
    public void load() {
        instance = this;
        Log.d(TAG, "ClipboardMonitorPlugin loaded");
    }

    /**
     * Check if Accessibility Service is enabled
     */
    @PluginMethod
    public void isAccessibilityEnabled(PluginCall call) {
        boolean enabled = isAccessibilityServiceEnabled(getContext());
        JSObject result = new JSObject();
        result.put("enabled", enabled);
        result.put("serviceConnected", isServiceConnected);
        call.resolve(result);
    }

    /**
     * Open Accessibility Settings so user can enable the service
     */
    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "Error opening accessibility settings", e);
            call.reject("Failed to open accessibility settings: " + e.getMessage());
        }
    }

    /**
     * Get pending clips captured by the background service
     */
    @PluginMethod
    public void getPendingClips(PluginCall call) {
        try {
            String clipsJson = ClipboardAccessibilityService.getPendingClips(getContext());
            JSObject result = new JSObject();
            result.put("clips", new JSONArray(clipsJson));
            call.resolve(result);
        } catch (JSONException e) {
            Log.e(TAG, "Error getting pending clips", e);
            call.reject("Failed to get pending clips: " + e.getMessage());
        }
    }

    /**
     * Clear all pending clips
     */
    @PluginMethod
    public void clearPendingClips(PluginCall call) {
        ClipboardAccessibilityService.clearPendingClips(getContext());
        call.resolve();
    }

    /**
     * Mark specific clips as synced
     */
    @PluginMethod
    public void markClipsAsSynced(PluginCall call) {
        try {
            JSONArray idsArray = call.getArray("ids");
            if (idsArray == null) {
                call.reject("ids parameter is required");
                return;
            }
            
            String[] ids = new String[idsArray.length()];
            for (int i = 0; i < idsArray.length(); i++) {
                ids[i] = idsArray.getString(i);
            }
            
            ClipboardAccessibilityService.markClipsAsSynced(getContext(), ids);
            call.resolve();
        } catch (JSONException e) {
            Log.e(TAG, "Error marking clips as synced", e);
            call.reject("Failed to mark clips as synced: " + e.getMessage());
        }
    }

    /**
     * Check if the accessibility service is enabled in system settings
     */
    private boolean isAccessibilityServiceEnabled(Context context) {
        ComponentName expectedComponentName = new ComponentName(
            context, 
            ClipboardAccessibilityService.class
        );

        String enabledServicesSetting = Settings.Secure.getString(
            context.getContentResolver(),
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        );

        if (enabledServicesSetting == null) {
            return false;
        }

        TextUtils.SimpleStringSplitter colonSplitter = new TextUtils.SimpleStringSplitter(':');
        colonSplitter.setString(enabledServicesSetting);

        while (colonSplitter.hasNext()) {
            String componentNameString = colonSplitter.next();
            ComponentName enabledService = ComponentName.unflattenFromString(componentNameString);
            if (enabledService != null && enabledService.equals(expectedComponentName)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Called by the AccessibilityService when it connects or disconnects
     */
    public static void notifyServiceConnected(boolean connected) {
        isServiceConnected = connected;
        if (instance != null) {
            JSObject data = new JSObject();
            data.put("connected", connected);
            instance.notifyListeners("serviceStatusChanged", data);
        }
    }

    /**
     * Called by the AccessibilityService when new clip is captured
     */
    public static void notifyNewClip(String content) {
        if (instance != null) {
            JSObject data = new JSObject();
            data.put("content", content);
            data.put("timestamp", System.currentTimeMillis());
            data.put("id", String.valueOf(System.currentTimeMillis()));
            instance.notifyListeners("clipboardChanged", data);
        }
    }
}
