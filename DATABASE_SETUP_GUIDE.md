# Database Setup and KYC Testing Guide

## Current Status
✅ **API Fixed**: Backend now running on port 4000, frontend correctly connecting
✅ **Routes Fixed**: Settings and profile routes properly implemented
✅ **Error Handling**: API gracefully handles database connection issues
⚠️ **Database**: PostgreSQL not running locally (this is normal for development)

## Quick Solutions

### Option 1: Test Without Database (Recommended for Testing)
The application now works without a database connection:
- Authentication works via Firebase
- Profile API returns default values
- Settings API returns empty form that you can fill out
- Password change functionality works via Firebase Admin SDK

### Option 2: Set Up Local PostgreSQL (For Full Functionality)
1. **Install PostgreSQL**:
   ```powershell
   # Download and install PostgreSQL from https://www.postgresql.org/download/windows/
   # Or use chocolatey:
   choco install postgresql
   ```

2. **Create Database**:
   ```sql
   CREATE DATABASE initiateportal;
   CREATE USER initiateuser WITH PASSWORD 'password123';
   GRANT ALL PRIVILEGES ON DATABASE initiateportal TO initiateuser;
   ```

3. **Update .env file**:
   ```env
   DATABASE_URL=postgresql://initiateuser:password123@localhost:5432/initiateportal
   ```

4. **Run Migration**:
   ```powershell
   cd backend
   node ../migrations/migrate.js
   ```

### Option 3: Use Supabase (Cloud Database)
1. Go to https://supabase.com
2. Create a new project
3. Get your connection string from Settings > Database
4. Update `.env` file with your Supabase URL

## Testing KYC Functionality

### 1. Register/Login
- Go to http://localhost:5173/
- Create a new account or login with existing credentials

### 2. Test Settings Page
- Navigate to Settings (via sidebar after login)
- The page should load without errors now
- Fill out KYC fields and try saving

### 3. Test Registration Flow
- Register as a new borrower or investor
- Fill out the comprehensive KYC form
- Data should be saved (with database) or handled gracefully (without database)

### 4. Test Password Functionality
- **Change Password**: In Settings, use the password change form
- **Forgot Password**: On login page, click "Forgot Password?" link

## Error Solutions

### If you see "Database error":
- This is expected without PostgreSQL running
- The app will still work for authentication and form filling
- To save data permanently, set up a database (Option 2 or 3)

### If you see CORS errors:
- Make sure backend is running on port 4000
- Check that frontend is calling localhost:4000 APIs

### If KYC fields don't save:
- Without database: Fields will reset on page refresh (expected)
- With database: Check database connection and migration

## Development Commands

```powershell
# Start Frontend (Port 5173)
npm run dev

# Start Backend (Port 4000)
cd backend
node server.js

# Check API endpoints
curl http://localhost:4000/api/profile
curl http://localhost:4000/api/settings
```

## Next Steps
1. ✅ API connectivity issues resolved
2. ✅ KYC form integration working
3. ✅ Password functionality implemented
4. 🔄 Choose database option for data persistence
5. 🔄 Test complete registration-to-settings flow
