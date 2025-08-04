# Deployment Guide

## Quick Deploy Options (Free)

### Option 1: Vercel (Frontend) + Render (Backend) [RECOMMENDED]

#### Step 1: Deploy Backend to Render
1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Auto Deploy**: Yes
5. Add Environment Variables (from your .env file):
   - `DATABASE_URL`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY` (paste the entire key with quotes)
   - `FIREBASE_CLIENT_EMAIL`
   - `NODE_ENV=production`
   - All other Firebase variables
6. Deploy!

#### Step 2: Deploy Frontend to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up
2. Import your GitHub repository
3. Configure:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variables:
   - `VITE_API_URL=https://your-render-backend-url.onrender.com`
5. Deploy!

### Option 2: Railway (Full Stack)
1. Go to [railway.app](https://railway.app)
2. "Deploy from GitHub repo"
3. Add all environment variables
4. Railway will auto-detect and deploy both frontend and backend

### Option 3: Heroku (Full Stack)
1. Create account at [heroku.com](https://heroku.com)
2. Install Heroku CLI
3. Run:
   ```bash
   heroku create your-app-name
   heroku config:set DATABASE_URL=your_supabase_url
   heroku config:set NODE_ENV=production
   # Add all other environment variables
   git push heroku main
   ```

## Environment Variables You Need

### Database
- `DATABASE_URL`: Your Supabase database URL

### Firebase
Get these from your Firebase service account JSON:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`
- (and other Firebase config values)

### App Config
- `NODE_ENV=production`
- `PORT=4000` (or whatever your host provides)
- `FRONTEND_URL`: Your deployed frontend URL

## Pre-Deployment Checklist

1. ✅ Push all code to GitHub
2. ✅ Ensure `.env` is in `.gitignore`
3. ✅ Test locally with `npm run build && npm start`
4. ✅ Have your Supabase URL ready
5. ✅ Have your Firebase service account ready
6. ✅ Choose a hosting platform

## Testing Your Deployment

After deployment:
1. Visit your app URL
2. Test user registration
3. Test project creation
4. Test top-up system
5. Test admin features

## Troubleshooting

- **Build fails**: Check package.json scripts
- **API not working**: Verify environment variables
- **CORS errors**: Update CORS origins in server.js
- **Database errors**: Check Supabase connection string
- **Firebase errors**: Verify service account configuration

## Free Tier Limits

### Vercel
- 100GB bandwidth/month
- 6,000 build minutes/month
- Commercial use allowed

### Render
- 750 hours/month (enough for 24/7)
- Spins down after 15 min inactivity
- Takes ~30 seconds to wake up

### Railway
- $5/month after free trial
- Always-on service
- Very reliable

Choose based on your needs!
