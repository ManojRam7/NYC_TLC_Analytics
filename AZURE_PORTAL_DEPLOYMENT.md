# 🚀 Deploy NYC TLC Analytics to Azure Portal (UI Method)

**No GitHub Secrets Required for Manual Deployment!**

This guide shows you how to deploy using Azure Portal's user interface - perfect for first-time deployment or if you don't want to set up CI/CD yet.

---

## 📋 Prerequisites

- ✅ Azure Account (free tier works!)
- ✅ Your application code (already have it)
- ✅ SQL Database already set up (you have this)
- ⏳ Docker Desktop installed (optional - only for local testing)

**Time Required:** 30-45 minutes

---

## 🎯 Deployment Strategy

We'll deploy in this order:
1. **Backend API** → Azure App Service (Web App)
2. **Frontend** → Azure Static Web Apps
3. **Connect them together**

---

## PART 1: Deploy Backend API to Azure App Service

### Step 1.1: Create App Service

1. **Go to Azure Portal**: https://portal.azure.com
2. Click **"Create a resource"** (top-left or search bar)
3. Search for **"Web App"** and click **Create**

### Step 1.2: Configure Basic Settings

Fill in these details:

| Field | Value |
|-------|-------|
| **Subscription** | Select your subscription |
| **Resource Group** | Create new: `nyc-tlc-analytics-rg` |
| **Name** | `nyc-tlc-backend` (must be globally unique) |
| **Publish** | Select **Code** |
| **Runtime stack** | Select **Python 3.12** |
| **Operating System** | **Linux** |
| **Region** | **East US** (or closest to you) |

### Step 1.3: Configure App Service Plan

Under **Pricing Plan**:
- Click **"Explore pricing plans"**
- Select **"Basic B1"** ($13/month) or **"Free F1"** (for testing)
- Click **"Select"**

### Step 1.4: Review and Create

1. Click **"Review + create"**
2. Wait for validation
3. Click **"Create"**
4. Wait 2-3 minutes for deployment

✅ **Backend App Service Created!**

---

### Step 1.5: Deploy Backend Code

Now we need to upload your backend code. We'll use **Local Git** deployment (easiest method):

#### Enable Local Git Deployment

1. Go to your App Service: `nyc-tlc-backend`
2. In left menu, find **"Deployment Center"**
3. Click **"Settings"** tab
4. Under **Source**, select **"Local Git"**
5. Click **"Save"**

#### Get Deployment Credentials

1. Still in Deployment Center, click **"Local Git/FTPS credentials"** tab
2. Under **User scope**, you'll see:
   - **Git Clone Uri**: Copy this (looks like: `https://nyc-tlc-backend.scm.azurewebsites.net/nyc-tlc-backend.git`)
   - **Username**: Copy this
   - **Password**: Copy this (or click "Show" to see it)

**💡 Save these credentials somewhere safe!**

#### Deploy Backend Code via Git

Open terminal and run:

```bash
cd /Users/manojrammopati/NYC_TLC_Analytics

# Add Azure as a remote
git remote add azure <YOUR-GIT-CLONE-URI>

# Example:
# git remote add azure https://nyc-tlc-backend.scm.azurewebsites.net/nyc-tlc-backend.git

# Push backend code
git push azure main
```

When prompted, enter the **username** and **password** from above.

**Wait 5-10 minutes** for deployment to complete.

---

### Step 1.6: Configure Backend Environment Variables

1. In your App Service, go to **"Configuration"** (left menu under Settings)
2. Click **"Application settings"** tab
3. Click **"+ New application setting"** for each of these:

| Name | Value | Notes |
|------|-------|-------|
| `DB_SERVER` | `nyc-sqldb-server.database.windows.net` | Your SQL server |
| `DB_NAME` | `nyc-sqldatabase` | Your database name |
| `DB_USER` | `serveradmin` | Your DB username |
| `DB_PASSWORD` | `<your-password>` | Your DB password |
| `DB_DRIVER` | `ODBC Driver 18 for SQL Server` | ODBC driver |
| `SECRET_KEY` | Generate one (see below) | JWT secret |
| `ALLOWED_ORIGINS` | `*` | We'll update this later |

