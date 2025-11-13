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
    const { telegramId, username } = req.user;
    const { stars } = req.body;

    if (!stars || stars <= 0)
      return res.status(400).json({ success: false, message: "Invalid stars amount" });

    const botToken = process.env.BOT_TOKEN;
    const providerToken = process.env.PROVIDER_TOKEN;

    // 🔹 Унікальний order_id
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;

    // 🔹 Створюємо Telegram інвойс
    const invoiceResponse = await axios.post(
      `https://api.telegram.org/bot${botToken}/createInvoiceLink`,
      {
        title: "Продаж зірок",
        description: `Продаж ${stars}⭐ менеджеру`,
        payload: `sell_${telegramId}_${stars}_${orderId}`,
        provider_token: providerToken,
        currency: "XTR", // Telegram Stars
        prices: [{ label: "Stars", amount: stars }],
      }
    );

    if (!invoiceResponse.data.ok)
      return res.status(400).json({ success: false, message: "Failed to create invoice" });

    const invoiceLink = invoiceResponse.data.result;

    // 💾 Запис у таблицю star_sales
    await db.query(
      `INSERT INTO star_sales (telegram_id, amount, status)
       VALUES ($1, $2, 'pending')`,
      [telegramId, stars]
    );

    // 💾 Запис у таблицю transactions
    await db.query(
      `
      INSERT INTO transactions (telegram_id, username, amount, order_id, type, status)
      VALUES ($1, $2, $3, $4, 'sell', 'pending')
      `,
      [telegramId, username || null, stars, orderId]
    );

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
// 📜 GET /api/pay/history — історія транзакцій користувача
// ======================================================
router.get("/history", async (req, res) => {
  try {
    const { telegramId } = req.user; // ✅ authMiddleware додає це
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

router.post("/add-transaction", async (req, res) => {
  try {
    const { telegramId, username, stars, status } = req.body;

    if (!telegramId || !stars)
      return res.status(400).json({ success: false, message: "Invalid data" });

    const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    await db.query(
      `INSERT INTO transactions (telegram_id, username, amount, type, status, order_id)
       VALUES ($1, $2, $3, 'sell', $4, $5)`,
      [telegramId, username, stars, status || "paid", orderId]
    );

    res.json({ success: true, orderId });
  } catch (err) {
    console.error("Add transaction error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
