# Ani3Lix - Anime Streaming Platform

## Overview
Ani3Lix is a comprehensive anime streaming platform built with Next.js 14, TypeScript, and PostgreSQL. The platform allows users to discover, watch, and manage their anime watchlist while providing admin tools for content management.

## Project Architecture

### Technology Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: PostgreSQL (Neon serverless) via Drizzle ORM
- **Authentication**: Passport.js with bcrypt password hashing
- **External APIs**: AniList GraphQL API for anime metadata

### Project Structure
```
.
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles and Tailwind
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
│   ├── api.ts           # API helpers
│   ├── queryClient.ts   # React Query configuration
│   └── utils.ts         # General utilities
├── server/              # Backend logic
│   ├── routes.ts       # API routes
│   ├── storage.ts      # Database layer (PostgreSQL)
│   ├── middleware/     # Auth and other middleware
│   └── services/       # External service integrations
├── shared/             # Shared types and schemas
│   └── schema.ts       # Drizzle database schema
└── next.config.js      # Next.js configuration
```

## Database Schema

The platform uses PostgreSQL with the following main tables:

- **users**: User accounts with role-based access control (user, moderator, admin, site_owner)
- **anime**: Anime metadata from AniList API
- **episodes**: Episode information with external video URLs
- **watch_history**: Track user viewing progress
- **watchlist**: User's planned anime to watch
- **favorites**: User's favorite anime
- **comments**: Nested comment system
- **posts**: Community discussions
- **role_permissions**: Audit trail for role changes

## Environment Setup

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (already configured in Replit)
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment mode (development/production)

### Database Management
```bash
# Push schema changes to database
npm run db:push

# Type checking
npm run check
```

## Running the Application

### Development Mode
The application is configured to run on port 5000 (the only non-firewalled port in Replit):

```bash
npm run dev
```

This starts the Next.js development server on `0.0.0.0:5000`, making it accessible through Replit's webview.

### Production Build
```bash
npm run build
npm run start
```

## Deployment

The application is configured for deployment with:
- **Target**: Autoscale (stateless)
- **Build**: `npm run build`
- **Start**: `npm run start`
- **Port**: 5000 (configured for Replit environment)

## Key Features

### Current Implementation
- ✅ Home page with platform overview
- ✅ Database schema for all core features
- ✅ PostgreSQL integration with Drizzle ORM
- ✅ Authentication infrastructure (Passport.js)
- ✅ Role-based access control system
- ✅ Responsive design with Tailwind CSS

### Planned Features (See Development Checklist)
- User registration and login
- Anime content management (admin panel)
- Video player integration
- Watch history and progress tracking
- Community features (comments, discussions)
- Content moderation tools

## Development Notes

### Next.js Configuration
- Uses App Router (Next.js 14+)
- Configured for 0.0.0.0 binding (required for Replit proxy)
- Image optimization enabled for anime artwork
- Standalone output for deployment

### Database Best Practices
- Use Drizzle ORM for all database operations
- Never modify primary key types in existing tables
- Use `npm run db:push` to sync schema changes
- All timestamps use `defaultNow()` for consistency

### Code Style
- TypeScript strict mode enabled
- Comprehensive inline comments throughout codebase
- ESLint and Prettier configured for consistency
- All components include data-testid attributes for testing

## Recent Changes
- **2025-10-02**: Initial project import and Replit configuration
  - Fixed TypeScript errors in storage layer
  - Updated .gitignore for Next.js patterns
  - Configured workflow for port 5000 with webview output
  - Set up deployment configuration
  - Database schema already pushed and synced

## User Preferences
- Keep comprehensive inline comments in all code
- Follow security best practices
- Use authentic data (no mocks in production)
- Maintain responsive design across all features
