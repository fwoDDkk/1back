const express = require("express");
const crypto = require("crypto");
const db = require("../db");
const router = express.Router();

// ==========================================================
// ✅ Telegram Auth через initData (з виправленою валідацією)
// ==========================================================
router.post("/telegram", async (req, res) => {
  const { initData } = req.body;
  const BOT_TOKEN = process.env.BOT_TOKEN; // Переконайтеся, що ця змінна є

  try {
    if (!initData) return res.status(400).json({ message: "Missing initData" });

    // ❗️❗️❗️ ПОЧАТОК ВИПРАВЛЕННЯ ❗️❗️❗️
    // Це - новий, правильний спосіб валідації, взятий з вашого "робочого" прикладу.

    const data = new URLSearchParams(initData);
    const hash = data.get("hash");
    data.delete("hash");

    // Сортуємо та з'єднуємо параметри
    const dataCheckString = Array.from(data.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");

    // Створюємо секретний ключ за новим методом
    const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
    // Рахуємо хеш
    const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

    if (calculatedHash !== hash) {
        console.error("Invalid hash calculation.");
        console.log("Received hash:", hash);
        console.log("Calculated hash:", calculatedHash);
        return res.status(403).json({ success: false, message: "Invalid signature" });
    }
    // ❗️❗️❗️ КІНЕЦЬ ВИПРАВЛЕННЯ ❗️❗️❗️

    // 2. Робота з користувачем (ваш оригінальний код з першого файлу)
    // Парсимо юзера з валідованих даних
    const user = JSON.parse(data.get("user"));
    const { id, first_name, username, photo_url } = user;

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

    // 3. Створення токена (ваш оригінальний код)
    const token = crypto.randomBytes(16).toString("hex");

    // Відповідь успішна
    return res.json({ success: true, user: savedUser, token });
    
  } catch (e) {
    console.error("Telegram auth error:", e);
    res.status(400).json({ success: false, message: "Auth parse error" });
  }
});

module.exports = router;