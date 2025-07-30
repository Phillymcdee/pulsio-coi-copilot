# QuickBooks Sandbox Setup Guide

## Step 1: Create Developer Account
1. Go to https://developer.intuit.com
2. Sign up with your email
3. Complete profile setup

## Step 2: Create App
1. Navigate to "My Apps" 
2. Click "Create an App"
3. Select "QuickBooks Online and Payments"
4. Fill in app details:
   - App Name: "Pulsio Dev"
   - Description: "Document collection automation for contractors"

## Step 3: Get API Credentials
1. Go to app → "Keys & OAuth" tab
2. Copy the Sandbox credentials:
   - **Client ID** 
   - **Client Secret**
3. Add to Replit Secrets:
   - `QBO_CLIENT_ID` = your client ID
   - `QBO_CLIENT_SECRET` = your client secret

## Step 4: Configure Redirect URI
In your app settings, add redirect URI:
```
https://[your-replit-url]/api/qbo/callback
```

## Step 5: Create Sandbox Company
1. Go to "Sandbox" in developer dashboard
2. Click "Add a sandbox company"
3. Choose "QuickBooks Online Plus"
4. Select "United States"
5. Click "Add"

## Step 6: Test Connection
1. Go to your Pulsio onboarding
2. Connect to QuickBooks (will use sandbox)
3. Click "Sync Now" in dashboard
4. Watch real sample vendor data populate!

## What You'll Get
- ~20+ sample vendors with realistic names
- Bills with amounts ranging $500-$5000
- Real email addresses and phone numbers
- Contractors like "Smith Plumbing", "ABC Electric", etc.
- All the data needed to demo your MVP!

## Next Steps After Setup
1. Test the sync functionality
2. Send sample reminders
3. Upload test documents
4. Show the full workflow working