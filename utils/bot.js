const TelegramBot = require("node-telegram-bot-api");
const dotenv = require("dotenv");

dotenv.config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

const MANAGER_ID = process.env.MANAGER_ID;

// 🔔 Обробка успішної оплати зірками
bot.on("message", async (msg) => {
  if (msg.successful_payment) {
    try {
      const { total_amount, invoice_payload } = msg.successful_payment;
      const stars = invoice_payload.split("_")[2];
      const user = msg.from;

      // 📨 Повідомлення менеджеру
      await bot.sendMessage(
        MANAGER_ID,
        `💫 <b>Нова оплата зірками!</b>\n\n👤 <b>@${user.username || user.first_name}</b>\n⭐ ${stars} зірок\n💰 Сума: ${total_amount / 1000000} XTR`,
        { parse_mode: "HTML" }
      );

      // 🔔 Підтвердження користувачу
      await bot.sendMessage(
        user.id,
        "✅ Оплату отримано! Менеджер уже отримав сповіщення."
      );
    } catch (err) {
      console.error("❌ Error handling payment:", err);
    }
  }
});

module.exports = { bot, MANAGER_ID };
