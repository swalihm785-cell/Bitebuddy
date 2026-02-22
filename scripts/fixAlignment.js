const fs = require('fs');
const files = [
  '/Applications/Projects/Bite Buddy/BiteBuddy/src/screens/create/CreatePostScreen.tsx',
  '/Applications/Projects/Bite Buddy/BiteBuddy/src/screens/create/EditPostScreen.tsx'
];

for(const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix white backgrounds across android light theme
  content = content.replace(/backgroundColor: '#F8FAFC'/g, "backgroundColor: Colors.background");
  
  // Fix inputBg variable definition for dark/light modes
  content = content.replace(
    /const inputBg = isDarkMode \? 'rgba\(255,255,255,0\.06\)' : 'rgba\(0,0,0,0\.03\)';/,
    "const inputBg = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.02)';"
  );
  content = content.replace(
    /const glassBorder = isDarkMode \? 'rgba\(255,255,255,0\.1\)' : 'rgba\(0,0,0,0\.06\)';/,
    "const glassBorder = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)';"
  );

  // Fix Group Max vs Scheduled Date alignment + sizing issues
  content = content.replace(
    /<View style=\{styles\.sizeRow\}>/,
    '<View style={[styles.sizeRow, { alignItems: "stretch" } ]}>'
  );
  
  // Adjust inner sizeBox padding to align correctly with timeBox
  content = content.replace(
    /sizeBox: \{ flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center' \},/,
    "sizeBox: { flex: 0.9, paddingVertical: 20, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'space-between' },"
  );
  
  content = content.replace(
    /timeBox: \{ flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center' \},/,
    "timeBox: { flex: 1.1, paddingVertical: 20, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },"
  );

  fs.writeFileSync(file, content, 'utf8');
}
