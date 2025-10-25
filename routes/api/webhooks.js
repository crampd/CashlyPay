const express = require('express');
const { handleSquareWebhook } = require('../../controllers/webhook-controller');

const router = express.Router();

router.post('/square', handleSquareWebhook);

module.exports = router;
