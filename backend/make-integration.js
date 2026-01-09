// Make.com Integration Endpoints for InitiatePH
// Add these to backend/server.js

import crypto from 'crypto';

// API Key for Make.com webhooks (store in .env)
const MAKE_API_KEY = process.env.MAKE_API_KEY || 'your-secret-key-here';
const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL || 'https://hook.us1.make.com/YOUR_WEBHOOK_ID';

// Middleware to verify Make.com requests
const verifyMakeRequest = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== MAKE_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// 1. Check if user exists
app.post('/api/check-user', verifyMakeRequest, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check in Supabase
    const { data, error } = await db.query(
      'SELECT id, firebase_uid, email FROM users WHERE email = $1',
      [email]
    );

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (data.rows && data.rows.length > 0) {
      return res.json({
        exists: true,
        user_id: data.rows[0].id,
        firebase_uid: data.rows[0].firebase_uid
      });
    }

    return res.json({ exists: false });
  } catch (error) {
    console.error('Check user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Sync user from Make.com (create or update)
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
      console.log('⚠️ Loop protection: Ignoring PH-originated sync');
      return res.json({ success: true, message: 'Loop protection: ignored' });
    }

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id, firebase_uid, email FROM users WHERE email = $1',
      [email]
    );

    let userId;
    let firebaseUid;

    if (existingUser.rows && existingUser.rows.length > 0) {
      // User exists - UPDATE
      userId = existingUser.rows[0].id;
      firebaseUid = existingUser.rows[0].firebase_uid;

      await db.query(
        `UPDATE users SET 
          first_name = $1,
          last_name = $2,
          phone_number = $3,
          global_user_id = $4,
          updated_at = NOW()
        WHERE id = $5`,
        [first_name, last_name, phone_number, global_user_id, userId]
      );

      console.log(`✅ Updated existing user: ${email}`);
      
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
          displayName: `${first_name} ${last_name}`.trim()
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
            global_user_id,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          RETURNING id`,
          [
            email,
            firebaseUid,
            first_name,
            last_name,
            `${first_name} ${last_name}`.trim(),
            phone_number,
            global_user_id
          ]
        );

        userId = result.rows[0].id;

        console.log(`✅ Created new user from Global: ${email}`);

        // TODO: Send password reset email to user
        // const resetLink = await admin.auth().generatePasswordResetLink(email);

        return res.json({
          success: true,
          action: 'created',
          user_id: userId,
          firebase_uid: firebaseUid,
          message: 'User created. Password reset email should be sent.'
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

// 3. Function to call Make webhook after PH user registration
async function notifyMakeOfNewUser(userData) {
  try {
    const payload = {
      source_system: 'PH',
      source_event_id: crypto.randomUUID(),
      source_timestamp: new Date().toISOString(),
      user: {
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone_number: userData.phone_number,
        role: userData.role,
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
      console.error('❌ Make webhook failed:', response.statusText);
    } else {
      console.log('✅ Make webhook called successfully');
    }
  } catch (error) {
    // Don't fail the registration if webhook fails
    console.error('⚠️ Make webhook error (non-critical):', error.message);
  }
}

// Export for use in profile router
export { notifyMakeOfNewUser, verifyMakeRequest };
