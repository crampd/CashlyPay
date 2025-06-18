const { getAllCustomers, searchCustomers, saveCustomer, getCustomerByEmail, updateCustomer, deleteCustomerByEmail } = require('../db');
const { createCustomer } = require('../services/stripe');
const { InlineKeyboard } = require('grammy');
const { writeFileSync, unlinkSync, existsSync, mkdirSync } = require('fs');
const path = require('path');

module.exports = async function customersCommand(ctx) {
  const keyboard = new InlineKeyboard()
    .text('List customers', 'customers:list').row()
    .text('Search customer', 'customers:search').row()
    .text('Add customer', 'customers:add').row()
    .text('Update customer', 'customers:update').row()
    .text('Delete customer', 'customers:delete').row()
    .text('Export customers', 'customers:export');
  return ctx.reply('Choose a customer action:', { reply_markup: keyboard });
};

// Handle inline keyboard actions
module.exports.handleCallbackQuery = async function (ctx) {
  await ctx.answerCallbackQuery();
  const data = ctx.callbackQuery.data;
  if (data === 'customers:list') {
    const customers = await getAllCustomers();
    if (!customers.length) return ctx.reply('No customers found.');
    return ctx.reply(
      customers.map(c =>
        `👤 ${c.name}\n📧 ${c.email}\n📞 ${c.phone || ''}\n🏠 ${c.address || ''}`
      ).join('\n\n')
    );
  }
  if (data === 'customers:search') {
    ctx.session.customerAction = 'search';
    return ctx.reply('Enter name, email, or phone to search:');
  }
  if (data === 'customers:add') {
    ctx.session.customerAction = 'add';
    ctx.session.addStep = 1;
    ctx.session.addData = {};
    return ctx.reply('Enter customer name:');
  }
  if (data === 'customers:update') {
    ctx.session.customerAction = 'update';
    ctx.session.updateStep = 1;
    ctx.session.updateData = {};
    ctx.session.updateCustomer = null;
    return ctx.reply('Enter customer email to update:');
  }
  if (data === 'customers:delete') {
    ctx.session.customerAction = 'delete';
    return ctx.reply('Enter customer email to delete:');
  }
  if (data === 'customers:export') {
    try {
      const customers = await getAllCustomers();
      if (!customers.length) return ctx.reply('No customers to export.');
      const csv = [
        'Name,Email,Phone,Address',
        ...customers.map(c =>
          `"${c.name}","${c.email}","${c.phone || ''}","${c.address || ''}"`
        )
      ].join('\n');
      const dir = path.join(__dirname, '../tmp');
      if (!existsSync(dir)) mkdirSync(dir);
      const filePath = path.join(dir, 'customers.csv');
      writeFileSync(filePath, csv);
      await ctx.replyWithDocument({ source: filePath, filename: 'customers.csv' });
      unlinkSync(filePath);
    } catch (err) {
      return ctx.reply('❌ Export failed: ' + err.message);
    }
  }
};

