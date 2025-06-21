// commands/call.js

const axios = require('axios');
const config = require('../config');
const { requireRole } = require('../middlewares/accessControl');

module.exports = function setupCallCommand(bot) {
  bot.command('call', requireRole(['admin']), async (ctx) => {
    ctx.session.callSession = { step: 'phone' };
    return ctx.reply('📞 Please provide the client phone number to call (e.g., 33612345678):');
  });

  bot.command('cancelcall', async (ctx) => {
    if (ctx.session.callSession) {
      ctx.session.callSession = null;
      return ctx.reply('❌ Call session canceled.');
    }
    return ctx.reply('ℹ️ No active call session found.');
  });

  bot.on('message:text', async (ctx, next) => {
    const session = ctx.session.callSession;
    if (!session) return next();

    const text = ctx.message.text.trim();

    switch (session.step) {
      case 'phone':
        if (!/^\d{8,14}$/.test(text)) {
          return ctx.reply('❌ Invalid phone number. Please enter a valid number (e.g., 33612345678):');
        }
        session.phone = text;
        session.step = 'name';
        return ctx.reply('👤 Please enter the customer name:');
      case 'name':
        session.name = text;
        session.step = 'prompt';
        return ctx.reply('💬 Enter the prompt for the AI agent (or type "default" for standard):');
      case 'prompt':
        session.prompt = text.toLowerCase() === 'default' ? '' : text;
        session.step = 'first_message';
        return ctx.reply('🗣️ Enter the first message for the AI agent (or type "default" for standard):');
      case 'first_message':
        session.first_message = text.toLowerCase() === 'default' ? '' : text;
        // Send call request to outbound server
        try {
          const apiUrl = config.OUTBOUND_API_URL || 'http://localhost:8000/outbound-call';
          const payload = {
            number: session.phone,
            name: session.name,
            prompt: session.prompt,
            first_message: session.first_message,
          };
          const res = await axios.post(apiUrl, payload);
          if (res.data && res.data.success) {
            await ctx.reply(
              `📲 Outbound call initiated!\nPhone: ${session.phone}\nName: ${session.name}\nPrompt: ${session.prompt || 'default'}\nFirst message: ${session.first_message || 'default'}\nCall SID: ${res.data.callSid}`
            );
          } else {
            throw new Error(res.data && res.data.error ? res.data.error : 'Unknown error');
          }
        } catch (err) {
          await ctx.reply('⚠️ Failed to initiate outbound call: ' + err.message);
        }
        ctx.session.callSession = null;
        break;
      default:
        ctx.session.callSession = null;
        return ctx.reply('⚠️ Unknown session step. Please restart using /call.');
    }
  });
};