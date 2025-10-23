-- Add indexes to improve projects query performance
-- This will speed up the /api/owner/projects endpoint significantly

-- Index on projects.created_at for ORDER BY clause
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Index on projects.firebase_uid for JOIN with users table
CREATE INDEX IF NOT EXISTS idx_projects_firebase_uid ON projects(firebase_uid);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_projects_uid_created ON projects(firebase_uid, created_at DESC);

-- GIN index for JSONB queries (if you query project_data frequently)
CREATE INDEX IF NOT EXISTS idx_projects_project_data_gin ON projects USING GIN (project_data);

-- Specific indexes for commonly accessed JSONB fields
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects ((project_data->>'status'));
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects ((project_data->>'type'));
CREATE INDEX IF NOT EXISTS idx_projects_approval_status ON projects ((project_data->>'approvalStatus'));

-- Index on users.firebase_uid for JOIN optimization
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

-- Analyze the tables to update statistics for query planner
ANALYZE projects;
ANALYZE users;

-- Display index information
SELECT 
    tablename, 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'projects' 
ORDER BY indexname;
