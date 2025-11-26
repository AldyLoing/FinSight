# 💰 FinSight - Personal Finance Management System

<div align="center">

![FinSight Banner](https://img.shields.io/badge/FinSight-Financial%20Intelligence-blue?style=for-the-badge)

**A modern, comprehensive personal finance management application with multi-currency support, real-time analytics, and intelligent insights.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Usage](#-usage) • [Tech Stack](#-tech-stack) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Database Schema](#-database-schema)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

## 🌟 Overview

FinSight is a **production-ready personal finance management system** built with modern web technologies. It provides comprehensive financial tracking, multi-currency support, budget management, and intelligent insights to help users make informed financial decisions.

### Why FinSight?

- 🌍 **Multi-Currency Support** - Track finances in 9 major currencies with real-time exchange rates
- 📊 **Comprehensive Dashboard** - Beautiful visualizations and real-time analytics
- 🎯 **Budget Management** - Set budgets and track spending with smart alerts
- 🔐 **Secure & Private** - Enterprise-grade security with Supabase Row Level Security
- ⚡ **Lightning Fast** - Built with Next.js 14 Turbopack for optimal performance
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

## ✨ Features

### Core Features

#### 💳 Account Management
- Create and manage multiple accounts (Bank, Credit Card, Investment, Loan, etc.)
- Multi-currency support with automatic conversion
- Real-time balance tracking
- Institution linking and notes

#### 💸 Transaction Management
- Add income, expense, and transfer transactions
- Multi-currency transactions with automatic conversion
- Link transactions to budgets for tracking
- Advanced filtering and search
- Bulk operations support

#### 🎯 Budget Planning
- Create budgets for different categories
- Set spending limits by period (Weekly, Monthly, Yearly)
- Visual progress tracking with alerts
- Multi-currency budget support
- Automatic spent calculation

#### 🏆 Financial Goals
- Set and track financial goals
- Progress visualization
- Milestone tracking
- Goal completion celebrations

#### 💰 Debt Management
- Track all types of debt (Credit Card, Loan, Mortgage, etc.)
- Interest rate calculation
- Payment tracking
- Payoff projections

#### 📈 Analytics & Reports
- Interactive charts and graphs
- Income vs Expense analysis
- Budget performance tracking
- Account distribution visualization
- Custom date range reports

#### 🌐 Multi-Currency System
- Support for 9 major currencies:
  - 💵 USD (US Dollar)
  - 💴 IDR (Indonesian Rupiah)
  - 💶 EUR (Euro)
  - 💷 GBP (British Pound)
  - 💴 JPY (Japanese Yen)
  - 💵 SGD (Singapore Dollar)
  - 💵 MYR (Malaysian Ringgit)
  - 💴 CNY (Chinese Yuan)
  - 💵 THB (Thai Baht)
- Real-time exchange rate updates (1-hour cache)
- Automatic currency conversion across all features
- Display currency selector on every page

#### 🔒 Security
- Email/Password authentication
- Row Level Security (RLS) policies
- Secure API endpoints
- Environment variable protection

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router + Turbopack)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: Next.js API Routes (Server Actions)
- **ORM**: Supabase Client

### Infrastructure
- **Hosting**: Vercel (recommended)
- **Database Hosting**: Supabase Cloud
- **External APIs**: ExchangeRate-API (currency rates)

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account
- Git

### 1. Clone Repository

```bash
git clone https://github.com/AldyLoing/FinSight.git
cd FinSight
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: CRON secret for scheduled tasks
CRON_SECRET=your_random_secret_string
```

### 4. Database Setup

Run the database migration in your Supabase SQL Editor:

```bash
# The migration file is located at: supabase-migration.sql
```

Or run the quick setup:

```sql
-- Add currency column to budgets
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Add category column to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category TEXT;

-- Add missing columns to accounts
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS institution TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS initial_balance NUMERIC(15, 2) DEFAULT 0;
```

### 5. Run Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

### 6. Build for Production

```bash
npm run build
npm start
```

## ⚙️ Configuration

### Currency Settings

