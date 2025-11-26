# Vercel Deployment Guide

## Pre-Deployment Checklist

- [ ] Supabase project created and SQL scripts executed
- [ ] Environment variables prepared
- [ ] Git repository created and code pushed
- [ ] OpenRouter API key obtained

## Step-by-Step Deployment

### 1. Prepare Environment Variables

You'll need these variables in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (IMPORTANT: Keep secret!)
OPENROUTER_API_KEY=sk-or-v1-...
CRON_SECRET=generate-random-string-here
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

### 2. Deploy to Vercel

1. Visit [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import your Git repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

5. Add all environment variables from above
6. Click "Deploy"

### 3. Configure Vercel Cron Job

After deployment:

1. Go to your project dashboard
2. Navigate to "Settings" → "Cron Jobs"
3. Click "Create Cron Job"
4. Configure:
   - **Path**: `/api/cron`
   - **Schedule**: `0 2 * * *` (runs at 2 AM UTC daily)
   - Or use: `0 */6 * * *` for every 6 hours
5. Add custom headers:
   - Click "Add Header"
   - Key: `x-cron-secret`
   - Value: (your CRON_SECRET value)
6. Save

### 4. Verify Deployment

1. Visit your deployed URL
2. Test authentication (sign up / sign in)
3. Create test data (accounts, transactions)
4. Verify API endpoints work:
   - `/api/accounts`
   - `/api/insights?ai=true`
   - `/api/forecast`

### 5. Monitor Cron Jobs

- Check Vercel dashboard → Deployments → Function Logs
- Verify cron runs appear in logs
- Check Supabase for generated insights

## Cron Schedule Examples

```bash
# Every hour
0 * * * *

# Every 6 hours
0 */6 * * *

# Daily at 2 AM UTC
0 2 * * *

# Every Monday at 9 AM UTC
0 9 * * 1

# First day of month at midnight
0 0 1 * *
```

## Database Migrations

When updating schema:

1. Run new SQL in Supabase SQL Editor
2. Update TypeScript types if needed
3. Redeploy in Vercel (auto-triggers on git push)

## Troubleshooting

### Build Fails

Check build logs for:
- Missing dependencies: Run `npm install` locally
- TypeScript errors: Fix in code before pushing
- Environment variables: Ensure all are set in Vercel

### API Routes Return 500

- Check Vercel Function Logs for stack traces
- Verify Supabase credentials
- Ensure RLS policies allow service role access

### Cron Not Running

- Verify cron schedule syntax
- Check `x-cron-secret` header matches environment variable
- Review Function Logs for errors

### OpenRouter API Fails

- Verify API key is valid
- Check OpenRouter dashboard for rate limits
- Ensure sufficient credits

## Performance Optimization

1. **Edge Functions**: Move read-only API routes to Edge runtime for faster response
2. **ISR**: Use Incremental Static Regeneration for dashboard pages
3. **CDN**: Vercel automatically handles static asset caching
4. **Database Indexing**: Ensure indexes exist on frequently queried columns (already in schema.sql)

## Security Best Practices

1. Never commit `.env.local` to Git
2. Rotate `CRON_SECRET` periodically
3. Use `SUPABASE_SERVICE_ROLE_KEY` only on server
4. Enable Vercel Protection (Pro plan) for production
5. Set up Supabase Auth webhooks for user lifecycle events

## Monitoring & Alerts

1. **Vercel Analytics**: Enable in project settings
2. **Supabase Logs**: Monitor query performance
3. **OpenRouter Usage**: Track API costs
4. **Error Tracking**: Consider integrating Sentry

## Backup Strategy

1. **Database**: Enable Supabase automatic backups (Pro plan) or use pg_dump
2. **Code**: Git repository serves as code backup
3. **User Data**: Implement export functionality for users

## Scaling Considerations

- **Vercel**: Automatically scales functions
- **Supabase**: Monitor connection pool limits
- **OpenRouter**: Consider implementing request queue for high usage

---

Your app should now be live at `https://your-app.vercel.app`! 🎉
