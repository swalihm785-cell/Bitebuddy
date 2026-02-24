import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Offer {
    id: string;
    title: string;
    placeName: string; // Hotel/Restaurant Name
    discountDetails: string;
    expiryDate: string; // ISO String
    location: string;
    imageUrl: string;
    isSaved?: boolean;
}

const MOCK_OFFERS: Offer[] = [
    {
        id: 'o1',
        title: 'Weekend Getaway Deal',
        placeName: 'The Grand Royale',
        discountDetails: '30% Off Stay + Free Breakfast',
        expiryDate: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
        location: 'Downtown City Center',
        imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    },
    {
        id: 'o2',
        title: 'Taco Tuesday Special',
        placeName: 'El Camino Cantina',
        discountDetails: 'Buy 1 Get 1 Free Tacos',
        expiryDate: new Date(Date.now() + 86400000 * 1).toISOString(),
        location: 'Westside Market',
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    },
    {
        id: 'o3',
        title: 'Happy Hour Beverages',
        placeName: 'The Local Pub',
        discountDetails: '50% off all draft beers',
        expiryDate: new Date(Date.now() - 86400000 * 2).toISOString(), // EXPIRED 2 days ago
        location: 'East Village',
        imageUrl: 'https://images.unsplash.com/photo-1571115177098-24c424d32ba1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    },
    {
        id: 'o4',
        title: 'Gourmet Dinner Set',
        placeName: 'Le Petit Chef',
        discountDetails: '20% Off 5-Course Meal',
        expiryDate: new Date(Date.now() + 86400000 * 7).toISOString(),
        location: 'Uptown District',
        imageUrl: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    },
];

interface OffersState {
    offers: Offer[];
    savedOfferIds: string[];
    toggleSaveOffer: (id: string) => void;
    deleteExpiredOffers: () => void;
}

export const useOffersStore = create<OffersState>()(
    persist(
        (set, get) => ({
            offers: MOCK_OFFERS,
            savedOfferIds: [],
            toggleSaveOffer: (id) => {
                set((state) => {
                    const exists = state.savedOfferIds.includes(id);
                    if (exists) {
                        return { savedOfferIds: state.savedOfferIds.filter(savedId => savedId !== id) };
                    } else {
                        return { savedOfferIds: [...state.savedOfferIds, id] };
                    }
                });
            },
            deleteExpiredOffers: () => {
                const now = new Date().toISOString();
                set((state) => ({
                    offers: state.offers.filter(offer => offer.expiryDate > now)
                }));
            }
        }),
        {
            name: 'bite-buddy-offers',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
