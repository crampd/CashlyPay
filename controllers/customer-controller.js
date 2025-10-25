const {
  listCustomers,
  retrieveCustomer,
  createCustomer,
  upsertTags,
} = require('../services/customer-service');

async function index(req, res, next) {
  try {
    const customers = await listCustomers();
    res.json({ customers });
  } catch (error) {
    next(error);
  }
}

async function show(req, res, next) {
  try {
    const customer = await retrieveCustomer(req.params.customerId);
    res.json({ customer });
  } catch (error) {
    next(error);
  }
}

async function store(req, res, next) {
  try {
    const customer = await createCustomer(req.body);
    res.status(201).json({ customer });
  } catch (error) {
    next(error);
  }
}

async function updateTags(req, res, next) {
  try {
    const customer = await upsertTags(req.params.customerId, req.body.tags);
    res.json({ customer });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  index,
  show,
  store,
  updateTags,
};
