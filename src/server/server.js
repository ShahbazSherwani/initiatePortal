// Minimal server.js to identify the issue
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running successfully!' });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ status: 'API working', timestamp: new Date().toISOString() });
});

// Simple parameterized route to test
app.get('/api/test/:id', (req, res) => {
  res.json({ id: req.params.id, message: 'Parameter route working' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Minimal server running on port ${PORT}`);
});
