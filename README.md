# Cashly

**Cashly** is a modular, extensible platform for conversational AI, customer management, and automated voice workflows.  
It integrates with ElevenLabs Conversational AI, Twilio, Stripe, PayPal, Square, and Telegram to provide seamless inbound/outbound calling, invoicing, and customer engagement.

---

## Features

- **Conversational AI Voice Agent** (inbound & outbound calls)
- **Customer & Invoice Management** (multi-platform)
- **Telegram Bot Integration** (admin, staff, and customer flows)
- **Persistent Context** (remembers previous conversations)
- **PostgreSQL (Railway-ready)**
- **Modular, RESTful API** (Fastify, WebSocket, Twilio, ElevenLabs)
- **Automated Call Follow-ups & Webhooks**
- **Production-ready deployment (Railway, Render, AWS, etc.)**

---

## Quick Start

1. **Clone the repo:**
   ```bash
   git clone https://github.com/yourusername/cashly.git
   cd cashly
   ```

2. **Install dependencies:**
   ```bash
   npm install
   cd voice
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env` in both root and `/voice` directories.
   - Fill in your API keys, tokens, and webhook URLs.

4. **Deploy to Railway (recommended):**
   - Push your code to GitHub.
   - Create a new Railway project and connect your repo.
   - Add a PostgreSQL plugin and set environment variables.
   - Railway will auto-deploy your app.

5. **Set up Twilio Webhooks:**
   - In your Twilio Console, set your phone number's webhook to:
     ```
     https://your-railway-app.up.railway.app/twilio/inbound_call
     ```

6. **Start the Telegram bot:**
   ```bash
   node bot.js
   ```

---

## Directory Structure

```
/Cashly
  /commands      # Telegram bot command handlers
  /middlewares   # Express/Fastify/Grammy middlewares
  /services      # Stripe, PayPal, Square, Twilio, ElevenLabs integrations
  /voice         # Voice API (Fastify, PostgreSQL, WebSocket)
  /db            # Database logic (if not using voice/db.js)
  bot.js         # Telegram bot entrypoint
  config.js      # Configuration loader
  ...
```

---

## Voice API (`/voice`)

See [`/voice/README.md`](./voice/README.md) for full details on the conversational AI and Twilio integration.

---

## Best Practices

- Use environment variables for all secrets and API keys.
- Never commit `.env` or sensitive files.
- Use Railway or Render for easy, scalable deployment.
- Monitor logs and set up alerts for errors or downtime.
- Regularly update dependencies and review security.

---

## License

MIT License. See [LICENSE](./LICENSE) for details.