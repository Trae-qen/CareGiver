# CareGiver App

A React-based health tracking application for managing medications, symptoms, measurements, and daily check-ins.

## Features

- **Authentication**: Email-based login system for aides and caregivers - tracks who performs each action
- **Today View**: Daily reminders and check-ins with calendar navigation - displays all check-ins for the current day with user attribution
- **Check-In**: Track medications, symptoms, measurements, mood, tasks, and other health factors with custom forms for each category
- **Timeline**: View all historical health data organized by date with a beautiful timeline interface - shows who performed each action
- **Insights**: Visualize health trends and patterns (coming soon)
- **More**: User profile, settings, and logout functionality
- **Tasks Category**: Special category for aides to log completed chores (dishes, laundry, etc.)
- **User Attribution**: Every check-in shows who performed it (e.g., "By John Doe")

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Python 3.11+ (for backend)
- PostgreSQL (for backend)

### Frontend Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

4. **Login**: Enter any email address to login in demo mode (e.g., `john.doe@example.com`).

### Backend Installation

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up PostgreSQL database:
```bash
createdb caregiver
```

5. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

6. Run the backend server:
```bash
uvicorn main:app --reload
```

7. API available at [http://localhost:8000](http://localhost:8000)
   - API docs at [http://localhost:8000/docs](http://localhost:8000/docs)

### Deploy to Railway (Recommended)

See [RAILWAY_SETUP.md](RAILWAY_SETUP.md) for detailed deployment instructions.

**Quick Deploy:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
cd backend
railway login
railway init
railway add --plugin postgresql
railway up
```

## Project Structure

```
caregiver-app/
├── backend/
│   ├── main.py                  # FastAPI application
│   ├── requirements.txt         # Python dependencies
│   ├── Procfile                 # Railway deployment config
│   ├── runtime.txt              # Python version
│   ├── .env.example             # Environment variables template
│   └── README.md                # Backend documentation
├── public/
│   ├── index.html
│   ├── manifest.json            # PWA manifest
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── AppIcon.jsx          # Icon component with all SVG icons
│   │   │   ├── EmptyState.jsx       # Empty state UI component
│   │   │   ├── AddItemModal.jsx     # Modal for adding check-ins
│   │   │   └── TopBar.jsx           # Top status bar
│   │   └── views/
│   │       ├── LoginView.jsx        # Authentication screen
│   │       ├── TodayView.jsx        # Today's reminders and check-ins
│   │       ├── CheckInView.jsx      # Add new check-ins
│   │       ├── TimelineView.jsx     # Historical timeline view
│   │       ├── InsightsView.jsx     # Charts and insights
│   │       └── MoreView.jsx         # User profile and settings
│   ├── context/
│   │   ├── AuthContext.jsx          # Authentication state management
│   │   └── CheckInContext.jsx       # Global state for check-ins
│   ├── data/
│   │   └── mockData.js              # Mock data for development
│   ├── services/
│   │   └── api.js                   # FastAPI integration (ready to use)
│   ├── utils/
│   │   ├── iconColors.js            # Color configurations
│   │   └── checkInHelpers.js        # Helper functions
│   ├── App.jsx
│   ├── App.css
│   └── index.js
├── .env.example                     # Environment variables template
├── package.json
└── README.md
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (one-way operation)

## Technologies Used

- React 18
- Tailwind CSS (via inline classes)
- Heroicons (SVG icons)

## State Management

The app uses React Context API for global state management:

### AuthContext
Manages user authentication and session:
- `user` - Current logged-in user object (id, name, email, role)
- `isAuthenticated` - Boolean indicating if user is logged in
- `login(email)` - Login with email (verifies against database in production)
- `logout()` - Logout and clear session

User data is stored in localStorage and persists across page refreshes.

### CheckInContext
Manages health check-ins:
- `checkIns` - Array of all check-ins with user attribution
- `addCheckIn(category, data, user)` - Add a new check-in (includes who performed it)
- `getCheckInsByDate(date)` - Get check-ins for a specific date
- `getCheckInsByCategory(category)` - Get check-ins by category
- `deleteCheckIn(id)` - Delete a check-in

Currently, check-in data is stored in browser memory and will reset on page refresh. When you connect to FastAPI + PostgreSQL, the context will persist data to the backend.

## Connecting to FastAPI Backend

The app is ready to connect to a FastAPI backend. Follow these steps:

1. **Set up your environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and set REACT_APP_API_URL to your FastAPI URL
   ```

2. **Update CheckInView to use the API:**
   ```javascript
   import { checkInAPI } from '../../services/api';
   
   const handleSave = async (data) => {
       try {
           await checkInAPI.create(selectedCategory, data);
           addCheckIn(selectedCategory, data); // Update local state
       } catch (error) {
           console.error('Failed to save:', error);
       }
   };
   ```

3. **Expected FastAPI endpoints:**
   
   **Authentication:**
   - `POST /api/auth/login` - Login with email, returns user object
   - `GET /api/auth/verify?email=xxx` - Verify user exists in database
   - `POST /api/auth/logout` - Logout user
   
   **Check-ins:**
   - `GET /api/checkins` - Get all check-ins
   - `POST /api/checkins` - Create a check-in (includes userId)
   - `GET /api/checkins?date=YYYY-MM-DD` - Get by date
   - `PUT /api/checkins/{id}` - Update a check-in
   - `DELETE /api/checkins/{id}` - Delete a check-in
   
   **Database Schema Example:**
   ```sql
   CREATE TABLE users (
       id SERIAL PRIMARY KEY,
       email VARCHAR(255) UNIQUE NOT NULL,
       name VARCHAR(255) NOT NULL,
       role VARCHAR(50) DEFAULT 'aide',
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   
   CREATE TABLE checkins (
       id SERIAL PRIMARY KEY,
       user_id INTEGER REFERENCES users(id),
       category VARCHAR(100) NOT NULL,
       data JSONB NOT NULL,
       timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

## How It Works

1. **Login**: Aide enters their email (e.g., `john.doe@example.com`)
2. **Authentication**: System verifies email against database (demo mode accepts any email)
3. **Check-In**: When John clicks "+" on Medications and saves, the system records:
   - Medication details (name, dosage, time)
   - Who gave it (John Doe)
   - When it was given (timestamp)
4. **Display**: All views show "By John Doe" next to the medication entry
5. **Timeline**: Full history shows which aide performed each action

## Future Enhancements

- ✅ ~~Connect local state management~~ (Done)
- ✅ ~~Implement Timeline view~~ (Done)
- ✅ ~~User authentication with email~~ (Done)
- ✅ ~~Track who performs each action~~ (Done)
- ✅ ~~Responsive design for mobile and desktop~~ (Done)
- ✅ ~~PWA support for installability~~ (Done)
- Connect to FastAPI backend with PostgreSQL
- Add charts and analytics to Insights view
- Push notifications for reminders
- Export health data to PDF/CSV
- Medication reminders with notifications
- Role-based permissions (aide vs admin vs family)
- Offline support with service workers
- Convert to native mobile app using Capacitor
- Submit to iOS App Store and Google Play Store
- Add data export/import functionality
- Implement real-time sync across devices
