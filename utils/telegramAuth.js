import crypto from "crypto";

export function verifyTelegramAuth(initData) {
  const secret = crypto.createHmac("sha256", "WebAppData").update(process.env.BOT_TOKEN);
  const checkString = Object.keys(initData)
    .filter(k => k !== "hash")
    .sort()
    .map(k => `${k}=${initData[k]}`)
    .join("\n");

  const hash = crypto.createHmac("sha256", secret.digest()).update(checkString).digest("hex");
  return hash === initData.hash;
}
