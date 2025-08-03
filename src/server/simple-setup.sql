-- Simplified Supabase Database Setup
-- Copy and paste this entire script into Supabase SQL Editor

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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create simple indexes
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_projects_firebase_uid ON projects(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_wallets_firebase_uid ON wallets(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_firebase_uid ON borrow_requests(firebase_uid);

-- Simple JSONB indexes for project queries
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects((project_data->>'status'));
CREATE INDEX IF NOT EXISTS idx_projects_approval ON projects((project_data->>'approvalStatus'));

-- Disable RLS (your server handles authentication)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_requests DISABLE ROW LEVEL SECURITY;
