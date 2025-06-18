const { updateCustomer, getCustomerByEmail } = require('../db');

module.exports = async function updateCustomerCommand(ctx) {
  ctx.session.updateCustomer = { step: 1, data: {}, customer: null };
  return ctx.reply('Enter customer email to update:');
};

module.exports.handleMessage = async function (ctx) {
  const sess = ctx.session.updateCustomer;
  if (!sess) return;

  const text = ctx.message.text.trim();

  if (sess.step === 1) {
    sess.data.email = text;
    const customer = await getCustomerByEmail(text);
    if (!customer) {
      ctx.session.updateCustomer = null;
      return ctx.reply('Customer not found.');
    }
    sess.customer = customer;
    sess.step = 2;
    return ctx.reply(`Current name: ${customer.name}\nEnter new name (or type skip):`);
  }
  if (sess.step === 2) {
    sess.data.name = (text.toLowerCase() === 'skip') ? sess.customer.name : text;
    sess.step = 3;
    return ctx.reply(`Current phone: ${sess.customer.phone || ''}\nEnter new phone (or type skip):`);
  }
  if (sess.step === 3) {
    sess.data.phone = (text.toLowerCase() === 'skip') ? sess.customer.phone : text;
    sess.step = 4;
    return ctx.reply(`Current address: ${sess.customer.address || ''}\nEnter new address (or type skip):`);
  }
  if (sess.step === 4) {
    sess.data.address = (text.toLowerCase() === 'skip') ? sess.customer.address : text;
    try {
      await updateCustomer(sess.data);
      ctx.session.updateCustomer = null;
      return ctx.reply('✅ Customer updated.');
    } catch (err) {
      ctx.session.updateCustomer = null;
      return ctx.reply('❌ Failed to update customer: ' + err.message);
    }
  }
};