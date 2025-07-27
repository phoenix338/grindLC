import express from 'express'
const router = express.Router();
import Favorite from '../models/favorite.js';

// Get all favorites for a user
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const favorites = await Favorite.find({ userId });
        const favoriteIds = favorites.map(fav => fav.problemId);
        res.json(favoriteIds);
    } catch (err) {
        console.error('Error fetching favorites:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add a problem to favorites
router.post('/', async (req, res) => {
    try {
        const { problemId, userId = 'default' } = req.body;

        if (!problemId) {
            return res.status(400).json({ error: 'Problem ID is required' });
        }

        const favorite = new Favorite({
            problemId,
            userId
        });

        await favorite.save();
        res.status(201).json({ message: 'Problem added to favorites' });
    } catch (err) {
        if (err.code === 11000) {
            // Duplicate key error - problem already favorited
            res.status(409).json({ error: 'Problem already in favorites' });
        } else {
            console.error('Error adding to favorites:', err.message);
            res.status(500).json({ error: 'Server error' });
        }
    }
});

// Remove a problem from favorites
router.delete('/:problemId/:userId', async (req, res) => {
    try {
        const { problemId, userId } = req.params;
        const result = await Favorite.findOneAndDelete({
            problemId: Number(problemId),
            userId: userId || 'default'
        });

        if (!result) {
            return res.status(404).json({ error: 'Favorite not found' });
        }

        res.json({ message: 'Problem removed from favorites' });
    } catch (err) {
        console.error('Error removing from favorites:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Check if a problem is favorited
router.get('/check/:problemId/:userId', async (req, res) => {
    try {
        const { problemId, userId } = req.params;
        const favorite = await Favorite.findOne({
            problemId: Number(problemId),
            userId: userId || 'default'
        });

        res.json({ isFavorited: !!favorite });
    } catch (err) {
        console.error('Error checking favorite status:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router; 