function authMiddleware(req, res, next) {
    try {
      // Якщо токен або ID передається у запиті
      const { telegramId, userId } = req.body;
  
      // Проста перевірка
      const id = telegramId || userId;
      if (!id) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized: telegramId required" });
      }
  
      // Емуляція авторизованого користувача
      req.user = { telegramId: id };
      next();
    } catch (err) {
      console.error("Auth middleware error:", err);
      res
        .status(401)
        .json({ success: false, message: "Authorization error" });
    }
  }
  
  module.exports = authMiddleware;
  