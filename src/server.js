import { config } from "dotenv"
import express from "express"
config()
import { connectDB } from "./database/config.js"
import { initBot } from "./bot/bot.js"
import { initializeBotSetup } from "./bot/setup.js"

const app = express()

async function startServer() {
    try {
        console.log("🚀 Starting server...");
        
        const db = await connectDB();
        if (!db) {
            throw new Error("Failed to connect to database");
        }
        console.log("✅ Database connected");

        // Launch bot first
        console.log("🚀 Launching bot...");
        await initBot();
        console.log("✅ Bot launched");
        
        // Then initialize bot setup
        console.log("🤖 Initializing bot setup...");
        await initializeBotSetup();
        console.log("✅ Bot setup initialized");

        // Start server
        app.listen(3434, () => {
            console.log("✅ Server is running on port 3434");
        });
    } catch (error) {
        console.error("❌ Startup error:", error.message);
        process.exit(1);
    }
}

startServer();