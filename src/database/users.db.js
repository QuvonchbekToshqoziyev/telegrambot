import User from "./models/User.js";
import { pool } from "./config.js";

export class UserDatabase {
    static async getUserByTelegramId(telegramId) {
        try {
            const result = await pool.query(
                "SELECT * FROM users WHERE telegram_id = $1",
                [telegramId]
            );
            return result.rows.length > 0 ? User.fromDB(result.rows[0]) : null;
        } catch (error) {
            console.error("Error getting user by telegram ID:", error);
            return null;
        }
    }

    static async getUserByUsername(username) {
        try {
            const result = await pool.query(
                "SELECT * FROM users WHERE username = $1",
                [username.toLowerCase()]
            );
            return result.rows.length > 0 ? User.fromDB(result.rows[0]) : null;
        } catch (error) {
            console.error("Error getting user by username:", error);
            return null;
        }
    }

    static async createUser(userData) {
        try {
            const result = await pool.query(
                `INSERT INTO users (telegram_id, username, phone, region, is_admin, is_super_admin)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [
                    userData.telegramId,
                    userData.username.toLowerCase(),
                    userData.phone,
                    userData.region || "Noma'lum",
                    userData.isAdmin || false,
                    userData.isSuperAdmin || false
                ]
            );
            return User.fromDB(result.rows[0]);
        } catch (error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }
    }

    static async getAllUsers() {
        try {
            const result = await pool.query(
                "SELECT * FROM users ORDER BY joined_at DESC"
            );
            return result.rows.map(row => User.fromDB(row));
        } catch (error) {
            console.error("Error getting all users:", error);
            return [];
        }
    }

    static async updateUser(telegramId, updates) {
        try {
            // Build dynamic UPDATE query
            const fields = [];
            const values = [];
            let paramIndex = 1;

            // Map camelCase to snake_case
            const fieldMapping = {
                username: 'username',
                phone: 'phone',
                region: 'region',
                isAdmin: 'is_admin',
                isSuperAdmin: 'is_super_admin',
                lastActivity: 'last_activity'
            };

            for (const [key, value] of Object.entries(updates)) {
                const dbField = fieldMapping[key] || key;
                fields.push(`${dbField} = $${paramIndex}`);
                values.push(key === 'username' ? value.toLowerCase() : value);
                paramIndex++;
            }

            // Add updated_at
            fields.push(`updated_at = CURRENT_TIMESTAMP`);
            
            // Add telegram_id for WHERE clause
            values.push(telegramId);

            const query = `
                UPDATE users 
                SET ${fields.join(', ')}
                WHERE telegram_id = $${paramIndex}
                RETURNING *
            `;

            const result = await pool.query(query, values);
            
            if (result.rows.length === 0) {
                throw new Error("User not found");
            }
            
            return User.fromDB(result.rows[0]);
        } catch (error) {
            throw new Error(`Failed to update user: ${error.message}`);
        }
    }

    static async isUsernameUnique(username) {
        try {
            const result = await pool.query(
                "SELECT id FROM users WHERE username = $1",
                [username.toLowerCase()]
            );
            return result.rows.length === 0;
        } catch (error) {
            console.error("Error checking username uniqueness:", error);
            return false;
        }
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
                await UserDatabase.createUser({
                    telegramId: superAdminId,
                    username: "superadmin",
                    phone: "+000000000",
                    region: "System",
                    isAdmin: true,
                    isSuperAdmin: true
                });
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
