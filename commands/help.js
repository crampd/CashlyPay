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
    '/customers - Customer management menu',
    '/invoice - Invoice management menu'
  ];

  if (['admin', 'manager'].includes(role)) {
    commands.push(
      '/salesreport - Show sales report'
    );
  }

  if (role === 'admin') {
    commands.push(
      '/admins - Manage admins'
    );
  }

  commands.push(
    '\n*Use the inline menu for all customer and invoice actions.*',
    '\nFor more info, use /faq.'
  );
  return ctx.reply(commands.join('\n'));
};