const fs = require('fs');
const path = require('path');

console.log("Locating and fixing 'CLIPBOARD MAX' header...");

const homePath = path.join('ui', 'screens', 'HomeScreen.tsx');

if (fs.existsSync(homePath)) {
    const fileContent = fs.readFileSync(homePath, 'utf8');
    const lines = fileContent.split('\n');
    let updated = false;

    // We look for the specific line containing the title text
    const newLines = lines.map(line => {
        if (line.includes('>CLIPBOARD MAX</h2>')) {
            console.log("Found target line:", line.trim());
            updated = true;
            // Return the corrected line exactly as it should be
            return `                    <h2 className="text-3xl font-bold tracking-widest uppercase whitespace-nowrap" style={{ color: isDarkTheme ? accentColor : '#D4AF37' }}>CLIPBOARD MAX</h2>`;
        }
        return line;
    });

    if (updated) {
        fs.writeFileSync(homePath, newLines.join('\n'));
        console.log("✔ HomeScreen.tsx updated: Header is now definitely #D4AF37 (Gold).");
    } else {
        console.error("❌ Still could not find the line containing '>CLIPBOARD MAX</h2>'.");
        console.log("Please verify if the text 'CLIPBOARD MAX' exists in ui/screens/HomeScreen.tsx");
    }
} else {
    console.error("❌ HomeScreen.tsx not found.");
}
