import { REGIONS } from "./constants.js";

export const getUserKeyboard = (options = {}) => {
    const baseRow = [{ text: "🧾 My info" }, { text: "✏️ Update info" }];
    const fileRow = [{ text: "📁 Fayl yuborish" }];
    const messageRow = [{ text: "✉️ Adminga xabar" }];
    const gameRow = [{ text: "🎮 O'yin" }];
    const adminRow = options.includeAdmin ? [{ text: "🛠 Admin panel" }] : [];
    const superAdminRow = options.includeSuperAdmin ? [{ text: "👑 Superadmin panel" }] : [];

    const rows = [baseRow, fileRow, messageRow, gameRow];
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
                { text: "❌ Bekor qilish", callback_data: "cancel_action" }
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
    
    // Add cancel button at the end
    inlineKeyboard.push([{ text: "❌ Bekor qilish", callback_data: "cancel_action" }]);

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
            ],
            [
                { text: "📁 Fayl yuborish", callback_data: "admin_send_file" }
            ],
            [
                { text: "✉️ Superadminga xabar", callback_data: "admin_message_superadmin" }
            ],
            [
                { text: "🏠 Bosh menyu", callback_data: "go_home" }
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
            ],
            [
                { text: "📢 Hammaga xabar", callback_data: "broadcast_message" }
            ],
            [
                { text: "📁 Fayl yuborish", callback_data: "superadmin_send_file" }
            ],
            [
                { text: "🏠 Bosh menyu", callback_data: "go_home" }
            ]
        ]
    }
});

export const getCancelKeyboard = () => ({
    reply_markup: {
        inline_keyboard: [
            [{ text: "❌ Bekor qilish", callback_data: "cancel_action" }]
        ]
    }
});

export const getConfirmBroadcastKeyboard = () => ({
    reply_markup: {
        inline_keyboard: [
            [
                { text: "✅ Yuborish", callback_data: "confirm_broadcast" },
                { text: "❌ Bekor qilish", callback_data: "cancel_action" }
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
            ],
            [
                {
                    text: "❌ Bekor qilish"
                }
            ]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
    }
});
