# 🚀 Healthcare Symptom Checker Deployment Guide

## Prerequisites
- GitHub account connected to Render and Vercel
- Repository: https://github.com/sahithkasam/healthcare-symptom-checker-react

## Step 1: Deploy Backend to Render

### 1. Go to Render
- Visit: https://render.com
- Sign up/Login with GitHub

### 2. Create New Web Service
- Click "New +" → "Web Service"
- Connect Repository: `sahithkasam/healthcare-symptom-checker-react`

### 3. Configure Backend Service
```
Name: healthcare-symptom-checker-api
Environment: Node
Branch: main
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

### 4. Add Environment Variables
```
NODE_ENV=production
PORT=10000
```

### 5. Deploy
- Click "Create Web Service"
- Wait for deployment (5-10 minutes)
- Note your URL: `https://healthcare-symptom-checker-api-xyz.onrender.com`

## Step 2: Deploy Frontend to Vercel

### 1. Go to Vercel
- Visit: https://vercel.com
- Sign up/Login with GitHub

### 2. Import Project
- Click "Add New" → "Project"
- Import: `sahithkasam/healthcare-symptom-checker-react`

### 3. Configure Frontend
```
Framework Preset: Create React App
Root Directory: frontend
Build Command: npm run build
Output Directory: build
```

### 4. Add Environment Variables
```
REACT_APP_API_URL=https://your-render-url.onrender.com/api
```
*Replace with your actual Render URL from Step 1*

### 5. Deploy
- Click "Deploy"
- Wait for deployment (3-5 minutes)
- Your app will be live at: `https://your-app.vercel.app`

## Step 3: Update CORS (After Deployment)

1. Get your Vercel URL (e.g., `https://healthcare-app-abc123.vercel.app`)
2. Update `backend/server.js` CORS configuration:
   - Replace `'https://your-app.vercel.app'` with your actual Vercel URL
3. Commit and push changes
4. Render will auto-redeploy

## 🎯 Final Result

✅ **Backend API**: https://your-app.onrender.com
✅ **Frontend App**: https://your-app.vercel.app
✅ **Professional Healthcare App**: Live and accessible globally!

## Testing Your Live App

1. Visit your Vercel URL
2. Test different symptoms:
   - "stomach pain and nausea" → Gastrointestinal analysis
   - "headache and dizziness" → Neurological analysis
   - "cough and chest pain" → Respiratory analysis
3. Verify different results for different symptoms

## Troubleshooting

- **CORS Errors**: Update the CORS origins in backend/server.js
- **API Not Found**: Check REACT_APP_API_URL in Vercel environment variables
- **Build Failures**: Check build logs in Render/Vercel dashboards

Your professional healthcare application will be live! 🏥✨