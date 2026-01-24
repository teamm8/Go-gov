# CLAUDE.md - AI Assistant Development Guide

## Project Overview

**Go-gov** is a community bookmarking application built with the GOV.UK template standards, designed for deployment within UK government departments to increase productivity through community-driven knowledge sharing.

**Repository:** teamm8/Go-gov
**License:** MIT (2026)
**Current Stage:** Early Development - Project Initialization
**Primary Branch:** `main`

## Project Vision

This application aims to provide a collaborative bookmarking and knowledge-sharing platform specifically tailored for UK government departments. The system should:

- Enable civil servants to share and discover useful resources
- Foster community-driven knowledge curation
- Comply with UK government digital service standards
- Maintain high security and accessibility standards
- Support multi-tenant departmental deployments

## Current Repository State

### Existing Files
```
/
├── README.md           # Project description
├── LICENSE             # MIT License
├── .gitignore          # Node.js/JavaScript project ignore rules
└── CLAUDE.md           # This file
```

### Technology Stack Indicators

Based on the `.gitignore` configuration, this project is intended to use:

- **Runtime:** Node.js
- **Language:** JavaScript/TypeScript (recommended: TypeScript for type safety)
- **Frontend Framework:** To be determined (Next.js, React, or Vue recommended)
- **Package Manager:** npm or yarn
- **Build Tools:** Vite, webpack, or similar

**Note:** Despite the repository name "Go-gov", the current setup indicates a Node.js/JavaScript stack. The name likely refers to GOV.UK standards rather than the Go programming language.

## Recommended Architecture

### For a Government-Grade Bookmarking Application

```
go-gov/
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/             # Application pages/routes
│   ├── services/          # Business logic and API clients
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   ├── hooks/             # Custom React hooks (if React-based)
│   └── styles/            # Global styles and themes
├── public/                # Static assets
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── e2e/               # End-to-end tests
├── docs/                  # Additional documentation
├── scripts/               # Build and deployment scripts
├── .github/
│   └── workflows/         # CI/CD pipelines
├── package.json           # Project dependencies
├── tsconfig.json          # TypeScript configuration
├── .env.example           # Environment variables template
└── README.md              # User-facing documentation
```

## Development Conventions

### Code Style

1. **TypeScript First**
   - Use TypeScript for all new code
   - Maintain strict type checking (`"strict": true` in tsconfig.json)
   - Define interfaces for all data structures
   - Avoid `any` types; use `unknown` when type is truly unknown

2. **Naming Conventions**
   - **Files:** kebab-case for files (`bookmark-card.tsx`)
   - **Components:** PascalCase (`BookmarkCard`)
   - **Functions/Variables:** camelCase (`getUserBookmarks`)
   - **Constants:** UPPER_SNAKE_CASE (`MAX_BOOKMARKS_PER_USER`)
   - **Types/Interfaces:** PascalCase with descriptive names (`BookmarkItem`, `UserProfile`)

3. **Code Organization**
   - One component per file
   - Co-locate related files (component, styles, tests)
   - Group by feature, not by type (when applicable)
   - Keep files under 300 lines; refactor if larger

4. **Component Structure** (for React/Vue)
   ```typescript
   // 1. Imports
   import React from 'react';
   import { BookmarkService } from '@/services';

   // 2. Types/Interfaces
   interface BookmarkCardProps {
     title: string;
     url: string;
     tags: string[];
   }

   // 3. Component
   export const BookmarkCard: React.FC<BookmarkCardProps> = ({ title, url, tags }) => {
     // Component logic
     return (
       // JSX
     );
   };
   ```

### Git Workflow

1. **Branch Naming**
   - Feature branches: `feature/descriptive-name`
   - Bug fixes: `fix/issue-description`
   - Documentation: `docs/what-is-updated`
   - Claude branches: `claude/task-description-xxxxx` (auto-generated)

2. **Commit Messages**
   - Use conventional commits format
   - Format: `type(scope): description`
   - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
   - Examples:
     - `feat(bookmarks): add bookmark sharing functionality`
     - `fix(auth): resolve login redirect issue`
     - `docs(readme): update installation instructions`

3. **Pull Request Process**
   - Create descriptive PR titles and descriptions
   - Link related issues
   - Request reviews before merging
   - Ensure CI/CD checks pass
   - Squash commits when merging (if applicable)

### Testing Requirements

1. **Unit Tests**
   - Write tests for all utility functions
   - Test business logic in isolation
   - Aim for >80% code coverage
   - Use Jest or Vitest as test runner

2. **Integration Tests**
   - Test API integrations
   - Verify database operations
   - Test authentication flows

