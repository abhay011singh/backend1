import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import sendWhatsApp from '../utils/sendWhatsApp.js';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/test-sos', authMiddleware, upload.single('media'), async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User not found' });
    }

    // ✅ FormData fields are strings in multipart/form-data
    const latitude = req.body.latitude;
    const longitude = req.body.longitude;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude are required' });
    }

    const userName = user.name || 'Unknown User';
    const email = user.email || 'No email';

    const message = `🆘 Test SOS Alert!\n\nUser: ${userName}\nEmail: ${email}\nLocation: https://maps.google.com/?q=${latitude},${longitude}`;

    const imagePath = req.file?.path;

    const yourPhoneNumber = process.env.MY_WHATSAPP_TO;
    const sent = await sendWhatsApp(yourPhoneNumber, message, imagePath);

    if (sent) {
      res.json({ success: true, message: 'Test SOS with image sent to your WhatsApp' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send WhatsApp message' });
    }
  } catch (error) {
    console.error('Test SOS error:', error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
});


export default router;
