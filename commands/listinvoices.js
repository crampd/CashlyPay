const { getInvoicesByEmail } = require('../db');

module.exports = async function listInvoicesCommand(ctx) {
  ctx.session.listInvoices = true;
  return ctx.reply('Enter customer email to list invoices:');
};

module.exports.handleMessage = async function (ctx) {
  if (!ctx.session.listInvoices) return;
  const email = ctx.message.text.trim();
  try {
    const invoices = await getInvoicesByEmail(email);
    ctx.session.listInvoices = null;
    if (!invoices.length) return ctx.reply('No invoices found for this customer.');
    return ctx.reply(
      invoices.map(inv =>
        `🧾 ID: ${inv.id}\n💵 Amount: $${inv.amount}\n📄 Status: ${inv.status}\n📝 Desc: ${inv.description || ''}`
      ).join('\n\n')
    );
  } catch (err) {
    ctx.session.listInvoices = null;
    return ctx.reply('❌ Failed to list invoices: ' + err.message);
  }
};