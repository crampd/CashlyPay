# AI Agent Instructions for Cashly/Fynance

This document provides essential guidance for AI agents working with the Fynance codebase.

## Project Overview

Fynance is an Express.js web application that demonstrates Square's Invoices API integration. It allows a contracting company to manage customers and create invoices with various configuration options.

### Key Components

- **Express Web Server** (`app.js`): Main application entry point
- **Square Integration** (`util/square-client.js`): Handles Square API client configuration and interactions 
- **Routes** (`routes/`): API endpoints for invoice and customer management
- **Views** (`views/`): Pug templates for the web interface
- **Public Assets** (`public/`): Static files and stylesheets

## Critical Development Workflows

1. **Environment Setup**
   ```bash
   # Required: Node.js v14+ and npm
   npm install
   # Create .env file with Square credentials
   echo "SQUARE_ACCESS_TOKEN=your-token" > .env
   ```

2. **Development Mode**
   - Application expects `.env` file in project root
   - Uses Square Sandbox environment by default
   - Run with `npm start` or `node ./bin/www`

3. **Data Seeding**
   - Use `npm run seed` to populate test data
   - Creates two sample customers:
     - Ryan Nakamura (with card on file)
     - Kaitlyn Spindel (without card)
   - Clear test data with `npm run seed clear`
   - Note: Only works in sandbox environment

## Key Integration Points

1. **Square API Integration**
   - Client initialization happens in `util/square-client.js`
   - Environment-aware configuration (Sandbox vs Production)
   - Handles token management and API client setup

2. **Invoice Management**
   - Routes defined in `routes/invoice.js`
   - Supports invoice creation, listing, and processing
   - Integrates with Square Customer Directory

## Project-Specific Patterns

1. **Error Handling**
   - Square API errors are processed in route handlers
   - Generic errors render `views/error.pug`
   - Check `util/square-client.js` for API error handling examples

2. **View Rendering**
   - Uses Pug templating engine
   - Layout inheritance from `views/layout.pug`
   - Common styles in `public/stylesheets/main.css`

3. **Data Flow**
   - Customer data fetched from Square's Customer Directory
   - Invoice data managed through Square's Invoices API
   - State maintained through API calls (no local database)

## Security Considerations

1. Access tokens must be secured in `.env` file (never commit)
2. Production deployments should use OAuth for Square account access
3. All API calls use Square's official Node.js SDK

## Common Tasks

1. **Adding New Routes**
   - Create route file in `routes/`
   - Register in `app.js`
   - Add corresponding view in `views/`

2. **Modifying Invoice Logic**
   - Update handlers in `routes/invoice.js`
   - Reference Square API docs for available fields
   - Test in Sandbox environment first

3. **UI Changes**
   - Modify Pug templates in `views/`
   - Update styles in `public/stylesheets/`
   - Follow existing patterns for consistency