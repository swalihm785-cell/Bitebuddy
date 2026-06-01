import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    ScrollView,
    Linking,
    useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore, ThemeMode } from '../../store/useThemeStore';
import { CustomAlert } from '../../components/common/CustomAlert';
import FudioLogo from '../../components/FudioLogo';

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconMoon({ color = '#FFB534' }: { color?: string }) {
    return (
        <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
            <Path
                d="M9 18C6.5 18 4.375 17.125 2.625 15.375C0.875 13.625 0 11.5 0 9C0 6.5 0.875 4.375 2.625 2.625C4.375 0.875 6.5 0 9 0C9.23333 0 9.4625 0.00833333 9.6875 0.025C9.9125 0.0416667 10.1333 0.0666667 10.35 0.1C9.66667 0.583333 9.12083 1.2125 8.7125 1.9875C8.30417 2.7625 8.1 3.6 8.1 4.5C8.1 6 8.625 7.275 9.675 8.325C10.725 9.375 12 9.9 13.5 9.9C14.4167 9.9 15.2583 9.69583 16.025 9.2875C16.7917 8.87917 17.4167 8.33333 17.9 7.65C17.9333 7.86667 17.9583 8.0875 17.975 8.3125C17.9917 8.5375 18 8.76667 18 9C18 11.5 17.125 13.625 15.375 15.375C13.625 17.125 11.5 18 9 18ZM9 16C10.4667 16 11.7833 15.5958 12.95 14.7875C14.1167 13.9792 14.9667 12.925 15.5 11.625C15.1667 11.7083 14.8333 11.775 14.5 11.825C14.1667 11.875 13.8333 11.9 13.5 11.9C11.45 11.9 9.70417 11.1792 8.2625 9.7375C6.82083 8.29583 6.1 6.55 6.1 4.5C6.1 4.16667 6.125 3.83333 6.175 3.5C6.225 3.16667 6.29167 2.83333 6.375 2.5C5.075 3.03333 4.02083 3.88333 3.2125 5.05C2.40417 6.21667 2 7.53333 2 9C2 10.9333 2.68333 12.5833 4.05 13.95C5.41667 15.3167 7.06667 16 9 16Z"
                fill={color}
            />
        </Svg>
    );
}

function IconBell({ color = '#FFB534' }: { color?: string }) {
    return (
        <Svg width={16} height={20} viewBox="0 0 16 20" fill="none">
            <Path
                d="M0 17V15H2V8C2 6.61667 2.41667 5.3875 3.25 4.3125C4.08333 3.2375 5.16667 2.53333 6.5 2.2V1.5C6.5 1.08333 6.64583 0.729167 6.9375 0.4375C7.22917 0.145833 7.58333 0 8 0C8.41667 0 8.77083 0.145833 9.0625 0.4375C9.35417 0.729167 9.5 1.08333 9.5 1.5V2.2C10.8333 2.53333 11.9167 3.2375 12.75 4.3125C13.5833 5.3875 14 6.61667 14 8V15H16V17H0ZM8 20C7.45 20 6.97917 19.8042 6.5875 19.4125C6.19583 19.0208 6 18.55 6 18H10C10 18.55 9.80417 19.0208 9.4125 19.4125C9.02083 19.8042 8.55 20 8 20ZM4 15H12V8C12 6.9 11.6083 5.95833 10.825 5.175C10.0417 4.39167 9.1 4 8 4C6.9 4 5.95833 4.39167 5.175 5.175C4.39167 5.95833 4 6.9 4 8V15Z"
                fill={color}
            />
        </Svg>
    );
}

function IconLocation({ color = '#FFB534' }: { color?: string }) {
    return (
        <Svg width={16} height={20} viewBox="0 0 16 20" fill="none">
            <Path
                d="M8 10C8.55 10 9.02083 9.80417 9.4125 9.4125C9.80417 9.02083 10 8.55 10 8C10 7.45 9.80417 6.97917 9.4125 6.5875C9.02083 6.19583 8.55 6 8 6C7.45 6 6.97917 6.19583 6.5875 6.5875C6.19583 6.97917 6 7.45 6 8C6 8.55 6.19583 9.02083 6.5875 9.4125C6.97917 9.80417 7.45 10 8 10ZM8 17.35C10.0333 15.4833 11.5417 13.7875 12.525 12.2625C13.5083 10.7375 14 9.38333 14 8.2C14 6.38333 13.4208 4.89583 12.2625 3.7375C11.1042 2.57917 9.68333 2 8 2C6.31667 2 4.89583 2.57917 3.7375 3.7375C2.57917 4.89583 2 6.38333 2 8.2C2 9.38333 2.49167 10.7375 3.475 12.2625C4.45833 13.7875 5.96667 15.4833 8 17.35ZM8 20C5.31667 17.7167 3.3125 15.5958 1.9875 13.6375C0.6625 11.6792 0 9.86667 0 8.2C0 5.7 0.804167 3.70833 2.4125 2.225C4.02083 0.741667 5.88333 0 8 0C10.1167 0 11.9792 0.741667 13.5875 2.225C15.1958 3.70833 16 5.7 16 8.2C16 9.86667 15.3375 11.6792 14.0125 13.6375C12.6875 15.5958 10.6833 17.7167 8 20Z"
                fill={color}
            />
        </Svg>
    );
}

