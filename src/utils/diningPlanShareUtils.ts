import { Share, Clipboard } from 'react-native';
import { DiningPost } from '../types';
import { showMessage } from 'react-native-flash-message';

export const getDiningPlanShareContent = (post: DiningPost) => {
    const shareUrl = `https://bitebuddy.app/post/${post.id}`;
    const date = new Date(post.dateTime).toLocaleString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const message = `🍽️ Join my dining plan on Bite Buddy!

📌 ${post.title}
📍 ${post.restaurantName || post.area}
⏰ ${date}
📝 ${post.description || 'Come join us for a great meal!'}

Join here: ${shareUrl}`;

    return {
        message,
        url: shareUrl,
        title: post.title
    };
};

export const handleDiningPlanShare = async (post: DiningPost) => {
    const { message, url, title } = getDiningPlanShareContent(post);
    try {
        await Share.share({
            message,
            url,
            title
        });
    } catch (error) {
        console.error('Error sharing dining plan:', error);
    }
};

export const handleDiningPlanCopyLink = (post: DiningPost) => {
    const shareUrl = `https://bitebuddy.app/post/${post.id}`;
    Clipboard.setString(shareUrl);
    showMessage({
        message: 'Link Copied!',
        description: 'Dining plan link copied to clipboard.',
        type: 'success',
        icon: 'success'
    });
};
