import { getUserKeyboard } from "./keyboards.js";

export const sendUserInfo = async (ctx, user, options = {}) => {
    const statusLine = options.includeStatus
        ? `\n🔐 Status: ${user.isSuperAdmin ? "SuperAdmin" : user.isAdmin ? "Admin" : "Foydalanuvchi"}`
        : "";
    const includeAdmin = options.includeAdmin ?? (user.isAdmin || user.isSuperAdmin);
    const includeSuperAdmin = options.includeSuperAdmin ?? user.isSuperAdmin;

    const info = `
👤 FOYDALANUVCHI MA'LUMOTLARI
━━━━━━━━━━━━━━━━━━
🆔 Telegram ID: ${user.telegramId}
📝 Username: #${user.username}
📱 Telefon: ${user.phone}
📍 Hudud: ${user.region}
📅 Ro'yxatdan o'tgan: ${user.joinedAt.toLocaleDateString('uz-UZ')}${statusLine}
    `;

    ctx.reply(info, getUserKeyboard({ includeAdmin, includeSuperAdmin }));
};

export const formatUserRow = (user) => `🆔 ${user.telegramId} | #${user.username}`;
