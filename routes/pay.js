const express = require("express");
const axios = require("axios");
const db = require("../db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();
router.use(authMiddleware);

const BOT_TOKEN = process.env.BOT_TOKEN;
const PROVIDER_TOKEN = process.env.PROVIDER_TOKEN;

// ======================================================
// 💸 POST /api/pay/sell — створення інвойсу для продажу зірок
// ======================================================
router.post("/sell", async (req, res) => {
  try {
    const { telegramId, username } = req.user;
    const { stars } = req.body;

    if (!stars || stars <= 0)
      return res.status(400).json({ success: false, message: "Invalid stars amount" });

    // 🔹 Генеруємо унікальний order_id
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;

    // 🔹 Створюємо Telegram інвойс
    const invoiceResponse = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`,
      {
        title: "Продаж зірок",
        description: `Продаж ${stars}⭐ менеджеру`,
        payload: `sell_${telegramId}_${stars}_${orderId}`,
        provider_token: PROVIDER_TOKEN,
        currency: "XTR",
        prices: [{ label: "Stars", amount: stars }],
      }
    );

    if (!invoiceResponse.data.ok)
      return res.status(400).json({ success: false, message: "Failed to create invoice" });

    const invoiceLink = invoiceResponse.data.result;

    // ⚠️ Без запису в базу — лише генеруємо лінк
    res.json({
      success: true,
      invoice_link: invoiceLink,
      order_id: orderId,
    });
  } catch (err) {
    console.error("Sell Stars error:", err.response?.data || err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// ======================================================
// 🧾 POST /api/pay/add-transaction — запис транзакції після оплати
// ======================================================
router.post("/add-transaction", async (req, res) => {
  try {
    const { telegramId, username, stars, status } = req.body;

    if (!telegramId || !stars)
      return res.status(400).json({ success: false, message: "Invalid data" });

    const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    await db.query(
      `INSERT INTO transactions (telegram_id, username, amount, type, status, order_id)
       VALUES ($1, $2, $3, 'sell', $4, $5)`,
      [telegramId, username || null, stars, status || "paid", orderId]
    );

    res.json({ success: true, orderId });
  } catch (err) {
    console.error("Add transaction error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// ======================================================
// 📜 GET /api/pay/history — історія транзакцій користувача
// ======================================================
router.get("/history", async (req, res) => {
  try {
    const { telegramId } = req.user;
    if (!telegramId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const result = await db.query(
      `
      SELECT order_id, amount, type, status, created_at
      FROM transactions
      WHERE telegram_id = $1
      ORDER BY created_at DESC
      `,
      [telegramId]
    );

    res.json({ success: true, history: result.rows });
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
