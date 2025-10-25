const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const { Client } = require('square');
const config = require('../config/config');

/**
 * Square SDK client initialized once for the entire process.
 * Provide your credentials through environment variables or a `.env` file.
 *
 * SQUARE_ACCESS_TOKEN should be set to <SQUARE_ACCESS_TOKEN>
 * SQUARE_APP_ID should be set to <SQUARE_APP_ID>
 */
const squareClient = new Client({
  environment: config.square.environment === 'production' ? 'production' : 'sandbox',
  accessToken: config.square.accessToken,
});

const {
  customersApi,
  invoicesApi,
  ordersApi,
  locationsApi,
  cardsApi,
  paymentsApi,
  webhookSubscriptionsApi,
} = squareClient;

module.exports = {
  squareClient,
  customersApi,
  invoicesApi,
  ordersApi,
  locationsApi,
  cardsApi,
  paymentsApi,
  webhookSubscriptionsApi,
};
