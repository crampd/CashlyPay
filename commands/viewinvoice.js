const { getInvoiceById } = require('../db');

module.exports = async function viewInvoiceCommand(ctx) {
  ctx.session.viewInvoice = true;
  return ctx.reply('Enter invoice ID to view:');
};

module.exports.handleMessage = async function (ctx) {
  if (!ctx.session.viewInvoice) return;
  const id = ctx.message.text.trim();
  try {
    const inv = await getInvoiceById(id);
    ctx.session.viewInvoice = null;
    if (!inv) return ctx.reply('Invoice not found.');
    return ctx.reply(
      `🧾 ID: ${inv.id}\n💵 Amount: $${inv.amount}\n📄 Status: ${inv.status}\n📝 Desc: ${inv.description || ''}\n🔗 Stripe: ${inv.stripe_invoice_id ? `https://invoice.stripe.com/i/${inv.stripe_invoice_id}` : 'N/A'}`
    );
  } catch (err) {
    ctx.session.viewInvoice = null;
    return ctx.reply('❌ Failed to view invoice: ' + err.message);
  }
};