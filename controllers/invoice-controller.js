const {
  createInvoiceDraft,
  publishInvoice,
  listCustomerInvoices,
  summarizeInvoices,
} = require('../services/invoice-service');
const { interpretPrompt } = require('../services/ai-service');

async function store(req, res, next) {
  try {
    if (!req.body.customerId || !req.body.locationId) {
      return res.status(400).json({ message: 'customerId and locationId are required.' });
    }

    if (!Array.isArray(req.body.lineItems) || !req.body.lineItems.length) {
      return res.status(400).json({ message: 'At least one line item is required.' });
    }

    const invoice = await createInvoiceDraft(req.body);
    res.status(201).json({ invoice });
  } catch (error) {
    next(error);
  }
}

async function publish(req, res, next) {
  try {
    const { invoiceId, version } = req.body;
    const invoice = await publishInvoice(invoiceId, version);
    res.json({ invoice });
  } catch (error) {
    next(error);
  }
}

async function aiDraft(req, res, next) {
  try {
    const { prompt } = req.body;
    const draft = interpretPrompt(prompt);
    res.json({ draft });
  } catch (error) {
    next(error);
  }
}

async function byCustomer(req, res, next) {
  try {
    const { customerId } = req.params;
    const { locationId } = req.query;
    if (!locationId) {
      return res.status(400).json({ message: 'locationId query parameter is required.' });
    }
    const invoices = await listCustomerInvoices(customerId, locationId);
    res.json({ invoices });
  } catch (error) {
    next(error);
  }
}

async function summary(req, res, next) {
  try {
    const { locationId } = req.params;
    const result = await summarizeInvoices(locationId);
    res.json({ summary: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  store,
  publish,
  aiDraft,
  byCustomer,
  summary,
};
