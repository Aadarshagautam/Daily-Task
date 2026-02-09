import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const hasSmtpCreds = Boolean(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
const smtpHost = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
const smtpPort = Number(process.env.SMTP_PORT || 587);

const transporter = hasSmtpCreds
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  : nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SENDER_EMAIL, // Gmail address
        pass: process.env.EMAIL_PASSWORD, // Gmail App Password
      },
    });

// Test connection
transporter.verify((error, success) => {
    if (error) {
        console.log('❌ Email configuration error:', error);
    } else {
        console.log('✅ Email server is ready to send messages');
    }
});

export default transporter;