Exchange rates are fetched from [ExchangeRate-API](https://www.exchangerate-api.com/). The free tier includes:
- 1,500 requests per month
- Updates every 24 hours
- No API key required for basic usage

To use a different currency API, modify `lib/utils/currency.ts`:

```typescript
const API_URL = 'your_api_url';
```

### Supabase Configuration

1. Create a new Supabase project
2. Copy your project URL and anon key
3. Run the migration script
4. Enable Row Level Security (RLS) on all tables
5. Configure authentication providers (Email/Password enabled by default)

## 📖 Usage

### Creating Your First Account

1. Navigate to **Accounts** page
2. Click **"+ Add Account"**
3. Fill in account details:
   - Name, Type, Balance
   - Currency selection
   - Optional: Institution, Notes
4. Click **Save**

### Adding Transactions

1. Go to **Transactions** page
2. Click **"+ Add Transaction"**
3. Select:
   - Date, Description, Amount
   - Type (Income/Expense/Transfer)
   - Account and Currency
   - Optional: Category, Budget, Notes
4. Click **Save**

### Setting Up Budgets

1. Navigate to **Budgets** page
2. Click **"+ Add Budget"**
3. Configure:
   - Category name
   - Amount and Currency
   - Period (Weekly/Monthly/Yearly)
   - Alert threshold (%)
4. Track spending in real-time

### Using Multi-Currency

1. Each page has a currency selector in the header
2. Select your preferred display currency
3. All amounts automatically convert
4. Original currency preserved in database
5. Real-time exchange rates applied

## 🗄️ Database Schema

### Core Tables

#### `accounts`
- User financial accounts
- Multi-currency support
- Balance tracking

#### `transactions`
- All financial transactions
- Links to accounts and budgets
- Category and notes support

#### `budgets`
- Budget definitions
- Multi-currency budgets
- Alert thresholds

#### `goals`
- Financial goals
- Progress tracking
- Target amounts and dates

#### `debts`
- Debt tracking
- Interest rate calculations
- Payment history

### Supporting Tables

- `categories` - Transaction categorization
- `transaction_splits` - Split transactions
- `budget_history` - Historical budget data
- `forecasts` - Financial forecasting
- `notifications` - User notifications
- `rules` - Automation rules

## 🔌 API Documentation

### Authentication

All API routes require authentication via Supabase Auth.

### Endpoints

#### Accounts
```
GET    /api/accounts          - List all accounts
POST   /api/accounts          - Create account
GET    /api/accounts/[id]     - Get account details
PUT    /api/accounts/[id]     - Update account
DELETE /api/accounts/[id]     - Delete account
```

#### Transactions
```
GET    /api/transactions      - List transactions
POST   /api/transactions      - Create transaction
PUT    /api/transactions/[id] - Update transaction
DELETE /api/transactions/[id] - Delete transaction
```

#### Budgets
```
GET    /api/budgets           - List budgets
POST   /api/budgets           - Create budget
PUT    /api/budgets/[id]      - Update budget
DELETE /api/budgets/[id]      - Delete budget
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Aldy Loing**

- GitHub: [@AldyLoing](https://github.com/AldyLoing)
- Project: [FinSight](https://github.com/AldyLoing/FinSight)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React Framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [TailwindCSS](https://tailwindcss.com/) - CSS Framework
- [Recharts](https://recharts.org/) - Charting Library
- [ExchangeRate-API](https://www.exchangerate-api.com/) - Currency Exchange Rates

## 📊 Project Status

🚀 **Production Ready** - v1.0.0

### Roadmap

- [ ] AI-powered financial insights via OpenRouter
- [ ] Mobile app (React Native)
- [ ] Bank account integration
- [ ] Receipt scanning (OCR)
- [ ] Advanced reporting and exports
- [ ] Collaborative budgets
- [ ] Investment portfolio tracking

## 💬 Support

If you have any questions or need help, please:

1. Check the documentation
2. Search [existing issues](https://github.com/AldyLoing/FinSight/issues)
3. Create a [new issue](https://github.com/AldyLoing/FinSight/issues/new)

---

<div align="center">

**Made with ❤️ by Aldy Loing**

⭐ Star this repo if you find it helpful!

</div>
