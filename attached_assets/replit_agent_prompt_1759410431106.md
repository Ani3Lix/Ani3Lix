# Comprehensive Development Prompt for Ani3Lix Web Application

## Project Overview

You are tasked with building Ani3Lix, a modern anime streaming platform that functions as a community hub for anime enthusiasts. This application requires a sophisticated architecture with robust user management, content moderation capabilities, and administrative controls. The platform must support role-based access control, secure authentication, and seamless integration with external anime metadata APIs.

## Critical Requirements

### Repository Structure and Code Organization

The project must be organized as a monorepo with clearly separated frontend and backend directories. Every single line of code throughout the entire application must include a descriptive comment explaining its purpose and functionality. This commenting requirement is non-negotiable and applies to all files, functions, variables, and logic blocks. The repository should maintain clean separation between concerns while sharing common TypeScript types through a dedicated shared directory.

### Technology Stack

The frontend must be built using Next.js version 14 with the App Router, TypeScript for type safety, and Tailwind CSS for styling. You should integrate the shadcn/ui component library for consistent, accessible UI components and implement Skeleton components throughout the application to display placeholders during loading states. The video player must use Video.js with all necessary plugins to create an advanced viewing experience comparable to modern streaming platforms.

The backend should utilize Next.js API Routes or a separate Node.js Express server, all written in TypeScript. Implement NextAuth.js with Supabase adapter for authentication management. All external API calls to AniList or MyAnimeList should use Axios with proper error handling and retry logic.

### Database and Storage Architecture

You must use PostgreSQL through Supabase as the database solution. The database should never store actual video files or anime episodes. Instead, it stores external links to video content that administrators add through the admin panel. The database must also handle user authentication data, comments, posts, watch history, watchlists, favorite lists, and all metadata associated with anime content fetched from external APIs.

Supabase Storage should be configured to handle user avatars and any images uploaded by users or administrators. Implement proper access policies to ensure users can only access and modify their own uploaded content while administrators have broader access rights.

### Database Schema Implementation

Create a users table with an immutable UUID primary key that serves as the unique user identifier. This identifier must be separate from the username, which users can change once per week. Store only hashed passwords using Argon2 or bcrypt algorithms. Include fields for email, display name, bio, avatar URL, role enumeration, and timestamps for creation, updates, and last username change.

The anime table should store anime information fetched from AniList API, including an anilist_id reference, title, description, cover image URL, and a status field indicating whether the anime is in draft or published state. Store flexible metadata as JSON to accommodate varying data structures from the external API. Track which administrator created the entry and maintain creation and update timestamps.

Implement an episodes table that links to the anime table through a foreign key relationship. Each episode record should contain the episode number, title, and the external video URL provided by administrators. This table enables the platform to display available episodes without hosting the actual video content.

Create comprehensive tables for watch_history that tracks user progress through episodes, including the timestamp position where they stopped watching. Implement separate watchlist and favorites tables that establish many-to-many relationships between users and anime. The comments table must support nested replies through a self-referencing parent_comment_id field and implement soft deletion to preserve conversation context even when comments are removed.

Build a posts table for community discussions, announcements, and reviews with appropriate type enumeration and pinning capability for important content. Include a role_permissions table that tracks when roles are granted and by whom, creating an audit trail for administrative actions.

### Authentication and Security Implementation

Implement industry-standard password hashing using Argon2 with appropriate cost parameters that balance security and performance. Never store plain text passwords under any circumstances. The authentication system must generate JSON Web Tokens with short-lived access tokens expiring after fifteen minutes and longer-lived refresh tokens lasting seven days. Store refresh tokens in HTTP-only cookies to prevent JavaScript access and mitigate XSS attack vectors.

Implement comprehensive rate limiting on all public endpoints to prevent brute force attacks and API abuse. Configure CORS policies that restrict API access to authorized domains, with different configurations for development and production environments. Every user input must be validated and sanitized before processing to prevent injection attacks and ensure data integrity.

Create middleware that verifies user roles before granting access to protected routes. Implement row-level security policies in Supabase to provide defense in depth at the database level. Log all authentication attempts, permission checks, and administrative actions for security auditing and troubleshooting purposes.

### Role-Based Access Control System

The platform must implement a strict four-tier role hierarchy consisting of user, moderator, admin, and site_owner roles. Regular users represent the default role with access to viewing content, managing their own profiles, and participating in community discussions. Moderators gain additional capabilities to review and delete comments, handle flagged content, and access moderation dashboards, but they cannot modify anime content or manage user roles.

