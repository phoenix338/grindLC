import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema({
    total: {
        type: Number,
        required: true,
        default: 0,
    }
});

const Visit = mongoose.model('Visit', visitSchema);
export default Visit;