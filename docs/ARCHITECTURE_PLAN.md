# CashlyPay Incremental Architecture Plan

## Objectives

- Transform the Square sample app into the **CashlyPay Freelancer & Contractor Hub**.
- Keep Square as the single source of truth (no additional database layer).
- Provide a modular backend surface plus a lightweight frontend that can consume JSON APIs.
- Scaffold advanced capabilities (AI assisted invoicing, automated reminders, analytics) so they can be implemented as Square-powered flows.

## High-Level Shape

```
Express App
├── app.js                  // bootstraps middleware, static assets, API + web routes
├── controllers/
│   ├── customer-controller.js
│   ├── invoice-controller.js
│   ├── analytics-controller.js
│   └── webhook-controller.js
├── services/
│   ├── square-client.js    // wraps the Square SDK (single instance)
│   ├── customer-service.js // CRUD helpers against Customers API
│   ├── invoice-service.js  // invoice + payment flows
│   ├── analytics-service.js// insights & metrics derived from Square data
│   └── ai-service.js       // placeholder for natural language → invoice drafts
├── routes/
│   ├── index.js            // renders Pug views for existing pages
│   └── api/
│        ├── index.js       // mounts /api namespace
│        ├── customers.js   // customer CRUD endpoints
│        ├── invoices.js    // invoice lifecycle endpoints (+ AI draft)
│        ├── analytics.js   // revenue + reliability dashboards
│        └── webhooks.js    // Square webhook entry point
└── public/javascripts/
    └── dashboard.js        // fetches live metrics from /api endpoints
```

## Backend Notes

- `services/square-client.js` reads credentials from environment variables only. Inline comments point to `<SQUARE_ACCESS_TOKEN>` and `<SQUARE_APP_ID>` placeholders the user should populate in `.env`.
- Controllers are slim wrappers that validate input (via Joi later if desired) and delegate to services.
- The webhook route captures Square invoice lifecycle events. In this scaffold we simply acknowledge the webhook, but comments document where to push updates downstream (e.g., websockets).
- Automated reminders use Square’s Invoice reminder configuration and Card-on-File payment source when available.
- AI-assisted invoicing exposes `POST /api/invoices/ai` which hands off to the `ai-service`. For now it returns a deterministic draft based on a regex parser but clearly documents where to plug a hosted LLM.

## Frontend Notes

- Existing Pug templates are retained. The dashboard view is updated so it loads metrics via `public/javascripts/dashboard.js`.
- Styling keeps existing CSS pipeline (PostCSS + CSS variables).

## Configuration

- `.env.example` expanded with:
  - `SQUARE_APP_ID=<SQUARE_APP_ID>`
  - `SQUARE_ACCESS_TOKEN=<SQUARE_ACCESS_TOKEN>`
  - `SQUARE_LOCATION_ID=location-id`
  - `SQUARE_WEBHOOK_SIGNATURE_KEY=signature-key`
  - Optional: Twilio / SendGrid / AWS placeholders commented out.
- `config/config.js` updated to read the new keys and expose them through the exported object. Real secrets never land in source control.

## Work Breakdown

1. **Refactor Square client + configuration**  
   - Add new services & controllers directories.  
   - Update `app.js` to mount API routes and webhook raw-body parsing.

2. **Implement API scaffolding**  
   - Customers: list, create, retrieve, tag management via Square custom attributes.  
   - Invoices: create, publish, AI draft endpoint.  
   - Analytics: summary totals, payment timelines (computed from Square responses).  
   - Webhooks: verify signature and emit placeholders for push notifications.

3. **Frontend wiring**  
   - Update dashboard and management views to fetch from new APIs.  
   - Add dashboard interactions (quick actions, live charts) and leave hooks for AI prompt UI.  
   - Ensure copy highlights that Square hosts data; indicate manual token insertion spots.

4. **Documentation**  
   - README updates describing new routes, setup instructions, and architecture map.  
   - Mention advanced integrations (Twilio/SendGrid/S3) as optional stubs.

This plan keeps the sample app bootstrapping while layering CashlyPay features incrementally, making it easier to expand into production-grade flows later.
