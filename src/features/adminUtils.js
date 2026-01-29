import { UserDatabase } from "../database/users.db.js";

export const isAdmin = async (userId) => {
    const user = await UserDatabase.getUserByTelegramId(userId);
    return user ? (user.isAdmin || user.isSuperAdmin) : false;
};

export const isSuperAdmin = async (userId) => {
    const user = await UserDatabase.getUserByTelegramId(userId);
    return user ? user.isSuperAdmin : false;
};
