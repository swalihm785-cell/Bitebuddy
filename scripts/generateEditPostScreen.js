import fs from 'fs';
import path from 'path';

const createPath = '/Applications/Projects/Bite Buddy/BiteBuddy/src/screens/create/CreatePostScreen.tsx';
const editPath = '/Applications/Projects/Bite Buddy/BiteBuddy/src/screens/create/EditPostScreen.tsx';

let content = fs.readFileSync(createPath, 'utf8');

// 1. Rename component
content = content.replace('export default function CreatePostScreen() {', 'import { useRoute } from \'@react-navigation/native\';\nexport default function EditPostScreen() {');

// 2. Add route and post store logic
content = content.replace(
    'const { addPost, addInvite } = usePostStore();',
    `const { posts, updatePost } = usePostStore();
    const route = useRoute<any>();
    const { postId } = route.params;
    const postToEdit = posts.find(p => p.id === postId);`
);

// 3. Populate state
const stateInit = `
    useEffect(() => {
        if (postToEdit) {
            setTitle(postToEdit.title || '');
            setSelectedCuisines(postToEdit.cuisineTypes || []);
            setCuisineDescription(postToEdit.cuisineDescription || '');
            setRestaurant(postToEdit.restaurantName || '');
            setArea(postToEdit.area || '');
            setMinSize(postToEdit.minGroupSize || 2);
            setMaxSize(postToEdit.maxGroupSize || 4);
            setIsImmediate(postToEdit.isImmediate || false);
            setIsUrgent(postToEdit.isUrgent || false);
            setSelectedBudget(postToEdit.budgetRange || 'range2');
            setBudgetMin(postToEdit.budgetMin?.toString() || '');
            setBudgetMax(postToEdit.budgetMax?.toString() || '');
            
            // Try to split description into generic and budget parts if split by \n\n
            const descParts = (postToEdit.description || '').split('\\n\\n');
            if (descParts.length > 1) {
                setBudgetDescription(descParts.pop() || '');
                setDescription(descParts.join('\\n\\n') || '');
            } else {
                setDescription(postToEdit.description || '');
                setBudgetDescription('');
            }
            
            setVisibility(postToEdit.visibility || 'public');
            setDateTime(new Date(postToEdit.dateTime));
            setAutoApprove(postToEdit.autoApprove || false);
            setSelectedOthers(postToEdit.extras || []);
            setSelectedFoods(postToEdit.selectedFoodOptions || []);
            
            // Ensure any selected extras are in the OTHER_OPTIONS array
            const currentOtherValues = OTHER_OPTIONS.map(o => o.value);
            (postToEdit.extras || []).forEach(extra => {
                if (!currentOtherValues.includes(extra)) {
                    let labelName = extra.replace('custom_', '').replace(/_/g, ' ');
                    if (labelName.length > 0) labelName = labelName[0].toUpperCase() + labelName.substring(1);
                    OTHER_OPTIONS.push({ label: '✨ ' + labelName, value: extra });
                }
            });
        }
    }, [postToEdit]);
`;

// Insert after state declarations (around customOtherName)
content = content.replace('const [buddySearch, setBuddySearch] = useState(\'\');', 'const [buddySearch, setBuddySearch] = useState(\'\');\n' + stateInit);

// 4. Transform handlePublish into handleUpdate
content = content.replace('const handlePublish = () => {', 'const handleUpdate = () => {');
content = content.replace(/addPost\(newPost\);([\s\S]*?)navigation\.navigate\('PostDetail',\s*\{.*?\}\);/m,
    `if (!postToEdit) return;
    updatePost(postId, {
        title,
        cuisineTypes: selectedCuisines,
        cuisineDescription,
        restaurantName: restaurant || undefined,
        area,
        minGroupSize: minSize,
        maxGroupSize: maxSize,
        dateTime: isImmediate ? new Date().toISOString() : dateTime.toISOString(),
        isImmediate,
        isUrgent,
        budgetRange: selectedBudget,
        budgetMin: selectedBudget === 'custom' ? parseInt(budgetMin) || 0 : undefined,
        budgetMax: selectedBudget === 'custom' ? parseInt(budgetMax) || 0 : undefined,
        description: \`\${description}\\n\\n\${budgetDescription}\`.trim(),
        extras: selectedOthers,
        visibility,
        autoApprove,
        foodItems: selectedFoods.map(f => f.name),
        selectedFoodOptions: selectedFoods,
    });

    // Notify participants of update
    postToEdit.participants?.forEach(p => {
        if (p.id !== user?.id) {
            addNotification({
                userId: p.id,
                type: 'event',
                title: 'Dining Plan Updated',
                body: \`"\${title}" has been updated by the host.\`,
                data: {
                    postId,
                    prevTime: new Date(postToEdit.dateTime).toLocaleString(),
                    newTime: dateTime.toLocaleString()
                }
            });
        }
    });

    showMessage({
        message: "Success! 💾",
        description: "You have updated your dining plan successfully.",
        type: "success",
        icon: "success",
        duration: 3000,
    });

    navigation.goBack();`
);

// Remove the buddy networking stuff (Create invites logic) inside handleUpdate
content = content.replace(/\/\/ Create invites for selected buddies(?:.|\n)*?\/\/ Notify remaining Food Buddies \(not invited\)(?:.|\n)*?\}\);/, '');

// Replace texts in JSX
content = content.replace('<Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Create Dining Plan</Text>', '<Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Edit Dining Plan</Text>');
content = content.replace('onPress={handlePublish}', 'onPress={handleUpdate}');
content = content.replace('<Text style={styles.publishText}>Publish Dining Plan</Text>', '<Text style={styles.publishText}>Save Changes</Text>');

// Remove the "Invite Food Buddies" JSX Section completely
content = content.replace(/\{\/\* Invite Food Buddies \*\/\}(?:.|\n)*?\n\s+\}\)}/, '');


fs.writeFileSync(editPath, content, 'utf8');
console.log('EditPostScreen generated successfully based on CreatePostScreen');
