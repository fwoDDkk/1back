const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

bot.on("polling_error", (err) => console.error("Polling error:", err));

module.exports = { bot };
