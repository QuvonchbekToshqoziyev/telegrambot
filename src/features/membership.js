import { CHANNEL_ID, CHANNEL_LINK } from "./constants.js";
import { UserDatabase } from "../database/users.db.js";

if (!CHANNEL_ID || !CHANNEL_LINK) {
    console.error("⚠️ CHANNEL_ID and CHANNEL_LINK must be set in .env");
}

export const ensureSuperAdmin = async (user) => {
    const superAdminId = process.env.SUPERADMIN_ID ? parseInt(process.env.SUPERADMIN_ID) : null;
    if (!superAdminId || !user) return user;
    if (user.telegramId === superAdminId && !user.isSuperAdmin) {
        return await UserDatabase.updateUser(user.telegramId, { isSuperAdmin: true, isAdmin: true });
    }
    return user;
};

export const isChannelMember = async (ctx) => {
    if (!CHANNEL_ID) {
        return false;
    }

    const SUPERADMIN_ID = process.env.SUPERADMIN_ID;
    if (SUPERADMIN_ID && ctx.from.id === parseInt(SUPERADMIN_ID)) {
        return true;
    }

    try {
        const member = await ctx.telegram.getChatMember(CHANNEL_ID, ctx.from.id);
        return ["member", "administrator", "creator"].includes(member.status);
    } catch (error) {
        console.error(error.message);
        return false;
    }
};

export const showChannelJoinMessage = (ctx) => {
    if (!CHANNEL_LINK) {
        ctx.reply("⚠️ Kanal havolasi sozlanmagan. Iltimos, admin bilan bog'laning.");
        return;
    }

    const msg = `
📢 Botdan foydalanish uchun avval bizning kanalga obuna bo'lishingiz kerak.

👇 Quyidagi tugmani bosing va kanalga obuna bo'ling:
    `;

    return ctx.reply(msg, {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "📣 Kanalga obuna bo'lish",
                        url: CHANNEL_LINK
                    }
                ],
                [
                    {
                        text: "✅ Obuna qildim, tekshir",
                        callback_data: "check_channel_subscription"
                    }
                ]
            ]
        }
    });
};
