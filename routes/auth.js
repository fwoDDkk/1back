const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/register", async (req, res) => {
  const { telegram_id, first_name, username, photo_url } = req.body;
  if (!telegram_id)
    return res.status(400).json({ success: false, message: "Missing Telegram ID" });

  try {
    const result = await db.query("SELECT * FROM users WHERE telegram_id = $1", [telegram_id]);
    let user;

    if (result.rows.length === 0) {
      const insert = await db.query(
        "INSERT INTO users (telegram_id, first_name, username, photo_url) VALUES ($1, $2, $3, $4) RETURNING *",
        [telegram_id, first_name, username, photo_url]
      );
      user = insert.rows[0];
    } else {
      user = result.rows[0];
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
router.post("/telegram", async (req, res) => {
    try {
      const { id, first_name, username, photo_url } = req.body;
      if (!id) return res.status(400).json({ success: false, message: "Missing Telegram ID" });
  
      // 🔹 Перевіряємо, чи користувач уже існує
      const existing = await db.query("SELECT * FROM users WHERE telegram_id = $1", [id]);
  
      let user;
      if (existing.rows.length === 0) {
        const insert = await db.query(
          `INSERT INTO users (telegram_id, first_name, username, photo_url)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [id, first_name, username, photo_url]
        );
        user = insert.rows[0];
        console.log("✅ Новий користувач створений:", username);
      } else {
        user = existing.rows[0];
        console.log("🔁 Користувач уже існує:", username);
      }
  
      res.json({ success: true, user });
    } catch (err) {
      console.error("Auth error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });
module.exports = router;
