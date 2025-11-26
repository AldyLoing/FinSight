# FinSight Project Architecture

## Overview

FinSight is a full-stack personal finance intelligence system built with modern web technologies. The architecture follows a **serverless** approach using Next.js App Router with server-side API routes, Supabase for database and authentication, and OpenRouter for AI capabilities.

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: React Hooks (local state)
- **Charts**: Recharts (to be integrated)

### Backend
- **API**: Next.js API Routes (serverless functions)
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for future file uploads)
- **Cron Jobs**: Vercel Cron

### AI/ML
- **Provider**: OpenRouter
- **Models**: Claude 3 Sonnet, GPT-4 (configurable)
- **Approach**: Server-side only, anonymized data

### Infrastructure
- **Hosting**: Vercel (serverless)
- **Database Hosting**: Supabase
- **CDN**: Vercel Edge Network
- **Monitoring**: Vercel Analytics (optional)

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                               │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │   Browser      │  │  Mobile App    │  │   Desktop     │ │
│  │   (React)      │  │  (Future)      │  │   (Future)    │ │
│  └────────┬───────┘  └────────┬───────┘  └───────┬───────┘ │
│           │                   │                   │          │
└───────────┼───────────────────┼───────────────────┼──────────┘
            │                   │                   │
            └───────────────────┴───────────────────┘
                                │
                    ┌───────────▼──────────────┐
                    │   VERCEL EDGE NETWORK    │
                    │   (Next.js App Router)   │
                    └───────────┬──────────────┘
                                │
            ┌───────────────────┴───────────────────┐
            │                                       │
┌───────────▼──────────┐              ┌────────────▼──────────┐
│  API ROUTES          │              │  PAGES (SSR/CSR)      │
│  (Serverless)        │              │  - Landing            │
│  - /api/accounts     │              │  - Dashboard          │
│  - /api/transactions │              │  - Auth (Login/Signup)│
│  - /api/budgets      │              └───────────────────────┘
│  - /api/goals        │
│  - /api/debts        │
│  - /api/insights     │
│  - /api/forecast     │
│  - /api/ai           │
│  - /api/cron         │
└───────────┬──────────┘
            │
    ┌───────┴────────┐
    │                │
┌───▼────────┐  ┌────▼────────┐
│  SUPABASE  │  │  OPENROUTER │
│  ┌───────┐ │  │             │
│  │ Auth  │ │  │  AI Models  │
│  └───────┘ │  │  - Claude   │
│  ┌───────┐ │  │  - GPT-4    │
│  │  DB   │ │  └─────────────┘
│  │(RLS)  │ │
│  └───────┘ │
│  ┌───────┐ │
│  │Storage│ │
│  └───────┘ │
└────────────┘
```

## Data Flow

### 1. User Authentication Flow
```
User → Login Page → Supabase Auth → JWT Token → Cookies → Protected Routes
```

### 2. Transaction Creation Flow
```
User Input → API Route → Validation → Database Insert → Trigger (Balance Update) → Response
```

### 3. Insight Generation Flow
```
Cron Job → API /cron → Fetch Data → Run Local Algorithms → Insert Insights → (Optional) AI Explanation
```

### 4. AI Analysis Flow
```
User Request → API /ai → Summarize Data → Anonymize → OpenRouter API → Structured Response → User
```

## Database Architecture

### Entity Relationship Diagram

```
users (Supabase Auth)
  │
  ├─── accounts
  │      │
  │      └─── transactions
  │             │
  │             └─── transaction_splits ───── categories
  │
  ├─── budgets ───── categories
  │      │
  │      └─── budget_history
  │
  ├─── goals
  │
  ├─── debts
  │
  ├─── insights
  │
  ├─── forecasts
  │
  ├─── rules
  │
  ├─── notifications
  │
  └─── user_preferences
