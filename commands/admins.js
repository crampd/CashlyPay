const { getAdmins, addAdmin, removeAdmin } = require('../db');

module.exports = async function adminsCommand(ctx) {
  try {
    const parts = ctx.message.text.split(' ');
    const action = parts[1];
    const target = parts[2];

    if (!action) {
      const admins = await getAdmins();
      return ctx.reply('Admins:\n' + admins.join('\n'));
    }
    if (action === 'add' && target) {
      await addAdmin(target);
      return ctx.reply(`✅ Admin ${target} added.`);
    }
    if (action === 'remove' && target) {
      await removeAdmin(target);
      return ctx.reply(`✅ Admin ${target} removed.`);
    }
    return ctx.reply('Usage:\n/admins\n/admins add <telegram_id>\n/admins remove <telegram_id>');
  } catch (err) {
    return ctx.reply('❌ Admin command failed: ' + err.message);
  }
};
