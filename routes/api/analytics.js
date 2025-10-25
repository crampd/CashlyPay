const express = require('express');
const { summary, recentPayments } = require('../../controllers/analytics-controller');

const router = express.Router();

router.get('/summary/:locationId', summary);
router.get('/payments', recentPayments);

module.exports = router;
