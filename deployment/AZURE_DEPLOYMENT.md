# Azure Deployment Guide

## Prerequisites

- Azure CLI installed: `brew install azure-cli`
- Docker installed and running
- GitHub account with repository access
- Azure subscription

## Quick Deployment

### Option 1: Using Deployment Script (Recommended)

```bash
# Make script executable
chmod +x deployment/azure-deploy.sh

# Run deployment
./deployment/azure-deploy.sh
```

The script will:
1. Login to Azure
2. Create resource group
3. Create Azure Container Registry (ACR)
4. Create App Service Plan
5. Create Backend Web App
6. Build and push Docker images
7. Configure services

### Option 2: Using ARM Template

```bash
# Login to Azure
az login

# Create resource group
az group create --name nyc-tlc-analytics-rg --location eastus

# Deploy template
az deployment group create \
  --resource-group nyc-tlc-analytics-rg \
  --template-file deployment/azure-template.json \
  --parameters deployment/azure-parameters.json
```

### Option 3: Manual Azure Portal Setup

1. **Create Resource Group**
   - Name: `nyc-tlc-analytics-rg`
   - Region: East US

2. **Create Azure Container Registry**
   - Name: `nyctlcregistry`
   - SKU: Basic
   - Enable admin user

3. **Create App Service Plan**
   - Name: `nyc-tlc-app-plan`
   - OS: Linux
   - Pricing: B1 (Basic)

4. **Create Web App for Backend**
   - Name: `nyc-tlc-backend-api`
   - Runtime: Docker Container
   - Plan: Use the created plan

5. **Create Static Web App for Frontend**
   - Name: `nyc-tlc-frontend-app`
   - Connect to GitHub repository
   - Build preset: Angular
   - App location: `/frontend`
   - Output location: `dist/nyc-tlc-frontend`

## GitHub Secrets Configuration

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

### Required Secrets

```
ACR_LOGIN_SERVER=nyctlcregistry.azurecr.io
ACR_USERNAME=<from-acr-access-keys>
ACR_PASSWORD=<from-acr-access-keys>
AZURE_STATIC_WEB_APPS_API_TOKEN=<from-static-web-app>
AZURE_CREDENTIALS=<service-principal-json>
DB_SERVER=nyc-sqldb-server.database.windows.net
DB_NAME=nyc-sqldatabase
DB_USER=serveradmin
DB_PASSWORD=<your-password>
SECRET_KEY=<generate-secure-key>
ALLOWED_ORIGINS=https://your-frontend.azurestaticapps.net
```

### Generate Azure Service Principal

```bash
az ad sp create-for-rbac \
  --name "nyc-tlc-github-actions" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/nyc-tlc-analytics-rg \
  --sdk-auth
```

Copy the JSON output to `AZURE_CREDENTIALS` secret.

### Generate Secret Key

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## SQL Server Firewall Configuration

Allow Azure services to access SQL Server:

```bash
az sql server firewall-rule create \
  --resource-group nyc-tlc-analytics-rg \
  --server nyc-sqldb-server \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

## Verify Deployment

### Backend API

```bash
# Health check
curl https://nyc-tlc-backend-api.azurewebsites.net/health

# API documentation
open https://nyc-tlc-backend-api.azurewebsites.net/docs

# Test authentication
curl -X POST https://nyc-tlc-backend-api.azurewebsites.net/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=secret"
```

### Frontend

```bash
open https://your-frontend.azurestaticapps.net
```

## CI/CD Pipeline

Once configured, the pipeline automatically:

1. **On Push to Main:**
   - Runs tests
   - Builds Docker images
   - Pushes to ACR
   - Deploys to Azure App Service
   - Deploys frontend to Static Web Apps

2. **On Pull Request:**
   - Runs tests only
   - Shows preview deployment (Static Web Apps)

## Monitoring

### View Logs

```bash
# Backend logs
az webapp log tail \
  --resource-group nyc-tlc-analytics-rg \
  --name nyc-tlc-backend-api

# Static Web App logs
az staticwebapp logs show \
  --name nyc-tlc-frontend-app
```

### Application Insights (Optional)

Enable Application Insights for detailed monitoring:

```bash
az monitor app-insights component create \
  --app nyc-tlc-insights \
  --location eastus \
  --resource-group nyc-tlc-analytics-rg \
  --application-type web
```

## Cost Optimization

- **Basic Tier**: ~$13/month for App Service
- **ACR Basic**: ~$5/month
- **Static Web Apps**: Free tier (100GB bandwidth)
- **SQL Database**: Existing cost

Total additional cost: ~$18/month

## Scaling

### Scale App Service Plan

```bash
# Scale up (more CPU/RAM)
az appservice plan update \
  --resource-group nyc-tlc-analytics-rg \
  --name nyc-tlc-app-plan \
  --sku S1

# Scale out (more instances)
az appservice plan update \
  --resource-group nyc-tlc-analytics-rg \
  --name nyc-tlc-app-plan \
  --number-of-workers 3
```

## Troubleshooting

### Backend not starting

Check logs:
```bash
az webapp log tail --resource-group nyc-tlc-analytics-rg --name nyc-tlc-backend-api
```

Common issues:
- Missing environment variables
- SQL Server firewall not configured
- Docker image build failed

### Frontend not connecting to backend

1. Check CORS settings in backend
2. Verify API URL in frontend environment
3. Check browser console for errors

### Database connection issues

1. Verify firewall rules
2. Check connection string
3. Test connection from App Service:

```bash
az webapp ssh --resource-group nyc-tlc-analytics-rg --name nyc-tlc-backend-api
# Inside container: test database connection
```

## Cleanup

Remove all resources:

```bash
az group delete --name nyc-tlc-analytics-rg --yes
```

## Support

For issues:
1. Check GitHub Actions logs
2. Check Azure App Service logs
3. Review Application Insights (if enabled)
