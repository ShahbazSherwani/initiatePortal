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
      readFileSync(new URL('../../backend/firebase-service-account.json', import.meta.url))
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
    
    // Debug logging for Firebase configuration
    console.log('🔧 Firebase config debug:', {
      hasProjectId: !!serviceAccount.project_id,
      hasPrivateKeyId: !!serviceAccount.private_key_id,
      hasPrivateKey: !!serviceAccount.private_key,
      privateKeyLength: serviceAccount.private_key?.length,
      privateKeyStart: serviceAccount.private_key?.substring(0, 50),
      hasClientEmail: !!serviceAccount.client_email,
      clientEmail: serviceAccount.client_email
    });
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
        
        // Create missing profile tables for bank accounts
        console.log('🔄 Creating missing profile tables...');
        
        // Create borrower_profiles table
        await db.query(`
          CREATE TABLE IF NOT EXISTS borrower_profiles (
              id SERIAL PRIMARY KEY,
              firebase_uid VARCHAR(255) UNIQUE NOT NULL,
              is_individual_account BOOLEAN DEFAULT TRUE,
              bank_name VARCHAR(255),
              account_number VARCHAR(50),
              account_name VARCHAR(255),
              iban VARCHAR(100),
              swift_code VARCHAR(50),
              preferred BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP DEFAULT NOW(),
              updated_at TIMESTAMP DEFAULT NOW(),
              FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE
          )
        `);
        
        console.log('✅ Borrower profiles table created');
        
        // Create investor_profiles table
        await db.query(`
          CREATE TABLE IF NOT EXISTS investor_profiles (
              id SERIAL PRIMARY KEY,
              firebase_uid VARCHAR(255) UNIQUE NOT NULL,
              is_individual_account BOOLEAN DEFAULT TRUE,
              bank_name VARCHAR(255),
              account_number VARCHAR(50),
              account_name VARCHAR(255),
              iban VARCHAR(100),
              swift_code VARCHAR(50),
              preferred BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP DEFAULT NOW(),
              updated_at TIMESTAMP DEFAULT NOW(),
              FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE
          )
        `);
        
        console.log('✅ Investor profiles table created');
        
        // Create indexes for better performance
        try {
          await db.query(`CREATE INDEX IF NOT EXISTS idx_borrower_profiles_firebase_uid ON borrower_profiles(firebase_uid)`);
          await db.query(`CREATE INDEX IF NOT EXISTS idx_investor_profiles_firebase_uid ON investor_profiles(firebase_uid)`);
          await db.query(`CREATE INDEX IF NOT EXISTS idx_borrower_profiles_bank_name ON borrower_profiles(bank_name)`);
          await db.query(`CREATE INDEX IF NOT EXISTS idx_investor_profiles_bank_name ON investor_profiles(bank_name)`);
          console.log('✅ Profile table indexes created');
        } catch (indexErr) {
          console.log('⚠️ Index creation had issues:', indexErr.message);
        }

        // Insert profiles for existing users who have borrower/investor accounts
        try {
          await db.query(`
            INSERT INTO borrower_profiles (firebase_uid, is_individual_account, created_at, updated_at)
            SELECT 
                firebase_uid, 
                CASE WHEN current_account_type = 'individual' THEN TRUE ELSE FALSE END,
                created_at,
                updated_at
            FROM users 
            WHERE has_borrower_account = TRUE
            ON CONFLICT (firebase_uid) DO NOTHING
          `);

          await db.query(`
            INSERT INTO investor_profiles (firebase_uid, is_individual_account, created_at, updated_at)
            SELECT 
                firebase_uid, 
                CASE WHEN current_account_type = 'individual' THEN TRUE ELSE FALSE END,
                created_at,
                updated_at
            FROM users 
            WHERE has_investor_account = TRUE
            ON CONFLICT (firebase_uid) DO NOTHING
          `);
          
          console.log('✅ Profile tables populated with existing users');
        } catch (insertErr) {
          console.log('⚠️ Profile population had issues:', insertErr.message);
        }
        
        console.log('✅ Profile tables migration completed successfully');
      }
    } catch (err) {
      console.error('❌ Profile picture migration failed:', err.message);
    }
  };
  
  // Investor KYC fields migration function
  const runInvestorKycMigration = async () => {
    try {
      console.log('🔧 Running investor KYC fields migration...');
      
      // Add KYC fields to investor_profiles table
      await db.query(`
        ALTER TABLE investor_profiles 
          ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS last_name VARCHAR(255), 
          ADD COLUMN IF NOT EXISTS middle_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS suffix_name VARCHAR(100),
          ADD COLUMN IF NOT EXISTS date_of_birth DATE,
          ADD COLUMN IF NOT EXISTS place_of_birth VARCHAR(255),
          ADD COLUMN IF NOT EXISTS nationality VARCHAR(100),
          ADD COLUMN IF NOT EXISTS gender VARCHAR(50),
          ADD COLUMN IF NOT EXISTS civil_status VARCHAR(100),
          ADD COLUMN IF NOT EXISTS email_address VARCHAR(255),
          ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(50),
          ADD COLUMN IF NOT EXISTS country_code VARCHAR(10),
          ADD COLUMN IF NOT EXISTS present_address TEXT,
          ADD COLUMN IF NOT EXISTS permanent_address TEXT,
          ADD COLUMN IF NOT EXISTS city VARCHAR(100),
          ADD COLUMN IF NOT EXISTS state VARCHAR(100),
          ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
          ADD COLUMN IF NOT EXISTS country VARCHAR(100),
          ADD COLUMN IF NOT EXISTS national_id VARCHAR(100),
          ADD COLUMN IF NOT EXISTS passport VARCHAR(100),
          ADD COLUMN IF NOT EXISTS tin_number VARCHAR(100),
          ADD COLUMN IF NOT EXISTS occupation VARCHAR(255),
          ADD COLUMN IF NOT EXISTS employer_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS employer_address TEXT,
          ADD COLUMN IF NOT EXISTS employment_status VARCHAR(100),
          ADD COLUMN IF NOT EXISTS gross_annual_income VARCHAR(100),
          ADD COLUMN IF NOT EXISTS source_of_income TEXT,
          ADD COLUMN IF NOT EXISTS investment_experience VARCHAR(100),
          ADD COLUMN IF NOT EXISTS investment_objectives TEXT,
          ADD COLUMN IF NOT EXISTS risk_tolerance VARCHAR(100),
          ADD COLUMN IF NOT EXISTS investment_horizon VARCHAR(100),
          ADD COLUMN IF NOT EXISTS liquid_net_worth VARCHAR(100),
          ADD COLUMN IF NOT EXISTS pep_status VARCHAR(10) DEFAULT 'no',
          ADD COLUMN IF NOT EXISTS pep_details TEXT,
          ADD COLUMN IF NOT EXISTS pep_country VARCHAR(100),
          ADD COLUMN IF NOT EXISTS pep_position VARCHAR(255),
          ADD COLUMN IF NOT EXISTS related_pep_status VARCHAR(10) DEFAULT 'no',
          ADD COLUMN IF NOT EXISTS related_pep_details TEXT,
          ADD COLUMN IF NOT EXISTS related_pep_relationship VARCHAR(100),
          ADD COLUMN IF NOT EXISTS related_pep_country VARCHAR(100),
          ADD COLUMN IF NOT EXISTS related_pep_position VARCHAR(255),
          ADD COLUMN IF NOT EXISTS entity_type VARCHAR(100),
          ADD COLUMN IF NOT EXISTS entity_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100),
          ADD COLUMN IF NOT EXISTS registration_type VARCHAR(100),
          ADD COLUMN IF NOT EXISTS registration_date DATE,
          ADD COLUMN IF NOT EXISTS business_address TEXT,
          ADD COLUMN IF NOT EXISTS authorized_person_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS authorized_person_position VARCHAR(255),
          ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT FALSE
      `);
      
      console.log('✅ Investor KYC fields migration completed successfully');
    } catch (err) {
      console.error('❌ Investor KYC migration failed:', err.message);
    }
  };

  // Borrower KYC fields migration function
  const runBorrowerKycMigration = async () => {
    try {
      console.log('🔧 Running borrower KYC fields migration...');
      
      // Add KYC fields to borrower_profiles table
      await db.query(`
        ALTER TABLE borrower_profiles 
          ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS last_name VARCHAR(255), 
          ADD COLUMN IF NOT EXISTS middle_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS suffix_name VARCHAR(100),
          ADD COLUMN IF NOT EXISTS date_of_birth DATE,
          ADD COLUMN IF NOT EXISTS place_of_birth VARCHAR(255),
          ADD COLUMN IF NOT EXISTS nationality VARCHAR(100),
          ADD COLUMN IF NOT EXISTS gender VARCHAR(50),
          ADD COLUMN IF NOT EXISTS civil_status VARCHAR(100),
          ADD COLUMN IF NOT EXISTS email_address VARCHAR(255),
          ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(50),
          ADD COLUMN IF NOT EXISTS country_code VARCHAR(10),
          ADD COLUMN IF NOT EXISTS present_address TEXT,
          ADD COLUMN IF NOT EXISTS permanent_address TEXT,
          ADD COLUMN IF NOT EXISTS city VARCHAR(100),
          ADD COLUMN IF NOT EXISTS state VARCHAR(100),
          ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
          ADD COLUMN IF NOT EXISTS country VARCHAR(100),
          ADD COLUMN IF NOT EXISTS national_id VARCHAR(100),
          ADD COLUMN IF NOT EXISTS passport VARCHAR(100),
          ADD COLUMN IF NOT EXISTS tin_number VARCHAR(100),
          ADD COLUMN IF NOT EXISTS occupation VARCHAR(255),
          ADD COLUMN IF NOT EXISTS employer_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS employer_address TEXT,
          ADD COLUMN IF NOT EXISTS employment_status VARCHAR(100),
          ADD COLUMN IF NOT EXISTS gross_annual_income VARCHAR(100),
          ADD COLUMN IF NOT EXISTS source_of_income TEXT,
          ADD COLUMN IF NOT EXISTS entity_type VARCHAR(100),
          ADD COLUMN IF NOT EXISTS entity_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100),
          ADD COLUMN IF NOT EXISTS registration_type VARCHAR(100),
          ADD COLUMN IF NOT EXISTS registration_date DATE,
          ADD COLUMN IF NOT EXISTS business_address TEXT,
          ADD COLUMN IF NOT EXISTS authorized_person_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS authorized_person_position VARCHAR(255),
          ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT FALSE
      `);
      
      console.log('✅ Borrower KYC fields migration completed successfully');
    } catch (err) {
      console.error('❌ Borrower KYC migration failed:', err.message);
    }
  };

  // Add missing account_type column to profile tables
  const runAccountTypeMigration = async () => {
    try {
      console.log('🔧 Running account type migration...');
      
      // Add account_type column to borrower_profiles table
      await db.query(`
        ALTER TABLE borrower_profiles 
        ADD COLUMN IF NOT EXISTS account_type VARCHAR(100)
      `);
      
      // Add account_type column to investor_profiles table
      await db.query(`
        ALTER TABLE investor_profiles 
        ADD COLUMN IF NOT EXISTS account_type VARCHAR(100)
      `);
      
      console.log('✅ Account type migration completed successfully');
    } catch (err) {
      console.error('❌ Account type migration failed:', err.message);
    }
  };
  
  // Run migrations after a short delay to ensure connection is established
  setTimeout(() => {
    runProfilePictureMigration();
    setTimeout(runInvestorKycMigration, 1000); // Run after profile migration
    setTimeout(runBorrowerKycMigration, 2000); // Run after investor migration
    setTimeout(runAccountTypeMigration, 3000); // Run after borrower migration
  }, 3000);

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
        'https://initiate-portal.vercel.app',
        'https://initiate-portal-git-main-shahbazsherwanis-projects.vercel.app',
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
    
    // Check if user is suspended (skip for admin endpoints and profile endpoint)
    const isAdminEndpoint = req.url.includes('/api/owner/') || req.url.includes('/api/admin/');
    const isProfileEndpoint = req.url === '/api/profile' && req.method === 'GET';
    
    if (!isAdminEndpoint && !isProfileEndpoint && dbConnected && db) {
      try {
        const userCheck = await db.query(
          `SELECT status, suspension_reason, suspension_end_date FROM users WHERE firebase_uid = $1`,
          [decoded.uid]
        );
        
        if (userCheck.rows.length > 0 && userCheck.rows[0].status === 'suspended') {
          const user = userCheck.rows[0];
          console.log('🚫 Suspended user attempted access:', decoded.uid);
          
          let message = `Your account has been suspended. Reason: ${user.suspension_reason || 'Violation of terms'}. `;
          
          // Check if temporary suspension has expired
          if (user.suspension_end_date && new Date(user.suspension_end_date) < new Date()) {
            // Auto-reactivate expired suspension
            await db.query(
              `UPDATE users SET status = 'active', suspension_reason = NULL, suspended_at = NULL, 
               suspended_by = NULL, suspension_duration = NULL, suspension_end_date = NULL, 
               suspension_scope = NULL WHERE firebase_uid = $1`,
              [decoded.uid]
            );
            console.log('✅ Auto-reactivated expired suspension for user:', decoded.uid);
            // Allow access
            return next();
          }
          
          if (user.suspension_end_date) {
            message += `This suspension will be lifted on ${new Date(user.suspension_end_date).toLocaleDateString()}.`;
          }
          message += ' Please contact support for more information.';
          
          return res.status(403).json({ 
            error: 'Account Suspended',
            message: message,
            suspended: true,
            suspensionReason: user.suspension_reason,
            suspensionEndDate: user.suspension_end_date
          });
        }
      } catch (dbErr) {
        console.error('⚠️ Could not check suspension status:', dbErr.message);
        // Continue anyway - don't block access due to DB check failure
      }
    }
    
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