function IconPerson({ color = '#FFB534' }: { color?: string }) {
    return (
        <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
            <Path
                d="M8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM0 16V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V16H0ZM2 14H14V13.2C14 13.0167 13.9542 12.85 13.8625 12.7C13.7708 12.55 13.65 12.4333 13.5 12.35C12.6 11.9 11.6917 11.5625 10.775 11.3375C9.85833 11.1125 8.93333 11 8 11C7.06667 11 6.14167 11.1125 5.225 11.3375C4.30833 11.5625 3.4 11.9 2.5 12.35C2.35 12.4333 2.22917 12.55 2.1375 12.7C2.04583 12.85 2 13.0167 2 13.2V14ZM8 6C8.55 6 9.02083 5.80417 9.4125 5.4125C9.80417 5.02083 10 4.55 10 4C10 3.45 9.80417 2.97917 9.4125 2.5875C9.02083 2.19583 8.55 2 8 2C7.45 2 6.97917 2.19583 6.5875 2.5875C6.19583 2.97917 6 3.45 6 4C6 4.55 6.19583 5.02083 6.5875 5.4125C6.97917 5.80417 7.45 6 8 6Z"
                fill={color}
            />
        </Svg>
    );
}

function IconShield({ color = '#FFB534' }: { color?: string }) {
    return (
        <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
            <Path
                d="M10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM10 18C10.9 18 11.7667 17.8542 12.6 17.5625C13.4333 17.2708 14.2 16.85 14.9 16.3L3.7 5.1C3.15 5.8 2.72917 6.56667 2.4375 7.4C2.14583 8.23333 2 9.1 2 10C2 12.2333 2.775 14.125 4.325 15.675C5.875 17.225 7.76667 18 10 18ZM16.3 14.9C16.85 14.2 17.2708 13.4333 17.5625 12.6C17.8542 11.7667 18 10.9 18 10C18 7.76667 17.225 5.875 15.675 4.325C14.125 2.775 12.2333 2 10 2C9.1 2 8.23333 2.14583 7.4 2.4375C6.56667 2.72917 5.8 3.15 5.1 3.7L16.3 14.9Z"
                fill={color}
            />
        </Svg>
    );
}

function IconSecurity({ color = '#FFB534' }: { color?: string }) {
    return (
        <Svg width={16} height={20} viewBox="0 0 16 20" fill="none">
            <Path
                d="M8 20C5.68333 19.4167 3.77083 18.0875 2.2625 16.0125C0.754167 13.9375 0 11.6333 0 9.1V3L8 0L16 3V9.1C16 10.5167 15.7583 11.8792 15.275 13.1875C14.7917 14.4958 14.1 15.65 13.2 16.65L10 13.45C9.7 13.6333 9.37917 13.7708 9.0375 13.8625C8.69583 13.9542 8.35 14 8 14C6.9 14 5.95833 13.6083 5.175 12.825C4.39167 12.0417 4 11.1 4 10C4 8.9 4.39167 7.95833 5.175 7.175C5.95833 6.39167 6.9 6 8 6C9.1 6 10.0417 6.39167 10.825 7.175C11.6083 7.95833 12 8.9 12 10C12 10.3667 11.9542 10.7208 11.8625 11.0625C11.7708 11.4042 11.6333 11.7333 11.45 12.05L12.95 13.55C13.2833 12.8667 13.5417 12.15 13.725 11.4C13.9083 10.65 14 9.88333 14 9.1V4.375L8 2.125L2 4.375V9.1C2 11.1167 2.56667 12.95 3.7 14.6C4.83333 16.25 6.26667 17.35 8 17.9C8.43333 17.7667 8.84583 17.5958 9.2375 17.3875C9.62917 17.1792 10.0167 16.9333 10.4 16.65L11.8 18.05C11.25 18.5 10.6542 18.8917 10.0125 19.225C9.37083 19.5583 8.7 19.8167 8 20ZM8 12C8.55 12 9.02083 11.8042 9.4125 11.4125C9.80417 11.0208 10 10.55 10 10C10 9.45 9.80417 8.97917 9.4125 8.5875C9.02083 8.19583 8.55 8 8 8C7.45 8 6.97917 8.19583 6.5875 8.5875C6.19583 8.97917 6 9.45 6 10C6 10.55 6.19583 11.0208 6.5875 11.4125C6.97917 11.8042 7.45 12 8 12Z"
                fill={color}
            />
        </Svg>
    );
}

