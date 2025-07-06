import express from 'express';
import { submitFeedback } from '../controllers/feedbackcontroller.js';

const router = express.Router();

router.post('/submit', submitFeedback);

export default router; 