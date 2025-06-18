const { deleteCustomerByEmail } = require('../db');

module.exports = async function deleteCustomerCommand(ctx) {
  ctx.session.deleteCustomer = true;
  return ctx.reply('Enter customer email to delete:');
};

module.exports.handleMessage = async function (ctx) {
  if (!ctx.session.deleteCustomer) return;
  const email = ctx.message.text.trim();
  try {
    const deleted = await deleteCustomerByEmail(email);
    ctx.session.deleteCustomer = null;
    if (!deleted) return ctx.reply('Customer not found or already deleted.');
    return ctx.reply('✅ Customer deleted.');
  } catch (err) {
    ctx.session.deleteCustomer = null;
    return ctx.reply('❌ Failed to delete customer: ' + err.message);
  }
};