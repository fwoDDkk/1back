const express = require("express");
const axios = require("axios");
const db = require("../db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();
router.use(authMiddleware);

// ======================================================
// 💸 POST /api/pay/sell — створення інвойсу для продажу зірок
// ======================================================
router.post("/sell", async (req, res) => {
  try {
    const { telegramId } = req.user;
    const { stars } = req.body;

    if (!stars || stars <= 0)
      return res.status(400).json({ success: false, message: "Invalid stars amount" });

    const botToken = process.env.BOT_TOKEN;
    const providerToken = process.env.PROVIDER_TOKEN;

    // 🔹 Генеруємо Telegram інвойс
    const invoiceResponse = await axios.post(
      `https://api.telegram.org/bot${botToken}/createInvoiceLink`,
      {
        title: "Sell Stars",
        description: `Продаж ${stars}⭐ менеджеру`,
        payload: `sell_${telegramId}_${stars}_${Date.now()}`,
        provider_token: providerToken,
        currency: "XTR", // Telegram Stars
        prices: [{ label: "Stars", amount: stars }],
      }
    );

    if (!invoiceResponse.data.ok)
      return res.status(400).json({ success: false, message: "Failed to create invoice" });

    const invoiceLink = invoiceResponse.data.result;

    // 💾 Записуємо заявку в базу
    await db.query(
      `INSERT INTO star_sales (telegram_id, amount, status)
       VALUES ($1, $2, 'pending')`,
      [telegramId, stars]
    );

    res.json({ success: true, invoice_link: invoiceLink });
  } catch (err) {
    console.error("Sell Stars error:", err.response?.data || err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ======================================================
// 📬 POST /api/pay/webhook — обробка успішного платежу
// ======================================================
// router.post("/webhook", async (req, res) => {
//   try {
//     const update = req.body;
//     const message = update.message;

//     if (message?.successful_payment) {
//       const payment = message.successful_payment;
//       const payload = payment.invoice_payload;

//       if (!payload.startsWith("sell_")) return res.sendStatus(200);

//       const [, telegramId, starsStr] = payload.split("_");
//       const stars = parseInt(starsStr, 10);

//       // ✅ Оновлюємо статус заявки
//       await db.query(
//         "UPDATE star_sales SET status = 'paid' WHERE telegram_id = $1 AND amount = $2",
//         [telegramId, stars]
//       );

//       // 🔔 Сповіщаємо менеджера
//       const botToken = process.env.BOT_TOKEN;
//       const managerChat = process.env.MANAGER_ID;

//       const messageText = `
// 💰 *Надійшов продаж зірок!*
// 👤 ID: ${telegramId}
// ⭐ Кількість: ${stars}
// Статус: ✅ Оплачено
// `;

//       await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
//         chat_id: managerChat,
//         text: messageText,
//         parse_mode: "Markdown",
//       });
//     }

//     res.sendStatus(200);
//   } catch (err) {
//     console.error("Webhook error:", err);
//     res.sendStatus(500);
//   }
// });

module.exports = router;
