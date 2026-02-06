import { config } from "dotenv"
import express from "express"
config({ silent: true })
import { connectDB } from "./database/config.js"
import { initBot } from "./bot/bot.js"
import { initializeBotSetup } from "./bot/setup.js"

const app = express()

async function startServer() {
    try {
        const db = await connectDB();
        if (!db) {
            throw new Error("Failed to connect to database");
        }

        await initBot();
        await initializeBotSetup();

        app.listen(3434, () => {
            console.log("✅ Server is running on port 3434");
        });
    } catch (error) {
        console.error("❌ Startup error:", error.message);
        process.exit(1);
    }
}

startServer();