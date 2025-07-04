import express from 'express'
import cors from 'cors'
import connectDB from './db.js'
import dotenv from 'dotenv'
const app = express();
const PORT = process.env.PORT;

connectDB();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Backend is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
import problemRoutes from './routes/problemRoute.js';
app.use('/api/problems', problemRoutes);