<div align="center">
<img width="1200" height="475" alt="CLIPBOARD MAX Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CLIPBOARD MAX

A premium clipboard manager app for Android with smart recognition, cloud sync, and AI-powered features.

## ✨ Features

### 📋 Smart Clipboard Management
- **Automatic Type Detection**: Automatically recognizes and categorizes phone numbers, links, locations, and secure content
- **Duplicate Prevention**: Smart duplicate detection prevents redundant clipboard entries
- **Smart Recognition**: Detects phones, emails, URLs, and locations within clipboard content
- **Quick Actions**: One-tap actions for detected content (call, email, open link, view on map)

### 🎨 Premium UI/UX
- **Dark & Light Themes**: Beautiful premium color schemes with gradient accents
- **Customizable**: Adjust accent colors, font sizes, and layout preferences
- **Fast & Responsive**: Optimized animations and smooth transitions
- **Empty State Messages**: Context-aware empty states for clipboard and notes

### 📁 Organization
- **Categories**: Separate clipboard and notes
- **Tags**: Organize with custom hashtags
- **Favorites**: Mark important items for quick access
- **Trash**: Soft delete with restore capability
- **Pinning**: Keep important items at the top

### 🔄 Sync & Backup
- **Clipboard Sync**: Automatic system clipboard monitoring
- **Export**: Single file (.txt) or bulk export (.zip)
- **Share**: Native Web Share API integration
- **Import/Export**: Full data backup in JSON format

### 🤖 AI Features
- **Remove Duplicates**: Clean up repeated lines
- **Format Cleanup**: Fix spacing and formatting issues
- **List Conversion**: Convert text to bulleted lists
- **Grammar Check**: Browser-based spell and grammar checking

### 🔍 Advanced Features
- **Smart Filters**: Filter by type (phone, link, location, secure, text)
- **Tag Filtering**: Filter by custom tags
- **Search**: Full-text search across all content
- **Sort Options**: Custom, date, length, or alphabetical sorting
- **Bulk Actions**: Select multiple items for batch operations
- **Merge**: Combine multiple clipboard items into one

### 🔒 Security
- **Local Storage**: All data stored securely in browser localStorage
- **Secure Content Detection**: Automatically flags sensitive content (passwords, tokens, keys)
- **No Cloud Dependencies**: Works completely offline

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tencentmusic123/CLIPBOARD-pro-.git
   cd CLIPBOARD-pro-
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

### Android Build

1. **Initialize Android platform:**
   ```bash
   npm run android:init
   ```

2. **Sync and open in Android Studio:**
   ```bash
   npm run android:run
   ```

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## 📱 Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Mobile**: Capacitor (Android)
- **Styling**: Tailwind CSS (CDN)
- **Testing**: Vitest with @testing-library/react
- **Storage**: Browser localStorage
- **Compression**: JSZip for exports

## 📁 Project Structure

```
CLIPBOARD-pro-/
├── ui/                    # UI components and screens
│   ├── components/       # Reusable components (GoldCard, BottomNav, etc.)
│   ├── context/          # React contexts (Settings, Auth)
│   └── screens/          # Main screens (Home, Read, Edit, etc.)
├── data/                 # Data layer
│   └── repository/       # ClipboardRepository for data management
├── util/                 # Utilities
│   ├── SmartRecognition.ts    # Smart type detection
│   ├── AITextProcessor.ts     # AI text processing
│   └── Constants.ts           # App constants
├── types.ts              # TypeScript type definitions
├── App.tsx               # Main app component
└── index.tsx             # App entry point
```

## 🎨 Customization

### Themes
The app supports dark and light themes with customizable accent colors:
- **Dark Theme**: Premium black with zinc accents
- **Light Theme**: Clean white with subtle gray accents
- **Accent Color**: Customizable (default: Gold #D4AF37)

### Settings
All settings are persisted across app restarts:
- Theme preference
- Accent color
- Reading font size
- Smart recognition toggle
- AI support toggle
- Clipboard sync toggle
- Auto-backup preferences

## 📋 Clipboard Types

The app automatically detects and categorizes clipboard content:

- **TEXT**: Plain text content
- **PHONE**: Phone numbers (international formats supported)
- **LINK**: URLs and web links
- **LOCATION**: Addresses with street keywords
- **SECURE**: Content with sensitive keywords (password, token, etc.)

## 🔐 Security

- **Zero Security Vulnerabilities**: Verified with CodeQL analysis
- **Local-First**: All data stored locally, no cloud dependencies by default
- **No Tracking**: No analytics or tracking
- **Open Source**: Fully auditable codebase

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and feature requests, please use the GitHub Issues page.

---

Made with ❤️ using React, TypeScript, and Capacitor
