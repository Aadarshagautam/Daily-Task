import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

const transporter = nodemailer.createTransport({
    host: smtp-relay.brevo.com,
    
    port: 587,
    secure: EMAIL_PORT == 465, // true for 465, false for other ports
    auth: { 
        user:process.env.SMTP_USER,
        pass:process.env.SMTP_PASSWORD,

    },
});

export default transporter;