import { UserDatabase, RegistrationState } from "../database/users.db.js";
import { REGIONS, STATES } from "./constants.js";
import { getContactKeyboard, getRegionKeyboard, getUpdateInfoKeyboard, getCancelKeyboard } from "./keyboards.js";
import { sendUserInfo } from "./userInfo.js";

export const askForUsername = (ctx) => {
    const msg = `
👤 FOYDALANUVCHI NOMI
━━━━━━━━━━━━━━━━━━

Iltimos, o'zingizga yangi username nomi kiriting (maksimal 20 ta belgi):
    `;

    RegistrationState.setState(ctx.from.id, {
        step: STATES.WAITING_USERNAME,
        data: {}
    });

    ctx.reply(msg);
};

export const askForRegion = (ctx, step = STATES.WAITING_REGION) => {
    const msg = `
📍 HUDUDNI TANLANG
━━━━━━━━━━━━━━━━━━

Iltimos, quyidagi 12 ta viloyatdan birini tanlang:
    `;

    RegistrationState.setState(ctx.from.id, {
        step,
        data: RegistrationState.getData(ctx.from.id)
    });

    ctx.reply(msg, getRegionKeyboard());
};

export const askUpdateInfo = (ctx) => {
    const msg = `
✏️ MA'LUMOTLARNI YANGILASH
━━━━━━━━━━━━━━━━━━
Qaysi ma'lumotni yangilamoqchisiz?
    `;

    RegistrationState.setState(ctx.from.id, {
        step: STATES.UPDATE_CHOOSE,
        data: {}
    });

    ctx.reply(msg, getUpdateInfoKeyboard());
};

export const validateUsername = async (ctx, username) => {
    if (username.length > 20) {
        ctx.reply(`❌ Foydalanuvchi nomi 20 ta belgidan ko'p bo'la olmaydi!\n\n📝 Yana bir marta kiriting:`);
        return false;
    }

    if (username.length < 3) {
        ctx.reply(`❌ Foydalanuvchi nomi kamida 3 ta belgidan iborat bo'lishi kerak!\n\n📝 Yana bir marta kiriting:`);
        return false;
    }

    if (!(/^[a-zA-Z0-9_]+$/.test(username))) {
        ctx.reply(`❌ Foydalanuvchi nomi faqat harf, raqam va _ belgisini o'z ichiga olishi mumkin!\n\n📝 Yana bir marta kiriting:`);
        return false;
    }

    if (!(await UserDatabase.isUsernameUnique(username))) {
        ctx.reply(`❌ Bu foydalanuvchi nomi allaqachon band!\n\n📝 Boshqa nomi kiriting:`);
        return false;
    }

    return true;
};

export const handleUsername = async (ctx) => {
    const username = ctx.message.text.trim();
    const ok = await validateUsername(ctx, username);
    if (!ok) return;

    RegistrationState.updateData(ctx.from.id, { username });
    askForRegion(ctx);
};

export const handleRegionSelection = async (ctx) => {
    const data = ctx.callbackQuery?.data || "";
    const region = data.replace("select_region:", "").trim();

    if (!REGIONS.includes(region)) {
        await ctx.answerCbQuery("Noto'g'ri hudud tanlandi", true);
        return;
    }

    RegistrationState.updateData(ctx.from.id, { region });
    RegistrationState.setState(ctx.from.id, { step: STATES.WAITING_CONTACT, data: RegistrationState.getData(ctx.from.id) });

    await ctx.answerCbQuery();

    const contactMsg = `
📱 TELEFON RAQAMI
━━━━━━━━━━━━━━━━━━

Telefon raqamingizni yuboring:
    `;

    ctx.reply(contactMsg, getContactKeyboard());
};

export const handleRegistrationContact = async (ctx) => {
    const phone = ctx.message.contact.phone_number;
    const stateData = RegistrationState.getData(ctx.from.id);

    const user = await UserDatabase.createUser({
        telegramId: ctx.from.id,
        username: stateData.username,
        phone,
        region: stateData.region
    });

    RegistrationState.clearState(ctx.from.id);

    const successMsg = `
✅ Registratsiya yakunlandi!
━━━━━━━━━━━━━━━━━━
🎉 Xush kelibsiz!

👤 Username: #${user.username}
📱 Telefon: ${user.phone}
📍 Hudud: ${user.region}
📅 registratsiya sanasi: ${user.joinedAt.toLocaleDateString('uz-UZ')}

Siz hozir botdan foydalanishni boshlashingiz mumkin!
        `;

    ctx.reply(successMsg, { reply_markup: { remove_keyboard: true } });

    return user;
};

export const handleUpdateUsername = async (ctx, includeAdmin, includeSuperAdmin) => {
    const username = ctx.message.text.trim();
    const currentUser = await UserDatabase.getUserByTelegramId(ctx.from.id);

    if (currentUser && currentUser.username.toLowerCase() === username.toLowerCase()) {
        RegistrationState.clearState(ctx.from.id);
        ctx.reply("✅ Username o'zgarmadi.");
        await sendUserInfo(ctx, currentUser, { includeAdmin, includeSuperAdmin });
        return;
    }

    const ok = await validateUsername(ctx, username);
    if (!ok) return;

    const updatedUser = await UserDatabase.updateUser(ctx.from.id, { username: username.toLowerCase() });
    RegistrationState.clearState(ctx.from.id);
    ctx.reply("✅ Username yangilandi.");
    await sendUserInfo(ctx, updatedUser, { includeAdmin, includeSuperAdmin });
};

export const handleUpdateRegion = async (ctx, includeAdmin, includeSuperAdmin) => {
    const data = ctx.callbackQuery?.data || "";
    const region = data.replace("select_region:", "").trim();

    if (!REGIONS.includes(region)) {
        await ctx.answerCbQuery("Noto'g'ri hudud tanlandi", true);
        return;
    }

    await ctx.answerCbQuery();
    const updatedUser = await UserDatabase.updateUser(ctx.from.id, { region });
    RegistrationState.clearState(ctx.from.id);
    ctx.reply("✅ Hudud yangilandi.");
    await sendUserInfo(ctx, updatedUser, { includeAdmin, includeSuperAdmin });
};
