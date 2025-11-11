import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import swapRouter from "./routes/swap.js";
import telegramRouter from "./routes/telegram.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api/swap", swapRouter);
app.use("/api/telegram", telegramRouter);

app.get("/", (req, res) => res.send("⭐ StarSwap API running"));
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server started on port ${PORT}`));
