# Norden Finance Product Roadmap

## Register

product

## Product Vision

Norden Finance is a premium SaaS personal finance tracker for individuals. It helps users understand, control, and improve their financial condition through fast transaction capture, strong analytics, and healthy financial habits.

Norden is not an investment app, crypto tracker, stock tracker, social finance app, community platform, family finance app, team finance app, or expense-sharing tool.

## Core Priorities

- Fast natural language transaction input.
- Useful financial analytics.
- Habit formation and retention.
- Trial to Pro monetization.
- Safe, modern, scalable account and admin flows.

## MVP Feature Scope

### Smart Input

Users can enter natural language such as `10k middleman bni`, `50k jualan dana`, `ayam geprek 18k cash`, or `saldo bni 150k`.

The system detects amount, transaction type, wallet, category, note, and date. Inputs beginning with `saldo` update a wallet balance instead of creating a transaction.

### Receipt Scanner

Users can upload a receipt image. AI OCR extracts merchant, total payment, date, and purchased items.

### Wallet Management

Users can manage multiple wallets: BCA, BNI, DANA, OVO, GoPay, Cash, and custom wallets. Wallet workflows include add, edit, archive, and restore.

### Dashboard And Analytics

The dashboard shows total balance, current-month income, current-month expenses, cashflow, expense charts, and largest categories.

Analytics include Financial Health Score, Monthly Financial Snapshot, and a Financial Timeline view of transactions.

### Transaction System

Transactions support create, read, update, and soft delete. After a transaction is created, the UI shows an undo action for 5 seconds.

Global search should cover transactions, wallets, categories, hashtags, and notes.

### Templates And Automation

Transaction templates support create, edit, delete, favorite, and recently used states.

Recurring transactions support subscriptions, rent, internet, salary, and other scheduled transactions.

### Planning

Planning features include budgets by category, saving goals, wishlist items, and an emergency fund tracker with 3-month, 6-month, and 12-month targets.

### Debt And Billing

Users can track debts, receivables, installments, paylater limits and bills, due dates, and subscriptions.

### Retention

Retention features include smart reminders, in-app notifications, email reminders, transaction streaks, and achievements.

### AI Features

Norden AI Parser structures natural language transactions. Norden AI Receipt Scanner reads receipts. Norden AI Financial Insights explains spending changes, largest categories, and possible savings.

### Export And Reporting

Users can export CSV and JSON. Monthly PDF reports include income, expenses, charts, largest category, and ending balance.

### Authentication And Onboarding

Authentication uses Firebase Auth with register, login, logout, forgot password, and email verification.

The flow is register, verify email, login, onboarding. Onboarding captures name, first wallet, and opening balance.

### Subscription And Payment

Plans are Trial (14 days), Pro Monthly, and Pro Yearly. There is no Free plan.

Payment methods are BCA, BNI, and QRIS. Users upgrade, transfer, upload proof, then wait for admin review and approval.

### Admin Control Center

Admins can view platform statistics, manage users and roles, approve or reject payments, manage feedback, and manage payment configuration.

### Legal And Account Management

Legal pages live at `/legal/privacy` and `/legal/terms`. Registration requires Terms of Service and Privacy Policy agreement.

Delete account flow: settings, delete account, type `DELETE`, confirm password, delete data.

## Out Of Scope For MVP

- WhatsApp bot multi-user.
- Crypto tracking.
- Stock tracking.
- Social finance.
- Community features.
- Family finance.
- Team finance.
- Expense sharing.

## Design Principles

- Speed is a feature.
- Financial figures must be clear and high contrast.
- Positive and negative amounts need obvious visual cues.
- The UI should feel premium, modern, focused, and trustworthy.
- Avoid cluttered banking UI, spreadsheet-heavy dashboards, and accounting-app complexity.
