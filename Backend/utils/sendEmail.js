const transporter = require('../config/mail');
require('dotenv').config();

/**
 * Send an email using configured transporter
 * @param {Object} options
 * @param {string} options.email - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Text version of the email
 * @param {string} [options.html] - HTML version of the email (optional)
 */
const sendEmail = async (options) => {
  const mailOptions = {
    from: `${process.env.SMTP_FROM_NAME || 'Gujarat Post'} <${process.env.SMTP_FROM || 'noreply@gujaratpost.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Email sending error:', error.message);
    throw error;
  }
};

module.exports = sendEmail;
