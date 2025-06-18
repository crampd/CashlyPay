const { saveCustomer, getCustomerByEmail } = require('../db');
const { createCustomer } = require('../services/stripe');

module.exports = async function addCustomerCommand(ctx) {
  ctx.session.addCustomer = { step: 1, data: {} };
  return ctx.reply('Enter customer name:');
};

module.exports.handleMessage = async function (ctx) {
  const sess = ctx.session.addCustomer;
  if (!sess) return;

  const text = ctx.message.text.trim();

  if (sess.step === 1) {
    sess.data.name = text;
    sess.step = 2;
    return ctx.reply('Enter customer email:');
  }
  if (sess.step === 2) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
      return ctx.reply('Invalid email. Please enter a valid email:');
    }
    sess.data.email = text;
    sess.step = 3;
    return ctx.reply('Enter customer phone (optional, or type skip):');
  }
  if (sess.step === 3) {
    sess.data.phone = text.toLowerCase() === 'skip' ? '' : text;
    sess.step = 4;
    return ctx.reply('Enter customer address (optional, or type skip):');
  }
  if (sess.step === 4) {
    sess.data.address = text.toLowerCase() === 'skip' ? '' : text;
    try {
      // Always create in Stripe if missing or empty stripe_customer_id
      let customer = await getCustomerByEmail(sess.data.email);
      let stripeCustomerId = (customer && customer.stripe_customer_id) ? customer.stripe_customer_id : null;

      if (!stripeCustomerId) {
        const stripeCustomer = await createCustomer(sess.data.name, sess.data.email);
        stripeCustomerId = stripeCustomer.id;
      }

      await saveCustomer({
        telegram_id: String(ctx.from.id),
        ...sess.data,
        stripe_customer_id: stripeCustomerId
      });
      ctx.session.addCustomer = null;
      return ctx.reply('✅ Customer added and saved to Stripe.');
    } catch (err) {
      ctx.session.addCustomer = null;
      return ctx.reply('❌ Failed to add customer: ' + err.message);
    }
  }
};