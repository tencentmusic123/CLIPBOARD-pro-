const fs = require('fs');
const path = require('path');

console.log("Restoring Header Alignment (Equal Gaps, Visual Lift, Standard Icons)...");

const homePath = path.join('ui', 'screens', 'HomeScreen.tsx');

if (fs.existsSync(homePath)) {
    let content = fs.readFileSync(homePath, 'utf8');

    // We replace the entire DefaultHeader component with the "Perfect Alignment" version we built earlier.
    // This includes: justify-between, w-6 h-6 icons, text-2xl, and pb-1.
    
    // Regex to capture the existing DefaultHeader block
    const headerRegex = /const DefaultHeader = \(\{[\s\S]*?return \(\s*<div[\s\S]*?<\/div>\s*\);\s*};/;

    const correctHeaderCode = `const DefaultHeader = ({ accentColor, textColor, isSortMenuOpen, isFilterOpen, onMenuOpen, onSearchOpen, onSortToggle, onFilterToggle }: any) => {
    const { isDarkTheme } = useSettings();
    const buttonColor = isDarkTheme ? accentColor : '#D4AF37';
    
        return (
            <div className="flex items-center justify-between w-full px-4 h-full">
                {/* Left: Sidebar Icon (Standardized to w-6 h-6) */}
                <button onClick={onMenuOpen} className="p-2 hover:bg-white/5 rounded-full transition-colors flex-shrink-0" style={{ color: buttonColor }}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10" /></svg>
                </button>

                {/* Center: Title (text-2xl, pb-1 for visual lift, Gold color in light mode) */}
                <h2 className="text-2xl font-bold tracking-widest whitespace-nowrap mx-4 truncate pb-1" style={{ color: isDarkTheme ? accentColor : '#D4AF37' }}>
                    Clipboard Max
                </h2>

                {/* Right: Actions (Standardized Icons) */}
                <div className="flex items-center space-x-1 flex-shrink-0">
                    <button onClick={onSearchOpen} className="p-2 rounded-full hover:bg-white/5 transition-colors" style={{ color: buttonColor }}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </button>
                    <button onClick={onSortToggle} className="p-2 rounded-full hover:bg-white/5 transition-colors" style={{ color: isSortMenuOpen ? accentColor : buttonColor }}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                    </button>
                    <button onClick={onFilterToggle} className="p-2 rounded-full hover:bg-white/5 transition-colors" style={{ color: isFilterOpen ? accentColor : buttonColor }}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                    </button>
                </div>
            </div>
        );
};`;

    if (headerRegex.test(content)) {
        content = content.replace(headerRegex, correctHeaderCode);
        fs.writeFileSync(homePath, content);
        console.log("✔ Header alignment, icons, and text restored successfully!");
    } else {
        console.error("❌ Could not find DefaultHeader component to replace. Please check file structure.");
    }
} else {
    console.error("❌ HomeScreen.tsx not found.");
}
