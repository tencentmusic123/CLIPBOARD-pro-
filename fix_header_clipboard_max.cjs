const fs = require('fs');
const path = require('path');

console.log("Updating Header to 'Clipboard Max' (Mixed Case)...");

const homePath = path.join('ui', 'screens', 'HomeScreen.tsx');

if (fs.existsSync(homePath)) {
    let content = fs.readFileSync(homePath, 'utf8');
    const lines = content.split('\n');
    let updated = false;

    // Search for the header line using unique Tailwind classes (ignoring 'uppercase' in search to be safe)
    // We look for 'text-3xl' and 'tracking-widest' which define the main header.
    const newLines = lines.map(line => {
        if (line.includes('text-3xl') && line.includes('tracking-widest')) {
            console.log("✔ Found header line:", line.trim());
            updated = true;
            
            // REPLACEMENT:
            // 1. Text is "Clipboard Max"
            // 2. Class 'uppercase' is REMOVED so it respects the casing
            // 3. Color is #D4AF37 in Light Mode
            return `                    <h2 className="text-3xl font-bold tracking-widest whitespace-nowrap" style={{ color: isDarkTheme ? accentColor : '#D4AF37' }}>Clipboard Max</h2>`;
        }
        return line;
    });

    if (updated) {
        fs.writeFileSync(homePath, newLines.join('\n'));
        console.log("✔ HomeScreen.tsx updated: Header is now 'Clipboard Max'.");
    } else {
        console.error("❌ Could not find the header line using class matching.");
        console.log("Debug: Dumping lines with 'text-3xl'...");
        lines.forEach(l => {
            if (l.includes('text-3xl')) console.log("   Found:", l.trim());
        });
    }
} else {
    console.error("❌ HomeScreen.tsx not found.");
}
