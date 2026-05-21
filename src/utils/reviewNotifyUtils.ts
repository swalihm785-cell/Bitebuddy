import { DiningPost } from '../types';
import { useNotificationStore } from '../store/useNotificationStore';
import { useReviewStore } from '../store/useReviewStore';

/**
 * Send a single combined "review request" notification to every participant
 * (host + guests) when a dining event has just been completed.
 *
 * The notification text intentionally mentions BOTH the dining experience and
 * the host appreciation, so the user knows that one tap handles both:
 * the dedicated `DiningReview` screen captures the overall dining rating,
 * food/atmosphere/host sub-ratings AND the taste-points awarded to the host.
 *
 * Idempotent — if a `review_request` notification for the same `postId` has
 * already been sent to a user, it will not be duplicated.
 */
export function notifyParticipantsForReview(post: DiningPost) {
    const { notifications, addNotification } = useNotificationStore.getState();
    const { hasUserReviewedPost } = useReviewStore.getState();

    const alreadySentFor = (userId: string) =>
        notifications.some(
            n =>
                n.type === 'review_request' &&
                n.userId === userId &&
                n.data?.postId === post.id
        );

    const recipients = post.participants || [];

    recipients.forEach(p => {
        // Skip if this participant has already reviewed or already been pinged
        if (alreadySentFor(p.id)) return;
        if (hasUserReviewedPost(post.id, p.id)) return;

        const isHost = p.id === post.hostId;

        addNotification({
            userId: p.id,
            type: 'review_request',
            title: 'How was your dining?',
            // ONE combined message that covers both dining + host review.
            body: isHost
                ? `Your dining "${post.title}" just wrapped. See your participants' reviews and Taste Points awards.`
                : `Share your "${post.title}" experience — rate the dining and award Taste Points to your host.`,
            data: {
                postId: post.id,
                hostId: post.hostId,
                kind: 'dining_and_host',
            },
        });
    });
}

/**
 * Detect whether a post just transitioned to a completed state based on the
 * scheduled date-time. A dining is considered ended 2 hours after the start
 * (consistent with the PostDetail screen's `isCompleted` calculation).
 */
export function isPostJustCompleted(post: DiningPost, graceMs = 2 * 60 * 60 * 1000): boolean {
    if (post.status === 'cancelled') return false;
    const start = post.dateTime instanceof Date ? post.dateTime : new Date(post.dateTime);
    const end = new Date(start.getTime() + graceMs);
    return Date.now() > end.getTime();
}
