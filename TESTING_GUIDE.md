# NYC TLC Analytics - Testing Guide

## 🎯 Overview
This guide will help you test the complete NYC TLC Analytics platform, including:
- ✅ Backend API (FastAPI)
- ✅ Frontend Application (Angular)
- ✅ Database Connectivity (Azure SQL)
- ✅ End-to-End Integration

---

## 📋 Prerequisites

### 1. Update Environment Configuration
**IMPORTANT:** Before testing, update your `.env` file with actual Azure SQL Database credentials:

```bash
# Edit .env file
nano .env  # or use your preferred editor
```

Update these values:
```env
DB_SERVER=your-actual-server.database.windows.net
DB_NAME=nyctlc_analytics
DB_USER=your-actual-username
DB_PASSWORD=your-actual-password
DB_DRIVER=ODBC Driver 18 for SQL Server
```

### 2. Verify ODBC Driver
Ensure ODBC Driver 18 for SQL Server is installed:
```bash
# On macOS
brew install msodbcsql18

# On Linux
# Follow Microsoft's installation guide
```

### 3. Check Azure SQL Firewall
Ensure your IP address is whitelisted in Azure SQL Database firewall rules.

---

## 🚀 Quick Start - Interactive Testing Menu

Run the interactive test menu:
```bash
./test.sh
```

This provides options to:
1. **Test Backend** - Run automated backend tests
2. **Start Backend Server** - Launch API server
3. **Test Frontend** - View frontend testing guide
4. **Start Both Services** - Run backend + frontend together
5. **Run Manual API Tests** - Execute curl-based API tests
6. **Exit**

---

## 🔧 Backend Testing

### Option A: Automated Testing (Recommended)

1. **Run Complete Test Suite:**
```bash
cd backend
python run_tests.py
```

This will:
- ✅ Test database connectivity
- ✅ Verify tables exist and contain data
- ✅ Test all API endpoints
- ✅ Validate authentication flow
- ✅ Check pagination and filtering

### Option B: Manual Step-by-Step

#### Step 1: Test Database Connection
```bash
cd backend
python tests/test_database.py
```

Expected output:
```
✅ Basic query test: PASSED
✅ fact_trip table exists: XXX,XXX rows
✅ agg_daily_metrics table exists: X,XXX rows
📊 Sample data from fact_trip (latest 5 trips):
   ...
✅ DATABASE CONNECTION TEST: PASSED
```

#### Step 2: Start Backend Server
```bash
cd backend
python start_server.py
```

Server will start on: **http://localhost:8000**

#### Step 3: Test API Endpoints

**Option A: Use Swagger UI (Recommended)**
- Open browser: http://localhost:8000/docs
- Test each endpoint interactively
- Authorization: Click "Authorize" button, use `admin` / `secret`

**Option B: Use curl script**
```bash
# In a new terminal (keep server running)
cd backend
./test_api_manual.sh
```

**Option C: Use pytest**
```bash
cd backend
pytest tests/test_api.py -v
```

### Backend Endpoints to Test

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/` | GET | No | API information |
| `/health` | GET | No | Health check |
| `/token` | POST | No | Login (get token) |
| `/api/users/me` | GET | Yes | Current user info |
| `/api/aggregates/daily` | GET | Yes | Daily metrics |
| `/api/trips` | GET | Yes | Trip records |
| `/api/statistics` | GET | Yes | Overall statistics |

### Expected Results

✅ **All tests should pass** if:
- Database credentials are correct
- Tables exist with data
- Firewall allows connection
- ODBC driver is installed

⚠️ **Common Issues:**
- `Connection failed`: Check firewall rules
- `Table not found`: Run data processing notebook first
- `Authentication failed`: Verify .env SECRET_KEY

---

## 🎨 Frontend Testing

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Start Development Server

**Ensure backend is running first!**

```bash
# Terminal 1: Backend
cd backend
python start_server.py

