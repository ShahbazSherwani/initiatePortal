// ---------- server.js ----------
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { Pool } from 'pg';
import { readFileSync } from 'fs';



// Read the service account JSON file
const serviceAccount = JSON.parse(
  readFileSync(new URL('./firebase-service-account.json', import.meta.url))
);


// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Initialize Postgres client (Neon)
const db = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,  // Neon uses a self-signed cert
  },
});

// After your app definition and before any routes
const app = express();

// Increase body size limit to 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.use(cors({ origin: true }));
app.use(express.json());

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
      is_admin: rows[0].is_admin || false  // Add this line
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
    let query = `SELECT p.id, p.firebase_uid, p.project_data, p.created_at, u.full_name 
                FROM projects p
                LEFT JOIN users u ON p.firebase_uid = u.firebase_uid`;
    
    const params = [];
    if (status) {
      query += ` WHERE p.project_data->>'status' = $1`;
      params.push(status);
    }
    
    const { rows } = await db.query(query, params);
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

// Get a single project
projectsRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    console.log(`Fetching project with ID: ${id}`);
    
    const { rows } = await db.query(
      `SELECT p.id, p.firebase_uid, p.project_data, p.created_at, u.full_name
       FROM projects p
       JOIN users u ON p.firebase_uid = u.firebase_uid
       WHERE p.id::text = $1`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    res.json(rows[0]);
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
