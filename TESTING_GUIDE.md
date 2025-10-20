# Testing Guide - Multi-Patient System

## ✅ What's Ready

1. **Backend**: Multi-patient database schema with API endpoints
2. **Frontend**: Patient selection screen after login
3. **Contexts**: All contexts are patient-aware
4. **Flow**: Login → Select Patient → Use App

## 🚀 Steps to Test

### Step 1: Reset Database (Required)

The database schema changed, so you need to reset it:

**In Railway Dashboard:**
1. Go to https://railway.app/dashboard
2. Click your project → PostgreSQL → **Query** tab
3. Run this SQL:

```sql
DROP TABLE IF EXISTS checkins CASCADE;
DROP TABLE IF EXISTS medications CASCADE;
DROP TABLE IF EXISTS patient_info CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
```

### Step 2: Restart Backend

```bash
cd /home/qenlab-1/robin/CareGiver/backend
# Stop current backend (Ctrl+C)
./start.sh
```

Watch the logs - you should see tables being created.

### Step 3: Create Test Patient via API

```bash
curl -X POST http://localhost:8000/api/patients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "age": 75,
    "allergies": "Penicillin",
    "emergency_contact": "Jane Doe - (555) 123-4567",
    "doctor": "Dr. Smith - (555) 987-6543"
  }'
```

You should get a response like:
```json
{
  "id": 1,
  "name": "John Doe",
  "age": 75,
  ...
}
```

### Step 4: Restart Frontend

```bash
cd /home/qenlab-1/robin/CareGiver
# Stop current frontend (Ctrl+C)
npm start
```

### Step 5: Test the Flow

1. **Login Screen**
   - Enter any email (e.g., `aide@example.com`)
   - Click "Sign In"

2. **Patient Selection Screen** (NEW!)
   - You should see "Welcome, Aide!"
   - Dropdown shows "John Doe (75 years old)"
   - Select the patient
   - Click "Continue"

3. **Today View**
   - Should load normally
   - Patient info should show John Doe's details

4. **Add Medication**
   - Go to "More" → "Manage Plan"
   - Add a medication (e.g., "Aspirin 100mg")
   - Should save to database with `patient_id`

5. **Check Off Medication**
   - Go to "Today"
   - Check off the medication
   - Should create check-in with `patient_id`

6. **View Timeline**
   - Go to "Timeline"
   - Should see the check-in

7. **Refresh Page**
   - Press F5
   - Should stay logged in
   - Should remember selected patient
   - Data should persist

### Step 6: Test Creating New Patient

1. **Logout** (if there's a logout button, or clear localStorage)
2. **Login again**
3. **Patient Selection Screen**
   - Click "Add New Patient"
   - Fill in form:
     - Name: "Mary Smith"
     - Age: 82
     - Allergies: "None"
     - etc.
   - Click "Create Patient"
4. **Should navigate to Today view** with Mary Smith selected
5. **Add medications** for Mary Smith
6. **Switch back to John Doe** (need to add patient switcher - see below)

## 🔍 What to Check

### Backend Logs
You should see:
```
INFO: POST /api/auth/login?email=aide@example.com 200 OK
INFO: GET /api/patients 200 OK
INFO: POST /api/medications 200 OK
INFO: POST /api/checkins 200 OK
```

### Browser Console (F12)
Should see:
```
POST http://localhost:8000/api/auth/login?email=...
GET http://localhost:8000/api/patients
POST http://localhost:8000/api/medications
```

No errors!

### Database (Railway Dashboard → PostgreSQL → Data)
Check tables:
- `patients` - Should have John Doe and Mary Smith
- `medications` - Should have `patient_id` column
- `checkins` - Should have `patient_id` column

## 🐛 Common Issues

### Issue: "No patients found"
**Solution**: Create a patient via curl command (Step 3)

### Issue: "Failed to load medications"
**Solution**: Check backend logs, ensure `patient_id` is being sent

### Issue: "Patient selection doesn't show"
**Solution**: Check browser console for errors, ensure AuthContext is loading patients

### Issue: Data not persisting
**Solution**: 
- Check backend is running
- Check browser console for API errors
- Verify database connection in backend logs

## 📝 Next Features to Add

### 1. Patient Switcher in TopBar
Add a dropdown in the top bar to switch between patients without logging out.

**Location**: `src/components/common/TopBar.jsx`

```jsx
import { useAuth } from '../../context/AuthContext';

const { patients, selectedPatient, selectPatient } = useAuth();

// Add dropdown in TopBar
<select 
  value={selectedPatient?.id} 
  onChange={(e) => {
    const patient = patients.find(p => p.id === parseInt(e.target.value));
    selectPatient(patient);
  }}
>
  {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
</select>
```

### 2. Patient Management View
Add a view in "More" to manage all patients:
- View all patients
- Edit patient info
- Add new patients
- Archive patients

### 3. Multi-Patient Dashboard
Show summary of all patients on one screen for supervisors.

## ✨ Success Criteria

- ✅ Login works
- ✅ Patient selection appears
- ✅ Can create new patient
- ✅ Can select existing patient
- ✅ Medications load for selected patient
- ✅ Check-ins save with patient_id
- ✅ Data persists after refresh
- ✅ Can switch between patients

## 🎯 You're Done When...

1. You can login
2. See patient selection screen
3. Create a new patient
4. Add medications for that patient
5. Check off medications
6. Refresh page - everything still works
7. Create another patient
8. Switch between patients - each has their own data

**Your app now supports multiple patients per aide!** 🎉
