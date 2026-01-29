const fs = require('fs');
const path = require('path');

console.log("Updating FAB (+) and border to #7D650E...");

const homePath = path.join('ui', 'screens', 'HomeScreen.tsx');

if (fs.existsSync(homePath)) {
    let content = fs.readFileSync(homePath, 'utf8');
    
    // 1. Update the Icon Color (SVG)
    content = content.replace(
        /style=\{\{ color: isDarkTheme \? accentColor : '#[A-Fa-f0-9]{6}' \}\}/g, 
        "style={{ color: isDarkTheme ? accentColor : '#7D650E' }}"
    );

    // 2. Update the Button Shadow (Glow)
    content = content.replace(
        /boxShadow: `0 0 20px \$\{isDarkTheme \? accentColor : '#[A-Fa-f0-9]{6}'\}66`,/g, 
        "boxShadow: `0 0 20px ${isDarkTheme ? accentColor : '#7D650E'}66`,"
    );

    // 3. Update the Button Border
    content = content.replace(
        /border: `1px solid \$\{isDarkTheme \? accentColor : '#[A-Fa-f0-9]{6}'\}`,/g, 
        "border: `1px solid ${isDarkTheme ? accentColor : '#7D650E'}`"
    );

    fs.writeFileSync(homePath, content);
    console.log("✔ HomeScreen.tsx updated: FAB and border are now #7D650E in Light Mode.");
} else {
    console.error("❌ HomeScreen.tsx not found.");
}
