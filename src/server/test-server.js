// Simple test server to isolate the issue
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Test server is running!' });
});

app.get('/api/test', (req, res) => {
  res.json({ status: 'API working' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
