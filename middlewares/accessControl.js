const { getAdminRole } = require('../db');
function requireRole(requiredRoles) {
  return async (ctx, next) => {
    if (!ctx.from) return ctx.reply('⛔ Cannot determine user.');
    try {
      const role = await getAdminRole(String(ctx.from.id));
      if (role && requiredRoles.includes(role)) {
        return next();
      } else {
        return ctx.reply('⛔ You are not authorized to use this command.');
      }
    } catch (err) {
      console.error('Role middleware error:', err);
      return ctx.reply('❌ Authorization check failed.');
    }
  };
}
module.exports = { requireRole };
