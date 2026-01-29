const fs = require('fs');
const path = require('path');

console.log("Updating Header to 'CLIPBOARD PRO' with Gold color...");

const homePath = path.join('ui', 'screens', 'HomeScreen.tsx');

if (fs.existsSync(homePath)) {
    let content = fs.readFileSync(homePath, 'utf8');
    
    // We search for the <h2> tag by its unique class names instead of its text content.
    // This regex matches the entire line regardless of what text is inside (MAX or PRO).
    const regex = /<h2 className="text-3xl font-bold tracking-widest uppercase whitespace-nowrap" style=\{\{ color: .*? \}\}>.*?<\/h2>/;
    
    // The new line: Forces text to "CLIPBOARD PRO" and color to #D4AF37 in Light Mode
    const newLine = `<h2 className="text-3xl font-bold tracking-widest uppercase whitespace-nowrap" style={{ color: isDarkTheme ? accentColor : '#D4AF37' }}>CLIPBOARD PRO</h2>`;

    if (regex.test(content)) {
        const newContent = content.replace(regex, newLine);
        fs.writeFileSync(homePath, newContent);
        console.log("✔ HomeScreen.tsx updated: Header is now 'CLIPBOARD PRO' and Gold (#D4AF37).");
    } else {
        console.error("❌ Could not find the Header <h2> tag. The class names might have changed.");
    }
} else {
    console.error("❌ HomeScreen.tsx not found.");
}
