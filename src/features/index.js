import { getBot } from "../bot/bot.js";
import { UserDatabase, RegistrationState, ChatState } from "../database/users.db.js";
import { isAdmin, isSuperAdmin } from "./adminUtils.js";
import { CHANNEL_ID, CHANNEL_LINK, BASE_CHANNEL_ID, BASE_CHANNEL_LINK, STATES } from "./constants.js";
import { getAdminPanelKeyboard, getSuperAdminPanelKeyboard, getUserKeyboard, getCancelKeyboard, getConfirmBroadcastKeyboard } from "./keyboards.js";
import { askForRegion, askForUsername, askUpdateInfo, handleRegistrationContact, handleRegionSelection, handleUpdateRegion, handleUpdateUsername, handleUsername } from "./handlers.js";
import { resolveUserByQuery, sendAdminUserInfo, sendUserList } from "./admin.js";
import { ensureSuperAdmin, isChannelMember, showChannelJoinMessage } from "./membership.js";
import { sendUserInfo } from "./userInfo.js";
import { sendUserMessageToAdmins, sendAdminMessageToSuperAdmin, sendAdminReplyToUser, sendSuperAdminReplyToAdmin } from "./messaging.js";
import { playRandomGame, playSpecificGame, getGameOptionsKeyboard } from "./games.js";

if (!CHANNEL_ID || !CHANNEL_LINK) {
    console.error("⚠️ CHANNEL_ID and CHANNEL_LINK must be set in .env");
}