3. **E2E Tests**
   - Test critical user journeys
   - Use Playwright or Cypress
   - Automate accessibility checks

4. **Test File Location**
   - Co-locate tests with source: `bookmark-card.test.tsx`
   - Or use separate `tests/` directory mirroring `src/` structure

### Security Considerations

**CRITICAL:** This application is intended for UK government deployment.

1. **Authentication & Authorization**
   - Implement secure authentication (OAuth 2.0, SAML, or gov.uk Verify)
   - Use role-based access control (RBAC)
   - Never store passwords in plain text
   - Implement session management with secure cookies

2. **Data Protection**
   - Comply with GDPR and UK data protection laws
   - Encrypt sensitive data at rest and in transit
   - Implement proper input validation and sanitization
   - Prevent XSS, CSRF, SQL injection, and other OWASP Top 10 vulnerabilities

3. **API Security**
   - Use HTTPS only
   - Implement rate limiting
   - Validate all inputs server-side
   - Use API keys or tokens for service-to-service communication

4. **Dependencies**
   - Regularly audit dependencies for vulnerabilities (`npm audit`)
   - Keep dependencies up to date
   - Use lock files (`package-lock.json`)
   - Review licenses for compliance

5. **Environment Variables**
   - Never commit secrets to git
   - Use `.env` files (excluded in `.gitignore`)
   - Provide `.env.example` with dummy values
   - Use secret management for production (e.g., AWS Secrets Manager, Azure Key Vault)

### Accessibility Requirements

**CRITICAL:** Must comply with WCAG 2.1 Level AA standards.

1. **Semantic HTML**
   - Use proper heading hierarchy (h1, h2, h3)
   - Use semantic elements (`nav`, `main`, `article`, `section`)
   - Provide meaningful alt text for images

2. **Keyboard Navigation**
   - All interactive elements must be keyboard accessible
   - Visible focus indicators
   - Logical tab order

3. **Screen Reader Support**
   - Use ARIA labels where appropriate
   - Announce dynamic content changes
   - Provide skip links

4. **Color and Contrast**
   - Minimum contrast ratio of 4.5:1 for text
   - Don't rely solely on color to convey information
   - Support high contrast mode

5. **Testing**
   - Use automated tools (axe, WAVE)
   - Manual testing with keyboard only
   - Screen reader testing (NVDA, JAWS, VoiceOver)

## GOV.UK Design System Integration

### Use GOV.UK Frontend Components

1. **Installation**
   ```bash
   npm install govuk-frontend
   ```

2. **Key Components to Use**
   - Form inputs and validation
   - Buttons and navigation
   - Typography and spacing
   - Error messages and notifications
   - Tables and layouts

3. **Design Patterns**
   - Follow GOV.UK Design System patterns
   - Reference: https://design-system.service.gov.uk/
   - Maintain consistency with other government services

### Color Palette

Use the GOV.UK color palette:
- Primary: `#1d70b8` (GDS Blue)
- Text: `#0b0c0c` (Black)
- Links: `#1d70b8` (Blue)
- Success: `#00703c` (Green)
- Error: `#d4351c` (Red)

## Development Workflow for AI Assistants

### When Starting a Task

1. **Read Existing Code First**
   - Always read files before modifying them
   - Understand the context and current implementation
   - Check for existing patterns and conventions

2. **Plan Before Implementing**
   - Use TodoWrite tool for complex multi-step tasks
   - Break down large features into smaller tasks
   - Identify dependencies and potential blockers

3. **Follow the Principle of Least Change**
   - Make minimal necessary changes
   - Don't refactor unrelated code
   - Don't add features beyond what's requested
   - Don't add unnecessary abstractions

### When Writing Code

1. **Security First**
   - Validate all user inputs
   - Sanitize outputs to prevent XSS
   - Use parameterized queries to prevent SQL injection
   - Never log sensitive information
   - Check for common vulnerabilities

2. **Type Safety**
   - Define proper TypeScript types
   - Avoid `any` types
   - Use type guards for runtime checks
   - Export types for reuse

3. **Error Handling**
   - Handle errors gracefully
   - Provide meaningful error messages
   - Log errors for debugging (without sensitive data)
   - Don't expose internal errors to users

4. **Performance**
   - Avoid unnecessary re-renders (React)
   - Implement pagination for large lists
   - Use lazy loading for images and components
   - Optimize bundle size

### When Testing

1. **Write Tests Alongside Code**
   - Test new features as you build them
   - Update tests when modifying existing code
   - Run tests before committing

2. **Test Coverage**
   - Focus on critical paths
   - Test edge cases and error conditions
   - Don't aim for 100% coverage at the expense of quality