Administrators possess elevated privileges including the ability to search for anime through the AniList API integration, add new anime entries in draft status, publish anime to make it visible to all users, manage episode links for all anime, and promote regular users to moderator status. Crucially, administrators cannot create other administrators or modify the site owner role.

The site owner role represents the highest authority level with exactly one user holding this role at any given time. The site owner can perform all administrative functions and uniquely possesses the ability to promote administrators and transfer the site owner role if necessary. The system must enforce these role restrictions at both the API and database levels to prevent privilege escalation.

### Admin Panel Requirements

The admin panel must be completely hidden from non-administrative users with no visible links or hints about its existence in the regular user interface. Access should be restricted through URL-based routing that requires authentication and role verification. Consider implementing IP whitelisting and two-factor authentication for additional security layers.

Within the admin panel, administrators must be able to search the AniList API in real-time as they type anime titles. Search results should display comprehensive metadata including cover images, descriptions, and episode counts. When an administrator selects an anime from search results, the system should allow them to review all metadata before saving it to the database in draft status.

The episode management interface must provide functionality for adding individual episode links or bulk importing multiple episodes through structured data formats. Each episode entry should validate that the provided URL is properly formatted and optionally check if it remains accessible. Administrators should be able to reorder episodes, update links for existing episodes, and remove episodes entirely.

Implement a content visibility workflow where newly added anime remains in draft status until an administrator explicitly publishes it. Draft content should be accessible only to administrators and the site owner for review purposes. Once published, the anime appears in the public-facing catalog with all associated episodes available for viewing.

The user management section must display paginated lists of all users with search and filtering capabilities. Administrators should view detailed user profiles showing activity history, contributions, and any moderation actions taken against them. Provide interfaces for suspending or banning users with duration options and required reason documentation. Only administrators should be able to assign moderator roles, with clear confirmation dialogs to prevent accidental role changes.

Build comprehensive moderation tools including a dashboard showing pending content reviews, flagged comments and posts, and recent moderation actions. Enable batch operations for efficiently processing multiple items. Display statistics about moderation activity and content trends to help administrators understand community health. Maintain detailed audit logs recording who performed which actions and when, ensuring accountability for all administrative decisions.

### Video Player Implementation

Integrate Video.js as the core video player with a complete plugin ecosystem. The player must support adaptive bitrate streaming to automatically adjust quality based on user connection speeds. Implement manual quality selection allowing users to override automatic quality if desired. Add playback speed controls with both preset options and custom speed input capability.

Create a custom player skin that matches the Ani3Lix brand identity and design language. The player should include comprehensive keyboard shortcuts for power users who prefer keyboard navigation. Implement subtitle support with the ability to load multiple language tracks and toggle them on or off during playback.

Build advanced features including automatic detection of intro and outro sequences with one-click skip buttons. Create next episode auto-play functionality with a countdown timer giving users the option to cancel if desired. Track watch progress continuously and save it to the user's watch history, enabling seamless resumption from any device. Display loading states clearly and implement fallback mechanisms when videos fail to load, providing helpful error messages and recovery options.

### User Features and Profile Management

Every user must be assigned an immutable UUID upon registration that serves as their permanent identifier throughout the system. This identifier remains constant even when users change their username, ensuring referential integrity across all database relationships. Users should be able to change their username once per week with the system enforcing this restriction at the database level by tracking the timestamp of the last username change.

Profile customization should include avatar upload with an integrated cropping tool allowing users to adjust framing before saving. Implement bio editing with character limits and basic text formatting capabilities. Display name customization should be separate from username with validation preventing inappropriate content. Provide a profile preview showing users exactly how their profile appears to other community members.

The watch history feature must record every episode viewed with precise timestamp tracking. Create an attractive display page showing recently watched episodes with thumbnail images and progress indicators. Implement filtering and sorting options helping users locate specific episodes they previously watched. Feature prominently on the homepage a continue watching section displaying in-progress episodes. Allow users to remove individual entries or clear their entire watch history while maintaining data privacy.

Build comprehensive watchlist and favorites management with quick-add buttons appearing on anime cards throughout the site. Design dedicated pages displaying these lists with options for grid or list views. Implement optimistic UI updates providing instant visual feedback when users add or remove items. Show status indicators revealing whether users have started watching watchlisted anime.

### Community Features

