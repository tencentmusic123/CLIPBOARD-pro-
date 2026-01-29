const fs = require('fs');
const path = require('path');

console.log("Darkening Card Elements (Border, Date, Type)...");

const goldCardPath = path.join('ui', 'components', 'GoldCard.tsx');

if (fs.existsSync(goldCardPath)) {
    let content = fs.readFileSync(goldCardPath, 'utf8');
    let originalContent = content;

    // 1. Darken the Border in Light Mode
    // Previously it might be 'border-zinc-300' or 'border-zinc-400/80'. We force it to 'border-neutral-400' (darker gray).
    // We look for the line defining borderColor and replace the light mode part.
    content = content.replace(
        /const borderColor = isDarkTheme \? ['"]border-white\/10['"] : ['"][^'"]+['"];/,
        "const borderColor = isDarkTheme ? 'border-white/10' : 'border-neutral-400';"
    );

    // 2. Darken the Date & Tags in Light Mode
    // Previously 'text-gray-600' or 'text-zinc-600'. We force it to 'text-zinc-700'.
    content = content.replace(
        /const tagColor = isDarkTheme \? ['"]text-zinc-500['"] : ['"][^'"]+['"];/,
        "const tagColor = isDarkTheme ? 'text-zinc-500' : 'text-zinc-700';"
    );

    // 3. Darken the Type Icons (Phone, Email, etc.)
    // These were hardcoded to 'text-zinc-400'. We make them dynamic: 'text-zinc-400' (Dark) vs 'text-zinc-700' (Light).
    // Match the specific div wrapper for the icon.
    content = content.replace(
        /className="text-zinc-400 shrink-0 ml-2 mt-1"/,
        "className={`shrink-0 ml-2 mt-1 ${isDarkTheme ? 'text-zinc-400' : 'text-zinc-700'}`}"
    );

    if (content !== originalContent) {
        fs.writeFileSync(goldCardPath, content);
        console.log("✔ GoldCard.tsx updated:");
        console.log("  - Border is now darker (Neutral-400)");
        console.log("  - Date/Tags are now darker (Zinc-700)");
        console.log("  - Type Icons are now darker (Zinc-700)");
    } else {
        console.log("⚠ No changes made. The file might already be updated or the patterns didn't match.");
    }
} else {
    console.error("❌ GoldCard.tsx not found.");
}
