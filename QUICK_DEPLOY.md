# Quick Deployment Checklist

## ✅ Before You Start

- [ ] Azure account created (https://azure.microsoft.com/free)
- [ ] Azure Portal open (https://portal.azure.com)
- [ ] Terminal open in project folder
- [ ] Database credentials ready

---

## 🎯 Step-by-Step (30 minutes)

### STEP 1: Backend (15 min)

```
Azure Portal → Create Resource → Web App
- Name: nyc-tlc-backend
- Runtime: Python 3.12
- OS: Linux
- Region: East US
- Plan: B1 Basic

Then:
→ Deployment Center → Local Git → Save
→ Copy Git URL and credentials
→ git remote add azure <URL>
→ git push azure main
→ Configuration → Add environment variables:
  DB_SERVER, DB_NAME, DB_USER, DB_PASSWORD, SECRET_KEY, ALLOWED_ORIGINS
→ Save and restart
```

**Test:** `https://your-backend.azurewebsites.net/docs`

---

### STEP 2: Frontend (10 min)

```bash
# 1. Update API URL
cd frontend/src/environments
# Edit environment.prod.ts:
# apiUrl: 'https://your-backend.azurewebsites.net'

# 2. Build
cd ../../../frontend
npm run build -- --configuration production

# 3. Deploy
Azure Portal → Create Resource → Static Web App
- Name: nyc-tlc-frontend
- Plan: Free
- Region: East US 2
- Source: Other

# 4. Upload (need Azure CLI)
az login
az staticwebapp upload \
  --name nyc-tlc-frontend \
  --resource-group nyc-tlc-analytics-rg \
  --app-location dist/nyc-tlc-frontend
```

**Test:** `https://your-frontend.azurestaticapps.net`

---

### STEP 3: Connect (5 min)

```
1. Copy frontend URL
2. Backend → Configuration → ALLOWED_ORIGINS
3. Update value to frontend URL
4. Save and restart

5. SQL Server → Networking → Firewall
6. Check "Allow Azure services"
7. Save
```

**Test:** Login with admin/secret ✅

---

## 🔑 Environment Variables to Set

In Backend App Service → Configuration:

| Name | Example Value |
|------|---------------|
| `DB_SERVER` | `nyc-sqldb-server.database.windows.net` |
| `DB_NAME` | `nyc-sqldatabase` |
| `DB_USER` | `serveradmin` |
| `DB_PASSWORD` | `<your-db-password>` |
| `DB_DRIVER` | `ODBC Driver 18 for SQL Server` |
| `SECRET_KEY` | Run: `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `ALLOWED_ORIGINS` | `https://your-frontend.azurestaticapps.net` |

---

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend 502 error | Wait 2-3 minutes, app is starting |
| Cannot connect to DB | Check SQL firewall rules |
| Frontend CORS error | Update ALLOWED_ORIGINS in backend |
| Login fails | Verify SECRET_KEY is set |

---

## 📞 Quick Help Commands

```bash
# Generate SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Test backend
curl https://your-backend.azurewebsites.net/health

# View backend logs
az webapp log tail --name nyc-tlc-backend --resource-group nyc-tlc-analytics-rg

# Install Azure CLI (if needed)
brew install azure-cli
```

---

## ✅ Success Checklist

- [ ] Backend `/docs` page loads
- [ ] Backend `/health` returns healthy
- [ ] Frontend home page loads
- [ ] Can login (admin/secret)
- [ ] Dashboard shows charts
- [ ] Trip records load

---

**🎉 Done! Your app is live in Azure!**

Full guide: [AZURE_PORTAL_DEPLOYMENT.md](AZURE_PORTAL_DEPLOYMENT.md)
