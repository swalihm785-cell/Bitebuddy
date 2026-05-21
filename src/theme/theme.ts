export const CommonTheme = {
    Spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },
    BorderRadius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        full: 9999,
    },
    FontSize: {
        xs: 11,
        sm: 13,
        md: 15,
        lg: 17,
        xl: 20,
        xxl: 26,
        xxxl: 34,
    },
    FontWeight: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
        extrabold: '800' as const,
    },
};

export const LightTheme = {
    ...CommonTheme,
    Colors: {
        primary: '#FFB534',
        primaryLight: '#FFCB6B',
        primaryDark: '#E89B1F',
        secondary: '#6C63FF',
        secondaryLight: '#8A84FF',
        accent: '#FFD166',
        background: '#000000',
        backgroundCard: '#1d1b22',
        backgroundElevated: '#1d1b22',
        backgroundInput: '#1E1E2A',
        textPrimary: '#FFFFFF',
        textSecondary: '#A0A0B0',
        textMuted: '#6B6B80',
        textInverse: '#0F0F14',
        success: '#4CAF50',
        warning: '#FFC107',
        error: '#F44336',
        info: '#2196F3',
        border: '#2A2A3A',
        borderLight: '#35354A',
        gradientPrimary: ['#FFB534', '#FF8A1F'] as [string, string],
        cuisineTag: {
            Italian: '#E8534A',
            Mexican: '#F5A623',
            Indian: '#E67E22',
            Vegan: '#27AE60',
            Japanese: '#8E44AD',
            American: '#2980B9',
            Thai: '#D35400',
            Chinese: '#C0392B',
        }
    }
};

export const DarkTheme = {
    ...CommonTheme,
    Colors: {
        primary: '#FFB534',
        primaryLight: '#FFCB6B',
        primaryDark: '#E89B1F',
        secondary: '#6C63FF',
        secondaryLight: '#8A84FF',
        accent: '#FFD166',
        background: '#000000',
        backgroundCard: '#1d1b22',
        backgroundElevated: '#1d1b22',
        backgroundInput: '#1E1E2A',
        textPrimary: '#FFFFFF',
        textSecondary: '#A0A0B0',
        textMuted: '#6B6B80',
        textInverse: '#0F0F14',
        success: '#4CAF50',
        warning: '#FFC107',
        error: '#F44336',
        info: '#2196F3',
        border: '#2A2A3A',
        borderLight: '#35354A',
        gradientPrimary: ['#FFB534', '#FF8A1F'] as [string, string],
        cuisineTag: {
            Italian: '#E8534A',
            Mexican: '#F5A623',
            Indian: '#E67E22',
            Vegan: '#27AE60',
            Japanese: '#8E44AD',
            American: '#2980B9',
            Thai: '#D35400',
            Chinese: '#C0392B',
        }
    }
};

// Legacy exports for compatibility during transition
export const Colors = DarkTheme.Colors;
export const Spacing = CommonTheme.Spacing;
export const BorderRadius = CommonTheme.BorderRadius;
export const FontSize = CommonTheme.FontSize;
export const FontWeight = CommonTheme.FontWeight;

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
    free: 'Free',
    custom: 'Custom',
};

export const BUDGET_RANGE_OPTIONS = [
    { label: '100-250', value: 'range1' },
    { label: '250-300', value: 'range2' },
    { label: '300-500', value: 'range3' },
    { label: '500+', value: 'range4' },
    { label: 'Free', value: 'free' },
    { label: 'Custom', value: 'custom' },
];
