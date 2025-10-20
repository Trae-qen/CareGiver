# CareGiver Backend API

FastAPI backend with PostgreSQL for the CareGiver application.

## Local Development

### Prerequisites
- Python 3.11+
- PostgreSQL

### Setup

1. **Create virtual environment:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set up PostgreSQL:**
```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb caregiver

# Or using psql
psql postgres
CREATE DATABASE caregiver;
\q
```

4. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. **Run the server:**
```bash
uvicorn main:app --reload
```

API will be available at: http://localhost:8000
API docs at: http://localhost:8000/docs

## Deploy to Railway

### Option 1: Using Railway CLI (Recommended)

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Login to Railway:**
```bash
railway login
```

3. **Initialize project:**
```bash
cd backend
railway init
```

4. **Add PostgreSQL:**
```bash
railway add --plugin postgresql
```

5. **Deploy:**
```bash
railway up
```

6. **Get your URL:**
```bash
railway domain
```

### Option 2: Using Railway Dashboard

1. **Go to [railway.app](https://railway.app)**

2. **Sign up/Login** with GitHub

3. **Create New Project** → "Deploy from GitHub repo"

4. **Select your repository**

5. **Add PostgreSQL:**
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway automatically sets DATABASE_URL

6. **Configure Service:**
   - Root Directory: `/backend`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

7. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete

8. **Get your URL:**
   - Go to Settings → Generate Domain
   - Copy the URL (e.g., `https://your-app.railway.app`)

### Environment Variables

Railway automatically provides:
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Port to run the server

No additional configuration needed!

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email
- `GET /api/auth/verify` - Verify user exists

### Users
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID

### Check-ins
- `POST /api/checkins` - Create check-in
- `GET /api/checkins` - Get all check-ins (with filters)
- `GET /api/checkins/{id}` - Get check-in by ID
- `DELETE /api/checkins/{id}` - Delete check-in

### Medications
- `POST /api/medications` - Add medication
- `GET /api/medications` - Get all medications
- `PUT /api/medications/{id}` - Update medication
- `DELETE /api/medications/{id}` - Delete medication

### Patient Info
- `GET /api/patient` - Get patient information
- `PUT /api/patient` - Update patient information

## Testing the API

### Using curl:
```bash
# Health check
curl http://localhost:8000/health

# Login
curl -X POST "http://localhost:8000/api/auth/login?email=john.doe@example.com"

# Get medications
curl http://localhost:8000/api/medications

# Create check-in
curl -X POST http://localhost:8000/api/checkins \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "category": "Medications",
    "data": {"name": "Aspirin", "dosage": "100mg", "time": "8:00 AM"}
  }'
```

### Using the interactive docs:
Visit http://localhost:8000/docs for Swagger UI

## Database Schema

### Users Table
- `id` - Primary key
- `email` - Unique email address
- `name` - User's full name
- `role` - User role (aide, admin, family)
- `created_at` - Account creation timestamp
- `last_login` - Last login timestamp

### CheckIns Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `category` - Check-in category (Medications, Symptoms, etc.)
- `data` - JSON data for the check-in
- `timestamp` - When the check-in occurred
- `created_at` - When the record was created

### Medications Table
- `id` - Primary key
- `name` - Medication name
- `dosage` - Dosage amount
- `frequency` - How often to take
- `time` - Scheduled time
- `active` - Whether medication is active
- `created_at` - When added to system

### PatientInfo Table
- `id` - Primary key
- `name` - Patient's name
- `age` - Patient's age
- `allergies` - Known allergies
- `emergency_contact` - Emergency contact info
- `doctor` - Primary doctor info
- `updated_at` - Last update timestamp

## Troubleshooting

### Database connection issues:
```bash
# Check PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Test connection
psql -d caregiver -U your_username
```

### Railway deployment issues:
```bash
# View logs
railway logs

# Check environment variables
railway variables

# Restart service
railway restart
```

### CORS issues:
Update `allow_origins` in `main.py` with your frontend URL:
```python
allow_origins=["https://your-frontend.vercel.app"]
```

## Production Considerations

1. **Security:**
   - Add authentication middleware
   - Implement JWT tokens
   - Add rate limiting
   - Use HTTPS only

2. **Performance:**
   - Add database indexes
   - Implement caching (Redis)
   - Use connection pooling
   - Add query optimization

3. **Monitoring:**
   - Set up error tracking (Sentry)
   - Add logging
   - Monitor database performance
   - Set up alerts

4. **Backup:**
   - Enable Railway automatic backups
   - Export data regularly
   - Test restore procedures
