# API Documentation

## Base URL
```
https://your-app.vercel.app/api
```

## Authentication
All API endpoints (except `/cron`) require authentication via Supabase Auth. Include the user's session token in requests.

## Endpoints

### Accounts

#### List Accounts
```http
GET /api/accounts
```

**Response**
```json
{
  "accounts": [
    {
      "id": "uuid",
      "name": "Main Checking",
      "type": "bank",
      "balance": 5000.00,
      "currency": "USD",
      "hidden": false,
      "archived": false
    }
  ]
}
```

#### Create Account
```http
POST /api/accounts
Content-Type: application/json

{
  "name": "Savings Account",
  "type": "bank",
  "currency": "USD",
  "initial_balance": 10000.00,
  "icon": "💰",
  "color": "#10b981"
}
```

#### Update Account
```http
PATCH /api/accounts/[id]
Content-Type: application/json

{
  "name": "Updated Name",
  "hidden": true
}
```

#### Delete Account
```http
DELETE /api/accounts/[id]
```

---

### Transactions

#### List Transactions
```http
GET /api/transactions?account_id=uuid&from=2024-01-01&to=2024-12-31&limit=100
```

**Query Parameters**
- `account_id` (optional): Filter by account
- `from` (optional): Start date (ISO 8601)
- `to` (optional): End date (ISO 8601)
- `limit` (optional): Max results (default: 100)

**Response**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "account_id": "uuid",
      "amount": -50.00,
      "description": "Grocery shopping",
      "merchant": "Whole Foods",
      "occurred_at": "2024-11-27T10:30:00Z",
      "transaction_splits": [
        {
          "category_id": "uuid",
          "amount": -50.00
        }
      ]
    }
  ]
}
```

#### Create Transaction
```http
POST /api/transactions
Content-Type: application/json

{
  "account_id": "uuid",
  "amount": -75.50,
  "description": "Dinner",
  "merchant": "Restaurant XYZ",
  "occurred_at": "2024-11-27T19:00:00Z",
  "splits": [
    {
      "category_id": "uuid",
      "amount": -75.50,
      "note": "Business dinner"
    }
  ]
}
```

**Transfer Transaction**
```json
{
  "account_id": "uuid-from",
  "amount": -100.00,
  "description": "Transfer to savings",
  "is_transfer": true,
  "transfer_account_id": "uuid-to",
  "occurred_at": "2024-11-27T12:00:00Z"
}
```

**Recurring Transaction**
```json
{
  "account_id": "uuid",
  "amount": -50.00,
  "description": "Netflix Subscription",
  "recurring_rule": "FREQ=MONTHLY",
  "occurred_at": "2024-11-01T00:00:00Z"
}
```

#### Update Transaction
```http
PATCH /api/transactions/[id]
Content-Type: application/json

{
  "amount": -80.00,
  "description": "Updated description",
  "reconciled": true
}
```

---

### Budgets

#### List Budgets
```http
GET /api/budgets?status=true
```

**Query Parameters**
- `status=true`: Include budget status (spent, remaining, percentage)

**Response**
```json
{
  "budgets": [
    {
      "budget": {
        "id": "uuid",
        "name": "Groceries",
        "total_amount": 500.00,
        "period": "monthly"
      },
      "spent": 350.00,
      "remaining": 150.00,
      "percentage": 70,
      "status": "on_track"
    }
  ]
}
```

#### Create Budget
```http
POST /api/budgets
Content-Type: application/json

{
  "name": "Dining Out",
  "category_id": "uuid",
  "start_date": "2024-11-01",
  "end_date": "2024-11-30",
  "period": "monthly",
  "total_amount": 300.00,
  "carry_over": true,
  "alert_threshold": 0.8
}
```

---

### Goals

#### List Goals
```http
GET /api/goals?simulation=true
```

**Query Parameters**
- `simulation=true`: Include goal simulation (months to completion)

**Response**
```json
{
  "goals": [
    {
      "id": "uuid",
      "name": "Emergency Fund",
      "target_amount": 10000.00,
      "current_amount": 3000.00,
      "monthly_contribution": 500.00,
      "simulation": {
        "months_to_target": 14,
        "estimated_completion": "2025-01-27",
        "is_achievable": true
      }
    }
  ]
}
```

#### Create Goal
```http
POST /api/goals
Content-Type: application/json

