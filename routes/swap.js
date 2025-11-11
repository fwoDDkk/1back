import express from "express";
import { bot, MANAGER_ID } from "../utils/bot.js";
import { verifyTelegramAuth } from "../utils/telegramAuth.js";

const router = express.Router();

/**
 * POST /api/swap/sell
 * body: { initData, stars }
 */
router.post("/sell", async (req, res) => {
  try {
    const { initData, stars } = req.body;
    if (!initData || !stars) return res.status(400).json({ message: "Invalid data" });

    // 1️⃣ Перевіряємо автентичність
    const data = Object.fromEntries(new URLSearchParams(initData));
    if (!verifyTelegramAuth(data))
      return res.status(403).json({ message: "Auth failed" });

    const username = data.user ? JSON.parse(data.user).username : "невідомо";
    const priceUAH = (stars * 0.4).toFixed(2); // курс 200 ⭐ = 80 грн

    // 2️⃣ Відправляємо користувачу меню
    const message = `
💰 <b>Продаж зірок</b>
Ви хочете продати <b>${stars}⭐</b>
Отримаєте <b>${priceUAH} грн</b>

✅ Натисніть “Підтвердити”, щоб менеджер прийняв оплату.
`;

    await bot.sendMessage(data.user ? JSON.parse(data.user).id : MANAGER_ID, message, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ Підтвердити оплату", callback_data: `approve_sell_${username}_${stars}` }
          ],
        ],
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
