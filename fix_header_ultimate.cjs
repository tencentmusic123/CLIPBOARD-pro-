const fs = require('fs');
const path = require('path');

console.log("Searching for 'CLIPBOARD' line to replace...");

const homePath = path.join('ui', 'screens', 'HomeScreen.tsx');

if (fs.existsSync(homePath)) {
    const content = fs.readFileSync(homePath, 'utf8');
    const lines = content.split('\n');
    let updated = false;

    const newLines = lines.map(line => {
        // Find the line with "CLIPBOARD" that is part of the UI (not an import or comment)
        if (line.includes('CLIPBOARD') && !line.includes('import') && !line.trim().startsWith('//')) {
            console.log("Found target line:", line.trim());
            updated = true;
            // Force replace the entire line with the correct PRO version and Gold color
            return `                    <h2 className="text-3xl font-bold tracking-widest uppercase whitespace-nowrap" style={{ color: isDarkTheme ? accentColor : '#D4AF37' }}>CLIPBOARD PRO</h2>`;
        }
        return line;
    });

    if (updated) {
        fs.writeFileSync(homePath, newLines.join('\n'));
        console.log("✔ HomeScreen.tsx updated: Header set to 'CLIPBOARD PRO' with Gold color.");
    } else {
        console.error("❌ Could not find any line containing 'CLIPBOARD' to replace.");
    }
} else {
    console.error("❌ HomeScreen.tsx not found.");
}
