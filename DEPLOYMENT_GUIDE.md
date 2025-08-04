# Step-by-Step Deployment Guide: Vercel + Render

## Prerequisites
- GitHub account
- Vercel account (free)
- Render account (free)
- Supabase account (for PostgreSQL database)

## Phase 1: Database Setup (Supabase)

### 1.1 Create Supabase Project
1. Go to https://supabase.com
2. Sign up/Login with GitHub
3. Create a new project
4. Note down your:
   - Database URL
   - Service Role Key
   - Anon Public Key

### 1.2 Run Database Setup
1. In Supabase SQL Editor, run your `database-setup.sql` file
2. Make sure all tables are created properly

## Phase 2: Backend Deployment (Render)

### 2.1 Prepare Backend for Render
1. Create a separate backend repository OR use monorepo approach
2. Your backend files should be in `/src/server/`

### 2.2 Deploy to Render
1. Go to https://render.com
2. Connect your GitHub account
3. Click "New +" → "Web Service"
4. Select your repository
5. Configure:
   - **Name**: initiate-portal-api
   - **Region**: Oregon (US West)
   - **Branch**: Admin-Control
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server/server.js`
   - **Auto-Deploy**: Yes

### 2.3 Set Environment Variables on Render
Add these environment variables in Render dashboard:
- `DATABASE_URL`: Your Supabase connection string
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_PRIVATE_KEY`: Your Firebase private key
- `FIREBASE_CLIENT_EMAIL`: Your Firebase client email
- `NODE_ENV`: production
- `PORT`: 4000

## Phase 3: Frontend Deployment (Vercel)

### 3.1 Update API URLs
Update your environment configuration for production URLs.

### 3.2 Deploy to Vercel
1. Go to https://vercel.com
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: ./
   - **Build Command**: npm run build
   - **Output Directory**: dist
   - **Install Command**: npm install

### 3.3 Set Environment Variables on Vercel
- `VITE_API_URL`: https://your-backend-app.onrender.com/api

## Phase 4: Final Configuration

### 4.1 Update CORS Settings
Make sure your backend allows your Vercel domain.

### 4.2 Update Firebase Settings
Add your production domains to Firebase authorized domains.

### 4.3 Test Everything
1. Test user registration
2. Test authentication
3. Test API endpoints
4. Test file uploads
5. Test database connections

## Important Notes
- Render free tier has cold starts (apps sleep after 15 minutes of inactivity)
- Vercel free tier has 100GB bandwidth/month
- Keep sensitive keys in environment variables, never in code
- Use HTTPS for all production URLs

## Troubleshooting
- Check Render logs for backend errors
- Check Vercel function logs for frontend issues
- Verify environment variables are set correctly
- Ensure database connection strings are correct
