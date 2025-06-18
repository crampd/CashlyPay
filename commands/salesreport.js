const { getRecentSalesReport } = require('../db');
module.exports = async function salesReportCommand(ctx) {
  try {
    const rows = await getRecentSalesReport(6);
    if (!rows.length) return ctx.reply('No sales data.');
    const report = rows.map(r => `${r.month}: $${r.total}`).join('\n');
    ctx.reply('📊 Sales (last 6 months):\n' + report);
  } catch (err) {
    ctx.reply('❌ Failed: ' + err.message);
  }
};