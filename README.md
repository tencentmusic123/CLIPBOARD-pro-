<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Clipboard Max

A powerful clipboard manager for Android that monitors your system clipboard even in the background using Android's Accessibility Service.

## Features

- 📋 **Background Clipboard Monitoring** - Captures clipboard content even when the app is in the background
- 🔒 **Accessibility Service Integration** - Uses Android's Accessibility Service for reliable background monitoring
- 🏷️ **Smart Recognition** - Automatically detects and categorizes content (links, emails, phone numbers, etc.)
- 📝 **Notes Section** - Separate area for storing notes and longer content
- ⭐ **Favorites & Pins** - Mark important clips for quick access
- 🏷️ **Tags** - Organize clips with custom hashtags
- 🌓 **Dark/Light Theme** - Comfortable viewing in any lighting
- 💾 **Backup & Restore** - Export and import your clipboard history

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Build Android APK

**Prerequisites:** 
- Node.js
- Android Studio
- JDK 17+

1. Install dependencies: `npm install`
2. Build and sync: `npm run android:sync`
3. Open in Android Studio: `npm run android:open`
4. Build APK: **Build > Build Bundle(s) / APK(s) > Build APK(s)**

## Enable Background Clipboard Monitoring

After installing the APK on your Android device:

1. Open Clipboard Max
2. Go to **Settings > Background Monitoring**
3. Tap **Accessibility Service**
4. Enable **Clipboard Max** in the Accessibility settings
5. The app will now capture clipboard content even when in the background

## How It Works

The background monitoring feature uses Android's Accessibility Service to listen for clipboard changes system-wide. When you copy text from any app:

1. The Accessibility Service detects the clipboard change
2. The content is stored locally on your device
3. When you open Clipboard Max, the captured clips are synced to your clips list
4. Smart Recognition automatically categorizes the content

Your data stays on your device and is never shared.

## Documentation

- 📚 **[ANDROID_BUILD.md](ANDROID_BUILD.md)** - Detailed build instructions
- 📚 **[QUICK_START.md](QUICK_START.md)** - Quick reference guide
- 📚 **[SECURITY_SUMMARY.md](SECURITY_SUMMARY.md)** - Security analysis
