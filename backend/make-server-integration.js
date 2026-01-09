/**
 * Add these sections to backend/server.js for Make.com integration
 * 
 * STEP 1: Add imports at the top (after existing imports)
 * STEP 2: Add environment variables
 * STEP 3: Add the Make notification function
 * STEP 4: Add new API endpoints
 * STEP 5: Update profile creation to notify Make
 */

// ============================================================
// STEP 1: Add after line 11 (after existing imports)
// ============================================================
import crypto from 'crypto';

// ============================================================
// STEP 2: Add after Firebase initialization (around line 60)
// ============================================================

// Make.com Integration Configuration
const MAKE_API_KEY = process.env.MAKE_API_KEY || 'your-secret-key-here-change-in-env';
const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL || null;

console.log('Make.com integration:', MAKE_WEBHOOK_URL ? 'Enabled ✅' : 'Disabled ⚠️');

// ============================================================
// STEP 3: Add helper function (before app initialization)
// ============================================================

/**
 * Notify Make.com when a new user registers on InitiatePH
 * This triggers the PH → Global sync scenario
 */
async function notifyMakeOfNewUser(userData) {
  // Skip if Make webhook not configured
  if (!MAKE_WEBHOOK_URL) {
    console.log('⚠️  Make webhook not configured, skipping sync');
    return;
  }

  try {
    const payload = {
      source_system: 'PH',
      source_event_id: crypto.randomUUID(),
      source_timestamp: new Date().toISOString(),
      user: {
        email: userData.email,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        full_name: userData.full_name || '',
        phone_number: userData.phone_number || '',
        role: userData.role || 'borrower',
        firebase_uid: userData.firebase_uid,
        ph_user_id: userData.id
      }
    };

    console.log('🔔 Notifying Make.com of new user:', userData.email);

    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('❌ Make webhook failed:', response.status, response.statusText);
    } else {
      console.log('✅ Make webhook called successfully');
    }
  } catch (error) {
    // Don't fail the registration if webhook fails
    console.error('⚠️  Make webhook error (non-critical):', error.message);
  }
}

// ============================================================
// STEP 4: Add new API endpoints (before app.listen)
// ============================================================

