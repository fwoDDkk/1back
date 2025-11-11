import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import { bot } from "./utils/bot.js";
import payRouter from "./routes/pay.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🔔 прийом webhook від Telegram
app.post(`/api/pay/webhook`, (req, res) => {
  const msg = req.body.message;
  if (msg?.successful_payment) {
    const user = msg.from;
    const stars = msg.successful_payment.invoice_payload.split("_")[2];
    bot.sendMessage(
      process.env.MANAGER_ID,
      `💫 <b>Нова оплата!</b>\n\n👤 @${user.username}\n⭐ ${stars} зірок`,
      { parse_mode: "HTML" }
    );
  }
  res.sendStatus(200);
});

// === Маршрут для створення інвойсу ===
app.use("/api/pay", payRouter);

app.get("/", (req, res) => res.send("⭐ MiniApp Stars backend running"));
app.listen(4000, async () => {
  console.log("✅ Server started on port 4000");

  // встановлюємо webhook
  const domain = process.env.DOMAIN; // наприклад https://stars-backend.onrender.com
  await bot.setWebHook(`${domain}/api/pay/webhook`);
  console.log("📡 Webhook connected");
});
