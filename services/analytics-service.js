const { invoicesApi, paymentsApi } = require('./square-client');

async function getInvoiceSummary(locationId) {
  const {
    result: { invoices },
  } = await invoicesApi.searchInvoices({
    locationIds: [locationId],
  });

  const summary = {
    openCount: 0,
    paidCount: 0,
    overdueCount: 0,
    totalRevenue: 0,
    averagePaymentTimeDays: null,
    currency: invoices?.[0]?.amountDueMoney?.currency || 'USD',
  };

  let paidDurations = [];

  (invoices || []).forEach((invoice) => {
    switch (invoice.status) {
      case 'PAID':
        summary.paidCount += 1;
        summary.totalRevenue += Number(
          invoice.paymentRequests?.[0]?.totalCompletedAmountMoney?.amount || 0
        );
        if (invoice.paymentRequests?.[0]?.completedAt) {
          const created = new Date(invoice.createdAt);
          const completed = new Date(invoice.paymentRequests[0].completedAt);
          const diffMs = completed.getTime() - created.getTime();
          paidDurations.push(diffMs / (1000 * 60 * 60 * 24));
        }
        break;
      case 'OVERDUE':
        summary.overdueCount += 1;
        break;
      default:
        summary.openCount += 1;
        break;
    }
  });

  if (paidDurations.length) {
    const avg = paidDurations.reduce((acc, days) => acc + days, 0) / paidDurations.length;
    summary.averagePaymentTimeDays = Number(avg.toFixed(1));
  }

  return summary;
}

async function listRecentPayments(limit = 5) {
  const {
    result: { payments },
  } = await paymentsApi.listPayments(undefined, undefined, undefined, limit);
  return payments || [];
}

module.exports = {
  getInvoiceSummary,
  listRecentPayments,
};