Implement a robust commenting system supporting nested replies that clearly display conversation threads. Users should be able to post comments on anime pages, edit their own comments with visible edit history, and delete their comments with confirmation dialogs. Provide reporting functionality allowing users to flag inappropriate comments for moderator review. Create pagination and multiple sorting options including newest first, oldest first, and most liked.

Build a posts and discussions system supporting different content types including general discussions, announcements from administrators, and detailed reviews. Implement category and tag systems helping organize content and improve discoverability. Feature posts prominently based on community engagement through voting or liking mechanisms. Allow post authors to edit their content with version history tracking and delete their posts when appropriate.

Moderators require specialized tools for managing community content efficiently. Create a moderation dashboard displaying pending content awaiting approval and items flagged by users. Implement bulk action capabilities allowing moderators to process multiple items simultaneously. Provide user warning systems that track violations and apply escalating consequences according to community guidelines. Maintain comprehensive logs of all moderation actions for review by administrators.

### Advertisement Integration

Design specific locations throughout the site where advertisements will appear, including homepage placements, anime detail pages, and strategic positions within the video player interface. Create placeholder components for all ad slots displaying sample dimensions and positioning information. These placeholders should use Skeleton components consistent with the site's design language.

Build the underlying infrastructure for advertisement management even though actual ads will not be displayed initially. This includes database schemas for ad units, campaigns, targeting rules, and performance tracking. Implement rotation logic ensuring fair distribution of impressions across multiple advertisers. Create hooks for tracking impressions and clicks that can be connected to analytics systems later. Design the system with future support for ad-free premium user tiers in mind.

### External API Integration

Establish a service layer abstracting all communication with the AniList GraphQL API. This layer should handle authentication, request formatting, response parsing, and error management. Implement intelligent caching strategies to minimize external API calls and improve response times. Store frequently accessed metadata in your database with periodic updates to ensure accuracy.

Build comprehensive error handling for scenarios including network failures, API rate limit exceeded, invalid responses, and service unavailability. Implement exponential backoff and retry mechanisms with maximum attempt limits. Provide administrators with clear feedback when API integration issues occur and log all API interactions for debugging purposes.

Create search functionality allowing administrators to query anime titles with real-time results appearing as they type. Implement debouncing to prevent excessive API calls during typing. Display rich metadata in search results including cover images, titles in multiple languages, descriptions, and episode counts. Allow administrators to preview full metadata before committing to adding anime to the database.

### Design and User Experience

Create a modern, visually appealing design that resonates with anime enthusiasts while maintaining professional polish. Use Skeleton components consistently throughout the application whenever data is loading, providing users with clear feedback about ongoing operations. Implement smooth transitions and subtle animations enhancing the user experience without causing distraction or performance issues.

Ensure responsive design works flawlessly across desktop, tablet, and mobile devices with layouts adapting intelligently to different screen sizes. Conduct accessibility audits ensuring keyboard navigation works throughout the site, screen readers can interpret all content properly, and color contrast meets WCAG standards. Optimize all images automatically using Next.js image components and implement lazy loading for content below the fold.

### Performance Optimization

Implement comprehensive code splitting to reduce initial bundle sizes and improve load times. Use dynamic imports for components that are not immediately needed. Configure proper caching strategies for static assets including long cache durations with cache busting through file hashing. Set up a CDN for serving static assets if deploying to production.

Optimize all database queries through proper indexing on frequently queried columns. Analyze slow queries and refactor them for better performance. Implement connection pooling to efficiently manage database connections. Use database transactions appropriately to maintain data consistency during complex operations.

Configure Next.js for optimal performance including enabling the SWC compiler, properly configuring image optimization, and implementing ISR or SSG where appropriate for content that changes infrequently. Monitor Core Web Vitals and optimize to meet or exceed recommended thresholds for Largest Contentful Paint, First Input Delay, and Cumulative Layout Shift.

### Testing and Quality Assurance

Write unit tests for all utility functions, helpers, and business logic components. Test edge cases and error conditions thoroughly. Create integration tests for all API endpoints verifying proper request handling, response formatting, authentication requirements, and error responses. Implement end-to-end tests covering critical user flows including registration, login, content browsing, video playback, and profile management.

Perform security testing including attempting SQL injection, XSS attacks, CSRF attacks, and authentication bypass. Use automated security scanning tools to identify potential vulnerabilities. Conduct manual penetration testing focusing on privilege escalation attempts and sensitive data exposure. Test rate limiting thoroughly ensuring it activates appropriately without impacting legitimate users.