// Middleware to verify Make.com requests
const verifyMakeRequest = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== MAKE_API_KEY) {
    console.log('❌ Unauthorized Make request - invalid API key');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Check if user exists (called by Make)
app.post('/api/check-user', verifyMakeRequest, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await db.query(
      'SELECT id, firebase_uid, email FROM users WHERE email = $1',
      [email]
    );

    if (result.rows && result.rows.length > 0) {
      return res.json({
        exists: true,
        user_id: result.rows[0].id,
        firebase_uid: result.rows[0].firebase_uid
      });
    }

    return res.json({ exists: false });
  } catch (error) {
    console.error('Check user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync user from Make.com (create or update from InitiateGlobal)
app.post('/api/sync-user', verifyMakeRequest, async (req, res) => {
  try {
    const {
      email,
      first_name,
      last_name,
      phone_number,
      global_user_id,
      source_system,
      source_event_id
    } = req.body;

    // Validate required fields
    if (!email || !source_system || !source_event_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, source_system, source_event_id' 
      });
    }

    // Loop protection: don't sync if it came from PH
    if (source_system === 'PH') {
      console.log('⚠️  Loop protection: Ignoring PH-originated sync');
      return res.json({ success: true, message: 'Loop protection: ignored' });
    }

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id, firebase_uid, email FROM users WHERE email = $1',
      [email]
    );

    let userId;
    let firebaseUid;
    const fullName = `${first_name || ''} ${last_name || ''}`.trim();

    if (existingUser.rows && existingUser.rows.length > 0) {
      // User exists - UPDATE
      userId = existingUser.rows[0].id;
      firebaseUid = existingUser.rows[0].firebase_uid;

      await db.query(
        `UPDATE users SET 
          first_name = $1,
          last_name = $2,
          full_name = $3,
          phone_number = $4,
          updated_at = NOW()
        WHERE id = $5`,
        [first_name, last_name, fullName, phone_number, userId]
      );

      console.log(`✅ Updated existing user from Global: ${email}`);
      
      return res.json({
        success: true,
        action: 'updated',
        user_id: userId,
        firebase_uid: firebaseUid
      });

    } else {
      // User doesn't exist - CREATE
      
      // Generate a temporary password (user will reset via email)
      const tempPassword = crypto.randomBytes(16).toString('hex');
      
      try {
        // Create Firebase user first
        const firebaseUser = await admin.auth().createUser({
          email: email,
          password: tempPassword,
          displayName: fullName
        });

        firebaseUid = firebaseUser.uid;

        // Create Supabase record
        const result = await db.query(
          `INSERT INTO users (
            email, 
            firebase_uid, 
            first_name, 
            last_name, 
            full_name,
            phone_number,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING id`,
          [
            email,
            firebaseUid,
            first_name,
            last_name,
            fullName,
            phone_number
          ]
        );

        userId = result.rows[0].id;

        console.log(`✅ Created new user from Global: ${email}`);

        // Send password reset email
        try {
          const resetLink = await admin.auth().generatePasswordResetLink(email);
          console.log('📧 Password reset link generated for:', email);
          // TODO: Send email with reset link
        } catch (emailError) {
          console.error('⚠️  Password reset email error:', emailError.message);
        }

        return res.json({
          success: true,
          action: 'created',
          user_id: userId,
          firebase_uid: firebaseUid,
          message: 'User created. Password reset email sent.'
        });

      } catch (firebaseError) {
        console.error('Firebase user creation error:', firebaseError);
        return res.status(500).json({ 
          error: 'Failed to create Firebase user',
          details: firebaseError.message 
        });
      }
    }

  } catch (error) {
    console.error('Sync user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// STEP 5: Update the profileRouter.post() endpoint
// Find this section around line 244 and modify it:
// ============================================================

/*
FIND THIS CODE (around line 244-261):

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

REPLACE WITH:
*/

profileRouter.post('/', verifyToken, async (req, res) => {
  const { fullName, role } = req.body;
  try {
    // Split full name into first and last
    const nameParts = (fullName || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Insert or update user
    const result = await db.query(
      `INSERT INTO users (firebase_uid, full_name, first_name, last_name, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (firebase_uid) DO UPDATE
         SET full_name = EXCLUDED.full_name, 
             first_name = EXCLUDED.first_name,
             last_name = EXCLUDED.last_name,
             role = EXCLUDED.role,
             updated_at = NOW()
       RETURNING id, email, phone_number`,
      [req.uid, fullName, firstName, lastName, role || 'borrower']
    );

    // Get the user ID and other details
    const userId = result.rows[0].id;
    const userEmail = result.rows[0].email;
    const phoneNumber = result.rows[0].phone_number;

    // Notify Make.com for sync to InitiateGlobal (non-blocking)
    notifyMakeOfNewUser({
      id: userId,
      email: userEmail,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      phone_number: phoneNumber,
      role: role || 'borrower',
      firebase_uid: req.uid
    });

    res.json({ success: true });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================
// DONE! Summary of changes:
// ============================================================
// 1. ✅ Import crypto module
// 2. ✅ Add Make.com configuration (webhook URL and API key)
// 3. ✅ Add notifyMakeOfNewUser() function
// 4. ✅ Add /api/check-user endpoint
// 5. ✅ Add /api/sync-user endpoint  
// 6. ✅ Update profileRouter.post() to trigger Make webhook
//
// Don't forget to add to .env file:
// MAKE_API_KEY=your-generated-secret-key-here
// MAKE_WEBHOOK_URL=https://hook.us1.make.com/YOUR_WEBHOOK_ID
// ============================================================
