import express from 'express';
import cors from 'cors';
import { verifyToken } from './middleware/auth';
import profileRoutes from './routes/profile';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Protect profile routes
app.use('/api/profile', verifyToken, profileRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API listening on port ${PORT}`));