### When Committing

1. **Only Commit When Requested**
   - Don't proactively commit changes
   - Wait for explicit user instruction

2. **Commit Message Quality**
   - Write clear, descriptive messages
   - Follow conventional commits format
   - Reference issue numbers when applicable

3. **Before Committing**
   - Run linter and fix issues
   - Run tests and ensure they pass
   - Review changes with `git diff`

## API Design Guidelines

### RESTful API Conventions

1. **Endpoint Naming**
   - Use nouns, not verbs: `/bookmarks` not `/getBookmarks`
   - Use plural forms: `/bookmarks` not `/bookmark`
   - Use kebab-case for multi-word resources: `/bookmark-collections`

2. **HTTP Methods**
   - `GET` - Retrieve resources
   - `POST` - Create new resources
   - `PUT/PATCH` - Update existing resources
   - `DELETE` - Remove resources

3. **Response Format**
   ```typescript
   // Success response
   {
     "data": { /* resource data */ },
     "metadata": { /* pagination, etc. */ }
   }

   // Error response
   {
     "error": {
       "code": "VALIDATION_ERROR",
       "message": "Invalid bookmark URL",
       "details": [/* validation errors */]
     }
   }
   ```

4. **Status Codes**
   - `200` - Success (GET, PUT, PATCH)
   - `201` - Created (POST)
   - `204` - No Content (DELETE)
   - `400` - Bad Request
   - `401` - Unauthorized
   - `403` - Forbidden
   - `404` - Not Found
   - `422` - Unprocessable Entity
   - `500` - Internal Server Error

### API Documentation

- Use OpenAPI/Swagger for API documentation
- Keep documentation up to date with code
- Provide example requests and responses
- Document authentication requirements

## Database Guidelines

### Schema Design

1. **Naming Conventions**
   - Tables: plural, snake_case (`bookmarks`, `user_roles`)
   - Columns: snake_case (`created_at`, `user_id`)
   - Indexes: descriptive names (`idx_bookmarks_user_id`)

2. **Common Fields**
   - `id` - Primary key (UUID or auto-increment)
   - `created_at` - Timestamp of creation
   - `updated_at` - Timestamp of last update
   - `deleted_at` - Soft delete timestamp (if applicable)

3. **Relationships**
   - Use foreign keys to maintain referential integrity
   - Index foreign key columns
   - Consider cascade behavior for deletes

