# Frontend Testing Guide

## Prerequisites
Before testing the frontend, ensure:
1. Node.js and npm are installed (v18+ recommended)
2. Backend API is running on http://localhost:8000
3. Angular CLI is installed globally (optional but recommended)

## Installation

```bash
cd frontend
npm install
```

## Running the Application

### Development Server
```bash
npm start
# or
ng serve
```

The application will be available at: **http://localhost:4200**

### Production Build
```bash
npm run build
```

## Manual Testing Checklist

### 1. Login Page (`/login`)
- [ ] Page loads correctly
- [ ] Form validation works (required fields)
- [ ] Login with correct credentials (admin/secret) succeeds
- [ ] Login with incorrect credentials shows error message
- [ ] Loading state shows during authentication
- [ ] Successful login redirects to dashboard

### 2. Dashboard Page (`/dashboard`)
- [ ] Requires authentication (redirects to login if not authenticated)
- [ ] Header displays correctly with logout button
- [ ] Date filters are functional
- [ ] Service type dropdown works
- [ ] Refresh button triggers data reload

### 3. Time Series Chart
- [ ] Chart loads with data
- [ ] Chart displays daily trip volume over time
- [ ] Multiple service types shown with different colors
- [ ] Chart is responsive and interactive
- [ ] Loading indicator shows while fetching data
- [ ] Handles empty data gracefully

### 4. Trip Records Table
- [ ] Table loads with trip data
- [ ] Displays all required columns:
  - Trip ID
  - Service Type (with color badges)
  - Pickup Time
  - Pickup Location (Borough + Zone)
  - Dropoff Location (Borough + Zone)
  - Distance
  - Duration
  - Fare Amount
- [ ] Service type badges are color-coded correctly
- [ ] Pagination works (Previous/Next buttons)
- [ ] Page info displays correctly
- [ ] Table is responsive

### 5. Filtering & Pagination
- [ ] Changing date range updates data
- [ ] Changing service type filters data
- [ ] Pagination persists filters
- [ ] Page number updates correctly
- [ ] Handles no results gracefully

### 6. Authentication Flow
- [ ] Logout button works
- [ ] Logout clears token and redirects to login
- [ ] Token persists in localStorage
- [ ] Protected routes require authentication
- [ ] Invalid/expired tokens redirect to login

### 7. Error Handling
- [ ] Network errors show appropriate messages
- [ ] Invalid date ranges show validation errors
- [ ] API errors are handled gracefully
- [ ] Loading states prevent duplicate requests

## Browser Testing
Test in the following browsers:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (macOS)
- [ ] Edge

## Responsive Design Testing
Test at different screen sizes:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

## Performance Testing
- [ ] Initial page load is under 3 seconds
- [ ] API calls complete in reasonable time
- [ ] Chart renders smoothly
- [ ] Table scrolling is smooth
- [ ] No memory leaks (check DevTools)

## Common Issues & Solutions

### Issue: "npm install" fails
**Solution:** Delete `node_modules` and `package-lock.json`, then run `npm install` again

### Issue: Port 4200 already in use
**Solution:** Run `ng serve --port 4201` to use a different port

### Issue: "Cannot connect to backend"
**Solution:** 
- Ensure backend is running on http://localhost:8000
- Check CORS settings in backend
- Verify `environment.ts` has correct API URL

### Issue: Chart not displaying
**Solution:**
- Check browser console for errors
- Ensure Chart.js and ng2-charts are properly installed
- Verify data format matches expected structure

### Issue: Login fails
**Solution:**
- Check backend is running
- Verify credentials (admin/secret)
- Check browser console and network tab for errors
- Ensure backend token endpoint is working

## Automated Testing (Optional)

### Unit Tests
```bash
npm test
```

### E2E Tests (if configured)
```bash
npm run e2e
```

## Developer Tools

### Chrome DevTools Checklist
1. Open DevTools (F12)
2. **Console Tab:** Check for JavaScript errors
3. **Network Tab:** Verify API calls and responses
4. **Application Tab:** Check localStorage for token
5. **Performance Tab:** Analyze page load performance

## Test Data Requirements

Ensure your database has:
- [ ] Trip records for the date range you're testing
- [ ] Multiple service types (yellow, green, fhv, fhvhv)
- [ ] Daily aggregates computed
- [ ] Valid location data (boroughs and zones)

## Success Criteria

Frontend testing is successful when:
1. ✅ Application loads without errors
2. ✅ Authentication flow works end-to-end
3. ✅ All data displays correctly
4. ✅ Filters and pagination function properly
5. ✅ Chart visualizes data accurately
6. ✅ No console errors
7. ✅ Responsive on different screen sizes
8. ✅ Performance is acceptable
