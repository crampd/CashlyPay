const { getAdmins, addAdmin, removeAdmin } = require('../db');
const config = require('../config');
const { InlineKeyboard } = require('grammy');

module.exports = async function adminsCommand(ctx) {
  // Show admin actions as inline keyboard with unique prefixes
  const keyboard = new InlineKeyboard()
    .text('List admins', 'admins:list').row()
    .text('Add user', 'admins:add').row()
    .text('Delete user', 'admins:delete').row()
    .text('Promote user to admin', 'admins:promote');
  return ctx.reply('Choose an admin action:', { reply_markup: keyboard });
};

// Handler for admin actions
module.exports.handleCallbackQuery = async function (ctx) {
  await ctx.answerCallbackQuery(); // Always answer callback to avoid loading spinner
  const data = ctx.callbackQuery.data;
  if (data === 'admins:list') {
    const dbAdmins = await getAdmins();
    const envAdmins = config.ADMINS || [];
    const allAdmins = Array.from(new Set([...envAdmins, ...dbAdmins]));
    if (!allAdmins.length) return ctx.reply('No admins found.');
    return ctx.reply('Admins:\n' + allAdmins.map(a => `• ${a}`).join('\n'));
  }
  if (data === 'admins:add') {
    ctx.session.adminAction = 'add';
    return ctx.reply('Enter the Telegram ID of the user to add as admin:');
  }
  if (data === 'admins:delete') {
    ctx.session.adminAction = 'delete';
    return ctx.reply('Enter the Telegram ID of the admin to delete:');
  }
  if (data === 'admins:promote') {
    ctx.session.adminAction = 'promote';
    return ctx.reply('Enter the Telegram ID of the user to promote to admin:');
  }
};

// Handler for text input after inline actions
module.exports.handleMessage = async function (ctx) {
  const action = ctx.session.adminAction;
  if (!action) return;
  const id = ctx.message.text.trim();
  try {
    if (action === 'add') {
      await addAdmin(id);
      ctx.session.adminAction = null;
      return ctx.reply(`✅ Admin ${id} added.`);
    }
    if (action === 'delete') {
      await removeAdmin(id);
      ctx.session.adminAction = null;
      return ctx.reply(`✅ Admin ${id} removed.`);
    }
    if (action === 'promote') {
      await addAdmin(id, 'admin');
      ctx.session.adminAction = null;
      return ctx.reply(`✅ User ${id} promoted to admin.`);
    }
    ctx.session.adminAction = null;
    return ctx.reply('Unknown action.');
  } catch (err) {
    ctx.session.adminAction = null;
    return ctx.reply('❌ Admin command failed: ' + err.message);
  }
};