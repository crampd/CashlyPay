const { Bot } = require('grammy');
const config = require('./config');
const { sessionMiddleware } = require('./middlewares/session');
const { requireRole } = require('./middlewares/accessControl');

const start = require('./commands/start');
const invoice = require('./commands/invoice');
const customers = require('./commands/customers');
const admins = require('./commands/admins');
const report = require('./commands/report');
const addCustomer = require('./commands/addcustomer');
const updateCustomer = require('./commands/updatecustomer');
const deleteCustomer = require('./commands/deletecustomer');
const searchCustomer = require('./commands/searchcustomer');
const exportCustomers = require('./commands/exportcustomers');
const listInvoices = require('./commands/listinvoices');
const viewInvoice = require('./commands/viewinvoice');
const salesReport = require('./commands/salesreport');
const help = require('./commands/help');
const faq = require('./commands/faq');

const bot = new Bot(config.BOT_TOKEN);
bot.use(sessionMiddleware());

bot.command('start', start);
bot.command('help', help);
bot.command('faq', faq);

bot.command('invoice', requireRole(['admin', 'manager']), invoice);
bot.command('customers', requireRole(['admin', 'manager', 'staff']), customers);
bot.command('addcustomer', requireRole(['admin', 'manager']), addCustomer);
bot.command('updatecustomer', requireRole(['admin', 'manager']), updateCustomer);
bot.command('deletecustomer', requireRole(['admin']), deleteCustomer);
bot.command('searchcustomer', requireRole(['admin', 'manager', 'staff']), searchCustomer);
bot.command('exportcustomers', requireRole(['admin']), exportCustomers);
bot.command('listinvoices', requireRole(['admin', 'manager']), listInvoices);
bot.command('viewinvoice', requireRole(['admin', 'manager']), viewInvoice);
bot.command('salesreport', requireRole(['admin', 'manager']), salesReport);
bot.command('admins', requireRole(['admin']), admins);
bot.command('report', requireRole(['admin', 'manager']), report);

// Handle addcustomer multi-step flow
bot.on('message', async (ctx, next) => {
  if (ctx.session && ctx.session.addCustomer) {
    return addCustomer.handleMessage(ctx);
  }
  if (ctx.session && ctx.session.invoice) {
    return invoice.handleMessage(ctx);
  }
  await next();
});

// Handle invoice customer selection (callback queries)
bot.on('callback_query:data', async (ctx, next) => {
  if (ctx.session && ctx.session.invoice) {
    return invoice.handleCallbackQuery(ctx);
  }
  await next();
});

// Error handling middleware
bot.catch(err => {
  console.error('Bot error:', err.error);
  err.ctx.reply('❌ An unexpected error occurred. Please try again later.');
});

bot.start();
