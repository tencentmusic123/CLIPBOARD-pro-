const fs = require('fs');
const path = require('path');

console.log("Resetting 'CLIPBOARD MAX' header to #D4AF37...");

const homePath = path.join('ui', 'screens', 'HomeScreen.tsx');

if (fs.existsSync(homePath)) {
    let content = fs.readFileSync(homePath, 'utf8');
    
    // This targets the h2 tag inside the DefaultHeader component
    // It ensures the color is explicitly #D4AF37 when isDarkTheme is false
    const newContent = content.replace(
        /<h2 className="text-3xl font-bold tracking-widest uppercase whitespace-nowrap" style=\{\{ color: isDarkTheme \? accentColor : '.*' \}\}>CLIPBOARD MAX<\/h2>/,
        `<h2 className="text-3xl font-bold tracking-widest uppercase whitespace-nowrap" style={{ color: isDarkTheme ? accentColor : '#D4AF37' }}>CLIPBOARD MAX</h2>`
    );

    if (content !== newContent) {
        fs.writeFileSync(homePath, newContent);
        console.log("✔ HomeScreen.tsx updated: Header reset to #D4AF37.");
    } else {
        console.log("⚠ Header was already #D4AF37 or the pattern did not match.");
    }
} else {
    console.error("❌ HomeScreen.tsx not found.");
}