function IconBlock({ color = '#FFB534' }: { color?: string }) {
    return (
        <Svg width={18} height={19} viewBox="0 0 18 19" fill="none">
            <Path
                d="M0 19V17H12V19H0ZM5.65 14.15L0 8.5L2.1 6.35L7.8 12L5.65 14.15ZM12 7.8L6.35 2.1L8.5 0L14.15 5.65L12 7.8ZM16.6 18L3.55 4.95L4.95 3.55L18 16.6L16.6 18Z"
                fill={color}
            />
        </Svg>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
    const navigation = useNavigation<any>();
    const { logout } = useAuthStore();
    const { currentTheme, themeMode, isDarkMode, setThemeMode } = useThemeStore();
    const { Colors } = currentTheme;
    const systemColorScheme = useColorScheme();

    const [pushNotifs, setPushNotifs] = useState(true);
    const [locationEnabled, setLocationEnabled] = useState(false);
    const [showLogoutAlert, setShowLogoutAlert] = useState(false);

    const insets = useSafeAreaInsets();

    const themeSubtitle =
        themeMode === 'system'
            ? `Following system (${systemColorScheme === 'dark' ? 'Dark' : 'Light'})`
            : isDarkMode
            ? 'Dark mode active'
            : 'Light mode active';

    const THEME_MODES: { mode: ThemeMode; label: string; icon: string }[] = [
        { mode: 'light', label: 'Light', icon: '☀' },
        { mode: 'dark',  label: 'Dark',  icon: '🌙' },
        { mode: 'system', label: 'System', icon: '⚙' },
    ];

    // ─── Reusable Row Components ────────────────────────────────────────────

    /** A preference row sitting directly on the background (no card) */
    const PrefRow = ({
        icon,
        title,
        subtitle,
        right,
    }: {
        icon: React.ReactNode;
        title: string;
        subtitle?: string;
        right: React.ReactNode;
    }) => (
        <View style={styles.prefRow}>
            <View style={[styles.iconWrap, { backgroundColor: Colors.primary + '18' }]}>
                {icon}
            </View>
            <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: '#EBFFE2' }]}>{title}</Text>
                {subtitle ? (
                    <Text style={[styles.rowSubtitle, { color: Colors.textMuted }]}>{subtitle}</Text>
                ) : null}
            </View>
            {right}
        </View>
    );

    /** A nav row inside its own rounded card */
    const NavCard = ({
        icon,
        title,
        onPress,
    }: {
        icon: React.ReactNode;
        title: string;
        onPress: () => void;
    }) => (
        <TouchableOpacity
            style={[styles.navCard, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}
            onPress={onPress}
            activeOpacity={0.75}
        >
            <View style={[styles.iconWrap, { backgroundColor: Colors.primary + '18' }]}>
                {icon}
            </View>
            <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: '#EBFFE2' }]}>{title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
    );

    // ─── Render ─────────────────────────────────────────────────────────────

    return (
        <View style={[styles.safeArea, { backgroundColor: Colors.background }]}>

            {/* Brand bar */}
            <View
                style={[
                    styles.brandBar,
                    { paddingTop: Math.max(insets.top, 10), backgroundColor: Colors.backgroundElevated },
                ]}
            >
                <FudioLogo width={74} height={26} color={Colors.textPrimary} />
            </View>

            {/* Header — back arrow + title only */}
            <View style={styles.headerRow}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerBackBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={20} color={Colors.primary} />
                    <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Settings</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
            >

                {/* ── Preferences ─────────────────────────────────────── */}
                <Text style={styles.sectionHeading}>Preferences</Text>

                {/* Theme */}
                <View style={styles.prefRow}>
                    <View style={[styles.iconWrap, { backgroundColor: Colors.primary + '18' }]}>
                        <IconMoon color={Colors.primary} />
                    </View>
                    <View style={styles.rowContent}>
                        <Text style={[styles.rowTitle, { color: '#EBFFE2' }]}>Theme</Text>
                        <Text style={[styles.rowSubtitle, { color: Colors.textMuted }]}>{themeSubtitle}</Text>
                    </View>
                </View>

                {/* Theme mode chips */}
                <View style={[styles.themeChipRow, { backgroundColor: Colors.backgroundInput, borderColor: Colors.border }]}>
                    {THEME_MODES.map(({ mode, label, icon }) => {
                        const active = themeMode === mode;
                        return (
                            <TouchableOpacity
                                key={mode}
                                onPress={() => setThemeMode(mode, systemColorScheme === 'dark')}
                                style={[
                                    styles.themeChip,
                                    active && { backgroundColor: Colors.primary },
                                ]}
                                activeOpacity={0.75}
                            >
                                <Text style={[styles.themeChipText, { color: active ? '#111' : Colors.textMuted }]}>
                                    {icon}  {label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={[styles.prefDivider, { backgroundColor: Colors.border }]} />

                {/* Push Notifications */}
                <PrefRow
                    icon={<IconBell color={Colors.primary} />}
                    title="Push Notifications"
                    subtitle="Receive instant alerts"
                    right={
                        <Switch
                            value={pushNotifs}
                            onValueChange={setPushNotifs}
                            trackColor={{ false: Colors.border, true: Colors.primary }}
                            thumbColor="#FFF"
                            ios_backgroundColor={Colors.border}
                        />
                    }
                />

                <View style={[styles.prefDivider, { backgroundColor: Colors.border }]} />

                {/* Location Services */}
                <PrefRow
                    icon={<IconLocation color={Colors.primary} />}
                    title="Location Services"
                    subtitle="Enhanced mapping features"
                    right={
                        <Switch
                            value={locationEnabled}
                            onValueChange={setLocationEnabled}
                            trackColor={{ false: Colors.border, true: Colors.primary }}
                            thumbColor="#FFF"
                            ios_backgroundColor={Colors.border}
                        />
                    }
                />

                {/* ── Account ─────────────────────────────────────────── */}
                <Text style={[styles.sectionHeading, { marginTop: 32 }]}>Account</Text>

                <NavCard
                    icon={<IconPerson color={Colors.primary} />}
                    title="Profile Settings"
                    onPress={() => navigation.navigate('ProfileSettings')}
                />

                <View style={{ height: 10 }} />

                <NavCard
                    icon={<IconBlock color={Colors.primary} />}
                    title="Blocked Users"
                    onPress={() => navigation.navigate('BlockedUsers' as any)}
                />

                {/* ── Legal ───────────────────────────────────────────── */}
                <Text style={[styles.sectionHeading, { marginTop: 32 }]}>Legal</Text>

                <NavCard
                    icon={<IconShield color={Colors.primary} />}
                    title="Privacy Policy"
                    onPress={() => Linking.openURL('https://bitebuddy.app/privacy')}
                />

                <View style={{ height: 10 }} />

                <NavCard
                    icon={<IconSecurity color={Colors.primary} />}
                    title="Terms of Service"
                    onPress={() => Linking.openURL('https://bitebuddy.app/terms')}
                />

                {/* ── Sign Out ────────────────────────────────────────── */}
                <TouchableOpacity
                    onPress={() => setShowLogoutAlert(true)}
                    style={styles.signOutBtn}
                    activeOpacity={0.8}
                >
                    <Text style={styles.signOutText}>SIGN OUT</Text>
                </TouchableOpacity>

            </ScrollView>

            <CustomAlert
                visible={showLogoutAlert}
                title="Sign Out"
                message="Are you sure you want to sign out?"
                onConfirm={logout}
                onClose={() => setShowLogoutAlert(false)}
                type="warning"
                confirmText="Sign Out"
            />
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },

    // Brand bar
    brandBar: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 16,
    },

    // Header
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 10,
    },
    headerBackBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.2,
    },

    // Scroll container
    container: {
        paddingHorizontal: 20,
        paddingTop: 12,
    },

    // Section heading  (matches Figma: color #FFF, size 16, weight 400)
    sectionHeading: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 16,
        marginBottom: 16,
    },

    // ── Preference rows (flat, no card) ──
    prefRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 14,
    },
    prefDivider: {
        height: 1,
        marginLeft: 50,   // indent past icon
        marginBottom: 2,
    },

    // ── Nav card row (individual card per item) ──
    navCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        gap: 14,
    },

    // Shared
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowContent: {
        flex: 1,
    },
    rowTitle: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
    },
    rowSubtitle: {
        fontSize: 12,
        marginTop: 1,
    },

    // ── Theme chip row ──
    themeChipRow: {
        flexDirection: 'row',
        marginLeft: 50,        // align with text (past icon)
        marginBottom: 14,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
    },
    themeChip: {
        flex: 1,
        paddingVertical: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    themeChipText: {
        fontSize: 12,
        fontWeight: '600',
    },

    // ── Sign Out ──
    signOutBtn: {
        marginTop: 32,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#FFB4AB',
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    signOutText: {
        color: '#FFB4AB',
        fontSize: 12,
        fontWeight: '800',
        lineHeight: 16,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
});
