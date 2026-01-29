const fs = require('fs');
const path = require('path');

console.log("Searching for Header using Multi-line Regex...");

const homePath = path.join('ui', 'screens', 'HomeScreen.tsx');

if (fs.existsSync(homePath)) {
    let content = fs.readFileSync(homePath, 'utf8');

    // This Regex finds:
    // 1. <h2 (start of tag)
    // 2. [^>]* (any attributes, even across newlines)
    // 3. > (end of opening tag)
    // 4. [\s\S]*? (any content, non-greedy)
    // 5. CLIPBOARD (MAX or PRO)
    // 6. [\s\S]*? (any trailing content)
    // 7. </h2> (closing tag)
    const regex = /<h2[^>]*>[\s\S]*?CLIPBOARD (MAX|PRO)[\s\S]*?<\/h2>/;

    if (regex.test(content)) {
        console.log("✔ Found the CLIPBOARD header block!");
        
        // The Clean, Correct Header Line
        const newHeader = `<h2 className="text-3xl font-bold tracking-widest uppercase whitespace-nowrap" style={{ color: isDarkTheme ? accentColor : '#D4AF37' }}>CLIPBOARD PRO</h2>`;
        
        content = content.replace(regex, newHeader);
        fs.writeFileSync(homePath, content);
        console.log("✔ HomeScreen.tsx successfully updated to 'CLIPBOARD PRO' (Gold in Light Mode).");
    } else {
        console.error("❌ Could not find 'CLIPBOARD MAX' or 'CLIPBOARD PRO' inside an <h2> tag.");
        
        // Debugging aid: check if "CLIPBOARD" exists at all
        if (content.includes("CLIPBOARD")) {
            console.log("⚠ 'CLIPBOARD' text exists in the file, but not inside the expected <h2> tag structure.");
        } else {
            console.log("⚠ 'CLIPBOARD' text was NOT found in the file at all. Check file integrity.");
        }
    }
} else {
    console.error("❌ HomeScreen.tsx not found.");
}
