const API_BASE_URL = import.meta.env.VITE_API_URL;

export const fetchFavorites = async (userId = 'default') => {
    try {
        const response = await fetch(`${API_BASE_URL}/favorites/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch favorites');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return [];
    }
};

export const addToFavorites = async (problemId, userId = 'default') => {
    try {
        console.log('Adding to favorites:', problemId, 'for user:', userId);
        const response = await fetch(`${API_BASE_URL}/favorites`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ problemId, userId }),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add to favorites');
        }

        const result = await response.json();
        console.log('Successfully added to favorites:', result);
        return result;
    } catch (error) {
        console.error('Error adding to favorites:', error);
        throw error;
    }
};

export const removeFromFavorites = async (problemId, userId = 'default') => {
    try {
        console.log('Removing from favorites:', problemId, 'for user:', userId);
        const response = await fetch(`${API_BASE_URL}/favorites/${problemId}/${userId}`, {
            method: 'DELETE',
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to remove from favorites');
        }
        
        const result = await response.json();
        console.log('Successfully removed from favorites:', result);
        return result;
    } catch (error) {
        console.error('Error removing from favorites:', error);
        throw error;
    }
};

export const checkFavoriteStatus = async (problemId, userId = 'default') => {
    try {
        const response = await fetch(`${API_BASE_URL}/favorites/check/${problemId}/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to check favorite status');
        }
        const data = await response.json();
        return data.isFavorited;
    } catch (error) {
        console.error('Error checking favorite status:', error);
        return false;
    }
}; 