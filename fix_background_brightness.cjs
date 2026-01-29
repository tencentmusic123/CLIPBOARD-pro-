const fs = require('fs');
const path = require('path');

console.log("Darkening Light Mode Background to Zinc-200...");

const filesToUpdate = [
    {
        path: 'App.tsx',
        // Replace bg-[#D1E5F4] (Light Blue) with bg-zinc-200 (Soft Gray)
        find: /bg-\[#D1E5F4\]/g,
        replace: 'bg-zinc-200'
    },
    {
        path: path.join('ui', 'screens', 'HomeScreen.tsx'),
        // Replace bg-blue-50 (Very bright white-blue) with bg-zinc-200
        find: /bg-blue-50/g,
        replace: 'bg-zinc-200'
    },
    {
        path: path.join('ui', 'screens', 'SettingsScreen.tsx'),
        // Standardize Settings screen to match (currently #F2F2F7, making it slightly darker for consistency)
        find: /bg-\[#F2F2F7\]/g,
        replace: 'bg-zinc-200'
    },
    {
        path: path.join('ui', 'screens', 'TagsScreen.tsx'),
        find: /bg-gray-50/g,
        replace: 'bg-zinc-200'
    },
    {
        path: path.join('ui', 'screens', 'TagDetailScreen.tsx'),
        find: /bg-gray-50/g,
        replace: 'bg-zinc-200'
    }
];

filesToUpdate.forEach(file => {
    if (fs.existsSync(file.path)) {
        let content = fs.readFileSync(file.path, 'utf8');
        const original = content;
        
        content = content.replace(file.find, file.replace);
        
        if (content !== original) {
            fs.writeFileSync(file.path, content);
            console.log(`✔ Updated ${path.basename(file.path)}`);
        } else {
            console.log(`- No changes needed for ${path.basename(file.path)}`);
        }
    } else {
        console.warn(`⚠ File not found: ${file.path}`);
    }
});

console.log("Done! Light mode is now less bright (Zinc-200).");