```

### Key Relationships

- **1:N** - One user has many accounts, budgets, goals, debts
- **1:N** - One account has many transactions
- **1:N** - One transaction has many splits
- **N:1** - Many splits belong to one category
- **1:1** - Transfer transactions are linked (transfer_transaction_id)

### Row-Level Security (RLS)

Every table has RLS policies that enforce:
```sql
WHERE user_id = auth.uid()
```

This ensures users can only access their own data, even with direct database access.

## API Layer Architecture

### Request Lifecycle

```
1. Request arrives at Vercel Edge
2. Next.js routes to API handler
3. Supabase client initialized
4. User authenticated (JWT validation)
5. Business logic executed
6. Database operations performed
7. Response formatted and returned
```

### Error Handling

```typescript
try {
  // Business logic
  return NextResponse.json({ data }, { status: 200 });
} catch (error: any) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}
```

## Business Logic Layer

Located in `lib/finance/`, this layer contains pure TypeScript functions that implement:

1. **Account Management** (`accounts.ts`)
   - Net worth calculation
   - Asset/liability classification
   - Balance reconciliation

2. **Transaction Processing** (`transactions.ts`)
   - Split validation
   - Recurring schedule generation
   - Cashflow analysis

3. **Budget Intelligence** (`budgets.ts`)
   - Status calculation
   - Adaptive suggestions
   - Carry-over logic

4. **Goal Simulation** (`goals.ts`)
   - Progress tracking
   - Time-to-completion calculation
   - Recommendation generation

5. **Debt Strategies** (`debts.ts`)
   - Snowball simulation
   - Avalanche simulation
   - Interest calculation

6. **Insight Engine** (`insights.ts`)
   - Anomaly detection (Z-score)
   - Trend analysis
   - Risk warnings

7. **Forecasting** (`forecast.ts`)
   - Cashflow prediction
   - Risk classification
   - Scenario analysis

8. **AI Integration** (`ai.ts`)
   - Data summarization
   - Anonymization
   - OpenRouter API calls

9. **Automation** (`automation.ts`)
   - Cron job orchestration
   - Rule execution

## Security Architecture

### Authentication
- **Method**: Supabase Auth (JWT)
- **Storage**: HTTP-only cookies
- **Expiry**: Configurable (default 1 hour)

### Authorization
- **Database**: Row-Level Security (RLS)
- **API**: User ID validation on every request
- **Cron**: Secret header validation

### Data Protection
- **In Transit**: HTTPS/TLS
- **At Rest**: Supabase encryption
- **AI Processing**: Anonymized summaries only

### Environment Variables
- **Client**: `NEXT_PUBLIC_*` (safe to expose)
- **Server**: All others (never sent to client)

## Scalability Considerations

### Horizontal Scaling
- ✅ Serverless functions auto-scale
- ✅ Database connection pooling via Supabase
- ✅ CDN caching for static assets

### Database Optimization
- ✅ Indexes on frequently queried columns
- ✅ Triggers for real-time balance updates
- ✅ Partitioning strategy (future: by user_id)

### Performance
- **Target**: < 200ms API response time
- **Database**: < 50ms query time
- **AI**: < 3s for insights (asynchronous)

## Monitoring & Observability

### Logging
- **Client**: Browser console (dev only)
- **Server**: Vercel function logs
- **Database**: Supabase query logs

### Metrics
- API response times
- Database query performance
- Error rates
- AI token usage

### Alerts (Future)
- Budget exceeded
- Forecast shows risk
- API errors > 5% rate
- Database CPU > 80%

## Deployment Pipeline

```
1. Code Push → GitHub
2. Vercel detects change
3. Build process:
   - Install dependencies
   - TypeScript compilation
   - Next.js build
   - Static optimization
4. Deploy to Edge Network
5. Environment variables injected
6. Health checks
7. Traffic switched to new deployment
```

### Rollback Strategy
- Instant rollback via Vercel dashboard
- Previous deployments kept for 7 days
- Database migrations require manual rollback

## Future Architecture Enhancements

### Phase 2
- [ ] Redis cache layer for frequently accessed data
- [ ] Elasticsearch for transaction search
- [ ] WebSocket for real-time updates
- [ ] Message queue (RabbitMQ/SQS) for async jobs

### Phase 3
- [ ] Microservices for heavy computations
- [ ] Machine learning model training pipeline
- [ ] Data warehouse for analytics
- [ ] Multi-region deployment

## Development Workflow

### Local Development
```
1. Run Supabase locally (optional)
2. npm run dev
3. Access http://localhost:3000
4. Hot reload enabled
```

### Testing (Future)
```
1. Unit tests (Jest)
2. Integration tests (Playwright)
3. E2E tests (Cypress)
4. Load tests (k6)
```

### CI/CD
```
GitHub → Vercel (automatic)
- Linting
- Type checking
- Build verification
- Deploy to preview
- Manual promotion to production
```

## Code Organization Principles

1. **Separation of Concerns**: API ↔ Business Logic ↔ Database
2. **Type Safety**: TypeScript throughout
3. **Modularity**: Small, focused modules
4. **Reusability**: Shared utilities and models
5. **Documentation**: Inline comments for complex logic

## Performance Optimization

### Database
- Indexed columns for fast queries
- Materialized views for complex aggregations (future)
- Query result caching

### API
- Server-side rendering where appropriate
- Incremental Static Regeneration for dashboards
- API response caching (future)

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Font optimization

## Compliance & Privacy

- **GDPR**: User data export and deletion capabilities
- **CCPA**: California privacy rights support
- **PCI DSS**: Not applicable (no card storage)
- **SOC 2**: Via Supabase compliance

---

**This architecture is designed to scale from MVP to enterprise while maintaining security, performance, and developer experience.**
