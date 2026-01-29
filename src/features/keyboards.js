import { REGIONS } from "./constants.js";

export const getUserKeyboard = (options = {}) => {
    const baseRow = [{ text: "🧾 My info" }, { text: "✏️ Update info" }];
    const adminRow = options.includeAdmin ? [{ text: "🛠 Admin panel" }] : [];
    const superAdminRow = options.includeSuperAdmin ? [{ text: "👑 Superadmin panel" }] : [];

    const rows = [baseRow];
    if (adminRow.length) rows.push(adminRow);
    if (superAdminRow.length) rows.push(superAdminRow);

    return {
        reply_markup: {
            keyboard: rows,
            resize_keyboard: true
        }
    };
};

export const getUpdateInfoKeyboard = () => ({
    reply_markup: {
        inline_keyboard: [
            [
                { text: "📝 Username", callback_data: "update_username" },
                { text: "📍 Hudud", callback_data: "update_region" }
            ],
            [
                { text: "❌ Cancel", callback_data: "update_cancel" }
            ]
        ]
    }
});

export const getRegionKeyboard = () => {
    const inlineKeyboard = [];
    for (let i = 0; i < REGIONS.length; i += 2) {
        inlineKeyboard.push([
            {
                text: REGIONS[i],
                callback_data: `select_region:${REGIONS[i]}`
            },
            ...(REGIONS[i + 1]
                ? [{ text: REGIONS[i + 1], callback_data: `select_region:${REGIONS[i + 1]}` }]
                : [])
        ]);
    }

    return {
        reply_markup: {
            inline_keyboard: inlineKeyboard
        }
    };
};

export const getAdminPanelKeyboard = () => ({
    reply_markup: {
        inline_keyboard: [
            [
                { text: "👥 Get all users", callback_data: "admin_get_all" },
                { text: "🔍 Get user", callback_data: "admin_get_one" }
            ]
        ]
    }
});

export const getSuperAdminPanelKeyboard = () => ({
    reply_markup: {
        inline_keyboard: [
            [
                { text: "⬆️ Promote admin", callback_data: "admin_promote" },
                { text: "⬇️ Demote admin", callback_data: "admin_demote" }
            ]
        ]
    }
});

export const getContactKeyboard = () => ({
    reply_markup: {
        keyboard: [
            [
                {
                    text: "📱 Telefon raqam yuborish",
                    request_contact: true
                }
            ]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
    }
});
