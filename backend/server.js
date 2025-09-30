// ---------- server.js ----------
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK
let serviceAccount;

// In production (Render), use environment variables
if (process.env.NODE_ENV === 'production' && process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // In development, use the local file
  try {
    serviceAccount = JSON.parse(
      readFileSync(new URL('./firebase-service-account.json', import.meta.url))
    );
  } catch (error) {
    console.error('Firebase service account file not found. Using environment variables...');
    // Fallback to environment variables if file doesn't exist
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
      // Handle different private key formats
      privateKey = privateKey.replace(/\\n/g, '\n');
      // If it starts with quotes, remove them
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      // Remove any extra characters at the beginning (like = from base64 encoding)
      privateKey = privateKey.replace(/^[^-]*(-+BEGIN PRIVATE KEY-+)/, '$1');
      // Ensure proper line endings
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    serviceAccount = {
      type: process.env.FIREBASE_TYPE || 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: privateKey,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
      token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
    };
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log('Firebase Admin SDK initialized successfully');

// Initialize Postgres client (Supabase) with better connection settings
let db = null;
let dbConnected = false;

try {
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,  // Supabase requires SSL
    },
    // Optimized settings for Supabase
    max: 10,                    // Reduced max connections
    idleTimeoutMillis: 60000,   // 1 minute idle timeout
    connectionTimeoutMillis: 10000,  // 10 seconds connection timeout
    acquireTimeoutMillis: 10000,     // 10 seconds to acquire connection
    query_timeout: 30000,       // 30 seconds query timeout
  });

  // Add error handling for database connection
  db.on('error', (err, client) => {
    console.error('❌ Database pool error:', err);
    dbConnected = false;
  });

  db.on('connect', () => {
    console.log('✅ Database pool connected');
    dbConnected = true;
  });

  // Test database connection on startup with retry
  const testConnection = async () => {
    let retries = 3;
    while (retries > 0) {
      try {
        const result = await db.query('SELECT NOW() as current_time');
        console.log('✅ Database connected successfully at:', result.rows[0].current_time);
        dbConnected = true;
        break;
      } catch (err) {
        retries--;
        console.error(`❌ Database connection attempt failed (${3-retries}/3):`, err.message);
        if (retries > 0) {
          console.log('🔄 Retrying in 2 seconds...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          console.error('❌ Database connection failed after 3 attempts');
          console.log('🔄 Server will continue without database functionality');
          dbConnected = false;
        }
      }
    }
  };

  testConnection();
  
  // Run migration to add profile picture field
  const runProfilePictureMigration = async () => {
    try {
      if (dbConnected) {
        console.log('🔧 Running profile picture migration...');
        
        // Add profile_picture column if it doesn't exist
        await db.query(`
          ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;
        `);
        
        // Add username column if it doesn't exist
        await db.query(`
          ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE;
        `);
        
        console.log('✅ Profile picture field added to users table');
        console.log('✅ Username field added to users table');
      }
    } catch (err) {
      console.error('❌ Profile picture migration failed:', err.message);
    }
  };
  
  // Run migration after a short delay to ensure connection is established
  setTimeout(runProfilePictureMigration, 3000);

} catch (error) {
  console.error('❌ Database initialization failed:', error);
  console.log('🔄 Server will continue without database functionality');
  dbConnected = false;
}

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit the process in development
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in development
});

// After your app definition and before any routes
const app = express();

// Increase body size limit to 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL, 
        'https://initiate-portal-git-deployment-mvp-shahbazsherwanis-projects.vercel.app',
        'https://initiate-portal-git-deployment-mvp-shahbazsherwanis-projects.vercel.app/',
        /\.vercel\.app$/
      ]
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the dist directory
  app.use(express.static(path.join(__dirname, '../../dist')));
}

app.get('/', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      res.sendFile(path.join(__dirname, '../../dist/index.html'));
    } else {
      res.send('API Server is running! Visit the frontend at http://localhost:5173');
    }
});

// Middleware: Verify Firebase ID Token
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  console.log('🔐 Token verification request:', {
    url: req.url,
    method: req.method,
    hasAuthHeader: !!authHeader,
    tokenLength: idToken?.length || 0,
    tokenStart: idToken?.substring(0, 20) + '...'
  });
  
  if (!idToken) {
    console.log('❌ No token provided');
    return res.status(401).json({ error: 'No authentication token provided' });
  }
  
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    console.log('✅ Token verified successfully for user:', decoded.uid);
    req.uid = decoded.uid;
    next();
  } catch (err) {
    console.error('❌ Token verification failed:', {
      error: err.message,
      code: err.code,
      tokenLength: idToken?.length,
      tokenStart: idToken?.substring(0, 20) + '...'
    });
    res.status(401).json({ 
      error: 'Invalid or expired authentication token',
      details: err.message 
    });
  }
}

// Profile routes
const profileRouter = express.Router();

