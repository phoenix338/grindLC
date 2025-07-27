import express from 'express'
import cors from 'cors'
import connectDB from './db.js'
import dotenv from 'dotenv'
const app = express();
const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0';
connectDB();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Backend is running!');
});

app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
});
import problemRoutes from './routes/problemRoute.js';
import feedbackRoutes from './routes/feedbackroute.js';
import favoriteRoutes from './routes/favoriteRoute.js';

app.use('/api/problems', problemRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/favorites', favoriteRoutes);
import visitRoutes from './routes/visitroute.js';

app.use('/api/visits', visitRoutes);