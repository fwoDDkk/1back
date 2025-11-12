// routes/auth.js
const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

router.post("/telegram", async (req, res) => {
  const { initData, referrerId } = req.body;

  // === 1️⃣ Перевірка наявності initData ===
  if (!initData) {
    return res.status(400).json({ message: "Missing initData" });
  }

  // === 2️⃣ Перевірка наявності конфігів ===
  const BOT_TOKEN = process.env.BOT_TOKEN;
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!BOT_TOKEN) return res.status(500).json({ message: "Missing BOT_TOKEN" });
  if (!JWT_SECRET) return res.status(500).json({ message: "Missing JWT_SECRET" });

  try {
    // === 3️⃣ Валідація Telegram initData ===
    const data = new URLSearchParams(initData);
    const hash = data.get("hash");
    if (!hash) return res.status(400).json({ message: "Missing hash" });
    data.delete("hash");

    const dataCheckString = Array.from(data.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    if (calculatedHash !== hash) {
      console.error("Invalid hash:", calculatedHash, "!=", hash);
      return res.status(403).json({ message: "Invalid Telegram signature" });
    }

    // === 4️⃣ Отримуємо користувача з Telegram даних ===
    const user = JSON.parse(data.get("user"));
    const telegramId = user.id;

    // === 5️⃣ Перевіряємо чи існує користувач ===
    let userResult = await db.query("SELECT * FROM users WHERE telegram_id = $1", [telegramId]);

    if (userResult.rows.length === 0) {
      const client = await db.connect();
      try {
        await client.query("BEGIN");

        const insertUserQuery = `
          INSERT INTO users (
            telegram_id, first_name, username, photo_url, balance, tickets, internal_stars, referral_spins, referred_by
          )
          VALUES ($1, $2, $3, $4, 0, $5, 0, 0, $6)
          RETURNING *;
        `;

        const ticketsBonus = referrerId ? 2 : 0;
        const insertValues = [
          telegramId,
          user.first_name,
          user.username,
          user.photo_url || null,
          ticketsBonus,
          referrerId || null,
        ];

        const insertResult = await client.query(insertUserQuery, insertValues);
        userResult = insertResult;

        if (referrerId) {
          await client.query(
            "UPDATE users SET tickets = tickets + 2 WHERE telegram_id = $1",
            [referrerId]
          );
        }

        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error creating new user:", err);
        return res.status(500).json({ message: "Database error during user creation" });
      } finally {
        client.release();
      }
    } else {
      userResult = await db.query(
        `UPDATE users 
         SET last_login_at = NOW(), photo_url = $1 
         WHERE telegram_id = $2 
         RETURNING *`,
        [user.photo_url || userResult.rows[0].photo_url, telegramId]
      );
    }

    const finalUser = userResult.rows[0];

    // === 6️⃣ Генеруємо JWT токен ===
    const token = jwt.sign({ telegramId: finalUser.telegram_id }, JWT_SECRET, { expiresIn: "7d" });

    // === 7️⃣ Відповідь клієнту ===
    res.json({
      success: true,
      message: "Authenticated successfully",
      token,
      user: {
        telegramId: finalUser.telegram_id,
        firstName: finalUser.first_name,
        username: finalUser.username,
        photoUrl: finalUser.photo_url || null,
        balance: finalUser.balance,
        tickets: finalUser.tickets,
        internal_stars: finalUser.internal_stars,
        referral_spins: finalUser.referral_spins,
      },
    });

  } catch (e) {
    console.error("Telegram auth error:", e);
    res.status(500).json({ success: false, message: "Server error during Telegram authentication" });
  }
});

module.exports = router;
