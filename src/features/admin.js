import { UserDatabase } from "../database/users.db.js";
import { formatUserRow, sendUserInfo } from "./userInfo.js";

export const resolveUserByQuery = async (query) => {
    if (!query) return null;
    if (query.startsWith("@") || query.startsWith("#")) {
        return await UserDatabase.getUserByUsername(query.substring(1));
    }
    if (!isNaN(query)) {
        return await UserDatabase.getUserByTelegramId(parseInt(query));
    }
    return await UserDatabase.getUserByUsername(query);
};

export const sendUserList = async (ctx, users, title) => {
    const header = `${title}\n━━━━━━━━━━━━━━━━━━`;
    if (!users.length) {
        ctx.reply(`${header}\nHech kim topilmadi.`);
        return;
    }
    const list = users.map(formatUserRow).join("\n");
    ctx.reply(`${header}\n${list}`);
};

export const sendAdminUserInfo = async (ctx, user, isRequesterSuperAdmin) => {
    if (user.isSuperAdmin && !isRequesterSuperAdmin) {
        ctx.reply("❌ Bu foydalanuvchi haqida ma'lumotni ko'rish taqiqlangan.");
        return false;
    }

    await sendUserInfo(ctx, user, { includeStatus: true, includeAdmin: true, includeSuperAdmin: isRequesterSuperAdmin });
    return true;
};
