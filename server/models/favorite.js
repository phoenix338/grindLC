import mongoose from 'mongoose'

const favoriteSchema = new mongoose.Schema({
    problemId: {
        type: Number,
        required: true
    },
    userId: {
        type: String,
        required: true,
        default: 'default' // For now, using a default user ID
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure a user can't favorite the same problem twice
favoriteSchema.index({ problemId: 1, userId: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);
export default Favorite; 