import { getBot } from "../bot/bot.js";
import { UserDatabase, ChatState } from "../database/users.db.js";
import { getUserKeyboard, getCancelKeyboard } from "./keyboards.js";

export const sendUserMessageToAdmins = async (ctx, message) => {
    const user = await UserDatabase.getUserByTelegramId(ctx.from.id);
    if (!user) return;

    const admins = await UserDatabase.getAllAdmins();
    const bot = getBot();
    
    let successCount = 0;
    
    for (const admin of admins) {
        try {
            const messageText = `📨 FOYDALANUVCHIDAN XABAR\n━━━━━━━━━━━━━━━━━━\n\n👤 Foydalanuvchi: #${user.username}\n🆔 ID: ${user.telegramId}\n📍 Hudud: ${user.region}\n\n💬 Xabar:\n${message}`;
            
            await bot.telegram.sendMessage(admin.telegramId, messageText, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "💬 Javob berish", callback_data: `reply_to_user:${user.telegramId}` }]
                    ]
                }
            });
            successCount++;
        } catch (error) {
            console.error(`Failed to send message to admin ${admin.telegramId}:`, error.message);
        }
    }
    
    return successCount;
};

export const sendAdminMessageToSuperAdmin = async (ctx, message) => {
    const admin = await UserDatabase.getUserByTelegramId(ctx.from.id);
    if (!admin || !admin.isAdmin) return false;

    const superAdmin = await UserDatabase.getSuperAdmin();
    if (!superAdmin) {
        ctx.reply("❌ Superadmin topilmadi!");
        return false;
    }

    const bot = getBot();
    
    try {
        const messageText = `📨 ADMINDAN XABAR\n━━━━━━━━━━━━━━━━━━\n\n🛠 Admin: #${admin.username}\n🆔 ID: ${admin.telegramId}\n📍 Hudud: ${admin.region}\n\n💬 Xabar:\n${message}`;
        
        await bot.telegram.sendMessage(superAdmin.telegramId, messageText, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "💬 Javob berish", callback_data: `reply_to_admin:${admin.telegramId}` }]
                ]
            }
        });
        
        return true;
    } catch (error) {
        console.error(`Failed to send message to superadmin:`, error.message);
        return false;
    }
};

export const sendAdminReplyToUser = async (adminId, userId, message) => {
    const admin = await UserDatabase.getUserByTelegramId(adminId);
    const user = await UserDatabase.getUserByTelegramId(userId);
    
    if (!admin || !user) return false;

    const bot = getBot();
    
    try {
        const messageText = `📨 ADMINDAN JAVOB\n━━━━━━━━━━━━━━━━━━\n\n🛠 Admin: #${admin.username}\n\n💬 Xabar:\n${message}`;
        
        await bot.telegram.sendMessage(user.telegramId, messageText, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "💬 Javob berish", callback_data: `reply_to_admin_from_user:${admin.telegramId}` }]
                ]
            }
        });
        
        return true;
    } catch (error) {
        console.error(`Failed to send reply to user:`, error.message);
        return false;
    }
};

export const sendSuperAdminReplyToAdmin = async (superAdminId, adminId, message) => {
    const superAdmin = await UserDatabase.getUserByTelegramId(superAdminId);
    const admin = await UserDatabase.getUserByTelegramId(adminId);
    
    if (!superAdmin || !admin) return false;

    const bot = getBot();
    
    try {
        const messageText = `📨 SUPERADMINDAN JAVOB\n━━━━━━━━━━━━━━━━━━\n\n👑 Superadmin: #${superAdmin.username}\n\n💬 Xabar:\n${message}`;
        
        await bot.telegram.sendMessage(admin.telegramId, messageText, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "💬 Javob berish", callback_data: `reply_to_superadmin:${superAdmin.telegramId}` }]
                ]
            }
        });
        
        return true;
    } catch (error) {
        console.error(`Failed to send reply to admin:`, error.message);
        return false;
    }
};
