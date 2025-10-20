# Authentication System

## Overview

The CareGiver app includes a complete authentication system that tracks which aide or caregiver performs each action.

## Current Implementation (Demo Mode)

### Login Flow
1. User visits the app and sees the login screen
2. User enters their email address
3. System accepts any valid email format (no database verification in demo mode)
4. User is logged in and can access the app
5. User information is stored in localStorage

### User Data Structure
```javascript
{
    id: 1234567890,           // Timestamp-based ID
    email: "john.doe@example.com",
    name: "John Doe",         // Extracted from email
    role: "aide",             // Default role
    loginTime: "2025-10-17T..."
}
```

### Check-In Attribution
Every check-in includes user information:
```javascript
{
    id: 1234567890,
    category: "Medications",
    data: {
        name: "Aspirin",
        dosage: "100mg",
        time: "10:30",
        notes: "With food"
    },
    user: {
        id: 1234567890,
        name: "John Doe",
        email: "john.doe@example.com"
    },
    timestamp: "2025-10-17T10:30:00Z",
    date: "Oct 17, 2025",
    time: "10:30 AM"
}
```

## Production Implementation (with FastAPI + PostgreSQL)

### Database Schema

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'aide',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Check-ins table
CREATE TABLE checkins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL,
    data JSONB NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_checkins_user_id ON checkins(user_id);
CREATE INDEX idx_checkins_timestamp ON checkins(timestamp);
CREATE INDEX idx_checkins_category ON checkins(category);
```

### FastAPI Endpoints

#### Authentication

**POST /api/auth/login**
```python
@app.post("/api/auth/login")
async def login(email: str):
    # Verify user exists in database
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update last login
    user.last_login = datetime.now()
    db.commit()
    
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role
    }
```

**GET /api/auth/verify**
```python
@app.get("/api/auth/verify")
async def verify_user(email: str):
    user = db.query(User).filter(User.email == email).first()
    return {"exists": user is not None}
```

#### Check-ins

**POST /api/checkins**
```python
@app.post("/api/checkins")
async def create_checkin(
    user_id: int,
    category: str,
    data: dict
):
    checkin = CheckIn(
        user_id=user_id,
        category=category,
        data=data,
        timestamp=datetime.now()
    )
    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    
    return checkin
```

**GET /api/checkins**
```python
@app.get("/api/checkins")
async def get_checkins(
    date: Optional[str] = None,
    category: Optional[str] = None,
    user_id: Optional[int] = None
):
    query = db.query(CheckIn).join(User)
    
    if date:
        query = query.filter(func.date(CheckIn.timestamp) == date)
    if category:
        query = query.filter(CheckIn.category == category)
    if user_id:
        query = query.filter(CheckIn.user_id == user_id)
    
    checkins = query.order_by(CheckIn.timestamp.desc()).all()
    
    # Include user information
    return [
        {
            "id": c.id,
            "category": c.category,
            "data": c.data,
            "timestamp": c.timestamp,
            "user": {
                "id": c.user.id,
                "name": c.user.name,
                "email": c.user.email
            }
        }
        for c in checkins
    ]
```

### Frontend Integration

Update `src/context/AuthContext.jsx`:

```javascript
const login = async (email) => {
    try {
        // Call FastAPI backend
        const response = await authAPI.login(email);
        
        setUser(response);
        localStorage.setItem('caregiverUser', JSON.stringify(response));
        return response;
    } catch (error) {
        throw new Error('User not found in database');
    }
};
```

Update `src/components/views/CheckInView.jsx`:

```javascript
const handleSave = async (data) => {
    try {
        // Save to backend
        await checkInAPI.create(selectedCategory, data, user.id);
        
        // Update local state
        addCheckIn(selectedCategory, data, user);
    } catch (error) {
        console.error('Failed to save:', error);
        alert('Failed to save check-in. Please try again.');
    }
};
```

## Security Considerations

For production:

1. **Add password authentication** - Don't rely on email alone
2. **Implement JWT tokens** - For secure session management
3. **Add HTTPS** - Encrypt all communications
4. **Rate limiting** - Prevent brute force attacks
5. **Input validation** - Sanitize all user inputs
6. **Role-based access control** - Different permissions for aides, admins, family
7. **Audit logging** - Track all authentication attempts

## Testing

### Demo Mode Testing
1. Enter any email: `test@example.com`
2. Add a medication
3. Check Today view - should show "By Test"
4. Check Timeline - should show "By Test"
5. Go to More tab - should show user profile
6. Logout - should return to login screen

### Production Testing
1. Create test users in database
2. Try logging in with valid email
3. Try logging in with invalid email (should fail)
4. Verify check-ins are attributed correctly
5. Test logout functionality
6. Verify localStorage is cleared on logout
