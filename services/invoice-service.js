const crypto = require('crypto');
const {
  invoicesApi,
  ordersApi,
  locationsApi,
  cardsApi,
  paymentsApi,
} = require('./square-client');

function computeDueDate(days = 7) {
  const due = new Date();
  due.setDate(due.getDate() + Number(days));
  return due.toISOString().split('T')[0];
}

async function resolveCurrency(locationId) {
  const {
    result: { location },
  } = await locationsApi.retrieveLocation(locationId);
  return location.currency;
}

function toLineItem(lineItem, currency) {
  let taxes = lineItem.taxes;
  if ((!taxes || !taxes.length) && lineItem.taxPercentage) {
    taxes = [
      {
        name: lineItem.taxName || 'Sales Tax',
        percentage: String(lineItem.taxPercentage),
        scope: 'LINE_ITEM',
      },
    ];
  }

  return {
    name: lineItem.name,
    quantity: String(lineItem.quantity || 1),
    basePriceMoney: {
      amount: validateAmount(lineItem.unitAmount),
      currency,
    },
    note: lineItem.note,
    taxes,
    discounts: lineItem.discounts,
  };
}

function validateAmount(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error('Each line item requires a unitAmount expressed in the smallest currency unit (for USD that is cents).');
  }
  return parsed;
}

async function createOrder({ locationId, customerId, lineItems }) {
  if (!Array.isArray(lineItems) || !lineItems.length) {
    throw new Error('At least one line item is required to create an invoice.');
  }

  const currency = await resolveCurrency(locationId);

  const body = {
    idempotencyKey: crypto.randomUUID(),
    order: {
      locationId,
      customerId,
      lineItems: lineItems.map((item) => toLineItem(item, currency)),
    },
  };

  const {
    result: { order },
  } = await ordersApi.createOrder(body);
  return order;
}

async function getAutomaticPaymentSource(customerId, dueDate) {
  const {
    result: { cards },
  } = await cardsApi.listCards(undefined, customerId);

  if (!cards?.length) {
    return {
      requestType: 'BALANCE',
      dueDate,
      reminders: [
        {
          relativeScheduledDays: -3,
          message: 'Reminder: your invoice is due in three days.',
        },
        {
          relativeScheduledDays: 0,
          message: 'Invoice due today. Please submit payment.',
        },
      ],
    };
  }

  return {
    requestType: 'BALANCE',
    automaticPaymentSource: 'CARD_ON_FILE',
    dueDate,
    cardId: cards[0].id,
  };
}

async function createInvoiceDraft({
  customerId,
  locationId,
  lineItems,
  title,
  description,
  dueInDays = 7,
  scheduleAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(),
}) {
  const order = await createOrder({ locationId, customerId, lineItems });
  const dueDate = computeDueDate(dueInDays);
  const paymentRequest = await getAutomaticPaymentSource(customerId, dueDate);

  const body = {
    idempotencyKey: crypto.randomUUID(),
    invoice: {
      orderId: order.id,
      title,
      description,
      locationId,
      deliveryMethod: 'EMAIL',
      primaryRecipient: { customerId },
      scheduledAt: scheduleAt,
      paymentRequests: [paymentRequest],
    },
  };

  const {
    result: { invoice },
  } = await invoicesApi.createInvoice(body);

  return invoice;
}

async function publishInvoice(invoiceId, version) {
  const body = {
    idempotencyKey: crypto.randomUUID(),
    version: Number(version),
  };
  const {
    result: { invoice },
  } = await invoicesApi.publishInvoice(invoiceId, body);
  return invoice;
}

async function listCustomerInvoices(customerId, locationId) {
  const {
    result: { invoices },
  } = await invoicesApi.searchInvoices({
    query: {
      filter: {
        customerIds: [customerId],
        locationIds: [locationId],
      },
      sort: {
        field: 'INVOICE_SORT_DATE',
        order: 'DESC',
      },
    },
  });

  return invoices || [];
}

async function summarizeInvoices(locationId) {
  const {
    result: { invoices },
  } = await invoicesApi.searchInvoices({
    locationIds: [locationId],
  });

  const summary = {
    openAmount: 0,
    paidAmount: 0,
    overdueAmount: 0,
    currency: invoices?.[0]?.amountDueMoney?.currency || 'USD',
  };

  (invoices || []).forEach((invoice) => {
    switch (invoice.status) {
      case 'PAID':
        summary.paidAmount += Number(invoice.paymentRequests?.[0]?.totalCompletedAmountMoney?.amount || 0);
        break;
      case 'OVERDUE':
        summary.overdueAmount += Number(invoice.amountDueMoney?.amount || 0);
        break;
      default:
        summary.openAmount += Number(invoice.amountDueMoney?.amount || 0);
    }
  });

  return summary;
}

async function listRecentPayments({ limit = 5 } = {}) {
  const {
    result: { payments },
  } = await paymentsApi.listPayments(undefined, undefined, undefined, limit);
  return payments || [];
}

module.exports = {
  createInvoiceDraft,
  publishInvoice,
  listCustomerInvoices,
  summarizeInvoices,
  listRecentPayments,
};
