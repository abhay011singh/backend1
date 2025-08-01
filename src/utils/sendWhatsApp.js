import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

console.log('Twilio ENV:', {
  SID: process.env.TWILIO_ACCOUNT_SID,
  TOKEN: process.env.TWILIO_AUTH_TOKEN,
  FROM: process.env.TWILIO_WHATSAPP_FROM,
  TO: process.env.MY_WHATSAPP_TO,
});

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send WhatsApp message via Twilio
 * @param {string} to - WhatsApp number to send to (must match Twilio sandbox)
 * @param {string} message - Text message
 * @param {string|null} mediaUrl - Optional image URL (must be public)
 */
const sendWhatsApp = async (to, message, mediaUrl = null) => {
  try {
    const msgOptions = {
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: process.env.MY_WHATSAPP_TO, // Sandbox only allows sending to pre-verified number
      body: message,
    };

    if (mediaUrl) {
      msgOptions.mediaUrl = [mediaUrl]; // media must be a public URL (e.g. ngrok or cloud image)
    }

    const result = await client.messages.create(msgOptions);

    console.log('WhatsApp message sent:', result.sid);
    return true;
  } catch (error) {
    console.error('sendWhatsApp error:', error.message);
    return false;
  }
};

export default sendWhatsApp;
