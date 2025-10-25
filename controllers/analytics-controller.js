const { getInvoiceSummary, listRecentPayments } = require('../services/analytics-service');

async function summary(req, res, next) {
  try {
    const { locationId } = req.params;
    const summaryData = await getInvoiceSummary(locationId);
    res.json({ summary: summaryData });
  } catch (error) {
    next(error);
  }
}

async function recentPayments(req, res, next) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 5;
    const payments = await listRecentPayments(limit);
    res.json({ payments });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  summary,
  recentPayments,
};
