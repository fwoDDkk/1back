import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
dotenv.config();

export const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });
export const MANAGER_ID = process.env.MANAGER_ID; // id менеджера або chat_id
