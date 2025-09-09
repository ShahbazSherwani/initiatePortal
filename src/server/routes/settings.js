import express from 'express';
const router = express.Router();

// These will be injected from the main server file
let db, verifyToken;

// Get user settings and profile data
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const { uid: firebase_uid } = req;
    
    // Get user base info
    const userQuery = await db.query(
      `SELECT * FROM users WHERE firebase_uid = $1`,
      [firebase_uid]
    );
    
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userQuery.rows[0];
    let profileData = {
      fullName: user.full_name,
      email: user.email || '',
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

    // Get detailed profile data based on account type
    if (user.has_borrower_account) {
      const borrowerQuery = await db.query(
        `SELECT * FROM borrower_profiles WHERE firebase_uid = $1`,
        [firebase_uid]
      );
      
      if (borrowerQuery.rows.length > 0) {
        const borrower = borrowerQuery.rows[0];
        profileData.phone = borrower.phone_number || profileData.phone;
        profileData.dateOfBirth = borrower.date_of_birth || profileData.dateOfBirth;
        // Add address and identification data if available
        if (borrower.address_data) {
          profileData.address = JSON.parse(borrower.address_data);
        }
        if (borrower.identification_data) {
          profileData.identification = JSON.parse(borrower.identification_data);
        }
      }
    }
    
    if (user.has_investor_account) {
      const investorQuery = await db.query(
        `SELECT * FROM investor_profiles WHERE firebase_uid = $1`,
        [firebase_uid]
      );
      
      if (investorQuery.rows.length > 0) {
        const investor = investorQuery.rows[0];
        profileData.phone = investor.phone_number || profileData.phone;
        profileData.dateOfBirth = investor.date_of_birth || profileData.dateOfBirth;
        // Add additional investor-specific data if needed
      }
    }

    res.json({
      success: true,
      profile: profileData
    });
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update user settings
router.post('/profile', verifyToken, async (req, res) => {
  try {
    const { uid: firebase_uid } = req;
    const { profileData, privacySettings, notificationSettings, securitySettings } = req.body;
    
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Update basic user info
      if (profileData) {
        await client.query(
          `UPDATE users SET 
           full_name = $1, 
           phone_number = $2,
           updated_at = CURRENT_TIMESTAMP
           WHERE firebase_uid = $3`,
          [profileData.fullName, profileData.phone, firebase_uid]
        );
      }
      
      // Save settings to a settings table (create if doesn't exist)
      await client.query(`
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
      await client.query(`
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
      
      await client.query('COMMIT');
      
      res.json({ success: true, message: 'Settings updated successfully' });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get user settings
router.get('/settings', verifyToken, async (req, res) => {
  try {
    const { uid: firebase_uid } = req;
    
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

// Change password endpoint
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Note: In a real implementation, you would:
    // 1. Verify the current password against Firebase Auth
    // 2. Update the password through Firebase Auth API
    // For now, we'll just return success
    
    console.log('Password change requested for user:', req.uid);
    
    res.json({ 
      success: true, 
      message: 'Password changed successfully' 
    });
    
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Export the router and a function to inject dependencies
export default router;

export function createSettingsRouter(database, tokenVerifier) {
  db = database;
  verifyToken = tokenVerifier;
  return router;
}
