# Pulsio - Automated Document Collection for Contractors

## Overview
Pulsio is a full-stack web application designed to automate the collection of W-9s and Certificates of Insurance (COIs) from subcontractors for trade-service contractors. It integrates with QuickBooks Online to help users capture early-payment discounts, avoid IRS penalties, and reduce administrative overhead by tracking missing documents and sending automated reminders. The project aims to be a comprehensive, production-ready SaaS platform.

## User Preferences
Preferred communication style: Simple, everyday language.

## Go-to-Market Execution Status
**Updated**: January 9, 2025
**Phase**: Foundation Building (Week 1 of 12)
**Progress**: 100% complete on foundational marketing and sales assets

### Completed GTM Components
- Professional landing page with ROI calculator and conversion optimization
- Comprehensive signup flow with Replit OAuth integration
- Google Analytics tracking with conversion goals and KPIs
- Content marketing assets: blog posts, case studies, lead magnets
- Sales enablement materials: prospect lists, demo scripts, CRM templates
- Marketing automation foundation with event tracking
- Vendor compliance checklist as downloadable lead magnet
- **Security & Compliance page** - Enterprise-grade security documentation with legal disclaimers
- **Unified Pricing Strategy** - Vendor-based pricing ($59-259/month) with Stripe integration and ROI guarantee
- **Competitive analysis page** - Positioning vs MyCOI, TrustLayer, Tax1099, and QBO add-ons
- **Outbound sales sequences** - Ready-to-use email and LinkedIn templates with objection handling
- **Professional Footer** - Consistent navigation across all marketing pages

### RESOLVED: Pricing Page Consolidation (January 9, 2025)
- **Issue**: Duplicate pricing pages showing conflicting information
- **Old System**: Hardcoded $99/$199/$399 feature-based pricing in Stripe service
- **New System**: Vendor-based pricing ($59/$139/$259) with limits aligned to target market
- **Changes Made**:
  - Updated Stripe service to reflect vendor-based pricing structure
  - Subscribe page now shows correct pricing with 30-day ROI guarantee
  - Old pricing page redirects to subscribe page (Stripe-integrated)
  - Footer navigation updated to point to subscribe page
  - Type definitions updated to support vendor limits and annual pricing

### Go-to-Market Assets Ready for Implementation
- **Pricing Strategy**: $59-259/month tiered by vendor count with 30-day ROI guarantee
- **Email Sequences**: Pain+ROI hook and social proof templates targeting AP/Office Managers
- **LinkedIn Outreach**: Connection and follow-up message templates
- **Objection Handling**: Responses for "we use spreadsheets", "ProAdvisor handles it", etc.
- **Security Trust**: Complete compliance documentation to remove buyer hesitation
- **Competitive Positioning**: Clear differentiation as QBO-native contractor-focused solution

### Next Priority Actions (Week 2)
- Launch direct outbound campaign to 25 qualified prospects using new sequences
- Deploy security documentation and competitive positioning to build buyer confidence
- Initiate QuickBooks ProAdvisor partnership discussions with competitive analysis
- Set up CRM system and lead tracking workflows
- Begin systematic LinkedIn and email outreach campaigns with objection handling scripts

## System Architecture
Pulsio is built as a modern full-stack monorepo application with integrated marketing and sales automation.

### Marketing Technology Stack
- **Landing Pages**: Custom React components with conversion optimization
- **Analytics**: Google Analytics 4 with custom event tracking for GTM KPIs
- **Lead Generation**: ROI calculator, compliance checklist, case studies
- **Email Marketing**: Automated sequences and nurture campaigns (setup ready)
- **CRM Integration**: Tracking templates for prospect management
- **SEO Optimization**: Blog content with targeted construction industry keywords

**Core Technologies:**
- **Frontend**: React with TypeScript (Vite)
- **Backend**: Node.js/Express with TypeScript
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: Replit OAuth
- **Styling**: Tailwind CSS with shadcn/ui
- **State Management**: TanStack Query
- **Real-time Updates**: Server-Sent Events (SSE)

**Key Components & Features:**
-   **Authentication & User Management**: Integrates Replit OAuth, PostgreSQL-backed sessions, and a mandatory user table structure.
-   **Database Schema**: Manages users, accounts, QuickBooks-synced vendors, documents (W-9s, COIs with status/expiry), reminders, bills, and timeline events for activity tracking.
-   **Frontend Architecture**: Utilizes Wouter for routing, shadcn/ui for components, React Hook Form with Zod for forms, and a mobile-first responsive design with Tailwind CSS. Real-time updates are driven by SSE.
-   **Background Services**: Employs cron jobs for automated QuickBooks sync, reminder scheduling, and COI expiry checks. Includes an in-memory event bus and Multer for document uploads.
-   **Document Collection Workflow**: Automatically syncs vendors and bills from QuickBooks, identifies missing documents, sends automated reminders via email/SMS, allows vendors to upload documents securely, and provides real-time dashboard updates.
-   **Risk Management**: Monitors COI expiry, tracks early-payment discount opportunities on bills, and assesses compliance risk based on missing documents, with an audit trail via timeline events.
-   **Monorepo Structure**: Centralizes client and server code for streamlined development and deployment.
-   **Drizzle ORM**: Ensures type-safe database queries.
-   **Server-Sent Events (SSE)**: Chosen for simpler real-time updates compared to WebSockets.
-   **Replit-Native Integration**: Leverages Replit's authentication and object storage services.
-   **Background Jobs**: Uses node-cron for reliable scheduled tasks without external dependencies.
-   **Data Integrity Solution**: Implements a hybrid data model for vendor information, separating QuickBooks source fields from active fields and using override flags to preserve user manual edits during QuickBooks syncs.

## External Dependencies
-   **Neon Database**: Serverless PostgreSQL hosting.
-   **QuickBooks Online API**: For syncing vendor and bill data.
-   **SendGrid**: For transactional email delivery and notifications.
-   **Twilio**: For SMS messaging (optional feature).
-   **Stripe**: For subscription billing and payment processing.
-   **Replit Object Storage**: For storing uploaded documents.