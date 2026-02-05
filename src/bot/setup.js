import { getBot } from "./bot.js";
import { setupRegistrationFlow, isChannelMember, showChannelJoinMessage } from "../features/index.js";
import { initializeSuperAdmin, UserDatabase } from "../database/users.db.js";

export const initializeBotSetup = async () => {
    try {
        console.log("⏳ Initializing superadmin...");
        await initializeSuperAdmin();
        console.log("✅ Superadmin initialized");
    } catch (error) {
        console.error("⚠️ Could not initialize superadmin:", error.message);
    }
    
    const bot = getBot();
    if (!bot) {
        throw new Error("Bot not initialized");
    }
    
    // Middleware for channel membership check
    bot.use(async (ctx, next) => {
        if (ctx.message?.text === '/start' || ctx.updateType === 'callback_query') {
            return next();
        }

        if (ctx.from) {
            const user = await UserDatabase.getUserByTelegramId(ctx.from.id);
            if (user) {
                const isMember = await isChannelMember(ctx);
                if (!isMember) {
                    await ctx.reply("❌ Botdan foydalanish uchun kanalga obuna bo'lishingiz shart!");
                    showChannelJoinMessage(ctx);
                    return;
                }
            }
        }

        return next();
    });
    
    // Setup registration flow handlers
    setupRegistrationFlow();
    console.log("✅ Registration flow setup complete");
};
