# 🚀 Quick Start - Testing Your Application

## ⚡ 3-Minute Quick Start

### 1️⃣ Install ODBC Driver (One-time, ~2 min)
```bash
brew install msodbcsql18
```

### 2️⃣ Update Database Credentials (~30 sec)
```bash
nano .env
```
Replace `your-server.database.windows.net` with your actual Azure SQL server details.

### 3️⃣ Run Tests (~30 sec)
```bash
./test.sh
```
Choose option 1 to test backend, or option 4 to start both services.

---

## 📋 What's Ready for You

### ✅ Backend Testing
- **Automated Tests**: `backend/run_tests.py`
- **Database Tests**: `backend/tests/test_database.py`
- **API Tests**: `backend/tests/test_api.py`
- **Manual API Tests**: `backend/test_api_manual.sh`
- **Server Starter**: `backend/start_server.py`

### ✅ Frontend Testing
- **Testing Guide**: `frontend/TESTING.md`
- **Dev Server**: `npm start` in frontend directory
- **All Components**: Ready to test in browser

### ✅ Documentation
- **Complete Guide**: `TESTING_GUIDE.md` (detailed)
- **Quick Summary**: `TESTING_SUMMARY.md` (status)
- **This File**: Quick commands

### ✅ Interactive Menu
- **Master Script**: `./test.sh`
  - Option 1: Test Backend
  - Option 2: Start Backend Server
  - Option 3: View Frontend Testing Guide
  - Option 4: Start Both Services
  - Option 5: Manual API Tests

---

## 🎯 Choose Your Path

### Path A: Quick Backend Test (Recommended First)
```bash
# 1. Update .env with real credentials
nano .env

# 2. Test database connection
cd backend
python tests/test_database.py

# 3. Run all backend tests
python run_tests.py
```

### Path B: Start Everything and Test Manually
```bash
# Use the interactive menu
./test.sh

# Select option 4: Start Both Services
# Then open browser to http://localhost:4200
```

### Path C: Step-by-Step Testing
```bash
# 1. Test database
cd backend && python tests/test_database.py

# 2. Start backend (in one terminal)
cd backend && python start_server.py

# 3. Test API (in another terminal)
cd backend && ./test_api_manual.sh

# 4. Install frontend deps
cd frontend && npm install

# 5. Start frontend (keep backend running)
cd frontend && npm start

# 6. Open browser to http://localhost:4200
```

---

## 🔗 Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:4200 | Main application |
| Backend API | http://localhost:8000 | REST API |
| API Docs (Swagger) | http://localhost:8000/docs | Interactive docs |
| API Docs (ReDoc) | http://localhost:8000/redoc | Alternative docs |
| Health Check | http://localhost:8000/health | Server status |

---

## 🔐 Default Credentials

```
Username: admin
Password: secret
```

---

## ✅ Success Indicators

### Backend Working:
- ✅ `python tests/test_database.py` shows connection success
- ✅ Server starts on port 8000
- ✅ http://localhost:8000/health returns `{"status":"healthy"}`
- ✅ http://localhost:8000/docs loads Swagger UI

### Frontend Working:
- ✅ `npm start` compiles successfully
- ✅ http://localhost:4200 loads login page
- ✅ Login redirects to dashboard
- ✅ Chart displays trip data
- ✅ Table shows trip records

---

## 🐛 Quick Troubleshooting

### "Cannot connect to database"
→ Check .env file has real credentials (not placeholders)
→ Verify Azure SQL firewall allows your IP

### "ODBC Driver not found"
→ Run: `brew install msodbcsql18`

### "Port 8000 already in use"
→ Kill process: `lsof -ti:8000 | xargs kill -9`

### "npm install fails"
→ Clear cache: `rm -rf node_modules && npm install`

### "Frontend can't reach backend"
→ Ensure backend is running on port 8000
→ Check CORS settings in backend

---

## 📚 Need More Details?

- **Comprehensive Guide**: Read `TESTING_GUIDE.md`
- **Current Status**: Read `TESTING_SUMMARY.md`
- **Frontend Checklist**: Read `frontend/TESTING.md`

---

## 🎉 You're All Set!

Everything is ready for testing. Just:
1. Install ODBC driver if needed
2. Update .env file
3. Run `./test.sh`

**Happy Testing! 🚀**
