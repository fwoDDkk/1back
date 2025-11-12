require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const payRouter = require("./routes/pay");
const authRouter = require("./routes/auth");
// const { bot } = require("./utils/bot");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api/auth", authRouter);
app.use("/api/pay", payRouter);

app.get("/", (req, res) => res.send("⭐ MiniApp Stars backend running"));

app.listen(4000, async () => {
  console.log("✅ Server started on port 4000");

  // const domain = process.env.DOMAIN;
  // await bot.setWebHook(`${domain}/api/pay/webhook`);
  // console.log("📡 Webhook connected");
});
