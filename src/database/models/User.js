import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    telegramId: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 20,
        lowercase: true,
        index: true
    },
    phone: {
        type: String,
        required: true
    },
    region: {
        type: String,
        required: true,
        default: "Noma'lum"
    },
    isAdmin: {
        type: Boolean,
        default: false,
        index: true
    },
    isSuperAdmin: {
        type: Boolean,
        default: false
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    channelJoinedAt: {
        type: Date,
        default: Date.now
    },
    lastActivity: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);

export default User;