// Handle multi-step flows for customer actions
module.exports.handleMessage = async function (ctx) {
  const action = ctx.session.customerAction;
  if (!action) return;

  // --- Search ---
  if (action === 'search') {
    const query = ctx.message.text.trim();
    try {
      const results = await searchCustomers(query);
      ctx.session.customerAction = null;
      if (!results.length) return ctx.reply('No customers found.');
      return ctx.reply(
        results.map(c =>
          `👤 ${c.name}\n📧 ${c.email}\n📞 ${c.phone || ''}\n🏠 ${c.address || ''}`
        ).join('\n\n')
      );
    } catch (err) {
      ctx.session.customerAction = null;
      return ctx.reply('❌ Search failed: ' + err.message);
    }
  }

  // --- Add ---
  if (action === 'add') {
    const step = ctx.session.addStep;
    const text = ctx.message.text.trim();
    if (step === 1) {
      ctx.session.addData.name = text;
      ctx.session.addStep = 2;
      return ctx.reply('Enter customer email:');
    }
    if (step === 2) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
        return ctx.reply('Invalid email. Please enter a valid email:');
      }
      ctx.session.addData.email = text;
      ctx.session.addStep = 3;
      return ctx.reply('Enter customer phone (optional, or type skip):');
    }
    if (step === 3) {
      ctx.session.addData.phone = text.toLowerCase() === 'skip' ? '' : text;
      ctx.session.addStep = 4;
      return ctx.reply('Enter customer address (optional, or type skip):');
    }
    if (step === 4) {
      ctx.session.addData.address = text.toLowerCase() === 'skip' ? '' : text;
      try {
        let customer = await getCustomerByEmail(ctx.session.addData.email);
        let stripeCustomerId = (customer && customer.stripe_customer_id) ? customer.stripe_customer_id : null;
        if (!stripeCustomerId) {
          const stripeCustomer = await createCustomer(ctx.session.addData.name, ctx.session.addData.email);
          stripeCustomerId = stripeCustomer.id;
        }
        await saveCustomer({
          telegram_id: String(ctx.from.id),
          ...ctx.session.addData,
          stripe_customer_id: stripeCustomerId
        });
        ctx.session.customerAction = null;
        ctx.session.addStep = null;
        ctx.session.addData = null;
        return ctx.reply('✅ Customer added and saved to Stripe.');
      } catch (err) {
        ctx.session.customerAction = null;
        ctx.session.addStep = null;
        ctx.session.addData = null;
        return ctx.reply('❌ Failed to add customer: ' + err.message);
      }
    }
  }

  // --- Update ---
  if (action === 'update') {
    const step = ctx.session.updateStep;
    const text = ctx.message.text.trim();
    if (step === 1) {
      ctx.session.updateData.email = text;
      const customer = await getCustomerByEmail(text);
      if (!customer) {
        ctx.session.customerAction = null;
        ctx.session.updateStep = null;
        ctx.session.updateData = null;
        return ctx.reply('Customer not found.');
      }
      ctx.session.updateCustomer = customer;
      ctx.session.updateStep = 2;
      return ctx.reply(`Current name: ${customer.name}\nEnter new name (or type skip):`);
    }
    if (step === 2) {
      ctx.session.updateData.name = (text.toLowerCase() === 'skip') ? ctx.session.updateCustomer.name : text;
      ctx.session.updateStep = 3;
      return ctx.reply(`Current phone: ${ctx.session.updateCustomer.phone || ''}\nEnter new phone (or type skip):`);
    }
    if (step === 3) {
      ctx.session.updateData.phone = (text.toLowerCase() === 'skip') ? ctx.session.updateCustomer.phone : text;
      ctx.session.updateStep = 4;
      return ctx.reply(`Current address: ${ctx.session.updateCustomer.address || ''}\nEnter new address (or type skip):`);
    }
    if (step === 4) {
      ctx.session.updateData.address = (text.toLowerCase() === 'skip') ? ctx.session.updateCustomer.address : text;
      try {
        await updateCustomer(ctx.session.updateData);
        ctx.session.customerAction = null;
        ctx.session.updateStep = null;
        ctx.session.updateData = null;
        ctx.session.updateCustomer = null;
        return ctx.reply('✅ Customer updated.');
      } catch (err) {
        ctx.session.customerAction = null;
        ctx.session.updateStep = null;
        ctx.session.updateData = null;
        ctx.session.updateCustomer = null;
        return ctx.reply('❌ Failed to update customer: ' + err.message);
      }
    }
  }

  // --- Delete ---
  if (action === 'delete') {
    const email = ctx.message.text.trim();
    try {
      const deleted = await deleteCustomerByEmail(email);
      ctx.session.customerAction = null;
      if (!deleted) return ctx.reply('Customer not found or already deleted.');
      return ctx.reply('✅ Customer deleted.');
    } catch (err) {
      ctx.session.customerAction = null;
      return ctx.reply('❌ Failed to delete customer: ' + err.message);
    }
  }
};
