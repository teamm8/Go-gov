# Quick Start Guide

Get Go-gov running locally in 5 minutes.

## Prerequisites

- Node.js v18+
- PostgreSQL v13+

## Steps

### 1. Install dependencies

```bash
npm install
```

### 2. Create PostgreSQL database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE go_gov;
\q
```

### 3. Configure environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and update DATABASE_URL:
# DATABASE_URL=postgresql://postgres:your_password@localhost:5432/go_gov
```

### 4. Run migrations

```bash
npm run db:migrate
```

### 5. Start the server

```bash
npm run dev
```

### 6. Open your browser

Navigate to: http://localhost:3000

## What's Next?

1. Click "Create an account" to register
2. Fill in your details and create an account
3. You'll be redirected to your dashboard

## Testing Microsoft OAuth

To test Microsoft sign-in:

1. Set up an Azure AD app (see README.md for details)
2. Add credentials to `.env`
3. Restart the server
4. Click "Sign in with Microsoft" on login page

## Troubleshooting

**Database connection error?**
- Check your DATABASE_URL in .env
- Ensure PostgreSQL is running: `pg_ctl status`

**Port already in use?**
- Change PORT in .env to a different number (e.g., 3001)

**Dependencies not installing?**
- Delete node_modules and package-lock.json
- Run `npm install` again

## Development Tips

- Use `npm run dev` for auto-reload during development
- Check `src/server.js` for the main server configuration
- All routes are in `src/routes/`
- Templates are in `src/views/`

For detailed documentation, see [README.md](README.md) and [CLAUDE.md](CLAUDE.md).
