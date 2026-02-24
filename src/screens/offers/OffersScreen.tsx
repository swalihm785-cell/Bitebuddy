import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Image, Dimensions, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../store/useThemeStore';
import { useOffersStore, Offer } from '../../store/useOffersStore';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Format ISO date to "Ends Oct 24" or "Expired"
const formatExpiry = (isoString: string) => {
    const d = new Date(isoString);
    if (d.getTime() < Date.now()) return 'Expired';
    return `Ends ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
};

export default function OffersScreen() {
    const navigation = useNavigation();
    const { currentTheme, isDarkMode } = useThemeStore();
    const { Colors } = currentTheme;
    const { offers, savedOfferIds, toggleSaveOffer, deleteExpiredOffers } = useOffersStore();

    const [selectedLocation, setSelectedLocation] = useState<string>('All');

    useEffect(() => {
        // Auto-hide expired on mount
        deleteExpiredOffers();
    }, []);

    // Extract unique locations from active offers
    const locations = ['All', ...Array.from(new Set(offers.map(o => o.location)))];

    const filteredOffers = selectedLocation === 'All'
        ? offers
        : offers.filter(o => o.location === selectedLocation);

    const renderOfferCard = ({ item }: { item: Offer }) => {
        const isSaved = savedOfferIds.includes(item.id);
        const isExpired = new Date(item.expiryDate).getTime() < Date.now();

        return (
            <View style={[
                styles.card,
                { backgroundColor: Colors.backgroundElevated, borderColor: Colors.border },
                isExpired && { opacity: 0.6 }
            ]}>
                <View style={styles.imageContainer}>
                    <Image source={{ uri: item.imageUrl }} style={styles.image} />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.imageOverlay}>
                        <View style={[styles.badge, { backgroundColor: Colors.primary }]}>
                            <Text style={styles.badgeText}>{item.discountDetails}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.saveBtn}
                            onPress={() => toggleSaveOffer(item.id)}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name={isSaved ? "bookmark" : "bookmark-outline"}
                                size={22}
                                color={isSaved ? Colors.primary : "#FFF"}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.body}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1, paddingRight: 10 }}>
                            <Text style={[styles.title, { color: Colors.textPrimary }]} numberOfLines={1}>
                                {item.title}
                            </Text>
                            <Text style={[styles.placeName, { color: Colors.textSecondary }]} numberOfLines={1}>
                                {item.placeName}
                            </Text>
                        </View>
                        <View style={[styles.expiryWrap, { backgroundColor: isExpired ? Colors.error + '20' : Colors.warning + '20' }]}>
                            <Ionicons name="time-outline" size={12} color={isExpired ? Colors.error : Colors.warning} />
                            <Text style={[styles.expiryText, { color: isExpired ? Colors.error : Colors.warning }]}>
                                {formatExpiry(item.expiryDate)}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                        <Text style={[styles.locationText, { color: Colors.textMuted }]}>{item.location}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: Colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Offers & Promotions</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Filter Row */}
            {locations.length > 1 && (
                <View style={[styles.filterRow, { borderBottomColor: Colors.border }]}>
                    <FlatList
                        data={locations}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={item => item}
                        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: selectedLocation === item ? Colors.primary : Colors.backgroundCard,
                                        borderColor: selectedLocation === item ? Colors.primary : Colors.border
                                    }
                                ]}
                                onPress={() => setSelectedLocation(item)}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    { color: selectedLocation === item ? '#FFF' : Colors.textSecondary }
                                ]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            {/* List */}
            <FlatList
                data={filteredOffers}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={renderOfferCard}
                ListEmptyComponent={() => (
                    <View style={styles.emptyWrap}>
                        <Ionicons name="ticket-outline" size={64} color={Colors.border} />
                        <Text style={[styles.emptyTitle, { color: Colors.textPrimary }]}>No active offers</Text>
                        <Text style={[styles.emptySub, { color: Colors.textMuted }]}>Check back later for exclusive deals!</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    filterRow: { paddingVertical: 12, borderBottomWidth: 1 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    filterChipText: { fontSize: 13, fontWeight: '600' },
    listContent: { padding: 16, gap: 16 },
    card: { borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
    imageContainer: { width: '100%', height: 180 },
    image: { ...StyleSheet.absoluteFillObject },
    imageOverlay: { ...StyleSheet.absoluteFillObject, padding: 14, justifyContent: 'space-between', alignItems: 'flex-end', flexDirection: 'row' },
    badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    badgeText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
    saveBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    body: { padding: 16, paddingTop: 14 },
    title: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
    placeName: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    expiryWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    expiryText: { fontSize: 11, fontWeight: '800' },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    locationText: { fontSize: 12, fontWeight: '500' },
    emptyWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: 10 },
    emptyTitle: { fontSize: 18, fontWeight: '700' },
    emptySub: { fontSize: 14, textAlign: 'center' },
});
