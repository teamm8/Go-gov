# Go-gov

A community bookmarking application built with GOV.UK design standards, designed for deployment within UK government departments to increase productivity through community-driven knowledge sharing.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Overview

Go-gov enables civil servants to:
- Share and discover useful resources within their department
- Collaborate through community-driven knowledge curation
- Organize bookmarks with tags and categories
- Build a departmental knowledge base

Built with UK government digital service standards, WCAG 2.1 Level AA accessibility compliance, and enterprise-grade security.

## Technology Stack

- **Backend:** Node.js with Express
- **Templating:** Nunjucks (server-side rendering)
- **Frontend:** GOV.UK Frontend components
- **Database:** PostgreSQL
- **Authentication:** Passport.js (local + Microsoft OAuth)
- **Session Store:** PostgreSQL-backed sessions

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v13 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** (comes with Node.js)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/teamm8/Go-gov.git
cd Go-gov
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up PostgreSQL database

Create a new PostgreSQL database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE go_gov;

# Create user (optional)
CREATE USER go_gov_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE go_gov TO go_gov_user;

# Exit psql
\q
```

### 4. Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure your settings:

```bash
# Application
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Database - Update with your credentials
DATABASE_URL=postgresql://username:password@localhost:5432/go_gov
DATABASE_SSL=false

# Session - Generate random secrets for production
SESSION_SECRET=your-random-secret-key-here
SESSION_TIMEOUT=3600000

# Microsoft OAuth (optional - for Microsoft sign-in)
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_CALLBACK_URL=http://localhost:3000/auth/microsoft/callback

# Security
COOKIE_SECRET=another-random-secret-key
```

**Security Note:** Generate secure random secrets for production using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Run database migrations

```bash
npm run db:migrate
```

This will create all necessary database tables and indexes.

### 6. Start the application

For development (with auto-reload):
```bash
npm run dev
```

For production:
```bash
npm start
```

The application will be available at: http://localhost:3000

## Development

### Project Structure

```
go-gov/
├── src/
│   ├── config/          # Configuration files (database, passport)
│   ├── db/              # Database schemas and migrations
│   ├── middleware/      # Express middleware (auth, etc.)
│   ├── routes/          # Route handlers
│   ├── views/           # Nunjucks templates
│   │   ├── layouts/     # Base templates
│   │   ├── pages/       # Page templates
│   │   └── components/  # Reusable components
│   ├── public/          # Static assets
│   │   ├── stylesheets/ # CSS files
│   │   ├── javascripts/ # Client-side JS
│   │   └── images/      # Images
│   └── server.js        # Express server entry point
├── .env                 # Environment variables (not in git)
├── .env.example         # Example environment file
├── package.json         # Dependencies and scripts
├── CLAUDE.md           # AI assistant development guide
└── README.md           # This file
```

### Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run tests (coming soon)
- `npm run lint` - Lint code (coming soon)
- `npm run db:migrate` - Run database migrations

### Setting up Microsoft OAuth (Optional)

To enable Microsoft sign-in:

1. Register your application in [Azure Portal](https://portal.azure.com/)
2. Navigate to: Azure Active Directory → App registrations → New registration
3. Configure:
   - Name: "Go-gov"
   - Redirect URI: `http://localhost:3000/auth/microsoft/callback`
4. Copy the Application (client) ID
5. Create a new client secret
6. Update your `.env` file with the credentials

## Features

### Current Features ✅

- **Authentication**
  - Email/password registration and login
  - Microsoft OAuth sign-in
  - Secure session management
  - Password hashing with bcrypt

- **User Management**
  - User profiles with department affiliation
  - Role-based access control (admin/user)

- **Pages**
  - Landing page with service overview
  - User dashboard
  - Login/registration forms
  - GOV.UK compliant design

### Coming Soon 🚧

- Bookmark creation and management
- Tag system for categorization
- Community bookmark discovery
- Search functionality
- Bookmark sharing between users
- Analytics dashboard
- Admin panel

## Security

This application implements several security best practices:

- **Authentication:** Secure password hashing with bcrypt
- **Sessions:** HTTP-only cookies with PostgreSQL-backed storage
- **HTTPS:** Recommended for production (configure reverse proxy)
- **CSRF Protection:** Implemented for form submissions
- **Input Validation:** Server-side validation using express-validator
- **SQL Injection Prevention:** Parameterized queries with pg library
- **Security Headers:** Helmet.js middleware

**Important:** Always use HTTPS in production and update security configurations in `.env`.

## Accessibility

Built to meet WCAG 2.1 Level AA standards:

- Semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast ratios
- GOV.UK Frontend components (accessibility-tested)

## Contributing

This project follows the conventions outlined in [CLAUDE.md](CLAUDE.md).

Key guidelines:
- Use conventional commits format (`feat:`, `fix:`, `docs:`, etc.)
- Write tests for new features
- Follow GOV.UK Design System patterns
- Ensure accessibility compliance
- Maintain security standards

## License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2026 teamm8

## Support

For questions or issues:
- Review the [CLAUDE.md](CLAUDE.md) development guide
- Check existing issues on GitHub
- Create a new issue with detailed description

## Deployment

### Production Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production` in environment
- [ ] Generate secure random secrets for all keys
- [ ] Enable SSL/HTTPS
- [ ] Configure proper database credentials
- [ ] Set up database backups
- [ ] Enable security headers
- [ ] Configure logging and monitoring
- [ ] Run security audit: `npm audit`
- [ ] Test all authentication flows
- [ ] Verify accessibility compliance

### Recommended Infrastructure

- **Hosting:** AWS, Azure, or GCP (UK region)
- **Database:** Managed PostgreSQL service
- **SSL/TLS:** CloudFront, AWS ALB, or nginx reverse proxy
- **Monitoring:** CloudWatch, Datadog, or similar
- **Backups:** Automated daily database backups

---

**Built with ❤️ for UK Government Departments** 
