import { Telegraf } from "telegraf";
import { config } from "dotenv"
config()

const bot = new Telegraf(process.env.TG_BOT_TOKEN)
async function initBot() {
    bot.launch()
    console.log("bot is running")
}

export {
    initBot,
    bot
}

