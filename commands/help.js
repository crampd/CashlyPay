const { getAdminRole } = require('../db');

module.exports = async function helpCommand(ctx) {
  let role = 'user';
  if (ctx.from) {
    try {
      role = await getAdminRole(String(ctx.from.id)) || 'user';
    } catch {}
  }

  let commands = [
    '/start - Start the bot',
    '/help - Show this help message',
    '/faq - Frequently asked questions',
    '/customers - List customers',
    '/searchcustomer - Search for a customer'
  ];

  if (['admin', 'manager'].includes(role)) {
    commands.push(
      '/addcustomer - Add a new customer',
      '/updatecustomer - Update customer details',
      '/listinvoices - List invoices for a customer',
      '/viewinvoice - View invoice details',
      '/salesreport - Show sales report',
      '/invoice - Create and send an invoice'
    );
  }

  if (role === 'admin') {
    commands.push(
      '/deletecustomer - Delete a customer',
      '/exportcustomers - Export all customers (CSV)',
      '/admins - Manage admins'
    );
  }

  commands.push(
    '\n*To use multi-step commands, follow the prompts after sending the command.*',
    '\nFor more info, use /faq.'
  );
  return ctx.reply(commands.join('\n'));
};