# Terminal 2: Frontend
cd frontend
npm start
```

Frontend will be available at: **http://localhost:4200**

### Step 3: Manual Testing Checklist

Open http://localhost:4200 and verify:

#### Login Page
- [ ] Navigate to http://localhost:4200
- [ ] Login form displays correctly
- [ ] Enter credentials: `admin` / `secret`
- [ ] Click "Login" button
- [ ] Should redirect to dashboard

#### Dashboard
- [ ] Header shows "NYC TLC Trip Analytics"
- [ ] Logout button visible
- [ ] Date filters displayed (Start Date, End Date)
- [ ] Service Type dropdown works
- [ ] Refresh button present

#### Time Series Chart
- [ ] Chart loads without errors
- [ ] Shows daily trip volume over time
- [ ] Multiple service types displayed (Yellow, Green, FHV, FHVHV)
- [ ] Different colors for each service type
- [ ] Chart is interactive (hover shows values)

#### Trip Records Table
- [ ] Table displays trip data
- [ ] All columns visible:
  - Trip ID
  - Service Type (with colored badges)
  - Pickup Time
  - Pickup Location (Borough + Zone)
  - Dropoff Location (Borough + Zone)
  - Distance (miles)
  - Duration (minutes)
  - Fare Amount ($)
- [ ] Service badges have correct colors:
  - Yellow: Yellow background
  - Green: Green background
  - FHV: Blue background
  - FHVHV: Red background

#### Filtering & Pagination
- [ ] Change start date - data updates
- [ ] Change end date - data updates
- [ ] Select service type filter - data filters
- [ ] Click "Previous" button (if page > 1)
- [ ] Click "Next" button - loads next page
- [ ] Page info updates correctly

#### Error Handling
- [ ] Invalid date range shows error
- [ ] Network errors display message
- [ ] Empty results show appropriate message
- [ ] Loading states show during data fetch

### Frontend Browser Console Check

Open Developer Tools (F12) and check:
- [ ] No JavaScript errors in Console
- [ ] Network tab shows successful API calls
- [ ] Application tab shows token in localStorage

### Detailed Testing Guide
See `frontend/TESTING.md` for comprehensive checklist.

---

## 🔗 Integration Testing

### Full End-to-End Flow

1. **Start both services:**
```bash
./test.sh
# Select option 4: Start Both Services
```

2. **Test complete flow:**
```bash
# Open browser to http://localhost:4200
# 1. Login with admin/secret
# 2. Verify chart loads with data
# 3. Verify table shows trips
# 4. Change date range
# 5. Change service type filter
# 6. Navigate through pages
# 7. Logout
# 8. Verify redirect to login
```

3. **Monitor logs:**
- Backend terminal shows API requests
- Frontend terminal shows compilation status
- Browser console shows client-side activity

---

## 📊 Test Data Requirements

For meaningful tests, ensure your database has:
- ✅ At least 1,000+ trip records in `fact_trip`
- ✅ Daily aggregates in `agg_daily_metrics`
- ✅ Data covering multiple dates
- ✅ Multiple service types (yellow, green, fhv, fhvhv)
- ✅ Valid location data (boroughs and zones)

### Check Data Availability
```bash
cd backend
python tests/test_database.py
```

---

## 🐛 Troubleshooting

### Backend Issues

**Problem: "Connection refused" or "Cannot connect to database"**
- Solution: Check Azure SQL firewall rules
- Verify .env credentials
- Test connection with Azure Data Studio

**Problem: "Table 'fact_trip' does not exist"**
- Solution: Run the data processing notebook first
- Execute SQL DDL to create tables

**Problem: "Module not found" errors**
- Solution: Activate virtual environment
```bash
source .venv/bin/activate
pip install -r requirements.txt
```

**Problem: Port 8000 already in use**
- Solution: Kill existing process
```bash
lsof -ti:8000 | xargs kill -9
```

### Frontend Issues

**Problem: "npm install" fails**
- Solution: Clear cache and retry
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Problem: "Cannot GET /"**
- Solution: Ensure you're accessing http://localhost:4200 (not 8000)

**Problem: "401 Unauthorized" on API calls**
- Solution: Check backend is running
- Verify CORS configuration
- Check token in localStorage

**Problem: Chart not displaying**
- Solution: Check browser console for errors
- Verify chart.js and ng2-charts are installed
- Check data format from API

---

## ✅ Success Criteria

### Backend Tests Pass When:
- ✅ All pytest tests pass
- ✅ Database connection successful
- ✅ All API endpoints return expected responses
- ✅ Authentication flow works
- ✅ No errors in server logs

### Frontend Tests Pass When:
- ✅ Application loads without errors
- ✅ Login/logout flow works
- ✅ Chart displays data correctly
- ✅ Table shows all trip information
- ✅ Filters and pagination work
- ✅ No console errors
- ✅ Responsive on different screen sizes

### Integration Tests Pass When:
- ✅ Frontend communicates with backend successfully
- ✅ Authentication token flows correctly
- ✅ Data displays in both chart and table
- ✅ All features work end-to-end

---

## 📚 Additional Resources

- **API Documentation:** http://localhost:8000/docs (when backend running)
- **ReDoc:** http://localhost:8000/redoc
- **Frontend Testing Guide:** `frontend/TESTING.md`
- **Project Requirements:** `project requirement documnet.txt`

---

## 🎯 Next Steps After Testing

1. ✅ All tests pass? Proceed to Azure deployment
2. ⚠️ Tests failing? Review error messages and check configuration
3. 📝 Document any issues found
4. 🚀 Ready for production deployment

---

## 📞 Need Help?

If tests are failing:
1. Check all prerequisites are met
2. Review error messages carefully
3. Verify .env configuration
4. Ensure database has data
5. Check firewall and network settings

Good luck with testing! 🚀
