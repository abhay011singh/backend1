import Notification from '../models/Notification.js';

// (1) Send notification (backend se create karna)
export const sendNotification = async (req, res) => {
  const { userId, message } = req.body;

  const notification = new Notification({ userId, message });
  await notification.save();

  res.status(200).json({ message: 'Notification sent' });
};

// (2) Get all notifications for a user (frontend ke liye)
export const getNotifications = async (req, res) => {
  const userId = req.user._id;

  const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
  res.status(200).json(notifications);
};

// (3) Mark all notifications as seen
export const markAllSeen = async (req, res) => {
  const userId = req.user._id;

  await Notification.updateMany({ userId, seen: false }, { seen: true });
  res.status(200).json({ message: 'All marked as seen' });
};
