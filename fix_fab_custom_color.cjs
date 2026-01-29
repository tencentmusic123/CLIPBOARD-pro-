const fs = require('fs');
const path = require('path');

console.log("Updating FAB (+) and border to #AA6C39...");

const homePath = path.join('ui', 'screens', 'HomeScreen.tsx');

if (fs.existsSync(homePath)) {
    let content = fs.readFileSync(homePath, 'utf8');
    
    // 1. Update the Icon Color (SVG)
    content = content.replace(
        /style=\{\{ color: isDarkTheme \? accentColor : '#D4AF37' \}\}/g, 
        "style={{ color: isDarkTheme ? accentColor : '#AA6C39' }}"
    );

    // 2. Update the Button Shadow (Glow)
    content = content.replace(
        /boxShadow: `0 0 20px \$\{isDarkTheme \? accentColor : '#D4AF37'\}66`,/g, 
        "boxShadow: `0 0 20px ${isDarkTheme ? accentColor : '#AA6C39'}66`,"
    );

    // 3. Update the Button Border
    content = content.replace(
        /border: `1px solid \$\{isDarkTheme \? accentColor : '#D4AF37'\}`,/g, 
        "border: `1px solid ${isDarkTheme ? accentColor : '#AA6C39'}`"
    );

    fs.writeFileSync(homePath, content);
    console.log("✔ HomeScreen.tsx updated: FAB and border are now #AA6C39 in Light Mode.");
} else {
    console.error("❌ HomeScreen.tsx not found.");
}
