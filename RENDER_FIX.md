# Step-by-Step Fix for Render Deployment

## The Problem
Render is trying to build the entire project (frontend + backend) which causes the Vite error.

## The Solution
Deploy backend and frontend separately.

## STEP 1: Update Render Configuration

### 1.1 In Render Dashboard:
1. Go to your service settings
2. Update Build Command to: `npm install --only=production`
3. Update Start Command to: `node src/server/server.js`
4. Set Root Directory to: `./` (keep as root)

### 1.2 Environment Variables on Render:
Add these exact environment variables:

```
DATABASE_URL = [Your Supabase connection string]
NODE_ENV = production
PORT = 4000

# Firebase Config (from your firebase-service-account.json):
FIREBASE_PROJECT_ID = initiateph-ef2ad
FIREBASE_PRIVATE_KEY_ID = f8d57d921bda65042d4c08c74d06aaaf04c0358e
FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCT6qvUYmCV7KGg\nxv9PYi2N0Am+6ge7VoOXoSm06T0H9Voqvvn5gMHksywN8kKlVLAEFPi3gVOz/Tir\n+68NO2CHqa+/M+Lay+niGE5TYY3C1sximTCHGD9nSNvnT4/Douxwj5VMfcOZYWZk\n1dt2wPWDdGCW3BvUV0eFgJ6Mhoe2jy2SENZsaUL08sae/F/K3cPH4JMJIFN4fxsR\nUw1NnLZ7W/TtSbchCTk//x4hWGDSW/9qdNnfMKFIMqaVOsCz0VjtH+P2MudMI4+l\n04YDWNGeYDp25oA+kp+IQK+5RKIa4Zw8+7tuEzYBO4W8vcf6Q+61kLcVDgSzoTGl\nhsr6p4jJAgMBAAECggEAG2KftH8QPcGlPPSK0UIuh+pj24ZNryf5zglnBNkH1SDe\nNDrOYhyuCS8I8X4QS7bNrbvKPoNBoXm409KRmsQK/6LxaFdtYS/Ome8BFVvi2JdX\nGMwe2WwqVO9+0yj+R2yzFLXooNRJ8ew//lw/uRFJgzB5L4UJ2/rawYNKF19S4gAB\nFD7obt4UKQ/eIgaMdFz3cReLgFAGtMsJQOCFs6L0Xj3EmYFw4eOd3PNBEGSN30qK\n+3m1sMvcw4CXP8kXWG2PFcDoPNDXm1/ou4YYlQDHFXT1/e07GEFBjOp1UjsQuBGg\nj68lEDjwdSpFFEM5KXRn0/g6FdUvb54DaisHU7X4rwKBgQDC8ND+W4hicYhzXu87\nM9rUFD6GLnkN9J+hru0XbbX/kKvo2bYEy/NDDzozWLFJyOWwXMvhL2cn1LaDGvS+\n+bvLoFy2WPazNE2N2P5NdMM+yqg+GqEI+g+7rR8iYGBCQxuaCnInFpCu/9LNr/tu\nfkKM4r+Bs+H69nEleRVTjnLp3wKBgQDCP0SI4IUpJyPUo8Jxl1RhjyH4GJktYdNB\nz/08X01JCqYyjfgYwlhPvf2Di5HZQMC6d0v3GqkxOQ4tiKJqeHV/Y6eSIkKefSP+\n6+zhexz7i4di3tMp6OzkwnS/39oMNIQCZt5A5k4iviGfPLhyAf2e3/39OXAIf5Sv\n7+xNfqOyVwKBgCl/WA39cC/8mR5uJCEHLdsdoB2yQOS+oUiq0x+8pBSOOHot9jhZ\nLiSlVi9d/weE85gyeNgr3hq1hlCsaVNKGDcFoRbUI1gMl0HN4nyckX+JZn0p8APY\nL4c1GD6aI4OXg4WsGZbGj/Ag10Af6TchO4uALWIv57gjw/xFJUwPM9kjAoGAUUMY\nj86lxo6aPcX4fX7ajSnNAzZ/Nm4bbAfwIAaalXkACFw+M1VyjoGkAhksfd/KAPgR\nbqHXsED3PnNPxwz30sBFBSySBC3EFkxqv/W6LT20+NbRLlJEcHstTmv+k2aQ51RT\nID8pSo3dJ95ZjCRApsgbYRO6y88a9IKYG0fXGcCgYAeTxqzhOg4Bb3zDddorwr9\nU7FcKDCs7uGjqcRNwl4PpR4vo7wAo4GptS09840NDLNdXR5YVsvXKFDv7jmct6uR\ndr5ZpgmMFP4+zqF5VObNIGLpyBScXgHuVCR0KPxUMALgQGClmfhnDecNBn3uahv8\nbj26i/F8FbYSA5+kizdSJw==\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL = firebase-adminsdk-fbsvc@initiateph-ef2ad.iam.gserviceaccount.com
FIREBASE_CLIENT_ID = 112454103746108648316
```

## STEP 2: Deploy Frontend to Vercel
1. Go to Vercel.com
2. Import your GitHub repository
3. Set environment variable: `VITE_API_URL = https://your-render-url.onrender.com/api`
4. Deploy

## STEP 3: Test
Your backend should now deploy successfully on Render without the Vite error.
