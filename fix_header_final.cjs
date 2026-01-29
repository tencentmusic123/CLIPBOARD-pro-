const fs = require('fs');
const path = require('path');

console.log("Forcing Header update to 'CLIPBOARD PRO'...");

const homePath = path.join('ui', 'screens', 'HomeScreen.tsx');

if (fs.existsSync(homePath)) {
    let content = fs.readFileSync(homePath, 'utf8');
    const lines = content.split('\n');
    let updated = false;

    // We search for the line containing the unique Tailwind classes used for the header
    const uniqueClass = 'text-3xl font-bold tracking-widest uppercase whitespace-nowrap';

    const newLines = lines.map(line => {
        if (line.includes(uniqueClass)) {
            console.log("✔ Found the header line. Replacing it...");
            updated = true;
            // Return the exact correct line
            return `                    <h2 className="${uniqueClass}" style={{ color: isDarkTheme ? accentColor : '#D4AF37' }}>CLIPBOARD PRO</h2>`;
        }
        return line;
    });

    if (updated) {
        fs.writeFileSync(homePath, newLines.join('\n'));
        console.log("SUCCESS: HomeScreen.tsx updated to 'CLIPBOARD PRO' with Gold color.");
    } else {
        console.error("❌ Still could not find the header line.");
        console.log("DEBUG: Try searching the file manually for 'tracking-widest'.");
    }
} else {
    console.error("❌ HomeScreen.tsx not found.");
}
