import express from "express";
import { bot, MANAGER_ID } from "../utils/bot.js";

const router = express.Router();

bot.on("callback_query", async (query) => {
  const { data, message } = query;

  if (data.startsWith("approve_sell_")) {
    const [_, __, username, stars] = data.split("_");
    await bot.sendMessage(MANAGER_ID, `✅ Ви підтвердили покупку ${stars}⭐ у @${username}`);

    await bot.sendMessage(`@${username}`, `🎉 Оплату підтверджено! Ви отримали ${stars}⭐`);
    await bot.answerCallbackQuery(query.id, { text: "Підтверджено ✅" });
  }
});

router.post("/webhook", (req, res) => {
  res.sendStatus(200);
});

export default router;
