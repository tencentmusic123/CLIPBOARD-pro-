# Building Android APK

## Prerequisites
- Node.js installed
- Android Studio installed
- JDK 17+ installed

## Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Web App
```bash
npm run build
```

### 3. Initialize Android Project (First Time Only)
```bash
npm run android:init
```

### 4. Sync Web Code to Android
```bash
npm run android:sync
```

### 5. Open in Android Studio
```bash
npm run android:open
```

### 6. Build APK in Android Studio
1. Wait for Gradle sync to complete
2. Click **Build > Build Bundle(s) / APK(s) > Build APK(s)**
3. APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

### 7. Install on Device
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## For Release (Play Store)

### 1. Generate Keystore
```bash
keytool -genkey -v -keystore clipboard-max.keystore -alias clipboard-max -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Update capacitor.config.ts
```typescript
android: {
  buildOptions: {
    keystorePath: './clipboard-max.keystore',
    keystoreAlias: 'clipboard-max'
  }
}
```

### 3. Build Release APK
In Android Studio: **Build > Generate Signed Bundle / APK**

### 4. Upload to Play Store
- Go to Google Play Console
- Create new app
- Upload signed APK
- Fill in store listing, screenshots, description
- Submit for review

## Troubleshooting

### Gradle Sync Issues
If Gradle sync fails:
1. Open Android Studio Settings
2. Go to Build, Execution, Deployment > Build Tools > Gradle
3. Ensure JDK 17+ is selected
4. Click "Sync Project with Gradle Files"

### Permission Errors
If you get permission errors on clipboard:
- Android clipboard permissions are handled automatically by Capacitor
- No manual AndroidManifest.xml changes needed

### Build Errors
If build fails:
1. Clean the project: `Build > Clean Project`
2. Rebuild: `Build > Rebuild Project`
3. Invalidate caches: `File > Invalidate Caches / Restart`

## Testing Checklist

After building the APK, test on your Android device:
- ✅ App launches
- ✅ All screens navigate correctly
- ✅ Clipboard copy/paste works
- ✅ Smart detection works
- ✅ AI features work (if API key configured)
- ✅ Import/export works
- ✅ Dark/light theme works
- ✅ Swipe gestures work
- ✅ Back button works
- ✅ No screen jumping when copying

## Notes

### localStorage Support
- Capacitor apps fully support localStorage
- No changes needed to ClipboardRepository
- Data persists on device storage

### Performance
- Tested on Galaxy Tab A (2GB RAM)
- App should run smoothly
- If performance issues arise, optimizations can be added

### Limitations
- No automatic clipboard monitoring (Android security)
- Users must manually paste into app
- This is intentional (manual paste workspace design)

## Quick Commands

```bash
# Full rebuild and sync
npm run android:run

# Sync changes without rebuild
npx cap sync android

# Open Android Studio
npx cap open android

# Check Capacitor status
npx cap doctor
```
