# Quick Start Guide - Android Build

## 🚀 Quick Commands

### First Time Setup
```bash
# 1. Install dependencies
npm install

# 2. Initialize Android project
npm run android:init

# 3. Build and open in Android Studio
npm run android:run
```

### Daily Development
```bash
# Make code changes, then:
npm run android:sync    # Build and sync to Android
npm run android:open    # Open Android Studio
```

### Build APK
In Android Studio:
1. Wait for Gradle sync
2. Build > Build Bundle(s) / APK(s) > Build APK(s)
3. Find APK at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Install on Device
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## 📋 Prerequisites Checklist

- [ ] Node.js installed
- [ ] Android Studio installed
- [ ] JDK 17+ installed
- [ ] USB debugging enabled on device (for testing)

## 🔧 Troubleshooting

### "Command not found: cap"
```bash
npm install
```

### "Gradle sync failed"
- Update Android Studio
- Ensure JDK 17+ is selected
- Check internet connection

### "APK won't install"
```bash
# Reinstall over existing app
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### "Capacitor not found"
```bash
npm install @capacitor/cli
```

## 📚 Full Documentation

- **ANDROID_BUILD.md** - Detailed build instructions
- **ANDROID_CONVERSION_SUMMARY.md** - Technical overview
- **SECURITY_SUMMARY.md** - Security information

## 🎯 Testing Checklist

After installing APK, verify:
- [ ] App launches
- [ ] Navigation works
- [ ] Clipboard copy/paste works
- [ ] Back button works
- [ ] Data persists
- [ ] Theme toggle works

## 🏪 Play Store Release

```bash
# 1. Generate keystore
keytool -genkey -v -keystore clipboard-max.keystore \
  -alias clipboard-max -keyalg RSA -keysize 2048 -validity 10000

# 2. Update capacitor.config.ts with keystore path

# 3. In Android Studio: Build > Generate Signed Bundle / APK

# 4. Upload AAB to Play Console
```

## 💡 Tips

- Run `npm run build` before `android:sync` to ensure latest changes
- Use `npx cap sync` to sync without rebuilding
- Use `npx cap doctor` to check configuration
- Keep Android Studio and Capacitor updated

## 🆘 Get Help

- Capacitor Docs: https://capacitorjs.com/docs
- Android Studio: https://developer.android.com/studio
- Issues: Check ANDROID_BUILD.md troubleshooting section

---

**Version**: 1.0
**Last Updated**: 2026-01-25
