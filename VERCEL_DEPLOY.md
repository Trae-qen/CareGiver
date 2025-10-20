# Deploy to Vercel - Step by Step Guide

## Prerequisites

1. ✅ Backend running on Railway
2. ✅ Railway backend URL (get it from Railway dashboard)
3. ✅ Vercel account (sign up at https://vercel.com if you don't have one)

## Step 1: Login to Vercel

```bash
cd /home/qenlab-1/robin/CareGiver
vercel login
```

**What happens:**
- Opens browser for authentication
- Choose your login method (GitHub, GitLab, Bitbucket, or Email)
- Follow the prompts
- You'll see "Success! Authentication complete"

## Step 2: Deploy to Vercel (Preview)

```bash
vercel
```

**You'll be asked several questions:**

1. **Set up and deploy?** → Press `Y` (Yes)
2. **Which scope?** → Select your account (use arrow keys, press Enter)
3. **Link to existing project?** → Press `N` (No, create new)
4. **What's your project's name?** → Press Enter (use default: `CareGiver`)
5. **In which directory is your code located?** → Press Enter (use `.`)
6. **Want to override settings?** → Press `N` (No)

**Vercel will now:**
- Install dependencies
- Build your React app
- Deploy to a preview URL

**You'll get a URL like:** `https://care-giver-abc123.vercel.app`

## Step 3: Add Environment Variable

You need to tell your frontend where the backend is.

### Option A: Via Command Line

```bash
# Add production environment variable
vercel env add REACT_APP_API_URL production

# When prompted, paste your Railway backend URL
# Example: https://caregiver-production.up.railway.app
```

### Option B: Via Vercel Dashboard (Easier)

1. Go to https://vercel.com/dashboard
2. Click on your `CareGiver` project
3. Click **Settings** tab
4. Click **Environment Variables** in sidebar
5. Add new variable:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: Your Railway URL (e.g., `https://caregiver-production.up.railway.app`)
   - **Environment**: Check `Production`, `Preview`, and `Development`
6. Click **Save**

## Step 4: Deploy to Production

```bash
vercel --prod
```

**This will:**
- Build with production settings
- Include your environment variables
- Deploy to your production URL

**You'll get your production URL:** `https://care-giver.vercel.app`

## Step 5: Test Your Deployment

1. Open your Vercel URL in browser
2. Try to login with any email
3. Check browser console (F12) for errors
4. Verify API calls are going to Railway backend

### Common Issues & Fixes

**Issue 1: "Failed to fetch" errors**
- **Cause**: CORS not configured on backend
- **Fix**: Update `backend/main.py` CORS settings:
  ```python
  allow_origins=[
      "http://localhost:3000",
      "https://care-giver.vercel.app",  # Your Vercel URL
      "https://*.vercel.app"  # All Vercel preview deployments
  ]
  ```
- Restart backend or redeploy to Railway

**Issue 2: "404 Not Found" on refresh**
- **Cause**: React Router needs SPA configuration
- **Fix**: Already handled by `vercel.json` (created for you)

**Issue 3: Environment variable not working**
- **Cause**: Need to rebuild after adding env vars
- **Fix**: Run `vercel --prod` again

## Step 6: Update Backend CORS

Your backend needs to allow requests from Vercel:

1. Open `backend/main.py`
2. Find the CORS middleware section (around line 147)
3. Update to include your Vercel URL:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "https://care-giver.vercel.app",  # Your production URL
        "https://*.vercel.app",  # Preview deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

4. If using Railway CLI: `railway up`
5. Or push to GitHub (Railway auto-deploys)

## Step 7: Verify Everything Works

### Test Checklist:

- [ ] Open Vercel URL
- [ ] Login with email
- [ ] See patient selection screen
- [ ] Select or create patient
- [ ] Add medication in "More" → "Manage Plan"
- [ ] Check off medication in "Today"
- [ ] View check-in in "Timeline"
- [ ] Refresh page - data persists
- [ ] Check browser console - no errors

## 🎉 You're Live!

Your app is now deployed:
- **Frontend**: `https://care-giver.vercel.app`
- **Backend**: `https://your-backend.railway.app`
- **API Docs**: `https://your-backend.railway.app/docs`

## Automatic Deployments

### If you push to GitHub:

1. Connect your GitHub repo to Vercel:
   - Go to Vercel Dashboard
   - Click your project
   - Go to Settings → Git
   - Connect repository

2. Every push to `main` branch auto-deploys!

## Useful Commands

```bash
# Deploy preview (test changes)
vercel

# Deploy to production
vercel --prod

# View deployment logs
vercel logs

# List all deployments
vercel ls

# Open project in browser
vercel open

# Remove deployment
vercel rm [deployment-url]
```

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project
2. Click **Settings** → **Domains**
3. Add your custom domain
4. Follow DNS configuration instructions
5. Wait for SSL certificate (automatic)

## Monitoring

View your app's performance:
- Vercel Dashboard → Your Project → **Analytics**
- See page views, load times, errors

## Troubleshooting

### Check Deployment Logs
```bash
vercel logs
```

### Check Build Logs
Go to Vercel Dashboard → Your Project → **Deployments** → Click latest → View logs

### Test API Connection
```bash
# From your deployed frontend, open console and run:
fetch('https://your-railway-url.railway.app/health')
  .then(r => r.json())
  .then(console.log)
```

### Redeploy
```bash
vercel --prod --force
```

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Check `TESTING_GUIDE.md` for backend testing

---

**Estimated time: 10-15 minutes** ⏱️

Your CareGiver app is now live and accessible from anywhere! 🚀
