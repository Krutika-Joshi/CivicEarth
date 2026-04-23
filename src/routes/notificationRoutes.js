const express = require("express");
const router = express.Router();

const { getNotifications, markAsRead } = require("../controllers/notificationController");
const {protect} = require("../middlewares/authMiddleware");

//  Protected route
router.get("/", protect , getNotifications);

router.patch("/:id/read", protect, markAsRead);

module.exports = router;