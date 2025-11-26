# Quick Start Guide

Get FinSight running in 10 minutes.

## Prerequisites

- Node.js 18+ installed
- Git installed
- A Supabase account
- An OpenRouter API key

## Step 1: Install Dependencies

```powershell
cd e:\Orders\Project\FinSight
npm install
```

## Step 2: Setup Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to initialize
3. Go to SQL Editor
4. Run each SQL file in order:
   - Copy contents of `scripts/supabase/schema.sql` → Execute
   - Copy contents of `scripts/supabase/rls.sql` → Execute
   - Copy contents of `scripts/supabase/functions.sql` → Execute
5. Go to Settings → API to get your keys

## Step 3: Get OpenRouter API Key

1. Visit [openrouter.ai](https://openrouter.ai)
2. Sign up / Sign in
3. Go to Keys → Create New Key
4. Copy the key (starts with `sk-or-v1-`)

## Step 4: Configure Environment

Create `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
OPENROUTER_API_KEY=sk-or-v1-...
CRON_SECRET=my-super-secret-string-123
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Replace `xxxxx`, `eyJhbGc...`, and `sk-or-v1-...` with your actual values.

## Step 5: Run Development Server

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 6: Create Your First Account

1. Click "Sign Up"
2. Enter email and password
3. Check your email for confirmation link
4. Sign in
5. Go to Dashboard
6. Use the API or build UI to create accounts

## Quick API Test

Test the API using PowerShell:

```powershell
# Get session token (after logging in via UI)
$token = "your-supabase-session-token"

# Create an account
Invoke-RestMethod -Uri "http://localhost:3000/api/accounts" -Method POST -Headers @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
} -Body '{"name":"My Bank","type":"bank","initial_balance":5000}'

# List accounts
Invoke-RestMethod -Uri "http://localhost:3000/api/accounts" -Method GET -Headers @{
    "Authorization" = "Bearer $token"
}
```

## Next Steps

- Read `README.md` for full documentation
- Check `API_DOCS.md` for API reference
- See `DEPLOYMENT.md` for production deployment
- Review `FEATURES.md` for complete feature list

## Common Issues

### "Cannot find module 'next'"
Run: `npm install`

### Database connection error
Check your Supabase URL and keys in `.env.local`

### OpenRouter API error
Verify your API key and ensure you have credits

### Port 3000 already in use
Use: `npm run dev -- -p 3001` (or any other port)

## Getting Help

- Check the README.md troubleshooting section
- Review the code comments
- Check Supabase logs for database errors
- Check browser console for client errors
- Check Vercel function logs (production)

---

**You're all set! 🎉**

Start by creating accounts, adding transactions, and exploring the AI-powered insights.
