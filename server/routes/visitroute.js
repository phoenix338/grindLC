import express from 'express';
import Visit from '../models/visit.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        let visitDoc = await Visit.findOne();

        if (!visitDoc) {
            visitDoc = new Visit({ total: 1 });
        } else {
            visitDoc.total += 1;
        }

        await visitDoc.save();
        res.json({ total: visitDoc.total });
    } catch (error) {
        console.error('Visit Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
