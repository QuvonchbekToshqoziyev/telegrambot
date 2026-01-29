import { config } from "dotenv"
import express from "express"
config()
import { connectDB } from "./database/config.js"
import { initBot } from "./bot/bot.js"
import "./bot/setup.js"

const app = express()

await connectDB()

initBot()

app.listen(3434, console.log("server is running on port 3434"))