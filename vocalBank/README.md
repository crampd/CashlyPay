# VocalBank (Conversational AI Voice API)

**VocalBank** is a reference implementation for integrating ElevenLabs Conversational AI with Twilio to create a production-grade, context-aware voice agent for inbound and outbound calls.

---

## Features

- **Inbound & Outbound Call Handling** (Twilio)
- **Real-time Audio Streaming** (WebSocket)
- **Persistent Conversation Context** (PostgreSQL)
- **Automated Call Follow-ups & Webhooks**
- **Easy Deployment (Railway, Render, AWS, etc.)**
- **Secure, Modular, and Extensible**

---

## Quick Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   - Copy `.env.example` to `.env`
   - Add your ElevenLabs Agent ID, API key, Twilio credentials, and PostgreSQL URL

3. **Initialize the database:**
   - Tables are auto-created on first run (PostgreSQL required, e.g. Railway plugin)

4. **Start the server:**
   ```bash
   node outbound.js
   # or for inbound call support
   node inbound.js
   ```

5. **Set up Twilio Webhooks:**
   - In your Twilio Console, set your phone number's webhook to:
     ```
     https://your-railway-app.up.railway.app/twilio/inbound_call
     ```

---

## Outbound Call Example

```bash
curl -X POST https://your-railway-app.up.railway.app/outbound-call \
-H "Content-Type: application/json" \
-d '{
   "number": "+1234567890",
   "name": "Thor",
   "prompt": "You are Eric, an outbound car sales agent. Be friendly and professional.",
   "first_message": "Hello Thor, my name is Eric, I heard you were looking for a new car! What model and color are you looking for?"
}'
```

---

## Best Practices

- Use Railway or Render for managed PostgreSQL and easy deployment.
- Never commit `.env` or secrets.
- Monitor logs and set up alerts for errors.
- Use HTTPS for all endpoints in production.

---

## Documentation

See the [official ElevenLabs Conversational AI Twilio Guide](https://elevenlabs.io/docs/conversational-ai/guides/conversational-ai-twilio) for more details.

---

## License

MIT License. See [LICENSE](../LICENSE) for details.