// Document upload endpoint for ID, passport, etc.
profileRouter.post('/upload-document', verifyToken, async (req, res) => {
  try {
    const { uid: firebase_uid } = req;
    const { documentType, documentImage, documentName } = req.body;
    
    if (!documentType || !documentImage) {
      return res.status(400).json({ error: 'Document type and image are required' });
    }
    
    // Valid document types
    const validTypes = ['national_id', 'passport', 'drivers_license', 'tin_id'];
    if (!validTypes.includes(documentType)) {
      return res.status(400).json({ error: 'Invalid document type' });
    }
    
    // Save document to database (could be extended to save to cloud storage)
    await db.query(
      `INSERT INTO user_documents (firebase_uid, document_type, document_image, document_name, uploaded_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (firebase_uid, document_type) DO UPDATE SET
       document_image = EXCLUDED.document_image,
       document_name = EXCLUDED.document_name,
       uploaded_at = EXCLUDED.uploaded_at`,
      [firebase_uid, documentType, documentImage, documentName || `${documentType}_document`]
    );
    
    console.log('✅ Document uploaded for user:', firebase_uid, 'Type:', documentType);
    res.json({ 
      success: true, 
      message: 'Document uploaded successfully',
      documentType,
      documentName
    });
    
  } catch (err) {
    console.error('❌ Error uploading document:', err);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Get user documents endpoint
profileRouter.get('/documents', verifyToken, async (req, res) => {
  try {
    const { uid: firebase_uid } = req;
    
    const result = await db.query(
      `SELECT document_type, document_image, document_name, uploaded_at 
       FROM user_documents WHERE firebase_uid = $1`,
      [firebase_uid]
    );
    
    const documents = {};
    result.rows.forEach(doc => {
      documents[doc.document_type] = {
        image: doc.document_image,
        name: doc.document_name,
        uploadedAt: doc.uploaded_at
      };
    });
    
    res.json({ documents });
    
  } catch (err) {
    console.error('❌ Error fetching documents:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
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

// Check user suspension status endpoint (for login page)
app.post('/api/auth/check-suspension', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'Token required' });
    }
    
    // Verify the Firebase token
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;
    
    // Check suspension status
    const userCheck = await db.query(
      `SELECT status, suspension_reason, suspension_end_date, suspension_scope FROM users WHERE firebase_uid = $1`,
      [uid]
    );
    
    if (userCheck.rows.length === 0) {
      return res.json({ suspended: false });
    }
    
    const user = userCheck.rows[0];
    
    if (user.status === 'suspended') {
      // Check if temporary suspension has expired
      if (user.suspension_end_date && new Date(user.suspension_end_date) < new Date()) {
        // Auto-reactivate expired suspension
        await db.query(
          `UPDATE users SET status = 'active', suspension_reason = NULL, suspended_at = NULL, 
           suspended_by = NULL, suspension_duration = NULL, suspension_end_date = NULL, 
           suspension_scope = NULL WHERE firebase_uid = $1`,
          [uid]
        );
        console.log('✅ Auto-reactivated expired suspension for user:', uid);
        return res.json({ suspended: false });
      }
      
      let message = `Your account has been suspended. `;
      
      if (user.suspension_reason) {
        message += `Reason: ${user.suspension_reason}. `;
      }
      
      if (user.suspension_end_date) {
        const endDate = new Date(user.suspension_end_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        message += `This suspension will be lifted on ${endDate}. `;
      } else {
        message += `This is a permanent suspension. `;
      }
      
      message += `Please contact support at support@initiateportal.com if you believe this is an error.`;
      
      return res.json({
        suspended: true,
        message: message,
        suspensionReason: user.suspension_reason,
        suspensionEndDate: user.suspension_end_date,
        suspensionScope: user.suspension_scope
      });
    }
    
    res.json({ suspended: false });
    
  } catch (err) {
    console.error('Error checking suspension status:', err);
    res.status(500).json({ error: 'Failed to check suspension status' });
  }
});

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
            firebase_uid, full_name, is_individual_account, is_complete, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
          [
            firebase_uid,
            profileData.fullName || 'Borrower User',
            true,
            false
          ]
        );
        
        // Update user account flags and registration status
        await client.query(
          `UPDATE users SET 
             has_borrower_account = TRUE, 
             has_completed_registration = TRUE,
             current_account_type = 'borrower',
             updated_at = NOW()
           WHERE firebase_uid = $1`,
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
        
        // Update user account flags and registration status
        await client.query(
          `UPDATE users SET 
             has_investor_account = TRUE, 
             has_completed_registration = TRUE,
             current_account_type = 'investor',
             updated_at = NOW()
           WHERE firebase_uid = $1`,
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
      bankAccount: {
        accountName: '',
        bankName: '',
        accountType: '',
        accountNumber: '',
        iban: '',
        swiftCode: '',
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
      pepStatus: false,
    };

    console.log('📋 Initial profile data:', profileData);
    console.log('👤 User account flags:', {
      has_borrower_account: user.has_borrower_account,
      has_investor_account: user.has_investor_account,
      current_account_type: user.current_account_type
    });

    // Get detailed profile data based on account type
    if (user.has_borrower_account) {
      console.log('🔍 Processing borrower account data...');
      const borrowerQuery = await db.query(
        `SELECT * FROM borrower_profiles WHERE firebase_uid = $1`,
        [firebase_uid]
      );
      
      console.log('👤 Borrower profile query result:', borrowerQuery.rows);
      
      if (borrowerQuery.rows.length > 0) {
        const borrower = borrowerQuery.rows[0];
        console.log('� Checking for address fields:', {
          present_address: borrower.present_address,
          city: borrower.city,
          state: borrower.state,
          country: borrower.country,
          postal_code: borrower.postal_code
        });
        console.log('🔍 Checking for identification fields:', {
          national_id: borrower.national_id,
          passport: borrower.passport,
          tin_number: borrower.tin_number
        });
        console.log('🔍 Checking for employment fields:', {
          occupation: borrower.occupation,
          employer_name: borrower.employer_name,
          employer_address: borrower.employer_address,
          source_of_income: borrower.source_of_income
        });
        console.log('🔍 Checking for emergency contact fields:', {
          emergency_contact_name: borrower.emergency_contact_name,
          emergency_contact_relationship: borrower.emergency_contact_relationship,
          emergency_contact_phone: borrower.emergency_contact_phone,
          emergency_contact_email: borrower.emergency_contact_email
        });
        console.log('🔍 All available borrower columns:', Object.keys(borrower));
        
        console.log('�📋 Borrower address columns available:', {
          street: borrower.street,
          barangay: borrower.barangay, 
          municipality: borrower.municipality,
          province: borrower.province,
          country: borrower.country,
          postal_code: borrower.postal_code,
          // Check alternative column names too
          principal_office_street: borrower.principal_office_street,
          principal_office_barangay: borrower.principal_office_barangay,
          principal_office_municipality: borrower.principal_office_municipality,
          principal_office_province: borrower.principal_office_province,
          principal_office_country: borrower.principal_office_country,
          principal_office_postal_code: borrower.principal_office_postal_code
        });
        
        profileData.phone = borrower.mobile_number || profileData.phone;
        profileData.dateOfBirth = borrower.date_of_birth || profileData.dateOfBirth;
        profileData.nationality = borrower.nationality || profileData.nationality;
        
        // Map borrower address fields - check both personal and principal office address
        profileData.address = {
          street: borrower.present_address || borrower.principal_office_street || '',
          barangay: borrower.barangay || borrower.principal_office_barangay || '',
          city: borrower.city || borrower.principal_office_municipality || '',
          state: borrower.state || borrower.principal_office_province || '',
          country: borrower.country || borrower.principal_office_country || '',
          postalCode: borrower.postal_code || borrower.principal_office_postal_code || '',
        };
        console.log('📍 Mapped borrower address:', profileData.address);
        
        // Map borrower identification fields (handle null values)
        profileData.identification = {
          nationalId: borrower.national_id || '',
          passport: borrower.passport || '',
          tin: borrower.tin_number || borrower.corporate_tin || '',
          secondaryIdType: borrower.secondary_id_type || '',
          secondaryIdNumber: borrower.secondary_id_number || '',
          nationalIdFile: borrower.national_id_file || null,
          passportFile: borrower.passport_file || null,
        };
        console.log('🆔 Mapped borrower identification:', profileData.identification);

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
          monthlyIncome: borrower.gross_annual_income || null,
        };

        // Emergency contact
        profileData.emergencyContact = {
          name: borrower.emergency_contact_name || '',
          relationship: borrower.emergency_contact_relationship || '',
          phone: borrower.emergency_contact_phone || '',
          address: borrower.emergency_contact_address || '',
        };

        // Bank account information
        profileData.bankAccount = {
          accountName: borrower.account_name || '',
          bankName: borrower.bank_name || '',
          accountType: borrower.account_type || '',
          accountNumber: borrower.account_number || '',
          iban: borrower.iban || '',
          swiftCode: borrower.swift_code || '',
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
      console.log('🔍 Processing investor account data...');
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
        
        profileData.phone = investor.mobile_number || profileData.phone;
        profileData.dateOfBirth = investor.date_of_birth || profileData.dateOfBirth;
        
        // Only update address fields that have actual values (merge don't overwrite)
        const currentAddress = profileData.address;
        profileData.address = {
          street: investor.present_address || currentAddress.street || '',
          barangay: investor.barangay || currentAddress.barangay || '',
          city: investor.city || currentAddress.city || '',
          state: investor.state || currentAddress.state || '',
          country: investor.country || currentAddress.country || '',
          postalCode: investor.postal_code || currentAddress.postalCode || '',
        };
        console.log('✅ Mapped address data from investor profile (merged with existing):', {
          existingAddress: currentAddress,
          newAddress: profileData.address
        });
        
        // Only update identification fields that have actual values (merge don't overwrite)
        const currentIdentification = profileData.identification;
        profileData.identification = {
          nationalId: investor.national_id || currentIdentification.nationalId || '',
          passport: investor.passport || currentIdentification.passport || '',
          tin: investor.tin_number || currentIdentification.tin || '',
          secondaryIdType: investor.secondary_id_type || currentIdentification.secondaryIdType || '',
          secondaryIdNumber: investor.secondary_id_number || currentIdentification.secondaryIdNumber || '',
          nationalIdFile: investor.national_id_file || null,
          passportFile: investor.passport_file || null,
        };
        console.log('✅ Mapped identification data from investor profile:', profileData.identification);

        // Only update personal info fields that have actual values (merge don't overwrite)
        profileData.personalInfo = {
          placeOfBirth: investor.place_of_birth || profileData.personalInfo.placeOfBirth || '',
          gender: investor.gender || profileData.personalInfo.gender || '',
          civilStatus: investor.civil_status || profileData.personalInfo.civilStatus || '',
          nationality: investor.nationality || profileData.personalInfo.nationality || '',
          motherMaidenName: investor.mother_maiden_name || profileData.personalInfo.motherMaidenName || '',
          contactEmail: investor.email_address || profileData.personalInfo.contactEmail || '',
        };

        // Only update employment info fields that have actual values (merge don't overwrite)
        profileData.employmentInfo = {
          employerName: investor.employer_name || profileData.employmentInfo.employerName || '',
          occupation: investor.occupation || profileData.employmentInfo.occupation || '',
          employerAddress: investor.employer_address || profileData.employmentInfo.employerAddress || '',
          sourceOfIncome: investor.source_of_income || profileData.employmentInfo.sourceOfIncome || '',
          monthlyIncome: investor.gross_annual_income || profileData.employmentInfo.monthlyIncome || null,
        };

        // Only update emergency contact fields that have actual values (merge don't overwrite)
        profileData.emergencyContact = {
          name: investor.emergency_contact_name || profileData.emergencyContact.name || '',
          relationship: investor.emergency_contact_relationship || profileData.emergencyContact.relationship || '',
          phone: investor.emergency_contact_phone || profileData.emergencyContact.phone || '',
          address: investor.emergency_contact_address || profileData.emergencyContact.address || '',
        };

        // Only update business info fields that have actual values (merge don't overwrite)
        profileData.businessInfo = {
          entityType: investor.entity_type || profileData.businessInfo.entityType || '',
          businessRegistrationType: investor.registration_type || profileData.businessInfo.businessRegistrationType || '',
          businessRegistrationNumber: investor.registration_number || profileData.businessInfo.businessRegistrationNumber || '',
          businessRegistrationDate: investor.registration_date || profileData.businessInfo.businessRegistrationDate || '',
          corporateTin: investor.tin_number || profileData.businessInfo.corporateTin || '',
          natureOfBusiness: investor.nature_of_business || profileData.businessInfo.natureOfBusiness || '',
          businessAddress: investor.business_address || profileData.businessInfo.businessAddress || '',
          corporateTin: investor.corporate_tin || profileData.businessInfo.corporateTin || '',
          natureOfBusiness: investor.nature_of_business || profileData.businessInfo.natureOfBusiness || '',
          businessAddress: investor.business_address || profileData.businessInfo.businessAddress || '',
          gisTotalAssets: investor.gis_total_assets || profileData.businessInfo.gisTotalAssets || null,
          gisTotalLiabilities: investor.gis_total_liabilities || profileData.businessInfo.gisTotalLiabilities || null,
          gisPaidUpCapital: investor.gis_paid_up_capital || profileData.businessInfo.gisPaidUpCapital || null,
          gisNumberOfStockholders: investor.gis_number_of_stockholders || profileData.businessInfo.gisNumberOfStockholders || null,
          gisNumberOfEmployees: investor.gis_number_of_employees || profileData.businessInfo.gisNumberOfEmployees || null,
        };

        // Only update principal office address fields that have actual values (merge don't overwrite)
        profileData.principalOfficeAddress = {
          street: investor.principal_office_street || profileData.principalOfficeAddress.street || '',
          barangay: investor.principal_office_barangay || profileData.principalOfficeAddress.barangay || '',
          municipality: investor.principal_office_municipality || profileData.principalOfficeAddress.municipality || '',
          province: investor.principal_office_province || profileData.principalOfficeAddress.province || '',
          country: investor.principal_office_country || profileData.principalOfficeAddress.country || 'Philippines',
          postalCode: investor.principal_office_postal_code || profileData.principalOfficeAddress.postalCode || '',
        };

        // Only update authorized signatory fields that have actual values (merge don't overwrite)
        profileData.authorizedSignatory = {
          name: investor.authorized_person_name || profileData.authorizedSignatory.name || '',
          position: investor.authorized_person_position || profileData.authorizedSignatory.position || '',
          idType: investor.authorized_person_id_type || profileData.authorizedSignatory.idType || '',
          idNumber: investor.authorized_person_id_number || profileData.authorizedSignatory.idNumber || '',
        };

        // Investment information
        profileData.investmentInfo = {
          experience: investor.investment_experience || '',
          preference: investor.investment_objectives || '',
          riskTolerance: investor.risk_tolerance || '',
          portfolioValue: parseFloat(investor.liquid_net_worth) || 0,
        };

        // Bank account information
        profileData.bankAccount = {
          accountName: investor.account_name || '',
          bankName: investor.bank_name || '',
          accountType: investor.account_type || '',
          accountNumber: investor.account_number || '',
          iban: investor.iban || '',
          swiftCode: investor.swift_code || '',
        };

        // PEP status
        profileData.pepStatus = investor.pep_status === 'yes' || false;
        
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
            // Only update confirmed existing fields - use correct column names from database
            await db.query(`
              UPDATE borrower_profiles SET
                mobile_number = $1,
                date_of_birth = $2,
                updated_at = CURRENT_TIMESTAMP
              WHERE firebase_uid = $3
            `, [
              profileData.phone || null,
              profileData.dateOfBirth || null,
              firebase_uid
            ]);
            console.log('✅ Updated borrower profile basic info');
            
            // Try to update address fields separately with error handling - use correct column names
            try {
              await db.query(`
                UPDATE borrower_profiles SET
                  present_address = $1,
                  city = $2,
                  state = $3,
                  country = $4,
                  postal_code = $5
                WHERE firebase_uid = $6
              `, [
                profileData.address?.street || null,
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
            
            // Try to update identification fields separately - use correct column names
            try {
              await db.query(`
                UPDATE borrower_profiles SET
                  national_id = $1,
                  passport = $2,
                  tin_number = $3,
                  national_id_file = $4,
                  passport_file = $5
                WHERE firebase_uid = $6
              `, [
                profileData.identification?.nationalId || null,
                profileData.identification?.passport || null,
                profileData.identification?.tin || null,
                profileData.identification?.nationalIdFile || null,
                profileData.identification?.passportFile || null,
                firebase_uid
              ]);
              console.log('✅ Updated borrower identification info');
            } catch (idError) {
              console.log('⚠️ ID fields may not exist in borrower_profiles:', idError.message);
            }
            
            // Try to update personal info fields
            try {
              await db.query(`
                UPDATE borrower_profiles SET
                  place_of_birth = $1,
                  gender = $2,
                  civil_status = $3,
                  nationality = $4,
                  mother_maiden_name = $5,
                  contact_email = $6
                WHERE firebase_uid = $7
              `, [
                profileData.personalInfo?.placeOfBirth || null,
                profileData.personalInfo?.gender || null,
                profileData.personalInfo?.civilStatus || null,
                profileData.personalInfo?.nationality || null,
                profileData.personalInfo?.motherMaidenName || null,
                profileData.personalInfo?.contactEmail || null,
                firebase_uid
              ]);
              console.log('✅ Updated borrower personal info');
            } catch (personalError) {
              console.log('⚠️ Personal info fields may not exist in borrower_profiles:', personalError.message);
            }
            
            // Try to update emergency contact fields
            try {
              await db.query(`
                UPDATE borrower_profiles SET
                  emergency_contact_name = $1,
                  emergency_contact_relationship = $2,
                  emergency_contact_phone = $3,
                  emergency_contact_email = $4,
                  emergency_contact_address = $5
                WHERE firebase_uid = $6
              `, [
                profileData.emergencyContact?.name || null,
                profileData.emergencyContact?.relationship || null,
                profileData.emergencyContact?.phone || null,
                profileData.emergencyContact?.email || null,
                profileData.emergencyContact?.address || null,
                firebase_uid
              ]);
              console.log('✅ Updated borrower emergency contact info');
            } catch (emergencyError) {
              console.log('⚠️ Emergency contact fields may not exist in borrower_profiles:', emergencyError.message);
            }
            
            // Try to update employment info fields
            try {
              await db.query(`
                UPDATE borrower_profiles SET
                  occupation = $1,
                  employer_name = $2,
                  employer_address = $3,
                  source_of_income = $4,
                  gross_annual_income = $5
                WHERE firebase_uid = $6
              `, [
                profileData.employmentInfo?.occupation || null,
                profileData.employmentInfo?.employerName || null,
                profileData.employmentInfo?.employerAddress || null,
                profileData.employmentInfo?.sourceOfIncome || null,
                profileData.employmentInfo?.monthlyIncome || null,
                firebase_uid
              ]);
              console.log('✅ Updated borrower employment info');
            } catch (employmentError) {
              console.log('⚠️ Employment info fields may not exist in borrower_profiles:', employmentError.message);
            }
            
            // Try to update bank account fields
            try {
              await db.query(`
                UPDATE borrower_profiles SET
                  bank_name = $1,
                  account_name = $2,
                  account_number = $3,
                  iban = $4,
                  swift_code = $5
                WHERE firebase_uid = $6
              `, [
                profileData.bankAccount?.bankName || null,
                profileData.bankAccount?.accountName || null,
                profileData.bankAccount?.accountNumber || null,
                profileData.bankAccount?.iban || null,
                profileData.bankAccount?.swiftCode || null,
                firebase_uid
              ]);
              console.log('✅ Updated borrower bank account info');
            } catch (bankError) {
              console.log('⚠️ Bank account fields may not exist in borrower_profiles:', bankError.message);
            }
            
          } catch (error) {
            console.error('❌ Error updating borrower profile:', error);
            // Don't throw error, continue with other updates
          }
        }
        
        // Update investor profile if user has investor account
        if (user.has_investor_account) {
          try {
            // Update basic info - use correct column names
            await db.query(`
              UPDATE investor_profiles SET
                mobile_number = $1,
                date_of_birth = $2,
                updated_at = CURRENT_TIMESTAMP
              WHERE firebase_uid = $3
            `, [
              profileData.phone || null,
              profileData.dateOfBirth || null,
              firebase_uid
            ]);
            console.log('✅ Updated investor profile basic info');

            // Update address fields - use correct column names
            try {
              await db.query(`
                UPDATE investor_profiles SET
                  present_address = $1,
                  city = $2,
                  state = $3,
                  country = $4,
                  postal_code = $5
                WHERE firebase_uid = $6
              `, [
                profileData.address?.street || null,
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

            // Update identification fields - use correct column names
            try {
              await db.query(`
                UPDATE investor_profiles SET
                  national_id = $1,
                  passport = $2,
                  tin_number = $3,
                  national_id_file = $4,
                  passport_file = $5
                WHERE firebase_uid = $6
              `, [
                profileData.identification?.nationalId || null,
                profileData.identification?.passport || null,
                profileData.identification?.tin || null,
                profileData.identification?.nationalIdFile || null,
                profileData.identification?.passportFile || null,
                firebase_uid
              ]);
              console.log('✅ Updated investor identification info');
            } catch (idError) {
              console.log('⚠️ ID fields may not exist in investor_profiles:', idError.message);
            }
            
            // Try to update personal info fields
            try {
              await db.query(`
                UPDATE investor_profiles SET
                  place_of_birth = $1,
                  gender = $2,
                  civil_status = $3,
                  nationality = $4,
                  mother_maiden_name = $5,
                  contact_email = $6
                WHERE firebase_uid = $7
              `, [
                profileData.personalInfo?.placeOfBirth || null,
                profileData.personalInfo?.gender || null,
                profileData.personalInfo?.civilStatus || null,
                profileData.personalInfo?.nationality || null,
                profileData.personalInfo?.motherMaidenName || null,
                profileData.personalInfo?.contactEmail || null,
                firebase_uid
              ]);
              console.log('✅ Updated investor personal info');
            } catch (personalError) {
              console.log('⚠️ Personal info fields may not exist in investor_profiles:', personalError.message);
            }
            
            // Try to update emergency contact fields
            try {
              await db.query(`
                UPDATE investor_profiles SET
                  emergency_contact_name = $1,
                  emergency_contact_relationship = $2,
                  emergency_contact_phone = $3,
                  emergency_contact_email = $4,
                  emergency_contact_address = $5
                WHERE firebase_uid = $6
              `, [
                profileData.emergencyContact?.name || null,
                profileData.emergencyContact?.relationship || null,
                profileData.emergencyContact?.phone || null,
                profileData.emergencyContact?.email || null,
                profileData.emergencyContact?.address || null,
                firebase_uid
              ]);
              console.log('✅ Updated investor emergency contact info');
            } catch (emergencyError) {
              console.log('⚠️ Emergency contact fields may not exist in investor_profiles:', emergencyError.message);
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
    
    // Create notification for successful top-up submission
    await createNotification(
      uid,
      'topup_submitted',
      'Top-Up Request Submitted! 💰',
      `Your top-up request of ₱${parseFloat(amount).toLocaleString()} via ${bankName} has been submitted and is awaiting admin approval.`,
      result.rows[0].id.toString(),
      'topup'
    );
    
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

// Get user bank accounts
app.get('/api/bank-accounts', verifyToken, async (req, res) => {
  try {
    const uid = req.uid;
    console.log('🏦 Fetching bank accounts for user:', uid);
    
    // Query bank accounts from borrower_profiles or investor_profiles
    const borrowerQuery = `
      SELECT bank_name, account_type, account_number, account_name, iban, swift_code, preferred 
      FROM borrower_profiles 
      WHERE firebase_uid = $1 AND bank_name IS NOT NULL
    `;
    
    const investorQuery = `
      SELECT bank_name, account_type, account_number, account_name, iban, swift_code, preferred 
      FROM investor_profiles 
      WHERE firebase_uid = $1 AND bank_name IS NOT NULL
    `;
    
    const [borrowerResult, investorResult] = await Promise.all([
      db.query(borrowerQuery, [uid]),
      db.query(investorQuery, [uid])
    ]);
    
    const bankAccounts = [];
    
    // Add borrower bank accounts
    borrowerResult.rows.forEach(row => {
      bankAccounts.push({
        id: bankAccounts.length + 1,
        accountName: row.account_name,
        bank: row.bank_name,
        bankAccount: row.bank_name, // For compatibility with frontend
        accountType: row.account_type,
        accountNumber: row.account_number,
        iban: row.iban || '',
        swiftCode: row.swift_code || '',
        preferred: row.preferred || false
      });
    });
    
    // Add investor bank accounts  
    investorResult.rows.forEach(row => {
      bankAccounts.push({
        id: bankAccounts.length + 1,
        accountName: row.account_name,
        bank: row.bank_name,
        bankAccount: row.bank_name, // For compatibility with frontend
        accountType: row.account_type,
        accountNumber: row.account_number,
        iban: row.iban || '',
        swiftCode: row.swift_code || '',
        preferred: row.preferred || false
      });
    });
    
    console.log('🏦 Bank accounts found:', bankAccounts.length);
    res.json({ success: true, accounts: bankAccounts });
    
  } catch (err) {
    console.error("❌ Error fetching bank accounts:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// Add bank account endpoint
app.post('/api/bank-accounts', verifyToken, async (req, res) => {
  try {
    const uid = req.uid;
    const { accountName, bankAccount, accountType, accountNumber, iban, swiftCode, preferred } = req.body;
    
    console.log('🏦 Adding bank account for user:', uid, req.body);
    
    // Validate required fields
    if (!accountName || !bankAccount || !accountType || !accountNumber) {
      return res.status(400).json({ error: "Account name, bank, account type, and account number are required" });
    }
    
    // Check if user has borrower or investor profile and update accordingly
    const borrowerCheck = await db.query('SELECT id FROM borrower_profiles WHERE firebase_uid = $1', [uid]);
    const investorCheck = await db.query('SELECT id FROM investor_profiles WHERE firebase_uid = $1', [uid]);
    
    if (borrowerCheck.rows.length > 0) {
      // Update borrower profile with bank details
      await db.query(`
        UPDATE borrower_profiles 
        SET bank_name = $1, account_type = $2, account_number = $3, account_name = $4, iban = $5, swift_code = $6, preferred = $7
        WHERE firebase_uid = $8
      `, [bankAccount, accountType, accountNumber, accountName, iban || null, swiftCode || null, preferred || false, uid]);
      
      console.log('🏦 Updated borrower bank details');
    } else if (investorCheck.rows.length > 0) {
      // Update investor profile with bank details
      await db.query(`
        UPDATE investor_profiles 
        SET bank_name = $1, account_type = $2, account_number = $3, account_name = $4, iban = $5, swift_code = $6, preferred = $7
        WHERE firebase_uid = $8
      `, [bankAccount, accountType, accountNumber, accountName, iban || null, swiftCode || null, preferred || false, uid]);
      
      console.log('🏦 Updated investor bank details');
    } else {
      return res.status(400).json({ error: "User profile not found" });
    }
    
    res.json({ success: true, message: "Bank account added successfully" });
    
  } catch (err) {
    console.error("❌ Error adding bank account:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// Migration endpoint to create missing profile tables
app.post('/api/admin/create-profile-tables', async (req, res) => {
  try {
    console.log('🔄 Creating missing profile tables...');
    
    const migrationSQL = `
      -- Create missing borrower_profiles and investor_profiles tables with bank account fields
      BEGIN;

      -- Create borrower_profiles table
      CREATE TABLE IF NOT EXISTS borrower_profiles (
          id SERIAL PRIMARY KEY,
          firebase_uid VARCHAR(255) UNIQUE NOT NULL,
          
          -- Basic profile fields
          is_individual_account BOOLEAN DEFAULT TRUE,
          
          -- Bank account fields
          bank_name VARCHAR(255),
          account_number VARCHAR(50),
          account_name VARCHAR(255),
          iban VARCHAR(100),
          swift_code VARCHAR(50),
          preferred BOOLEAN DEFAULT FALSE,
          
          -- Timestamps
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          
          -- Foreign key constraint
          FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE
      );

      -- Create investor_profiles table
      CREATE TABLE IF NOT EXISTS investor_profiles (
          id SERIAL PRIMARY KEY,
          firebase_uid VARCHAR(255) UNIQUE NOT NULL,
          
          -- Basic profile fields
          is_individual_account BOOLEAN DEFAULT TRUE,
          
          -- Bank account fields
          bank_name VARCHAR(255),
          account_number VARCHAR(50),
          account_name VARCHAR(255),
          iban VARCHAR(100),
          swift_code VARCHAR(50),
          preferred BOOLEAN DEFAULT FALSE,
          
          -- Timestamps
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          
          -- Foreign key constraint
          FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_borrower_profiles_firebase_uid ON borrower_profiles(firebase_uid);
      CREATE INDEX IF NOT EXISTS idx_investor_profiles_firebase_uid ON investor_profiles(firebase_uid);
      CREATE INDEX IF NOT EXISTS idx_borrower_profiles_bank_name ON borrower_profiles(bank_name);
      CREATE INDEX IF NOT EXISTS idx_investor_profiles_bank_name ON investor_profiles(bank_name);

      -- Insert profiles for existing users who have borrower/investor accounts
      INSERT INTO borrower_profiles (firebase_uid, is_individual_account, created_at, updated_at)
      SELECT 
          firebase_uid, 
          CASE WHEN current_account_type = 'individual' THEN TRUE ELSE FALSE END,
          created_at,
          updated_at
      FROM users 
      WHERE has_borrower_account = TRUE
      ON CONFLICT (firebase_uid) DO NOTHING;

      INSERT INTO investor_profiles (firebase_uid, is_individual_account, created_at, updated_at)
      SELECT 
          firebase_uid, 
          CASE WHEN current_account_type = 'individual' THEN TRUE ELSE FALSE END,
          created_at,
          updated_at
      FROM users 
      WHERE has_investor_account = TRUE
      ON CONFLICT (firebase_uid) DO NOTHING;

      COMMIT;
    `;
    
    // Execute the migration
    await db.query(migrationSQL);
    
    // Verify the tables were created
    const verifyResult = await db.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_name IN ('borrower_profiles', 'investor_profiles')
      ORDER BY table_name
    `);
    
    console.log('✅ Profile tables created successfully!');
    console.log('📊 Created tables:', verifyResult.rows);
    
    res.json({ 
      success: true, 
      message: "Profile tables created successfully",
      tables: verifyResult.rows
    });
    
  } catch (err) {
    console.error('❌ Error creating profile tables:', err.message);
    res.status(500).json({ error: "Migration failed", details: err.message });
  }
});

// Debug endpoint to check table structure
app.get('/api/debug/table-structure', async (req, res) => {
  try {
    console.log('🔍 Checking database table structure...');
    
    // Check what tables exist
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    // Check borrower_profiles columns
    const borrowerResult = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'borrower_profiles'
      ORDER BY ordinal_position
    `);
    
    // Check investor_profiles columns
    const investorResult = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'investor_profiles'
      ORDER BY ordinal_position
    `);
    
    const result = {
      tables: tablesResult.rows.map(r => r.table_name),
      borrower_profiles: borrowerResult.rows,
      investor_profiles: investorResult.rows
    };
    
    console.log('📊 Table structure:', result);
    res.json(result);
    
  } catch (err) {
    console.error('❌ Error checking table structure:', err.message);
    res.status(500).json({ error: "Database check failed", details: err.message });
  }
});

// Fix profile tables by dropping and recreating with proper columns
app.post('/api/admin/fix-profile-tables', async (req, res) => {
  try {
    console.log('🔧 Fixing profile tables with proper bank account columns...');
    
    // Drop existing tables
    await db.query('DROP TABLE IF EXISTS borrower_profiles CASCADE');
    await db.query('DROP TABLE IF EXISTS investor_profiles CASCADE');
    
    console.log('🗑️ Dropped existing profile tables');
    
    // Create borrower_profiles table with proper bank account columns
    await db.query(`
      CREATE TABLE borrower_profiles (
        id SERIAL PRIMARY KEY,
        firebase_uid VARCHAR(255) UNIQUE NOT NULL,
        is_individual_account BOOLEAN DEFAULT TRUE,
        bank_name VARCHAR(255),
        account_type VARCHAR(100),
        account_number VARCHAR(50),
        account_name VARCHAR(255),
        iban VARCHAR(100),
        swift_code VARCHAR(50),
        preferred BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE
      )
    `);
    
    console.log('✅ Created borrower_profiles table with bank columns');
    
    // Create investor_profiles table with proper bank account columns
    await db.query(`
      CREATE TABLE investor_profiles (
        id SERIAL PRIMARY KEY,
        firebase_uid VARCHAR(255) UNIQUE NOT NULL,
        is_individual_account BOOLEAN DEFAULT TRUE,
        bank_name VARCHAR(255),
        account_type VARCHAR(100),
        account_number VARCHAR(50),
        account_name VARCHAR(255),
        iban VARCHAR(100),
        swift_code VARCHAR(50),
        preferred BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE
      )
    `);
    
    console.log('✅ Created investor_profiles table with bank columns');
    
    // Create indexes
    await db.query('CREATE INDEX IF NOT EXISTS idx_borrower_profiles_firebase_uid ON borrower_profiles(firebase_uid)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_investor_profiles_firebase_uid ON investor_profiles(firebase_uid)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_borrower_profiles_bank_name ON borrower_profiles(bank_name)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_investor_profiles_bank_name ON investor_profiles(bank_name)');
    
    console.log('✅ Created indexes on profile tables');
    
    // Insert profiles for existing users
    await db.query(`
      INSERT INTO borrower_profiles (firebase_uid, is_individual_account, created_at, updated_at)
      SELECT 
        firebase_uid, 
        TRUE,
        created_at,
        updated_at
      FROM users 
      WHERE has_borrower_account = TRUE
      ON CONFLICT (firebase_uid) DO NOTHING
    `);
    
    await db.query(`
      INSERT INTO investor_profiles (firebase_uid, is_individual_account, created_at, updated_at)
      SELECT 
        firebase_uid, 
        TRUE,
        created_at,
        updated_at
      FROM users 
      WHERE has_investor_account = TRUE
      ON CONFLICT (firebase_uid) DO NOTHING
    `);
    
    console.log('✅ Populated profile tables with existing users');
    
    // Verify the fix by checking columns
    const verifyResult = await db.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'borrower_profiles'
      AND column_name IN ('bank_name', 'account_number', 'account_name', 'iban', 'swift_code', 'preferred')
      ORDER BY column_name
    `);
    
    console.log('📊 Bank columns in borrower_profiles:', verifyResult.rows);
    
    res.json({ 
      success: true, 
      message: "Profile tables fixed successfully with bank account columns",
      bank_columns: verifyResult.rows
    });
    
  } catch (err) {
    console.error('❌ Error fixing profile tables:', err.message);
    res.status(500).json({ error: "Table fix failed", details: err.message });
  }
});

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
      
      // Create notification for insufficient funds
      await createNotification(
        uid, 
        'investment_failed', 
        'Investment Failed - Insufficient Funds 💸', 
        `You tried to invest ₱${investmentAmount.toLocaleString()} but your current balance is only ₱${walletBalance.toLocaleString()}. Please top up your wallet to continue investing.`,
        id.toString(),
        'investment'
      );
      
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
      
      // Create notification for exceeding investment limit
      await createNotification(
        uid, 
        'investment_failed', 
        'Investment Failed - Amount Exceeds Limit 📊', 
        `Your investment of ₱${parseFloat(amount).toLocaleString()} exceeds your maximum limit of ₱${maxInvestmentAmount.toLocaleString()} (${maxInvestmentPercentage}% of your annual income). Please adjust your investment amount.`,
        id.toString(),
        'investment'
      );
      
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
      
      // Create notification for duplicate investment attempt
      await createNotification(
        uid, 
        'investment_failed', 
        'Investment Failed - Duplicate Request ⚠️', 
        `You already have an existing investment request for "${projectData.details?.product || 'this project'}". Multiple investments per project are not allowed.`,
        id.toString(),
        'investment'
      );
      
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

    // Create notification for successful investment request
    await createNotification(
      uid, 
      'investment_submitted', 
      'Investment Request Submitted! 🎯', 
      `Your investment request of ₱${parseFloat(amount).toLocaleString()} for "${projectData.details?.product || 'Project'}" has been submitted and is awaiting admin approval.`,
      id.toString(),
      'investment'
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
    
    // Create notification for the investor
    const notificationType = action === 'approve' ? 'investment_approved' : 'investment_rejected';
    const title = action === 'approve' ? 'Investment Approved! 🎯' : 'Investment Request Update';
    const message = action === 'approve' 
      ? `Your investment of ${investment.amount} PHP in "${projectData.details?.product || 'Project'}" has been approved!`
      : `Your investment request for "${projectData.details?.product || 'Project'}" was not approved. ${comment || 'Please contact support for more information.'}`;
    
    await createNotification(investorId, notificationType, title, message, projectId.toString(), 'investment');
    
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

// Owner Dashboard Endpoints
// Get all users for owner dashboard
app.get('/api/owner/users', verifyToken, async (req, res) => {
  try {
    const firebase_uid = req.uid;
    console.log(`🔍 Owner users request from user: ${firebase_uid}`);
    
    // Check if user is admin/owner
    const adminCheck = await db.query(
      'SELECT is_admin FROM users WHERE firebase_uid = $1',
      [firebase_uid]
    );
    
    if (adminCheck.rows.length === 0 || !adminCheck.rows[0].is_admin) {
      console.log(`❌ Access denied for user ${firebase_uid} - not admin`);
      return res.status(403).json({ error: 'Access denied - Admin privileges required' });
    }
    
    console.log(`✅ Admin access verified for user: ${firebase_uid}`);
    
    // Get all users with comprehensive information
    const usersResult = await db.query(`
      SELECT 
        u.firebase_uid,
        u.full_name,
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
        (SELECT COUNT(*) FROM projects WHERE firebase_uid = u.firebase_uid) as total_projects,
        w.balance as wallet_balance
      FROM users u
      LEFT JOIN borrower_profiles bp ON u.firebase_uid = bp.firebase_uid
      LEFT JOIN wallets w ON u.firebase_uid = w.firebase_uid
      ORDER BY u.created_at DESC
    `);
    
    console.log(`📊 Found ${usersResult.rows.length} users in database`);
    
    // Transform data to match frontend interface
    const users = [];
    
    for (const row of usersResult.rows) {
      const accountTypes = [];
      if (row.has_borrower_account) accountTypes.push('borrower');
      if (row.has_investor_account) accountTypes.push('investor');
      
      // Get email from Firebase since it's not in the database
      let email = '';
      try {
        const firebaseUser = await admin.auth().getUser(row.firebase_uid);
        email = firebaseUser.email || '';
      } catch (e) {
        console.log(`Could not get email for user ${row.firebase_uid}:`, e.message);
      }
      
      users.push({
        id: row.firebase_uid,
        firebaseUid: row.firebase_uid,
        fullName: row.full_name || '',
        email: email,
        username: row.username || '',
        profilePicture: row.profile_picture,
        accountTypes,
        status: 'active', // We don't have a status field, assuming active
        memberSince: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '',
        lastActivity: row.updated_at ? new Date(row.updated_at).toISOString().split('T')[0] : '',
        totalProjects: parseInt(row.total_projects) || 0,
        activeProjects: 0, // Would need to calculate from project data
        isQualifiedInvestor: false, // Would need investor profile data
        location: '', // Would need address data
        walletBalance: parseFloat(row.wallet_balance) || 0,
        isAdmin: row.is_admin || false
      });
    }

    console.log(`� Returning ${users.length} users for owner dashboard`);
    res.json(users);
    
  } catch (err) {
    console.error('❌ Error fetching users for owner dashboard:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// NOTE: Suspend and reactivate endpoints have been moved to lines 6450+ (newer implementation with full suspension system)

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

// Create notifications table on startup
async function createNotificationsTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        firebase_uid VARCHAR(255) NOT NULL,
        notification_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        related_request_id VARCHAR(255),
        related_request_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE
      )
    `);
    
    // Create indexes for better performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_firebase_uid ON notifications(firebase_uid);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
    `);
    
    console.log("Notifications table ready");
  } catch (err) {
    console.error("Error creating notifications table:", err);
  }
}

createNotificationsTable();

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
      // First, check if user exists and what their current role is
      const existingUserQuery = await db.query(
        'SELECT firebase_uid, role, full_name FROM users WHERE firebase_uid = $1',
        [uid]
      );
      
      console.log('👤 Existing user check:', existingUserQuery.rows.length > 0 ? existingUserQuery.rows[0] : 'No existing user');
      
      // Get the full name to use - preserve existing if no KYC full name provided
      const existingUser = existingUserQuery.rows[0];
      const fullNameToUse = kycData.fullName || 
                           (existingUser?.full_name && existingUser.full_name !== 'Unknown User' ? existingUser.full_name : 'User');
      
      // Ensure user exists in the users table first (upsert)
      const upsertResult = await db.query(
        `INSERT INTO users (firebase_uid, full_name, role, has_completed_registration, created_at, updated_at)
         VALUES ($1, $2, $3, true, NOW(), NOW())
         ON CONFLICT (firebase_uid) DO UPDATE
         SET role = EXCLUDED.role, 
             full_name = CASE 
               WHEN users.full_name IS NULL OR users.full_name = 'Unknown User' THEN EXCLUDED.full_name
               ELSE users.full_name
             END,
             has_completed_registration = EXCLUDED.has_completed_registration,
             updated_at = NOW()
         RETURNING firebase_uid, role, full_name`,
        [uid, fullNameToUse, accountType]
      );
      
      console.log('✅ User record upserted:', upsertResult.rows[0]);
      console.log('🔧 Expected role:', accountType, 'Actual role:', upsertResult.rows[0].role);
      
      // Double-check that the role was set correctly - if not, force update
      if (upsertResult.rows[0].role !== accountType) {
        console.log('⚠️ Role mismatch detected, forcing update...');
        const forceUpdateResult = await db.query(
          'UPDATE users SET role = $1, updated_at = NOW() WHERE firebase_uid = $2 RETURNING role',
          [accountType, uid]
        );
        console.log('🔧 Force update result:', forceUpdateResult.rows[0]);
      }
      
      // Set account flags - preserve existing accounts, don't overwrite
      if (accountType === 'borrower') {
        await db.query(
          `UPDATE users 
           SET has_borrower_account = true,
               current_account_type = $1,
               updated_at = NOW()
           WHERE firebase_uid = $2`,
          [accountType, uid]
        );
      } else if (accountType === 'investor') {
        await db.query(
          `UPDATE users 
           SET has_investor_account = true,
               current_account_type = $1,
               updated_at = NOW()
           WHERE firebase_uid = $2`,
          [accountType, uid]
        );
      }
      
      // Normalize civil status to match database constraint
      const validCivilStatuses = ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'];
      let normalizedCivilStatus = null;
      
      if (kycData.civilStatus && kycData.civilStatus.trim() !== '') {
        const inputStatus = kycData.civilStatus.toLowerCase().trim();
        const matchedStatus = validCivilStatuses.find(status => 
          status.toLowerCase() === inputStatus
        );
        normalizedCivilStatus = matchedStatus || null; // Use null for invalid values
      }
      
      // Normalize gender to match database constraint
      const validGenders = ['Male', 'Female', 'Other', 'Prefer not to say'];
      let normalizedGender = null;
      
      if (kycData.gender && kycData.gender.trim() !== '') {
        const inputGender = kycData.gender.toLowerCase().trim();
        const matchedGender = validGenders.find(gender => 
          gender.toLowerCase() === inputGender
        );
        normalizedGender = matchedGender || null; // Use null for invalid values
      }
      
      // Normalize secondary ID type to match database constraint
      const validSecondaryIdTypes = [
        'Drivers License', 'Postal ID', 'Voters ID', 'PhilHealth ID', 
        'SSS ID', 'GSIS ID', 'PRC ID', 'OFW ID', 'Senior Citizen ID', 'PWD ID'
      ];
      let normalizedSecondaryIdType = null;
      
      if (kycData.secondaryIdType) {
        const inputIdType = kycData.secondaryIdType.toLowerCase();
        
        // Try exact match first
        const exactMatch = validSecondaryIdTypes.find(idType => 
          idType.toLowerCase() === inputIdType
        );
        
        if (exactMatch) {
          normalizedSecondaryIdType = exactMatch;
        } else {
          // Try partial matching for common variations
          if (inputIdType.includes('driver') || inputIdType.includes('license')) {
            normalizedSecondaryIdType = 'Drivers License';
          } else if (inputIdType.includes('postal')) {
            normalizedSecondaryIdType = 'Postal ID';
          } else if (inputIdType.includes('voter')) {
            normalizedSecondaryIdType = 'Voters ID';
          } else if (inputIdType.includes('philhealth')) {
            normalizedSecondaryIdType = 'PhilHealth ID';
          } else if (inputIdType.includes('sss')) {
            normalizedSecondaryIdType = 'SSS ID';
          } else if (inputIdType.includes('gsis')) {
            normalizedSecondaryIdType = 'GSIS ID';
          } else if (inputIdType.includes('prc')) {
            normalizedSecondaryIdType = 'PRC ID';
          } else if (inputIdType.includes('ofw')) {
            normalizedSecondaryIdType = 'OFW ID';
          } else if (inputIdType.includes('senior')) {
            normalizedSecondaryIdType = 'Senior Citizen ID';
          } else if (inputIdType.includes('pwd')) {
            normalizedSecondaryIdType = 'PWD ID';
          } else if (inputIdType.includes('passport')) {
            normalizedSecondaryIdType = 'Postal ID'; // Map passport to Postal ID as closest match
          } else {
            // Default to first valid option if no match found
            normalizedSecondaryIdType = 'Drivers License';
          }
        }
      }
      
      console.log('📝 Civil Status Normalization:');
      console.log('Original:', kycData.civilStatus);
      console.log('Normalized:', normalizedCivilStatus);
      console.log('📝 Gender Normalization:');
      console.log('Original:', kycData.gender);
      console.log('Normalized:', normalizedGender);
      console.log('📝 Secondary ID Type Normalization:');
      console.log('Original:', kycData.secondaryIdType);
      console.log('Normalized:', normalizedSecondaryIdType);

      // Insert into appropriate profile table
      if (accountType === 'borrower') {
        console.log('💾 Inserting borrower profile data...');
        console.log('🔢 Parameters for borrower insert:');
        console.log('uid:', uid);
        console.log('isIndividualAccount:', kycData.isIndividualAccount);
        console.log('placeOfBirth:', kycData.placeOfBirth);
        console.log('gender:', normalizedGender);
        console.log('civilStatus:', normalizedCivilStatus);
        console.log('nationality:', kycData.nationality);
        console.log('contactEmail:', kycData.contactEmail);
        
        // Upsert borrower profile with comprehensive KYC data
        console.log('💾 Inserting borrower profile data...');
        console.log('🔢 Parameters for borrower insert:');
        console.log('uid:', uid);
        console.log('isIndividualAccount:', kycData.isIndividualAccount);
        console.log('placeOfBirth:', kycData.placeOfBirth);
        console.log('gender:', normalizedGender);
        console.log('civilStatus:', normalizedCivilStatus);
        console.log('nationality:', kycData.nationality);
        console.log('contactEmail:', kycData.contactEmail);
        console.log('🔢 Personal info parameters:');
        console.log('firstName:', kycData.firstName);
        console.log('lastName:', kycData.lastName);
        console.log('dateOfBirth:', kycData.dateOfBirth);
        console.log('phoneNumber:', kycData.phoneNumber);
        console.log('🔢 Address parameters:');
        console.log('street:', kycData.street);
        console.log('city:', kycData.city);
        console.log('state:', kycData.state);
        console.log('🔢 ID parameters:');
        console.log('nationalId:', kycData.nationalId);
        console.log('passport:', kycData.passport);
        console.log('tin:', kycData.tin);
        console.log('🔢 Employment parameters:');
        console.log('occupation:', kycData.occupation);
        console.log('employerName:', kycData.employerName);
        console.log('🔢 Emergency Contact parameters:');
        console.log('emergencyContactName:', kycData.emergencyContactName);
        console.log('emergencyContactRelationship:', kycData.emergencyContactRelationship);
        console.log('emergencyContactPhone:', kycData.emergencyContactPhone);
        console.log('emergencyContactEmail:', kycData.emergencyContactEmail);
        console.log('emergencyContactAddress:', kycData.emergencyContactAddress);
        console.log('🔢 Additional Personal Info parameters:');
        console.log('motherMaidenName:', kycData.motherMaidenName);
        console.log('contactEmail:', kycData.contactEmail);
        console.log('🔢 Bank account parameters:');
        console.log('account_name:', kycData.account_name);
        console.log('bank_name:', kycData.bank_name);
        console.log('account_number:', kycData.account_number);
        console.log('iban:', kycData.iban);
        console.log('swift_code:', kycData.swift_code);
        
        await db.query(`
          INSERT INTO borrower_profiles (
            firebase_uid, full_name, first_name, last_name, middle_name, 
            date_of_birth, place_of_birth, nationality, gender, civil_status,
            mobile_number, country_code, email_address, contact_email,
            present_address, permanent_address, city, state, postal_code, country,
            national_id, passport, tin_number, national_id_file, passport_file,
            occupation, employer_name, employer_address, employment_status, 
            gross_annual_income, source_of_income,
            emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_email, emergency_contact_address,
            mother_maiden_name,
            account_name, bank_name, account_type, account_number, iban, swift_code,
            is_individual_account, is_complete, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, 
            $32, $33, $34, $35, $36, $37, $38, $39, $40, 
            $41, $42, $43, $44, TRUE, NOW(), NOW()
          )
          ON CONFLICT (firebase_uid) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            middle_name = EXCLUDED.middle_name,
            date_of_birth = EXCLUDED.date_of_birth,
            place_of_birth = EXCLUDED.place_of_birth,
            nationality = EXCLUDED.nationality,
            gender = EXCLUDED.gender,
            civil_status = EXCLUDED.civil_status,
            mobile_number = EXCLUDED.mobile_number,
            country_code = EXCLUDED.country_code,
            email_address = EXCLUDED.email_address,
            contact_email = EXCLUDED.contact_email,
            present_address = EXCLUDED.present_address,
            permanent_address = EXCLUDED.permanent_address,
            city = EXCLUDED.city,
            state = EXCLUDED.state,
            postal_code = EXCLUDED.postal_code,
            country = EXCLUDED.country,
            national_id = EXCLUDED.national_id,
            passport = EXCLUDED.passport,
            tin_number = EXCLUDED.tin_number,
            national_id_file = EXCLUDED.national_id_file,
            passport_file = EXCLUDED.passport_file,
            occupation = EXCLUDED.occupation,
            employer_name = EXCLUDED.employer_name,
            employer_address = EXCLUDED.employer_address,
            employment_status = EXCLUDED.employment_status,
            gross_annual_income = EXCLUDED.gross_annual_income,
            source_of_income = EXCLUDED.source_of_income,
            emergency_contact_name = EXCLUDED.emergency_contact_name,
            emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
            emergency_contact_phone = EXCLUDED.emergency_contact_phone,
            emergency_contact_email = EXCLUDED.emergency_contact_email,
            emergency_contact_address = EXCLUDED.emergency_contact_address,
            mother_maiden_name = EXCLUDED.mother_maiden_name,
            account_name = EXCLUDED.account_name,
            bank_name = EXCLUDED.bank_name,
            account_number = EXCLUDED.account_number,
            iban = EXCLUDED.iban,
            swift_code = EXCLUDED.swift_code,
            is_individual_account = EXCLUDED.is_individual_account,
            is_complete = TRUE,
            updated_at = NOW()
        `, [
          uid, 
          // Personal Information (2-13)
          fullNameToUse,
          kycData.firstName || null,
          kycData.lastName || null,
          kycData.middleName || null,
          kycData.dateOfBirth || null,
          kycData.placeOfBirth || null,
          kycData.nationality || null,
          normalizedGender,
          normalizedCivilStatus,
          kycData.phoneNumber || kycData.mobileNumber || null,
          kycData.countryCode || null,
          kycData.emailAddress || kycData.contactEmail || null,
          kycData.contactEmail || kycData.emailAddress || null,
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
          kycData.nationalIdFile || null,
          kycData.passportFile || null,
          // Employment Information (26-31)
          kycData.occupation || null,
          kycData.employerName || null,
          kycData.employerAddress || null,
          kycData.employmentStatus || null,
          kycData.grossAnnualIncome || kycData.monthlyIncome || null,
          kycData.sourceOfIncome || null,
          // Emergency Contact Information (32-36)
          kycData.emergencyContactName || null,
          kycData.emergencyContactRelationship || null,
          kycData.emergencyContactPhone || null,
          kycData.emergencyContactEmail || null,
          kycData.emergencyContactAddress || null,
          // Mother's Maiden Name (37)
          kycData.motherMaidenName || null,
          // Bank Account Information (38-43)
          kycData.account_name || kycData.accountName || null,
          kycData.bank_name || kycData.bankName || null,
          kycData.account_type || kycData.accountType || null,
          kycData.account_number || kycData.accountNumber || null,
          kycData.iban || null,
          kycData.swift_code || kycData.swiftCode || null,
          // Account Type (44)
          kycData.isIndividualAccount
        ]);
      } else {
        // Upsert investor profile with comprehensive KYC data
        console.log('💾 Inserting investor profile data...');
        console.log('� Personal info parameters:');
        console.log('firstName:', kycData.firstName);
        console.log('lastName:', kycData.lastName);
        console.log('dateOfBirth:', kycData.dateOfBirth);
        console.log('phoneNumber:', kycData.phoneNumber);
        console.log('🔢 Bank account parameters:');
        console.log('account_name:', kycData.account_name);
        console.log('bank_name:', kycData.bank_name);
        console.log('account_number:', kycData.account_number);
        console.log('iban:', kycData.iban);
        console.log('swift_code:', kycData.swift_code);
        
        await db.query(`
          INSERT INTO investor_profiles (
            firebase_uid, full_name, first_name, last_name, middle_name, 
            date_of_birth, place_of_birth, nationality, gender, civil_status,
            mobile_number, country_code, email_address,
            present_address, permanent_address, city, state, postal_code, country,
            national_id, passport, tin_number,
            occupation, employer_name, employer_address, employment_status, 
            gross_annual_income, source_of_income,
            account_name, bank_name, account_type, account_number, iban, swift_code,
            is_individual_account, is_complete, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 
            $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, TRUE, NOW(), NOW()
          )
          ON CONFLICT (firebase_uid) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            middle_name = EXCLUDED.middle_name,
            date_of_birth = EXCLUDED.date_of_birth,
            place_of_birth = EXCLUDED.place_of_birth,
            nationality = EXCLUDED.nationality,
            gender = EXCLUDED.gender,
            civil_status = EXCLUDED.civil_status,
            mobile_number = EXCLUDED.mobile_number,
            country_code = EXCLUDED.country_code,
            email_address = EXCLUDED.email_address,
            present_address = EXCLUDED.present_address,
            permanent_address = EXCLUDED.permanent_address,
            city = EXCLUDED.city,
            state = EXCLUDED.state,
            postal_code = EXCLUDED.postal_code,
            country = EXCLUDED.country,
            national_id = EXCLUDED.national_id,
            passport = EXCLUDED.passport,
            tin_number = EXCLUDED.tin_number,
            occupation = EXCLUDED.occupation,
            employer_name = EXCLUDED.employer_name,
            employer_address = EXCLUDED.employer_address,
            employment_status = EXCLUDED.employment_status,
            gross_annual_income = EXCLUDED.gross_annual_income,
            source_of_income = EXCLUDED.source_of_income,
            account_name = EXCLUDED.account_name,
            bank_name = EXCLUDED.bank_name,
            account_number = EXCLUDED.account_number,
            iban = EXCLUDED.iban,
            swift_code = EXCLUDED.swift_code,
            is_individual_account = EXCLUDED.is_individual_account,
            is_complete = TRUE,
            updated_at = NOW()
        `, [
          uid, 
          // Personal Information (2-13)
          fullNameToUse,
          kycData.firstName || null,
          kycData.lastName || null,
          kycData.middleName || null,
          kycData.dateOfBirth || null,
          kycData.placeOfBirth || null,
          kycData.nationality || null,
          normalizedGender,
          normalizedCivilStatus,
          kycData.phoneNumber || kycData.mobileNumber || null,
          kycData.countryCode || null,
          kycData.emailAddress || kycData.contactEmail || null,
          // Address Information (14-19)
          kycData.presentAddress || kycData.street || null,
          kycData.permanentAddress || null,
          kycData.city || kycData.cityName || null,
          kycData.state || kycData.stateIso || null,
          kycData.postalCode || null,
          kycData.country || kycData.countryIso || null,
          // Identification (20-22)
          kycData.nationalId || null,
          kycData.passport || kycData.passportNumber || null,
          kycData.tin || kycData.tinNumber || null,
          // Employment Information (23-28)
          kycData.occupation || null,
          kycData.employerName || null,
          kycData.employerAddress || null,
          kycData.employmentStatus || null,
          kycData.grossAnnualIncome || kycData.monthlyIncome || null,
          kycData.sourceOfIncome || null,
          // Bank Account Information (29-34)
          kycData.account_name || kycData.accountName || null,
          kycData.bank_name || kycData.bankName || null,
          kycData.account_type || kycData.accountType || null,
          kycData.account_number || kycData.accountNumber || null,
          kycData.iban || null,
          kycData.swift_code || kycData.swiftCode || null,
          // Account Type (35)
          kycData.isIndividualAccount
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

    // Create notification for the project owner
    const projectOwnerUid = updatedProject.rows[0]?.firebase_uid;
    if (projectOwnerUid) {
      const notificationType = action === 'approve' ? 'project_approved' : 'project_rejected';
      const title = action === 'approve' ? 'Project Approved! 🎉' : 'Project Review Update';
      const message = action === 'approve' 
        ? `Your project "${projectData.details?.product || 'Untitled Project'}" has been approved and is now live!`
        : `Your project "${projectData.details?.product || 'Untitled Project'}" needs revisions. ${feedback || 'Please review the feedback and resubmit.'}`;
      
      await createNotification(projectOwnerUid, notificationType, title, message, id.toString(), 'project');
    }
    
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

// Get dashboard stats for user
app.get('/api/user/dashboard-stats', verifyToken, async (req, res) => {
  const uid = req.uid;
  
  try {
    console.log("Fetching dashboard stats for user:", uid);
    
    // Get ALL projects with investorRequests and filter in Node.js for better reliability
    const result = await db.query(`
      SELECT p.id, p.firebase_uid, p.project_data, p.created_at, u.full_name as borrower_name
      FROM projects p
      LEFT JOIN users u ON p.firebase_uid = u.firebase_uid
      WHERE p.project_data ? 'investorRequests'
    `);
    
    console.log("📊 Found projects with investorRequests for stats:", result.rows.length);
    
    // Process the results to extract investment details
    const userInvestments = result.rows
      .filter(row => {
        const investorRequests = row.project_data?.investorRequests || [];
        return investorRequests.some(req => req.investorId === uid);
      })
      .map(row => {
        const projectData = row.project_data;
        const userInvestmentRequests = projectData.investorRequests?.filter(req => req.investorId === uid) || [];
        
        return {
          projectId: row.id,
          projectData: projectData,
          investments: userInvestmentRequests
        };
      });
    
    // Calculate stats
    let totalInvested = 0;
    let approvedInvestments = 0;
    let pendingInvestments = 0;
    let totalCampaignsFunded = 0;
    let activeInvestments = 0;
    
    userInvestments.forEach(({ projectData, investments }) => {
      investments.forEach(investment => {
        const amount = parseFloat(investment.amount) || 0;
        totalInvested += amount;
        
        if (investment.status === 'approved') {
          approvedInvestments += amount;
          totalCampaignsFunded += 1;
        } else if (investment.status === 'pending') {
          pendingInvestments += amount;
        }
        
        // Consider investment active if approved and project is not completed
        if (investment.status === 'approved' && projectData.status !== 'completed') {
          activeInvestments += 1;
        }
      });
    });
    
    const stats = {
      totalInvested: totalInvested,
      totalCampaignsFunded: totalCampaignsFunded,
      approvedInvestments: approvedInvestments,
      pendingInvestments: pendingInvestments,
      activeInvestments: activeInvestments,
      totalProjects: userInvestments.length
    };
    
    console.log(`📊 Dashboard stats for user ${uid}:`, stats);
    res.json(stats);
    
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
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
    
    // Create notification for the user
    const notificationType = action === 'approved' ? 'topup_approved' : 'topup_rejected';
    const title = action === 'approved' ? 'Top-up Approved! 💰' : 'Top-up Request Update';
    const message = action === 'approved' 
      ? `Your top-up request of ${topupRequest.amount} ${topupRequest.currency} has been approved and added to your wallet!`
      : `Your top-up request of ${topupRequest.amount} ${topupRequest.currency} was not approved. ${adminNotes || 'Please contact support for more information.'}`;
    
    await createNotification(topupRequest.firebase_uid, notificationType, title, message, id.toString(), 'topup');
    
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

// ===== NOTIFICATION ENDPOINTS =====

// Helper function to create notifications
async function createNotification(firebase_uid, type, title, message, relatedId = null, relatedType = null) {
  try {
    await db.query(`
      INSERT INTO notifications (firebase_uid, notification_type, title, message, related_request_id, related_request_type)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [firebase_uid, type, title, message, relatedId, relatedType]);
    console.log(`📧 Notification created for user ${firebase_uid}: ${type}`);
  } catch (err) {
    console.error('Error creating notification:', err);
  }
}

// Get notifications for the authenticated user
app.get('/api/notifications', verifyToken, async (req, res) => {
  try {
    const firebase_uid = req.uid;
    const { page = 1, limit = 20, unread_only = false } = req.query;
    
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE firebase_uid = $1';
    const params = [firebase_uid];
    
    if (unread_only === 'true') {
      whereClause += ' AND is_read = FALSE';
    }
    
    const { rows } = await db.query(`
      SELECT * FROM notifications 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset]);
    
    // Get unread count
    const unreadCount = await db.query(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE firebase_uid = $1 AND is_read = FALSE
    `, [firebase_uid]);
    
    res.json({
      notifications: rows,
      unreadCount: parseInt(unreadCount.rows[0].count),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: rows.length
      }
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Mark notification as read
app.patch('/api/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    const firebase_uid = req.uid;
    const { id } = req.params;
    
    const result = await db.query(`
      UPDATE notifications 
      SET is_read = TRUE, updated_at = NOW()
      WHERE id = $1 AND firebase_uid = $2
      RETURNING *
    `, [id, firebase_uid]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ success: true, notification: result.rows[0] });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Mark all notifications as read
app.patch('/api/notifications/read-all', verifyToken, async (req, res) => {
  try {
    const firebase_uid = req.uid;
    
    await db.query(`
      UPDATE notifications 
      SET is_read = TRUE, updated_at = NOW()
      WHERE firebase_uid = $1 AND is_read = FALSE
    `, [firebase_uid]);
    
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete notification
app.delete('/api/notifications/:id', verifyToken, async (req, res) => {
  try {
    const firebase_uid = req.uid;
    const { id } = req.params;
    
    const result = await db.query(`
      DELETE FROM notifications 
      WHERE id = $1 AND firebase_uid = $2
      RETURNING *
    `, [id, firebase_uid]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ error: 'Database error' });
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

// Debug endpoint to check database table structure and data
app.get('/api/debug/user-data/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get raw user data
    const userResult = await db.query('SELECT * FROM users WHERE firebase_uid = $1', [userId]);
    const borrowerResult = await db.query('SELECT * FROM borrower_profiles WHERE firebase_uid = $1', [userId]);
    
    // Get table structure
    const tableStructure = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'borrower_profiles' 
      ORDER BY ordinal_position
    `);
    
    res.json({
      user: userResult.rows[0] || null,
      borrower: borrowerResult.rows[0] || null,
      borrowerColumns: borrowerResult.rows[0] ? Object.keys(borrowerResult.rows[0]) : [],
      tableStructure: tableStructure.rows,
      analysis: {
        userExists: userResult.rows.length > 0,
        borrowerExists: borrowerResult.rows.length > 0,
        hasAddress: borrowerResult.rows[0]?.present_address ? true : false,
        hasEmployment: borrowerResult.rows[0]?.occupation ? true : false,
        hasIdentification: borrowerResult.rows[0]?.national_id ? true : false,
        hasEmergencyContact: borrowerResult.rows[0]?.emergency_contact_name ? true : false
      }
    });
  } catch (err) {
    console.error('Debug endpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============= OWNER (SUPER ADMIN) API ENDPOINTS =============

// Test endpoint to check table structure and add missing columns
app.get('/api/debug/fix-table', async (req, res) => {
  try {
    // Add missing emergency contact columns to borrower_profiles
    await db.query(`
      ALTER TABLE borrower_profiles 
      ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(100),
      ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS emergency_contact_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS emergency_contact_address TEXT,
      ADD COLUMN IF NOT EXISTS mother_maiden_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255)
    `);

    console.log('✅ Added missing columns to borrower_profiles');
    
    res.json({
      success: true,
      message: 'Missing columns added to borrower_profiles table'
    });
  } catch (err) {
    console.error('Fix table error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Owner Dashboard Stats
app.get('/api/owner/stats', verifyToken, async (req, res) => {
  try {
    // Verify owner/admin status
    const adminCheck = await db.query(
      `SELECT is_admin FROM users WHERE firebase_uid = $1`,
      [req.uid]
    );
    
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: "Unauthorized: Owner access required" });
    }

    // Get comprehensive platform stats
    const [usersResult, projectsResult, investmentsResult] = await Promise.all([
      // Users by type
      db.query(`
        SELECT 
          COUNT(*) FILTER (WHERE has_borrower_account = true) as total_borrowers,
          COUNT(*) FILTER (WHERE has_investor_account = true) as total_investors,
          COUNT(*) FILTER (WHERE has_borrower_account = true AND has_investor_account = true) as total_guarantors,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 month') as new_users_this_month,
          COUNT(*) FILTER (WHERE current_account_type = 'suspended') as suspended_users
        FROM users
      `),
      
      // Projects by status
      db.query(`
        SELECT 
          COUNT(*) as total_projects,
          COUNT(*) FILTER (WHERE project_data->>'status' = 'published' AND project_data->>'approvalStatus' = 'approved') as active_projects,
          COUNT(*) FILTER (WHERE project_data->>'approvalStatus' = 'pending') as pending_projects,
          COUNT(*) FILTER (WHERE project_data->>'status' = 'suspended') as suspended_projects,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 month') as new_projects_this_month
        FROM projects
      `),
      
      // Investment amounts
      db.query(`
        SELECT 
          COALESCE(SUM((investment->'amount')::numeric), 0) as total_investment_amount
        FROM projects p, jsonb_array_elements(COALESCE(p.project_data->'investorRequests', '[]'::jsonb)) as investment
        WHERE investment->>'status' = 'approved'
      `)
    ]);

    const stats = {
      totalBorrowers: parseInt(usersResult.rows[0].total_borrowers) || 0,
      totalInvestors: parseInt(usersResult.rows[0].total_investors) || 0,
      totalGuarantors: parseInt(usersResult.rows[0].total_guarantors) || 0,
      totalProjects: parseInt(projectsResult.rows[0].total_projects) || 0,
      activeProjects: parseInt(projectsResult.rows[0].active_projects) || 0,
      pendingProjects: parseInt(projectsResult.rows[0].pending_projects) || 0,
      suspendedUsers: parseInt(usersResult.rows[0].suspended_users) || 0,
      suspendedProjects: parseInt(projectsResult.rows[0].suspended_projects) || 0,
      totalInvestmentAmount: parseFloat(investmentsResult.rows[0].total_investment_amount) || 0,
      monthlyGrowth: {
        users: parseInt(usersResult.rows[0].new_users_this_month) || 0,
        projects: parseInt(projectsResult.rows[0].new_projects_this_month) || 0,
        investments: 15 // Mock data for now
      }
    };

    res.json(stats);
  } catch (err) {
    console.error("Error fetching owner stats:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Owner Recent Projects
app.get('/api/owner/recent-projects', verifyToken, async (req, res) => {
  try {
    // Verify owner/admin status
    const adminCheck = await db.query(
      `SELECT is_admin FROM users WHERE firebase_uid = $1`,
      [req.uid]
    );
    
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: "Unauthorized: Owner access required" });
    }

    const result = await db.query(`
      SELECT p.id, p.project_data, p.created_at, u.full_name as borrower_name
      FROM projects p
      LEFT JOIN users u ON p.firebase_uid = u.firebase_uid
      ORDER BY p.created_at DESC
      LIMIT 10
    `);

    const projects = result.rows.map(row => ({
      id: row.project_data?.id || row.id,
      title: row.project_data?.details?.product || 'Untitled Project',
      borrowerName: row.borrower_name || 'Unknown',
      fundingProgress: row.project_data?.details?.fundingProgress || '0%',
      amount: parseInt(row.project_data?.details?.fundingRequirement) || 0,
      status: row.project_data?.status || 'draft',
      createdAt: row.created_at,
      thumbnail: row.project_data?.details?.image
    }));

    res.json(projects);
  } catch (err) {
    console.error("Error fetching recent projects:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Owner Project Insights
app.get('/api/owner/project-insights', verifyToken, async (req, res) => {
  try {
    // Verify owner/admin status
    const adminCheck = await db.query(
      `SELECT is_admin FROM users WHERE firebase_uid = $1`,
      [req.uid]
    );
    
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: "Unauthorized: Owner access required" });
    }

    const result = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE project_data->>'type' = 'equity') as equity_count,
        COUNT(*) FILTER (WHERE project_data->>'type' = 'lending') as lending_count,
        COUNT(*) FILTER (WHERE project_data->>'type' = 'donation') as donation_count,
        COUNT(*) FILTER (WHERE (project_data->'details'->>'fundingRequirement')::numeric > 100000) as high_value_count,
        COUNT(*) as total_count
      FROM projects
    `);

    const row = result.rows[0];
    const total = parseInt(row.total_count) || 1; // Avoid division by zero

    const insights = {
      equity: Math.round((parseInt(row.equity_count) || 0) * 100 / total),
      lending: Math.round((parseInt(row.lending_count) || 0) * 100 / total),
      donation: Math.round((parseInt(row.donation_count) || 0) * 100 / total),
      highValue: Math.round((parseInt(row.high_value_count) || 0) * 100 / total)
    };

    res.json(insights);
  } catch (err) {
    console.error("Error fetching project insights:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Owner Users List
app.get('/api/owner/users', verifyToken, async (req, res) => {
  try {
    // Verify owner/admin status
    const adminCheck = await db.query(
      `SELECT is_admin FROM users WHERE firebase_uid = $1`,
      [req.uid]
    );
    
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: "Unauthorized: Owner access required" });
    }

    const result = await db.query(`
      SELECT 
        firebase_uid,
        full_name,
        username,
        profile_picture,
        has_borrower_account,
        has_investor_account,
        current_account_type,
        status,
        suspension_reason,
        suspended_at,
        suspension_end_date,
        created_at,
        (SELECT COUNT(*) FROM projects WHERE firebase_uid = u.firebase_uid) as total_projects
      FROM users u
      ORDER BY u.created_at DESC
    `);

    const users = result.rows.map(row => ({
      id: row.firebase_uid,
      firebaseUid: row.firebase_uid,
      fullName: row.full_name || 'Unknown User',
      email: 'N/A', // Email column doesn't exist in current schema
      username: row.username,
      profilePicture: row.profile_picture,
      accountTypes: [
        ...(row.has_borrower_account ? ['borrower'] : []),
        ...(row.has_investor_account ? ['investor'] : [])
      ],
      status: row.status || 'active',
      suspensionReason: row.suspension_reason,
      suspendedAt: row.suspended_at,
      suspensionEndDate: row.suspension_end_date,
      memberSince: row.created_at,
      totalProjects: parseInt(row.total_projects) || 0,
      location: null, // Would come from profile data
      lastActivity: null // Would track from login/activity logs
    }));

    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Owner User Detail
app.get('/api/owner/users/:userId', verifyToken, async (req, res) => {
  const { userId } = req.params;
  
  try {
    // Verify owner/admin status
    const adminCheck = await db.query(
      `SELECT is_admin FROM users WHERE firebase_uid = $1`,
      [req.uid]
    );
    
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: "Unauthorized: Owner access required" });
    }

    const userResult = await db.query(`
      SELECT * FROM users WHERE firebase_uid = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];
    
    // Get email from Firebase since it's not stored in the database
    let userEmail = '';
    try {
      const firebaseUser = await admin.auth().getUser(userId);
      userEmail = firebaseUser.email || '';
    } catch (e) {
      console.log('Could not get email from Firebase:', e.message);
    }
    
    // Get project counts
    const projectStats = await db.query(`
      SELECT 
        COUNT(*) as total_projects,
        COUNT(*) FILTER (WHERE project_data->>'status' = 'published') as active_projects,
        COUNT(*) FILTER (WHERE project_data->>'status' = 'completed') as completed_projects
      FROM projects 
      WHERE firebase_uid = $1
    `, [userId]);

    // Initialize profile data structure
    let profileData = {
      personalInfo: {
        firstName: '',
        lastName: '',
        middleName: '',
        dateOfBirth: '',
        placeOfBirth: '',
        gender: '',
        civilStatus: '',
        nationality: '',
        motherMaidenName: '',
        contactEmail: userEmail
      },
      contactInfo: {
        mobileNumber: '',
        countryCode: '',
        presentAddress: '',
        permanentAddress: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      },
      employmentInfo: {
        occupation: '',
        employerName: '',
        employerAddress: '',
        employmentStatus: '',
        grossAnnualIncome: null,
        sourceOfIncome: ''
      },
      identifications: {
        nationalId: '',
        passport: '',
        tin: '',
        secondaryIdType: '',
        secondaryIdNumber: ''
      },
      bankAccounts: [],
      businessInfo: {
        entityType: '',
        entityName: '',
        registrationNumber: '',
        registrationType: '',
        registrationDate: '',
        businessAddress: '',
        authorizedPersonName: '',
        authorizedPersonPosition: ''
      },
      investmentInfo: {
        experience: '',
        objectives: '',
        riskTolerance: '',
        investmentHorizon: '',
        liquidNetWorth: null,
        pepStatus: false
      }
    };

    // Get detailed profile data based on account type
    if (user.has_borrower_account) {
      const borrowerQuery = await db.query(
        `SELECT * FROM borrower_profiles WHERE firebase_uid = $1`,
        [userId]
      );
      
      if (borrowerQuery.rows.length > 0) {
        const borrower = borrowerQuery.rows[0];
        
        // Map borrower personal information
        profileData.personalInfo = {
          firstName: borrower.first_name || '',
          lastName: borrower.last_name || '',
          middleName: borrower.middle_name || '',
          dateOfBirth: borrower.date_of_birth || '',
          placeOfBirth: borrower.place_of_birth || '',
          gender: borrower.gender || '',
          civilStatus: borrower.civil_status || '',
          nationality: borrower.nationality || '',
          motherMaidenName: '',
          contactEmail: borrower.email_address || userEmail
        };

        // Map borrower contact information
        profileData.contactInfo = {
          mobileNumber: borrower.mobile_number || '',
          countryCode: borrower.country_code || '',
          presentAddress: borrower.present_address || '',
          permanentAddress: borrower.permanent_address || '',
          city: borrower.city || '',
          state: borrower.state || '',
          postalCode: borrower.postal_code || '',
          country: borrower.country || ''
        };

        // Map borrower employment information
        profileData.employmentInfo = {
          occupation: borrower.occupation || '',
          employerName: borrower.employer_name || '',
          employerAddress: borrower.employer_address || '',
          employmentStatus: borrower.employment_status || '',
          grossAnnualIncome: borrower.gross_annual_income,
          sourceOfIncome: borrower.source_of_income || ''
        };

        // Map bank account information
        if (borrower.bank_name) {
          profileData.bankAccounts.push({
            bankName: borrower.bank_name,
            accountName: borrower.account_name,
            accountNumber: borrower.account_number,
            accountType: borrower.account_type,
            iban: borrower.iban,
            swiftCode: borrower.swift_code,
            isDefault: borrower.preferred
          });
        }

        // Map business information
        profileData.businessInfo = {
          entityType: borrower.entity_type || '',
          entityName: borrower.entity_name || '',
          registrationNumber: borrower.registration_number || '',
          registrationType: borrower.registration_type || '',
          registrationDate: borrower.registration_date || '',
          businessAddress: borrower.business_address || '',
          authorizedPersonName: borrower.authorized_person_name || '',
          authorizedPersonPosition: borrower.authorized_person_position || ''
        };

        // Map identification documents with uploaded files
        profileData.identifications = {
          nationalId: borrower.national_id || '',
          passport: borrower.passport || '',
          tin: borrower.tin_number || '',
          secondaryIdType: '',
          secondaryIdNumber: '',
          nationalIdFile: borrower.national_id_file || null,
          passportFile: borrower.passport_file || null
        };
      }
    }

    // Also get investor profile data if they have investor account
    if (user.has_investor_account) {
      const investorQuery = await db.query(
        `SELECT * FROM investor_profiles WHERE firebase_uid = $1`,
        [userId]
      );
      
      if (investorQuery.rows.length > 0) {
        const investor = investorQuery.rows[0];
        
        // Merge investor data (override borrower data if both exist)
        if (!profileData.personalInfo.firstName) {
          profileData.personalInfo.firstName = investor.first_name || '';
          profileData.personalInfo.lastName = investor.last_name || '';
          profileData.personalInfo.middleName = investor.middle_name || '';
        }

        // Merge investor identification data with uploaded files
        if (!profileData.identifications.nationalId) {
          profileData.identifications.nationalId = investor.national_id || '';
        }
        if (!profileData.identifications.passport) {
          profileData.identifications.passport = investor.passport || '';
        }
        if (!profileData.identifications.tin) {
          profileData.identifications.tin = investor.tin_number || '';
        }
        // Include investor document files
        if (!profileData.identifications.nationalIdFile) {
          profileData.identifications.nationalIdFile = investor.national_id_file || null;
        }
        if (!profileData.identifications.passportFile) {
          profileData.identifications.passportFile = investor.passport_file || null;
        }
        
        profileData.investmentInfo = {
          experience: investor.investment_experience || '',
          objectives: investor.investment_objectives || '',
          riskTolerance: investor.risk_tolerance || '',
          investmentHorizon: investor.investment_horizon || '',
          liquidNetWorth: investor.liquid_net_worth,
          pepStatus: investor.pep_status === 'yes'
        };

        // Add investor bank account if different from borrower
        if (investor.bank_name && !profileData.bankAccounts.some(acc => acc.bankName === investor.bank_name)) {
          profileData.bankAccounts.push({
            bankName: investor.bank_name,
            accountName: investor.account_name,
            accountNumber: investor.account_number,
            accountType: investor.account_type,
            iban: investor.iban,
            swiftCode: investor.swift_code,
            isDefault: investor.preferred
          });
        }
      }
    }

    const userDetail = {
      id: user.firebase_uid,
      firebaseUid: user.firebase_uid,
      fullName: user.full_name || 'Unknown User',
      email: userEmail,
      username: user.username,
      profilePicture: user.profile_picture,
      accountTypes: [
        ...(user.has_borrower_account ? ['borrower'] : []),
        ...(user.has_investor_account ? ['investor'] : [])
      ],
      status: user.status || 'active',
      suspensionReason: user.suspension_reason,
      suspendedAt: user.suspended_at,
      suspendedBy: user.suspended_by,
      suspensionDuration: user.suspension_duration,
      suspensionEndDate: user.suspension_end_date,
      suspensionScope: user.suspension_scope,
      reactivatedAt: user.reactivated_at,
      reactivatedBy: user.reactivated_by,
      memberSince: user.created_at,
      lastActivity: user.updated_at,
      location: profileData.contactInfo.city && profileData.contactInfo.country ? 
        `${profileData.contactInfo.city}, ${profileData.contactInfo.country}` : null,
      occupation: profileData.employmentInfo.occupation,
      issuerCode: user.firebase_uid.substring(0, 6).toUpperCase(),
      
      // Add comprehensive profile data
      personalProfile: profileData.personalInfo,
      identifications: profileData.identifications,
      addresses: {
        present: profileData.contactInfo.presentAddress,
        permanent: profileData.contactInfo.permanentAddress,
        city: profileData.contactInfo.city,
        state: profileData.contactInfo.state,
        country: profileData.contactInfo.country,
        postalCode: profileData.contactInfo.postalCode
      },
      bankAccounts: profileData.bankAccounts,
      rolesSettings: {
        accountType: user.current_account_type,
        hasBorrowerAccount: user.has_borrower_account,
        hasInvestorAccount: user.has_investor_account,
        isAdmin: user.is_admin,
        isComplete: false
      },
      
      borrowerData: user.has_borrower_account ? {
        totalProjects: parseInt(projectStats.rows[0].total_projects) || 0,
        activeProjects: parseInt(projectStats.rows[0].active_projects) || 0,
        completedProjects: parseInt(projectStats.rows[0].completed_projects) || 0,
        industryType: profileData.businessInfo.entityType,
        businessInfo: profileData.businessInfo,
        employmentInfo: profileData.employmentInfo
      } : null,
      
      investorData: user.has_investor_account ? {
        totalInvestments: 0, // Would calculate from investment data
        activeInvestments: 0,
        portfolioValue: profileData.investmentInfo.liquidNetWorth || 0,
        riskTolerance: profileData.investmentInfo.riskTolerance,
        investmentInfo: profileData.investmentInfo
      } : null,
      
      activityLog: [
        {
          id: 1,
          type: 'account_created',
          description: 'Account created',
          timestamp: user.created_at,
          status: 'completed'
        },
        {
          id: 2,
          type: 'profile_updated',
          description: 'Profile last updated',
          timestamp: user.updated_at,
          status: 'completed'
        }
      ]
    };

    res.json(userDetail);
  } catch (err) {
    console.error("Error fetching user detail:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Owner User Projects
app.get('/api/owner/users/:userId/projects', verifyToken, async (req, res) => {
  const { userId } = req.params;
  
  try {
    // Verify owner/admin status
    const adminCheck = await db.query(
      `SELECT is_admin FROM users WHERE firebase_uid = $1`,
      [req.uid]
    );
    
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: "Unauthorized: Owner access required" });
    }

    const result = await db.query(`
      SELECT id, project_data, created_at
      FROM projects 
      WHERE firebase_uid = $1
      ORDER BY created_at DESC
    `, [userId]);

    const projects = result.rows.map(row => ({
      id: row.project_data?.id || row.id,
      title: row.project_data?.details?.product || 'Untitled Project',
      status: row.project_data?.status || 'draft',
      fundingAmount: parseInt(row.project_data?.details?.fundingRequirement) || 0,
      fundingProgress: row.project_data?.details?.fundingProgress || '0%',
      createdAt: row.created_at
    }));

    res.json(projects);
  } catch (err) {
    console.error("Error fetching user projects:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Owner Suspend User - Full Implementation
app.post('/api/owner/users/:userId/suspend', verifyToken, async (req, res) => {
  const { userId } = req.params;
  const { reason, scope = 'full_account', duration = 'permanent', endDate } = req.body;
  
  console.log(`🔒 Suspend user request - userId: ${userId}, requester: ${req.uid}`);
  
  try {
    // Verify owner/admin status
    const adminCheck = await db.query(
      `SELECT is_admin, full_name FROM users WHERE firebase_uid = $1`,
      [req.uid]
    );
    
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: "Unauthorized: Owner/Admin access required" });
    }

    // Validate required fields
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: "Suspension reason is required" });
    }

    // Get user details for notification
    const userResult = await db.query(
      `SELECT firebase_uid, full_name FROM users WHERE firebase_uid = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    // Begin transaction
    await db.query('BEGIN');

    try {
      // Update user status to suspended
      await db.query(
        `UPDATE users 
         SET status = 'suspended',
             suspension_reason = $1,
             suspended_at = NOW(),
             suspended_by = $2,
             suspension_duration = $3,
             suspension_end_date = $4,
             suspension_scope = $5,
             updated_at = NOW()
         WHERE firebase_uid = $6`,
        [reason, req.uid, duration, endDate, scope, userId]
      );

      // Record in suspension history
      await db.query(
        `INSERT INTO user_suspension_history 
         (firebase_uid, action, reason, scope, duration, end_date, performed_by, notes)
         VALUES ($1, 'suspend', $2, $3, $4, $5, $6, $7)`,
        [
          userId, 
          reason, 
          scope, 
          duration, 
          endDate, 
          req.uid,
          `Suspended by ${adminCheck.rows[0].full_name}`
        ]
      );

      // Create notification for the user
      let notificationMessage = `Your account has been suspended. Reason: ${reason}.`;
      if (duration === 'temporary' && endDate) {
        notificationMessage += ` This suspension will be lifted on ${new Date(endDate).toLocaleDateString()}.`;
      }
      notificationMessage += ' Please contact support if you have questions.';

      await db.query(
        `INSERT INTO notifications 
         (firebase_uid, notification_type, title, message, is_read)
         VALUES ($1, $2, $3, $4, FALSE)`,
        [
          userId,
          'warning',
          'Account Suspended',
          notificationMessage
        ]
      );

      await db.query('COMMIT');

      console.log(`👮 Admin ${req.uid} suspended user ${userId} - Reason: ${reason}`);
      
      // Return updated user data
      res.json({ 
        success: true, 
        message: "User suspended successfully",
        user: {
          ...user,
          status: 'suspended',
          suspension_reason: reason,
          suspended_at: new Date().toISOString()
        }
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error("Error suspending user:", err);
    res.status(500).json({ error: "Failed to suspend user", details: err.message });
  }
});

// Owner Reactivate User - Full Implementation
app.post('/api/owner/users/:userId/reactivate', verifyToken, async (req, res) => {
  const { userId } = req.params;
  const { notes } = req.body;
  
  console.log(`🔓 Reactivate user request - userId: ${userId}, requester: ${req.uid}`);
  
  try {
    // Verify owner/admin status
    const adminCheck = await db.query(
      `SELECT is_admin, full_name FROM users WHERE firebase_uid = $1`,
      [req.uid]
    );
    
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: "Unauthorized: Owner/Admin access required" });
    }

    // Get user details
    const userResult = await db.query(
      `SELECT firebase_uid, full_name, status FROM users WHERE firebase_uid = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    if (user.status !== 'suspended') {
      return res.status(400).json({ error: "User is not currently suspended" });
    }

    // Begin transaction
    await db.query('BEGIN');

    try {
      // Update user status to active
      await db.query(
        `UPDATE users 
         SET status = 'active',
             suspension_reason = NULL,
             suspended_at = NULL,
             suspended_by = NULL,
             suspension_duration = NULL,
             suspension_end_date = NULL,
             suspension_scope = NULL,
             reactivated_at = NOW(),
             reactivated_by = $1,
             updated_at = NOW()
         WHERE firebase_uid = $2`,
        [req.uid, userId]
      );

      // Record in suspension history
      await db.query(
        `INSERT INTO user_suspension_history 
         (firebase_uid, action, reason, performed_by, notes)
         VALUES ($1, 'reactivate', $2, $3, $4)`,
        [
          userId,
          notes || 'Account reactivated by admin',
          req.uid,
          `Reactivated by ${adminCheck.rows[0].full_name}`
        ]
      );

      // Create notification for the user
      await db.query(
        `INSERT INTO notifications 
         (firebase_uid, notification_type, title, message, is_read)
         VALUES ($1, $2, $3, $4, FALSE)`,
        [
          userId,
          'success',
          'Account Reactivated',
          'Your account has been reactivated. You can now access all features and perform transactions.'
        ]
      );

      await db.query('COMMIT');

      console.log(`✅ User ${userId} reactivated by ${req.uid}`);
      
      res.json({ 
        success: true, 
        message: "User reactivated successfully",
        user: {
          ...user,
          status: 'active',
          reactivated_at: new Date().toISOString()
        }
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error("Error reactivating user:", err);
    res.status(500).json({ error: "Failed to reactivate user", details: err.message });
  }
});

// Owner Delete User
app.delete('/api/owner/users/:userId', verifyToken, async (req, res) => {
  const { userId } = req.params;
  
  console.log(`🔴 DELETE ENDPOINT HIT - userId: ${userId}, requester: ${req.uid}`);
  
  try {
    // Verify owner/admin status
    const adminCheck = await db.query(
      `SELECT is_admin FROM users WHERE firebase_uid = $1`,
      [req.uid]
    );
    
    console.log(`🔴 Admin check result:`, adminCheck.rows[0]);
    
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: "Unauthorized: Owner access required" });
    }

    // Begin transaction
    await db.query('BEGIN');

    try {
      // Delete from Firebase first
      try {
        await admin.auth().deleteUser(userId);
        console.log(`✅ Deleted Firebase user: ${userId}`);
      } catch (firebaseError) {
        console.error('⚠️ Firebase user deletion failed:', firebaseError.message);
        // Continue with database deletion even if Firebase deletion fails
      }

      // Delete related data from database
      await db.query('DELETE FROM projects WHERE firebase_uid = $1', [userId]);
      await db.query('DELETE FROM topup_requests WHERE firebase_uid = $1', [userId]);
      await db.query('DELETE FROM borrower_profiles WHERE firebase_uid = $1', [userId]);
      await db.query('DELETE FROM investor_profiles WHERE firebase_uid = $1', [userId]);
      await db.query('DELETE FROM user_settings WHERE firebase_uid = $1', [userId]);
      await db.query('DELETE FROM wallets WHERE firebase_uid = $1', [userId]);
      
      // Delete user
      await db.query('DELETE FROM users WHERE firebase_uid = $1', [userId]);

      await db.query('COMMIT');
      
      console.log(`✅ Owner ${req.uid} deleted user ${userId} completely`);
      res.json({ success: true, message: "User deleted successfully from Firebase and database" });
      
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// NOTE: Suspend and Reactivate endpoints are defined below (starting around line 6200+) with full implementation

// Get suspension history for a user
app.get('/api/owner/users/:userId/suspension-history', verifyToken, async (req, res) => {
  const { userId } = req.params;
  
  try {
    // Verify owner/admin status
    const adminCheck = await db.query(
      `SELECT is_admin FROM users WHERE firebase_uid = $1`,
      [req.uid]
    );
    
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: "Unauthorized: Owner/Admin access required" });
    }

    // Get suspension history
    const historyResult = await db.query(
      `SELECT 
        sh.id,
        sh.action,
        sh.reason,
        sh.scope,
        sh.duration,
        sh.end_date,
        sh.performed_at,
        sh.notes,
        u.full_name as performed_by_name
       FROM user_suspension_history sh
       LEFT JOIN users u ON sh.performed_by = u.firebase_uid
       WHERE sh.firebase_uid = $1
       ORDER BY sh.performed_at DESC`,
      [userId]
    );

    res.json({ 
      success: true, 
      history: historyResult.rows 
    });

  } catch (err) {
    console.error("Error fetching suspension history:", err);
    res.status(500).json({ error: "Failed to fetch suspension history", details: err.message });
  }
});

// Owner Update User
app.put('/api/owner/users/:userId', verifyToken, async (req, res) => {
  const { userId } = req.params;
  const { 
    fullName, 
    email, 
    personalInfo,
    contactInfo,
    employmentInfo,
    identifications,
    bankAccount,
    businessInfo,
    investmentInfo
  } = req.body;
  
  try {
    // Verify owner/admin status
    const adminCheck = await db.query(
      `SELECT is_admin FROM users WHERE firebase_uid = $1`,
      [req.uid]
    );
    
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: "Unauthorized: Owner access required" });
    }

    // Begin transaction
    await db.query('BEGIN');

    try {
      // Update basic user info
      if (fullName) {
        await db.query(
          `UPDATE users SET full_name = $1, updated_at = CURRENT_TIMESTAMP WHERE firebase_uid = $2`,
          [fullName, userId]
        );
      }

      // Update email in Firebase if provided
      if (email) {
        try {
          await admin.auth().updateUser(userId, { email });
          console.log(`✅ Updated Firebase email for user: ${userId}`);
        } catch (firebaseError) {
          console.error('⚠️ Firebase email update failed:', firebaseError.message);
        }
      }

      // Get user account types to determine which profiles to update
      const userQuery = await db.query(
        `SELECT has_borrower_account, has_investor_account FROM users WHERE firebase_uid = $1`,
        [userId]
      );

      if (userQuery.rows.length > 0) {
        const user = userQuery.rows[0];

        // Update borrower profile if user has borrower account
        if (user.has_borrower_account) {
          const borrowerUpdates = [];
          const borrowerValues = [];
          let paramIndex = 1;

          if (personalInfo) {
            if (personalInfo.firstName) {
              borrowerUpdates.push(`first_name = $${paramIndex++}`);
              borrowerValues.push(personalInfo.firstName);
            }
            if (personalInfo.lastName) {
              borrowerUpdates.push(`last_name = $${paramIndex++}`);
              borrowerValues.push(personalInfo.lastName);
            }
            if (personalInfo.middleName) {
              borrowerUpdates.push(`middle_name = $${paramIndex++}`);
              borrowerValues.push(personalInfo.middleName);
            }
            if (personalInfo.dateOfBirth) {
              borrowerUpdates.push(`date_of_birth = $${paramIndex++}`);
              borrowerValues.push(personalInfo.dateOfBirth);
            }
            if (personalInfo.placeOfBirth) {
              borrowerUpdates.push(`place_of_birth = $${paramIndex++}`);
              borrowerValues.push(personalInfo.placeOfBirth);
            }
            if (personalInfo.gender) {
              borrowerUpdates.push(`gender = $${paramIndex++}`);
              borrowerValues.push(personalInfo.gender);
            }
            if (personalInfo.civilStatus) {
              borrowerUpdates.push(`civil_status = $${paramIndex++}`);
              borrowerValues.push(personalInfo.civilStatus);
            }
            if (personalInfo.nationality) {
              borrowerUpdates.push(`nationality = $${paramIndex++}`);
              borrowerValues.push(personalInfo.nationality);
            }
          }

          if (contactInfo) {
            if (contactInfo.mobileNumber) {
              borrowerUpdates.push(`mobile_number = $${paramIndex++}`);
              borrowerValues.push(contactInfo.mobileNumber);
            }
            if (contactInfo.presentAddress) {
              borrowerUpdates.push(`present_address = $${paramIndex++}`);
              borrowerValues.push(contactInfo.presentAddress);
            }
            if (contactInfo.permanentAddress) {
              borrowerUpdates.push(`permanent_address = $${paramIndex++}`);
              borrowerValues.push(contactInfo.permanentAddress);
            }
            if (contactInfo.city) {
              borrowerUpdates.push(`city = $${paramIndex++}`);
              borrowerValues.push(contactInfo.city);
            }
            if (contactInfo.state) {
              borrowerUpdates.push(`state = $${paramIndex++}`);
              borrowerValues.push(contactInfo.state);
            }
            if (contactInfo.country) {
              borrowerUpdates.push(`country = $${paramIndex++}`);
              borrowerValues.push(contactInfo.country);
            }
            if (contactInfo.postalCode) {
              borrowerUpdates.push(`postal_code = $${paramIndex++}`);
              borrowerValues.push(contactInfo.postalCode);
            }
          }

          if (employmentInfo) {
            if (employmentInfo.occupation) {
              borrowerUpdates.push(`occupation = $${paramIndex++}`);
              borrowerValues.push(employmentInfo.occupation);
            }
            if (employmentInfo.employerName) {
              borrowerUpdates.push(`employer_name = $${paramIndex++}`);
              borrowerValues.push(employmentInfo.employerName);
            }
            if (employmentInfo.employerAddress) {
              borrowerUpdates.push(`employer_address = $${paramIndex++}`);
              borrowerValues.push(employmentInfo.employerAddress);
            }
            if (employmentInfo.sourceOfIncome) {
              borrowerUpdates.push(`source_of_income = $${paramIndex++}`);
              borrowerValues.push(employmentInfo.sourceOfIncome);
            }
          }

          if (identifications) {
            if (identifications.nationalId) {
              borrowerUpdates.push(`national_id = $${paramIndex++}`);
              borrowerValues.push(identifications.nationalId);
            }
            if (identifications.passport) {
              borrowerUpdates.push(`passport = $${paramIndex++}`);
              borrowerValues.push(identifications.passport);
            }
            if (identifications.tin) {
              borrowerUpdates.push(`tin_number = $${paramIndex++}`);
              borrowerValues.push(identifications.tin);
            }
          }

          if (bankAccount) {
            if (bankAccount.bankName) {
              borrowerUpdates.push(`bank_name = $${paramIndex++}`);
              borrowerValues.push(bankAccount.bankName);
            }
            if (bankAccount.accountName) {
              borrowerUpdates.push(`account_name = $${paramIndex++}`);
              borrowerValues.push(bankAccount.accountName);
            }
            if (bankAccount.accountNumber) {
              borrowerUpdates.push(`account_number = $${paramIndex++}`);
              borrowerValues.push(bankAccount.accountNumber);
            }
          }

          if (businessInfo) {
            if (businessInfo.entityType) {
              borrowerUpdates.push(`entity_type = $${paramIndex++}`);
              borrowerValues.push(businessInfo.entityType);
            }
            if (businessInfo.entityName) {
              borrowerUpdates.push(`entity_name = $${paramIndex++}`);
              borrowerValues.push(businessInfo.entityName);
            }
            if (businessInfo.registrationNumber) {
              borrowerUpdates.push(`registration_number = $${paramIndex++}`);
              borrowerValues.push(businessInfo.registrationNumber);
            }
          }

          if (borrowerUpdates.length > 0) {
            borrowerUpdates.push(`updated_at = CURRENT_TIMESTAMP`);
            borrowerValues.push(userId);
            
            const updateQuery = `
              UPDATE borrower_profiles 
              SET ${borrowerUpdates.join(', ')}
              WHERE firebase_uid = $${paramIndex}
            `;
            
            await db.query(updateQuery, borrowerValues);
            console.log(`✅ Updated borrower profile for user: ${userId}`);
          }
        }

        // Update investor profile if user has investor account
        if (user.has_investor_account) {
          const investorUpdates = [];
          const investorValues = [];
          let paramIndex = 1;

          if (personalInfo) {
            if (personalInfo.firstName) {
              investorUpdates.push(`first_name = $${paramIndex++}`);
              investorValues.push(personalInfo.firstName);
            }
            if (personalInfo.lastName) {
              investorUpdates.push(`last_name = $${paramIndex++}`);
              investorValues.push(personalInfo.lastName);
            }
            if (personalInfo.dateOfBirth) {
              investorUpdates.push(`date_of_birth = $${paramIndex++}`);
              investorValues.push(personalInfo.dateOfBirth);
            }
            if (personalInfo.nationality) {
              investorUpdates.push(`nationality = $${paramIndex++}`);
              investorValues.push(personalInfo.nationality);
            }
          }

          if (identifications) {
            if (identifications.nationalId) {
              investorUpdates.push(`national_id = $${paramIndex++}`);
              investorValues.push(identifications.nationalId);
            }
            if (identifications.passport) {
              investorUpdates.push(`passport = $${paramIndex++}`);
              investorValues.push(identifications.passport);
            }
            if (identifications.tin) {
              investorUpdates.push(`tin_number = $${paramIndex++}`);
              investorValues.push(identifications.tin);
            }
          }

          if (investmentInfo) {
            if (investmentInfo.experience) {
              investorUpdates.push(`investment_experience = $${paramIndex++}`);
              investorValues.push(investmentInfo.experience);
            }
            if (investmentInfo.riskTolerance) {
              investorUpdates.push(`risk_tolerance = $${paramIndex++}`);
              investorValues.push(investmentInfo.riskTolerance);
            }
          }

          if (investorUpdates.length > 0) {
            investorUpdates.push(`updated_at = CURRENT_TIMESTAMP`);
            investorValues.push(userId);
            
            const updateQuery = `
              UPDATE investor_profiles 
              SET ${investorUpdates.join(', ')}
              WHERE firebase_uid = $${paramIndex}
            `;
            
            await db.query(updateQuery, investorValues);
            console.log(`✅ Updated investor profile for user: ${userId}`);
          }
        }
      }

      await db.query('COMMIT');
      
      console.log(`✅ Owner ${req.uid} successfully updated user ${userId}`);
      res.json({ success: true, message: "User profile updated successfully" });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// ============= END OWNER API ENDPOINTS =============

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
