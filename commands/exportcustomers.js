const { getAllCustomers } = require('../db');
const { writeFileSync, unlinkSync, existsSync, mkdirSync } = require('fs');
const path = require('path');

module.exports = async function exportCustomersCommand(ctx) {
  try {
    const customers = await getAllCustomers();
    if (!customers.length) return ctx.reply('No customers to export.');
    const csv = [
      'Name,Email,Phone,Address',
      ...customers.map(c =>
        `"${c.name}","${c.email}","${c.phone || ''}","${c.address || ''}"`
      )
    ].join('\n');
    const dir = path.join(__dirname, '../tmp');
    if (!existsSync(dir)) mkdirSync(dir);
    const filePath = path.join(dir, 'customers.csv');
    writeFileSync(filePath, csv);
    await ctx.replyWithDocument({ source: filePath, filename: 'customers.csv' });
    unlinkSync(filePath);
  } catch (err) {
    return ctx.reply('❌ Export failed: ' + err.message);
  }
};