import { bot } from "./bot.js";
import { setupRegistrationFlow, isChannelMember, showChannelJoinMessage } from "../features/index.js";
import { initializeSuperAdmin, UserDatabase } from "../database/users.db.js";

try {
    await initializeSuperAdmin();
} catch (error) {
    console.log("⚠️ Could not initialize superadmin - MongoDB may not be running");
}

bot.use(async (ctx, next) => {
    if (ctx.message?.text === '/start' || ctx.updateType === 'callback_query') {
        return next();
    }

    if (ctx.from) {
        const user = await UserDatabase.getUserByTelegramId(ctx.from.id);
        if (user) {
            const isMember = await isChannelMember(ctx);
            if (!isMember) {
                ctx.reply("❌ Botdan foydalanish uchun kanalga obuna bo'lishingiz shart!");
                showChannelJoinMessage(ctx);
                return;
            }
        }
    }

    return next();
});

setupRegistrationFlow();

export default bot;
