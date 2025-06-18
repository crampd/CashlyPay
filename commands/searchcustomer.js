const { searchCustomers } = require('../db');

module.exports = async function searchCustomerCommand(ctx) {
  ctx.session.searchCustomer = true;
  return ctx.reply('Enter name, email, or phone to search:');
};

module.exports.handleMessage = async function (ctx) {
  if (!ctx.session.searchCustomer) return;
  const query = ctx.message.text.trim();
  try {
    const results = await searchCustomers(query);
    ctx.session.searchCustomer = null;
    if (!results.length) return ctx.reply('No customers found.');
    return ctx.reply(
      results.map(c =>
        `👤 ${c.name}\n📧 ${c.email}\n📞 ${c.phone || ''}\n🏠 ${c.address || ''}`
      ).join('\n\n')
    );
  } catch (err) {
    ctx.session.searchCustomer = null;
    return ctx.reply('❌ Search failed: ' + err.message);
  }
};