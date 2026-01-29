import mongoose from "mongoose";
import { config } from "dotenv";

config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/tgbot";

export const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        });
        console.log("✅ MongoDB connected successfully");
        return mongoose.connection;
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
        console.log("⚠️ Continuing without MongoDB - bot will run but user data won't persist");
    }
};

export const disconnectDB = async () => {
    try {
        await mongoose.disconnect();
        console.log("✅ MongoDB disconnected");
    } catch (error) {
        console.error("❌ MongoDB disconnection failed:", error.message);
    }
};

export default mongoose;
