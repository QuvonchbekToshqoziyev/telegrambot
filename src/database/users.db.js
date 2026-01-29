import User from "./models/User.js";

export class UserDatabase {
    static async getUserByTelegramId(telegramId) {
        return await User.findOne({ telegramId });
    }

    static async getUserByUsername(username) {
        return await User.findOne({ username: username.toLowerCase() });
    }

    static async createUser(userData) {
        try {
            const newUser = new User({
                telegramId: userData.telegramId,
                username: userData.username.toLowerCase(),
                phone: userData.phone,
                region: userData.region,
                isAdmin: false,
                isSuperAdmin: false
            });
            return await newUser.save();
        } catch (error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }
    }
    static async getAllUsers() {
        return await User.find({}).sort({ joinedAt: -1 });
    }
    static async updateUser(telegramId, updates) {
        const user = await User.findOneAndUpdate(
            { telegramId },
            { $set: updates },
            { new: true }
        );
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }
    static async isUsernameUnique(username) {
        const existing = await User.findOne({ username: username.toLowerCase() });
        return !existing;
    }
}

export class RegistrationState {
    static states = new Map();
    static getState(userId) {
        return this.states.get(userId);
    }
    static setState(userId, state) {
        this.states.set(userId, state);
    }
    static clearState(userId) {
        this.states.delete(userId);
    }
    static updateData(userId, data) {
        const current = this.states.get(userId) || { step: "channel_check", data: {} };
        current.data = { ...current.data, ...data };
        this.states.set(userId, current);
    }
    static getData(userId) {
        const state = this.states.get(userId);
        return state ? state.data : {};
    }
}
export const initializeSuperAdmin = async () => {
    const superAdminId = process.env.SUPERADMIN_ID ? parseInt(process.env.SUPERADMIN_ID) : null;
    if (superAdminId) {
        try {
            const existing = await UserDatabase.getUserByTelegramId(superAdminId);
            if (!existing) {
                const superAdmin = new User({
                    telegramId: superAdminId,
                    username: "superadmin",
                    phone: "+000000000",
                    isSuperAdmin: true
                });
                await superAdmin.save();
                console.log("✅ SuperAdmin initialized");
            }
        } catch (error) {
            console.error("Error initializing superadmin:", error.message);
        }
    }
};

export default {
    UserDatabase,
    RegistrationState
};
