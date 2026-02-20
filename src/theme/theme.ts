export const Colors = {
    // Primary brand
    primary: '#FF6B35',
    primaryLight: '#FF8A5C',
    primaryDark: '#E55A24',

    // Secondary
    secondary: '#6C63FF',
    secondaryLight: '#8A84FF',

    // Accent
    accent: '#FFD166',

    // Backgrounds (dark mode)
    background: '#0F0F14',
    backgroundCard: '#1A1A24',
    backgroundElevated: '#22222F',
    backgroundInput: '#1E1E2A',

    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#A0A0B0',
    textMuted: '#6B6B80',
    textInverse: '#0F0F14',

    // Status
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
    info: '#2196F3',

    // Borders
    border: '#2A2A3A',
    borderLight: '#35354A',

    // Gradients (as tuples)
    gradientPrimary: ['#FF6B35', '#FF3CAC'] as [string, string],
    gradientCard: ['#1A1A24', '#22222F'] as [string, string],
    gradientSplash: ['#0F0F14', '#1A1A24'] as [string, string],

    // Cuisine tag colors
    Italian: '#E8534A',
    Mexican: '#F5A623',
    Indian: '#E67E22',
    Vegan: '#27AE60',
    Japanese: '#8E44AD',
    American: '#2980B9',
    Thai: '#D35400',
    Chinese: '#C0392B',
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const BorderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
};

export const FontSize = {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 26,
    xxxl: 34,
};

export const FontWeight = {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
};

export const Shadow = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    md: {
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    lg: {
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
    },
};

export const CUISINE_TYPES = [
    'Italian', 'Mexican', 'Indian', 'Japanese', 'Chinese',
    'Thai', 'American', 'Mediterranean', 'Vegan', 'Korean',
    'French', 'Middle Eastern', 'Spanish', 'Vietnamese', 'Greek',
];

export const DIETARY_RESTRICTIONS = [
    'None', 'Vegan', 'Vegetarian', 'Halal', 'Kosher',
    'Gluten-Free', 'Dairy-Free', 'Nut-Free',
];

export const PERSONALITY_TAGS = [
    'Casual', 'Food Explorer', 'Networking', 'Quiet Diner',
    'Party Vibe', 'Adventurous', 'Foodie', 'Budget-Friendly',
];

export const BUDGET_LABELS: Record<string, string> = {
    range1: '100 - 250',
    range2: '250 - 300',
    range3: '300 - 500',
    range4: '500+',
    custom: 'Custom',
};

export const BUDGET_RANGE_OPTIONS = [
    { label: '100 - 250', value: 'range1' },
    { label: '250 - 300', value: 'range2' },
    { label: '300 - 500', value: 'range3' },
    { label: '500+', value: 'range4' },
    { label: 'Custom', value: 'custom' },
];
