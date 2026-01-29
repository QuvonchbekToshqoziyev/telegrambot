import { bot } from "../bot/bot.js";
import { UserDatabase, RegistrationState } from "../database/users.db.js";
import { isAdmin, isSuperAdmin } from "./adminUtils.js";
import { CHANNEL_ID, CHANNEL_LINK, STATES } from "./constants.js";
import { getAdminPanelKeyboard, getSuperAdminPanelKeyboard, getUserKeyboard } from "./keyboards.js";
import { askForRegion, askForUsername, askUpdateInfo, handleRegistrationContact, handleRegionSelection, handleUpdateRegion, handleUpdateUsername, handleUsername } from "./handlers.js";
import { resolveUserByQuery, sendAdminUserInfo, sendUserList } from "./admin.js";
import { ensureSuperAdmin, isChannelMember, showChannelJoinMessage } from "./membership.js";
import { sendUserInfo } from "./userInfo.js";

if (!CHANNEL_ID || !CHANNEL_LINK) {
    console.error("⚠️ CHANNEL_ID and CHANNEL_LINK must be set in .env");
}

export const setupRegistrationFlow = () => {
    bot.start(async (ctx) => {
        const existingUser = await UserDatabase.getUserByTelegramId(ctx.from.id);
        if (existingUser) {
            const normalizedUser = await ensureSuperAdmin(existingUser);
            const isMember = await isChannelMember(ctx);
            if (!isMember) {
                ctx.reply("❌ Botdan foydalanish uchun kanalga obuna bo'lishingiz kerak!");
                showChannelJoinMessage(ctx);
                return;
            }
            ctx.reply(`👋 Salom, #${normalizedUser.username}!`, getUserKeyboard({ includeAdmin: normalizedUser.isAdmin || normalizedUser.isSuperAdmin, includeSuperAdmin: normalizedUser.isSuperAdmin }));
            return;
        }
        const isMember = await isChannelMember(ctx);
        if (!isMember) {
            RegistrationState.setState(ctx.from.id, { step: STATES.CHANNEL_CHECK, data: {} });
            showChannelJoinMessage(ctx);
        } else {
            askForUsername(ctx);
        }
    });

    bot.on("text", async (ctx, next) => {
        const state = RegistrationState.getState(ctx.from.id);

        if (ctx.message?.text === "🧾 My info" || ctx.message?.text === "✏️ Update info") {
            RegistrationState.clearState(ctx.from.id);
        }

        if (!state) {
            if (ctx.message?.text === "/start") return next();
            const existingUser = await UserDatabase.getUserByTelegramId(ctx.from.id);
            if (existingUser) {
                const normalizedUser = await ensureSuperAdmin(existingUser);
                if (ctx.message?.text === "🧾 My info") {
                    await sendUserInfo(ctx, normalizedUser, { includeAdmin: normalizedUser.isAdmin || normalizedUser.isSuperAdmin, includeSuperAdmin: normalizedUser.isSuperAdmin });
                    return;
                }
                if (ctx.message?.text === "✏️ Update info") {
                    askUpdateInfo(ctx);
                    return;
                }
                if (ctx.message?.text === "🛠 Admin panel") {
                    const admin = await isAdmin(ctx.from.id);
                    if (!admin) {
                        ctx.reply("❌ Bu amalni bajarishga sizda ruxsat yo'q!");
                        return;
                    }
                    ctx.reply("🛠 Admin paneli", getAdminPanelKeyboard());
                    return;
                }
                if (ctx.message?.text === "👑 Superadmin panel") {
                    const superAdmin = await isSuperAdmin(ctx.from.id);
                    if (!superAdmin) {
                        ctx.reply("❌ Bu amalni faqat superadmin bajar ola oladi!");
                        return;
                    }
                    ctx.reply("👑 Superadmin paneli", getSuperAdminPanelKeyboard());
                    return;
                }

                ctx.reply("no important notices yet", getUserKeyboard({ includeAdmin: normalizedUser.isAdmin || normalizedUser.isSuperAdmin, includeSuperAdmin: normalizedUser.isSuperAdmin }));
            } else {
                ctx.reply("Iltimos, /start buyrug'i orqali ro'yxatdan o'ting.");
            }
            return;
        }

        switch (state.step) {
            case STATES.CHANNEL_CHECK: {
                const isMember = await isChannelMember(ctx);
                if (isMember) {
                    askForUsername(ctx);
                } else {
                    showChannelJoinMessage(ctx);
                }
                break;
            }
            case STATES.WAITING_USERNAME:
                await handleUsername(ctx);
                break;
            case STATES.WAITING_REGION:
                ctx.reply("📍 Iltimos, hududni tugmalar orqali tanlang.");
                break;
            case STATES.WAITING_CONTACT:
                ctx.reply("📱 Iltimos, telefon raqamingizni quyidagi tugma orqali yuboring!");
                break;
            case STATES.UPDATE_USERNAME: {
                const existingUser = await UserDatabase.getUserByTelegramId(ctx.from.id);
                const includeAdmin = existingUser?.isAdmin || existingUser?.isSuperAdmin;
                const includeSuperAdmin = existingUser?.isSuperAdmin;
                await handleUpdateUsername(ctx, includeAdmin, includeSuperAdmin);
                break;
            }
            case STATES.UPDATE_REGION:
                ctx.reply("📍 Iltimos, hududni tugmalar orqali tanlang.");
                break;
            case STATES.UPDATE_CHOOSE:
                ctx.reply("Iltimos, tugmalar orqali tanlang.");
                break;
            case STATES.ADMIN_SEARCH_USER: {
                const query = ctx.message.text.trim();
                const user = await resolveUserByQuery(query);
                RegistrationState.clearState(ctx.from.id);
                if (!user) {
                    ctx.reply("❌ Foydalanuvchi topilmadi!");
                    return;
                }
                const superAdmin = await isSuperAdmin(ctx.from.id);
                await sendAdminUserInfo(ctx, user, superAdmin);
                break;
            }
            case STATES.ADMIN_PROMOTE: {
                const query = ctx.message.text.trim();
                const user = await resolveUserByQuery(query);
                RegistrationState.clearState(ctx.from.id);
                if (!user) {
                    ctx.reply("❌ Foydalanuvchi topilmadi!");
                    return;
                }
                if (user.isSuperAdmin) {
                    ctx.reply("❌ Superadminni o'zgartirib bo'lmaydi.");
                    return;
                }
                await UserDatabase.updateUser(user.telegramId, { isAdmin: true });
                ctx.reply(`✅ #${user.username} admin qilib tayinlandi.`);
                break;
            }
            case STATES.ADMIN_DEMOTE: {
                const query = ctx.message.text.trim();
                const user = await resolveUserByQuery(query);
                RegistrationState.clearState(ctx.from.id);
                if (!user) {
                    ctx.reply("❌ Foydalanuvchi topilmadi!");
                    return;
                }
                if (user.isSuperAdmin) {
                    ctx.reply("❌ Superadminni o'zgartirib bo'lmaydi.");
                    return;
                }
                await UserDatabase.updateUser(user.telegramId, { isAdmin: false });
                ctx.reply(`✅ #${user.username} adminlikdan olindi.`);
                break;
            }
        }
    });

    bot.on("contact", async (ctx) => {
        const state = RegistrationState.getState(ctx.from.id);
        const existingUser = await UserDatabase.getUserByTelegramId(ctx.from.id);

        if (state && state.step === STATES.WAITING_CONTACT) {
            const user = await handleRegistrationContact(ctx);
            ctx.reply("no important notices yet", getUserKeyboard({ includeAdmin: user.isAdmin || user.isSuperAdmin, includeSuperAdmin: user.isSuperAdmin }));
        } else if (!state) {
            ctx.reply("Iltimos, /start bo'yicha qayta boshlang.");
        }
    });

    bot.action("check_channel_subscription", async (ctx) => {
        try {
            await ctx.answerCbQuery();
            const isMember = await isChannelMember(ctx);

            if (isMember) {
                const existingUser = await UserDatabase.getUserByTelegramId(ctx.from.id);

                if (existingUser) {
                    await ctx.deleteMessage().catch(() => {});
                    ctx.reply(`✅ Obuna tasdiqlandi!\n\n👋 Xush kelibsiz, #${existingUser.username}!`);
                } else {
                    const state = RegistrationState.getState(ctx.from.id);
                    if (state && state.step === STATES.CHANNEL_CHECK) {
                        await ctx.deleteMessage().catch(() => {});
                        askForUsername(ctx);
                    } else {
                        RegistrationState.setState(ctx.from.id, { step: STATES.WAITING_USERNAME, data: {} });
                        await ctx.deleteMessage().catch(() => {});
                        askForUsername(ctx);
                    }
                }
            } else {
                await ctx.answerCbQuery();
                await ctx.deleteMessage().catch(() => {});
                showChannelJoinMessage(ctx);
            }
        } catch (error) {
            console.error("Error in check_channel_subscription:", error);
            ctx.answerCbQuery("Xatolik yuz berdi", true);
        }
    });

    bot.action(/select_region:.+/, async (ctx) => {
        const state = RegistrationState.getState(ctx.from.id);
        const existingUser = await UserDatabase.getUserByTelegramId(ctx.from.id);
        const includeAdmin = existingUser?.isAdmin || existingUser?.isSuperAdmin;
        const includeSuperAdmin = existingUser?.isSuperAdmin;

        if (state && state.step === STATES.WAITING_REGION) {
            await handleRegionSelection(ctx);
        } else if (state && state.step === STATES.UPDATE_REGION) {
            await handleUpdateRegion(ctx, includeAdmin, includeSuperAdmin);
        } else {
            await ctx.answerCbQuery();
        }
    });

    bot.action("update_username", async (ctx) => {
        RegistrationState.setState(ctx.from.id, { step: STATES.UPDATE_USERNAME, data: {} });
        await ctx.answerCbQuery();
        ctx.reply("📝 Yangi username kiriting:");
    });

    bot.action("update_region", async (ctx) => {
        RegistrationState.setState(ctx.from.id, { step: STATES.UPDATE_REGION, data: {} });
        await ctx.answerCbQuery();
        askForRegion(ctx, STATES.UPDATE_REGION);
    });

    bot.action("update_cancel", async (ctx) => {
        RegistrationState.clearState(ctx.from.id);
        await ctx.answerCbQuery();
        const user = await UserDatabase.getUserByTelegramId(ctx.from.id);
        if (user) {
            await sendUserInfo(ctx, user, { includeAdmin: user.isAdmin || user.isSuperAdmin, includeSuperAdmin: user.isSuperAdmin });
        } else {
            ctx.reply("Bekor qilindi.");
        }
    });

    bot.action("admin_get_all", async (ctx) => {
        await ctx.answerCbQuery();
        const admin = await isAdmin(ctx.from.id);
        if (!admin) {
            ctx.reply("❌ Bu amalni bajarishga sizda ruxsat yo'q!");
            return;
        }
        const superAdmin = await isSuperAdmin(ctx.from.id);
        const users = await UserDatabase.getAllUsers();
        const filteredUsers = superAdmin ? users : users.filter((user) => !user.isSuperAdmin);
        await sendUserList(ctx, filteredUsers, "👥 FOYDALANUVCHILAR RO'YXATI");
    });

    bot.action("admin_get_one", async (ctx) => {
        await ctx.answerCbQuery();
        const admin = await isAdmin(ctx.from.id);
        if (!admin) {
            ctx.reply("❌ Bu amalni bajarishga sizda ruxsat yo'q!");
            return;
        }
        RegistrationState.setState(ctx.from.id, { step: STATES.ADMIN_SEARCH_USER, data: {} });
        ctx.reply("🔍 Foydalanuvchini ID yoki username bo'yicha kiriting:");
    });

    bot.action("admin_promote", async (ctx) => {
        await ctx.answerCbQuery();
        const superAdmin = await isSuperAdmin(ctx.from.id);
        if (!superAdmin) {
            ctx.reply("❌ Bu amalni faqat superadmin bajar ola oladi!");
            return;
        }
        RegistrationState.setState(ctx.from.id, { step: STATES.ADMIN_PROMOTE, data: {} });
        ctx.reply("⬆️ Admin qilish uchun foydalanuvchi ID yoki username kiriting:");
    });

    bot.action("admin_demote", async (ctx) => {
        await ctx.answerCbQuery();
        const superAdmin = await isSuperAdmin(ctx.from.id);
        if (!superAdmin) {
            ctx.reply("❌ Bu amalni faqat superadmin bajar ola oladi!");
            return;
        }
        RegistrationState.setState(ctx.from.id, { step: STATES.ADMIN_DEMOTE, data: {} });
        ctx.reply("⬇️ Adminlikdan olish uchun foydalanuvchi ID yoki username kiriting:");
    });
};

export { isChannelMember, showChannelJoinMessage } from "./membership.js";
