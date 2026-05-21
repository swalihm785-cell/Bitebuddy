import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import { CreatePlanFab } from '../components/common/CreatePlanFab';

export default function MainNavigator() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    return (
        <View style={{ flex: 1 }}>
            <DashboardScreen />

            {/* ── Floating Action Button: Create Dining Plan ── */}
            <CreatePlanFab
                size="floating"
                style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 20 }]}
                onPress={() => navigation.navigate('CreatePost')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        right: 18,
        zIndex: 999,
    },
});
