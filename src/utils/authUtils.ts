import { User } from '../types';

export const isCurrentlyPro = (user: User | null | undefined): boolean => {
    if (!user) return false;
    if (user.plan !== 'pro') return false;

    // If we have an expiry date, check it.
    // If subscriptionStatus is 'cancelled', it's still pro until expiry.
    // If it's undefined or something else, we assume it's currently active if plan is pro.
    if (user.subscriptionExpiryDate) {
        return new Date(user.subscriptionExpiryDate) > new Date();
    }

    return true;
};
