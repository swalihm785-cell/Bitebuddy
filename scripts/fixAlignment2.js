const fs = require('fs');

const files = [
    '/Applications/Projects/Bite Buddy/BiteBuddy/src/screens/create/CreatePostScreen.tsx',
    '/Applications/Projects/Bite Buddy/BiteBuddy/src/screens/create/EditPostScreen.tsx'
];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');

    // Strip hardcoded container #F8FAFC which looks too flat in Light mode
    content = content.replace(
        /style=\{\[styles\.container, \{ backgroundColor: isDarkMode \? '#0F172A' : '#F8FAFC' \}\]\}/g,
        "style={[styles.container, { backgroundColor: Colors.background }]}"
    );

    // Fix the TimeBox alignment directly using StyleSheet so it matches SizeBox height perfectly
    content = content.replace(
        /timeBox: \{ flex: 1\.1, paddingVertical: 20, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' \},/,
        "timeBox: { flex: 1.1, paddingVertical: 20, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'space-between' },"
    );

    // Thicken the divider a bit inside the buttons for contrast in light mode
    content = content.replace(
        /const iconBg = isDarkMode \? 'rgba\(255,255,255,0\.1\)' : 'rgba\(0,0,0,0\.05\)';/,
        "const iconBg = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';"
    );

    fs.writeFileSync(file, content, 'utf8');
}
console.log("Secondary styling run completed.");
