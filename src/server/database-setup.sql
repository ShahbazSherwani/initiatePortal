-- Database setup for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension (useful for future features)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'borrower',
    is_admin BOOLEAN DEFAULT FALSE,
    has_completed_registration BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) NOT NULL,
    project_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE
);

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE
);

-- Borrow requests table
CREATE TABLE IF NOT EXISTS borrow_requests (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) NOT NULL,
    national_id VARCHAR(50),
    passport_no VARCHAR(50),
    tin VARCHAR(50),
    street VARCHAR(255),
    barangay VARCHAR(255),
    municipality VARCHAR(255),
    province VARCHAR(255),
    country VARCHAR(255),
    postal_code VARCHAR(10),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_projects_firebase_uid ON projects(firebase_uid);
-- Fixed: Use btree indexes for JSONB text extraction instead of GIN
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects((project_data->>'status'));
CREATE INDEX IF NOT EXISTS idx_projects_approval ON projects((project_data->>'approvalStatus'));
-- GIN index for full JSONB searching (optional but useful)
CREATE INDEX IF NOT EXISTS idx_projects_data_gin ON projects USING GIN(project_data);
CREATE INDEX IF NOT EXISTS idx_wallets_firebase_uid ON wallets(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_firebase_uid ON borrow_requests(firebase_uid);

-- Disable Row Level Security for server-side access
-- Your Node.js server will handle authentication via Firebase tokens
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_requests DISABLE ROW LEVEL SECURITY;

-- If you want to enable RLS later for direct client access, you can create policies
-- For now, your server handles all authentication and authorization

-- Insert a sample admin user (replace 'your-firebase-uid-here' with your actual Firebase UID)
-- You can get your Firebase UID from the browser console after logging in
-- console.log(firebase.auth().currentUser.uid)

INSERT INTO users (firebase_uid, full_name, role, is_admin) 
VALUES ('your-firebase-uid-here', 'Admin User', 'borrower', TRUE)
ON CONFLICT (firebase_uid) DO UPDATE SET 
    is_admin = TRUE,
    updated_at = CURRENT_TIMESTAMP;

-- Create a function to automatically set updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to auto-update the updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_borrow_requests_updated_at BEFORE UPDATE ON borrow_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