export const setupRegistrationFlow = () => {
    const bot = getBot();
    if (!bot) {
        throw new Error("Bot not initialized");
    }
    
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
        // Handle main menu buttons first - they should work from any state
        const menuButtons = ["🧾 My info", "✏️ Update info", "📁 Fayl yuborish", "🛠 Admin panel", "👑 Superadmin panel", "✉️ Adminga xabar", "🎮 O'yin"];
        const isMenuButton = menuButtons.includes(ctx.message?.text);
        
        if (isMenuButton) {
            RegistrationState.clearState(ctx.from.id);
            ChatState.clearChat(ctx.from.id);
        }
        
        const state = RegistrationState.getState(ctx.from.id);

        if (!state || isMenuButton) {
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
                
                if (ctx.message?.text === "📁 Fayl yuborish") {
                    RegistrationState.setState(ctx.from.id, { step: STATES.WAITING_FILE, data: {} });
                    ctx.reply("📁 Kanalga yubormoqchi bo'lgan rasm yoki videoni yuboring:", getCancelKeyboard());
                    return;
                }
                
                if (ctx.message?.text === "✉️ Adminga xabar") {
                    RegistrationState.setState(ctx.from.id, { step: STATES.USER_MESSAGING_ADMIN, data: {} });
                    ctx.reply("✉️ Adminlarga yubormoqchi bo'lgan xabaringizni yozing:", getCancelKeyboard());
                    return;
                }
                
                if (ctx.message?.text === "🎮 O'yin") {
                    ctx.reply("🎮 O'yinni tanlang:", getGameOptionsKeyboard());
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
                if (ctx.message?.text === "❌ Bekor qilish") {
                    RegistrationState.clearState(ctx.from.id);
                    ctx.reply("❌ Ro'yxatdan o'tish bekor qilindi. Qaytadan boshlash uchun /start buyrug'ini yuboring.", { reply_markup: { remove_keyboard: true } });
                    return;
                }
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
            case STATES.BROADCAST_MESSAGE: {
                const message = ctx.message.text.trim();
                RegistrationState.updateData(ctx.from.id, { broadcastMessage: message });
                ctx.reply(
                    `📢 Xabaringiz:\n\n${message}\n\n━━━━━━━━━━━━━━━━━━\nHammaga yuborishni tasdiqlaysizmi?`,
                    getConfirmBroadcastKeyboard()
                );
                break;
            }
            case STATES.WAITING_FILE: {
                ctx.reply("📁 Iltimos, rasm yoki video yuboring. Matn qabul qilinmaydi.", getCancelKeyboard());
                break;
            }
            case STATES.USER_MESSAGING_ADMIN: {
                const message = ctx.message.text.trim();
                const successCount = await sendUserMessageToAdmins(ctx, message);
                RegistrationState.clearState(ctx.from.id);
                
                if (successCount > 0) {
                    const existingUser = await UserDatabase.getUserByTelegramId(ctx.from.id);
                    ctx.reply(`✅ Xabaringiz ${successCount} ta adminga yuborildi!`, getUserKeyboard({ 
                        includeAdmin: existingUser?.isAdmin || existingUser?.isSuperAdmin, 
                        includeSuperAdmin: existingUser?.isSuperAdmin 
                    }));
                } else {
                    ctx.reply("❌ Adminlar topilmadi yoki xabar yuborishda xatolik yuz berdi.");
                }
                break;
            }
            case STATES.ADMIN_MESSAGING_USER: {
                const message = ctx.message.text.trim();
                const stateData = RegistrationState.getData(ctx.from.id);
                const targetUserId = stateData.targetUserId;
                
                if (!targetUserId) {
                    ctx.reply("❌ Xatolik: Foydalanuvchi topilmadi.");
                    RegistrationState.clearState(ctx.from.id);
                    return;
                }
                
                const success = await sendAdminReplyToUser(ctx.from.id, targetUserId, message);
                RegistrationState.clearState(ctx.from.id);
                ChatState.clearChat(ctx.from.id);
                
                if (success) {
                    const existingUser = await UserDatabase.getUserByTelegramId(ctx.from.id);
                    ctx.reply("✅ Javobingiz foydalanuvchiga yuborildi!", getUserKeyboard({ 
                        includeAdmin: true, 
                        includeSuperAdmin: existingUser?.isSuperAdmin 
                    }));
                } else {
                    ctx.reply("❌ Javob yuborishda xatolik yuz berdi.");
                }
                break;
            }
            case STATES.ADMIN_MESSAGING_SUPERADMIN: {
                const message = ctx.message.text.trim();
                const success = await sendAdminMessageToSuperAdmin(ctx, message);
                RegistrationState.clearState(ctx.from.id);
                ChatState.clearChat(ctx.from.id);
                
                if (success) {
                    const existingUser = await UserDatabase.getUserByTelegramId(ctx.from.id);
                    ctx.reply("✅ Xabaringiz superadminga yuborildi!", getUserKeyboard({ 
                        includeAdmin: true, 
                        includeSuperAdmin: existingUser?.isSuperAdmin 
                    }));
                } else {
                    ctx.reply("❌ Xabar yuborishda xatolik yuz berdi.");
                }
                break;
            }
            case STATES.SUPERADMIN_MESSAGING_ADMIN: {
                const message = ctx.message.text.trim();
                const stateData = RegistrationState.getData(ctx.from.id);
                const targetAdminId = stateData.targetAdminId;
                
                if (!targetAdminId) {
                    ctx.reply("❌ Xatolik: Admin topilmadi.");
                    RegistrationState.clearState(ctx.from.id);
                    return;
                }
                
                const success = await sendSuperAdminReplyToAdmin(ctx.from.id, targetAdminId, message);
                RegistrationState.clearState(ctx.from.id);
                ChatState.clearChat(ctx.from.id);
                
                if (success) {
                    ctx.reply("✅ Javobingiz adminga yuborildi!", getUserKeyboard({ 
                        includeAdmin: true, 
                        includeSuperAdmin: true 
                    }));
                } else {
                    ctx.reply("❌ Javob yuborishda xatolik yuz berdi.");
                }
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

    // Handle photo messages
    bot.on("photo", async (ctx) => {
        const state = RegistrationState.getState(ctx.from.id);
        const existingUser = await UserDatabase.getUserByTelegramId(ctx.from.id);
        
        if (!existingUser) {
            ctx.reply("Iltimos, /start buyrug'i orqali ro'yxatdan o'ting.");
            return;
        }
        
        if (state && state.step === STATES.WAITING_FILE) {
            try {
                if (!BASE_CHANNEL_ID) {
                    ctx.reply("❌ Base kanal sozlanmagan. Iltimos, admin bilan bog'laning.");
                    RegistrationState.clearState(ctx.from.id);
                    return;
                }
                
                const photo = ctx.message.photo[ctx.message.photo.length - 1]; // Get highest resolution
                const roleLabel = existingUser.isSuperAdmin ? "👑 Superadmin" : existingUser.isAdmin ? "🛠 Admin" : "👤 User";
                const caption = `📷 ${roleLabel}\n👤 Username: #${existingUser.username}\n🆔 ID: ${ctx.from.id}`;
                
                await ctx.telegram.sendPhoto(BASE_CHANNEL_ID, photo.file_id, { caption });
                
                RegistrationState.clearState(ctx.from.id);
                const normalizedUser = await ensureSuperAdmin(existingUser);
                ctx.reply("✅ Rasm base kanalga yuborildi!", getUserKeyboard({ 
                    includeAdmin: normalizedUser.isAdmin || normalizedUser.isSuperAdmin, 
                    includeSuperAdmin: normalizedUser.isSuperAdmin 
                }));
            } catch (error) {
                console.error("Error sending photo to channel:", error);
                ctx.reply("❌ Rasmni yuborishda xatolik yuz berdi. Qaytadan urinib ko'ring.");
            }
        } else {
            ctx.reply("📁 Rasm yuborish uchun \"📁 Fayl yuborish\" tugmasini bosing.");
        }
    });

    // Handle video messages
    bot.on("video", async (ctx) => {
        const state = RegistrationState.getState(ctx.from.id);
        const existingUser = await UserDatabase.getUserByTelegramId(ctx.from.id);
        
        if (!existingUser) {
            ctx.reply("Iltimos, /start buyrug'i orqali ro'yxatdan o'ting.");
            return;
        }
        
        if (state && state.step === STATES.WAITING_FILE) {
            try {
                if (!BASE_CHANNEL_ID) {
                    ctx.reply("❌ Base kanal sozlanmagan. Iltimos, admin bilan bog'laning.");
                    RegistrationState.clearState(ctx.from.id);
                    return;
                }
                
                const video = ctx.message.video;
                const roleLabel = existingUser.isSuperAdmin ? "👑 Superadmin" : existingUser.isAdmin ? "🛠 Admin" : "👤 User";
                const caption = `🎥 ${roleLabel}\n👤 Username: #${existingUser.username}\n🆔 ID: ${ctx.from.id}`;
                
                await ctx.telegram.sendVideo(BASE_CHANNEL_ID, video.file_id, { caption });
                
                RegistrationState.clearState(ctx.from.id);
                const normalizedUser = await ensureSuperAdmin(existingUser);
                ctx.reply("✅ Video base kanalga yuborildi!", getUserKeyboard({ 
                    includeAdmin: normalizedUser.isAdmin || normalizedUser.isSuperAdmin, 
                    includeSuperAdmin: normalizedUser.isSuperAdmin 
                }));
            } catch (error) {
                console.error("Error sending video to channel:", error);
                ctx.reply("❌ Videoni yuborishda xatolik yuz berdi. Qaytadan urinib ko'ring.");
            }
        } else {
            ctx.reply("🎥 Video yuborish uchun \"📁 Fayl yuborish\" tugmasini bosing.");
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
        ctx.reply("📝 Yangi username kiriting:", getCancelKeyboard());
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

    // Universal cancel action
    bot.action("cancel_action", async (ctx) => {
        RegistrationState.clearState(ctx.from.id);
        await ctx.answerCbQuery("Bekor qilindi");
        const user = await UserDatabase.getUserByTelegramId(ctx.from.id);
        if (user) {
            const normalizedUser = await ensureSuperAdmin(user);
            ctx.reply("🏠 Bosh menyu", getUserKeyboard({ 
                includeAdmin: normalizedUser.isAdmin || normalizedUser.isSuperAdmin, 
                includeSuperAdmin: normalizedUser.isSuperAdmin 
            }));
        } else {
            ctx.reply("Bekor qilindi.");
        }
    });

    // Go home action
    bot.action("go_home", async (ctx) => {
        RegistrationState.clearState(ctx.from.id);
        await ctx.answerCbQuery();
        const user = await UserDatabase.getUserByTelegramId(ctx.from.id);
        if (user) {
            const normalizedUser = await ensureSuperAdmin(user);
            ctx.reply("🏠 Bosh menyu", getUserKeyboard({ 
                includeAdmin: normalizedUser.isAdmin || normalizedUser.isSuperAdmin, 
                includeSuperAdmin: normalizedUser.isSuperAdmin 
            }));
        }
    });

    // Broadcast message action
    bot.action("broadcast_message", async (ctx) => {
        await ctx.answerCbQuery();
        const superAdmin = await isSuperAdmin(ctx.from.id);
        if (!superAdmin) {
            ctx.reply("❌ Bu amalni faqat superadmin bajar ola oladi!");
            return;
        }
        RegistrationState.setState(ctx.from.id, { step: STATES.BROADCAST_MESSAGE, data: {} });
        ctx.reply("📢 Hammaga yubormoqchi bo'lgan xabaringizni yozing:", getCancelKeyboard());
    });

    // Confirm broadcast action
    bot.action("confirm_broadcast", async (ctx) => {
        await ctx.answerCbQuery();
        const superAdmin = await isSuperAdmin(ctx.from.id);
        if (!superAdmin) {
            ctx.reply("❌ Bu amalni faqat superadmin bajar ola oladi!");
            return;
        }
        
        const stateData = RegistrationState.getData(ctx.from.id);
        const message = stateData.broadcastMessage;
        
        if (!message) {
            ctx.reply("❌ Xabar topilmadi. Qaytadan urinib ko'ring.");
            RegistrationState.clearState(ctx.from.id);
            return;
        }
        
        const users = await UserDatabase.getAllUsers();
        let successCount = 0;
        let failCount = 0;
        
        const bot = getBot();
        
        for (const user of users) {
            try {
                await bot.telegram.sendMessage(user.telegramId, `📢 SUPERADMINDAN XABAR\n━━━━━━━━━━━━━━━━━━\n\n${message}`);
                successCount++;
            } catch (error) {
                failCount++;
                console.error(`Failed to send to ${user.telegramId}:`, error.message);
            }
        }
        
        RegistrationState.clearState(ctx.from.id);
        ctx.reply(`✅ Xabar yuborildi!\n\n📊 Statistika:\n✅ Yuborildi: ${successCount}\n❌ Yuborilmadi: ${failCount}`);
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
        ctx.reply("🔍 Foydalanuvchini ID yoki username bo'yicha kiriting:", getCancelKeyboard());
    });

    bot.action("admin_promote", async (ctx) => {
        await ctx.answerCbQuery();
        const superAdmin = await isSuperAdmin(ctx.from.id);
        if (!superAdmin) {
            ctx.reply("❌ Bu amalni faqat superadmin bajar ola oladi!");
            return;
        }
        RegistrationState.setState(ctx.from.id, { step: STATES.ADMIN_PROMOTE, data: {} });
        ctx.reply("⬆️ Admin qilish uchun foydalanuvchi ID yoki username kiriting:", getCancelKeyboard());
    });

    bot.action("admin_demote", async (ctx) => {
        await ctx.answerCbQuery();
        const superAdmin = await isSuperAdmin(ctx.from.id);
        if (!superAdmin) {
            ctx.reply("❌ Bu amalni faqat superadmin bajar ola oladi!");
            return;
        }
        RegistrationState.setState(ctx.from.id, { step: STATES.ADMIN_DEMOTE, data: {} });
        ctx.reply("⬇️ Adminlikdan olish uchun foydalanuvchi ID yoki username kiriting:", getCancelKeyboard());
    });

    // Admin file upload action
    bot.action("admin_send_file", async (ctx) => {
        await ctx.answerCbQuery();
        const admin = await isAdmin(ctx.from.id);
        if (!admin) {
            ctx.reply("❌ Bu amalni bajarishga sizda ruxsat yo'q!");
            return;
        }
        
        if (!BASE_CHANNEL_ID || !BASE_CHANNEL_LINK) {
            ctx.reply("❌ Base kanal sozlanmagan. Iltimos, admin bilan bog'laning.");
            return;
        }
        
        RegistrationState.setState(ctx.from.id, { step: STATES.WAITING_FILE, data: {} });
        ctx.reply("📁 Base kanalga yubormoqchi bo'lgan rasm yoki videoni yuboring:", getCancelKeyboard());
    });

    // Superadmin file upload action
    bot.action("superadmin_send_file", async (ctx) => {
        await ctx.answerCbQuery();
        const superAdmin = await isSuperAdmin(ctx.from.id);
        if (!superAdmin) {
            ctx.reply("❌ Bu amalni faqat superadmin bajar ola oladi!");
            return;
        }
        
        if (!BASE_CHANNEL_ID || !BASE_CHANNEL_LINK) {
            ctx.reply("❌ Base kanal sozlanmagan. Iltimos, admin bilan bog'laning.");
            return;
        }
        
        RegistrationState.setState(ctx.from.id, { step: STATES.WAITING_FILE, data: {} });
        ctx.reply("📁 Base kanalga yubormoqchi bo'lgan rasm yoki videoni yuboring:", getCancelKeyboard());
    });

    // Admin message superadmin action
    bot.action("admin_message_superadmin", async (ctx) => {
        await ctx.answerCbQuery();
        const admin = await isAdmin(ctx.from.id);
        if (!admin) {
            ctx.reply("❌ Bu amalni bajarishga sizda ruxsat yo'q!");
            return;
        }
        
        RegistrationState.setState(ctx.from.id, { step: STATES.ADMIN_MESSAGING_SUPERADMIN, data: {} });
        ctx.reply("✉️ Superadminga yubormoqchi bo'lgan xabaringizni yozing:", getCancelKeyboard());
    });

    // Reply to user from admin
    bot.action(/^reply_to_user:(\d+)$/, async (ctx) => {
        await ctx.answerCbQuery();
        const admin = await isAdmin(ctx.from.id);
        if (!admin) {
            ctx.reply("❌ Bu amalni bajarishga sizda ruxsat yo'q!");
            return;
        }
        
        const userId = parseInt(ctx.match[1]);
        const user = await UserDatabase.getUserByTelegramId(userId);
        
        if (!user) {
            ctx.reply("❌ Foydalanuvchi topilmadi!");
            return;
        }
        
        RegistrationState.setState(ctx.from.id, { step: STATES.ADMIN_MESSAGING_USER, data: { targetUserId: userId } });
        ChatState.setChat(ctx.from.id, userId, 'user');
        ctx.reply(`💬 #${user.username} foydalanuvchiga javob yozing:`, getCancelKeyboard());
    });

    // Reply to admin from superadmin
    bot.action(/^reply_to_admin:(\d+)$/, async (ctx) => {
        await ctx.answerCbQuery();
        const superAdmin = await isSuperAdmin(ctx.from.id);
        if (!superAdmin) {
            ctx.reply("❌ Bu amalni faqat superadmin bajar ola oladi!");
            return;
        }
        
        const adminId = parseInt(ctx.match[1]);
        const admin = await UserDatabase.getUserByTelegramId(adminId);
        
        if (!admin) {
            ctx.reply("❌ Admin topilmadi!");
            return;
        }
        
        RegistrationState.setState(ctx.from.id, { step: STATES.SUPERADMIN_MESSAGING_ADMIN, data: { targetAdminId: adminId } });
        ChatState.setChat(ctx.from.id, adminId, 'admin');
        ctx.reply(`💬 #${admin.username} adminga javob yozing:`, getCancelKeyboard());
    });

    // Reply to admin from user (continuing conversation)
    bot.action(/^reply_to_admin_from_user:(\d+)$/, async (ctx) => {
        await ctx.answerCbQuery();
        
        RegistrationState.setState(ctx.from.id, { step: STATES.USER_MESSAGING_ADMIN, data: {} });
        ctx.reply("✉️ Adminga yubormoqchi bo'lgan xabaringizni yozing:", getCancelKeyboard());
    });

    // Reply to superadmin from admin (continuing conversation)
    bot.action(/^reply_to_superadmin:(\d+)$/, async (ctx) => {
        await ctx.answerCbQuery();
        const admin = await isAdmin(ctx.from.id);
        if (!admin) {
            ctx.reply("❌ Bu amalni bajarishga sizda ruxsat yo'q!");
            return;
        }
        
        RegistrationState.setState(ctx.from.id, { step: STATES.ADMIN_MESSAGING_SUPERADMIN, data: {} });
        ctx.reply("✉️ Superadminga yubormoqchi bo'lgan xabaringizni yozing:", getCancelKeyboard());
    });

    // Game actions
    bot.action(/^game:(.+)$/, async (ctx) => {
        const gameType = ctx.match[1];
        await playSpecificGame(ctx, gameType);
    });
};

export { isChannelMember, showChannelJoinMessage } from "./membership.js";