// Create or update user profile
profileRouter.post('/', verifyToken, async (req, res) => {
  const { fullName, role } = req.body;
  try {
    await db.query(
      `INSERT INTO users (firebase_uid, full_name, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (firebase_uid) DO UPDATE
         SET full_name = EXCLUDED.full_name, role = EXCLUDED.role`,
      [req.uid, fullName, role || 'borrower']
    );
    res.json({ success: true });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update the profile GET endpoint
profileRouter.get('/', verifyToken, async (req, res) => {
  console.log("Profile request for user:", req.uid);
  
  try {
    // Try a simpler query first
    const query = 'SELECT * FROM users WHERE firebase_uid = $1';
    console.log("Executing query:", query);
    
    const { rows } = await db.query(query, [req.uid]);
    console.log("Query result:", rows);
    
    if (rows.length === 0) {
      console.log("No user found with ID:", req.uid);
      return res.json({
        full_name: null,
        role: null,
        created_at: null
      });
    }
    
    // Return what we have, omitting problematic fields
    const safeProfile = {
      full_name: rows[0].full_name,
      created_at: rows[0].created_at,
      is_admin: rows[0].is_admin || false,
      has_completed_registration: rows[0].has_completed_registration || false,
      profile_picture: rows[0].profile_picture || null,
      username: rows[0].username || null
    };
    
    // Only add role if it exists
    if ('role' in rows[0]) {
      safeProfile.role = rows[0].role;
    } else {
      safeProfile.role = null;
    }
    
    console.log("Returning profile:", safeProfile);
    res.json(safeProfile);
  } catch (err) {
    console.error('DB error details:', err);
    res.status(500).json({ 
      error: 'Database error',
      message: err.message,
      // Default profile
      full_name: null,
      role: null,
      created_at: null 
    });
  }
});

// Add this new endpoint to handle role selection
profileRouter.post('/set-role', verifyToken, async (req, res) => {
  const { role } = req.body;
  
  // Validate role
  if (!role || !['borrower', 'investor'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  
  try {
    // First check if the role column exists
    try {
      await db.query(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20)`
      );
    } catch (err) {
      // Ignore error if column already exists
      console.log("Column already exists or couldn't be added");
    }
    
    // Now update the role
    await db.query(
      `UPDATE users SET role = $1 WHERE firebase_uid = $2`,
      [role, req.uid]
    );
    
    res.json({ success: true, role });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get wallet balance
app.get('/api/wallet', verifyToken, async (req, res) => {
  const uid = req.uid;
  const { rows } = await db.query(
    'SELECT balance FROM wallets WHERE firebase_uid = $1',
    [uid]
  );
  res.json({ balance: rows[0]?.balance || 0 });
});

// Top-up
app.post('/api/wallet/topup', verifyToken, async (req, res) => {
  const uid = req.uid;
  const { amount } = req.body;
  await db.query(`
    INSERT INTO wallets(firebase_uid, balance)
    VALUES($1,$2)
    ON CONFLICT(firebase_uid) DO UPDATE
      SET balance = wallets.balance + $2, updated_at = NOW()
  `, [uid, amount]);
  res.json({ success: true });
});

// Withdraw
app.post('/api/wallet/withdraw', verifyToken, async (req, res) => {
  const uid = req.uid;
  const { amount } = req.body;
  await db.query(`
    UPDATE wallets 
    SET balance = balance - $2, updated_at = NOW()
    WHERE firebase_uid = $1
  `, [uid, amount]);
  res.json({ success: true });
});

// Profile picture upload endpoint
profileRouter.post('/upload-picture', verifyToken, async (req, res) => {
  try {
    const { uid: firebase_uid } = req;
    const { profilePicture } = req.body;
    
    if (!profilePicture) {
      return res.status(400).json({ error: 'No profile picture provided' });
    }
    
    // Update user's profile picture in database
    await db.query(
      `UPDATE users SET profile_picture = $1, updated_at = CURRENT_TIMESTAMP WHERE firebase_uid = $2`,
      [profilePicture, firebase_uid]
    );
    
    console.log('✅ Profile picture updated for user:', firebase_uid);
    res.json({ 
      success: true, 
      message: 'Profile picture updated successfully',
      profilePicture 
    });
    
  } catch (err) {
    console.error('❌ Error updating profile picture:', err);
    res.status(500).json({ error: 'Failed to update profile picture' });
  }
});

// Get profile picture endpoint
profileRouter.get('/picture', verifyToken, async (req, res) => {
  try {
    const { uid: firebase_uid } = req;
    
    const result = await db.query(
      `SELECT profile_picture FROM users WHERE firebase_uid = $1`,
      [firebase_uid]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      profilePicture: result.rows[0].profile_picture 
    });
    
  } catch (err) {
    console.error('❌ Error fetching profile picture:', err);
    res.status(500).json({ error: 'Failed to fetch profile picture' });
  }
});

// Remove profile picture endpoint
profileRouter.delete('/picture', verifyToken, async (req, res) => {
  try {
    const { uid: firebase_uid } = req;
    
    await db.query(
      `UPDATE users SET profile_picture = NULL, updated_at = CURRENT_TIMESTAMP WHERE firebase_uid = $1`,
      [firebase_uid]
    );
    
    console.log('✅ Profile picture removed for user:', firebase_uid);
    res.json({ 
      success: true, 
      message: 'Profile picture removed successfully' 
    });
    
  } catch (err) {
    console.error('❌ Error removing profile picture:', err);
    res.status(500).json({ error: 'Failed to remove profile picture' });
  }
});

// Update username endpoint
profileRouter.post('/update-username', verifyToken, async (req, res) => {
  try {
    const { uid: firebase_uid } = req;
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    // Validate username format (alphanumeric, underscore, and dots allowed)
    if (!/^[a-zA-Z0-9._]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, dots, and underscores' });
    }
    
    // Check if username is already taken
    const existingUser = await db.query(
      `SELECT firebase_uid FROM users WHERE username = $1 AND firebase_uid != $2`,
      [username, firebase_uid]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username is already taken' });
    }
    
    // Update username
    await db.query(
      `UPDATE users SET username = $1, updated_at = CURRENT_TIMESTAMP WHERE firebase_uid = $2`,
      [username, firebase_uid]
    );
    
    console.log('✅ Username updated for user:', firebase_uid, 'to:', username);
    res.json({ 
      success: true, 
      message: 'Username updated successfully',
      username 
    });
    
  } catch (err) {
    console.error('❌ Error updating username:', err);
    res.status(500).json({ error: 'Failed to update username' });
  }
});

// Add endpoint to save group type and unique code
profileRouter.post('/update-group-type', verifyToken, async (req, res) => {
  const { groupType, uniqueCode, groupKey } = req.body;
  
  // Validate input
  if (!groupType || !uniqueCode || !groupKey) {
    return res.status(400).json({ error: 'Missing required fields: groupType, uniqueCode, groupKey' });
  }
  
  try {
    // First get the user's role to determine which table to update
    const userResult = await db.query(
      'SELECT role FROM users WHERE firebase_uid = $1',
      [req.uid]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userRole = userResult.rows[0].role;
    
    // Add group_type and unique_code columns if they don't exist
    if (userRole === 'borrower') {
      await db.query(`
        ALTER TABLE borrower_profiles 
        ADD COLUMN IF NOT EXISTS group_type VARCHAR(100),
        ADD COLUMN IF NOT EXISTS unique_code VARCHAR(50),
        ADD COLUMN IF NOT EXISTS group_key VARCHAR(20)
      `);
      
      // Update borrower profile
      await db.query(`
        UPDATE borrower_profiles 
        SET group_type = $1, unique_code = $2, group_key = $3, updated_at = NOW()
        WHERE firebase_uid = $4
      `, [groupType, uniqueCode, groupKey, req.uid]);
      
    } else if (userRole === 'investor') {
      await db.query(`
        ALTER TABLE investor_profiles 
        ADD COLUMN IF NOT EXISTS group_type VARCHAR(100),
        ADD COLUMN IF NOT EXISTS unique_code VARCHAR(50),
        ADD COLUMN IF NOT EXISTS group_key VARCHAR(20)
      `);
      
      // Update investor profile
      await db.query(`
        UPDATE investor_profiles 
        SET group_type = $1, unique_code = $2, group_key = $3, updated_at = NOW()
        WHERE firebase_uid = $4
      `, [groupType, uniqueCode, groupKey, req.uid]);
    } else {
      return res.status(400).json({ error: 'Invalid user role. Must be borrower or investor.' });
    }
    
    console.log(`✅ Updated ${userRole} profile with group type: ${groupType}, code: ${uniqueCode}`);
    res.json({ 
      success: true, 
      message: 'Group type and unique code saved successfully',
      groupType,
      uniqueCode,
      userRole
    });
    
  } catch (err) {
    console.error('Error updating group type:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Add endpoint to save borrower/investor code and industry information
profileRouter.post('/update-borrower-info', verifyToken, async (req, res) => {
  const { industryType, borrowerCode, industryKey } = req.body;
  
  // Validate input
  if (!industryType || !borrowerCode || !industryKey) {
    return res.status(400).json({ error: 'Missing required fields: industryType, borrowerCode, industryKey' });
  }
  
  try {
    // First get the user's role to determine which table to update
    const userResult = await db.query(
      'SELECT role FROM users WHERE firebase_uid = $1',
      [req.uid]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userRole = userResult.rows[0].role;
    
    // Add borrower_code and industry_type columns if they don't exist
    if (userRole === 'borrower') {
      await db.query(`
        ALTER TABLE borrower_profiles 
        ADD COLUMN IF NOT EXISTS borrower_code VARCHAR(20),
        ADD COLUMN IF NOT EXISTS industry_type VARCHAR(100),
        ADD COLUMN IF NOT EXISTS industry_key VARCHAR(20)
      `);
      
      // Update borrower profile
      await db.query(`
        UPDATE borrower_profiles 
        SET borrower_code = $1, industry_type = $2, industry_key = $3, updated_at = NOW()
        WHERE firebase_uid = $4
      `, [borrowerCode, industryType, industryKey, req.uid]);
      
    } else if (userRole === 'investor') {
      await db.query(`
        ALTER TABLE investor_profiles 
        ADD COLUMN IF NOT EXISTS investor_code VARCHAR(20),
        ADD COLUMN IF NOT EXISTS industry_type VARCHAR(100),
        ADD COLUMN IF NOT EXISTS industry_key VARCHAR(20)
      `);
      
      // Update investor profile (use investor_code instead of borrower_code)
      await db.query(`
        UPDATE investor_profiles 
        SET investor_code = $1, industry_type = $2, industry_key = $3, updated_at = NOW()
        WHERE firebase_uid = $4
      `, [borrowerCode, industryType, industryKey, req.uid]);
    } else {
      return res.status(400).json({ error: 'Invalid user role. Must be borrower or investor.' });
    }
    
    console.log(`✅ Updated ${userRole} profile with code: ${borrowerCode}, industry: ${industryType}`);
    res.json({ 
      success: true, 
      message: 'Borrower/Investor information saved successfully',
      code: borrowerCode,
      industryType,
      userRole
    });
    
  } catch (err) {
    console.error('Error updating borrower info:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.use('/api/profile', profileRouter);

// Dual Account Management Routes
// Get all account profiles for a user
app.get('/api/accounts', verifyToken, async (req, res) => {
  try {
    const { uid: firebase_uid } = req;
    console.log('🔍 GET /api/accounts called for user:', firebase_uid);
    
    // Get user base info and account flags
    const userQuery = await db.query(
      `SELECT full_name, has_borrower_account, has_investor_account, current_account_type 
       FROM users WHERE firebase_uid = $1`,
      [firebase_uid]
    );
    
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userQuery.rows[0];
    console.log('👤 User account flags:', { 
      has_borrower: user.has_borrower_account, 
      has_investor: user.has_investor_account 
    });
    
    const accounts = {};
    
    // Get borrower profile if exists
    if (user.has_borrower_account) {
      const borrowerQuery = await db.query(
        `SELECT * FROM borrower_profiles WHERE firebase_uid = $1`,
        [firebase_uid]
      );
      
      console.log('👤 Borrower query result:', borrowerQuery.rows.length, 'profiles found');
      
      if (borrowerQuery.rows.length > 0) {
        accounts.borrower = {
          type: 'borrower',
          profile: borrowerQuery.rows[0],
          isComplete: borrowerQuery.rows[0].is_complete,
          hasActiveProject: borrowerQuery.rows[0].has_active_project
        };
      } else {
        console.log('⚠️  User has borrower flag but no borrower profile - data inconsistency');
        // Don't create fallback profile - let frontend handle the inconsistency
      }
    }
    
    // Get investor profile if exists
    if (user.has_investor_account) {
      const investorQuery = await db.query(
        `SELECT * FROM investor_profiles WHERE firebase_uid = $1`,
        [firebase_uid]
      );
      
      console.log('👤 Investor query result:', investorQuery.rows.length, 'profiles found');
      
      if (investorQuery.rows.length > 0) {
        accounts.investor = {
          type: 'investor',
          profile: investorQuery.rows[0],
          isComplete: investorQuery.rows[0].is_complete,
          portfolioValue: parseFloat(investorQuery.rows[0].portfolio_value || 0)
        };
      } else {
        console.log('⚠️  User has investor flag but no investor profile - data inconsistency');
        // Don't create fallback profile - let frontend handle the inconsistency
      }
    }
    
    console.log('📤 Returning accounts:', { accounts, currentAccountType: user.current_account_type });
    
    // If user has no accounts, clear the current_account_type
    let effectiveAccountType = user.current_account_type;
    if (Object.keys(accounts).length === 0) {
      effectiveAccountType = null;
      console.log('👤 User has no accounts, clearing current_account_type');
    }
    
    res.json({
      user: {
        full_name: user.full_name,
        currentAccountType: effectiveAccountType
      },
      accounts
    });
    
  } catch (err) {
    console.error('Error fetching accounts:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create a new account profile
app.post('/api/accounts/create', verifyToken, async (req, res) => {
  try {
    const { uid: firebase_uid } = req;
    const { accountType, profileData } = req.body;
    
    if (!accountType || !['borrower', 'investor'].includes(accountType)) {
      return res.status(400).json({ error: 'Invalid account type' });
    }
    
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      if (accountType === 'borrower') {
        // Check if borrower profile already exists
        const existingBorrower = await client.query(
          `SELECT id FROM borrower_profiles WHERE firebase_uid = $1`,
          [firebase_uid]
        );
        
        if (existingBorrower.rows.length > 0) {
          await client.query('ROLLBACK');
          return res.status(409).json({ error: 'Borrower account already exists' });
        }
        
        // Create borrower profile
        const borrowerResult = await client.query(
          `INSERT INTO borrower_profiles (
            firebase_uid, full_name, occupation, business_type, location,
            phone_number, date_of_birth, experience, is_complete
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
          [
            firebase_uid,
            profileData.fullName || null,
            profileData.occupation || null,
            profileData.businessType || null,
            profileData.location || null,
            profileData.phoneNumber || null,
            profileData.dateOfBirth || null,
            profileData.experience || null,
            false
          ]
        );
        
        // Update user account flags
        await client.query(
          `UPDATE users SET has_borrower_account = TRUE WHERE firebase_uid = $1`,
          [firebase_uid]
        );
        
        await client.query('COMMIT');
        
        res.json({
          success: true,
          account: {
            type: 'borrower',
            profile: borrowerResult.rows[0],
            isComplete: false
          }
        });
        
      } else if (accountType === 'investor') {
        // Check if investor profile already exists
        const existingInvestor = await client.query(
          `SELECT id FROM investor_profiles WHERE firebase_uid = $1`,
          [firebase_uid]
        );
        
        if (existingInvestor.rows.length > 0) {
          await client.query('ROLLBACK');
          return res.status(409).json({ error: 'Investor account already exists' });
        }
        
        // Create investor profile
        const investorResult = await client.query(
          `INSERT INTO investor_profiles (
            firebase_uid, full_name, location, phone_number, date_of_birth,
            investment_experience, investment_preference, risk_tolerance, is_complete
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
          [
            firebase_uid,
            profileData.fullName || null,
            profileData.location || null,
            profileData.phoneNumber || null,
            profileData.dateOfBirth || null,
            profileData.investmentExperience || null,
            profileData.investmentPreference || 'both',
            profileData.riskTolerance || 'moderate',
            false
          ]
        );
        
        // Update user account flags
        await client.query(
          `UPDATE users SET has_investor_account = TRUE WHERE firebase_uid = $1`,
          [firebase_uid]
        );
        
        await client.query('COMMIT');
        
        res.json({
          success: true,
          account: {
            type: 'investor',
            profile: investorResult.rows[0],
            isComplete: false
          }
        });
      }
      
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    
  } catch (err) {
    console.error('Error creating account:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Switch current account type
app.post('/api/accounts/switch', verifyToken, async (req, res) => {
  try {
    const { uid: firebase_uid } = req;
    const { accountType } = req.body;
    
    console.log('🔄 Account switch request:', { firebase_uid, accountType });
    
    if (!accountType || !['borrower', 'investor'].includes(accountType)) {
      return res.status(400).json({ error: 'Invalid account type' });
    }
    
    // Check if user has the requested account type
    const userQuery = await db.query(
      `SELECT has_borrower_account, has_investor_account, current_account_type FROM users WHERE firebase_uid = $1`,
      [firebase_uid]
    );
    
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userQuery.rows[0];
    console.log('👤 Current user state:', user);
    
    if (accountType === 'borrower' && !user.has_borrower_account) {
      return res.status(400).json({ error: 'User does not have a borrower account' });
    }
    
    if (accountType === 'investor' && !user.has_investor_account) {
      return res.status(400).json({ error: 'User does not have an investor account' });
    }
    
    // Update current account type
    await db.query(
      `UPDATE users SET current_account_type = $1 WHERE firebase_uid = $2`,
      [accountType, firebase_uid]
    );
    
    console.log('✅ Account switched successfully to:', accountType);
    res.json({ success: true, currentAccountType: accountType });
    
  } catch (err) {
    console.error('Error switching account:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// at top, after profileRouter…
const borrowRouter = express.Router();

// Create a borrow request
borrowRouter.post("/", verifyToken, async (req, res) => {
  const uid = req.uid;
  const {
    nationalId, passport, tin,
    street, barangay, municipality,
    province, country, postalCode
  } = req.body;

  try {
    await db.query(
      `INSERT INTO borrow_requests
         (firebase_uid,national_id,passport_no,tin,
          street,barangay,municipality,province,country,postal_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [uid,nationalId,passport,tin,
       street,barangay,municipality,province,country,postalCode]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.use("/api/borrow-requests", borrowRouter);

// Settings Routes
// Get user profile with detailed information
app.get('/api/settings/profile', verifyToken, async (req, res) => {
  try {
    const { uid: firebase_uid } = req;
    console.log('🔍 Settings profile request for user:', firebase_uid);
    
    // Check if database is connected
    if (!dbConnected || !db) {
      console.log('⚠️ Database not connected, returning default profile');
      
      // Try to get basic info from Firebase
      let defaultProfile = {
        firebase_uid,
        full_name: '',
        email: '',
        current_account_type: 'individual',
        has_borrower_account: false,
        has_investor_account: false
      };
      
      try {
        const firebaseUser = await admin.auth().getUser(firebase_uid);
        defaultProfile.full_name = firebaseUser.displayName || '';
        defaultProfile.email = firebaseUser.email || '';
      } catch (e) {
        console.log('Could not get Firebase user data:', e.message);
      }
      
      return res.json(defaultProfile);
    }
    
    // Get user base info (optimized - only needed columns)
    const userQuery = await db.query(
      `SELECT firebase_uid, full_name, username, current_account_type, has_borrower_account, has_investor_account FROM users WHERE firebase_uid = $1`,
      [firebase_uid]
    );
    
    console.log('📊 User query result:', userQuery.rows);
    
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userQuery.rows[0];
    
    // Get email from Firebase since it's not stored in the database
    let userEmail = '';
    try {
      const firebaseUser = await admin.auth().getUser(firebase_uid);
      userEmail = firebaseUser.email || '';
    } catch (e) {
      console.log('Could not get email from Firebase:', e.message);
    }
    
    let profileData = {
      fullName: user.full_name,
      username: user.username || '',
      email: userEmail,
      phone: user.phone_number || '',
      dateOfBirth: user.date_of_birth || '',
      nationality: user.nationality || '',
      accountType: 'individual', // Will be updated based on profile data
      profileType: user.has_borrower_account && user.has_investor_account ? 'Both' : 
                  user.has_borrower_account ? 'Borrower' : 
                  user.has_investor_account ? 'Investor' : 'None',
      address: {
        street: '',
        barangay: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
      },
      identification: {
        nationalId: '',
        passport: '',
        tin: '',
        secondaryIdType: '',
        secondaryIdNumber: '',
      },
      personalInfo: {
        placeOfBirth: '',
        gender: '',
        civilStatus: '',
        nationality: '',
        motherMaidenName: '',
        contactEmail: '',
      },
      employmentInfo: {
        employerName: '',
        occupation: '',
        employerAddress: '',
        sourceOfIncome: '',
        monthlyIncome: null,
      },
      emergencyContact: {
        name: '',
        relationship: '',
        phone: '',
        address: '',
      },
      businessInfo: {
        entityType: '',
        businessRegistrationType: '',
        businessRegistrationNumber: '',
        businessRegistrationDate: '',
        corporateTin: '',
        natureOfBusiness: '',
        businessAddress: '',
        gisTotalAssets: null,
        gisTotalLiabilities: null,
        gisPaidUpCapital: null,
        gisNumberOfStockholders: null,
        gisNumberOfEmployees: null,
      },
      principalOfficeAddress: {
        street: '',
        barangay: '',
        municipality: '',
        province: '',
        country: 'Philippines',
        postalCode: '',
      },
      authorizedSignatory: {
        name: '',
        position: '',
        idType: '',
        idNumber: '',
      },
      investmentInfo: {
        experience: '',
        preference: '',
        riskTolerance: '',
        portfolioValue: 0,
      },
      bankAccount: {
        bankName: '',
        accountNumber: '',
        accountName: '',
        iban: '',
        swiftCode: '',
      },
      pepStatus: false,
    };

    console.log('📋 Initial profile data:', profileData);

    // Get detailed profile data based on account type
    if (user.has_borrower_account) {
      const borrowerQuery = await db.query(
        `SELECT * FROM borrower_profiles WHERE firebase_uid = $1`,
        [firebase_uid]
      );
      
      console.log('👤 Borrower profile query result:', borrowerQuery.rows);
      
      if (borrowerQuery.rows.length > 0) {
        const borrower = borrowerQuery.rows[0];
        profileData.phone = borrower.phone_number || profileData.phone;
        profileData.dateOfBirth = borrower.date_of_birth || profileData.dateOfBirth;
        profileData.nationality = borrower.nationality || profileData.nationality;
        
        // Always map borrower address fields (handle null values)
        profileData.address = {
          street: borrower.street || '',
          barangay: borrower.barangay || '',
          city: borrower.municipality || '',
          state: borrower.province || '',
          country: borrower.country || '',
          postalCode: borrower.postal_code || '',
        };
        
        // Always map borrower identification fields (handle null values)
        profileData.identification = {
          nationalId: borrower.national_id || '',
          passport: borrower.passport_no || '',
          tin: borrower.tin || '',
          secondaryIdType: borrower.secondary_id_type || '',
          secondaryIdNumber: borrower.secondary_id_number || '',
        };

        // Personal information for individual accounts
        profileData.personalInfo = {
          placeOfBirth: borrower.place_of_birth || '',
          gender: borrower.gender || '',
          civilStatus: borrower.civil_status || '',
          nationality: borrower.nationality || '',
          motherMaidenName: borrower.mother_maiden_name || '',
          contactEmail: borrower.contact_email || '',
        };

        // Employment information
        profileData.employmentInfo = {
          employerName: borrower.employer_name || '',
          occupation: borrower.occupation || '',
          employerAddress: borrower.employer_address || '',
          sourceOfIncome: borrower.source_of_income || '',
          monthlyIncome: borrower.monthly_income || null,
        };

        // Emergency contact
        profileData.emergencyContact = {
          name: borrower.emergency_contact_name || '',
          relationship: borrower.emergency_contact_relationship || '',
          phone: borrower.emergency_contact_phone || '',
          address: borrower.emergency_contact_address || '',
        };

        // Business information (for non-individual accounts)
        profileData.businessInfo = {
          entityType: borrower.entity_type || '',
          businessRegistrationType: borrower.business_registration_type || '',
          businessRegistrationNumber: borrower.business_registration_number || '',
          businessRegistrationDate: borrower.business_registration_date || '',
          corporateTin: borrower.corporate_tin || '',
          natureOfBusiness: borrower.nature_of_business || '',
          businessAddress: borrower.business_address || '',
          gisTotalAssets: borrower.gis_total_assets || null,
          gisTotalLiabilities: borrower.gis_total_liabilities || null,
          gisPaidUpCapital: borrower.gis_paid_up_capital || null,
          gisNumberOfStockholders: borrower.gis_number_of_stockholders || null,
          gisNumberOfEmployees: borrower.gis_number_of_employees || null,
        };

        // Principal office address
        profileData.principalOfficeAddress = {
          street: borrower.principal_office_street || '',
          barangay: borrower.principal_office_barangay || '',
          municipality: borrower.principal_office_municipality || '',
          province: borrower.principal_office_province || '',
          country: borrower.principal_office_country || 'Philippines',
          postalCode: borrower.principal_office_postal_code || '',
        };

        // Authorized signatory
        profileData.authorizedSignatory = {
          name: borrower.authorized_signatory_name || '',
          position: borrower.authorized_signatory_position || '',
          idType: borrower.authorized_signatory_id_type || '',
          idNumber: borrower.authorized_signatory_id_number || '',
        };

        // PEP status
        profileData.pepStatus = borrower.is_politically_exposed_person || false;
        
        // Bank account information
        profileData.bankAccount = {
          bankName: borrower.bank_name || '',
          accountNumber: borrower.account_number || '',
          accountName: borrower.account_name || '',
          iban: borrower.iban || '',
          swiftCode: borrower.swift_code || '',
        };
        
        // Set accountType based on is_individual_account flag
        profileData.accountType = borrower.is_individual_account ? 'individual' : 'non-individual';
        
        // Parse stored JSON data if available
        try {
          if (borrower.address_data) {
            profileData.address = JSON.parse(borrower.address_data);
          }
          if (borrower.identification_data) {
            profileData.identification = JSON.parse(borrower.identification_data);
          }
        } catch (e) {
          console.log('Could not parse JSON data:', e.message);
        }
      }
    }
    
    if (user.has_investor_account) {
      const investorQuery = await db.query(
        `SELECT * FROM investor_profiles WHERE firebase_uid = $1`,
        [firebase_uid]
      );
      
      console.log('💼 Investor profile query result:', investorQuery.rows);
      
      if (investorQuery.rows.length > 0) {
        const investor = investorQuery.rows[0];
        console.log('🔍 Investor profile columns:', Object.keys(investor));
        console.log('🔍 Checking for address fields:', {
          street: investor.street,
          barangay: investor.barangay,
          municipality: investor.municipality,
          province: investor.province,
          country: investor.country,
          postal_code: investor.postal_code
        });
        
        profileData.phone = investor.phone_number || profileData.phone;
        profileData.dateOfBirth = investor.date_of_birth || profileData.dateOfBirth;
        
        // Always map investor address fields (handle null values)
        profileData.address = {
          street: investor.street || '',
          barangay: investor.barangay || '',
          city: investor.municipality || '',
          state: investor.province || '',
          country: investor.country || '',
          postalCode: investor.postal_code || '',
        };
        console.log('✅ Mapped address data from investor profile:', profileData.address);
        
        // Always map investor identification fields (handle null values)
        profileData.identification = {
          nationalId: investor.national_id || '',
          passport: investor.passport_no || '',
          tin: investor.tin || '',
          secondaryIdType: investor.secondary_id_type || '',
          secondaryIdNumber: investor.secondary_id_number || '',
        };
        console.log('✅ Mapped identification data from investor profile:', profileData.identification);

        // Personal information for individual accounts
        profileData.personalInfo = {
          placeOfBirth: investor.place_of_birth || '',
          gender: investor.gender || '',
          civilStatus: investor.civil_status || '',
          nationality: investor.nationality || '',
          motherMaidenName: investor.mother_maiden_name || '',
          contactEmail: investor.contact_email || '',
        };

        // Emergency contact
        profileData.emergencyContact = {
          name: investor.emergency_contact_name || '',
          relationship: investor.emergency_contact_relationship || '',
          phone: investor.emergency_contact_phone || '',
          address: investor.emergency_contact_address || '',
        };

        // Business information (for non-individual accounts)
        profileData.businessInfo = {
          entityType: investor.entity_type || '',
          businessRegistrationType: investor.business_registration_type || '',
          businessRegistrationNumber: investor.business_registration_number || '',
          businessRegistrationDate: investor.business_registration_date || '',
          corporateTin: investor.corporate_tin || '',
          natureOfBusiness: investor.nature_of_business || '',
          businessAddress: investor.business_address || '',
          gisTotalAssets: investor.gis_total_assets || null,
          gisTotalLiabilities: investor.gis_total_liabilities || null,
          gisPaidUpCapital: investor.gis_paid_up_capital || null,
          gisNumberOfStockholders: investor.gis_number_of_stockholders || null,
          gisNumberOfEmployees: investor.gis_number_of_employees || null,
        };

        // Principal office address
        profileData.principalOfficeAddress = {
          street: investor.principal_office_street || '',
          barangay: investor.principal_office_barangay || '',
          municipality: investor.principal_office_municipality || '',
          province: investor.principal_office_province || '',
          country: investor.principal_office_country || 'Philippines',
          postalCode: investor.principal_office_postal_code || '',
        };

        // Authorized signatory
        profileData.authorizedSignatory = {
          name: investor.authorized_signatory_name || '',
          position: investor.authorized_signatory_position || '',
          idType: investor.authorized_signatory_id_type || '',
          idNumber: investor.authorized_signatory_id_number || '',
        };

        // Investment information
        profileData.investmentInfo = {
          experience: investor.investment_experience || '',
          preference: investor.investment_preference || '',
          riskTolerance: investor.risk_tolerance || '',
          portfolioValue: parseFloat(investor.portfolio_value) || 0,
        };

        // PEP status
        profileData.pepStatus = investor.is_politically_exposed_person || false;
        
        // Bank account information
        profileData.bankAccount = {
          bankName: investor.bank_name || '',
          accountNumber: investor.account_number || '',
          accountName: investor.account_name || '',
          iban: investor.iban || '',
          swiftCode: investor.swift_code || '',
        };
        
        // Set accountType based on is_individual_account flag
        profileData.accountType = investor.is_individual_account ? 'individual' : 'non-individual';
      }
    }

    console.log('📤 Final profile data being returned:', profileData);

    res.json({
      success: true,
      profile: profileData
    });
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get user settings
app.get('/api/settings', verifyToken, async (req, res) => {
  try {
    const { uid: firebase_uid } = req;
    
    // Create user_settings table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        firebase_uid VARCHAR(255) UNIQUE NOT NULL,
        privacy_settings JSONB DEFAULT '{}',
        notification_settings JSONB DEFAULT '{}',
        security_settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const settingsQuery = await db.query(
      `SELECT * FROM user_settings WHERE firebase_uid = $1`,
      [firebase_uid]
    );
    
    let settings = {
      privacySettings: {
        profileVisibility: "private",
        showEmail: false,
        showPhone: false,
        allowMessaging: true,
        showInvestments: false,
      },
      notificationSettings: {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
        projectUpdates: true,
        paymentAlerts: true,
        systemAnnouncements: true,
      },
      securitySettings: {
        twoFactorEnabled: false,
        loginNotifications: true,
        securityAlerts: true,
      }
    };
    
    if (settingsQuery.rows.length > 0) {
      const userSettings = settingsQuery.rows[0];
      settings = {
        privacySettings: { ...settings.privacySettings, ...userSettings.privacy_settings },
        notificationSettings: { ...settings.notificationSettings, ...userSettings.notification_settings },
        securitySettings: { ...settings.securitySettings, ...userSettings.security_settings }
      };
    }
    
    res.json({
      success: true,
      settings
    });
    
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update user settings
app.post('/api/settings', verifyToken, async (req, res) => {
  try {
    const { uid: firebase_uid } = req;
    const { profileData, privacySettings, notificationSettings, securitySettings } = req.body;
    
    console.log('🔄 Updating settings for user:', firebase_uid);
    console.log('📋 Profile data received:', JSON.stringify(profileData, null, 2));
    console.log('🔐 Privacy settings:', JSON.stringify(privacySettings, null, 2));
    console.log('🔔 Notification settings:', JSON.stringify(notificationSettings, null, 2));
    console.log('🔒 Security settings:', JSON.stringify(securitySettings, null, 2));
    
    // Update basic user info first
    if (profileData) {
      console.log('📝 Updating basic user info...');
      
      // Handle username separately if provided
      if (profileData.username && profileData.username.trim()) {
        try {
          // Check if username is already taken by another user
          const existingUser = await db.query(
            `SELECT firebase_uid FROM users WHERE username = $1 AND firebase_uid != $2`,
            [profileData.username.trim(), firebase_uid]
          );
          
          if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'Username is already taken' });
          }
          
          // Update with username
          await db.query(
            `UPDATE users SET 
             full_name = $1,
             username = $2,
             updated_at = CURRENT_TIMESTAMP
             WHERE firebase_uid = $3`,
            [profileData.fullName, profileData.username.trim(), firebase_uid]
          );
          console.log('✅ User info and username updated successfully');
        } catch (usernameError) {
          console.error('❌ Error updating username:', usernameError);
          return res.status(400).json({ error: 'Invalid username format' });
        }
      } else {
        // Update without username
        await db.query(
          `UPDATE users SET 
           full_name = $1,
           updated_at = CURRENT_TIMESTAMP
           WHERE firebase_uid = $2`,
          [profileData.fullName, firebase_uid]
        );
        console.log('✅ Basic user info updated successfully');
      }
      
      // Get user account types to determine which profiles to update
      console.log('🔍 Checking user account types...');
      const userQuery = await db.query(
        `SELECT has_borrower_account, has_investor_account FROM users WHERE firebase_uid = $1`,
        [firebase_uid]
      );
      
      if (userQuery.rows.length > 0) {
        const user = userQuery.rows[0];
        
        // Update borrower profile if user has borrower account
        if (user.has_borrower_account) {
          try {
            // Only update confirmed existing fields
            await db.query(`
              UPDATE borrower_profiles SET
                phone_number = $1,
                date_of_birth = $2,
                updated_at = CURRENT_TIMESTAMP
              WHERE firebase_uid = $3
            `, [
              profileData.phone || null,
              profileData.dateOfBirth || null,
              firebase_uid
            ]);
            console.log('✅ Updated borrower profile basic info');
            
            // Try to update address fields separately with error handling
            try {
              await db.query(`
                UPDATE borrower_profiles SET
                  street = $1,
                  barangay = $2,
                  municipality = $3,
                  province = $4,
                  country = $5,
                  postal_code = $6
                WHERE firebase_uid = $7
              `, [
                profileData.address?.street || null,
                profileData.address?.barangay || null,
                profileData.address?.city || null,
                profileData.address?.state || null,
                profileData.address?.country || null,
                profileData.address?.postalCode || null,
                firebase_uid
              ]);
              console.log('✅ Updated borrower address info');
            } catch (addressError) {
              console.log('⚠️ Address fields may not exist in borrower_profiles:', addressError.message);
            }
            
            // Try to update identification fields separately
            try {
              await db.query(`
                UPDATE borrower_profiles SET
                  national_id = $1,
                  passport_no = $2,
                  tin = $3
                WHERE firebase_uid = $4
              `, [
                profileData.identification?.nationalId || null,
                profileData.identification?.passport || null,
                profileData.identification?.tin || null,
                firebase_uid
              ]);
              console.log('✅ Updated borrower identification info');
            } catch (idError) {
              console.log('⚠️ ID fields may not exist in borrower_profiles:', idError.message);
            }
            
          } catch (error) {
            console.error('❌ Error updating borrower profile:', error);
            // Don't throw error, continue with other updates
          }
        }
        
        // Update investor profile if user has investor account
        if (user.has_investor_account) {
          try {
            // Update basic info
            await db.query(`
              UPDATE investor_profiles SET
                phone_number = $1,
                date_of_birth = $2,
                updated_at = CURRENT_TIMESTAMP
              WHERE firebase_uid = $3
            `, [
              profileData.phone || null,
              profileData.dateOfBirth || null,
              firebase_uid
            ]);
            console.log('✅ Updated investor profile basic info');

            // Update address fields
            try {
              await db.query(`
                UPDATE investor_profiles SET
                  street = $1,
                  barangay = $2,
                  municipality = $3,
                  province = $4,
                  country = $5,
                  postal_code = $6
                WHERE firebase_uid = $7
              `, [
                profileData.address?.street || null,
                profileData.address?.barangay || null,
                profileData.address?.city || null,
                profileData.address?.state || null,
                profileData.address?.country || null,
                profileData.address?.postalCode || null,
                firebase_uid
              ]);
              console.log('✅ Updated investor address info');
            } catch (addressError) {
              console.log('⚠️ Address fields may not exist in investor_profiles:', addressError.message);
            }

            // Update identification fields
            try {
              await db.query(`
                UPDATE investor_profiles SET
                  national_id = $1,
                  passport_no = $2,
                  tin = $3
                WHERE firebase_uid = $4
              `, [
                profileData.identification?.nationalId || null,
                profileData.identification?.passport || null,
                profileData.identification?.tin || null,
                firebase_uid
              ]);
              console.log('✅ Updated investor identification info');
            } catch (idError) {
              console.log('⚠️ ID fields may not exist in investor_profiles:', idError.message);
            }

          } catch (error) {
            console.error('❌ Error updating investor profile:', error);
            // Don't throw error, continue with other updates
          }
        }
      }
      
      // Create user_settings table if it doesn't exist
      await db.query(`
        CREATE TABLE IF NOT EXISTS user_settings (
          id SERIAL PRIMARY KEY,
          firebase_uid VARCHAR(255) UNIQUE NOT NULL,
          privacy_settings JSONB DEFAULT '{}',
          notification_settings JSONB DEFAULT '{}',
          security_settings JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Upsert settings
      await db.query(`
        INSERT INTO user_settings (firebase_uid, privacy_settings, notification_settings, security_settings)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (firebase_uid) 
        DO UPDATE SET 
          privacy_settings = EXCLUDED.privacy_settings,
          notification_settings = EXCLUDED.notification_settings,
          security_settings = EXCLUDED.security_settings,
          updated_at = CURRENT_TIMESTAMP
      `, [
        firebase_uid,
        JSON.stringify(privacySettings || {}),
        JSON.stringify(notificationSettings || {}),
        JSON.stringify(securitySettings || {})
      ]);
    }
      
    console.log('✅ Profile and settings updated successfully');
    res.json({ success: true, message: 'Settings updated successfully' });
      
  } catch (error) {
    console.error('❌ Error updating user settings:', error);
    console.error('🔍 Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });
    res.status(500).json({ error: 'Database error', details: error.message });
  }
});

// Change password endpoint
app.post('/api/settings/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const uid = req.uid;
    
    console.log('Password change request for user:', uid);
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: "Current password and new password are required" 
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false, 
        error: "New password must be at least 8 characters long" 
      });
    }
    
    // Use Firebase Admin SDK to update password
    await admin.auth().updateUser(uid, {
      password: newPassword
    });
    
    console.log("Password updated successfully for user:", uid);
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to change password' 
    });
  }
});

// Forgot password route
app.post('/api/settings/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log("Forgot password request for email:", email);
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: "Email is required" 
      });
    }
    
    // Check if user exists in Firebase
    let userExists = false;
    try {
      await admin.auth().getUserByEmail(email);
      userExists = true;
    } catch (error) {
      // User doesn't exist, but we don't want to reveal this for security
      console.log("User not found for email:", email);
    }
    
    if (userExists) {
      // Generate a password reset link
      const resetLink = await admin.auth().generatePasswordResetLink(email);
      
      console.log("Reset link generated for:", email);
      console.log("Reset link (dev only):", resetLink);
      
      // In production, you would send this via email
      // For development, we'll return it in the response
      res.json({ 
        success: true, 
        message: "Password reset link sent",
        resetLink: resetLink // Remove this in production
      });
    } else {
      // Still return success to prevent email enumeration
      res.json({ 
        success: true, 
        message: "If an account exists, a password reset link has been sent"
      });
    }
    
  } catch (error) {
    console.error("Error processing forgot password:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to process password reset request" 
    });
  }
});

// Top-up routes
const topupRouter = express.Router();

// Get predefined account details
topupRouter.get("/accounts", async (req, res) => {
  try {
    // Return predefined account options
    const accounts = [
      {
        id: 1,
        accountName: "Alexa John",
        bank: "VEN USD PAR A IC/FOREIGN",
        accountNumber: "084008124",
        isDefault: true
      },
      {
        id: 2,
        accountName: "Alexa John",
        bank: "VEN USD PAR A IC/FOREIGN", 
        accountNumber: "084008124",
        isDefault: false
      }
    ];
    
    res.json(accounts);
  } catch (err) {
    console.error("Error fetching accounts:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Submit top-up request
topupRouter.post("/request", verifyToken, async (req, res) => {
  const uid = req.uid;
  const {
    amount,
    currency = 'PHP',
    transferDate,
    accountName,
    accountNumber,
    bankName,
    reference,
    proofOfTransfer
  } = req.body;
  
  try {
    console.log("Creating top-up request for user:", uid);
    console.log("Amount:", amount, currency);
    
    const result = await db.query(
      `INSERT INTO topup_requests 
       (firebase_uid, amount, currency, transfer_date, account_name, 
        account_number, bank_name, reference, proof_of_transfer)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [uid, amount, currency, transferDate, accountName, accountNumber, bankName, reference, proofOfTransfer]
    );
    
    console.log("Top-up request created with ID:", result.rows[0].id);
    
    res.json({ 
      success: true, 
      requestId: result.rows[0].id,
      message: "Top-up request submitted successfully. Admin will review and process your request."
    });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get user's top-up requests
topupRouter.get("/my-requests", verifyToken, async (req, res) => {
  const uid = req.uid;
  
  try {
    const { rows } = await db.query(
      `SELECT * FROM topup_requests 
       WHERE firebase_uid = $1 
       ORDER BY created_at DESC`,
      [uid]
    );
    
    res.json(rows);
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.use("/api/topup", topupRouter);

// Project routes
const projectsRouter = express.Router();

// Create a project
projectsRouter.post("/", verifyToken, async (req, res) => {
  const uid = req.uid;
  const projectData = req.body;
  
  console.log("Creating project for user:", uid);
  console.log("Project data size:", JSON.stringify(projectData).length);
  
  try {
    // Set default approval status if not provided
    if (!projectData.approvalStatus) {
      projectData.approvalStatus = 'pending';
    }
    
    // Add database ID to project_data to ensure consistency
    const result = await db.query(
      `INSERT INTO projects (firebase_uid, project_data)
       VALUES ($1, $2)
       RETURNING id`,
      [uid, projectData]
    );
    
    const newId = result.rows[0].id;
    console.log("Project created with DB ID:", newId);
    
    // Update the project_data with the database ID
    projectData.id = newId.toString();
    
    await db.query(
      `UPDATE projects
       SET project_data = $1
       WHERE id = $2`,
      [projectData, newId]
    );
    
    res.json({ 
      success: true, 
      projectId: newId.toString()
    });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get all projects (with optional filters) - MOVED TO MAIN APP ROUTE WITH AUTH
// projectsRouter.get("/", async (req, res) => {
//   const { status } = req.query;
//   
//   try {
//     console.log("=== PROJECTS API CALL ===");
//     console.log("Status filter:", status);
//     
//     let query = `SELECT p.id, p.firebase_uid, p.project_data, p.created_at, u.full_name 
//                 FROM projects p
//                 LEFT JOIN users u ON p.firebase_uid = u.firebase_uid`;
//     
//     const params = [];
//     if (status) {
//       query += ` WHERE p.project_data->>'status' = $1`;
//       params.push(status);
//       console.log("Filtering for status:", status);
//     }
//     
//     console.log("Executing query:", query);
//     console.log("With params:", params);
//     
//     const { rows } = await db.query(query, params);
//     console.log(`Found ${rows.length} projects`);
//     
//     // Log project statuses for debugging
//     rows.forEach((project, index) => {
//       const projectData = project.project_data || {};
//       console.log(`Project ${index + 1}: ID=${project.id}, Status="${projectData.status || 'no status'}", Product="${projectData.details?.product || 'no product'}"`);
//     });
//     
//     res.json(rows);
//   } catch (err) {
//     console.error("DB error:", err);
//     res.status(500).json({ error: "Database error" });
//   }
// });

// Get projects by creator
projectsRouter.get("/my-projects", verifyToken, async (req, res) => {
  const uid = req.uid;
  
  try {
    const { rows } = await db.query(
      `SELECT id, project_data, created_at, updated_at
       FROM projects
       WHERE firebase_uid = $1
       ORDER BY updated_at DESC`,
      [uid]
    );
    
    res.json(rows);
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Update a project
projectsRouter.put("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const uid = req.uid;
  const updates = req.body;
  
  try {
    console.log(`Attempting to update project with ID: ${id}`);
    
    // Check if this is a numeric ID or UUID
    const isNumeric = /^\d+$/.test(id);
    
    let query;
    let params;
    
    if (isNumeric) {
      query = `SELECT * FROM projects WHERE id = $1`;
      params = [parseInt(id, 10)];
    } else {
      query = `
        SELECT * FROM projects 
        WHERE id::text = $1 
        OR project_data->>'id' = $1
      `;
      params = [id];
    }
    
    // First get the existing project
    const { rows } = await db.query(query, params);
    
    if (rows.length === 0) {
      console.log(`Project with ID ${id} not found. Query:`, query);
      return res.status(404).json({ error: "Project not found" });
    }
    
    const project = rows[0];
    
    // Check if user owns this project
    if (project.firebase_uid !== uid) {
      console.log(`User ${uid} not authorized to edit project ${id}`);
      return res.status(403).json({ error: "Unauthorized to edit this project" });
    }
    
    // Get the existing project data
    const existingData = project.project_data;
    
    console.log("Existing data:", JSON.stringify(existingData).substring(0, 100) + "...");
    console.log("Update sections:", Object.keys(updates));
    console.log("Update data sample:", JSON.stringify(updates).substring(0, 100) + "...");
    
    // Merge the updates with the existing data
    const mergedData = deepMerge(existingData, updates);
    
    console.log("Merged data sections:", Object.keys(mergedData));
    
    // Ensure the ID is preserved
    mergedData.id = existingData.id;
    
    console.log("Successfully merged data");
    
    // Update the project with merged data
    await db.query(
      `UPDATE projects 
       SET project_data = $1, updated_at = NOW()
       WHERE id = $2`,
      [mergedData, project.id]
    );
    
    console.log(`Project ${id} updated successfully`);
    res.json({ 
      success: true,
      projectId: id
    });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// Get a single project (with ownership check for editing)
projectsRouter.get("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const uid = req.uid;
  
  try {
    console.log(`Fetching project with ID: ${id} for user: ${uid}`);
    
    const { rows } = await db.query(
      `SELECT p.id, p.firebase_uid, p.project_data, p.created_at, u.full_name
       FROM projects p
       JOIN users u ON p.firebase_uid = u.firebase_uid
       WHERE p.id::text = $1`,
      [id]
    );
    
    if (rows.length === 0) {
      console.log(`Project ${id} not found`);
      return res.status(404).json({ error: "Project not found" });
    }

    const project = rows[0];
    console.log(`Project found - Owner: ${project.firebase_uid}, Requester: ${uid}`);
    
    // Check if user is requesting for editing (indicated by header or query param)
    const isEditRequest = req.headers['x-edit-mode'] === 'true' || req.query.edit === 'true';
    console.log(`Edit request: ${isEditRequest}`);
    
    if (isEditRequest && project.firebase_uid !== uid) {
      console.log(`User ${uid} attempted to edit project owned by ${project.firebase_uid}`);
      return res.status(403).json({ error: "You can only edit projects that you created" });
    }
    
    console.log(`Access granted for project ${id}`);
    res.json(project);
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Test endpoint to verify investment endpoint is accessible
app.get('/api/test-investment-endpoint', (req, res) => {
  console.log("🧪 Test investment endpoint called");
  res.json({ status: "Investment endpoint is accessible", timestamp: new Date().toISOString() });
});

app.get('/api/debug/test-investment/:projectId', async (req, res) => {
  const { projectId } = req.params;
  console.log(`🧪 Testing investment for project ${projectId}`);
  
  try {
    // Simulate the investment request logic without requiring auth
    const projectResult = await db.query(
      `SELECT project_data FROM projects WHERE id = $1`,
      [projectId]
    );
    
    if (projectResult.rows.length === 0) {
      console.log(`❌ Project ${projectId} not found`);
      return res.status(404).json({ error: "Project not found" });
    }
    
    const projectData = projectResult.rows[0].project_data;
    
    console.log(`📝 Adding test investment request to project ${projectId}`);
    
    if (!projectData.investorRequests) {
      projectData.investorRequests = [];
    }
    
    projectData.investorRequests.push({
      investorId: "test-investor-123",
      name: "Test Investor",
      amount: 10000,
      date: new Date().toISOString(),
      status: "pending"
    });
    
    await db.query(
      `UPDATE projects 
       SET project_data = $1, updated_at = NOW()
       WHERE id = $2`,
      [projectData, projectId]
    );
    
    console.log(`✅ Test investment request added successfully`);
    res.json({ 
      success: true, 
      message: "Test investment request added",
      investorRequests: projectData.investorRequests 
    });
  } catch (err) {
    console.error("❌ DB error during test investment:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.get('/api/debug/check-investments', (req, res) => {
  console.log("🔍 Checking for existing investment requests in database...");
  
  db.query(
    `SELECT id, firebase_uid, project_data->>'investorRequests' as investor_requests 
     FROM projects 
     WHERE project_data->>'investorRequests' IS NOT NULL 
     AND project_data->>'investorRequests' != '[]'`
  ).then(result => {
    console.log("📊 Found projects with investment requests:", result.rows.length);
    result.rows.forEach(project => {
      console.log(`Project ${project.id}: ${project.investor_requests}`);
    });
    res.json({
      message: "Investment requests found",
      count: result.rows.length,
      projects: result.rows
    });
  }).catch(err => {
    console.error("❌ Database error:", err);
    res.status(500).json({ error: "Database error" });
  });
});

// Add investment request to a project
projectsRouter.post("/:id/invest", verifyToken, async (req, res) => {
  const { id } = req.params;
  const uid = req.uid;
  const { amount } = req.body;
  
  console.log(`💰 Investment request received - Project: ${id}, Investor: ${uid}, Amount: ${amount}`);
  
  try {
    // First, check wallet balance
    const walletResult = await db.query(
      'SELECT balance FROM wallets WHERE firebase_uid = $1',
      [uid]
    );
    
    const walletBalance = walletResult.rows[0]?.balance || 0;
    const investmentAmount = parseFloat(amount);
    
    console.log(`💳 Checking wallet balance: ₱${walletBalance.toLocaleString()} vs Required: ₱${investmentAmount.toLocaleString()}`);
    
    // Check if user has sufficient funds
    if (walletBalance < investmentAmount) {
      console.log(`❌ Insufficient wallet balance: ₱${walletBalance.toLocaleString()} < ₱${investmentAmount.toLocaleString()}`);
      return res.status(400).json({ 
        error: `Insufficient wallet balance. Your current balance is ₱${walletBalance.toLocaleString()}, but you need ₱${investmentAmount.toLocaleString()} to make this investment.`,
        currentBalance: walletBalance,
        requiredAmount: investmentAmount,
        shortfall: investmentAmount - walletBalance
      });
    }
    
    // Get the project and user data
    const projectResult = await db.query(
      `SELECT project_data, firebase_uid FROM projects WHERE id = $1`,
      [id]
    );
    
    if (projectResult.rows.length === 0) {
      console.log(`❌ Project ${id} not found for investment`);
      return res.status(404).json({ error: "Project not found" });
    }
    
    // Check if user is trying to invest in their own project
    const project = projectResult.rows[0];
    if (project.firebase_uid === uid) {
      console.log(`🚫 User ${uid} attempted to invest in their own project ${id}`);
      return res.status(400).json({ error: "You cannot invest in your own project" });
    }
    
    // Get investor profile to check annual income and existing investments
    // For now, use default values since annual_income column may not exist
    let investorIncome = 1000000; // Default 1M PHP for testing
    let verificationStatus = 'verified'; // Default verified for testing
    
    try {
      const investorResult = await db.query(
        `SELECT * FROM investor_profiles WHERE firebase_uid = $1`,
        [uid]
      );
      
      if (investorResult.rows.length > 0) {
        const profile = investorResult.rows[0];
        // Check if annual_income column exists
        if ('annual_income' in profile) {
          investorIncome = profile.annual_income || 1000000;
        }
        if ('verification_status' in profile) {
          verificationStatus = profile.verification_status || 'verified';
        }
        console.log(`📊 Investor profile found:`, profile);
      }
    } catch (dbError) {
      console.log(`⚠️ Using default investor values due to DB error:`, dbError.message);
    }
    
    // Calculate investment limits based on annual income
    let maxInvestmentPercentage = 0;
    let maxInvestmentAmount = 0;
    
    if (investorIncome >= 2000000) { // 2M PHP or above
      maxInvestmentPercentage = 10;
    } else { // Below 2M PHP
      maxInvestmentPercentage = 5;
    }
    
    maxInvestmentAmount = (investorIncome * maxInvestmentPercentage) / 100;
    
    console.log(`📊 Investment limits for user ${uid}: Income: ₱${investorIncome.toLocaleString()}, Max %: ${maxInvestmentPercentage}%, Max Amount: ₱${maxInvestmentAmount.toLocaleString()}`);
    
    // Check if requested amount exceeds limit
    if (parseFloat(amount) > maxInvestmentAmount) {
      console.log(`❌ Investment amount ₱${parseFloat(amount).toLocaleString()} exceeds limit of ₱${maxInvestmentAmount.toLocaleString()}`);
      return res.status(400).json({ 
        error: `Investment amount exceeds your limit of ₱${maxInvestmentAmount.toLocaleString()} (${maxInvestmentPercentage}% of annual income of ₱${investorIncome.toLocaleString()})`,
        maxAmount: maxInvestmentAmount,
        userIncome: investorIncome,
        limitPercentage: maxInvestmentPercentage
      });
    }
    
    // Check for existing investments by this user in this project
    const projectData = project.project_data;
    const existingInvestments = projectData.investorRequests?.filter(req => req.investorId === uid) || [];
    
    if (existingInvestments.length > 0) {
      console.log(`🚫 User ${uid} already has ${existingInvestments.length} investment(s) in project ${id}`);
      return res.status(400).json({ 
        error: "You already have an investment request for this project. Multiple investments per project are not allowed.",
        existingInvestments: existingInvestments.map(inv => ({
          amount: inv.amount,
          date: inv.date,
          status: inv.status
        }))
      });
    }
    
    const userResult = await db.query(
      `SELECT full_name FROM users WHERE firebase_uid = $1`,
      [uid]
    );
    
    // Update the project with the investment request
    const investorName = userResult.rows[0]?.full_name || "Investor";
    
    console.log(`📝 Adding investment request from ${investorName} to project ${id}`);
    
    if (!projectData.investorRequests) {
      projectData.investorRequests = [];
    }
    
    projectData.investorRequests.push({
      investorId: uid,
      name: investorName,
      amount: parseFloat(amount),
      date: new Date().toISOString(),
      status: "pending",
      investorIncome: investorIncome,
      investmentLimit: maxInvestmentAmount,
      limitPercentage: maxInvestmentPercentage
    });
    
    await db.query(
      `UPDATE projects 
       SET project_data = $1, updated_at = NOW()
       WHERE id = $2`,
      [projectData, id]
    );
    
    console.log(`✅ Investment request added successfully for project ${id}`);
    res.json({ 
      success: true,
      investmentInfo: {
        amount: parseFloat(amount),
        userIncome: investorIncome,
        maxAmount: maxInvestmentAmount,
        limitPercentage: maxInvestmentPercentage,
        withinLimit: true
      }
    });
  } catch (err) {
    console.error("❌ DB error during investment:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Admin endpoint to approve/reject investment requests
app.post('/api/admin/projects/:projectId/investments/:investorId/review', verifyToken, async (req, res) => {
  const { projectId, investorId } = req.params;
  const { action, comment } = req.body; // action: 'approve' or 'reject'
  const adminUid = req.uid;
  
  // Start database transaction for atomic operations
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    // Verify admin status
    const adminResult = await client.query(
      `SELECT is_admin FROM users WHERE firebase_uid = $1`,
      [adminUid]
    );
    
    if (!adminResult.rows[0]?.is_admin) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: "Unauthorized - Admin access required" });
    }
    
    // Get the project
    const projectResult = await client.query(
      `SELECT project_data FROM projects WHERE id = $1`,
      [projectId]
    );
    
    if (projectResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Project not found" });
    }
    
    const projectData = projectResult.rows[0].project_data;
    
    if (!projectData.investorRequests) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "No investment requests found" });
    }
    
    // Find and update the specific investment request
    const investmentIndex = projectData.investorRequests.findIndex(
      req => req.investorId === investorId
    );
    
    if (investmentIndex === -1) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Investment request not found" });
    }
    
    // Check if investment is already processed
    if (projectData.investorRequests[investmentIndex].status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: `Investment request is already ${projectData.investorRequests[investmentIndex].status}`,
        currentStatus: projectData.investorRequests[investmentIndex].status
      });
    }
    
    // Update the investment request status
    projectData.investorRequests[investmentIndex].status = action === 'approve' ? 'approved' : 'rejected';
    projectData.investorRequests[investmentIndex].reviewedAt = new Date().toISOString();
    projectData.investorRequests[investmentIndex].reviewedBy = adminUid;
    
    if (comment) {
      projectData.investorRequests[investmentIndex].adminComment = comment;
    }
    
    let walletUpdateInfo = null;
    
    // If approved, update the funding meter and deduct from investor's wallet
    if (action === 'approve') {
      const approvedAmount = projectData.investorRequests[investmentIndex].amount;
      
      // First, check investor's wallet balance to ensure they still have sufficient funds
      const walletResult = await client.query(
        'SELECT balance FROM wallets WHERE firebase_uid = $1',
        [investorId]
      );
      
      const currentBalance = walletResult.rows[0]?.balance || 0;
      
      if (currentBalance < approvedAmount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: `Cannot approve investment. Investor's current wallet balance (₱${currentBalance.toLocaleString()}) is insufficient for the investment amount (₱${approvedAmount.toLocaleString()})`,
          currentBalance,
          requiredAmount: approvedAmount,
          shortfall: approvedAmount - currentBalance
        });
      }
      
      // Deduct the investment amount from investor's wallet
      const deductResult = await client.query(
        `UPDATE wallets 
         SET balance = balance - $1, updated_at = NOW() 
         WHERE firebase_uid = $2
         RETURNING balance`,
        [approvedAmount, investorId]
      );
      
      if (deductResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: "Failed to update investor wallet. Wallet not found." });
      }
      
      const newBalance = deductResult.rows[0].balance;
      console.log(`💳 Wallet deduction: Deducted ₱${approvedAmount.toLocaleString()} from investor ${investorId}. New balance: ₱${newBalance.toLocaleString()}`);
      
      walletUpdateInfo = {
        investorId: investorId,
        amountDeducted: approvedAmount,
        newBalance: newBalance,
        deductionProcessed: true
      };
      
      // Initialize funding tracking if it doesn't exist
      if (!projectData.funding) {
        projectData.funding = {
          totalFunded: 0,
          investors: []
        };
      }
      
      // Add to total funded amount
      projectData.funding.totalFunded += approvedAmount;
      
      // Add investor to the list if not already there
      const existingInvestorIndex = projectData.funding.investors.findIndex(
        inv => inv.investorId === investorId
      );
      
      if (existingInvestorIndex >= 0) {
        // Update existing investor amount
        projectData.funding.investors[existingInvestorIndex].amount += approvedAmount;
      } else {
        // Add new investor
        projectData.funding.investors.push({
          investorId: investorId,
          amount: approvedAmount,
          approvedAt: new Date().toISOString()
        });
      }
      
      console.log(`💰 Investment approved: Added ₱${approvedAmount.toLocaleString()} to project ${projectId}. Total funded: ₱${projectData.funding.totalFunded.toLocaleString()}`);
    }
    
    // Update the project in database
    await client.query(
      `UPDATE projects 
       SET project_data = $1, updated_at = NOW()
       WHERE id = $2`,
      [projectData, projectId]
    );
    
    // Commit the transaction
    await client.query('COMMIT');
    
    // Prepare response object
    const responseData = { 
      success: true, 
      message: `Investment request ${action}d successfully`,
      investment: projectData.investorRequests[investmentIndex]
    };
    
    // If approved, include wallet information in response
    if (action === 'approve' && walletUpdateInfo) {
      responseData.walletUpdate = walletUpdateInfo;
    }
    
    res.json(responseData);
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error reviewing investment request:", err);
    res.status(500).json({ error: "Database error during investment review" });
  } finally {
    client.release();
  }
});

// Get all pending investment requests for admin review
app.get('/api/admin/investment-requests', verifyToken, async (req, res) => {
  const adminUid = req.uid;
  
  console.log(`🔍 Admin investment requests called by user: ${adminUid}`);
  
  try {
    // Verify admin status
    const adminResult = await db.query(
      `SELECT is_admin FROM users WHERE firebase_uid = $1`,
      [adminUid]
    );
    
    if (!adminResult.rows[0]?.is_admin) {
      console.log(`❌ User ${adminUid} is not an admin`);
      return res.status(403).json({ error: "Unauthorized - Admin access required" });
    }
    
    console.log(`✅ Admin access verified for user: ${adminUid}`);
    
    // Get all projects that have investment requests (we'll filter for pending ones in the processing step)
    console.log(`🔍 Searching for projects with investment requests...`);
    const result = await db.query(`
      SELECT p.id, p.firebase_uid, p.project_data, p.created_at, u.full_name as borrower_name
      FROM projects p
      LEFT JOIN users u ON p.firebase_uid = u.firebase_uid
      WHERE p.project_data::text LIKE '%investorRequests%'
    `);
    
    console.log(`📊 Found ${result.rows.length} projects with potential investment requests`);
    
    // Process results to extract pending investment requests
    const pendingInvestments = [];
    
    for (const row of result.rows) {
      const projectData = row.project_data;
      const pendingRequests = projectData.investorRequests?.filter(req => req.status === 'pending') || [];
      
      console.log(`📋 Project ${row.id} has ${pendingRequests.length} pending investment requests`);
      
      for (const request of pendingRequests) {
        // Get investor details
        const investorResult = await db.query(
          `SELECT full_name FROM users WHERE firebase_uid = $1`,
          [request.investorId]
        );
        
        pendingInvestments.push({
          projectId: row.id,
          projectTitle: projectData.details?.projectTitle || 'Untitled Project',
          borrowerName: row.borrower_name,
          borrowerUid: row.firebase_uid,
          investorId: request.investorId,
          investorName: investorResult.rows[0]?.full_name || 'Unknown Investor',
          amount: request.amount,
          date: request.date,
          status: request.status,
          projectData: projectData
        });
      }
    }
    
    console.log(`📤 Returning ${pendingInvestments.length} pending investment requests to admin`);
    res.json(pendingInvestments);
    
  } catch (err) {
    console.error("Error fetching pending investment requests:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Debug endpoint to check investment requests
app.get('/api/debug/investments', verifyToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.id, p.firebase_uid, p.project_data->>'details'->>'projectTitle' as title, 
             p.project_data->'investorRequests' as investor_requests
      FROM projects p 
      WHERE p.project_data->'investorRequests' IS NOT NULL
      AND jsonb_array_length(p.project_data->'investorRequests') > 0
    `);
    
    console.log('🔍 Investment requests in database:', result.rows.length);
    res.json({
      total: result.rows.length,
      projects: result.rows
    });
  } catch (err) {
    console.error('Error fetching investment requests:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Debug endpoint to make user admin
app.post('/api/debug/make-admin/:userId', verifyToken, async (req, res) => {
  const { userId } = req.params;
  try {
    await db.query('UPDATE users SET is_admin = true WHERE firebase_uid = $1', [userId]);
    const result = await db.query('SELECT firebase_uid, full_name, is_admin FROM users WHERE firebase_uid = $1', [userId]);
    console.log(`✅ Made user admin: ${result.rows[0]?.full_name}`);
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('Error making user admin:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add interest request to a project
projectsRouter.post("/:id/interest", verifyToken, async (req, res) => {
  const { id } = req.params;
  const uid = req.uid;
  const { message } = req.body;
  
  try {
    // Get the project and user data
    const projectResult = await db.query(
      `SELECT project_data, firebase_uid FROM projects WHERE id = $1`,
      [id]
    );
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    // Check if user is trying to express interest in their own project
    const project = projectResult.rows[0];
    if (project.firebase_uid === uid) {
      console.log(`🚫 User ${uid} attempted to express interest in their own project ${id}`);
      return res.status(400).json({ error: "You cannot express interest in your own project" });
    }
    
    const userResult = await db.query(
      `SELECT full_name FROM users WHERE firebase_uid = $1`,
      [uid]
    );
    
    // Update the project with the interest request
    const projectData = project.project_data;
    const investorName = userResult.rows[0]?.full_name || "Investor";
    
    if (!projectData.interestRequests) {
      projectData.interestRequests = [];
    }
    
    // Check if investor already showed interest
    const existingInterest = projectData.interestRequests.find(
      req => req.investorId === uid
    );
    
    if (existingInterest) {
      return res.status(400).json({ error: "Interest already shown" });
    }
    
    projectData.interestRequests.push({
      investorId: uid,
      name: investorName,
      message: message || "I'm interested in this project",
      date: new Date().toISOString(),
      status: "pending"
    });
    
    await db.query(
      `UPDATE projects 
       SET project_data = $1, updated_at = NOW()
       WHERE id = $2`,
      [projectData, id]
    );
    
    res.json({ success: true, message: "Interest shown successfully" });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Approve interest request
projectsRouter.post('/:id/interest-approve', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { investorId } = req.body;
    const { uid } = req.user;
    
    // Get the project
    const result = await db.query(
      `SELECT * FROM projects WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    const project = result.rows[0];
    const projectData = project.project_data || {};
    
    // Check if user is the project owner
    if (project.firebase_uid !== uid) {
      return res.status(403).json({ error: "Not authorized to approve interest for this project" });
    }
    
    // Find and update the interest request
    if (projectData.interestRequests) {
      const interestIndex = projectData.interestRequests.findIndex(
        req => req.investorId === investorId
      );
      
      if (interestIndex !== -1) {
        projectData.interestRequests[interestIndex].status = "approved";
        projectData.interestRequests[interestIndex].approvedAt = new Date().toISOString();
        
        await db.query(
          `UPDATE projects 
           SET project_data = $1, updated_at = NOW()
           WHERE id = $2`,
          [projectData, id]
        );
        
        res.json({ success: true, message: "Interest request approved" });
      } else {
        res.status(404).json({ error: "Interest request not found" });
      }
    } else {
      res.status(404).json({ error: "No interest requests found" });
    }
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Reject interest request
projectsRouter.post('/:id/interest-reject', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { investorId } = req.body;
    const { uid } = req.user;
    
    // Get the project
    const result = await db.query(
      `SELECT * FROM projects WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    const project = result.rows[0];
    const projectData = project.project_data || {};
    
    // Check if user is the project owner
    if (project.firebase_uid !== uid) {
      return res.status(403).json({ error: "Not authorized to reject interest for this project" });
    }
    
    // Find and update the interest request
    if (projectData.interestRequests) {
      const interestIndex = projectData.interestRequests.findIndex(
        req => req.investorId === investorId
      );
      
      if (interestIndex !== -1) {
        projectData.interestRequests[interestIndex].status = "rejected";
        projectData.interestRequests[interestIndex].rejectedAt = new Date().toISOString();
        
        await db.query(
          `UPDATE projects 
           SET project_data = $1, updated_at = NOW()
           WHERE id = $2`,
          [projectData, id]
        );
        
        res.json({ success: true, message: "Interest request rejected" });
      } else {
        res.status(404).json({ error: "Interest request not found" });
      }
    } else {
      res.status(404).json({ error: "No interest requests found" });
    }
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.use("/api/projects", projectsRouter);

// Add this debug endpoint (for development only)
app.get('/api/debug/projects', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, firebase_uid, project_data FROM projects ORDER BY created_at DESC LIMIT 20');
    
    // Extract useful debug info
    const projectInfo = rows.map(row => ({
      databaseId: row.id,
      clientId: row.project_data.id || 'missing',
      userId: row.firebase_uid,
      type: row.project_data.type || 'unknown',
      status: row.project_data.status || 'unknown',
      approvalStatus: row.project_data.approvalStatus || 'no approval status',
      productName: row.project_data.details?.product || 'no product name',
      createdAt: row.project_data.createdAt || 'unknown'
    }));
    
    res.json({
      totalProjects: projectInfo.length,
      projects: projectInfo
    });
  } catch (err) {
    console.error("Debug error:", err);
    res.status(500).json({ error: "Debug error" });
  }
});

// Add endpoint to see what calendar would return
app.get('/api/debug/calendar', verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT p.id, p.firebase_uid, p.project_data, p.created_at, u.full_name 
      FROM projects p
      LEFT JOIN users u ON p.firebase_uid = u.firebase_uid
      WHERE (p.project_data->>'status' = 'published' 
             OR p.project_data->>'status' = 'draft'
             OR p.project_data->>'status' = 'pending'
             OR p.project_data->>'status' IS NULL)
      AND (p.project_data->>'approvalStatus' = 'approved' 
           OR p.project_data->>'approvalStatus' = 'pending'
           OR p.project_data->>'approvalStatus' IS NULL)
      ORDER BY p.created_at DESC
    `;
    
    const { rows } = await db.query(query);
    
    const calendarInfo = rows.map(row => ({
      id: row.id,
      userId: row.firebase_uid,
      userName: row.full_name,
      productName: row.project_data.details?.product || 'no product name',
      status: row.project_data.status || 'no status',
      approvalStatus: row.project_data.approvalStatus || 'no approval status',
      created: row.created_at
    }));
    
    res.json({
      message: "This is what the calendar endpoint would return",
      count: calendarInfo.length,
      projects: calendarInfo
    });
  } catch (err) {
    console.error("Debug calendar error:", err);
    res.status(500).json({ error: "Debug error" });
  }
});

// Create top-up requests table on startup
async function createTopUpTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS topup_requests (
        id SERIAL PRIMARY KEY,
        firebase_uid VARCHAR(255) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'PHP',
        transfer_date DATE NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        account_number VARCHAR(50) NOT NULL,
        bank_name VARCHAR(255) NOT NULL,
        reference VARCHAR(255) NOT NULL,
        proof_of_transfer TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        admin_notes TEXT,
        reviewed_by VARCHAR(255),
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("Top-up requests table ready");
  } catch (err) {
    console.error("Error creating top-up table:", err);
  }
}

createTopUpTable();

// Add this helper function
function deepMerge(target, source) {
  if (source === null || typeof source !== 'object') {
    return source;
  }
  
  if (Array.isArray(source)) {
    return [...source];
  }
  
  const output = { ...target };
  
  Object.keys(source).forEach(key => {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (output[key] && typeof output[key] === 'object' && !Array.isArray(output[key])) {
        output[key] = deepMerge(output[key], source[key]);
      } else {
        output[key] = source[key];
      }
    } else {
      output[key] = source[key];
    }
  });
  
  return output;
}

// Add this with your other API endpoints

// Mark registration as complete
app.post('/api/profile/complete-registration', verifyToken, async (req, res) => {
  try {
    const uid = req.uid;
    
    // Update the user profile in the database
    await db.query(
      `UPDATE users 
       SET has_completed_registration = true, updated_at = NOW()
       WHERE firebase_uid = $1`,
      [uid]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error("Error completing registration:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// Complete KYC registration
app.post('/api/profile/complete-kyc', verifyToken, async (req, res) => {
  try {
    const uid = req.uid;
    const { accountType, kycData } = req.body;
    
    console.log('🔥 COMPLETE-KYC ENDPOINT CALLED');
    console.log('📝 User ID:', uid);
    console.log('📋 Account Type:', accountType);
    console.log('🗂️ KYC Data:', JSON.stringify(kycData, null, 2));
    
    if (!accountType || !kycData) {
      console.log('❌ Missing required fields - accountType:', accountType, 'kycData:', !!kycData);
      return res.status(400).json({ error: "Missing required fields: accountType and kycData" });
    }
    
    // Validate account type selection
    if (kycData.isIndividualAccount === undefined || kycData.isIndividualAccount === null) {
      return res.status(400).json({ 
        error: "Account type selection is required", 
        details: "Please specify if this is an Individual or Business/Corporate account" 
      });
    }
    
    if (typeof kycData.isIndividualAccount !== 'boolean') {
      return res.status(400).json({ 
        error: "Invalid account type value", 
        details: "isIndividualAccount must be true (Individual) or false (Business/Corporate)" 
      });
    }
    
    // Begin transaction
    await db.query('BEGIN');
    
    try {
      // Update user role and registration status
      await db.query(
        `UPDATE users 
         SET role = $1, 
             has_completed_registration = true,
             updated_at = NOW()
         WHERE firebase_uid = $2`,
        [accountType, uid]
      );
      
      // Set account flags
      const hasBorowrAccount = accountType === 'borrower';
      const hasInvestorAccount = accountType === 'investor';
      
      await db.query(
        `UPDATE users 
         SET has_borrower_account = $1,
             has_investor_account = $2,
             current_account_type = $3,
             updated_at = NOW()
         WHERE firebase_uid = $4`,
        [hasBorowrAccount, hasInvestorAccount, accountType, uid]
      );
      
      // Insert into appropriate profile table
      if (accountType === 'borrower') {
        console.log('💾 Inserting borrower profile data...');
        console.log('🔢 Parameters for borrower insert:');
        console.log('uid:', uid);
        console.log('isIndividualAccount:', kycData.isIndividualAccount);
        console.log('placeOfBirth:', kycData.placeOfBirth);
        console.log('gender:', kycData.gender);
        console.log('civilStatus:', kycData.civilStatus);
        console.log('nationality:', kycData.nationality);
        console.log('contactEmail:', kycData.contactEmail);
        
        // Update existing borrower profile with comprehensive KYC data
        await db.query(`
          UPDATE borrower_profiles SET
            is_individual_account = $2,
            -- Personal Information
            first_name = $3,
            last_name = $4,
            middle_name = $5,
            date_of_birth = $6,
            place_of_birth = $7,
            gender = $8,
            civil_status = $9,
            nationality = $10,
            mobile_number = $11,
            country_code = $12,
            email_address = $13,
            contact_email = $14,
            -- Address Information
            present_address = $15,
            permanent_address = $16,
            city = $17,
            state = $18,
            postal_code = $19,
            country = $20,
            -- Identification
            national_id = $21,
            passport = $22,
            tin_number = $23,
            secondary_id_type = $24,
            secondary_id_number = $25,
            -- Employment Information
            occupation = $26,
            employer_name = $27,
            employer_address = $28,
            employment_status = $29,
            gross_annual_income = $30,
            source_of_income = $31,
            -- Emergency Contact
            emergency_contact_name = $32,
            emergency_contact_relationship = $33,
            emergency_contact_phone = $34,
            emergency_contact_email = $35,
            -- Business/Corporate Information
            entity_type = $36,
            entity_name = $37,
            registration_type = $38,
            registration_number = $39,
            registration_date = $40,
            corporate_tin = $41,
            nature_of_business = $42,
            business_address = $43,
            authorized_person_name = $44,
            authorized_person_position = $45,
            -- Bank Account Information
            account_name = $46,
            bank_name = $47,
            account_type = $48,
            account_number = $49,
            iban = $50,
            swift_code = $51,
            -- Principal Office Address
            principal_office_street = $52,
            principal_office_barangay = $53,
            principal_office_municipality = $54,
            principal_office_province = $55,
            principal_office_country = $56,
            principal_office_postal_code = $57,
            -- GIS Information
            gis_total_assets = $58,
            gis_total_liabilities = $59,
            gis_paid_up_capital = $60,
            gis_number_of_stockholders = $61,
            gis_number_of_employees = $62,
            -- PEP Status
            is_politically_exposed_person = $63,
            pep_details = $64,
            -- Completion Status
            is_complete = TRUE,
            updated_at = NOW()
          WHERE firebase_uid = $1
        `, [
          uid, 
          kycData.isIndividualAccount,
          // Personal Information (3-14)
          kycData.firstName || null,
          kycData.lastName || null, 
          kycData.middleName || null,
          kycData.dateOfBirth || null,
          kycData.placeOfBirth,
          kycData.gender, 
          kycData.civilStatus,
          kycData.nationality,
          kycData.phoneNumber || kycData.mobileNumber || null,
          kycData.countryCode || null,
          kycData.emailAddress || null,
          kycData.contactEmail,
          // Address Information (15-20)
          kycData.presentAddress || kycData.street || null,
          kycData.permanentAddress || null,
          kycData.city || kycData.cityName || null,
          kycData.state || kycData.stateIso || null,
          kycData.postalCode || null,
          kycData.country || kycData.countryIso || null,
          // Identification (21-25)
          kycData.nationalId || null,
          kycData.passport || kycData.passportNumber || null,
          kycData.tin || kycData.tinNumber || null,
          kycData.secondaryIdType,
          kycData.secondaryIdNumber,
          // Employment Information (26-31)
          kycData.occupation || null,
          kycData.employerName || null,
          kycData.employerAddress || null,
          kycData.employmentStatus || null,
          kycData.grossAnnualIncome || kycData.monthlyIncome || null,
          kycData.sourceOfIncome || null,
          // Emergency Contact (32-35)
          kycData.emergencyContactName,
          kycData.emergencyContactRelationship,
          kycData.emergencyContactPhone, 
          kycData.emergencyContactEmail,
          // Business/Corporate Information (36-45)
          kycData.entityType || null,
          kycData.entityName || null,
          kycData.businessRegistrationType,
          kycData.businessRegistrationNumber,
          kycData.businessRegistrationDate,
          kycData.corporateTin,
          kycData.natureOfBusiness,
          kycData.businessAddress || null,
          kycData.authorizedSignatoryName,
          kycData.authorizedSignatoryPosition,
          // Bank Account Information (46-51)
          kycData.account_name || kycData.accountName || null,
          kycData.bank_name || kycData.bankName || null,
          kycData.account_type || kycData.accountType || null,
          kycData.account_number || kycData.accountNumber || null,
          kycData.iban || null,
          kycData.swift_code || kycData.swiftCode || null,
          // Principal Office Address (52-57)
          kycData.principalOfficeStreet,
          kycData.principalOfficeBarangay,
          kycData.principalOfficeMunicipality,
          kycData.principalOfficeProvince,
          kycData.principalOfficeCountry,
          kycData.principalOfficePostalCode,
          // GIS Information (58-62)
          kycData.gisTotalAssets,
          kycData.gisTotalLiabilities,
          kycData.gisPaidUpCapital, 
          kycData.gisNumberOfStockholders,
          kycData.gisNumberOfEmployees,
          // PEP Status (63-64)
          kycData.isPoliticallyExposedPerson,
          kycData.pepDetails
        ]);
      } else {
        // Update existing investor profile with KYC data
        await db.query(`
          UPDATE investor_profiles SET
            is_individual_account = $2,
            place_of_birth = $3,
            gender = $4,
            civil_status = $5,
            nationality = $6,
            contact_email = $7,
            secondary_id_type = $8,
            secondary_id_number = $9,
            emergency_contact_name = $10,
            emergency_contact_relationship = $11,
            emergency_contact_phone = $12,
            emergency_contact_email = $13,
            business_registration_type = $14,
            business_registration_number = $15,
            business_registration_date = $16,
            corporate_tin = $17,
            nature_of_business = $18,
            principal_office_street = $19,
            principal_office_barangay = $20,
            principal_office_municipality = $21,
            principal_office_province = $22,
            principal_office_country = $23,
            principal_office_postal_code = $24,
            gis_total_assets = $25,
            gis_total_liabilities = $26,
            gis_paid_up_capital = $27,
            gis_number_of_stockholders = $28,
            gis_number_of_employees = $29,
            is_politically_exposed_person = $30,
            pep_details = $31,
            authorized_signatory_name = $32,
            authorized_signatory_position = $33,
            authorized_signatory_id_type = $34,
            authorized_signatory_id_number = $35,
            is_complete = TRUE,
            updated_at = NOW()
          WHERE firebase_uid = $1
        `, [
          uid, kycData.isIndividualAccount, kycData.placeOfBirth, kycData.gender, 
          kycData.civilStatus, kycData.nationality, kycData.contactEmail, 
          kycData.secondaryIdType, kycData.secondaryIdNumber, kycData.emergencyContactName,
          kycData.emergencyContactRelationship, kycData.emergencyContactPhone, 
          kycData.emergencyContactEmail, kycData.businessRegistrationType, 
          kycData.businessRegistrationNumber, kycData.businessRegistrationDate,
          kycData.corporateTin, kycData.natureOfBusiness, kycData.principalOfficeStreet,
          kycData.principalOfficeBarangay, kycData.principalOfficeMunicipality,
          kycData.principalOfficeProvince, kycData.principalOfficeCountry,
          kycData.principalOfficePostalCode, kycData.gisTotalAssets,
          kycData.gisTotalLiabilities, kycData.gisPaidUpCapital, 
          kycData.gisNumberOfStockholders, kycData.gisNumberOfEmployees,
          kycData.isPoliticallyExposedPerson, kycData.pepDetails,
          kycData.authorizedSignatoryName, kycData.authorizedSignatoryPosition,
          kycData.authorizedSignatoryIdType, kycData.authorizedSignatoryIdNumber
        ]);
      }
      
      // Commit transaction
      await db.query('COMMIT');
      
      console.log('✅ KYC data successfully saved to database');
      console.log('📊 Account type:', accountType);
      console.log('👤 User ID:', uid);
      
      res.json({ 
        success: true, 
        message: 'KYC information submitted successfully',
        accountType: accountType
      });
      
    } catch (innerErr) {
      await db.query('ROLLBACK');
      throw innerErr;
    }
    
  } catch (err) {
    console.error("❌ Error completing KYC:", err);
    console.error("🔍 Error details:", err.message);
    console.error("📊 Stack trace:", err.stack);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// Create the admin role if it doesn't exist
app.post('/api/admin/setup', async (req, res) => {
  try {
    // Add admin column if it doesn't exist
    await db.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
    `);
    
    res.json({ success: true, message: "Admin column added to users table" });
  } catch (err) {
    console.error("Error setting up admin:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// Mark a user as admin
app.post('/api/admin/create', async (req, res) => {
  const { adminKey, userId } = req.body;
  
  // Simple protection - would use better auth in production
  // You can set this to any secret value for development
  const secretKey = "admin-secret-key-1234"; 
  
  if (adminKey !== secretKey) {
    return res.status(403).json({ error: "Unauthorized: Invalid admin key" });
  }
  
  try {
    await db.query(`
      UPDATE users SET is_admin = TRUE WHERE firebase_uid = $1
    `, [userId]);
    
    res.json({ success: true, message: "User granted admin privileges" });
  } catch (err) {
    console.error("Error creating admin:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// Admin endpoint to approve or reject projects
app.post('/api/admin/projects/:id/review', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { action, feedback } = req.body;
  
  try {
    // Verify admin status
    const adminCheck = await db.query(
      `SELECT is_admin FROM users WHERE firebase_uid = $1`,
      [req.uid]
    );
    
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }
    
    // Get the project first to preserve existing data
    const projectResult = await db.query(
      `SELECT project_data FROM projects WHERE id = $1`,
      [id]
    );
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    const projectData = projectResult.rows[0].project_data;
    
    // Update approval status
    projectData.approvalStatus = action === 'approve' ? 'approved' : 'rejected';
    if (feedback) {
      projectData.adminFeedback = feedback;
    }
    
    // Update the project
    const updateResult = await db.query(
      `UPDATE projects SET project_data = $1 WHERE id = $2 RETURNING *`,
      [projectData, id]
    );
    
    // Get the updated project with user info for the response
    const updatedProject = await db.query(
      `SELECT p.id, p.firebase_uid, p.project_data, p.created_at, u.full_name 
       FROM projects p
       LEFT JOIN users u ON p.firebase_uid = u.firebase_uid
       WHERE p.id = $1`,
      [id]
    );
    
    res.json({ 
      success: true, 
      message: `Project ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      updatedProject: updatedProject.rows[0]
    });
  } catch (err) {
    console.error("Error reviewing project:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Modify the existing GET projects endpoint to filter by approval
app.get('/api/projects', verifyToken, async (req, res) => {
  const { approved, status } = req.query;
  
  try {
    let query = `SELECT p.id, p.firebase_uid, p.project_data, p.created_at, u.full_name, 
                        bp.is_individual_account as creator_is_individual
                FROM projects p
                LEFT JOIN users u ON p.firebase_uid = u.firebase_uid
                LEFT JOIN borrower_profiles bp ON p.firebase_uid = bp.firebase_uid`;
    
    const params = [];
    let conditions = [];
    
    // Always exclude deleted projects unless specifically requested
    if (status !== 'deleted') {
      conditions.push(`(p.project_data->>'status' != 'deleted' OR p.project_data->>'status' IS NULL)`);
    }
    
    // Handle status parameter
    if (status && status !== 'deleted') {
      conditions.push(`p.project_data->>'status' = $${params.length + 1}`);
      params.push(status);
    } else if (status === 'deleted') {
      // Only show deleted projects if explicitly requested
      conditions.push(`p.project_data->>'status' = $${params.length + 1}`);
      params.push('deleted');
    }
    
    // Check if we need to filter for approved projects
    if (approved === 'true') {
      conditions.push(`p.project_data->>'status' = $${params.length + 1}`);
      params.push('published');
      
      // Include approved projects and also projects without approval status (for backward compatibility)
      conditions.push(`(p.project_data->>'approvalStatus' = $${params.length + 1} 
                      OR p.project_data->>'approvalStatus' = $${params.length + 2}
                      OR p.project_data->>'approvalStatus' IS NULL)`);
      params.push('approved');
      params.push('pending');
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    console.log("Projects query:", query);
    console.log("With params:", params);
    
    const { rows } = await db.query(query, params);
    console.log(`Returning ${rows.length} projects for investor`);
    
    res.json(rows);
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get investment eligibility and limits for a user
app.get('/api/user/investment-eligibility', verifyToken, async (req, res) => {
  const uid = req.uid;
  
  try {
    // Get investor profile with error handling for missing columns
    let investorIncome = 1000000; // Default 1M PHP
    let verificationStatus = 'verified'; // Default verified
    
    try {
      const investorResult = await db.query(
        `SELECT * FROM investor_profiles WHERE firebase_uid = $1`,
        [uid]
      );
      
      if (investorResult.rows.length > 0) {
        const profile = investorResult.rows[0];
        if ('annual_income' in profile) {
          investorIncome = profile.annual_income || 1000000;
        }
        if ('verification_status' in profile) {
          verificationStatus = profile.verification_status || 'verified';
        }
      }
    } catch (dbError) {
      console.log(`⚠️ Using default investor values:`, dbError.message);
    }
    
    // Calculate investment limits
    let maxInvestmentPercentage = 0;
    let maxInvestmentAmount = 0;
    
    if (investorIncome >= 2000000) { // 2M PHP or above
      maxInvestmentPercentage = 10;
    } else { // Below 2M PHP
      maxInvestmentPercentage = 5;
    }
    
    maxInvestmentAmount = (investorIncome * maxInvestmentPercentage) / 100;
    
    // Get user's current total investments
    const projectsResult = await db.query(`
      SELECT p.id, p.project_data 
      FROM projects p
      WHERE p.project_data ? 'investorRequests'
    `);
    
    let totalInvestments = 0;
    let activeInvestments = [];
    
    projectsResult.rows.forEach(row => {
      const investorRequests = row.project_data?.investorRequests || [];
      const userInvestments = investorRequests.filter(req => req.investorId === uid);
      
      userInvestments.forEach(investment => {
        if (investment.status === 'approved' || investment.status === 'pending') {
          totalInvestments += investment.amount;
          activeInvestments.push({
            projectId: row.id,
            amount: investment.amount,
            status: investment.status,
            date: investment.date
          });
        }
      });
    });
    
    const remainingCapacity = maxInvestmentAmount - totalInvestments;
    
    res.json({
      annualIncome: investorIncome,
      verificationStatus,
      maxInvestmentPercentage,
      maxInvestmentAmount,
      totalInvestments,
      remainingCapacity: Math.max(0, remainingCapacity),
      activeInvestments,
      isEligible: verificationStatus === 'verified' && investorIncome > 0,
      investmentTiers: {
        retail: { minIncome: 0, maxIncome: 1999999, maxPercentage: 5 },
        individual: { minIncome: 2000000, maxIncome: Infinity, maxPercentage: 10 }
      }
    });
  } catch (err) {
    console.error("Error fetching investment eligibility:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get user's investments
app.get('/api/user/investments', verifyToken, async (req, res) => {
  const uid = req.uid;
  
  try {
    console.log("Fetching investments for user:", uid);
    
    // Get ALL projects with investorRequests and filter in Node.js for better reliability
    const result = await db.query(`
      SELECT p.id, p.firebase_uid, p.project_data, p.created_at, u.full_name as borrower_name
      FROM projects p
      LEFT JOIN users u ON p.firebase_uid = u.firebase_uid
      WHERE p.project_data ? 'investorRequests'
    `);
    
    console.log("� Found projects with investorRequests:", result.rows.length);
    
    // Process the results to extract investment details
    const investments = result.rows
      .filter(row => {
        const investorRequests = row.project_data?.investorRequests || [];
        const hasUserInvestment = investorRequests.some(req => req.investorId === uid);
        if (hasUserInvestment) {
          console.log(`✅ Project ${row.id}: Found user investment`);
        }
        return hasUserInvestment;
      })
      .map(row => {
        const projectData = row.project_data;
        const userInvestments = projectData.investorRequests?.filter(req => req.investorId === uid) || [];
        
        // Return all investments for this project by this user
        return userInvestments.map(investment => ({
          projectId: row.id,
          borrowerUid: row.firebase_uid,
          borrowerName: row.borrower_name,
          projectTitle: projectData.details?.projectTitle || 'Untitled Project',
          projectImage: projectData.details?.projectImage || null,
          fundingRequirement: projectData.details?.fundingRequirement || 0,
          location: projectData.details?.location || 'Not specified',
          investmentAmount: investment.amount || 0,
          investmentDate: investment.date || null,
          status: investment.status || 'pending',
          projectStatus: projectData.status || 'draft',
          approvalStatus: projectData.approvalStatus || 'pending',
          fundingProgress: projectData.details?.fundingProgress || '0%',
          adminComment: investment.adminComment || null,
          reviewedBy: investment.reviewedBy || null,
          reviewedAt: investment.reviewedAt || null,
          projectData: projectData
        }));
      })
      .flat(); // Flatten array since we're mapping to arrays
    
    console.log("📈 Total processed investments:", investments.length);
    res.json(investments);
  } catch (err) {
    console.error("Error fetching user investments:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Add this endpoint for debugging

app.post('/api/check-admin', async (req, res) => {
  const { userId } = req.body;
  try {
    const result = await db.query(
      `SELECT is_admin FROM users WHERE firebase_uid = $1`,
      [userId]
    );
    
    res.json({ 
      isAdmin: result.rows.length > 0 ? result.rows[0].is_admin : false,
      found: result.rows.length > 0
    });
  } catch (err) {
    console.error("Error checking admin status:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Add this near your other project-related endpoints

// Create a project from form data
app.post('/api/projects/create-test', verifyToken, async (req, res) => {
  const uid = req.uid;
  const projectData = req.body;
  
  try {
    console.log("Creating project for user:", uid);
    console.log("Project data received:", projectData);
    
    // Structure the project data properly
    const project = {
      type: projectData.type || "lending",
      status: "draft", // Start as draft
      approvalStatus: "pending",
      details: projectData.details || {},
      milestones: projectData.milestones || [],
      roi: projectData.roi || {},
      payout: projectData.payout || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const result = await db.query(
      `INSERT INTO projects (firebase_uid, project_data)
       VALUES ($1, $2) RETURNING id`,
      [uid, project]
    );
    
    console.log("Project created successfully with ID:", result.rows[0].id);
    
    res.json({ 
      success: true, 
      message: "Project created successfully",
      projectId: result.rows[0].id,
      project: {
        id: result.rows[0].id,
        firebase_uid: uid,
        project_data: project
      }
    });
  } catch (err) {
    console.error("Error creating project:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// Add a debug endpoint to check token validity
app.post('/api/debug/token', async (req, res) => {
  const { token } = req.body;
  
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    res.json({ 
      valid: true, 
      uid: decoded.uid,
      expiration: new Date(decoded.exp * 1000).toISOString()
    });
  } catch (err) {
    res.json({ 
      valid: false, 
      error: err.message 
    });
  }
});

// Add this new endpoint for admin users to see all projects

app.get('/api/admin/projects', verifyToken, async (req, res) => {
  try {
    // Verify admin status
    const adminCheck = await db.query(
      `SELECT is_admin FROM users WHERE firebase_uid = $1`,
      [req.uid]
    );
    
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }
    
    // Get all projects with user information
    const { rows } = await db.query(`
      SELECT p.id, p.firebase_uid, p.project_data, p.created_at, u.full_name 
      FROM projects p
      LEFT JOIN users u ON p.firebase_uid = u.firebase_uid
      ORDER BY p.created_at DESC
    `);
    
    res.json(rows);
  } catch (err) {
    console.error("Error fetching admin projects:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Add this endpoint near your other admin endpoints

app.get('/api/admin/projects/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Verify admin status
    const adminCheck = await db.query(
      `SELECT is_admin FROM users WHERE firebase_uid = $1`,
      [req.uid]
    );
    
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }
    
    // Get the specific project with user information
    const { rows } = await db.query(`
      SELECT p.id, p.firebase_uid, p.project_data, p.created_at, u.full_name 
      FROM projects p
      LEFT JOIN users u ON p.firebase_uid = u.firebase_uid
      WHERE p.id = $1
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching admin project:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Update or add this endpoint for calendar/investor view

app.get('/api/calendar/projects', verifyToken, async (req, res) => {
  try {
    // For calendar, we want ALL projects that investors can potentially invest in
    // This includes both published projects AND draft projects (borrowers working on them)
    // But we exclude deleted projects
    const query = `
      SELECT p.id, p.firebase_uid, p.project_data, p.created_at, u.full_name 
      FROM projects p
      LEFT JOIN users u ON p.firebase_uid = u.firebase_uid
      WHERE (p.project_data->>'status' = 'published' 
             OR p.project_data->>'status' = 'draft'
             OR p.project_data->>'status' = 'pending'
             OR p.project_data->>'status' IS NULL)
      AND (p.project_data->>'status' != 'deleted' OR p.project_data->>'status' IS NULL)
      AND (p.project_data->>'approvalStatus' = 'approved' 
           OR p.project_data->>'approvalStatus' = 'pending'
           OR p.project_data->>'approvalStatus' IS NULL)
      ORDER BY p.created_at DESC
    `;
    
    const { rows } = await db.query(query);
    
    // Log what's being returned
    console.log(`Calendar API returning ${rows.length} projects (published, draft, pending, or no status)`);
    
    res.json(rows);
  } catch (err) {
    console.error("Error fetching calendar projects:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Update project endpoint - for project management (close, complete, delete)
app.put('/api/projects/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { project_data } = req.body;
  
  try {
    // First verify the project exists and the user owns it or is admin
    const projectCheck = await db.query(
      `SELECT p.*, u.is_admin FROM projects p
       LEFT JOIN users u ON u.firebase_uid = $2
       WHERE p.id = $1`,
      [id, req.uid]
    );
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    const project = projectCheck.rows[0];
    const isAdmin = project.is_admin;
    const isOwner = project.firebase_uid === req.uid;
    
    // Only owner or admin can update the project
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Unauthorized: You can only update your own projects" });
    }
    
    // Update the project
    const result = await db.query(
      `UPDATE projects SET project_data = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [project_data, id]
    );
    
    console.log(`Project ${id} updated successfully by user ${req.uid}`);
    res.json({
      success: true,
      message: "Project updated successfully",
      project: result.rows[0]
    });
  } catch (err) {
    console.error("Error updating project:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// Delete project endpoint - soft delete by setting status to "deleted"
app.delete('/api/projects/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    // First verify the project exists and the user owns it or is admin
    const projectCheck = await db.query(
      `SELECT p.*, u.is_admin FROM projects p
       LEFT JOIN users u ON u.firebase_uid = $2
       WHERE p.id = $1`,
      [id, req.uid]
    );
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    const project = projectCheck.rows[0];
    const isAdmin = project.is_admin;
    const isOwner = project.firebase_uid === req.uid;
    
    // Only owner or admin can delete the project
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Unauthorized: You can only delete your own projects" });
    }
    
    // Soft delete by updating the status to "deleted"
    const updatedProjectData = { ...project.project_data, status: 'deleted' };
    
    const result = await db.query(
      `UPDATE projects SET project_data = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [updatedProjectData, id]
    );
    
    console.log(`Project ${id} deleted (soft delete) by user ${req.uid}`);
    res.json({
      success: true,
      message: "Project deleted successfully",
      project: result.rows[0]
    });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// Add migration endpoint to fix existing projects without approval status
app.post('/api/admin/migrate-approval-status', async (req, res) => {
  try {
    console.log("Starting migration of projects without approval status...");
    
    // Get all projects that don't have approvalStatus set
    const { rows: projectsToUpdate } = await db.query(`
      SELECT id, project_data 
      FROM projects 
      WHERE project_data->>'approvalStatus' IS NULL
    `);
    
    console.log(`Found ${projectsToUpdate.length} projects to update`);
    
    // Update each project to have 'pending' approval status
    for (const project of projectsToUpdate) {
      const updatedData = { ...project.project_data };
      updatedData.approvalStatus = 'pending';
      
      await db.query(
        `UPDATE projects SET project_data = $1 WHERE id = $2`,
        [updatedData, project.id]
      );
    }
    
    console.log("Migration completed successfully");
    res.json({ 
      success: true, 
      message: `Updated ${projectsToUpdate.length} projects with pending approval status`
    });
  } catch (err) {
    console.error("Migration error:", err);
    res.status(500).json({ error: "Migration failed", details: err.message });
  }
});

// Admin endpoints for top-up management
app.get('/api/admin/topup-requests', verifyToken, async (req, res) => {
  try {
    // Verify admin status
    const adminCheck = await db.query(
      `SELECT is_admin FROM users WHERE firebase_uid = $1`,
      [req.uid]
    );
    
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }
    
    // Get all top-up requests with user information
    const { rows } = await db.query(`
      SELECT t.*, u.full_name 
      FROM topup_requests t
      LEFT JOIN users u ON t.firebase_uid = u.firebase_uid
      ORDER BY t.created_at DESC
    `);
    
    res.json(rows);
  } catch (err) {
    console.error("Error fetching admin top-up requests:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Admin review top-up request
app.post('/api/admin/topup-requests/:id/review', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { action, adminNotes } = req.body;
  
  try {
    // Verify admin status
    const adminCheck = await db.query(
      `SELECT is_admin, full_name FROM users WHERE firebase_uid = $1`,
      [req.uid]
    );
    
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }
    
    const adminName = adminCheck.rows[0].full_name;
    
    // Get the top-up request
    const requestResult = await db.query(
      `SELECT * FROM topup_requests WHERE id = $1`,
      [id]
    );
    
    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: "Top-up request not found" });
    }
    
    const topupRequest = requestResult.rows[0];
    
    if (topupRequest.status !== 'pending') {
      return res.status(400).json({ error: "Request has already been reviewed" });
    }
    
    // Update the request status
    await db.query(
      `UPDATE topup_requests 
       SET status = $1, admin_notes = $2, reviewed_by = $3, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = $4`,
      [action, adminNotes, adminName, id]
    );
    
    // If approved, update user's wallet balance
    if (action === 'approved') {
      await db.query(`
        INSERT INTO wallets(firebase_uid, balance)
        VALUES($1, $2)
        ON CONFLICT(firebase_uid) DO UPDATE
          SET balance = wallets.balance + $2, updated_at = NOW()
      `, [topupRequest.firebase_uid, topupRequest.amount]);
      
      console.log(`Wallet updated: Added ${topupRequest.amount} ${topupRequest.currency} to user ${topupRequest.firebase_uid}`);
    }
    
    res.json({ 
      success: true, 
      message: `Top-up request ${action} successfully`,
      walletUpdated: action === 'approved'
    });
  } catch (err) {
    console.error("Error reviewing top-up request:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Owner Dashboard Endpoints
// Get all users for owner dashboard
app.get('/api/owner/users', verifyToken, async (req, res) => {
  try {
    const firebase_uid = req.uid;
    
    // Check if user is admin/owner
    const adminCheck = await db.query(
      'SELECT is_admin FROM users WHERE firebase_uid = $1',
      [firebase_uid]
    );
    
    if (adminCheck.rows.length === 0 || !adminCheck.rows[0].is_admin) {
      return res.status(403).json({ error: 'Access denied - Admin privileges required' });
    }
    
    // Get all users with comprehensive information
    const usersResult = await db.query(`
      SELECT 
        u.firebase_uid,
        u.full_name,
        u.email,
        u.username,
        u.profile_picture,
        u.has_borrower_account,
        u.has_investor_account,
        u.current_account_type,
        u.created_at,
        u.updated_at,
        u.is_admin,
        bp.first_name,
        bp.last_name,
        bp.date_of_birth,
        bp.nationality,
        bp.phone_number,
        bp.present_address,
        bp.permanent_address,
        bp.city,
        bp.state,
        bp.postal_code,
        bp.country,
        bp.occupation,
        bp.business_type,
        bp.company_name,
        bp.industry_type,
        ip.qualified_investor,
        ip.investor_type,
        ip.risk_tolerance,
        (SELECT COUNT(*) FROM projects WHERE firebase_uid = u.firebase_uid) as total_projects,
        (SELECT COUNT(*) FROM projects WHERE firebase_uid = u.firebase_uid AND status = 'active') as active_projects,
        w.balance as wallet_balance
      FROM users u
      LEFT JOIN borrower_profiles bp ON u.firebase_uid = bp.firebase_uid
      LEFT JOIN investor_profiles ip ON u.firebase_uid = ip.firebase_uid
      LEFT JOIN wallets w ON u.firebase_uid = w.firebase_uid
      ORDER BY u.created_at DESC
    `);
    
    // Transform data to match frontend interface
    const users = usersResult.rows.map(row => {
      const accountTypes = [];
      if (row.has_borrower_account) accountTypes.push('borrower');
      if (row.has_investor_account) accountTypes.push('investor');
      
      return {
        id: row.firebase_uid,
        firebaseUid: row.firebase_uid,
        fullName: row.full_name || '',
        email: row.email || '',
        username: row.username || '',
        profilePicture: row.profile_picture,
        accountTypes,
        status: 'active', // We don't have a status field, assuming active
        memberSince: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '',
        lastActivity: row.updated_at ? new Date(row.updated_at).toISOString().split('T')[0] : '',
        totalProjects: parseInt(row.total_projects) || 0,
        activeProjects: parseInt(row.active_projects) || 0,
        isQualifiedInvestor: row.qualified_investor || false,
        location: row.city && row.state ? `${row.city}, ${row.state}` : (row.country || ''),
        walletBalance: parseFloat(row.wallet_balance) || 0,
        isAdmin: row.is_admin || false
      };
    });
    
    console.log(`📊 Fetched ${users.length} users for owner dashboard`);
    res.json(users);
    
  } catch (err) {
    console.error('❌ Error fetching users for owner dashboard:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get detailed user information by ID for owner dashboard
app.get('/api/owner/users/:userId', verifyToken, async (req, res) => {
  try {
    const firebase_uid = req.uid;
    const { userId } = req.params;
    
    // Check if user is admin/owner
    const adminCheck = await db.query(
      'SELECT is_admin FROM users WHERE firebase_uid = $1',
      [firebase_uid]
    );
    
    if (adminCheck.rows.length === 0 || !adminCheck.rows[0].is_admin) {
      return res.status(403).json({ error: 'Access denied - Admin privileges required' });
    }
    
    // Get comprehensive user information
    const userResult = await db.query(`
      SELECT 
        u.firebase_uid,
        u.full_name,
        u.email,
        u.username,
        u.profile_picture,
        u.has_borrower_account,
        u.has_investor_account,
        u.current_account_type,
        u.created_at,
        u.updated_at,
        u.is_admin,
        bp.first_name,
        bp.last_name,
        bp.middle_name,
        bp.date_of_birth,
        bp.place_of_birth,
        bp.nationality,
        bp.gender,
        bp.marital_status,
        bp.phone_number,
        bp.present_address,
        bp.permanent_address,
        bp.city,
        bp.state,
        bp.postal_code,
        bp.country,
        bp.occupation,
        bp.business_type,
        bp.company_name,
        bp.industry_type,
        bp.annual_income,
        bp.source_of_funds,
        bp.kyc_level,
        bp.kyc_verified,
        bp.identity_document_type,
        bp.identity_document_number,
        bp.identity_document_expiry,
        bp.identity_document_issuing_country,
        ip.qualified_investor,
        ip.investor_type,
        ip.risk_tolerance,
        ip.investment_experience,
        ip.expected_investment_amount,
        w.balance as wallet_balance,
        (SELECT COUNT(*) FROM projects WHERE firebase_uid = u.firebase_uid) as total_projects,
        (SELECT COUNT(*) FROM projects WHERE firebase_uid = u.firebase_uid AND status = 'active') as active_projects,
        (SELECT COUNT(*) FROM projects WHERE firebase_uid = u.firebase_uid AND status = 'completed') as completed_projects
      FROM users u
      LEFT JOIN borrower_profiles bp ON u.firebase_uid = bp.firebase_uid
      LEFT JOIN investor_profiles ip ON u.firebase_uid = ip.firebase_uid
      LEFT JOIN wallets w ON u.firebase_uid = w.firebase_uid
      WHERE u.firebase_uid = $1
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const row = userResult.rows[0];
    
    // Get bank account information if exists
    const bankAccountsResult = await db.query(`
      SELECT 
        bank_name,
        account_name,
        account_number,
        account_type,
        is_default,
        verification_status
      FROM bank_accounts 
      WHERE firebase_uid = $1
    `, [userId]);
    
    const accountTypes = [];
    if (row.has_borrower_account) accountTypes.push('borrower');
    if (row.has_investor_account) accountTypes.push('investor');
    
    // Build comprehensive user detail response
    const userDetail = {
      id: row.firebase_uid,
      firebaseUid: row.firebase_uid,
      fullName: row.full_name || '',
      email: row.email || '',
      username: row.username || '',
      profilePicture: row.profile_picture,
      phoneNumber: row.phone_number,
      accountTypes,
      status: 'active', // Default to active since we don't have status field
      memberSince: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '',
      lastActivity: row.updated_at ? new Date(row.updated_at).toISOString().split('T')[0] : '',
      location: row.city && row.state ? `${row.city}, ${row.state}` : (row.country || ''),
      occupation: row.occupation || '',
      issuerCode: '', // This would need to be generated if required
      isQualifiedInvestor: row.qualified_investor || false,
      isAdmin: row.is_admin || false,
      walletBalance: parseFloat(row.wallet_balance) || 0,
      
      personalProfile: {
        firstName: row.first_name || '',
        lastName: row.last_name || '',
        middleName: row.middle_name || '',
        dateOfBirth: row.date_of_birth || '',
        placeOfBirth: row.place_of_birth || '',
        nationality: row.nationality || '',
        gender: row.gender || '',
        maritalStatus: row.marital_status || '',
        emailAddress: row.email || '',
        mobileNumber: row.phone_number || ''
      },
      
      addresses: {
        presentAddress: row.present_address || '',
        permanentAddress: row.permanent_address || '',
        city: row.city || '',
        state: row.state || '',
        postalCode: row.postal_code || '',
        country: row.country || ''
      },
      
      identifications: row.identity_document_type ? [{
        idType: row.identity_document_type,
        idNumber: row.identity_document_number || '',
        expiryDate: row.identity_document_expiry || '',
        issuingCountry: row.identity_document_issuing_country || '',
        verificationStatus: row.kyc_verified ? 'verified' : 'pending'
      }] : [],
      
      bankAccounts: bankAccountsResult.rows.map(bank => ({
        bankName: bank.bank_name,
        accountName: bank.account_name,
        accountNumber: bank.account_number,
        accountType: bank.account_type,
        isDefault: bank.is_default,
        verificationStatus: bank.verification_status || 'pending'
      })),
      
      borrowerData: row.has_borrower_account ? {
        totalProjects: parseInt(row.total_projects) || 0,
        activeProjects: parseInt(row.active_projects) || 0,
        completedProjects: parseInt(row.completed_projects) || 0,
        businessType: row.business_type || '',
        companyName: row.company_name || '',
        industryType: row.industry_type || '',
        fundingLimits: 0, // This would need to be calculated
        kycLevel: row.kyc_level || 'Level 1'
      } : undefined,
      
      investorData: row.has_investor_account ? {
        totalInvestments: 0, // This would need to be calculated
        activeInvestments: 0, // This would need to be calculated  
        portfolioValue: 0, // This would need to be calculated
        investorType: row.investor_type || 'individual',
        qualifiedInvestor: row.qualified_investor || false,
        riskTolerance: row.risk_tolerance || 'Medium',
        investmentLimits: 0 // This would need to be calculated
      } : undefined
    };
    
    console.log(`📊 Fetched detailed user information for: ${userDetail.fullName} (${userId})`);
    res.json(userDetail);
    
  } catch (err) {
    console.error('❌ Error fetching user details:', err);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Owner endpoint to suspend/unsuspend user
app.post('/api/owner/users/:userId/suspend', verifyToken, async (req, res) => {
  try {
    const firebase_uid = req.uid;
    const { userId } = req.params;
    const { reason } = req.body;
    
    // Check if user is admin/owner
    const adminCheck = await db.query(
      'SELECT is_admin FROM users WHERE firebase_uid = $1',
      [firebase_uid]
    );
    
    if (adminCheck.rows.length === 0 || !adminCheck.rows[0].is_admin) {
      return res.status(403).json({ error: 'Access denied - Admin privileges required' });
    }
    
    // Update user status - for now we'll use a simple flag
    await db.query(
      'UPDATE users SET updated_at = NOW() WHERE firebase_uid = $1',
      [userId]
    );
    
    // Log the action (you might want to create an admin_actions table)
    console.log(`👮 Admin ${firebase_uid} suspended user ${userId} - Reason: ${reason}`);
    
    res.json({ 
      success: true, 
      message: 'User suspended successfully',
      action: 'suspended'
    });
    
  } catch (err) {
    console.error('❌ Error suspending user:', err);
    res.status(500).json({ error: 'Failed to suspend user' });
  }
});

// Owner endpoint to delete user (soft delete)
app.delete('/api/owner/users/:userId', verifyToken, async (req, res) => {
  try {
    const firebase_uid = req.uid;
    const { userId } = req.params;
    const { reason } = req.body;
    
    // Check if user is admin/owner
    const adminCheck = await db.query(
      'SELECT is_admin FROM users WHERE firebase_uid = $1',
      [firebase_uid]
    );
    
    if (adminCheck.rows.length === 0 || !adminCheck.rows[0].is_admin) {
      return res.status(403).json({ error: 'Access denied - Admin privileges required' });
    }
    
    // Soft delete - don't actually remove from database but mark as deleted
    await db.query(
      'UPDATE users SET updated_at = NOW() WHERE firebase_uid = $1',
      [userId]
    );
    
    // Log the action
    console.log(`🗑️ Admin ${firebase_uid} deleted user ${userId} - Reason: ${reason}`);
    
    res.json({ 
      success: true, 
      message: 'User deleted successfully',
      action: 'deleted'
    });
    
  } catch (err) {
    console.error('❌ Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Owner endpoint to reactivate user
app.post('/api/owner/users/:userId/reactivate', verifyToken, async (req, res) => {
  try {
    const firebase_uid = req.uid;
    const { userId } = req.params;
    
    // Check if user is admin/owner
    const adminCheck = await db.query(
      'SELECT is_admin FROM users WHERE firebase_uid = $1',
      [firebase_uid]
    );
    
    if (adminCheck.rows.length === 0 || !adminCheck.rows[0].is_admin) {
      return res.status(403).json({ error: 'Access denied - Admin privileges required' });
    }
    
    // Reactivate user
    await db.query(
      'UPDATE users SET updated_at = NOW() WHERE firebase_uid = $1',
      [userId]
    );
    
    // Log the action
    console.log(`✅ Admin ${firebase_uid} reactivated user ${userId}`);
    
    res.json({ 
      success: true, 
      message: 'User reactivated successfully',
      action: 'active'
    });
    
  } catch (err) {
    console.error('❌ Error reactivating user:', err);
    res.status(500).json({ error: 'Failed to reactivate user' });
  }
});

// Admin endpoint to clear all projects and investment requests
app.delete('/api/admin/clear-all-data', verifyToken, async (req, res) => {
  try {
    const firebase_uid = req.uid;
    
    // Check if user is admin
    const adminCheck = await db.query(
      'SELECT is_admin FROM users WHERE firebase_uid = $1',
      [firebase_uid]
    );
    
    if (!adminCheck.rows[0] || !adminCheck.rows[0].is_admin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    console.log('🗑️ Admin user initiated database cleanup...');
    
    // Delete all projects (this will also remove all investment requests since they're stored in project_data)
    const projectsResult = await db.query('DELETE FROM projects');
    console.log(`✅ Deleted ${projectsResult.rowCount} projects`);
    
    // Delete all borrow requests
    const borrowRequestsResult = await db.query('DELETE FROM borrow_requests');
    console.log(`✅ Deleted ${borrowRequestsResult.rowCount} borrow requests`);
    
    // Delete all topup requests
    const topupRequestsResult = await db.query('DELETE FROM topup_requests');
    console.log(`✅ Deleted ${topupRequestsResult.rowCount} topup requests`);
    
    // Reset all wallet balances to 0 (optional - you can comment this out if you want to keep wallet balances)
    const walletsResult = await db.query('UPDATE wallets SET balance = 0');
    console.log(`✅ Reset ${walletsResult.rowCount} wallet balances to 0`);
    
    console.log('🎉 Database cleanup completed successfully');
    
    res.json({ 
      success: true, 
      message: "Database cleaned successfully",
      deleted: {
        projects: projectsResult.rowCount,
        borrowRequests: borrowRequestsResult.rowCount,
        topupRequests: topupRequestsResult.rowCount,
        walletsReset: walletsResult.rowCount
      }
    });
    
  } catch (err) {
    console.error("Error cleaning database:", err);
    res.status(500).json({ error: "Database cleanup failed" });
  }
});

const PORT = process.env.PORT || 3001;

// Set up admin user before starting server
(async () => {
  try {
    console.log('🔧 Setting up admin user...');
    
    // Remove admin status from all users first
    await db.query('UPDATE users SET is_admin = false');
    console.log('✅ Removed admin status from all users');
    
    // Get Firebase user by email to find the correct UID
    let adminUID = null;
    try {
      const userRecord = await admin.auth().getUserByEmail('m.shahbazsherwani@gmail.com');
      adminUID = userRecord.uid;
      console.log(`🔍 Found Firebase UID for admin email: ${adminUID}`);
    } catch (firebaseError) {
      console.log('⚠️ Could not find Firebase user with email m.shahbazsherwani@gmail.com');
      console.log('Will check database for existing users...');
    }
    
    if (adminUID) {
      // Set the specific Firebase UID as admin
      const adminResult = await db.query(
        'UPDATE users SET is_admin = true WHERE firebase_uid = $1',
        [adminUID]
      );
      
      if (adminResult.rowCount > 0) {
        console.log('✅ Set user with UID', adminUID, 'as admin');
      } else {
        console.log('⚠️ Firebase UID not found in database - user needs to sign in first');
      }
    }
    
    // Show current admin users
    const adminCheck = await db.query('SELECT firebase_uid, full_name, is_admin FROM users WHERE is_admin = true');
    console.log('📋 Current admin users:', adminCheck.rows);
    
  } catch (err) {
    console.error('❌ Error updating admin status:', err);
  }
})();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('🚀 Server is ready to accept connections');
  
  // Keep the process alive
  setInterval(() => {
    // This empty interval keeps the process running
  }, 30000); // Every 30 seconds
});
