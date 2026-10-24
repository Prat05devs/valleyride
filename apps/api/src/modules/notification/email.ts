import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

let transport: Transporter | undefined;
const mailer = () => (transport ??= nodemailer.createTransport(env.SMTP_URL));

/** Email over SMTP: Mailpit locally (see http://localhost:8025); in production, the SMTP_URL in .env (optional). */
export async function sendEmail(to: string, subject: string, text: string, attachments: { filename: string; content: Buffer }[] = []): Promise<void> {
  if (env.NODE_ENV === 'test') { logger.debug({ to, subject }, 'test email'); return; }
  await mailer().sendMail({ from: env.MAIL_FROM, to, subject, text, attachments });
}
