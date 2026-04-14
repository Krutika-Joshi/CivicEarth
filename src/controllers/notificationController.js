const Notification = require("../models/Notification");

//  Get notifications for logged-in user
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user.id
    }).sort({ createdAt: -1 });

    res.status(200).json({
      count: notifications.length,
      notifications
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching notifications",
      error: error.message
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Only owner can mark it
    if (notification.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({
      message: "Notification marked as read",
      notification
    });

  } catch (error) {
    res.status(500).json({
      message: "Error updating notification",
      error: error.message
    });
  }
};

module.exports = { getNotifications, markAsRead };