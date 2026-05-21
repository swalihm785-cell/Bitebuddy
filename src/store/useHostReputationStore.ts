import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HostReputation, HostTier, HostMilestone } from '../types';

const DEFAULT_MILESTONES: Omit<HostMilestone, 'unlocked'>[] = [
    { points: 100, title: 'Featured Host', icon: '🏅', description: 'Earn 100 Taste Points to get featured' },
    { points: 250, title: 'Dining Star', icon: '⭐', description: 'Recognized by the community' },
    { points: 500, title: 'Premium Dining Creator', icon: '🥇', description: 'Top-tier host status' },
    { points: 750, title: 'Culinary Maestro', icon: '👨‍🍳', description: 'Master of dining experiences' },
    { points: 1000, title: 'Elite Culinary Host', icon: '🏆', description: 'The highest honor for hosts' },
];

function computeTier(points: number): HostTier {
    if (points >= 1000) return 'Elite Culinary Host';
    if (points >= 500) return 'Star Chef';
    if (points >= 100) return 'Chef';
    return 'Sous Chef';
}

function buildMilestones(points: number): HostMilestone[] {
    return DEFAULT_MILESTONES.map((m) => ({ ...m, unlocked: points >= m.points }));
}

function buildBadges(points: number): string[] {
    const badges: string[] = [];
    if (points >= 100) badges.push('Featured Host');
    if (points >= 250) badges.push('Dining Star');
    if (points >= 500) badges.push('Premium Dining Creator');
    if (points >= 750) badges.push('Culinary Maestro');
    if (points >= 1000) badges.push('Elite Culinary Host');
    return badges;
}

function defaultReputation(hostId: string): HostReputation {
    return {
        hostId,
        totalTastePoints: 0,
        tier: 'Sous Chef',
        earnedBadges: [],
        milestones: buildMilestones(0),
        recentAwards: [],
        averageRating: 0,
        totalReviews: 0,
    };
}

interface HostReputationState {
    reputations: Record<string, HostReputation>;
    // Actions
    getReputation: (hostId: string) => HostReputation;
    awardTastePoints: (
        hostId: string,
        points: number,
        awardedBy: string,
        awardedByName: string,
        postId: string
    ) => void;
    updateRating: (hostId: string, newRating: number) => void;
}

const INITIAL_REPUTATIONS: Record<string, HostReputation> = {
    'swalih': {
        hostId: 'swalih',
        totalTastePoints: 650,
        tier: 'Star Chef',
        earnedBadges: ['Featured Host', 'Dining Star', 'Premium Dining Creator'],
        milestones: buildMilestones(650),
        recentAwards: [],
        averageRating: 4.8,
        totalReviews: 12
    },
    'roshan': {
        hostId: 'roshan',
        totalTastePoints: 120,
        tier: 'Chef',
        earnedBadges: ['Featured Host'],
        milestones: buildMilestones(120),
        recentAwards: [],
        averageRating: 4.5,
        totalReviews: 3
    }
};

export const useHostReputationStore = create<HostReputationState>()(
    persist(
        (set, get) => ({
            reputations: INITIAL_REPUTATIONS,

            getReputation: (hostId) => {
                return get().reputations[hostId] ?? defaultReputation(hostId);
            },

            awardTastePoints: (hostId, points, awardedBy, awardedByName, postId) => {
                set((state) => {
                    const existing = state.reputations[hostId] ?? defaultReputation(hostId);
                    const newTotal = existing.totalTastePoints + points;
                    const updated: HostReputation = {
                        ...existing,
                        totalTastePoints: newTotal,
                        tier: computeTier(newTotal),
                        earnedBadges: buildBadges(newTotal),
                        milestones: buildMilestones(newTotal),
                        recentAwards: [
                            {
                                awardedBy,
                                awardedByName,
                                points,
                                postId,
                                createdAt: new Date(),
                            },
                            ...existing.recentAwards.slice(0, 19), // keep latest 20
                        ],
                    };
                    return { reputations: { ...state.reputations, [hostId]: updated } };
                });
            },

            updateRating: (hostId, newRating) => {
                set((state) => {
                    const existing = state.reputations[hostId] ?? defaultReputation(hostId);
                    const totalReviews = existing.totalReviews + 1;
                    const averageRating =
                        (existing.averageRating * existing.totalReviews + newRating) / totalReviews;
                    const updated: HostReputation = { ...existing, totalReviews, averageRating };
                    return { reputations: { ...state.reputations, [hostId]: updated } };
                });
            },
        }),
        {
            name: 'bite-buddy-host-reputation-v8',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
