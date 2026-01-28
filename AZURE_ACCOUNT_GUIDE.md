# 🔐 Azure Account Management Guide

## 📊 Your Current Azure Account

You are currently logged in as:

**Account:** `ManojRamMopati@Oxygen07.onmicrosoft.com`  
**Subscription:** `Azure subscription 1`  
**Tenant:** `Oxygen`  
**Subscription ID:** `eee8a420-5f3c-4fd6-82ad-ba66e2c740aa`

---

## 🔄 How to Switch to a Different Azure Account

### Method 1: Logout and Login with Different Account (Recommended)

```bash
# 1. Logout from current account
az logout

# 2. Login with different account
az login

# This will:
# - Open your browser
# - Let you choose which Microsoft account to use
# - Can use a different email (personal, work, school, etc.)
```

### Method 2: Login with Specific Account (Force New Login)

```bash
# Login with specific email
az login --username your-other-email@example.com

# Or just force a new login (will show all your accounts)
az login --use-device-code
```

---

## 🔍 Check Which Account You're Using

### Quick Check
```bash
# Show current account
az account show

# Show just the account name
az account show --query "user.name" -o tsv
```

### See All Your Subscriptions
```bash
# List all subscriptions you have access to
az account list --output table
```

Output will look like:
```
Name                  SubscriptionId                        TenantId                              State
--------------------  ------------------------------------  ------------------------------------  -------
Azure subscription 1  eee8a420-5f3c-4fd6-82ad-ba66e2c740aa  e6389879-faa6-42f6-8306-1787fafb68c3  Enabled
My Personal Sub       xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx     yyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy     Enabled
```

---

## 🎯 Switch Between Subscriptions (Same Account)

If you have **multiple subscriptions** under the **same account**:

```bash
# List all subscriptions
az account list --output table

# Switch to different subscription
az account set --subscription "SUBSCRIPTION-ID-OR-NAME"

# Example:
az account set --subscription "My Personal Subscription"

# Verify the switch
az account show --query name
```

---

## 🚀 Complete Workflow for Deploying to Different Account

### Step 1: Check Current Account
```bash
az account show
```

### Step 2: Decide What You Need

**Scenario A:** Different Microsoft Account (different email)
```bash
az logout
az login
# Choose your other account in the browser
```

**Scenario B:** Different subscription (same email)
```bash
az account list --output table
az account set --subscription "Other Subscription Name"
```

**Scenario C:** Not sure which account/subscription to use
```bash
az account list --output table
# This shows ALL subscriptions you have access to
```

### Step 3: Verify You're in the Right Account
```bash
# Check account
az account show --query "user.name" -o tsv

# Check subscription
az account show --query "name" -o tsv
```

### Step 4: Now Deploy!
```bash
# Run the deployment helper
./prepare-azure-deployment.sh

# Or manually deploy
./deployment/azure-deploy.sh
```

---

## 🔧 Troubleshooting

### "I don't see my other subscription"

```bash
# Force refresh by logging out and back in
az logout
az login

# Then list again
az account list --output table
```

### "I want to use my personal/school/work account"

```bash
# Logout first
az logout

# Login - browser will let you choose the account
az login

# If you have multiple Microsoft accounts, make sure you:
# 1. Use the correct email when logging in
# 2. Use the right password for that email
```

### "I logged in but don't see my resources"

```bash
# Make sure you're in the right subscription
az account list --output table

# Set the correct one
az account set --subscription "YOUR-SUBSCRIPTION-NAME"
```

---

## 📝 Quick Reference Commands

| Task | Command |
|------|---------|
| **Check current account** | `az account show` |
| **Check current user** | `az account show --query "user.name" -o tsv` |
| **List all subscriptions** | `az account list --output table` |
| **Switch subscription** | `az account set --subscription "NAME"` |
| **Logout** | `az logout` |
| **Login to different account** | `az logout && az login` |
| **Login with device code** | `az login --use-device-code` |

---

## 💡 Understanding the Difference

### Microsoft Account (User)
- Your email address (like: you@gmail.com or you@company.com)
- One person can have multiple Microsoft accounts
- To change: `az logout` then `az login`

### Azure Subscription
- A billing container within your account
- One account can have multiple subscriptions (Personal, Work, School, etc.)
- To change: `az account set --subscription "NAME"`

### Tenant
- An organization's Azure Active Directory
- Like "Oxygen" in your current account
- When you switch accounts, you might switch tenants

---

## 🎯 Your Current Situation

You're logged in as:
- **User:** ManojRamMopati@Oxygen07.onmicrosoft.com
- **Subscription:** Azure subscription 1
- **Tenant:** Oxygen

### To deploy to a different Azure account:

**Option 1: Different email entirely**
```bash
az logout
az login
# Pick your other account in browser
```

**Option 2: Same email, different subscription**
```bash
az account list --output table
az account set --subscription "Your Other Subscription"
```

---

## ✅ Before You Deploy

**Always verify you're in the right place:**

```bash
# Run these commands and check the output
echo "Current User:"
az account show --query "user.name" -o tsv

echo "Current Subscription:"
az account show --query "name" -o tsv

echo "Subscription ID:"
az account show --query "id" -o tsv
```

**If everything looks good → proceed with deployment!**

---

## 🆘 Still Confused?

Run this to see ALL your options:

```bash
az account list --output table
```

This shows:
- All Microsoft accounts you're logged into
- All subscriptions you have access to
- Which one is currently active (IsDefault = True)

Then just pick the one you want:
```bash
az account set --subscription "The one you want"
```

---

**Need help? Just ask! 😊**
