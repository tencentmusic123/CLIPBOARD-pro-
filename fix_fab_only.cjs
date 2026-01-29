const fs = require('fs');
const path = require('path');

console.log("Fixing only the FAB (+) icon and border color to #504211...");

const homePath = path.join('ui', 'screens', 'HomeScreen.tsx');

if (fs.existsSync(homePath)) {
    let content = fs.readFileSync(homePath, 'utf8');
    
    // 1. Target the FAB icon color specifically inside the FAB button container
    // This looks for the style attribute of the SVG icon inside the Floating Action Button section
    content = content.replace(
        /<svg className="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" style=\{\{ color: (accentColor|'#[A-Fa-f0-9]{6}') \}\}/,
        `<svg className="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" style={{ color: isDarkTheme ? accentColor : '#504211' }}`
    );

    // 2. Target the FAB button container's shadow/glow
    content = content.replace(
        /boxShadow: `0 0 20px \$\{(accentColor|isDarkTheme \? accentColor : '#[A-Fa-f0-9]{6}')\}66`,/g,
        "boxShadow: `0 0 20px ${isDarkTheme ? accentColor : '#504211'}66`,"
    );

    // 3. Target the FAB button container's border
    content = content.replace(
        /border: `1px solid \$\{(accentColor|isDarkTheme \? accentColor : '#[A-Fa-f0-9]{6}')\}`/g,
        "border: `1px solid ${isDarkTheme ? accentColor : '#504211'}`"
    );

    fs.writeFileSync(homePath, content);
    console.log("✔ HomeScreen.tsx updated: FAB (+) is now #504211 in Light Mode. Header remains unchanged.");
} else {
    console.error("❌ HomeScreen.tsx not found.");
}
