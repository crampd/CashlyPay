const crypto = require('crypto');
const config = require('../config/config');

function validateSignature(signature, body) {
  const signatureKey = config.square.webhookSignatureKey;
  if (!signatureKey) {
    return true; // Skip validation if no key is configured.
  }

  if (!signature || !body) return false;

  const hmac = crypto.createHmac('sha256', signatureKey);
  hmac.update(body, 'utf8');
  const expected = hmac.digest('base64');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

async function handleSquareWebhook(req, res, next) {
  try {
    const signature = req.headers['x-square-hmacsha256-signature'];
    const rawBody = req.rawBody;

    if (!validateSignature(signature, rawBody)) {
      return res.status(401).json({ message: 'Invalid Square webhook signature.' });
    }

    const event = req.body;

    // TODO: Emit websocket updates or enqueue background jobs here.
    // For now we simply acknowledge receipt so Square stops retrying.

    res.json({ received: true, type: event?.type });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleSquareWebhook,
};
