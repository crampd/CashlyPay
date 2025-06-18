const stripe = require('stripe')(require('../config').STRIPE_SECRET_KEY);

async function createCustomer(name, email) {
  try {
    return await stripe.customers.create({ name, email });
  } catch (err) {
    throw new Error('Stripe customer creation failed: ' + err.message);
  }
}

async function createInvoice(customerId, description, amount) {
  if (!customerId) throw new Error('No Stripe customer ID provided.');
  try {
    // 1. Create an invoice item (this is what adds the amount to the invoice)
    await stripe.invoiceItems.create({
      customer: customerId,
      amount: Math.round(amount * 100), // Stripe expects cents
      currency: 'usd',
      description
    });

    // 2. Create the invoice and include pending items
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: 30,
      pending_invoice_items_behavior: 'include' // <-- This is the key!
    });

    // 3. Finalize the invoice (this makes it payable and sends it)
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id);

    // 4. Return the invoice URL and details
    return {
      invoiceUrl: finalized.hosted_invoice_url,
      stripeInvoiceId: finalized.id,
      status: finalized.status,
      currency: finalized.currency,
      amount_due: finalized.amount_due // in cents
    };
  } catch (err) {
    throw new Error('Stripe invoice creation failed: ' + err.message);
  }
}

module.exports = { createCustomer, createInvoice };