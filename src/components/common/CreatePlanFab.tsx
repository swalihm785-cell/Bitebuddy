import React from 'react';
import { View, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const BRAND_YELLOW = '#FFB534';

type FabSize = 'floating' | 'tab';

interface CreatePlanFabProps {
    onPress: () => void;
    size?: FabSize;
    style?: StyleProp<ViewStyle>;
    activeOpacity?: number;
}

const SIZE = {
    floating: { diameter: 64, icon: 34, border: 2.5 },
    tab: { diameter: 56, icon: 30, border: 2 },
} as const;

/**
 * Primary CTA for creating a dining plan.
 * Black fill, brand-yellow outline & icon, reversed inset highlight for dark backgrounds.
 */
export const CreatePlanFab: React.FC<CreatePlanFabProps> = ({
    onPress,
    size = 'floating',
    style,
    activeOpacity = 0.88,
}) => {
    const dims = SIZE[size];
    const radius = dims.diameter / 2;

    return (
        <TouchableOpacity
            style={style}
            onPress={onPress}
            activeOpacity={activeOpacity}
            accessibilityRole="button"
            accessibilityLabel="Create dining plan"
        >
            <View
                style={[
                    styles.button,
                    {
                        width: dims.diameter,
                        height: dims.diameter,
                        borderRadius: radius,
                        borderWidth: dims.border,
                    },
                ]}
            >
                {/* Reversed inset — brand highlight along top */}
                <LinearGradient
                    pointerEvents="none"
                    colors={[`${BRAND_YELLOW}40`, `${BRAND_YELLOW}12`, 'transparent']}
                    locations={[0, 0.35, 0.75]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                />
                {/* Reversed inset — deeper base along bottom */}
                <LinearGradient
                    pointerEvents="none"
                    colors={['transparent', 'rgba(0, 0, 0, 0.55)', 'rgba(0, 0, 0, 0.75)']}
                    locations={[0.35, 0.75, 1]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                />
                <Ionicons name="add" size={dims.icon} color={BRAND_YELLOW} />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#000000',
        borderColor: '#000000',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default CreatePlanFab;
