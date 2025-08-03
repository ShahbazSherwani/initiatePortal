// Progressive server.js - adding Firebase and DB
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK using environment variables
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`,
  universe_domain: "googleapis.com"
};

// Initialize Firebase Admin SDK
if (serviceAccount.project_id && serviceAccount.private_key && serviceAccount.client_email) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('Firebase Admin SDK initialized successfully');
} else {
  console.error('Firebase configuration missing. Please check environment variables.');
  console.error('Required: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL');
}

// Initialize Postgres client (Supabase)
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,  // Supabase requires SSL
  },
  // Optional: Configure pool settings for better performance
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Server with Firebase and DB is running successfully!' });
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
  console.log(`Progressive server running on port ${PORT}`);
});
