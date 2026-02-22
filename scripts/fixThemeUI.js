import fs from 'fs';

const paths = [
    '/Applications/Projects/Bite Buddy/BiteBuddy/src/screens/create/CreatePostScreen.tsx',
    '/Applications/Projects/Bite Buddy/BiteBuddy/src/screens/create/EditPostScreen.tsx'
];

paths.forEach(filepath => {
    let content = fs.readFileSync(filepath, 'utf8');

    // 1. Update Section Component to use dynamic border color and better shadow
    content = content.replace(
        /const Section = \(\{ title, subtitle, children, icon, colors, isDarkMode \}: \{.*?\}\) => \([\s\S]*?<GlassCard[\s\S]*?style=\{styles\.section\}\s*>/,
        `const Section = ({ title, subtitle, children, icon, colors, isDarkMode }: { title: string, subtitle?: string, children: React.ReactNode, icon?: string, colors: any, isDarkMode?: boolean }) => (
    <GlassCard
        effect="regular"
        colorScheme={isDarkMode ? 'dark' : 'light'}
        style={[styles.section, { borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', shadowOpacity: isDarkMode ? 0.2 : 0.05 }]}
    >`
    );

    // 2. Inject dynamic variables right after Colors config
    const dynamicVars = `    const inputBg = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)';
    const glassBorder = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
    const iconBg = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';`;

    if (!content.includes('const inputBg =')) {
        content = content.replace(
            /(const \{ Colors, [^\}]+\} = currentTheme;)/,
            `$1\n${dynamicVars}`
        );
    }

    // 3. Replace fixed colors with dynamic variables for proper light/dark mode contrast
    content = content.replace(/backgroundColor: Colors\.backgroundCard/g, 'backgroundColor: inputBg');
    content = content.replace(/borderColor: Colors\.border/g, 'borderColor: glassBorder');

    // 4. Participant fields specifically (sizeBox and timeBox)
    content = content.replace(
        /<View style=\{\[styles\.sizeBox, \{ backgroundColor: inputBg, borderColor: glassBorder \}\]\}>/,
        `<GlassCard effect="clear" colorScheme={isDarkMode ? 'dark' : 'light'} style={[styles.sizeBox, { backgroundColor: 'transparent', borderColor: glassBorder }]}>`
    );
    // Replace the closing </View> for sizeBox before timeBox
    content = content.replace(
        /<\/View>\n(\s*)<GlassCard\s*effect="clear"\s*colorScheme=\{isDarkMode \? 'dark' : 'light'\}\s*style=\{\[styles\.timeBox/,
        `</GlassCard>\n$1<GlassCard\n                            effect="clear"\n                            colorScheme={isDarkMode ? 'dark' : 'light'}\n                            style={[styles.timeBox`
    );

    // 5. Update sizeBtn to use dynamic iconBg
    content = content.replace(/style=\{styles\.sizeBtn\}/g, `style={[styles.sizeBtn, { backgroundColor: iconBg }]}`);

    // 6. Fix `styles.publishFooter` having literal borderTopColor
    content = content.replace(/borderTopColor: Colors\.border \+ '40'/g, `borderTopColor: glassBorder`);

    // 7. Strip out hardcoded rgba in stylesheets so they don't override inline styles
    content = content.replace(/, backgroundColor: 'rgba\(255,255,255,0\.05\)'/g, '');
    content = content.replace(/, borderColor: 'rgba\(255,255,255,0\.1\)'/g, '');
    content = content.replace(/, backgroundColor: 'rgba\(0,0,0,0\.05\)'/g, '');

    // 8. Make sure Section border width is set in the stylesheet so inline borderColor works
    content = content.replace(/section: \{ marginBottom: 20 \},/g, `section: { marginBottom: 20, borderWidth: 1, elevation: 4 },`);
    content = content.replace(/section: \{ marginBottom: 20, borderWidth: 1 \},/g, `section: { marginBottom: 20, borderWidth: 1, elevation: 4 },`);

    fs.writeFileSync(filepath, content, 'utf8');
});
console.log('Fixed glass styling applied to both screens');
