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
        
        // Add all KYC fields for borrowers
        profileData.identification = {
          nationalId: borrower.national_id || '',
          passport: borrower.passport_number || '',
          tin: borrower.tin || '',
        };
        
        profileData.address = {
          street: borrower.street_address || '',
          barangay: borrower.barangay || '',
          city: borrower.city || '',
          state: borrower.state_province || '',
          country: borrower.country || '',
          postalCode: borrower.postal_code || '',
        };
        
        // Add bank account information
        profileData.bankAccount = {
          accountName: borrower.account_name || '',
          bankName: borrower.bank_name || '',
          accountType: borrower.account_type || '',
          accountNumber: borrower.account_number || '',
          iban: borrower.iban || '',
          swiftCode: borrower.swift_code || '',
        };
        
        // Individual KYC fields
        if (borrower.is_individual_account) {
          profileData.personalInfo = {
            placeOfBirth: borrower.place_of_birth || '',
            gender: borrower.gender || '',
            civilStatus: borrower.civil_status || '',
            nationality: borrower.nationality || '',
            motherMaidenName: borrower.mother_maiden_name || '',
          };
          
          profileData.employmentInfo = {
            employerName: borrower.employer_name || '',
            occupation: borrower.occupation || '',
            employerAddress: borrower.employer_address || '',
            sourceOfIncome: borrower.source_of_income || '',
            monthlyIncome: borrower.monthly_income || null,
          };
          
          profileData.emergencyContact = {
            name: borrower.emergency_contact_name || '',
            relationship: borrower.emergency_contact_relationship || '',
            phone: borrower.emergency_contact_phone || '',
            address: borrower.emergency_contact_address || '',
          };
          
          profileData.pepStatus = borrower.pep_status || false;
        } else {
          // Non-Individual KYC fields
          profileData.businessInfo = {
            businessRegistrationType: borrower.business_registration_type || '',
            businessRegistrationNumber: borrower.business_registration_number || '',
            businessRegistrationDate: borrower.business_registration_date || '',
            corporateTin: borrower.corporate_tin || '',
            natureOfBusiness: borrower.nature_of_business || '',
            businessAddress: borrower.business_address || '',
          };
          
          profileData.authorizedSignatory = {
            name: borrower.authorized_signatory_name || '',
            position: borrower.authorized_signatory_position || '',
            idNumber: borrower.authorized_signatory_id_number || '',
          };
          
          profileData.pepStatus = borrower.pep_status || false;
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
        
        // Add all KYC fields for investors
        if (!profileData.identification) {
          profileData.identification = {
            nationalId: investor.national_id || '',
            passport: investor.passport_number || '',
            tin: investor.tin || '',
          };
        }
        
        if (!profileData.address || Object.values(profileData.address).every(v => !v)) {
          profileData.address = {
            street: investor.street_address || '',
            barangay: investor.barangay || '',
            city: investor.city || '',
            state: investor.state_province || '',
            country: investor.country || '',
            postalCode: investor.postal_code || '',
          };
        }
        
        // Add bank account information for investors
        if (!profileData.bankAccount || Object.values(profileData.bankAccount).every(v => !v)) {
          profileData.bankAccount = {
            accountName: investor.account_name || '',
            bankName: investor.bank_name || '',
            accountType: investor.account_type || '',
            accountNumber: investor.account_number || '',
            iban: investor.iban || '',
            swiftCode: investor.swift_code || '',
          };
        }
        
        // Individual KYC fields for investors
        if (investor.is_individual_account) {
          if (!profileData.personalInfo) {
            profileData.personalInfo = {
              placeOfBirth: investor.place_of_birth || '',
              gender: investor.gender || '',
              civilStatus: investor.civil_status || '',
              nationality: investor.nationality || '',
              motherMaidenName: investor.mother_maiden_name || '',
            };
          }
          
          if (!profileData.employmentInfo) {
            profileData.employmentInfo = {
              employerName: investor.employer_name || '',
              occupation: investor.occupation || '',
              employerAddress: investor.employer_address || '',
              sourceOfIncome: investor.source_of_income || '',
              monthlyIncome: investor.monthly_income || null,
            };
          }
          
          if (!profileData.emergencyContact) {
            profileData.emergencyContact = {
              name: investor.emergency_contact_name || '',
              relationship: investor.emergency_contact_relationship || '',
              phone: investor.emergency_contact_phone || '',
              address: investor.emergency_contact_address || '',
            };
          }
          
          if (profileData.pepStatus === undefined) {
            profileData.pepStatus = investor.pep_status || false;
          }
        } else {
          // Non-Individual KYC fields for investors
          if (!profileData.businessInfo) {
            profileData.businessInfo = {
              businessRegistrationType: investor.business_registration_type || '',
              businessRegistrationNumber: investor.business_registration_number || '',
              businessRegistrationDate: investor.business_registration_date || '',
              corporateTin: investor.corporate_tin || '',
              natureOfBusiness: investor.nature_of_business || '',
              businessAddress: investor.business_address || '',
            };
          }
          
          if (!profileData.authorizedSignatory) {
            profileData.authorizedSignatory = {
              name: investor.authorized_signatory_name || '',
              position: investor.authorized_signatory_position || '',
              idNumber: investor.authorized_signatory_id_number || '',
            };
          }
          
          if (profileData.pepStatus === undefined) {
            profileData.pepStatus = investor.pep_status || false;
          }
        }
        
        // Investor-specific fields
        profileData.investmentInfo = {
          experience: investor.investment_experience || '',
          preference: investor.investment_preference || '',
          riskTolerance: investor.risk_tolerance || '',
          portfolioValue: investor.portfolio_value || 0,
        };
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
    const { uid: firebase_uid } = req;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }
    
    // Get user's email from database
    const userQuery = await db.query(
      `SELECT email FROM users WHERE firebase_uid = $1`,
      [firebase_uid]
    );
    
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userEmail = userQuery.rows[0].email;
    
    // Import Firebase Admin if not already imported
    const admin = await import('firebase-admin');
    
    try {
      // Update password using Firebase Admin SDK
      await admin.auth().updateUser(firebase_uid, {
        password: newPassword
      });
      
      console.log('Password changed successfully for user:', firebase_uid);
      
      res.json({ 
        success: true, 
        message: 'Password changed successfully' 
      });
      
    } catch (firebaseError) {
      console.error('Firebase password update error:', firebaseError);
      
      if (firebaseError.code === 'auth/user-not-found') {
        return res.status(404).json({ error: 'User not found in authentication system' });
      } else if (firebaseError.code === 'auth/weak-password') {
        return res.status(400).json({ error: 'Password is too weak' });
      }
      
      return res.status(500).json({ error: 'Failed to update password in authentication system' });
    }
    
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }
    
    // Check if user exists in our database
    const userQuery = await db.query(
      `SELECT firebase_uid, full_name FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );
    
    if (userQuery.rows.length === 0) {
      // For security, we don't reveal if the email exists or not
      return res.json({ 
        success: true, 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }
    
    // Import Firebase Admin if not already imported
    const admin = await import('firebase-admin');
    
    try {
      // Generate password reset link using Firebase Admin SDK
      const resetLink = await admin.auth().generatePasswordResetLink(email, {
        url: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/login`, // Redirect after reset
        handleCodeInApp: false
      });
      
      console.log('Password reset link generated for:', email);
      console.log('Reset link:', resetLink);
      
      // In a real application, you would send this link via email
      // For now, we'll just log it and return success
      
      // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
      // await sendPasswordResetEmail(email, resetLink, userQuery.rows[0].full_name);
      
      res.json({ 
        success: true, 
        message: 'If an account with that email exists, a password reset link has been sent.',
        // Remove this in production - only for testing
        resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
      });
      
    } catch (firebaseError) {
      console.error('Firebase password reset error:', firebaseError);
      
      if (firebaseError.code === 'auth/user-not-found') {
        // For security, we don't reveal if the email exists or not
        return res.json({ 
          success: true, 
          message: 'If an account with that email exists, a password reset link has been sent.' 
        });
      }
      
      return res.status(500).json({ error: 'Failed to generate password reset link' });
    }
    
  } catch (error) {
    console.error('Error processing forgot password request:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Export the router and a function to inject dependencies
export default router;

export function createSettingsRouter(database, tokenVerifier) {
  db = database;
  verifyToken = tokenVerifier;
  return router;
}
