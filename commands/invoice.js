const { getAllCustomers, getInvoicesByEmail, getInvoiceById } = require('../db');
const { createAndSendInvoice } = require('../services/invoiceManager');
const { createPayPalInvoice } = require('../services/paypal');
const { createSquareInvoice } = require('../services/square');
const { InlineKeyboard } = require('grammy');

module.exports = async function invoiceCommand(ctx) {
  // Step 1: Choose service
  const keyboard = new InlineKeyboard()
    .text('Stripe', 'invoices:service:stripe')
    .text('PayPal', 'invoices:service:paypal')
    .text('Square', 'invoices:service:square').row()
    .text('List invoices', 'invoices:list')
    .text('View invoice', 'invoices:view');
  return ctx.reply('Choose Service or Action:', { reply_markup: keyboard });
};

// Handle inline keyboard actions
module.exports.handleCallbackQuery = async function (ctx) {
  await ctx.answerCallbackQuery();
  const data = ctx.callbackQuery.data;

  // Step 2: Service selection
  if (data.startsWith('invoices:service:')) {
    const service = data.split(':')[2];
    ctx.session.invoiceService = service;
    ctx.session.invoiceAction = null;
    ctx.session.createStep = null;
    ctx.session.createData = {};
    // List customers for selection
    const customers = await getAllCustomers();
    if (!customers.length) {
      ctx.session.invoiceService = null;
      return ctx.reply('No customers found. Please add a customer first.');
    }
    const keyboard = new InlineKeyboard();
    customers.slice(0, 10).forEach(c => {
      keyboard.text(`${c.name} (${c.email})`, `invoices:select:${c.email}`).row();
    });
    ctx.session.invoiceAction = 'create';
    ctx.session.createStep = 1;
    return ctx.reply(
      `Service: ${service.charAt(0).toUpperCase() + service.slice(1)}\nSelect a customer to invoice:`,
      { reply_markup: keyboard }
    );
  }

  if (data === 'invoices:list') {
    ctx.session.invoiceAction = 'list';
    ctx.session.invoiceService = null;
    return ctx.reply('Enter customer email to list invoices:');
  }
  if (data === 'invoices:view') {
    ctx.session.invoiceAction = 'view';
    ctx.session.invoiceService = null;
    return ctx.reply('Enter invoice ID to view:');
  }
  if (data.startsWith('invoices:select:')) {
    // Customer selected for invoice creation
    const email = data.split(':')[2];
    ctx.session.createData = ctx.session.createData || {};
    ctx.session.createData.email = email;
    ctx.session.createStep = 2;
    ctx.session.invoiceAction = 'create';
    return ctx.reply('Enter invoice description:');
  }
};

// Handle multi-step flows for invoice actions
module.exports.handleMessage = async function (ctx) {
  const action = ctx.session.invoiceAction;
  const service = ctx.session.invoiceService;
  if (!action && !service) return;

  // --- List invoices ---
  if (action === 'list') {
    const email = ctx.message.text.trim();
    try {
      const invoices = await getInvoicesByEmail(email);
      ctx.session.invoiceAction = null;
      if (!invoices.length) return ctx.reply('No invoices found for this customer.');
      return ctx.reply(
        invoices.map(inv =>
          `🧾 ID: ${inv.id}\n💵 Amount: $${inv.amount}\n📄 Status: ${inv.status}\n📝 Desc: ${inv.description || ''}`
        ).join('\n\n')
      );
    } catch (err) {
      ctx.session.invoiceAction = null;
      return ctx.reply('❌ Failed to list invoices: ' + err.message);
    }
  }

  // --- Create invoice (multi-step, multi-service) ---
  if (action === 'create' && service) {
    const step = ctx.session.createStep;
    const text = ctx.message.text.trim();
    if (step === 2) {
      ctx.session.createData.description = text;
      ctx.session.createStep = 3;
      return ctx.reply('Enter invoice amount:');
    }
    if (step === 3) {
      const amount = parseFloat(text);
      if (isNaN(amount) || amount <= 0) return ctx.reply('Invalid amount. Please enter a positive number:');
      ctx.session.createData.amount = amount;
      try {
        // Get customer name for all services
        const customers = await getAllCustomers();
        const customer = customers.find(c => c.email === ctx.session.createData.email);
        let result;
        if (service === 'stripe') {
          result = await createAndSendInvoice({
            telegram_id: String(ctx.from.id),
            name: customer ? customer.name : '',
            email: ctx.session.createData.email,
            description: ctx.session.createData.description,
            amount: ctx.session.createData.amount
          });
        } else if (service === 'paypal') {
          result = await createPayPalInvoice({
            name: customer ? customer.name : '',
            email: ctx.session.createData.email,
            description: ctx.session.createData.description,
            amount: ctx.session.createData.amount
          });
        } else if (service === 'square') {
          result = await createSquareInvoice({
            name: customer ? customer.name : '',
            email: ctx.session.createData.email,
            description: ctx.session.createData.description,
            amount: ctx.session.createData.amount
          });
        } else {
          throw new Error('Unknown service');
        }
        ctx.session.invoiceAction = null;
        ctx.session.createStep = null;
        ctx.session.createData = null;
        ctx.session.invoiceService = null;
        return ctx.reply(
          `✅ Invoice created via ${service.charAt(0).toUpperCase() + service.slice(1)} and sent to ${customer.email}.\n` +
          `💵 Amount: $${result.amount}\n` +
          `📄 Status: ${result.status}\n` +
          `🔗 [View Invoice](${result.url || result.invoiceUrl})`,
          { parse_mode: 'Markdown' }
        );
      } catch (err) {
        ctx.session.invoiceAction = null;
        ctx.session.createStep = null;
        ctx.session.createData = null;
        ctx.session.invoiceService = null;
        return ctx.reply('❌ Failed to create invoice: ' + err.message);
      }
    }
  }

  // --- View invoice ---
  if (action === 'view') {
    const id = ctx.message.text.trim();
    try {
      const inv = await getInvoiceById(id);
      ctx.session.invoiceAction = null;
      if (!inv) return ctx.reply('Invoice not found.');
      return ctx.reply(
        `🧾 ID: ${inv.id}\n💵 Amount: $${inv.amount}\n📄 Status: ${inv.status}\n📝 Desc: ${inv.description || ''}\n🔗 Stripe: ${inv.stripe_invoice_id ? `https://invoice.stripe.com/i/${inv.stripe_invoice_id}` : 'N/A'}`
      );
    } catch (err) {
      ctx.session.invoiceAction = null;
      return ctx.reply('❌ Failed to view invoice: ' + err.message);
    }
  }
};