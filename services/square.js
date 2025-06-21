const { SquareClient } = require("square");
const config = require("../config");

const  error  = config.NODE_ENV; 
if (error && config.NODE_ENV !== "production") {
  const warningMessage = `Failed to load .env file. Be sure that create a .env file at the root of this examples directory
or set environment variables.You can find an example in the .env.example file provided.`;

  console.error(colors.bold.yellow(warningMessage));
}

// Create client config from environment variables
const clientConfig = {
  environment: process.env.NODE_ENV,
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  userAgentDetail: "sample_app_node_invoices" // Remove or replace this detail when building your own app
};

const defaultClient = new SquareClient(clientConfig);

async function createSquareInvoice({ name, email, description, amount }) {
  // 1. Create a customer (if not exists)
  const customersApi = client.customersApi;
  let customerId;
  try {
    const searchRes = await customersApi.searchCustomers({
      query: { filter: { emailAddress: { exact: email } } }
    });
    if (searchRes.result.customers && searchRes.result.customers.length > 0) {
      customerId = searchRes.result.customers[0].id;
    } else {
      const createRes = await customersApi.createCustomer({
        givenName: name,
        emailAddress: email
      });
      customerId = createRes.result.customer.id;
    }
  } catch (err) {
    throw new Error('Square customer error: ' + err.message);
  }

  // 2. Create invoice
  const invoicesApi = client.invoicesApi;
  const invoiceBody = {
    invoice: {
      locationId: config.SQUARE_LOCATION_ID,
      primaryRecipient: { customerId },
      paymentRequests: [
        {
          requestType: 'BALANCE',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
          fixedAmountRequestedMoney: {
            amount: Math.round(amount * 100),
            currency: 'USD'
          }
        }
      ],
      title: description,
      deliveryMethod: 'EMAIL'
    }
  };

  const invoiceRes = await invoicesApi.createInvoice(invoiceBody);
  const invoiceId = invoiceRes.result.invoice.id;

  // 3. Publish the invoice
  await invoicesApi.publishInvoice(invoiceId, { version: invoiceRes.result.invoice.version });

  // 4. Get invoice URL
  const invoiceUrl = invoiceRes.result.invoice.publicUrl;
  return {
    invoiceUrl,
    invoiceId,
    status: invoiceRes.result.invoice.status,
    amount
  };
}

module.exports = { createSquareInvoice };
