const { getAllCustomers } = require('../db');
const { InlineKeyboard } = require('grammy');
module.exports = async function customersCommand(ctx) {
  try {
    const customers = await getAllCustomers();
    if (!customers.length) return ctx.reply('No customers found.');
    const keyboard = new InlineKeyboard();
    customers.slice(0, 10).forEach(c => {
      keyboard.text(`${c.name} (${c.email})`, `view_customer_${c.email}`).row();
    });
    return ctx.reply('👥 Customers:', { reply_markup: keyboard });
  } catch (err) {
    return ctx.reply('❌ Failed: ' + err.message);
  }
};
