import nodemailer from 'nodemailer';

const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS, // App password
      },
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      text,
    });
  } catch (error) {
    console.error('sendEmail error:', error.message);
    throw new Error('Failed to send email');
  }
};

export default sendEmail; 