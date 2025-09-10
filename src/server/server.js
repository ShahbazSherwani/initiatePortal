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

// Read the service account JSON file
const serviceAccount = JSON.parse(
  readFileSync(new URL('./firebase-service-account.json', import.meta.url))
);

// Initialize Firebase Admin SDK
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
      has_completed_registration: rows[0].has_completed_registration || false
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
        console.log('⚠️  User has borrower flag but no borrower profile - creating fallback');
        // Create a basic fallback borrower profile
        accounts.borrower = {
          type: 'borrower',
          profile: {
            id: firebase_uid,
            firebase_uid: firebase_uid,
            full_name: user.full_name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          isComplete: true,
          hasActiveProject: false
        };
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
        console.log('⚠️  User has investor flag but no investor profile - creating fallback');
        // Create a basic fallback investor profile
        accounts.investor = {
          type: 'investor',
          profile: {
            id: firebase_uid,
            firebase_uid: firebase_uid,
            full_name: user.full_name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          isComplete: true,
          portfolioValue: 0
        };
      }
    }
    
    console.log('📤 Returning accounts:', { accounts, currentAccountType: user.current_account_type });
    res.json({
      user: {
        full_name: user.full_name,
        currentAccountType: user.current_account_type
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
      `SELECT firebase_uid, full_name, current_account_type, has_borrower_account, has_investor_account FROM users WHERE firebase_uid = $1`,
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
      email: userEmail,
      phone: user.phone_number || '',
      dateOfBirth: user.date_of_birth || '',
      nationality: user.nationality || '',
      accountType: user.current_account_type || 'individual',
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
      },
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
        };
        
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
        };
        console.log('✅ Mapped identification data from investor profile:', profileData.identification);
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
      await db.query(
        `UPDATE users SET 
         full_name = $1,
         updated_at = CURRENT_TIMESTAMP
         WHERE firebase_uid = $2`,
        [profileData.fullName, firebase_uid]
      );
      console.log('✅ Basic user info updated successfully');
      
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
  
  try {
    // Verify admin status
    const adminResult = await db.query(
      `SELECT is_admin FROM users WHERE firebase_uid = $1`,
      [adminUid]
    );
    
    if (!adminResult.rows[0]?.is_admin) {
      return res.status(403).json({ error: "Unauthorized - Admin access required" });
    }
    
    // Get the project
    const projectResult = await db.query(
      `SELECT project_data FROM projects WHERE id = $1`,
      [projectId]
    );
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    const projectData = projectResult.rows[0].project_data;
    
    if (!projectData.investorRequests) {
      return res.status(400).json({ error: "No investment requests found" });
    }
    
    // Find and update the specific investment request
    const investmentIndex = projectData.investorRequests.findIndex(
      req => req.investorId === investorId
    );
    
    if (investmentIndex === -1) {
      return res.status(404).json({ error: "Investment request not found" });
    }
    
    // Update the investment request status
    projectData.investorRequests[investmentIndex].status = action === 'approve' ? 'approved' : 'rejected';
    projectData.investorRequests[investmentIndex].reviewedAt = new Date().toISOString();
    projectData.investorRequests[investmentIndex].reviewedBy = adminUid;
    
    if (comment) {
      projectData.investorRequests[investmentIndex].adminComment = comment;
    }
    
    // If approved, update the funding meter
    if (action === 'approve') {
      const approvedAmount = projectData.investorRequests[investmentIndex].amount;
      
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
      
      console.log(`💰 Investment approved: Added $${approvedAmount} to project ${projectId}. Total funded: $${projectData.funding.totalFunded}`);
    }
    
    // Update the project in database
    await db.query(
      `UPDATE projects 
       SET project_data = $1, updated_at = NOW()
       WHERE id = $2`,
      [projectData, projectId]
    );
    
    res.json({ 
      success: true, 
      message: `Investment request ${action}d successfully`,
      investment: projectData.investorRequests[investmentIndex]
    });
    
  } catch (err) {
    console.error("Error reviewing investment request:", err);
    res.status(500).json({ error: "Database error" });
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
    
    if (!accountType || !kycData) {
      return res.status(400).json({ error: "Missing required fields: accountType and kycData" });
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
        await db.query(`
          INSERT INTO borrower_profiles (
            firebase_uid, is_individual_account, place_of_birth, gender, civil_status, 
            nationality, contact_email, secondary_id_type, secondary_id_number,
            emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, 
            emergency_contact_email, business_registration_type, business_registration_number,
            business_registration_date, corporate_tin, nature_of_business, principal_office_street,
            principal_office_barangay, principal_office_municipality, principal_office_province,
            principal_office_country, principal_office_postal_code, gis_total_assets,
            gis_total_liabilities, gis_paid_up_capital, gis_number_of_stockholders,
            gis_number_of_employees, is_politically_exposed_person, pep_details,
            authorized_signatory_name, authorized_signatory_position, authorized_signatory_id_type,
            authorized_signatory_id_number, is_complete, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 
            $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, 
            TRUE, NOW(), NOW()
          )
          ON CONFLICT (firebase_uid) DO UPDATE SET
            is_individual_account = EXCLUDED.is_individual_account,
            place_of_birth = EXCLUDED.place_of_birth,
            gender = EXCLUDED.gender,
            civil_status = EXCLUDED.civil_status,
            nationality = EXCLUDED.nationality,
            contact_email = EXCLUDED.contact_email,
            secondary_id_type = EXCLUDED.secondary_id_type,
            secondary_id_number = EXCLUDED.secondary_id_number,
            emergency_contact_name = EXCLUDED.emergency_contact_name,
            emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
            emergency_contact_phone = EXCLUDED.emergency_contact_phone,
            emergency_contact_email = EXCLUDED.emergency_contact_email,
            business_registration_type = EXCLUDED.business_registration_type,
            business_registration_number = EXCLUDED.business_registration_number,
            business_registration_date = EXCLUDED.business_registration_date,
            corporate_tin = EXCLUDED.corporate_tin,
            nature_of_business = EXCLUDED.nature_of_business,
            principal_office_street = EXCLUDED.principal_office_street,
            principal_office_barangay = EXCLUDED.principal_office_barangay,
            principal_office_municipality = EXCLUDED.principal_office_municipality,
            principal_office_province = EXCLUDED.principal_office_province,
            principal_office_country = EXCLUDED.principal_office_country,
            principal_office_postal_code = EXCLUDED.principal_office_postal_code,
            gis_total_assets = EXCLUDED.gis_total_assets,
            gis_total_liabilities = EXCLUDED.gis_total_liabilities,
            gis_paid_up_capital = EXCLUDED.gis_paid_up_capital,
            gis_number_of_stockholders = EXCLUDED.gis_number_of_stockholders,
            gis_number_of_employees = EXCLUDED.gis_number_of_employees,
            is_politically_exposed_person = EXCLUDED.is_politically_exposed_person,
            pep_details = EXCLUDED.pep_details,
            authorized_signatory_name = EXCLUDED.authorized_signatory_name,
            authorized_signatory_position = EXCLUDED.authorized_signatory_position,
            authorized_signatory_id_type = EXCLUDED.authorized_signatory_id_type,
            authorized_signatory_id_number = EXCLUDED.authorized_signatory_id_number,
            is_complete = TRUE,
            updated_at = NOW()
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
      } else {
        // Similar for investor_profiles
        await db.query(`
          INSERT INTO investor_profiles (
            firebase_uid, is_individual_account, place_of_birth, gender, civil_status, 
            nationality, contact_email, secondary_id_type, secondary_id_number,
            emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, 
            emergency_contact_email, business_registration_type, business_registration_number,
            business_registration_date, corporate_tin, nature_of_business, principal_office_street,
            principal_office_barangay, principal_office_municipality, principal_office_province,
            principal_office_country, principal_office_postal_code, gis_total_assets,
            gis_total_liabilities, gis_paid_up_capital, gis_number_of_stockholders,
            gis_number_of_employees, is_politically_exposed_person, pep_details,
            authorized_signatory_name, authorized_signatory_position, authorized_signatory_id_type,
            authorized_signatory_id_number, is_complete, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 
            $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, 
            TRUE, NOW(), NOW()
          )
          ON CONFLICT (firebase_uid) DO UPDATE SET
            is_individual_account = EXCLUDED.is_individual_account,
            place_of_birth = EXCLUDED.place_of_birth,
            gender = EXCLUDED.gender,
            civil_status = EXCLUDED.civil_status,
            nationality = EXCLUDED.nationality,
            contact_email = EXCLUDED.contact_email,
            secondary_id_type = EXCLUDED.secondary_id_type,
            secondary_id_number = EXCLUDED.secondary_id_number,
            emergency_contact_name = EXCLUDED.emergency_contact_name,
            emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
            emergency_contact_phone = EXCLUDED.emergency_contact_phone,
            emergency_contact_email = EXCLUDED.emergency_contact_email,
            business_registration_type = EXCLUDED.business_registration_type,
            business_registration_number = EXCLUDED.business_registration_number,
            business_registration_date = EXCLUDED.business_registration_date,
            corporate_tin = EXCLUDED.corporate_tin,
            nature_of_business = EXCLUDED.nature_of_business,
            principal_office_street = EXCLUDED.principal_office_street,
            principal_office_barangay = EXCLUDED.principal_office_barangay,
            principal_office_municipality = EXCLUDED.principal_office_municipality,
            principal_office_province = EXCLUDED.principal_office_province,
            principal_office_country = EXCLUDED.principal_office_country,
            principal_office_postal_code = EXCLUDED.principal_office_postal_code,
            gis_total_assets = EXCLUDED.gis_total_assets,
            gis_total_liabilities = EXCLUDED.gis_total_liabilities,
            gis_paid_up_capital = EXCLUDED.gis_paid_up_capital,
            gis_number_of_stockholders = EXCLUDED.gis_number_of_stockholders,
            gis_number_of_employees = EXCLUDED.gis_number_of_employees,
            is_politically_exposed_person = EXCLUDED.is_politically_exposed_person,
            pep_details = EXCLUDED.pep_details,
            authorized_signatory_name = EXCLUDED.authorized_signatory_name,
            authorized_signatory_position = EXCLUDED.authorized_signatory_position,
            authorized_signatory_id_type = EXCLUDED.authorized_signatory_id_type,
            authorized_signatory_id_number = EXCLUDED.authorized_signatory_id_number,
            is_complete = TRUE,
            updated_at = NOW()
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
    console.error("Error completing KYC:", err);
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
    let query = `SELECT p.id, p.firebase_uid, p.project_data, p.created_at, u.full_name 
                FROM projects p
                LEFT JOIN users u ON p.firebase_uid = u.firebase_uid`;
    
    const params = [];
    let conditions = [];
    
    // Handle status parameter
    if (status) {
      conditions.push(`p.project_data->>'status' = $${params.length + 1}`);
      params.push(status);
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

// Create a test project for admin review
app.post('/api/projects/create-test', verifyToken, async (req, res) => {
  const uid = req.uid;
  
  try {
    // Create a test project with pending approval status
    const testProject = {
      type: "lending",
      status: "published",
      approvalStatus: "pending",
      details: {
        product: "Test Admin Project",
        loanAmount: "100000",
        projectRequirements: "Testing admin review",
        investorPercentage: "10",
        timeDuration: "12",
        location: "Test Location",
        overview: "This is a test project to verify admin functionality"
      },
      createdAt: new Date().toISOString()
    };
    
    const result = await db.query(
      `INSERT INTO projects (firebase_uid, project_data)
       VALUES ($1, $2) RETURNING id`,
      [uid, testProject]
    );
    
    res.json({ 
      success: true, 
      message: "Test project created successfully",
      projectId: result.rows[0].id
    });
  } catch (err) {
    console.error("Error creating test project:", err);
    res.status(500).json({ error: "Database error" });
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
    
    // Log what's being returned
    console.log(`Calendar API returning ${rows.length} projects (published, draft, pending, or no status)`);
    
    res.json(rows);
  } catch (err) {
    console.error("Error fetching calendar projects:", err);
    res.status(500).json({ error: "Database error" });
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
