const fs = require('fs');
const path = require('path');

console.log("Fixing Floating Action Button (+) color in Light Mode...");

const homePath = path.join('ui', 'screens', 'HomeScreen.tsx');

if (fs.existsSync(homePath)) {
    let content = fs.readFileSync(homePath, 'utf8');
    
    // 1. Fix the Icon Color (SVG)
    // We target the specific SVG inside the FAB to force Gold in Light Mode
    content = content.replace(
        'style={{ color: accentColor }}', 
        "style={{ color: isDarkTheme ? accentColor : '#D4AF37' }}"
    );

    // 2. Fix the Button Shadow (Glow)
    content = content.replace(
        'boxShadow: `0 0 20px ${accentColor}66`,', 
        "boxShadow: `0 0 20px ${isDarkTheme ? accentColor : '#D4AF37'}66`,"
    );

    // 3. Fix the Button Border
    content = content.replace(
        'border: `1px solid ${accentColor}`', 
        "border: `1px solid ${isDarkTheme ? accentColor : '#D4AF37'}`"
    );

    fs.writeFileSync(homePath, content);
    console.log("✔ HomeScreen.tsx updated: FAB is now Gold in Light Mode.");
} else {
    console.error("❌ HomeScreen.tsx not found.");
}
