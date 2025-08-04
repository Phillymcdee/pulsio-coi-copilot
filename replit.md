# Pulsio - Automated Document Collection for Contractors

## Overview
Pulsio is a full-stack web application designed to automate the collection of W-9s and Certificates of Insurance (COIs) from subcontractors for trade-service contractors. It integrates with QuickBooks Online to help users capture early-payment discounts, avoid IRS penalties, and reduce administrative overhead by tracking missing documents and sending automated reminders. The project aims to be a comprehensive, production-ready SaaS platform.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
Pulsio is built as a modern full-stack monorepo application.

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