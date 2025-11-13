function authMiddleware(req, res, next) {
  try {
    const telegramId =
      req.headers.telegramid || req.body.telegramId || req.query.telegramId;

    if (!telegramId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: telegramId required" });
    }

    req.user = { telegramId };
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(401).json({ success: false, message: "Authorization error" });
  }
}

module.exports = authMiddleware;
