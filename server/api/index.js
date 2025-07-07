import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import serverless from 'serverless-http';

import connectDB from '../db.js';
import problemRoutes from '../routes/problemRoute.js';
import feedbackRoutes from '../routes/feedbackroute.js';
import visitRoutes from '../routes/visitroute.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.get('/', (req, res) => {
    res.send('✅ Backend is running!');
});

app.use('/problems', problemRoutes);
app.use('/feedback', feedbackRoutes);
app.use('/visits', visitRoutes);

export const handler = serverless(app);
