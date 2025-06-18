const sessions = {};
function sessionMiddleware() {
  return async (ctx, next) => {
    if (!ctx.from) return next();
    const id = ctx.from.id;
    ctx.session = sessions[id] || {};
    await next();
    sessions[id] = ctx.session;
  };
}
module.exports = { sessionMiddleware };
