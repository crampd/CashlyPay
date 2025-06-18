module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN || 'your-telegram-bot-token',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'your-stripe-secret-key',
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'your-stripe-webhook-secret',
  ADMINS: (process.env.ADMINS ? process.env.ADMINS.split(',') : ['123456789'])
};
