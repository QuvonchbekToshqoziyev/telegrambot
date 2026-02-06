export const REGIONS = [
    "Andijon",
    "Buxoro",
    "Farg'ona",
    "Jizzax",
    "Qashqadaryo",
    "Xorazm",
    "Namangan",
    "Navoiy",
    "Samarqand",
    "Surxondaryo",
    "Sirdaryo",
    "Toshkent"
];

export const CHANNEL_ID = process.env.CHANNEL_ID ? parseInt(process.env.CHANNEL_ID) : null;
export const CHANNEL_LINK = process.env.CHANNEL_LINK;

// Base channel where all files are posted
export const BASE_CHANNEL_ID = process.env.BASE_CHANNEL_ID ? parseInt(process.env.BASE_CHANNEL_ID) : null;
export const BASE_CHANNEL_LINK = process.env.BASE_CHANNEL_LINK;

export const STATES = {
    CHANNEL_CHECK: "channel_check",
    WAITING_USERNAME: "waiting_username",
    WAITING_REGION: "waiting_region",
    WAITING_CONTACT: "waiting_contact",
    UPDATE_CHOOSE: "update_choose",
    UPDATE_USERNAME: "update_username",
    UPDATE_REGION: "update_region",
    ADMIN_SEARCH_USER: "admin_search_user",
    ADMIN_PROMOTE: "admin_promote",
    ADMIN_DEMOTE: "admin_demote",
    BROADCAST_MESSAGE: "broadcast_message",
    WAITING_FILE: "waiting_file",
    USER_MESSAGING_ADMIN: "user_messaging_admin",
    ADMIN_MESSAGING_USER: "admin_messaging_user",
    ADMIN_MESSAGING_SUPERADMIN: "admin_messaging_superadmin",
    SUPERADMIN_MESSAGING_ADMIN: "superadmin_messaging_admin"
};