**To generate SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

4. Click **"Save"** at the top
5. Click **"Continue"** to restart the app

---

### Step 1.7: Configure Startup Command

1. Still in **Configuration**, click **"General settings"** tab
2. Under **Startup Command**, enter:
   ```bash
   cd backend && pip install -r requirements.txt && uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
3. Click **"Save"**

---

### Step 1.8: Test Backend API

1. Go to **"Overview"** (left menu)
2. Copy the **URL** (looks like: `https://nyc-tlc-backend.azurewebsites.net`)
3. Open in browser and add `/docs`: `https://nyc-tlc-backend.azurewebsites.net/docs`

**You should see FastAPI documentation!** ✅

Test the health endpoint:
```bash
curl https://nyc-tlc-backend.azurewebsites.net/health
```

Should return: `{"status": "healthy"}`

**🎉 Backend is deployed and working!**

---

## PART 2: Deploy Frontend to Azure Static Web Apps

### Step 2.1: Build Frontend Locally

First, we need to build the production version of your Angular app:

```bash
cd /Users/manojrammopati/NYC_TLC_Analytics/frontend

# Update environment to use your backend URL
# Edit: src/environments/environment.prod.ts
```

**Edit `frontend/src/environments/environment.prod.ts`:**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://nyc-tlc-backend.azurewebsites.net'  // Your backend URL
};
```

**Build the app:**
```bash
npm run build -- --configuration production
```

This creates a `dist/nyc-tlc-frontend` folder with your built app.

---

### Step 2.2: Create Static Web App

1. **Go to Azure Portal**: https://portal.azure.com
2. Click **"Create a resource"**
3. Search for **"Static Web App"** and click **Create**

### Step 2.3: Configure Static Web App

Fill in these details:

| Field | Value |
|-------|-------|
| **Subscription** | Same as backend |
| **Resource Group** | `nyc-tlc-analytics-rg` (same) |
| **Name** | `nyc-tlc-frontend` |
| **Plan type** | **Free** (perfect for this!) |
| **Region** | **East US 2** (or closest) |
| **Deployment source** | **Other** |

Click **"Review + create"** → **"Create"**

---

### Step 2.4: Deploy Frontend Files

#### Option A: Using Azure CLI (Recommended)

1. **Install Azure CLI** (if not already):
   ```bash
   brew install azure-cli
   ```

2. **Login to Azure:**
   ```bash
   az login
   ```

3. **Deploy the built files:**
   ```bash
   cd /Users/manojrammopati/NYC_TLC_Analytics/frontend
   
   az staticwebapp upload \
     --name nyc-tlc-frontend \
     --resource-group nyc-tlc-analytics-rg \
     --app-location dist/nyc-tlc-frontend
   ```

#### Option B: Using Azure Portal (Manual Upload)

1. Go to your Static Web App: `nyc-tlc-frontend`
2. In left menu, click **"Deployment"**
3. You'll need to connect GitHub or use Azure CLI (Option A is easier)

---

### Step 2.5: Update Backend CORS

Now that frontend is deployed, update backend CORS settings:

1. Go to your backend App Service: `nyc-tlc-backend`
2. Go to **"Configuration"** → **"Application settings"**
3. Find **`ALLOWED_ORIGINS`** setting
4. Change value from `*` to your frontend URL:
   ```
   https://nyc-tlc-frontend.azurestaticapps.net
   ```
5. Click **"Save"**

---

### Step 2.6: Test the Complete Application

1. Go to your Static Web App **"Overview"**
2. Copy the **URL** (looks like: `https://nyc-tlc-frontend.azurestaticapps.net`)
3. Open in browser

**You should see the login page!** ✅

Login with:
- Username: `admin`
- Password: `secret`

**🎉 Full application is deployed!**

---

## ⚙️ SQL Server Firewall Configuration

If you get database connection errors:

1. Go to **Azure Portal** → **SQL databases**
2. Click your database: `nyc-sqldatabase`
3. Click **"Server name"** to go to SQL Server
4. Click **"Networking"** (left menu under Security)
5. Under **Firewall rules**:
   - Check ✅ **"Allow Azure services and resources to access this server"**
   - Click **"Add current client IP address"** (for your local testing)
