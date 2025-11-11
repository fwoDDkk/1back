import express from "express";
import { bot, MANAGER_ID } from "../utils/bot.js";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

/**
 * Користувач хоче продати зірки
 * body: { userId, username, stars }
 */
router.post("/sell", async (req, res) => {
  try {
    const { userId, username, stars } = req.body;
    if (!userId || !stars) return res.status(400).json({ error: "Invalid data" });

    // 💵 1 зірка = 1 Telegram Star
    const totalStars = parseInt(stars);

    const title = `Продаж ${totalStars}⭐`;
    const description = `Ви надсилаєте ${totalStars} зірок для продажу. Менеджер отримає дані після успішної оплати.`;

    // 🧾 створюємо інвойс через Telegram Payments (Stars)
    const invoice = {
      title,
      description,
      payload: `sell_stars_${totalStars}`,
      provider_token: '',
      currency: "XTR", // Telegram Stars
      prices: [{ label: "Зірки", amount: totalStars}], // *1e6 бо Telegram API в мікроодиницях
    };

    // створюємо посилання на оплату (можна відправити в бот)
    const link = await bot.createInvoiceLink(invoice);
    res.json({ invoice_link: link });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
