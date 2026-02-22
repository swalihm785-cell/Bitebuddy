import fs from 'fs';
import path from 'path';

const targetPath = '/Applications/Projects/Bite Buddy/BiteBuddy/src/screens/create/EditPostScreen.tsx';
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Update the Section component to use GlassCard with better spacing and icon alignment
content = content.replace(
    /const Section = \(\{ title, subtitle, children, icon, colors \}: .*? => \([\s\S]*?\n\);/,
    `const Section = ({ title, subtitle, children, icon, colors, isDarkMode }: { title: string, subtitle?: string, children: React.ReactNode, icon?: string, colors: any, isDarkMode?: boolean }) => (
    <GlassCard
        effect="regular"
        colorScheme={isDarkMode ? 'dark' : 'light'}
        style={styles.section}
    >
        <View style={styles.sectionHeader}>
            {icon && (
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name={icon as any} size={20} color={colors.primary} />
                </View>
            )}
            <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
                {subtitle && <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
            </View>
        </View>
        <View style={styles.sectionContent}>
            {children}
        </View>
    </GlassCard>
);`
);

// 2. Add isDarkMode prop to all Section usages
content = content.replace(/<Section title="(.*?)" subtitle="(.*?)" icon="(.*?)" colors=\{Colors\}>/g, '<Section title="$1" subtitle="$2" icon="$3" colors={Colors} isDarkMode={isDarkMode}>');

// 3. Update styles to improve spacing, border radius, and inputs
const oldStylesRaw = content.match(/const styles = StyleSheet\.create\({([\s\S]*?)\}\);/);
if (oldStylesRaw && oldStylesRaw[1]) {
    let stylesContent = oldStylesRaw[1];

    // Update container and scroll content
    stylesContent = stylesContent.replace(/scrollContent: \{ padding: 20 \},/, 'scrollContent: { padding: 16, paddingBottom: 120 },');

    // Update section styling for the glass cards
    stylesContent = stylesContent.replace(/section: \{ marginBottom: 32 \},/, 'section: { marginBottom: 20, borderWidth: 1, borderColor: \'rgba(255,255,255,0.1)\' },');

    // Update Section header and content spacing
    stylesContent = stylesContent.replace(/sectionHeader: \{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 \},/, `sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    iconContainer: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    sectionContent: { gap: 12 },`);

    // Update Input styling to be glass-friendly
    stylesContent = stylesContent.replace(/input: \{ height: 54, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: 15 \},/, 'input: { height: 54, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: 15, backgroundColor: \'rgba(255,255,255,0.05)\' },');
    stylesContent = stylesContent.replace(/textArea: \\{ borderRadius: 16, borderWidth: 1, padding: 16, fontSize: 15, textAlignVertical: 'top', minHeight: 100 \\},/, 'textArea: { borderRadius: 16, borderWidth: 1, padding: 16, fontSize: 15, textAlignVertical: \'top\', minHeight: 100, backgroundColor: \'rgba(255,255,255,0.05)\' },');

    // Make chips slightly more glass-like
    stylesContent = stylesContent.replace(/chip: \\{ paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1 \\},/, 'chip: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1, backgroundColor: \'rgba(255,255,255,0.05)\' },');
    stylesContent = stylesContent.replace(/budgetChip: \\{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, minWidth: '30%', alignItems: 'center' \\},/, 'budgetChip: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, minWidth: \'30%\', alignItems: \'center\', backgroundColor: \'rgba(255,255,255,0.05)\' },');
    stylesContent = stylesContent.replace(/otherChip: \\{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 \\},/, 'otherChip: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, backgroundColor: \'rgba(255,255,255,0.05)\' },');
    stylesContent = stylesContent.replace(/sizeBox: \\{ flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center' \\},/, 'sizeBox: { flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, alignItems: \'center\', backgroundColor: \'rgba(255,255,255,0.05)\' },');
    stylesContent = stylesContent.replace(/publishFooter: \\{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 40, borderTopWidth: 1 \\},/, 'publishFooter: { position: \'absolute\', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: Platform.OS === \'ios\' ? 34 : 20, backgroundColor: \'transparent\' },');
    stylesContent = stylesContent.replace(/freeBtnContainer: \\{ padding: 16, borderRadius: 16, borderWidth: 1\.5, marginBottom: 16 \\},/, 'freeBtnContainer: { padding: 16, borderRadius: 16, borderWidth: 1.5, marginBottom: 4, backgroundColor: \'rgba(255,255,255,0.05)\' },');

    content = content.replace(oldStylesRaw[0], `const styles = StyleSheet.create({${stylesContent}});`);
}

// 4. Update the publish footer to use BlurView directly for glass bottom feel
content = content.replace(
    /<View style=\{\[styles\.publishFooter, \{ backgroundColor: Colors\.background, borderTopColor: Colors\.border \}\]\}>\s*<TouchableOpacity/,
    `import { BlurView } from 'expo-blur';\n//...\n<BlurView intensity={isDarkMode ? 30 : 60} tint={isDarkMode ? 'dark' : 'light'} style={[styles.publishFooter, { borderTopWidth: 1, borderTopColor: Colors.border + '40' }]}>\n                <TouchableOpacity`
);
content = content.replace('import { BlurView } from \'expo-blur\';\n//...\n', ''); // Remove the placeholder

content = content.replace(
    /import \{ SafeAreaView \} from 'react-native-safe-area-context';/,
    `import { SafeAreaView } from 'react-native-safe-area-context';\nimport { BlurView } from 'expo-blur';`
);

content = content.replace(
    /<View style=\{\[styles\.publishFooter, \{ backgroundColor: Colors\.background, borderTopColor: Colors\.border \}\]\}>/,
    `<BlurView intensity={isDarkMode ? 30 : 60} tint={isDarkMode ? 'dark' : 'light'} style={[styles.publishFooter, { borderTopColor: Colors.border + '40' }]}>`
);
content = content.replace(
    /<\/View>\n\n\s*<CustomDateTimePicker/m,
    `</BlurView>\n\n            <CustomDateTimePicker`
);

// 5. Wrap the main screen background in an Image Background or subtle gradient if applicable
content = content.replace(
    /<View style=\{\[styles\.container, \{ backgroundColor: Colors\.background \}\]\}>/,
    `<View style={[styles.container, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC' }]}>`
);

// 6. Fix `marginTop` spacing caused by removed manual gaps in favor of sectionContent's gap: 12
content = content.replace(/\{ marginTop: 16 \}/g, '{}');
content = content.replace(/\{ marginTop: 14 \}/g, '{}');
content = content.replace(/\{ marginTop: 12 \}/g, '{}');

fs.writeFileSync(targetPath, content, 'utf8');
console.log('UI Glassmorphism update applied to EditPostScreen.tsx');
