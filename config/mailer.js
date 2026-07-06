const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a transporter using Gmail SMTP (or placeholder if not set)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'thehouseoframya@gmail.com',
    pass: process.env.EMAIL_PASS || 'placeholder_app_password_here'
  }
});

const sendEmail = async (to, subject, text, html) => {
  try {
    const mailOptions = {
      from: `"House of Ramya" <${process.env.EMAIL_USER || 'thehouseoframya@gmail.com'}>`,
      to,
      subject,
      text,
      html
    };
    
    // In a real environment with correct credentials, this sends the email.
    // For now, if using placeholder, it will log and might fail on sendMail.
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    // Return false instead of throwing so app doesn't crash if email fails
    return false;
  }
};

module.exports = {
  transporter,
  sendEmail
};
