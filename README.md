# CareGiver App

A full-stack application for caregiver management and scheduling, featuring a React frontend and FastAPI backend with PostgreSQL.

## Quick Start

### Prerequisites
- Node.js (v16 or later recommended)
- npm (comes with Node.js) or Yarn
- Python 3.8+
- PostgreSQL
- Redis (for background tasks)
- Git

## Local Development

### Frontend Setup

1. **Clone the repository**
   ```bash
   git clone [your-repository-url]
   cd CareGiver
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the frontend development server**
   ```bash
   npm start
   # or
   yarn start
   ```
   This will start the frontend in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### Backend Setup

1. **Navigate to the backend directory**
   ```bash
   cd backend
   ```

2. **Create and activate a Python virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   Copy the example environment file and update it with your configuration:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your database and other settings.

5. **Start the backend server**
   ```bash
   # In development mode with auto-reload
   uvicorn main:app --reload --port 8000
   ```
   The API will be available at `http://localhost:8000` and the API docs at `http://localhost:8000/docs`

6. **Start Celery worker for background tasks**
   ```bash
   celery -A celery_utils.celery_app worker --loglevel=info
   ```

## Building for Production

### Frontend
1. **Create a production build**
   ```bash
   npm run build
   # or
   yarn build
   ```
   This creates a `build` directory with optimized production files.

### Backend
1. **Install production dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt --no-cache-dir
   ```

2. **Set production environment variables**
   Make sure to set appropriate production values in your `.env` file, including:
   - `DATABASE_URL`
   - `FRONTEND_URL`
   - `REDIS_URL` (for Celery)

3. **Run database migrations**
   ```bash
   # If using Alembic for migrations
   alembic upgrade head
   ```

## Deployment

### Railway (Recommended for Full-Stack)

Railway can deploy both your frontend and backend services together.

1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Link your project**
   ```bash
   railway init
   ```

4. **Deploy Backend**
   ```bash
   cd backend
   railway up
   ```
   - Set up the required environment variables in the Railway dashboard
   - Add a PostgreSQL database if not already added
   - Add Redis for Celery if using background tasks

5. **Deploy Frontend**
   ```bash
   cd ..
   railway up
   ```
   - Set the `REACT_APP_API_URL` to your deployed backend URL

### Vercel (Frontend Only)

1. **Install Vercel CLI** (if not installed)
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```
   Follow the prompts to link your project or create a new one.
   
   Set the following environment variables in Vercel:
   - `REACT_APP_API_URL`: Your deployed backend URL

3. **For subsequent deployments**
   ```bash
   vercel --prod
   ```

### Railway (Alternative to Vercel)

1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Link your project**
   ```bash
   railway init
   ```

4. **Deploy**
   ```bash
   railway up
   ```

## Environment Variables

### Frontend (`.env` in root)
```
REACT_APP_API_URL=http://localhost:8000  # or your production backend URL
```

### Backend (`.env` in `/backend`)
```
# Database
DATABASE_URL=postgresql://user:password@localhost/dbname

# Server
PORT=8000

# CORS (Frontend URL)
FRONTEND_URL=http://localhost:3000

# Redis for Celery (if using background tasks)
REDIS_URL=redis://localhost:6379/0

# JWT Secret (generate a secure secret)
JWT_SECRET=your_jwt_secret_here
```

##  Project Structure

```
CareGiver/
├── src/                  # Frontend source code
│   ├── components/       # React components
│   ├── App.jsx          # Main App component
│   └── ...
├── backend/             # Backend source code
│   ├── main.py         # FastAPI application
│   ├── requirements.txt # Python dependencies
│   ├── .env            # Backend environment variables
│   ├── celery_utils.py # Celery configuration
│   └── ...
├── .env                # Frontend environment variables
└── README.md           # This file
```

## Dependencies

### Frontend
- React 18
- date-fns (for date manipulation)
- Recharts (for data visualization)

### Backend
- FastAPI
- SQLAlchemy (ORM)
- PostgreSQL
- Celery (background tasks)
- Redis (message broker for Celery)
- Uvicorn (ASGI server)

##  Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

##  License

This project is licensed under the [Your License] - see the LICENSE.md file for details.

---

 **Note for Handover:**
- The application consists of a React frontend and FastAPI backend
- The backend requires a PostgreSQL database and Redis for background tasks
- Environment variables must be set up for both frontend and backend
- Deployment can be done together on Railway or separately (Vercel for frontend, Railway for backend)
- The frontend communicates with the backend via the `REACT_APP_API_URL` environment variable
- Make sure to secure all sensitive information (JWT_SECRET, DATABASE_URL) in production
