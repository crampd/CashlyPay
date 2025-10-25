const express = require('express');
const {
  store,
  publish,
  aiDraft,
  byCustomer,
  summary,
} = require('../../controllers/invoice-controller');

const router = express.Router();

router.post('/', store);
router.post('/publish', publish);
router.post('/ai', aiDraft);
router.get('/customer/:customerId', byCustomer);
router.get('/summary/:locationId', summary);

module.exports = router;
