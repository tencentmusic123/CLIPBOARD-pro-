const fs = require('fs');
const path = require('path');

console.log("Fixing Icon Colors in GoldCard...");

const goldCardPath = path.join('ui', 'components', 'GoldCard.tsx');

if (fs.existsSync(goldCardPath)) {
    let content = fs.readFileSync(goldCardPath, 'utf8');
    
    // The badges currently use fill="white". 
    // We replace this with a conditional: fill={isDarkTheme ? "white" : "black"}
    // This ensures they are Black in Light Mode.
    const newContent = content.replace(/fill="white"/g, 'fill={isDarkTheme ? "white" : "black"}');
    
    // Only write if changes were made
    if (content !== newContent) {
        fs.writeFileSync(goldCardPath, newContent);
        console.log("✔ GoldCard.tsx updated: Badge icons are now Black in Light Mode.");
    } else {
        console.log("⚠ No 'fill=\"white\"' found in GoldCard.tsx. Maybe it was already fixed?");
    }
} else {
    console.error("❌ GoldCard.tsx not found at expected path.");
}
