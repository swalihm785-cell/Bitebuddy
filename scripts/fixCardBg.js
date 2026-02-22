const fs = require('fs');
const files = [
  '/Applications/Projects/Bite Buddy/BiteBuddy/src/screens/create/CreatePostScreen.tsx',
  '/Applications/Projects/Bite Buddy/BiteBuddy/src/screens/create/EditPostScreen.tsx'
];

for(const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Replace sizeBox backend
  content = content.replace(
    /style=\{\[styles\.sizeBox, \{ backgroundColor: 'transparent', borderColor: glassBorder \}\]\}/g,
    "style={[styles.sizeBox, { backgroundColor: (Platform.OS === 'android' && !isDarkMode) ? '#FFFFFF' : 'transparent', borderColor: glassBorder, elevation: (Platform.OS === 'android' && !isDarkMode) ? 2 : 0 }]}"
  );

  // Replace timeBox backend
  content = content.replace(
    /style=\{\[styles\.timeBox, \{ backgroundColor: 'transparent', borderColor: glassBorder \}\]\}/g,
    "style={[styles.timeBox, { backgroundColor: (Platform.OS === 'android' && !isDarkMode) ? '#FFFFFF' : 'transparent', borderColor: glassBorder, elevation: (Platform.OS === 'android' && !isDarkMode) ? 2 : 0 }]}"
  );

  // Update styles for better alignment if needed. They are currently stretch, space-between. Let's make sure text is perfectly centered in timeBox
  content = content.replace(
    /timeBox: \{ flex: 1\.1, paddingVertical: 20, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'space-between' \},/,
    "timeBox: { flex: 1.1, paddingVertical: 20, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },"
  );

  fs.writeFileSync(file, content, 'utf8');
}
console.log('Fixed Group/Time card backgrounds and alignment.');
