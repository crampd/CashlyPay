const { getAllCustomers, getCustomerByEmail } = require('../db');
const { createAndSendInvoice } = require('../services/invoiceManager');
const { InlineKeyboard } = require('grammy');

module.exports = async function invoiceCommand(ctx) {
  ctx.session.invoice = { step: 1, customer: null, desc: null, amount: null };
  const customers = await getAllCustomers();
  if (!customers.length) {
    ctx.session.invoice = null;
    return ctx.reply('No customers found. Please add a customer first.');
  }
  const keyboard = new InlineKeyboard();
  customers.slice(0, 10).forEach(c => {
    keyboard.text(`${c.name} (${c.email})`, `select_invoice_customer_${c.email}`).row();
  });
  return ctx.reply('Select a customer to invoice:', { reply_markup: keyboard });
};

module.exports.handleMessage = async function (ctx) {
  const sess = ctx.session.invoice;
  if (!sess) return;

  const text = ctx.message.text.trim();

  try {
    if (sess.step === 2) {
      sess.desc = text;
      sess.step = 3;
      return ctx.reply('Enter invoice amount:');
    }
    if (sess.step === 3) {
      const amount = parseFloat(text);
      if (isNaN(amount) || amount <= 0) return ctx.reply('Invalid amount. Please enter a positive number:');
      sess.amount = amount;
      // Create and send invoice (Stripe + DB)
      const { url, status, amount: finalAmount } = await createAndSendInvoice({
        telegram_id: String(ctx.from.id),
        name: sess.customer.name,
        email: sess.customer.email,
        description: sess.desc,
        amount: sess.amount
      });
      ctx.session.invoice = null;
      return ctx.reply(
        `✅ Invoice created and sent to ${sess.customer.email}.\n` +
        `💵 Amount: $${finalAmount}\n` +
        `📄 Status: ${status}\n` +
        `🔗 [View Invoice](${url})`,
        { parse_mode: 'Markdown' }
      );
    }
  } catch (err) {
    ctx.session.invoice = null;
    return ctx.reply('❌ Failed to create invoice: ' + err.message);
  }
};

module.exports.handleCallbackQuery = async function (ctx) {
  if (!ctx.session.invoice || ctx.session.invoice.step !== 1) return;
  const data = ctx.callbackQuery.data;
  if (!data.startsWith('select_invoice_customer_')) return;
  const email = data.replace('select_invoice_customer_', '');
  const customer = await getCustomerByEmail(email);
  if (!customer) {
    ctx.session.invoice = null;
    return ctx.reply('Customer not found.');
  }
  ctx.session.invoice.customer = customer;
  ctx.session.invoice.step = 2;
  await ctx.answerCallbackQuery();
  return ctx.reply('Enter invoice description:');
};