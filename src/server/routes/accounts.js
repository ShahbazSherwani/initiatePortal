import express from 'express';
const router = express.Router();

// These will be injected from the main server file
let db, verifyToken;

// Get all account profiles for a user
router.get('/accounts', verifyToken, async (req, res) => {
  try {
    const { uid: firebase_uid } = req;
    
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
    const accounts = {};
    
    // Get borrower profile if exists
    if (user.has_borrower_account) {
      const borrowerQuery = await db.query(
        `SELECT * FROM borrower_profiles WHERE firebase_uid = $1`,
        [firebase_uid]
      );
      
      if (borrowerQuery.rows.length > 0) {
        accounts.borrower = {
          type: 'borrower',
          profile: borrowerQuery.rows[0],
          isComplete: borrowerQuery.rows[0].is_complete,
          hasActiveProject: borrowerQuery.rows[0].has_active_project
        };
      }
    }
    
    // Get investor profile if exists
    if (user.has_investor_account) {
      const investorQuery = await db.query(
        `SELECT * FROM investor_profiles WHERE firebase_uid = $1`,
        [firebase_uid]
      );
      
      if (investorQuery.rows.length > 0) {
        accounts.investor = {
          type: 'investor',
          profile: investorQuery.rows[0],
          isComplete: investorQuery.rows[0].is_complete,
          portfolioValue: parseFloat(investorQuery.rows[0].portfolio_value || 0)
        };
      }
    }
    
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
router.post('/accounts/create', verifyToken, async (req, res) => {
  try {
    const { uid: firebase_uid } = req;
    const { accountType, profileData } = req.body;
    
    if (!accountType || !['borrower', 'investor'].includes(accountType)) {
      return res.status(400).json({ error: 'Invalid account type' });
    }
    
    const client = await db.getClient();
    
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
router.post('/accounts/switch', verifyToken, async (req, res) => {
  try {
    const { uid: firebase_uid } = req;
    const { accountType } = req.body;
    
    if (!accountType || !['borrower', 'investor'].includes(accountType)) {
      return res.status(400).json({ error: 'Invalid account type' });
    }
    
    // Check if user has the requested account type
    const userQuery = await db.query(
      `SELECT has_borrower_account, has_investor_account FROM users WHERE firebase_uid = $1`,
      [firebase_uid]
    );
    
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userQuery.rows[0];
    
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
    
    res.json({ success: true, currentAccountType: accountType });
    
  } catch (err) {
    console.error('Error switching account:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update borrower profile
router.put('/accounts/borrower', verifyToken, async (req, res) => {
  try {
    const { uid: firebase_uid } = req;
    const profileData = req.body;
    
    const updateFields = [];
    const values = [];
    let valueIndex = 1;
    
    // Build dynamic update query
    const allowedFields = [
      'full_name', 'occupation', 'business_type', 'location', 'phone_number',
      'date_of_birth', 'national_id', 'passport_no', 'tin', 'street',
      'barangay', 'municipality', 'province', 'country', 'postal_code', 'experience'
    ];
    
    Object.keys(profileData).forEach(key => {
      if (allowedFields.includes(key) && profileData[key] !== undefined) {
        updateFields.push(`${key} = $${valueIndex}`);
        values.push(profileData[key]);
        valueIndex++;
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    // Check if profile is complete
    const requiredFields = ['full_name', 'occupation', 'business_type', 'location'];
    const isComplete = requiredFields.every(field => 
      profileData[field] || updateFields.some(uf => uf.startsWith(field))
    );
    
    if (isComplete) {
      updateFields.push(`is_complete = $${valueIndex}`);
      values.push(true);
      valueIndex++;
    }
    
    // Add updated_at timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Add firebase_uid for WHERE clause
    values.push(firebase_uid);
    
    const query = `
      UPDATE borrower_profiles 
      SET ${updateFields.join(', ')} 
      WHERE firebase_uid = $${valueIndex}
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Borrower profile not found' });
    }
    
    res.json({
      success: true,
      profile: result.rows[0]
    });
    
  } catch (err) {
    console.error('Error updating borrower profile:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update investor profile
router.put('/accounts/investor', verifyToken, async (req, res) => {
  try {
    const { uid: firebase_uid } = req;
    const profileData = req.body;
    
    const updateFields = [];
    const values = [];
    let valueIndex = 1;
    
    // Build dynamic update query
    const allowedFields = [
      'full_name', 'location', 'phone_number', 'date_of_birth',
      'investment_experience', 'investment_preference', 'risk_tolerance', 'portfolio_value'
    ];
    
    Object.keys(profileData).forEach(key => {
      if (allowedFields.includes(key) && profileData[key] !== undefined) {
        updateFields.push(`${key} = $${valueIndex}`);
        values.push(profileData[key]);
        valueIndex++;
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    // Check if profile is complete
    const requiredFields = ['full_name', 'location', 'investment_experience'];
    const isComplete = requiredFields.every(field => 
      profileData[field] || updateFields.some(uf => uf.startsWith(field))
    );
    
    if (isComplete) {
      updateFields.push(`is_complete = $${valueIndex}`);
      values.push(true);
      valueIndex++;
    }
    
    // Add updated_at timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Add firebase_uid for WHERE clause
    values.push(firebase_uid);
    
    const query = `
      UPDATE investor_profiles 
      SET ${updateFields.join(', ')} 
      WHERE firebase_uid = $${valueIndex}
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Investor profile not found' });
    }
    
    res.json({
      success: true,
      profile: result.rows[0]
    });
    
  } catch (err) {
    console.error('Error updating investor profile:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
