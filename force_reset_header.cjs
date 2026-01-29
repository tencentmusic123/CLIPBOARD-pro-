const fs = require('fs');
const path = require('path');

console.log("Force-resetting 'CLIPBOARD MAX' header to #D4AF37...");

const homePath = path.join('ui', 'screens', 'HomeScreen.tsx');

if (fs.existsSync(homePath)) {
    let content = fs.readFileSync(homePath, 'utf8');
    
    // This looks for the H2 tag containing CLIPBOARD MAX and fixes its color style
    const newContent = content.replace(
        /<h2 className="text-3xl font-bold tracking-widest uppercase whitespace-nowrap" style=\{\{ color: (isDarkTheme \? accentColor : '[^']+'|'#[A-Fa-f0-9]{6}') \}\}>CLIPBOARD MAX<\/h2>/,
        `<h2 className="text-3xl font-bold tracking-widest uppercase whitespace-nowrap" style={{ color: isDarkTheme ? accentColor : '#D4AF37' }}>CLIPBOARD MAX</h2>`
    );

    if (content !== newContent) {
        fs.writeFileSync(homePath, newContent);
        console.log("✔ HomeScreen.tsx updated: Header successfully reset to #D4AF37.");
    } else {
        // Fallback: If the above regex failed, try a simpler text replacement for that specific line
        console.log("Trying secondary match pattern...");
        const fallbackContent = content.replace(
            /color: isDarkTheme \? accentColor : '#[A-Fa-f0-9]{6}' \}\}>CLIPBOARD MAX/g,
            "color: isDarkTheme ? accentColor : '#D4AF37' }}>CLIPBOARD MAX"
        );
        
        if (content !== fallbackContent) {
            fs.writeFileSync(homePath, fallbackContent);
            console.log("✔ HomeScreen.tsx updated via fallback pattern.");
        } else {
            console.log("❌ Could not find the header line. Please check the file content.");
        }
    }
} else {
    console.error("❌ HomeScreen.tsx not found.");
}