{
  "name": "Vacation Fund",
  "target_amount": 5000.00,
  "current_amount": 1000.00,
  "monthly_contribution": 300.00,
  "target_date": "2025-06-01",
  "icon": "✈️",
  "color": "#3b82f6"
}
```

---

### Debts

#### List Debts with Strategy
```http
GET /api/debts?strategy=true&extra_payment=200
```

**Query Parameters**
- `strategy=true`: Include payoff strategies
- `extra_payment`: Extra monthly payment amount

**Response**
```json
{
  "debts": [
    {
      "id": "uuid",
      "name": "Credit Card",
      "current_balance": 5000.00,
      "interest_rate": 0.1899,
      "minimum_payment": 150.00
    }
  ],
  "strategies": {
    "snowball": {
      "months_to_payoff": 24,
      "total_interest_paid": 1200.50
    },
    "avalanche": {
      "months_to_payoff": 22,
      "total_interest_paid": 980.30
    },
    "recommendation": "avalanche",
    "savings": 220.20
  }
}
```

#### Create Debt
```http
POST /api/debts
Content-Type: application/json

{
  "name": "Student Loan",
  "principal": 25000.00,
  "current_balance": 22000.00,
  "interest_rate": 0.0450,
  "interest_type": "compound",
  "minimum_payment": 300.00,
  "due_day": 15
}
```

---

### Insights

#### Get Insights
```http
GET /api/insights?acknowledged=false
```

**Query Parameters**
- `acknowledged`: Filter by acknowledgement status

**Response**
```json
{
  "insights": [
    {
      "id": "uuid",
      "type": "anomaly",
      "title": "Unusual spending at Amazon",
      "summary": "A recent transaction of $250 is 2.5x higher than usual",
      "severity": "warning",
      "acknowledged": false,
      "created_at": "2024-11-27T10:00:00Z"
    }
  ]
}
```

#### Generate Insights
```http
POST /api/insights?ai=true
```

**Query Parameters**
- `ai=true`: Include AI explanation

**Response**
```json
{
  "insights": [...],
  "ai": {
    "insights": [
      {
        "title": "Budget Risk",
        "explanation": "Your dining expenses are 85% of budget with 10 days remaining",
        "why_it_matters": "May exceed budget if current trend continues",
        "actions": [
          {
            "action": "Reduce dining out to 2 times per week",
            "estimated_impact": "Save $120",
            "difficulty": "medium"
          }
        ]
      }
    ]
  }
}
```

#### Acknowledge Insight
```http
PATCH /api/insights/[id]
```

---

### Forecast

#### Get Forecasts
```http
GET /api/forecast
```

#### Generate Forecast
```http
POST /api/forecast
Content-Type: application/json

{
  "horizon_days": 90
}
```

**Response**
```json
{
  "forecast": {
    "horizon_days": 90,
    "summary": {
      "starting_balance": 5000.00,
      "avg_daily_income": 100.00,
      "avg_daily_expense": 80.00,
      "avg_daily_net": 20.00,
      "risk_level": "low",
      "end_balance": 6800.00
    },
    "details": {
      "daily_points": [
        {
          "date": "2024-11-28",
          "predicted_balance": 5020.00,
          "confidence": 0.95
        }
      ],
      "scenarios": {
        "optimistic": 7200.00,
        "realistic": 6800.00,
        "pessimistic": 6400.00
      }
    }
  }
}
```

---

### AI

#### Get AI Insights
```http
POST /api/ai
Content-Type: application/json

{}
```

Generates AI analysis from user's financial data.

**Custom Prompt**
```json
{
  "prompt": "Explain the best way to save for retirement"
}
```

---

### Cron (Protected)

#### Run Automation Jobs
```http
POST /api/cron
x-cron-secret: your-secret
```

This endpoint:
- Processes recurring transactions
- Generates insights for all users
- Cleans up old data

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message here"
}
```

**Status Codes**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Vercel applies rate limiting based on your plan. Consider implementing application-level rate limiting for production use.

## Webhooks

Future feature: Configure webhooks to receive notifications when:
- Budgets are exceeded
- Goals are completed
- Insights are generated
- Forecasts show high risk
