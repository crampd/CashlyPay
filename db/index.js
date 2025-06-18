const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/cashly.db');
const config = require('../config'); // <-- Add this line

// Initialize tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT,
      name TEXT,
      email TEXT UNIQUE,
      phone TEXT,
      address TEXT,
      stripe_customer_id TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT UNIQUE,
      role TEXT DEFAULT 'admin'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_email TEXT,
      stripe_invoice_id TEXT,
      amount REAL,
      currency TEXT,
      description TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Admins
function getAdmins() {
  return new Promise((resolve, reject) => {
    db.all('SELECT telegram_id FROM admins', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(r => r.telegram_id));
    });
  });
}

function addAdmin(id, role = 'admin') {
  return new Promise((resolve, reject) => {
    db.run('INSERT OR IGNORE INTO admins (telegram_id, role) VALUES (?, ?)', [id, role], function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

function removeAdmin(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM admins WHERE telegram_id = ?', [id], function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

// UPDATED: Check .env ADMINS first, then DB
function getAdminRole(telegram_id) {
  // Check .env ADMINS
  if (config.ADMINS && config.ADMINS.includes(String(telegram_id))) {
    return Promise.resolve('admin');
  }
  // Fallback to DB
  return new Promise((resolve, reject) => {
    db.get('SELECT role FROM admins WHERE telegram_id = ?', [telegram_id], (err, row) => {
      if (err) reject(err);
      else resolve(row ? row.role : null);
    });
  });
}

function setAdminRole(telegram_id, role) {
  return new Promise((resolve, reject) => {
    db.run('UPDATE admins SET role = ? WHERE telegram_id = ?', [role, telegram_id], function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Customers
function getCustomersByTelegramId(tgId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM customers WHERE telegram_id = ?', [tgId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getAllCustomers() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM customers', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getCustomerByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM customers WHERE email = ?', [email], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function getCustomerByStripeId(stripe_customer_id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM customers WHERE stripe_customer_id = ?', [stripe_customer_id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function saveCustomer({ telegram_id, name, email, phone, address, stripe_customer_id }) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT OR IGNORE INTO customers (telegram_id, name, email, phone, address, stripe_customer_id) VALUES (?, ?, ?, ?, ?, ?)',
      [telegram_id, name, email, phone, address, stripe_customer_id],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

function updateCustomer({ email, name, phone, address }) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE customers SET name = ?, phone = ?, address = ? WHERE email = ?',
      [name, phone, address, email],
      function (err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
}

function deleteCustomerByEmail(email) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM customers WHERE email = ?', [email], function (err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
}

function searchCustomers(query) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM customers WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?`,
      [`%${query}%`, `%${query}%`, `%${query}%`],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

// Invoices
function saveInvoice({ customer_email, stripe_invoice_id, amount, currency, description, status }) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO invoices (customer_email, stripe_invoice_id, amount, currency, description, status) VALUES (?, ?, ?, ?, ?, ?)',
      [customer_email, stripe_invoice_id, amount, currency, description, status],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

function getInvoicesByEmail(email) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM invoices WHERE customer_email = ?', [email], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getInvoiceById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM invoices WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function getRecentSalesReport(months = 6) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT strftime('%Y-%m', created_at) as month, SUM(amount) as total
       FROM invoices WHERE status='paid' GROUP BY month ORDER BY month DESC LIMIT ?`,
      [months],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

module.exports = {
  db,
  getAdmins,
  addAdmin,
  removeAdmin,
  getAdminRole,
  setAdminRole,
  getCustomersByTelegramId,
  getAllCustomers,
  getCustomerByEmail,
  getCustomerByStripeId,
  saveCustomer,
  updateCustomer,
  deleteCustomerByEmail,
  searchCustomers,
  saveInvoice,
  getInvoicesByEmail,
  getInvoiceById,
  getRecentSalesReport
};
