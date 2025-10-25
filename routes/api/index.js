const express = require('express');
const customerRoutes = require('./customers');
const invoiceRoutes = require('./invoices');
const analyticsRoutes = require('./analytics');
const webhookRoutes = require('./webhooks');

const router = express.Router();

router.use('/customers', customerRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/webhooks', webhookRoutes);

module.exports = router;
