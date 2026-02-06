import { Telegraf } from "telegraf";

let bot = null;

export const getBot = () => bot;

export const initBot = async () => {
    if (!process.env.TG_BOT_TOKEN) {
        throw new Error("TG_BOT_TOKEN is not set in environment");
    }
    
    bot = new Telegraf(process.env.TG_BOT_TOKEN);
    
    try {
        bot.launch().catch(error => {
            console.error("❌ Bot error:", error.message);
        });
        
        return bot;
    } catch (error) {
        console.error("❌ Bot initialization failed:", error.message);
        throw error;
    }
};