6. Click **"Save"**

---

## 🔍 Troubleshooting

### Backend Issues

**Check Logs:**
1. Go to App Service: `nyc-tlc-backend`
2. Click **"Log stream"** (left menu under Monitoring)
3. Watch for errors

**Common Issues:**

| Issue | Solution |
|-------|----------|
| "Cannot connect to database" | Check firewall rules, verify DB credentials |
| "Module not found" | Verify startup command includes `pip install -r requirements.txt` |
| "502 Bad Gateway" | App is starting (wait 2-3 minutes) |
| "Authentication failed" | Verify SECRET_KEY is set in Configuration |

### Frontend Issues

**Common Issues:**

| Issue | Solution |
|-------|----------|
| "Cannot reach API" | Check backend URL in environment.prod.ts |
| "CORS error" | Update ALLOWED_ORIGINS in backend Configuration |
| "404 Not Found" | Static Web App needs proper routing config |

---

## 📊 Verify Everything Works

### Test Checklist

- [ ] Backend health: `https://your-backend.azurewebsites.net/health`
- [ ] API docs: `https://your-backend.azurewebsites.net/docs`
- [ ] Frontend loads: `https://your-frontend.azurestaticapps.net`
- [ ] Login works (admin/secret)
- [ ] Dashboard displays charts
- [ ] Trip records load

---

## 💰 Cost Summary

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| App Service | B1 Basic | ~$13 |
| Static Web App | Free | $0 |
| SQL Database | Already have | $0 (existing) |
| **Total** | | **~$13/month** |

**Free Alternative:** Use F1 Free tier for App Service (limited to 60 CPU minutes/day)

---

## ❓ Do I Need GitHub Secrets?

**Short Answer: NO, not for manual deployment!**

GitHub Secrets are only needed if you want **automated CI/CD** (auto-deploy when you push code).

### When to Use GitHub Secrets (Optional):

If you want to enable automated deployments:

1. **Go to GitHub Repository**: https://github.com/ManojRam7/NYC_TLC_Analytics
2. Click **"Settings"** → **"Secrets and variables"** → **"Actions"**
3. Click **"New repository secret"** for each:

| Secret Name | How to Get It |
|------------|---------------|
| `AZURE_CREDENTIALS` | Create Service Principal (see below) |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | In Static Web App → "Manage deployment token" |

**Create Service Principal:**
```bash
az ad sp create-for-rbac \
  --name "nyc-tlc-github-actions" \
  --role contributor \
  --scopes /subscriptions/YOUR-SUBSCRIPTION-ID/resourceGroups/nyc-tlc-analytics-rg \
  --sdk-auth
```

Copy the JSON output and paste as `AZURE_CREDENTIALS` secret.

**But again, this is OPTIONAL - only if you want automated CI/CD!**

---

## 🎯 Next Steps

After successful deployment:

1. ✅ **Share your app URL** with others
2. ✅ **Monitor usage** in Azure Portal (Metrics section)
3. ✅ **Add custom domain** (optional - in Static Web App settings)
4. ✅ **Enable Application Insights** for monitoring (optional)
5. ✅ **Set up CI/CD** with GitHub Actions (optional)

---

## 📞 Need Help?

**Check these first:**
- Backend logs: App Service → Log stream
- Frontend errors: Browser console (F12)
- SQL connection: Verify firewall rules

**Common URLs:**
- Azure Portal: https://portal.azure.com
- Your Backend: https://nyc-tlc-backend.azurewebsites.net
- Your Frontend: https://nyc-tlc-frontend.azurestaticapps.net

---

## ✅ Summary

You've successfully deployed your NYC TLC Analytics platform to Azure! 🎉

**What you deployed:**
- ✅ Backend API on Azure App Service
- ✅ Frontend on Azure Static Web Apps  
- ✅ Connected to your existing SQL Database
- ✅ All working together in the cloud!

**No Docker needed, No GitHub Secrets needed - just Azure Portal UI!**

---

**Questions? Just ask! I'm here to help. 😊**
