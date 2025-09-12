// ---------- server.js ----------
// Force deployment update - v2
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

// Initialize Postgres client with better error handling
let db = null;
let dbConnected = false;

if (process.env.DATABASE_URL) {
  try {
    db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : {
        rejectUnauthorized: false,  // Supabase requires SSL
      },
      // Optional: Configure pool settings for better performance
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test the connection
    db.connect()
      .then(client => {
        console.log('✅ Database connected successfully');
        dbConnected = true;
        client.release();
      })
      .catch(err => {
        console.log('❌ Database connection failed:', err.message);
        console.log('🔄 API will continue without database functionality');
        dbConnected = false;
      });
  } catch (error) {
    console.log('❌ Database initialization failed:', error.message);
    console.log('🔄 API will continue without database functionality');
    dbConnected = false;
  }
} else {
  console.log('⚠️  No DATABASE_URL found in environment variables');
  console.log('🔄 API will continue without database functionality');
}

// After your app definition and before any routes
const app = express();

// LOG ALL INCOMING REQUESTS FIRST
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Request Origin:', req.headers.origin);
  console.log('Request Headers:', Object.keys(req.headers));
  next();
});

// CORS configuration - MUST BE FIRST MIDDLEWARE
const corsOptions = {
  origin: (origin, callback) => {
    console.log('🌍 CORS ORIGIN CHECK:', origin);
    console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('🌍 No origin, allowing');
      return callback(null, true);
    }
    
    // Allow all origins for debugging
    console.log('🌍 Allowing all origins for debugging');
    return callback(null, true);
  },
  credentials: true,
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-edit-mode',
    'Accept',
    'X-Requested-With',
    'Access-Control-Allow-Headers',
    'Origin'
  ],
  exposedHeaders: ['Content-Type', 'Authorization', 'x-edit-mode'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// MANUAL CORS HEADERS - AGGRESSIVE APPROACH
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log('🔧 Manual CORS headers for origin:', origin);
  
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,HEAD,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-edit-mode,Accept,X-Requested-With,Origin');
  res.header('Access-Control-Expose-Headers', 'Content-Type,Authorization,x-edit-mode');
  
  if (req.method === 'OPTIONS') {
    console.log('🔧 OPTIONS request - responding with 200');
    return res.status(200).end();
  }
  
  next();
});

// Increase body size limit to 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the dist directory
  app.use(express.static(path.join(__dirname, '../../dist')));
  
  // Handle client-side routing
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next(); // Skip static file serving for API routes
    }
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
  });
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
  if (!idToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.uid = decoded.uid;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ error: 'Unauthorized' });
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
    // Check if database is connected
    if (!dbConnected || !db) {
      console.log('Database not connected, returning default profile');
      return res.json({
        full_name: null,
        role: null,
        created_at: null,
        is_admin: false,
        has_completed_registration: false
      });
    }

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
        created_at: null,
        is_admin: false,
        has_completed_registration: false
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
      created_at: null,
      is_admin: false,
      has_completed_registration: false 
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

// Settings routes
const settingsRouter = express.Router();

