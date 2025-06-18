module.exports = async function faqCommand(ctx) {
  return ctx.reply(
    'FAQ:\n' +
    '1. How do I manage customers?\nUse /customers and select an action from the menu.\n' +
    '2. How do I manage invoices?\nUse /invoice and select an action from the menu.\n' +
    '3. How do I export customers?\nUse /customers and select "Export customers" (admins only).\n' +
    '4. How do I get help?\nUse /help at any time.'
  );
};