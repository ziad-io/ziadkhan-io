# 🚀 Deployment Guide - GPS DMC System

## Problem: Netlify Frontend Can't Connect to Localhost Backend

When you host on Netlify, your frontend is on the internet but your backend is still on your computer (`localhost`). You need to deploy BOTH.

---

## 📋 Step-by-Step Deployment

### Step 1: Deploy Backend (Render.com - FREE)

1. **Push your backend to GitHub:**
   ```bash
   cd d:\AutoDmc\my-backend
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Go to https://render.com and sign up (free)**

3. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Select the `my-backend` folder

4. **Configure Service:**
   - **Name:** `gps-dmc-backend`
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

5. **Add Environment Variables:**
   - `PORT` = `10000`
   - `MONGODB_URI` = `your_mongodb_atlas_connection_string`

6. **Click "Create Web Service"**

7. **Wait for deployment** - You'll get a URL like:
   ```
   https://gps-dmc-backend.onrender.com
   ```

---

### Step 2: Get MongoDB Atlas (Cloud Database - FREE)

1. **Go to https://www.mongodb.com/cloud/atlas**

2. **Create Free Cluster:**
   - Sign up / Log in
   - Create new project
   - Build database (FREE tier)
   - Choose AWS/Google Cloud, region closest to you

3. **Create Database User:**
   - Database Access → Add New Database User
   - Username: `admin`
   - Password: (generate strong password)
   - Save credentials!

4. **Allow IP Access:**
   - Network Access → Add IP Address
   - Click "Allow Access from Anywhere" (0.0.0.0/0)

5. **Get Connection String:**
   - Database → Connect → Drivers → Node.js
   - Copy connection string, replace `<password>` with your password
   - It looks like:
     ```
     mongodb+srv://admin:PASSWORD@cluster0.xxxxx.mongodb.net/gps_dmc_db?retryWrites=true&w=majority
     ```

---

### Step 3: Update Environment Variables

#### A. Update Render Backend Environment:
Add to your Render service:
```
MONGODB_URI=mongodb+srv://admin:PASSWORD@cluster0.xxxxx.mongodb.net/gps_dmc_db?retryWrites=true&w=majority
```

#### B. Update Frontend `.env` file:
```
VITE_API_URL=https://gps-dmc-backend.onrender.com/api
```

---

### Step 4: Deploy Frontend to Netlify

1. **Push frontend to GitHub:**
   ```bash
   cd d:\AutoDmc\GpsDmc
   git init
   git add .
   git commit -m "Frontend ready for deployment"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Go to https://www.netlify.com**

3. **Add New Site:**
   - Sites → Add New Site → Import from GitHub
   - Select your repo

4. **Build Settings:**
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`

5. **Add Environment Variable:**
   - Site settings → Environment variables
   - Add: `VITE_API_URL` = `https://gps-dmc-backend.onrender.com/api`

6. **Deploy Site**

---

## ✅ Quick Checklist

- [ ] Backend pushed to GitHub
- [ ] Backend deployed on Render
- [ ] MongoDB Atlas database created
- [ ] Environment variables set on Render
- [ ] Frontend `.env` updated with backend URL
- [ ] Frontend pushed to GitHub
- [ ] Frontend deployed on Netlify
- [ ] Environment variables set on Netlify
- [ ] Test saving a student record

---

## 🔧 Local vs Production URLs

| Environment | Frontend | Backend |
|-------------|----------|---------|
| Local Dev | http://localhost:5173 | http://localhost:5000 |
| Production | https://your-app.netlify.app | https://gps-dmc-backend.onrender.com |

---

## ⚠️ Important Notes

1. **Never commit `.env` file with real credentials to GitHub**
2. **Render free tier spins down after 15 min inactivity** - first request may take 30 seconds
3. **MongoDB Atlas has IP whitelist** - use 0.0.0.0/0 for Render
4. **Update CORS in backend** if needed (already configured for all origins)

---

## 🆘 Troubleshooting

### "Cannot connect to backend"
- Check if Render service is running (green dot)
- Verify `VITE_API_URL` in Netlify environment variables
- Check browser console for CORS errors

### "Database connection failed"
- Verify MongoDB URI in Render environment variables
- Check if IP whitelist includes 0.0.0.0/0
- Ensure database user password is correct

### "Page not found" on refresh
- Add `_redirects` file to `public` folder with:
  ```
  /* /index.html 200
  ```
