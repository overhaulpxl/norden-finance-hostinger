import 'server-only';

import nodemailer from 'nodemailer';

type SmtpEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for SMTP email delivery`);
  }
  return value;
}

function parsePort(value: string) {
  const port = Number(value);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('SMTP_PORT must be a valid TCP port');
  }
  return port;
}

function parseSecure(value: string) {
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;
  throw new Error('SMTP_SECURE must be true or false');
}

function smtpConfig() {
  return {
    host: requiredEnv('SMTP_HOST'),
    port: parsePort(requiredEnv('SMTP_PORT')),
    secure: parseSecure(requiredEnv('SMTP_SECURE')),
    auth: {
      user: requiredEnv('SMTP_USER'),
      pass: requiredEnv('SMTP_PASS'),
    },
    from: requiredEnv('EMAIL_FROM'),
  };
}

export function hasSmtpConfig() {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
    process.env.SMTP_PORT?.trim() &&
    process.env.SMTP_SECURE?.trim() &&
    process.env.SMTP_USER?.trim() &&
    process.env.SMTP_PASS?.trim() &&
    process.env.EMAIL_FROM?.trim(),
  );
}

export async function sendSmtpEmail({ to, subject, html, text }: SmtpEmailInput) {
  const config = smtpConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  await transporter.sendMail({
    from: config.from,
    to,
    subject,
    html,
    text,
  });
}