// Get user settings/profile (extended version)
settingsRouter.get('/', verifyToken, async (req, res) => {
  try {
    if (!dbConnected || !db) {
      // Return default settings when database is not available
      console.log('Database not connected, returning default settings');
      return res.json({
        fullName: '',
        email: req.user?.email || '',
        phone: '',
        personalInfo: {},
        accountType: 'individual'
      });
    }

    const uid = req.uid;
    console.log("Settings request for user:", uid);
    
    // Get user profile data from Firebase
    const userRecord = await admin.auth().getUser(uid);
    
    // Try to get additional data from database
    let dbUserData = null;
    try {
      const { rows } = await db.query(
        'SELECT * FROM users WHERE firebase_uid = $1',
        [uid]
      );
      dbUserData = rows[0];
    } catch (dbError) {
      console.log('Database query failed, using Firebase data only:', dbError.message);
    }
    
    // Combine Firebase and database data
    const settings = {
      fullName: dbUserData?.full_name || userRecord.displayName || '',
      email: userRecord.email || '',
      phone: dbUserData?.phone || userRecord.phoneNumber || '',
      accountType: dbUserData?.account_type || 'individual',
      // Include all KYC fields
      personalInfo: {
        // Individual fields
        firstName: dbUserData?.first_name || '',
        lastName: dbUserData?.last_name || '',
        middleName: dbUserData?.middle_name || '',
        dateOfBirth: dbUserData?.date_of_birth || '',
        placeOfBirth: dbUserData?.place_of_birth || '',
        nationality: dbUserData?.nationality || '',
        gender: dbUserData?.gender || '',
        maritalStatus: dbUserData?.marital_status || '',
        
        // Contact Information
        emailAddress: dbUserData?.email_address || userRecord.email || '',
        phoneNumber: dbUserData?.phone_number || '',
        mobileNumber: dbUserData?.mobile_number || '',
        
        // Address Information
        presentAddress: dbUserData?.present_address || '',
        permanentAddress: dbUserData?.permanent_address || '',
        city: dbUserData?.city || '',
        state: dbUserData?.state || '',
        postalCode: dbUserData?.postal_code || '',
        country: dbUserData?.country || '',
        
        // Identification
        nationalId: dbUserData?.national_id || '',
        passport: dbUserData?.passport || '',
        driversLicense: dbUserData?.drivers_license || '',
        tinNumber: dbUserData?.tin_number || '',
        
        // Employment Information
        employmentStatus: dbUserData?.employment_status || '',
        occupation: dbUserData?.occupation || '',
        employerName: dbUserData?.employer_name || '',
        employerAddress: dbUserData?.employer_address || '',
        monthlyIncome: dbUserData?.monthly_income || '',
        incomeSource: dbUserData?.income_source || '',
        
        // Non-Individual specific fields
        companyName: dbUserData?.company_name || '',
        businessType: dbUserData?.business_type || '',
        businessRegistrationNumber: dbUserData?.business_registration_number || '',
        taxIdentificationNumber: dbUserData?.tax_identification_number || '',
        businessAddress: dbUserData?.business_address || '',
        authorizedPersonName: dbUserData?.authorized_person_name || '',
        authorizedPersonPosition: dbUserData?.authorized_person_position || '',
        
        // Investment Information
        investmentExperience: dbUserData?.investment_experience || '',
        riskTolerance: dbUserData?.risk_tolerance || '',
        investmentGoals: dbUserData?.investment_goals || '',
        liquidNetWorth: dbUserData?.liquid_net_worth || '',
        annualIncome: dbUserData?.annual_income || '',
        investmentHorizon: dbUserData?.investment_horizon || '',
        
        // PEP (Politically Exposed Person) Information
        pepStatus: dbUserData?.pep_status || 'no',
        pepDetails: dbUserData?.pep_details || '',
        pepCountry: dbUserData?.pep_country || '',
        pepPosition: dbUserData?.pep_position || '',
        
        // Related Persons PEP Information
        relatedPepStatus: dbUserData?.related_pep_status || 'no',
        relatedPepDetails: dbUserData?.related_pep_details || '',
        relatedPepRelationship: dbUserData?.related_pep_relationship || '',
        relatedPepCountry: dbUserData?.related_pep_country || '',
        relatedPepPosition: dbUserData?.related_pep_position || ''
      }
    };
    
    console.log("Returning settings for user:", uid);
    res.json(settings);
    
  } catch (error) {
    console.error("Error getting user settings:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// Update user settings
settingsRouter.put('/', verifyToken, async (req, res) => {
  try {
    if (!dbConnected || !db) {
      console.log('Database not connected, cannot update settings');
      return res.status(503).json({ error: "Database not available" });
    }

    const uid = req.uid;
    const settingsData = req.body;
    
    console.log("Updating settings for user:", uid);
    console.log("Settings data:", settingsData);
    
    // Update user data in database
    const updateFields = [];
    const updateValues = [];
    let paramCounter = 1;
    
    // Map frontend fields to database columns
    const fieldMapping = {
      'personalInfo.firstName': 'first_name',
      'personalInfo.lastName': 'last_name',
      'personalInfo.middleName': 'middle_name',
      'personalInfo.dateOfBirth': 'date_of_birth',
      'personalInfo.placeOfBirth': 'place_of_birth',
      'personalInfo.nationality': 'nationality',
      'personalInfo.gender': 'gender',
      'personalInfo.maritalStatus': 'marital_status',
      'personalInfo.emailAddress': 'email_address',
      'personalInfo.phoneNumber': 'phone_number',
      'personalInfo.mobileNumber': 'mobile_number',
      'personalInfo.presentAddress': 'present_address',
      'personalInfo.permanentAddress': 'permanent_address',
      'personalInfo.city': 'city',
      'personalInfo.state': 'state',
      'personalInfo.postalCode': 'postal_code',
      'personalInfo.country': 'country',
      'personalInfo.nationalId': 'national_id',
      'personalInfo.passport': 'passport',
      'personalInfo.driversLicense': 'drivers_license',
      'personalInfo.tinNumber': 'tin_number',
      'personalInfo.employmentStatus': 'employment_status',
      'personalInfo.occupation': 'occupation',
      'personalInfo.employerName': 'employer_name',
      'personalInfo.employerAddress': 'employer_address',
      'personalInfo.monthlyIncome': 'monthly_income',
      'personalInfo.incomeSource': 'income_source',
      'personalInfo.companyName': 'company_name',
      'personalInfo.businessType': 'business_type',
      'personalInfo.businessRegistrationNumber': 'business_registration_number',
      'personalInfo.taxIdentificationNumber': 'tax_identification_number',
      'personalInfo.businessAddress': 'business_address',
      'personalInfo.authorizedPersonName': 'authorized_person_name',
      'personalInfo.authorizedPersonPosition': 'authorized_person_position',
      'personalInfo.investmentExperience': 'investment_experience',
      'personalInfo.riskTolerance': 'risk_tolerance',
      'personalInfo.investmentGoals': 'investment_goals',
      'personalInfo.liquidNetWorth': 'liquid_net_worth',
      'personalInfo.annualIncome': 'annual_income',
      'personalInfo.investmentHorizon': 'investment_horizon',
      'personalInfo.pepStatus': 'pep_status',
      'personalInfo.pepDetails': 'pep_details',
      'personalInfo.pepCountry': 'pep_country',
      'personalInfo.pepPosition': 'pep_position',
      'personalInfo.relatedPepStatus': 'related_pep_status',
      'personalInfo.relatedPepDetails': 'related_pep_details',
      'personalInfo.relatedPepRelationship': 'related_pep_relationship',
      'personalInfo.relatedPepCountry': 'related_pep_country',
      'personalInfo.relatedPepPosition': 'related_pep_position',
      'fullName': 'full_name',
      'phone': 'phone_number',
      'accountType': 'account_type'
    };
    
    // Build update query
    for (const [frontendField, dbField] of Object.entries(fieldMapping)) {
      const value = frontendField.includes('.') ? 
        settingsData[frontendField.split('.')[0]]?.[frontendField.split('.')[1]] :
        settingsData[frontendField];
        
      if (value !== undefined) {
        updateFields.push(`${dbField} = $${paramCounter}`);
        updateValues.push(value);
        paramCounter++;
      }
    }
    
    if (updateFields.length > 0) {
      updateFields.push(`updated_at = NOW()`);
      updateValues.push(uid);
      
      const query = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE firebase_uid = $${paramCounter}
      `;
      
      await db.query(query, updateValues);
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error("Error updating user settings:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// Change password
settingsRouter.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const uid = req.uid;
    
    console.log("Password change request for user:", uid);
    
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
    console.error("Error changing password:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to change password" 
    });
  }
});

// Forgot password
settingsRouter.post('/forgot-password', async (req, res) => {
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

app.use('/api/settings', settingsRouter);

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

// Get all projects (with optional filters)
projectsRouter.get("/", async (req, res) => {
  const { status } = req.query;
  
  try {
    console.log("=== PROJECTS API CALL ===");
    console.log("Status filter:", status);
    
    let query = `SELECT p.id, p.firebase_uid, p.project_data, p.created_at, u.full_name 
                FROM projects p
                LEFT JOIN users u ON p.firebase_uid = u.firebase_uid`;
    
    const params = [];
    if (status) {
      query += ` WHERE p.project_data->>'status' = $1`;
      params.push(status);
      console.log("Filtering for status:", status);
    }
    
    console.log("Executing query:", query);
    console.log("With params:", params);
    
    const { rows } = await db.query(query, params);
    console.log(`Found ${rows.length} projects`);
    
    // Log project statuses for debugging
    rows.forEach((project, index) => {
      const projectData = project.project_data || {};
      console.log(`Project ${index + 1}: ID=${project.id}, Status="${projectData.status || 'no status'}", Product="${projectData.details?.product || 'no product'}"`);
    });
    
    res.json(rows);
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

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

// Add investment request to a project
projectsRouter.post("/:id/invest", verifyToken, async (req, res) => {
  const { id } = req.params;
  const uid = req.uid;
  const { amount } = req.body;
  
  try {
    // Get the project and user data
    const projectResult = await db.query(
      `SELECT project_data FROM projects WHERE id = $1`,
      [id]
    );
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    const userResult = await db.query(
      `SELECT full_name FROM users WHERE firebase_uid = $1`,
      [uid]
    );
    
    // Update the project with the investment request
    const projectData = projectResult.rows[0].project_data;
    const investorName = userResult.rows[0]?.full_name || "Investor";
    
    if (!projectData.investorRequests) {
      projectData.investorRequests = [];
    }
    
    projectData.investorRequests.push({
      investorId: uid,
      name: investorName,
      amount: parseFloat(amount),
      date: new Date().toISOString(),
      status: "pending"
    });
    
    await db.query(
      `UPDATE projects 
       SET project_data = $1, updated_at = NOW()
       WHERE id = $2`,
      [projectData, id]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error" });
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
      `SELECT project_data FROM projects WHERE id = $1`,
      [id]
    );
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    const userResult = await db.query(
      `SELECT full_name FROM users WHERE firebase_uid = $1`,
      [uid]
    );
    
    // Update the project with the interest request
    const projectData = projectResult.rows[0].project_data;
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
projectsRouter.post('/:id/interest/:investorId/approve', verifyToken, async (req, res) => {
  try {
    const { id, investorId } = req.params;
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
projectsRouter.post('/:id/interest/:investorId/reject', verifyToken, async (req, res) => {
  try {
    const { id, investorId } = req.params;
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

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API listening on port ${PORT}`));

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
  const { approved } = req.query;
  
  try {
    let query = `SELECT p.id, p.firebase_uid, p.project_data, p.created_at, u.full_name 
                FROM projects p
                LEFT JOIN users u ON p.firebase_uid = u.firebase_uid`;
    
    const params = [];
    let conditions = [];
    
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