Load test the application simulating hundreds of concurrent users to identify performance bottlenecks. Test database query performance under load and optimize as needed. Verify that the application gracefully handles error conditions and provides helpful feedback to users when issues occur.

### Documentation Requirements

Create comprehensive API documentation describing all endpoints, request formats, response structures, authentication requirements, and error codes. Use tools like Swagger or create detailed Postman collections that developers can import and test immediately. Document all environment variables required for both development and production environments.

Write clear setup instructions enabling new developers to clone the repository and get a working development environment running quickly. Include prerequisite software requirements, step-by-step installation procedures, and troubleshooting guidance for common setup issues. Document the database schema with entity relationship diagrams and descriptions of all tables, columns, indexes, and relationships.

Create user guides for administrators explaining how to use the admin panel effectively. Cover anime addition workflows, episode management procedures, user moderation processes, and role assignment. Write troubleshooting guides addressing common issues that may arise during operation. Document the deployment process completely including environment setup, database migration procedures, and rollback strategies.

### Error Handling and Monitoring

Implement comprehensive error handling throughout both frontend and backend. Catch exceptions at appropriate levels and provide user-friendly error messages that guide users toward resolution without exposing technical details that could aid attackers. Log all errors with sufficient context for debugging including stack traces, request details, and relevant state information.

Set up centralized logging aggregating logs from all application components. Configure log levels appropriately with verbose logging in development and more selective logging in production. Implement structured logging making logs easily searchable and analyzable. Create monitoring and alerting for critical issues including server downtime, database connection failures, external API failures, and unusual error rates.

Build user-friendly error pages for common HTTP error codes including 404 not found and 500 internal server error. These pages should maintain the site's design language, provide helpful information about what went wrong, and offer navigation options to help users recover from the error condition.

### Deployment Considerations

Configure the application for deployment to production hosting platforms with environment-specific configurations. Use environment variables for all configuration that varies between development, staging, and production. Implement proper secret management ensuring sensitive credentials never appear in code or version control.

Set up automated database backups with appropriate retention policies. Test restore procedures periodically to ensure backups are functional. Implement database migration workflows allowing schema changes to be applied safely in production. Create CI/CD pipelines that automatically test code changes and deploy to staging environments for final verification before production release.

Configure proper monitoring in production including application performance monitoring, error tracking, and user analytics. Set up alerts for critical issues that require immediate attention. Implement health check endpoints that monitoring systems can use to verify application availability and responsiveness.

## Development Approach

Begin with foundational infrastructure including project initialization, repository structure, and basic configuration. Establish the database schema in Supabase before writing application code that depends on it. Build authentication and user management next as these systems underpin all other features. Progress through anime content management, video player implementation, user features, and community features in sequence. Each phase should be completed and tested before moving to the next.

Maintain the principle that every line of code must include explanatory comments. This commenting discipline serves multiple purposes including helping you understand the code as you write it, enabling other developers to contribute effectively, and creating inline documentation that stays synchronized with the code as it evolves.

Test thoroughly at each stage rather than waiting until the end. Write tests as you build features to catch issues early when they are easier to fix. Focus on creating a stable, working implementation before optimizing for performance, as premature optimization often leads to unnecessary complexity.

## Expected Deliverables

Provide a fully functional web application meeting all specified requirements with clean, commented code throughout. Include a comprehensive README explaining project setup, configuration, and usage. Supply database migration scripts for creating the complete schema in Supabase. Create example environment variable files showing all required configuration options. Deliver basic documentation covering key features and administrative procedures.

The application should demonstrate secure authentication with role-based access control fully implemented. Show a working admin panel with all specified functionality including anime search, content management, and user moderation. Implement a functional video player with advanced features and progress tracking. Build complete user profile management with watch history, watchlists, and favorites. Create working community features including comments and posts with moderation capabilities.

## Success Criteria

The application successfully authenticates users with proper password hashing and token management. Role-based access control prevents unauthorized access to protected features. Administrators can search external APIs, add anime content, manage episodes, and control visibility. The video player streams content smoothly with quality adjustment and progress tracking. Users can manage their profiles, track viewing history, and maintain personalized lists. Community features enable discussions while moderation tools maintain healthy discourse. The application performs well under expected load with acceptable page load times and smooth interactions.

All code includes clear, descriptive comments explaining purpose and functionality. The codebase follows consistent patterns and conventions making it maintainable. Security best practices are implemented throughout including input validation, proper authentication, and protection against common vulnerabilities. The application handles errors gracefully with helpful user feedback and comprehensive logging for debugging.