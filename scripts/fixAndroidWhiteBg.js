const fs = require('fs');
const files = [
  '/Applications/Projects/Bite Buddy/BiteBuddy/src/screens/create/CreatePostScreen.tsx',
  '/Applications/Projects/Bite Buddy/BiteBuddy/src/screens/create/EditPostScreen.tsx'
];

for(const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix the Section component to explicitly use #FFFFFF on Android Light mode
  content = content.replace(
    /style=\{\[styles\.section, \{ borderColor: isDarkMode \? 'rgba\(255,255,255,0\.1\)' : 'rgba\(0,0,0,0\.05\)', shadowOpacity: isDarkMode \? 0\.2 : 0\.05 \}\]\}/,
    "style={[styles.section, { borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', shadowOpacity: isDarkMode ? 0.2 : 0.05, backgroundColor: (Platform.OS === 'android' && !isDarkMode) ? '#FFFFFF' : undefined }]}"
  );

  fs.writeFileSync(file, content, 'utf8');
}
console.log("Applied Android White Background to Section!");
