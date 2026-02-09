# Your Sofia API - AI Agent Instructions

## Important Instructions

**Do not generate summaries of completed work.** The user can see changes in the diff/file changes. Only provide summaries if explicitly requested.

## Repository Skills

This repository contains curated skill documents in `.agents/skills/` that provide domain-specific expertise. Before implementing solutions, consult the appropriate skill documentation for recommended patterns and best practices.

### Available Skills

The following skills are available in this repository:

1. **payload** - `.agents/skills/payload/` - Payload CMS specific patterns, collection configuration, and best practices
2. **vercel-composition-patterns** - `.agents/skills/vercel-composition-patterns/` - Composition patterns for Next.js and Vercel deployments
3. **vercel-react-best-practices** - `.agents/skills/vercel-react-best-practices/` - React best practices for Vercel-hosted applications
4. **web-design-guidelines** - `.agents/skills/web-design-guidelines/` - Design patterns and UI guidelines

**Before implementing features or proposing changes, consult the relevant skill documentation to ensure you follow established patterns.**

## Project Overview

A bilingual (Bulgarian/English) backend API built with Payload CMS 3.0, providing content management and services for the Your Sofia mobile application. Powers city services, news, civic engagement features, and push notifications for Sofia residents.

**Sister Repository**: [your-sofia-mobile](https://github.com/sofia-municipality/your-sofia-mobile) - React Native mobile app

## Architecture

### Tech Stack

- **CMS Framework**: Payload CMS 3.0 (Next.js 15 based)
- **Database**: PostgreSQL 17 with PostGIS extension
- **Language**: TypeScript
- **ORM**: Drizzle ORM
- **Admin Panel**: Built-in Payload Admin UI
- **API**: REST + GraphQL endpoints

### Key Features

- Bilingual content (Bulgarian/English) via Payload localization
- Geolocation support with PostGIS for news and events
- Push notification management for civic engagement
- Media management with automatic image optimization
- Role-based access control

## Critical Workflows

### Development Commands

```bash
# Start PostgreSQL with PostGIS
docker-compose -f docker-compose.postgres.yml up -d

# Start Payload CMS development server
pnpm dev                    # Runs on http://localhost:3000

# Generate TypeScript types from collections
pnpm generate:types

# Database migrations
pnpm payload migrate
pnpm payload migrate:create
```

### Environment Setup

- Admin Panel: http://localhost:3000/admin
- API Endpoints: http://localhost:3000/api
- GraphQL Playground: http://localhost:3000/api/graphql
- PostgreSQL: localhost:5432
- Required env vars in `.env`: `DATABASE_URI`, `PAYLOAD_SECRET`

## Project-Specific Conventions

### Content Localization

**Bulgarian is the default language**, not English.

**Localization applies ONLY to these standard Payload collections:**

- **News** - City news and announcements
- **Pages** - Static content pages (About, Privacy Policy, etc.)
- **Posts** - Blog-style content for civic engagement

**Other collections (Media, Users, etc.) do NOT support localization.**

For localized collections:

- Localized fields: `title`, `description`, `content`, etc.
- Locale codes: `bg` (Bulgarian, default), `en` (English)
- API requests: Include `?locale=bg` or `?locale=en` query parameter **only when querying News, Pages, or Posts**
- Admin UI: Switch languages in the editor for each localized field

**CRITICAL: Content guidelines for localized collections**

- ❌ NEVER create content in only one language
- ✅ ALWAYS provide both Bulgarian and English versions
- **Bulgarian content is the source of truth** - create it first, then translate to English
- **Always use "Твоята София" when referencing "Your Sofia" in Bulgarian content**

### Collections Structure

Located in `src/collections/`:

- **News**: City news and announcements with geolocation, topics, and publish dates
- **Media**: Image and file uploads with automatic optimization
- **Pages**: Static content pages (About, Privacy Policy, etc.)
- **Posts**: Blog-style content for civic engagement
- **Users**: Admin and editor accounts with role-based access

### Access Control

- **Public Read**: Published content accessible without authentication
- **Authenticated Write**: Only logged-in users can create/edit
- **Admin Only**: User management, settings, and sensitive operations
- Pattern: Define in collection's `access` property

### Code Formatting

- **CRITICAL**: Always read `.prettierrc.json` before generating new code
- Follow Prettier configuration:
  - No semicolons (`semi: false`)
  - Single quotes (`singleQuote: true`)
  - 2 space indentation (`tabWidth: 2`)
  - No bracket spacing (`bracketSpacing: false`)
  - ES5 trailing commas (`trailingComma: "es5"`)
  - 100 character line width (`printWidth: 100`)
- All generated code must conform to these formatting rules
- When creating new files, ensure they follow the Prettier configuration
- Run `pnpm format` if unsure about formatting

## Integration Points

### API Endpoints

**REST API:**

- News: `GET /api/news?locale=bg&where[status][equals]=published` (locale required)
- Single news: `GET /api/news/{id}?locale=bg` (locale required)
- Pages: `GET /api/pages?locale=bg` (locale required)
- Posts: `GET /api/posts?locale=bg` (locale required)
- Media: `GET /api/media` (no locale parameter - not localized)
- All collections follow pattern: `/api/{collection-slug}`
- Include `?locale=bg` or `?locale=en` parameter **only for News, Pages, and Posts**

**GraphQL:**

- Endpoint: `POST /api/graphql`
- Playground: http://localhost:3000/api/graphql
- Query example (locale required for News, Pages, Posts):

```graphql
query {
  News(locale: "bg", where: { status: { equals: "published" } }) {
    docs {
      id
      title
      description
      publishedAt
    }
  }
}
```

### Mobile App Integration

The your-sofia-mobile app consumes this API:

- Fetches news with locale parameter
- Registers push tokens for notifications
- Uploads media (profile images, signal reports)
- Authenticates users

### Push Notifications

- Collection: `pushTokens` stores device tokens with reporterUniqueId
- Hook: News `afterChange` sends targeted notifications
- Payload: Includes news title, description, and ID

## Common Pitfalls

1. **Localization**: Only News, Pages, and Posts require both Bulgarian and English - Bulgarian first. Other collections (Media, Users, etc.) are not localized
2. **Access Control**: Test with both authenticated and unauthenticated requests
3. **PostGIS**: Ensure docker-compose.postgres.yml includes PostGIS extension
4. **Type Generation**: Run `pnpm generate:types` after collection changes
5. **Migrations**: Create migrations for schema changes in production
6. **pnpm Only**: Project uses pnpm 10.18.0, not npm/yarn
7. **Environment Variables**: Never commit `.env` file with secrets

## Testing & Debugging

- Admin Panel: http://localhost:3000/admin - Create test content
- API Testing: http://localhost:3000/api/news - Direct REST endpoint access
- GraphQL Playground: Test queries and mutations
- Database: Connect with `psql` or database client to inspect data
- Logs: Payload logs appear in terminal running `pnpm dev`

## Key Files for Context

- `src/payload.config.ts` - Main Payload configuration with localization
- `src/collections/News.ts` - News collection schema with push notifications
- `src/collections/Users.ts` - User authentication and roles
- `src/access/` - Access control logic
- `src/hooks/` - Business logic hooks
- `drizzle.config.ts` - Database configuration

## Using Repository Skills

When working on this project, leverage the available skills:

- **For Payload CMS work**: Review `.agents/skills/payload/` for collection patterns, hooks, and configuration examples
- **For Next.js patterns**: Check `.agents/skills/vercel-composition-patterns/` and `.agents/skills/vercel-react-best-practices/`
- **For UI/UX**: Consult `.agents/skills/web-design-guidelines/` for design patterns

These skills contain examples, patterns, and best practices specific to the technologies used in this project. Treat them as authoritative sources for implementation guidance.
