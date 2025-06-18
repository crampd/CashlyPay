const { createCustomer, createInvoice } = require('./stripe');
const { saveCustomer, getCustomerByEmail, saveInvoice } = require('../db');

async function createAndSendInvoice({ telegram_id, name, email, description, amount }) {
  let customer = await getCustomerByEmail(email);
  let stripeCustomerId = (customer && customer.stripe_customer_id) ? customer.stripe_customer_id : null;
  if (!stripeCustomerId) {
    const stripeCustomer = await createCustomer(name, email);
    stripeCustomerId = stripeCustomer.id;
    await saveCustomer({
      telegram_id,
      name,
      email,
      phone: customer ? customer.phone : '',
      address: customer ? customer.address : '',
      stripe_customer_id: stripeCustomerId
    });
    customer = await getCustomerByEmail(email);
  }

  const { invoiceUrl, stripeInvoiceId, status, currency, amount_due } = await createInvoice(
    stripeCustomerId,
    description,
    amount
  );

  await saveInvoice({
    customer_email: email,
    stripe_invoice_id: stripeInvoiceId,
    amount: amount_due / 100,
    currency,
    description,
    status
  });

  return { url: invoiceUrl, status, amount: amount_due / 100 };
}

module.exports = { createAndSendInvoice };