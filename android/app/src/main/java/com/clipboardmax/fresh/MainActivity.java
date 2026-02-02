package com.clipboardmax.fresh;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register the ClipboardMonitor plugin
        registerPlugin(ClipboardMonitorPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
