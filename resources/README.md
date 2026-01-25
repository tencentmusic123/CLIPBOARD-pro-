# App Icon Resources

## Current Status
- `icon.svg` - Placeholder SVG icon (1024x1024) with gold CLIPBOARD MAX branding

## To Generate PNG Icon
You need to convert the SVG to PNG format for Capacitor to use it.

### Option 1: Using ImageMagick (recommended)
```bash
convert icon.svg -resize 1024x1024 icon.png
```

### Option 2: Using Online Tool
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `icon.svg`
3. Download as `icon.png` (1024x1024)
4. Place in this `resources/` folder

### Option 3: Using Inkscape
```bash
inkscape icon.svg --export-type=png --export-filename=icon.png -w 1024 -h 1024
```

## After Creating icon.png
Once you have `icon.png`, Capacitor will automatically generate all required sizes when you run:
```bash
npm run android:init
```

## Icon Design
- Black background (#000000)
- Gold clipboard (#D4AF37)
- "MAX" text at bottom
- Matches CLIPBOARD MAX branding theme
