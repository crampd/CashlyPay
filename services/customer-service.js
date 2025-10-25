const crypto = require('crypto');
const { customersApi } = require('./square-client');

const TAG_ATTRIBUTE_KEY = 'cashlypay.tags';

function normalizeTags(tags = []) {
  return [...new Set(tags.map((tag) => String(tag || '').trim()).filter(Boolean))];
}

async function listCustomers() {
  const {
    result: { customers },
  } = await customersApi.listCustomers();
  return (customers || []).map((customer) => ({
    ...customer,
    tags: extractTags(customer.customAttributes),
  }));
}

async function retrieveCustomer(customerId) {
  const {
    result: { customer },
  } = await customersApi.retrieveCustomer(customerId);

  return {
    ...customer,
    tags: extractTags(customer.customAttributes),
  };
}

async function createCustomer(payload) {
  const {
    companyName,
    emailAddress,
    givenName,
    familyName,
    phoneNumber,
    address,
    note,
    tags,
  } = payload;

  const body = {
    idempotencyKey: crypto.randomUUID(),
    companyName,
    emailAddress,
    givenName,
    familyName,
    phoneNumber,
    note,
    address,
  };

  const {
    result: { customer },
  } = await customersApi.createCustomer(body);

  if (tags && tags.length) {
    await upsertTags(customer.id, tags);
  }

  return retrieveCustomer(customer.id);
}

async function upsertTags(customerId, tags = []) {
  const normalized = normalizeTags(tags);
  if (!normalized.length) return null;

  const body = {
    idempotencyKey: crypto.randomUUID(),
    customAttribute: {
      key: TAG_ATTRIBUTE_KEY,
      type: 'STRING',
      stringValue: JSON.stringify(normalized),
    },
  };

  await customersApi.upsertCustomerCustomAttribute(customerId, TAG_ATTRIBUTE_KEY, body);
  return retrieveCustomer(customerId);
}

function extractTags(customAttributes = []) {
  const record = customAttributes?.find((attribute) => attribute.key === TAG_ATTRIBUTE_KEY);
  if (!record?.stringValue) return [];
  try {
    return JSON.parse(record.stringValue);
  } catch (error) {
    return [];
  }
}

module.exports = {
  listCustomers,
  retrieveCustomer,
  createCustomer,
  upsertTags,
};
