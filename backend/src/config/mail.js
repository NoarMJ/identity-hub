import nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
});

export const MAIL_FROM = process.env.MAIL_FROM;
export const APP_URL = process.env.APP_URL;