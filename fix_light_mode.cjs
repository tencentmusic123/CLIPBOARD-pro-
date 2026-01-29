const fs = require('fs');
const path = require('path');

console.log("Applying Comprehensive Light Mode Fixes...");

// --- 1. Fix index.html (Remove global white text) ---
const indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>CLIPBOARD MAX</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            colors: { gold: '#D4AF37', midnight: '#000000', 'gold-dim': '#B4941F' },
            fontFamily: { sans: ['Inter', 'sans-serif'], mono: ['Fira Code', 'monospace'], blanka: ['Blanka', 'sans-serif'] },
            animation: { 'fade-in': 'fadeIn 0.4s ease-out', 'fade-in-up': 'fadeInUp 0.5s ease-out forwards', 'fade-in-down': 'fadeInDown 0.4s ease-out forwards', 'scale-in': 'scaleIn 0.3s ease-out forwards' },
            keyframes: {
              fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
              fadeInUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
              fadeInDown: { '0%': { opacity: '0', transform: 'translateY(-10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
              scaleIn: { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } }
            }
          }
        }
      }
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code&display=swap" rel="stylesheet">
    <link href="https://fonts.cdnfonts.com/css/blanka" rel="stylesheet">
    <style>
      :root { --scrollbar-bg: #ffffff; --scrollbar-thumb: #cccccc; }
      :root.dark { --scrollbar-bg: #000000; --scrollbar-thumb: #333333; }
      body { margin: 0; padding: 0; } /* Removed color: #ffffff */
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: var(--scrollbar-bg); }
      ::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 3px; }
      ::-webkit-scrollbar-thumb:hover { background: #D4AF37; }
    </style>
  </head>
  <body><div id="root"></div></body>
  <script type="module" src="/index.tsx"></script>
</html>`;
fs.writeFileSync('index.html', indexHtmlContent);
console.log("✔ index.html cleaned");

// --- 2. Fix GoldCard.tsx (Darker borders/text in Light Mode) ---
const goldCardPath = path.join('ui', 'components', 'GoldCard.tsx');
let goldCard = fs.readFileSync(goldCardPath, 'utf8');

// Replace border color logic to be darker in light mode
goldCard = goldCard.replace(
    "const borderColor = isDarkTheme ? 'border-white/5' : 'border-zinc-400/80';",
    "const borderColor = isDarkTheme ? 'border-white/10' : 'border-zinc-300';"
);
// Replace tag text color to be darker in light mode
goldCard = goldCard.replace(
    "const tagColor = isDarkTheme ? 'text-zinc-500' : 'text-zinc-600';",
    "const tagColor = isDarkTheme ? 'text-zinc-500' : 'text-gray-600';"
);

fs.writeFileSync(goldCardPath, goldCard);
console.log("✔ GoldCard.tsx updated (Darker borders & Date)");

// --- 3. Fix Empty States (HomeScreen, FavoriteScreen, TrashScreen) ---
// We replace the opacity-40 div with one that has explicit colors
const emptyStateRegex = /className="flex flex-col items-center justify-center mt-32 opacity-40"/g;
const newEmptyState = 'className={`flex flex-col items-center justify-center mt-32 ${isDarkTheme ? "text-zinc-600" : "text-gray-400"}`}';

const screens = [
    path.join('ui', 'screens', 'HomeScreen.tsx'),
    path.join('ui', 'screens', 'FavoriteScreen.tsx'),
    path.join('ui', 'screens', 'TrashScreen.tsx')
];

screens.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(emptyStateRegex, newEmptyState);
        fs.writeFileSync(file, content);
        console.log(`✔ ${path.basename(file)} updated (Visible empty state)`);
    }
});

console.log("Done! Please refresh your browser.");
