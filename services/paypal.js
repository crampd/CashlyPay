const paypal = require('@paypal/checkout-server-sdk');
const config = require('../config');

function environment() {
  if (config.PAYPAL_ENV === 'live') {
    return new paypal.core.LiveEnvironment(config.PAYPAL_CLIENT_ID, config.PAYPAL_CLIENT_SECRET);
  }
  return new paypal.core.SandboxEnvironment(config.PAYPAL_CLIENT_ID, config.PAYPAL_CLIENT_SECRET);
}

const client = new paypal.core.PayPalHttpClient(environment());

async function createPayPalInvoice({ name, email, description, amount }) {
  const request = new paypal.invoices.InvoicesCreateRequest();
  request.requestBody({
    detail: {
      currency_code: 'USD',
      note: description,
      terms_and_conditions: 'Thank you for your business.'
    },
    invoicer: {
      name: { given_name: name }
    },
    primary_recipients: [
      {
        billing_info: {
          email_address: email
        }
      }
    ],
    items: [
      {
        name: description,
        quantity: '1',
        unit_amount: {
          currency_code: 'USD',
          value: amount.toFixed(2)
        }
      }
    ]
  });

  const response = await client.execute(request);
  const invoiceId = response.result.id;

  // Send the invoice
  const sendRequest = new paypal.invoices.InvoicesSendRequest(invoiceId);
  await client.execute(sendRequest);

  // Get invoice URL
  const invoiceUrl = response.result.href || `https://www.paypal.com/invoice/payerView/details/${invoiceId}`;
  return {
    invoiceUrl,
    invoiceId,
    status: response.result.status,
    amount
  };
}

// PayPal does not have a direct customer object, so we just return the email as ID
async function createPayPalCustomer(name, email) {
  return { id: email, name, email };
}

module.exports = { createPayPalInvoice, createPayPalCustomer };