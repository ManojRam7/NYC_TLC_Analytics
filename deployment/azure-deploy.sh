#!/bin/bash

###############################################################################
# NYC TLC Analytics - Azure Deployment Script
# This script deploys the entire application to Azure
###############################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="nyc-tlc-analytics-rg"
LOCATION="eastus"
ACR_NAME="nyctlcregistry"
BACKEND_APP_NAME="nyc-tlc-backend-api"
FRONTEND_APP_NAME="nyc-tlc-frontend-app"
SQL_SERVER_NAME="nyc-sqldb-server"
SQL_DB_NAME="nyc-sqldatabase"
APP_SERVICE_PLAN="nyc-tlc-app-plan"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        NYC TLC Analytics - Azure Deployment                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Login to Azure
echo -e "${YELLOW}🔐 Logging in to Azure...${NC}"
az login

# Select subscription (if multiple)
SUBSCRIPTIONS=$(az account list --query "[].{Name:name, ID:id}" -o table)
echo -e "${BLUE}Available subscriptions:${NC}"
echo "$SUBSCRIPTIONS"
echo ""
read -p "Enter subscription ID (or press Enter for default): " SUB_ID
if [ ! -z "$SUB_ID" ]; then
    az account set --subscription "$SUB_ID"
fi

CURRENT_SUB=$(az account show --query name -o tsv)
echo -e "${GREEN}✅ Using subscription: $CURRENT_SUB${NC}"
echo ""

# Create Resource Group
echo -e "${YELLOW}📦 Creating resource group: $RESOURCE_GROUP${NC}"
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --tags "Project=NYC-TLC-Analytics" "Environment=Production"
echo -e "${GREEN}✅ Resource group created${NC}"
echo ""

# Create Azure Container Registry
echo -e "${YELLOW}🐳 Creating Azure Container Registry: $ACR_NAME${NC}"
az acr create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$ACR_NAME" \
    --sku Basic \
    --admin-enabled true
echo -e "${GREEN}✅ Container registry created${NC}"

# Get ACR credentials
ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --query loginServer -o tsv)
ACR_USERNAME=$(az acr credential show --name "$ACR_NAME" --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" -o tsv)
echo -e "${GREEN}✅ ACR Login Server: $ACR_LOGIN_SERVER${NC}"
echo ""

# Create App Service Plan
echo -e "${YELLOW}📋 Creating App Service Plan: $APP_SERVICE_PLAN${NC}"
az appservice plan create \
    --name "$APP_SERVICE_PLAN" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --is-linux \
    --sku B1
echo -e "${GREEN}✅ App Service Plan created${NC}"
echo ""

# Create Backend Web App
echo -e "${YELLOW}🚀 Creating Backend API Web App: $BACKEND_APP_NAME${NC}"
az webapp create \
    --resource-group "$RESOURCE_GROUP" \
    --plan "$APP_SERVICE_PLAN" \
    --name "$BACKEND_APP_NAME" \
    --deployment-container-image-name "python:3.12-slim"

# Configure Backend App
az webapp config appsettings set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$BACKEND_APP_NAME" \
    --settings \
        WEBSITES_PORT=8000 \
        DB_SERVER="$SQL_SERVER_NAME.database.windows.net" \
        DB_NAME="$SQL_DB_NAME" \
        DB_DRIVER="ODBC Driver 18 for SQL Server"

echo -e "${GREEN}✅ Backend Web App created${NC}"
echo ""

# Create Static Web App for Frontend
echo -e "${YELLOW}🌐 Creating Static Web App for Frontend...${NC}"
echo "Note: Static Web App requires GitHub integration."
echo "Please create it manually at: https://portal.azure.com"
echo "Or use: az staticwebapp create (requires GitHub token)"
echo ""

# Database configuration note
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}⚠️  Database Configuration${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo "Your SQL Server is already configured:"
echo "  Server: $SQL_SERVER_NAME.database.windows.net"
echo "  Database: $SQL_DB_NAME"
echo ""
echo "Make sure to add the App Service IP to SQL Server firewall rules."
echo ""

# Build and push Docker images
echo -e "${YELLOW}🔨 Building and pushing Docker images...${NC}"
echo -e "${BLUE}Logging into ACR...${NC}"
az acr login --name "$ACR_NAME"

echo -e "${BLUE}Building backend image...${NC}"
docker build -t "$ACR_LOGIN_SERVER/nyc-tlc-backend:latest" ./backend
docker push "$ACR_LOGIN_SERVER/nyc-tlc-backend:latest"
echo -e "${GREEN}✅ Backend image pushed${NC}"

echo -e "${BLUE}Building frontend image...${NC}"
docker build -t "$ACR_LOGIN_SERVER/nyc-tlc-frontend:latest" ./frontend
docker push "$ACR_LOGIN_SERVER/nyc-tlc-frontend:latest"
echo -e "${GREEN}✅ Frontend image pushed${NC}"
echo ""

# Configure Backend to use ACR image
echo -e "${YELLOW}🔧 Configuring Backend to use Docker image...${NC}"
az webapp config container set \
    --name "$BACKEND_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --docker-custom-image-name "$ACR_LOGIN_SERVER/nyc-tlc-backend:latest" \
    --docker-registry-server-url "https://$ACR_LOGIN_SERVER" \
    --docker-registry-server-user "$ACR_USERNAME" \
    --docker-registry-server-password "$ACR_PASSWORD"

echo -e "${GREEN}✅ Backend configured${NC}"
echo ""

# Get Backend URL
BACKEND_URL=$(az webapp show --name "$BACKEND_APP_NAME" --resource-group "$RESOURCE_GROUP" --query defaultHostName -o tsv)

# Summary
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              🎉 Deployment Complete!                          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Resource Group:     ${GREEN}$RESOURCE_GROUP${NC}"
echo -e "Location:           ${GREEN}$LOCATION${NC}"
echo -e "Container Registry: ${GREEN}$ACR_LOGIN_SERVER${NC}"
echo -e "Backend API:        ${GREEN}https://$BACKEND_URL${NC}"
echo -e "Backend Health:     ${GREEN}https://$BACKEND_URL/health${NC}"
echo -e "Backend API Docs:   ${GREEN}https://$BACKEND_URL/docs${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${YELLOW}⚠️  Next Steps:${NC}"
echo "1. Configure SQL Server firewall to allow App Service"
echo "2. Set DB_USER and DB_PASSWORD in App Settings (Azure Portal)"
echo "3. Set SECRET_KEY for JWT authentication"
echo "4. Create Static Web App for frontend with GitHub integration"
echo "5. Configure ALLOWED_ORIGINS to include frontend URL"
echo ""

echo -e "${BLUE}📝 GitHub Secrets to Configure:${NC}"
echo "ACR_LOGIN_SERVER=$ACR_LOGIN_SERVER"
echo "ACR_USERNAME=$ACR_USERNAME"
echo "ACR_PASSWORD=$ACR_PASSWORD"
echo "AZURE_STATIC_WEB_APPS_API_TOKEN=<get from Azure Portal>"
echo "DB_SERVER=$SQL_SERVER_NAME.database.windows.net"
echo "DB_NAME=$SQL_DB_NAME"
echo "DB_USER=<your-db-user>"
echo "DB_PASSWORD=<your-db-password>"
echo "SECRET_KEY=<generate-secure-key>"
echo "ALLOWED_ORIGINS=https://your-frontend-url,https://$BACKEND_URL"
echo ""

echo -e "${GREEN}✅ All done! Your application is ready for CI/CD deployment.${NC}"
