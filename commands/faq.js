module.exports = async function faqCommand(ctx) {
  return ctx.reply(
    'FAQ:\n' +
    '1. How to add a customer?\nUse /addcustomer and follow the prompts.\n' +
    '2. How to create an invoice?\nUse /invoice and follow the prompts.\n' +
    '3. How to export customers?\nAdmins can use /exportcustomers.\n' +
    '4. How to get help?\nUse /help at any time.'
  );
};