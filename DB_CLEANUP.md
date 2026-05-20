# Database Cleanup & Reset Guide

## Why Clean the Database?

If you're experiencing "invalid password" errors even with correct passwords, your database may contain corrupted user records from testing. This guide will help you reset and start fresh.

## Steps to Clean & Reset

### 1. Stop the Backend Server
```bash
# Press Ctrl+C in the backend terminal
```

### 2. Delete the Database

#### If Using MongoDB Locally:
```bash
# Connect to MongoDB
mongo

# In the MongoDB shell:
use educonnect
db.dropDatabase()
exit
```

#### If Using MongoDB Atlas (Cloud):
1. Go to MongoDB Atlas Dashboard
2. Select your cluster
3. Click "Collections" tab
4. Delete all collections or use a fresh database

#### If Using Docker MongoDB:
```bash
# Stop the MongoDB container
docker stop <container_id>

# Remove the container
docker rm <container_id>

# Start fresh
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 3. Restart the Backend Server
```bash
cd educonnect-backend
npm run dev
```

### 4. Seed Test Data (Optional)
The backend will automatically create the default admin user on startup.

### 5. Test the New Setup

#### Create a Test Student Account:
1. Open the Flutter app
2. Tap "Sign Up"
3. Select "Student"
4. Enter:
   - Name: Test Student
   - Email: student@test.com
   - Password: password123
5. Tap "Create Account"
6. You should see: "Account created. Waiting for admin approval."

#### Login as Admin:
1. Use admin credentials to login:
   - Email: admin@educonnect.com
   - Password: admin123

#### Approve the Student:
1. Go to Admin Panel
2. Click "Students" tab
3. Find "Test Student" with "Pending" badge
4. Click "Approve" button
5. Student should now be approved

#### Now Test Student Login:
1. Login with the student account
2. Email: student@test.com
3. Password: password123
4. Should login successfully

## Troubleshooting

### "Invalid password" for approved users:
- Delete database and restart backend
- Register a new account
- Have admin approve it
- Try login again

### "Your account is pending admin approval" (correct behavior):
- This is expected for new student/teacher registrations
- Admin must approve the account first
- Check admin panel → Students/Teachers tabs for pending users with "Approve" button

### Still having issues?
1. Check backend console for error messages
2. Verify MongoDB is running: `mongosh` or `mongo`
3. Check .env file has correct DATABASE_URL
4. Restart both backend and Flutter app