### Example Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  department_id UUID REFERENCES departments(id),
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookmarks table
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookmark tags (many-to-many)
CREATE TABLE bookmark_tags (
  bookmark_id UUID REFERENCES bookmarks(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (bookmark_id, tag_id)
);
```

## Environment Configuration

### Required Environment Variables

Create a `.env.example` file with these variables:

```bash
# Application
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/go_gov
DATABASE_SSL=false

# Authentication
AUTH_SECRET=your-secret-key-here
AUTH_PROVIDER=oauth2
AUTH_CLIENT_ID=your-client-id
AUTH_CLIENT_SECRET=your-client-secret

# Session
SESSION_SECRET=your-session-secret
SESSION_TIMEOUT=3600

# API Keys (if needed)
API_KEY=your-api-key

# Feature Flags
ENABLE_PUBLIC_BOOKMARKS=true
ENABLE_ANALYTICS=false

# Logging
LOG_LEVEL=info
```

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm audit
      - run: npm run test:security  # If you have security tests

  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:a11y  # Accessibility tests
```

## Common Tasks

### Initial Project Setup

When setting up the project for the first time:

```bash
# Initialize package.json
npm init -y

# Install TypeScript
npm install --save-dev typescript @types/node

# Initialize TypeScript config
npx tsc --init

# Install linting tools
npm install --save-dev eslint prettier

# Install testing framework
npm install --save-dev jest @types/jest ts-jest

# Install GOV.UK frontend
npm install govuk-frontend

# Create directory structure
mkdir -p src/{components,pages,services,utils,types,styles}
mkdir -p tests/{unit,integration,e2e}
mkdir -p public docs scripts
```

### Adding a New Feature

1. Create feature branch: `git checkout -b feature/bookmark-sharing`
2. Plan implementation using TodoWrite
3. Implement feature with tests
4. Run linter and tests
5. Commit changes with conventional commit message
6. Push to remote and create PR

### Running the Application

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Testing
npm test
npm run test:watch
npm run test:coverage

# Linting
npm run lint
npm run lint:fix
```

## Performance Benchmarks

### Response Time Targets

- Page load: < 2 seconds
- API responses: < 200ms (average)
- Time to interactive: < 3 seconds
- Lighthouse score: > 90

### Optimization Strategies

1. **Code Splitting**
   - Split by route
   - Lazy load non-critical components
   - Use dynamic imports

2. **Caching**
   - Cache static assets
   - Use service workers (PWA)
   - Implement API response caching

3. **Database**
   - Add appropriate indexes
   - Use connection pooling
   - Implement query optimization

## Monitoring and Logging

### Logging Levels

- `ERROR` - Application errors requiring immediate attention
- `WARN` - Warning messages for potentially harmful situations
- `INFO` - Informational messages about application progress
- `DEBUG` - Detailed information for debugging (development only)

### What to Log

- Authentication attempts (success/failure)
- API requests and responses (without sensitive data)
- Database queries (in development)
- Errors and exceptions with stack traces
- Performance metrics

### What NOT to Log

- Passwords or authentication tokens
- Personal identifiable information (PII)
- Credit card or payment information
- Session tokens or cookies
- Any data covered by GDPR

## Deployment Considerations

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Accessibility audit completed
- [ ] Performance benchmarks met
- [ ] Environment variables configured
- [ ] Database migrations prepared
- [ ] Backup strategy in place
- [ ] Rollback plan documented
- [ ] Monitoring and alerting configured

### Deployment Environments

1. **Development** - Local development
2. **Staging** - Pre-production testing
3. **Production** - Live environment

### Infrastructure Recommendations

- **Hosting:** AWS, Azure, or GCP (with UK region)
- **Database:** PostgreSQL or MySQL (managed service)
- **File Storage:** S3-compatible storage
- **CDN:** CloudFront or similar
- **Monitoring:** CloudWatch, Datadog, or New Relic

## Documentation Requirements

### Code Documentation

1. **Function Documentation**
   ```typescript
   /**
    * Retrieves bookmarks for a specific user with pagination
    * @param userId - The unique identifier of the user
    * @param page - Page number (default: 1)
    * @param limit - Number of items per page (default: 20)
    * @returns Promise resolving to paginated bookmark list
    * @throws {NotFoundError} If user doesn't exist
    */
   async function getUserBookmarks(
     userId: string,
     page: number = 1,
     limit: number = 20
   ): Promise<PaginatedBookmarks> {
     // Implementation
   }
   ```

2. **Component Documentation**
   - Document props and their purposes
   - Provide usage examples
   - Note any accessibility considerations

### Project Documentation

Keep these documents updated:
- README.md - Project overview, setup, and usage
- CLAUDE.md - This file, AI assistant guidelines
- API.md - API documentation (when API is implemented)
- CONTRIBUTING.md - Contribution guidelines (if open for contributions)
- CHANGELOG.md - Version history and changes

## Troubleshooting Guide

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Check for TypeScript errors: `npx tsc --noEmit`

2. **Test Failures**
   - Ensure test database is properly configured
   - Check for environment variable issues
   - Verify test data fixtures are valid

3. **Performance Issues**
   - Profile with browser DevTools
   - Check for memory leaks
   - Review database query performance
   - Analyze bundle size: `npm run build -- --analyze`

## AI Assistant Best Practices

### Do's

- ✅ Read files before modifying them
- ✅ Follow existing code patterns and conventions
- ✅ Write tests for new functionality
- ✅ Use TodoWrite for complex multi-step tasks
- ✅ Prioritize security and accessibility
- ✅ Make minimal, focused changes
- ✅ Ask for clarification when requirements are unclear
- ✅ Use TypeScript with proper types
- ✅ Follow GOV.UK Design System guidelines
- ✅ Check for OWASP vulnerabilities
- ✅ Validate and sanitize all inputs

### Don'ts

- ❌ Don't commit without explicit user request
- ❌ Don't refactor unrelated code
- ❌ Don't add features beyond what's requested
- ❌ Don't use `any` types unnecessarily
- ❌ Don't skip writing tests
- ❌ Don't create premature abstractions
- ❌ Don't commit secrets or sensitive data
- ❌ Don't ignore accessibility requirements
- ❌ Don't bypass security measures
- ❌ Don't make assumptions about user intent

## Resources

### Official Documentation

- [GOV.UK Design System](https://design-system.service.gov.uk/)
- [GOV.UK Service Manual](https://www.gov.uk/service-manual)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

### Development Tools

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Jest Testing Framework](https://jestjs.io/)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)

## Version History

- **v1.0.0** (2026-01-24) - Initial CLAUDE.md creation
  - Documented project vision and architecture
  - Established development conventions
  - Defined security and accessibility requirements
  - Created AI assistant guidelines

---

**Last Updated:** 2026-01-24
**Maintained By:** teamm8
**For Questions:** Refer to project README.md or repository issues
