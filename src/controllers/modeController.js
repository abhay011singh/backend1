import Notification from '../models/Notification.js';

// After setting mode
await Notification.create({
  userId,
  message: `You have selected ${mode} mode.`
});
