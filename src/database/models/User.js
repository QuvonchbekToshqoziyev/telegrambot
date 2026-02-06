export class User {
    constructor(data) {
        this.id = data.id;
        this.telegramId = data.telegram_id || data.telegramId;
        this.username = data.username;
        this.phone = data.phone;
        this.region = data.region || "Noma'lum";
        this.isAdmin = data.is_admin || data.isAdmin || false;
        this.isSuperAdmin = data.is_super_admin || data.isSuperAdmin || false;
        this.joinedAt = data.joined_at || data.joinedAt;
        this.channelJoinedAt = data.channel_joined_at || data.channelJoinedAt;
        this.lastActivity = data.last_activity || data.lastActivity;
        this.createdAt = data.created_at || data.createdAt;
        this.updatedAt = data.updated_at || data.updatedAt;
    }

    static fromDB(row) {
        if (!row) return null;
        return new User(row);
    }

    toDB() {
        return {
            telegram_id: this.telegramId,
            username: this.username.toLowerCase(),
            phone: this.phone,
            region: this.region,
            is_admin: this.isAdmin,
            is_super_admin: this.isSuperAdmin
        };
    }
}

export default User;
