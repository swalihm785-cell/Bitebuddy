import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Alert, Share, Clipboard, Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import BrandBar from '../../components/common/BrandBar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { usePostStore } from '../../store/usePostStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useHostReputationStore } from '../../store/useHostReputationStore';
import { isCurrentlyPro } from '../../utils/authUtils';
import { showMessage } from 'react-native-flash-message';
import { TastePointsBadge } from '../../components/dining/TastePointsBadge';
import Svg, { Path, Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

function GoldStarIcon({ width = 12, height = 12, color = '#FFCC00' }: any) {
  return (
    <Svg width={width} height={height} viewBox="0 0 12 12" fill="none">
      <Path d="M2.23125 11.0833L3.17917 6.98542L0 4.22917L4.2 3.86458L5.83333 0L7.46667 3.86458L11.6667 4.22917L8.4875 6.98542L9.43542 11.0833L5.83333 8.91042L2.23125 11.0833Z" fill={color}/>
    </Svg>
  );
}

function MedalRibbonIcon({ width = 15, height = 30, color = '#FFCC00' }: any) {
  return (
    <Svg width={width} height={height} viewBox="0 0 15 30" fill="none">
      <Path d="M0 0H15V11.775C15 12.35 14.875 12.8625 14.625 13.3125C14.375 13.7625 14.025 14.125 13.575 14.4L8.25 17.55L9.3 21H15L10.35 24.3L12.15 30L7.5 26.475L2.85 30L4.65 24.3L0 21H5.7L6.75 17.55L1.425 14.4C0.975 14.125 0.625 13.7625 0.375 13.3125C0.125 12.8625 0 12.35 0 11.775V0ZM3 3V11.775L6 13.575V3H3ZM12 3H9V13.575L12 11.775V3Z" fill={color} fillOpacity={0.78}/>
    </Svg>
  );
}

const RadialGlow = () => (
  <View style={StyleSheet.absoluteFill}>
    <Svg height="100%" width="100%">
      <Defs>
        <RadialGradient
          id="glow"
          cx="85%"
          cy="50%"
          rx="45%"
          ry="60%"
          fx="85%"
          fy="50%"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor="#FFCC00" stopOpacity="0.25" />
          <Stop offset="50%" stopColor="#FFCC00" stopOpacity="0.08" />
          <Stop offset="100%" stopColor="#FFCC00" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx="85%" cy="50%" r="150" fill="url(#glow)" />
    </Svg>
  </View>
);

const getLevelTitle = (points: number) => {
  if (points >= 1000) return 'ELITE LEVEL';
  if (points >= 500) return 'PLATINUM LEVEL';
  if (points >= 100) return 'GOLD LEVEL';
  return 'BRONZE LEVEL';
};

function PrivateMailIcon({ color = '#B9CCB2' }: any) {
  return (
  <Svg width={13} height={10} viewBox="0 0 13 10" fill="none">
    <Path d="M1.3 10C0.9425 10 0.636458 9.8776 0.381875 9.63281C0.127292 9.38802 0 9.09375 0 8.75V1.25C0 0.90625 0.127292 0.611979 0.381875 0.367188C0.636458 0.122396 0.9425 0 1.3 0H11.7C12.0575 0 12.3635 0.122396 12.6181 0.367188C12.8727 0.611979 13 0.90625 13 1.25V8.75C13 9.09375 12.8727 9.38802 12.6181 9.63281C12.3635 9.8776 12.0575 10 11.7 10H1.3ZM6.5 5.625L1.3 2.5V8.75H11.7V2.5L6.5 5.625ZM6.5 4.375L11.7 1.25H1.3L6.5 4.375Z" fill={color}/>
  </Svg>
  );
}

function PrivatePhoneIcon({ color = '#B9CCB2' }: any) {
  return (
  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
    <Path d="M13.1833 14C11.563 14 9.96204 13.6468 8.38056 12.9403C6.79907 12.2338 5.36019 11.2324 4.06389 9.93611C2.76759 8.63981 1.7662 7.20093 1.05972 5.61944C0.353241 4.03796 0 2.43704 0 0.816667C0 0.583333 0.0777778 0.388889 0.233333 0.233333C0.388889 0.0777778 0.583333 0 0.816667 0H3.96667C4.14815 0 4.31018 0.0615741 4.45278 0.184722C4.59537 0.30787 4.67963 0.453704 4.70556 0.622222L5.21111 3.34444C5.23704 3.55185 5.23056 3.72685 5.19167 3.86944C5.15278 4.01204 5.08148 4.13519 4.97778 4.23889L3.09167 6.14444C3.35093 6.62407 3.6588 7.0875 4.01528 7.53472C4.37176 7.98194 4.76389 8.41296 5.19167 8.82778C5.59352 9.22963 6.01481 9.60231 6.45556 9.94583C6.8963 10.2894 7.36296 10.6037 7.85556 10.8889L9.68333 9.06111C9.8 8.94444 9.95232 8.85695 10.1403 8.79861C10.3282 8.74028 10.513 8.72407 10.6944 8.75L13.3778 9.29444C13.5593 9.3463 13.7083 9.44028 13.825 9.57639C13.9417 9.7125 14 9.86481 14 10.0333V13.1833C14 13.4167 13.9222 13.6111 13.7667 13.7667C13.6111 13.9222 13.4167 14 13.1833 14ZM2.35278 4.66667L3.63611 3.38333L3.30556 1.55556H1.575C1.63981 2.08704 1.73056 2.61204 1.84722 3.13056C1.96389 3.64907 2.13241 4.16111 2.35278 4.66667ZM9.31389 11.6278C9.81944 11.8481 10.3347 12.0231 10.8597 12.1528C11.3847 12.2824 11.913 12.3667 12.4444 12.4056V10.6944L10.6167 10.325L9.31389 11.6278Z" fill={color}/>
  </Svg>
  );
}


function PrivateWhatsappIcon({ color = '#B9CCB2' }: any) {
  return (
  <Svg width={15} height={15} viewBox="0 0 15 15" fill="none">
    <Path d="M8.02993 0L9.06059 0.155308C12.128 0.798501 14.5374 3.40945 14.9352 6.5224L14.9974 7.2069C14.9916 7.36221 15.0052 7.52066 14.9974 7.67544C14.7277 13.1426 9.02557 16.4945 4.10327 14.0765L0.0375954 15L0.911986 10.9709C-1.71171 6.23688 1.63794 0.32944 6.97575 0H8.02993ZM1.58934 13.4469L4.26843 12.8309C7.5538 14.714 11.7982 13.3816 13.3045 9.89263C14.9383 6.10824 12.4207 1.79153 8.3916 1.23462C3.09927 0.50305 -0.702474 6.21178 2.16164 10.7659L1.58934 13.4469Z" fill={color}/>
    <Path d="M5.00681 4.16714C4.54949 4.24348 4.13346 5.07964 4.0859 5.50111C3.91657 7.00085 5.74897 9.02822 6.94897 9.76815C7.53329 10.1284 8.79914 10.6273 9.47911 10.6048C10.1748 10.5823 10.8652 10.1441 11.0026 9.43453C11.0455 9.21385 11.1176 9.00102 10.9091 8.85251C10.7565 8.74427 9.5967 8.17742 9.44305 8.1518C9.26482 8.12199 9.24183 8.14291 9.12789 8.26161C8.97423 8.42215 8.6251 8.98586 8.43486 9.03344C8.30367 9.06587 7.79043 8.79552 7.64932 8.71655C7.04775 8.38136 6.52719 7.89714 6.13312 7.33343C6.03277 7.19015 5.78294 6.87587 5.85089 6.71011C5.94287 6.48473 6.40907 6.24104 6.42266 5.90271C6.42684 5.80127 6.09235 5.02159 6.0244 4.86419C5.94548 4.68222 5.81273 4.28113 5.64078 4.19328C5.53991 4.14151 5.1312 4.14622 5.00733 4.16714H5.00681Z" fill="white"/>
    <Path d="M5.00709 4.16714C5.13096 4.14622 5.53967 4.14151 5.64054 4.19328C5.81249 4.28166 5.94524 4.68222 6.02416 4.86419C6.09211 5.02107 6.4266 5.80127 6.42242 5.90271C6.40883 6.24104 5.94263 6.48525 5.85064 6.7101C5.7827 6.87587 6.03253 7.19015 6.13287 7.33343C6.52695 7.89714 7.04751 8.38084 7.64908 8.71655C7.79019 8.79499 8.30396 9.06587 8.43462 9.03344C8.62486 8.98638 8.97399 8.42215 9.12765 8.26161C9.24159 8.14291 9.2651 8.12199 9.4428 8.1518C9.59594 8.17742 10.7562 8.74427 10.9088 8.85251C11.1174 9.00102 11.0452 9.21385 11.0024 9.43453C10.8649 10.1441 10.1745 10.5823 9.47887 10.6048C8.79943 10.6268 7.53305 10.1279 6.94873 9.76815C5.74821 9.02822 3.91632 7.00085 4.08566 5.50111C4.13322 5.07964 4.54925 4.24348 5.00657 4.16714H5.00709Z" fill={color}/>
  </Svg>
  );
}
export default function ProfileScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { user, logout } = useAuthStore();
    const { posts } = usePostStore();
    const { currentTheme } = useThemeStore();
    const { Colors, Spacing, FontSize, FontWeight, BorderRadius } = currentTheme;
    const insets = useSafeAreaInsets();

    const myPosts = posts.filter(p => p.hostId === user?.id);
    const isPro = true;
    const { getReputation } = useHostReputationStore();
    const hostRep = getReputation(user?.id || '');

    const handleSharePress = () => {
        const shareUrl = `https://bitebuddy.app/profile/${user?.id}`;
        const shareMessage = `👤 Check out my profile on Bite Buddy!\n${shareUrl}`;

        Alert.alert(
            'Share Profile',
            'Tell your friends about your food adventures!',
            [
                {
                    text: 'Share via...',
                    onPress: async () => {
                        try {
                            await Share.share({
                                message: shareMessage,
                                url: shareUrl,
                            });
                        } catch (error) {
                            console.error('Error sharing:', error);
                        }
                    },
                },
                {
                    text: 'Copy Link',
                    onPress: () => {
                        Clipboard.setString(shareUrl);
                        showMessage({
                            message: 'Link copied!',
                            type: 'success',
                        });
                    },
                },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors.background }]}>
            <BrandBar />
            
            {/* Header Actions */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                    <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '700' }}>Profile</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity onPress={handleSharePress} style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.backgroundCard, justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="share-social-outline" size={20} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.backgroundCard, justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="ellipsis-vertical-outline" size={20} color={Colors.textPrimary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* Profile Card matching Figma */}
                <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
                    {/* Upper row: Avatar on left, user info & stats on right */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                        {/* Avatar */}
                        <View style={{ position: 'relative' }}>
                            <View style={{
                                width: 88,
                                height: 88,
                                borderRadius: 44,
                                borderWidth: 2,
                                borderColor: Colors.primary,
                                overflow: 'hidden',
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: Colors.backgroundElevated
                            }}>
                                {user?.photoURL ? (
                                    <Image source={{ uri: user.photoURL }} style={{ width: '100%', height: '100%' }} />
                                ) : (
                                    <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.backgroundElevated }}>
                                        <Text style={{ fontSize: 40 }}>👤</Text>
                                    </View>
                                )}
                            </View>
                            {isPro && (
                                <LinearGradient 
                                    colors={['#FFD700', '#FFA500']} 
                                    style={{ 
                                        position: 'absolute', 
                                        bottom: 0, 
                                        right: 0, 
                                        width: 24, 
                                        height: 24, 
                                        borderRadius: 12, 
                                        borderWidth: 2, 
                                        borderColor: Colors.background, 
                                        justifyContent: 'center', 
                                        alignItems: 'center' 
                                    }}
                                >
                                    <Ionicons name="star" size={12} color="#FFF" />
                                </LinearGradient>
                            )}
                        </View>

                        {/* Details: Name, Handle, Stats */}
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <Text style={{ color: Colors.textPrimary, fontSize: 24, fontWeight: '900' }}>
                                    {user?.name}
                                </Text>
                                {user?.isVerified && (
                                    <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                                )}
                            </View>
                            <Text style={{ color: Colors.textMuted, fontSize: 14, fontWeight: '600', marginTop: 2 }}>
                                @{user?.name?.toLowerCase().replace(' ', '_')}
                            </Text>

                            {/* Stats right below the handle */}
                            <View style={{ flexDirection: 'row', gap: 32, marginTop: 10 }}>
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '900' }}>
                                        {myPosts.length}
                                    </Text>
                                    <Text style={{ color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginTop: 2, textTransform: 'uppercase' }}>
                                        PLANS
                                    </Text>
                                </View>

                                <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => navigation.navigate('FollowList')}>
                                    <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '900' }}>
                                        {(user?.followersCount || 0) + (user?.followingCount || 0)}
                                    </Text>
                                    <Text style={{ color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginTop: 2 }}>
                                        Buddies
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Divider line below the top row */}
                    <View style={{ height: 1, backgroundColor: Colors.border + '40', marginTop: 16, marginBottom: 6 }} />

                    {/* Slogan / Caption field */}
                    <Text style={{ color: Colors.textPrimary, fontSize: 14, fontWeight: '500', lineHeight: 20 }}>
                        {user?.slogan || "Add a slogan or caption..."}
                    </Text>

                    {/* Action buttons (Edit Profile & Share Profile) side-by-side */}
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                        <TouchableOpacity
                            style={{
                                flex: 1,
                                height: 44,
                                borderRadius: 8,
                                backgroundColor: Colors.primary,
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                            onPress={() => navigation.navigate('EditProfile')}
                        >
                            <Text style={{ color: '#000', fontWeight: '800', fontSize: 14 }}>Edit Profile</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={{
                                flex: 1,
                                height: 44,
                                borderRadius: 8,
                                backgroundColor: '#1C1B22',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: Colors.border + '30'
                            }}
                            onPress={handleSharePress}
                        >
                            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 14 }}>Share Profile</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* About Section */}
                <View style={styles.contentSection}>
                    <Text style={[styles.sectionTitle, { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 4 }]}>About</Text>
                    
                    {/* User Bio / About Us text */}
                    {user?.bio ? (
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{
                                color: '#E5E2E1',
                                fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'sans-serif',
                                fontSize: 14,
                                fontWeight: '500',
                                lineHeight: 28
                            }}>
                                {user.bio}
                            </Text>
                        </View>
                    ) : null}

                    <View style={{ gap: 16 }}>
                        {user?.profession && (
                            <DetailRowItem 
                                icon="briefcase" 
                                label="PROFESSION" 
                                value={user.profession} 
                            />
                        )}
                        {user?.city && (
                            <DetailRowItem 
                                icon="location" 
                                label="CITY" 
                                value={user.city} 
                            />
                        )}
                        {user?.dietaryPreference && (
                            <DetailRowItem 
                                icon="nutrition" 
                                label="DIETARY" 
                                value={user.dietaryPreference} 
                            />
                        )}
                        {user?.socialPreference && (
                            <DetailRowItem 
                                icon="people" 
                                label="SOCIAL VIBE" 
                                value={user.socialPreference} 
                            />
                        )}
                    </View>

                    {/* Personality / Vibe */}
                    {user?.personalityTags && user.personalityTags.length > 0 && (
                        <View style={{ marginTop: 24 }}>
                            <Text style={[styles.sectionTitle, { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 16 }]}>Vibe</Text>
                            <View style={styles.chipRow}>
                                {user.personalityTags.map(t => (
                                    <View key={t} style={{ backgroundColor: '#1C1B22', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, marginRight: 4, marginBottom: 4 }}>
                                        <Text style={{ color: Colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{t}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Reputation & Taste Points */}
                    <View style={{ marginTop: 24 }}>
                        <Text style={[styles.sectionTitle, { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 16 }]}>Reputation & Taste Points</Text>
                        <TouchableOpacity
                            style={[styles.repCard, { borderColor: 'rgba(255, 255, 255, 0.05)' }]}
                            onPress={() => navigation.navigate('HostRewards' as any, { hostId: user?.id })}
                            activeOpacity={0.85}
                        >
                            <RadialGlow />
                            <View style={styles.repRow}>
                                <View style={{ flex: 1, gap: 14 }}>
                                    {/* Level Badge and Points */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <View style={{
                                            backgroundColor: '#FFCC00',
                                            paddingVertical: 6,
                                            paddingHorizontal: 12,
                                            borderRadius: 6,
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}>
                                            <Text style={{ color: '#000', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }}>
                                                {getLevelTitle(hostRep.totalTastePoints).toUpperCase()}
                                            </Text>
                                        </View>
                                        <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '700' }}>
                                            {hostRep.totalTastePoints} pts · {hostRep.tier}
                                        </Text>
                                    </View>

                                    {/* Rating Details */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                        <GoldStarIcon width={16} height={16} />
                                        <Text style={{ color: '#FFF', fontSize: 24, fontWeight: 'bold', marginLeft: 3 }}>
                                            {hostRep.averageRating.toFixed(1)}
                                        </Text>
                                        <Text style={{ color: '#8E8D94', fontSize: 16, fontWeight: '500', marginLeft: 4 }}>
                                            avg · {hostRep.totalReviews} review{hostRep.totalReviews !== 1 ? 's' : ''}
                                        </Text>
                                    </View>
                                </View>

                                <View style={{ justifyContent: 'center', alignItems: 'center', paddingRight: 8 }}>
                                    <MedalRibbonIcon />
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
                
                {/* Dining Plans Section */}
                <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
                    <Text style={[styles.sectionTitle, { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 16 }]}>My Dining Plans</Text>

                    {myPosts.length > 0 ? (
                        <View style={{ gap: 16 }}>
                            {[...myPosts]
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .map(post => {
                                    return (
                                        <TouchableOpacity
                                            key={post.id}
                                            style={{
                                                backgroundColor: '#1C1B22',
                                                borderRadius: 16,
                                                padding: 20,
                                                gap: 16
                                            }}
                                            onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
                                            activeOpacity={0.75}
                                        >
                                            <View>
                                                <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '700' }} numberOfLines={1}>
                                                    {post.title}
                                                </Text>
                                                <Text style={{ color: Colors.textMuted, fontSize: 13, marginTop: 4 }}>
                                                    {post.cuisineTypes.join(', ')}
                                                </Text>
                                            </View>

                                            <View style={{ gap: 10 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                    <Ionicons name="calendar-outline" size={16} color="#FFCC00" />
                                                    <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600' }}>
                                                        {new Date(post.dateTime).toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase()}
                                                    </Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                    <View style={{ width: 16, alignItems: 'center' }}>
                                                        <PeopleCardIcon size={8} color="#FFCC00" />
                                                    </View>
                                                    <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600' }}>
                                                        {post.currentParticipants}/{post.maxGroupSize} JOINED
                                                    </Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                    <View style={{ width: 16, alignItems: 'center' }}>
                                                        <LocationIcon size={16} color="#FFCC00" />
                                                    </View>
                                                    <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                                                        {(`${post.area}, ${post.city}`).toUpperCase()}
                                                    </Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })
                            }
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="restaurant-outline" size={48} color={Colors.textMuted} />
                            <Text style={[styles.emptyText, { color: Colors.textMuted }]}>No dining plans created yet.</Text>
                            <TouchableOpacity
                                style={[styles.createBtn, { borderColor: Colors.primary }]}
                                onPress={() => navigation.navigate('CreatePost')}
                            >
                                <Text style={[styles.createBtnText, { color: Colors.primary }]}>Create first plan</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Private Information (Only visible to me) */}
                <View style={{ marginTop: 30, paddingHorizontal: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 16 }}>
                        <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '700' }}>
                            Private Information
                        </Text>
                        <Text style={{ fontSize: 11, color: Colors.textMuted }}>(Only you can see this)</Text>
                    </View>
                    <View style={{ gap: 16 }}>
                        {user?.email && (
                            <PrivateInfoRowItem iconNode={<PrivateMailIcon />} value={user.email} textColor={Colors.textPrimary} />
                        )}
                        {user?.phone && (
                            <PrivateInfoRowItem iconNode={<PrivatePhoneIcon />} value={user.phone} textColor={Colors.textPrimary} />
                        )}
                        {user?.instagramId && (
                            <PrivateInfoRowItem iconNode={<Text style={{ color: '#B9CCB2', fontSize: 16, fontWeight: '500' }}>@</Text>} value={user.instagramId.startsWith('@') ? user.instagramId : `@${user.instagramId}`} textColor={Colors.textPrimary} />
                        )}
                        {user?.twitterId && (
                            <PrivateInfoRowItem iconNode={<Text style={{ color: '#B9CCB2', fontSize: 16, fontWeight: '500', fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'sans-serif' }}>X</Text>} value={user.twitterId.startsWith('@') ? user.twitterId : `@${user.twitterId}`} textColor={Colors.textPrimary} />
                        )}
                        {user?.whatsappNumber && (
                            <PrivateInfoRowItem iconNode={<PrivateWhatsappIcon />} value={user.whatsappNumber} textColor={Colors.textPrimary} />
                        )}
                    </View>
                </View>

                <View style={{ height: 60 }} />
            </ScrollView>
        </View>
    );
}

function LocationIcon({ size = 16, color = '#FFCC00' }: any) {
  return (
    <Svg width={size * (14 / 17)} height={size} viewBox="0 0 14 17" fill="none">
        <Path d="M6.66667 8.33333C7.125 8.33333 7.51736 8.17014 7.84375 7.84375C8.17014 7.51736 8.33333 7.125 8.33333 6.66667C8.33333 6.20833 8.17014 5.81597 7.84375 5.48958C7.51736 5.16319 7.125 5 6.66667 5C6.20833 5 5.81597 5.16319 5.48958 5.48958C5.16319 5.81597 5 6.20833 5 6.66667C5 7.125 5.16319 7.51736 5.48958 7.84375C5.81597 8.17014 6.20833 8.33333 6.66667 8.33333ZM6.66667 14.4583C8.36111 12.9028 9.61806 11.4896 10.4375 10.2188C11.2569 8.94792 11.6667 7.81944 11.6667 6.83333C11.6667 5.31944 11.184 4.07986 10.2188 3.11458C9.25347 2.14931 8.06944 1.66667 6.66667 1.66667C5.26389 1.66667 4.07986 2.14931 3.11458 3.11458C2.14931 4.07986 1.66667 5.31944 1.66667 6.83333C1.66667 7.81944 2.07639 8.94792 2.89583 10.2188C3.71528 11.4896 4.97222 12.9028 6.66667 14.4583ZM6.66667 16.6667C4.43056 14.7639 2.76042 12.9965 1.65625 11.3646C0.552083 9.73264 0 8.22222 0 6.83333C0 4.75 0.670139 3.09028 2.01042 1.85417C3.35069 0.618055 4.90278 0 6.66667 0C8.43056 0 9.98264 0.618055 11.3229 1.85417C12.6632 3.09028 13.3333 4.75 13.3333 6.83333C13.3333 8.22222 12.7812 9.73264 11.6771 11.3646C10.5729 12.9965 8.90278 14.7639 6.66667 16.6667Z" fill={color}/>
    </Svg>
  );
}

function PeopleCardIcon({ size = 16, color = '#FFCC00' }: any) {
  return (
    <Svg width={size * 2} height={size} viewBox="0 0 20 10" fill="none">
        <Path d="M0 10V8.6875C0 8.09028 0.305556 7.60417 0.916667 7.22917C1.52778 6.85417 2.33333 6.66667 3.33333 6.66667C3.51389 6.66667 3.6875 6.67014 3.85417 6.67708C4.02083 6.68403 4.18056 6.70139 4.33333 6.72917C4.13889 7.02083 3.99306 7.32639 3.89583 7.64583C3.79861 7.96528 3.75 8.29861 3.75 8.64583V10H0ZM5 10V8.64583C5 8.20139 5.12153 7.79514 5.36458 7.42708C5.60764 7.05903 5.95139 6.73611 6.39583 6.45833C6.84028 6.18056 7.37153 5.97222 7.98958 5.83333C8.60764 5.69444 9.27778 5.625 10 5.625C10.7361 5.625 11.4132 5.69444 12.0312 5.83333C12.6493 5.97222 13.1806 6.18056 13.625 6.45833C14.0694 6.73611 14.4097 7.05903 14.6458 7.42708C14.8819 7.79514 15 8.20139 15 8.64583V10H5ZM16.25 10V8.64583C16.25 8.28472 16.2049 7.94444 16.1146 7.625C16.0243 7.30556 15.8889 7.00694 15.7083 6.72917C15.8611 6.70139 16.0174 6.68403 16.1771 6.67708C16.3368 6.67014 16.5 6.66667 16.6667 6.66667C17.6667 6.66667 18.4722 6.85069 19.0833 7.21875C19.6944 7.58681 20 8.07639 20 8.6875V10H16.25ZM6.77083 8.33333H13.25C13.1111 8.05556 12.7257 7.8125 12.0938 7.60417C11.4618 7.39583 10.7639 7.29167 10 7.29167C9.23611 7.29167 8.53819 7.39583 7.90625 7.60417C7.27431 7.8125 6.89583 8.05556 6.77083 8.33333ZM3.33333 5.83333C2.875 5.83333 2.48264 5.67014 2.15625 5.34375C1.82986 5.01736 1.66667 4.625 1.66667 4.16667C1.66667 3.69444 1.82986 3.29861 2.15625 2.97917C2.48264 2.65972 2.875 2.5 3.33333 2.5C3.80556 2.5 4.20139 2.65972 4.52083 2.97917C4.84028 3.29861 5 3.69444 5 4.16667C5 4.625 4.84028 5.01736 4.52083 5.34375C4.20139 5.67014 3.80556 5.83333 3.33333 5.83333ZM16.6667 5.83333C16.2083 5.83333 15.816 5.67014 15.4896 5.34375C15.1632 5.01736 15 4.625 15 4.16667C15 3.69444 15.1632 3.29861 15.4896 2.97917C15.816 2.65972 16.2083 2.5 16.6667 2.5C17.1389 2.5 17.5347 2.65972 17.8542 2.97917C18.1736 3.29861 18.3333 3.69444 18.3333 4.16667C18.3333 4.625 18.1736 5.01736 17.8542 5.34375C17.5347 5.67014 17.1389 5.83333 16.6667 5.83333ZM10 5C9.30556 5 8.71528 4.75694 8.22917 4.27083C7.74306 3.78472 7.5 3.19444 7.5 2.5C7.5 1.79167 7.74306 1.19792 8.22917 0.71875C8.71528 0.239583 9.30556 0 10 0C10.7083 0 11.3021 0.239583 11.7812 0.71875C12.2604 1.19792 12.5 1.79167 12.5 2.5C12.5 3.19444 12.2604 3.78472 11.7812 4.27083C11.3021 4.75694 10.7083 5 10 5ZM10 3.33333C10.2361 3.33333 10.434 3.25347 10.5938 3.09375C10.7535 2.93403 10.8333 2.73611 10.8333 2.5C10.8333 2.26389 10.7535 2.06597 10.5938 1.90625C10.434 1.74653 10.2361 1.66667 10 1.66667C9.76389 1.66667 9.56597 1.74653 9.40625 1.90625C9.24653 2.06597 9.16667 2.26389 9.16667 2.5C9.16667 2.73611 9.24653 2.93403 9.40625 3.09375C9.56597 3.25347 9.76389 3.33333 10 3.33333Z" fill={color}/>
    </Svg>
  );
}

const DetailRowItem = ({ icon, label, value }: { icon: 'briefcase' | 'location' | 'nutrition' | 'people'; label: string; value: string }) => {
    const renderIcon = () => {
        switch (icon) {
            case 'briefcase':
                return (
                    <Svg width={17} height={16} viewBox="0 0 17 16" fill="none">
                        <Path d="M1.66667 15.8333C1.20833 15.8333 0.815972 15.6701 0.489583 15.3438C0.163194 15.0174 0 14.625 0 14.1667V5C0 4.54167 0.163194 4.14931 0.489583 3.82292C0.815972 3.49653 1.20833 3.33333 1.66667 3.33333H5V1.66667C5 1.20833 5.16319 0.815972 5.48958 0.489583C5.81597 0.163194 6.20833 0 6.66667 0H10C10.4583 0 10.8507 0.163194 11.1771 0.489583C11.5035 0.815972 11.6667 1.20833 11.6667 1.66667V3.33333H15C15.4583 3.33333 15.8507 3.49653 16.1771 3.82292C16.5035 4.14931 16.6667 4.54167 16.6667 5V14.1667C16.6667 14.625 16.5035 15.0174 16.1771 15.3438C15.8507 15.6701 15.4583 15.8333 15 15.8333H1.66667ZM1.66667 14.1667H15V5H1.66667V14.1667ZM6.66667 3.33333H10V1.66667H6.66667V3.33333ZM1.66667 14.1667V5V14.1667Z" fill="#FFCC00"/>
                    </Svg>
                );
            case 'location':
                return (
                    <LocationIcon size={16} color="#FFCC00" />
                );
            case 'nutrition':
                return (
                    <Svg width={12} height={16} viewBox="0 0 12 16" fill="none">
                        <Path d="M5.83333 15.8484C4.20833 15.8484 2.82986 15.2824 1.69792 14.1505C0.565972 13.0186 0 11.6401 0 10.0151C0 8.70953 0.385417 7.53939 1.15625 6.50467C1.92708 5.46995 2.9375 4.77203 4.1875 4.41092C3.90972 4.34148 3.63889 4.24078 3.375 4.10884C3.11111 3.97689 2.875 3.80675 2.66667 3.59842C2.20833 3.14009 1.91319 2.59495 1.78125 1.963C1.64931 1.33106 1.61806 0.688697 1.6875 0.0359195C2.34028 -0.0335249 2.98264 -0.0022749 3.61458 0.12967C4.24653 0.261614 4.79167 0.556753 5.25 1.01509C5.56944 1.33453 5.80208 1.69564 5.94792 2.09842C6.09375 2.5012 6.1875 2.92481 6.22917 3.36925C6.40972 2.9387 6.62847 2.53245 6.88542 2.1505C7.14236 1.76856 7.43056 1.41786 7.75 1.09842C7.90278 0.945642 8.09722 0.869253 8.33333 0.869253C8.56944 0.869253 8.76389 0.945642 8.91667 1.09842C9.06944 1.2512 9.14583 1.44564 9.14583 1.68175C9.14583 1.91786 9.06944 2.11231 8.91667 2.26509C8.61111 2.57064 8.34028 2.90745 8.10417 3.2755C7.86806 3.64356 7.69444 4.03592 7.58333 4.45259C8.80556 4.84148 9.79167 5.54634 10.5417 6.56717C11.2917 7.588 11.6667 8.73731 11.6667 10.0151C11.6667 11.6401 11.1007 13.0186 9.96875 14.1505C8.83681 15.2824 7.45833 15.8484 5.83333 15.8484ZM5.83333 14.1818C6.98611 14.1818 7.96875 13.7755 8.78125 12.963C9.59375 12.1505 10 11.1679 10 10.0151C10 8.86231 9.59375 7.87967 8.78125 7.06717C7.96875 6.25467 6.98611 5.84842 5.83333 5.84842C4.68056 5.84842 3.69792 6.25467 2.88542 7.06717C2.07292 7.87967 1.66667 8.86231 1.66667 10.0151C1.66667 11.1679 2.07292 12.1505 2.88542 12.963C3.69792 13.7755 4.68056 14.1818 5.83333 14.1818Z" fill="#FFCC00"/>
                    </Svg>
                );
            case 'people':
                return (
                    <PeopleCardIcon size={10} color="#FFCC00" />
                );
        }
    };

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: '#111014',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16
            }}>
                {renderIcon()}
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{
                    color: '#B9CCB2',
                    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
                    fontSize: 10,
                    fontWeight: '400',
                    lineHeight: 16,
                    letterSpacing: 1.2,
                    textTransform: 'uppercase'
                }}>
                    {label}
                </Text>
                <Text style={{
                    color: '#E5E2E1',
                    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'sans-serif',
                    fontSize: 14,
                    fontWeight: '500',
                    lineHeight: 28,
                    marginTop: 2
                }}>
                    {value}
                </Text>
            </View>
        </View>
    );
};

const PrivateInfoRowItem = ({ iconNode, value, textColor }: any) => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
            width: 20,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 14
        }}>
            {iconNode}
        </View>
        <Text style={{ fontSize: 15, fontWeight: '500', color: textColor, fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'sans-serif' }}>{value}</Text>
    </View>
);
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    hero: {
        height: 180,
        paddingHorizontal: 20,
    },
    topActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    circleBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileCard: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    avatarContainer: {
        alignSelf: 'center',
        position: 'relative',
    },
    avatarBorder: {
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 6,
        overflow: 'hidden',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfo: {
        alignItems: 'center',
        marginTop: 12,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    userName: {
        fontSize: 24,
        fontWeight: '900',
    },
    userHandle: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
    },
    bio: {
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 18,
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 20,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
        paddingHorizontal: 10,
    },
    editBtn: {
        flex: 1,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editBtnText: {
        color: '#000',
        fontWeight: '800',
        fontSize: 15,
    },
    shareBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '900',
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginTop: 4,
    },
    autoApproveSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
        marginTop: 2
    },
    contentSection: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 4,
    },
    sectionHeader: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.6,
        marginBottom: 12,
    },
    postGrid: {
        gap: 12,
    },
    // ── Post Card Styles (matching UserProfileScreen) ──
    postCard: { flexDirection: 'row' as const, borderRadius: 16, borderWidth: 1, overflow: 'hidden' as const },
    postImage: { width: 90, height: 90, backgroundColor: '#E5E7EB' },
    postInfo: { flex: 1, padding: 12, justifyContent: 'center' as const, gap: 4 },
    postTopRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, gap: 8 },
    postTitle: { fontSize: 15, fontWeight: '800' as const, flex: 1 },
    postTag: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    postTagDot: { width: 6, height: 6, borderRadius: 3 },
    postTagText: { fontSize: 10, fontWeight: '800' as const, letterSpacing: 0.3 },
    postMeta: { fontSize: 12, fontWeight: '600' as const },
    postBottomRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, marginTop: 2 },
    postMetaItem: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 3 },
    postMetaText: { fontSize: 11, fontWeight: '600' as const },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 10,
    },
    createBtn: {
        marginTop: 20,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    createBtnText: {
        fontWeight: 'bold',
    },
    proCard: {
        position: 'absolute',
        left: 20,
        right: 20,
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    proBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    proBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    proInfo: {
        flex: 1,
        marginLeft: 12,
    },
    proTitle: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    proDesc: {
        fontSize: 12,
    },
    upgradeBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    upgradeBtnText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    // ── About Section ──
    detailsGrid: { padding: 16, borderRadius: 24, borderWidth: 1, gap: 16 },
    detailRow: { flexDirection: 'row', alignItems: 'center' },
    // ── Chips ──
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1 },
    chipTxt: { fontSize: 12, fontWeight: '700' },
    // ── Reputation Card ──
    repCard: { borderRadius: 12, borderWidth: 1, padding: 20, overflow: 'hidden', position: 'relative', backgroundColor: '#1C1B22' },
    repRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    repStat: { fontSize: 13, fontWeight: '600' },
    repRight: { alignItems: 'flex-end', gap: 6 },
    miniChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, maxWidth: 120 },
    miniChipTxt: { fontSize: 10, fontWeight: '700', flex: 1 },
});
