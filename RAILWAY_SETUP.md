# Deploy CareGiver to Railway - Step by Step

## What is Railway?

Railway is a cloud platform that makes deploying apps super easy. It provides:
- **Free PostgreSQL database** (500MB storage, 5GB bandwidth)
- **Automatic deployments** from GitHub
- **Free tier** for hobby projects ($5 credit/month)
- **HTTPS** automatically configured
- **No credit card required** to start

## Step-by-Step Deployment

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Sign up with **GitHub** (easiest option)
4. Authorize Railway to access your repositories

### Step 2: Deploy Backend

#### Option A: Using Railway Dashboard (Easiest)

1. **Create New Project:**
   - Click **"New Project"**
   - Select **"Deploy from GitHub repo"**
   - Choose your `CareGiver` repository
   - Click **"Deploy Now"**

2. **Add PostgreSQL Database:**
   - In your project, click **"New"**
   - Select **"Database"**
   - Choose **"Add PostgreSQL"**
   - Railway automatically creates the database and sets `DATABASE_URL`

3. **Configure Backend Service:**
   - Click on your service (should auto-detect as Python)
   - Go to **"Settings"**
   - Set **Root Directory**: `/backend`
   - Set **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Click **"Deploy"**

4. **Generate Domain:**
   - Go to **"Settings"** → **"Networking"**
   - Click **"Generate Domain"**
   - Copy your URL (e.g., `https://caregiver-production.up.railway.app`)

#### Option B: Using Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Navigate to backend
cd backend

# Initialize and link project
railway init

# Add PostgreSQL
railway add --plugin postgresql

# Deploy
railway up

# Generate domain
railway domain
```

### Step 3: Update Frontend

1. **Create `.env` file in your React app:**
```bash
cd /home/qenlab-1/robin/CareGiver
touch .env
```

2. **Add your Railway backend URL:**
```env
REACT_APP_API_URL=https://your-backend.up.railway.app
```

3. **Update API service** (already configured in `src/services/api.js`)

### Step 4: Deploy Frontend

#### Option A: Vercel (Recommended for React)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd /home/qenlab-1/robin/CareGiver
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name? caregiver
# - Directory? ./
# - Override settings? No

# Set environment variable
vercel env add REACT_APP_API_URL production
# Paste your Railway backend URL

# Deploy to production
vercel --prod
```

#### Option B: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod

# Set environment variable in Netlify dashboard:
# Site settings → Environment variables
# Add: REACT_APP_API_URL = your-railway-url
```

### Step 5: Configure CORS

Update `backend/main.py` with your frontend URL:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend.vercel.app",
        "http://localhost:3000"  # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Commit and push - Railway will auto-deploy!

### Step 6: Test Everything

1. **Test Backend:**
```bash
curl https://your-backend.up.railway.app/health
```

2. **Test Frontend:**
   - Visit your Vercel URL
   - Try logging in
   - Add a medication in Manage Plan
   - Create a check-in
   - Verify it appears in Timeline

## Railway Dashboard Overview

### Monitoring
- **Deployments**: View build logs and deployment history
- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time application logs

### Database Management
- **Data**: View tables and data (limited in free tier)
- **Backups**: Automatic backups (upgrade for more)
- **Metrics**: Database performance

### Environment Variables
Railway automatically provides:
- `DATABASE_URL` - PostgreSQL connection
- `PORT` - Server port
- `RAILWAY_ENVIRONMENT` - Environment name

## Costs & Limits

### Free Tier
- **$5 credit/month** (enough for small projects)
- **500MB database storage**
- **5GB bandwidth**
- **500 hours execution time**

### When You Need More
- **Hobby Plan**: $5/month
- **Pro Plan**: $20/month
- Pay only for what you use

## Common Issues & Solutions

### Issue: Build Failed
**Solution:**
- Check `backend/requirements.txt` is correct
- Verify Python version in `runtime.txt`
- Check Railway logs for errors

### Issue: Database Connection Error
**Solution:**
- Verify PostgreSQL is added to project
- Check `DATABASE_URL` is set automatically
- Restart the service

### Issue: CORS Error
**Solution:**
- Update `allow_origins` in `main.py`
- Add your frontend URL
- Redeploy backend

### Issue: 404 Not Found
**Solution:**
- Check Root Directory is set to `/backend`
- Verify Start Command is correct
- Check deployment logs

## Local Testing Before Deploy

```bash
# Test backend locally
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set up local PostgreSQL
createdb caregiver
echo "DATABASE_URL=postgresql://localhost/caregiver" > .env

# Run server
uvicorn main:app --reload

# Test in browser
open http://localhost:8000/docs
```

## Useful Railway Commands

```bash
# View logs
railway logs

# Check environment variables
railway variables

# Restart service
railway restart

# Open dashboard
railway open

# Link to existing project
railway link

# Run command in Railway environment
railway run python manage.py migrate
```

## Next Steps After Deployment

1. **Custom Domain** (Optional)
   - Go to Settings → Networking
   - Add custom domain
   - Update DNS records

2. **Enable Backups**
   - Upgrade to Hobby plan
   - Enable automatic backups
   - Set backup schedule

3. **Monitoring**
   - Set up Sentry for error tracking
   - Add logging
   - Configure alerts

4. **Security**
   - Add authentication middleware
   - Implement rate limiting
   - Use environment variables for secrets

## Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **Railway Status**: [status.railway.app](https://status.railway.app)

## Congratulations! 🎉

Your CareGiver app is now live on the internet!

- **Backend**: https://your-backend.up.railway.app
- **Frontend**: https://your-frontend.vercel.app
- **API Docs**: https://your-backend.up.railway.app/docs
