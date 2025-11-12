const express = require("express");
const crypto = require("crypto");
const db = require("../db");
const router = express.Router();

// ==========================================================
// ✅ Telegram Auth через initData
// ==========================================================
router.post("/telegram", async (req, res) => {
  const { initData } = req.body;
  const BOT_TOKEN = process.env.BOT_TOKEN;

  try {
    if (!initData) return res.status(400).json({ message: "Missing initData" });

    const data = new URLSearchParams(initData);
    const hash = data.get("hash");
    data.delete("hash");

    const checkString = [...data.entries()]
      .sort()
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    const secret = crypto.createHash("sha256").update(BOT_TOKEN).digest();
    const hmac = crypto.createHmac("sha256", secret).update(checkString).digest("hex");

    if (hmac !== hash)
      return res.status(403).json({ success: false, message: "Invalid signature" });

    const user = JSON.parse(data.get("user"));
    const { id, first_name, username, photo_url } = user;

    // ✅ Зберігаємо користувача в базі (якщо ще не існує)
    const result = await db.query("SELECT * FROM users WHERE telegram_id = $1", [id]);
    let savedUser;

    if (result.rows.length === 0) {
      const insert = await db.query(
        `INSERT INTO users (telegram_id, first_name, username, photo_url)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [id, first_name, username, photo_url]
      );
      savedUser = insert.rows[0];
    } else {
      savedUser = result.rows[0];
    }

    // ✅ Повертаємо токен (можна зробити JWT або просто hex)
    const token = crypto.randomBytes(16).toString("hex");

    return res.json({ success: true, user: savedUser, token });
  } catch (e) {
    console.error("Telegram auth error:", e);
    res.status(400).json({ success: false, message: "Auth parse error" });
  }
});

module.exports = router;
