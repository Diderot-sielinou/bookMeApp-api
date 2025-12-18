import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    email: string;
  };
}

export const getEmailConfig = (configService: ConfigService): EmailConfig => {
  return {
    host: configService.get<string>('SMTP_HOST', 'smtp-relay.brevo.com'),
    port: configService.get<number>('SMTP_PORT', 587),
    secure: configService.get('SMTP_SECURE') === 'true',
    auth: {
      user: configService.get<string>('SMTP_USER', ''),
      pass: configService.get<string>('SMTP_PASS', ''),
    },
    from: {
      name: configService.get<string>('SMTP_FROM_NAME', 'BookMe'),
      email: configService.get<string>('SMTP_FROM_EMAIL', 'noreply@bookme.com'),
    },
  };
};

export const createEmailTransporter = (configService: ConfigService): nodemailer.Transporter => {
  const config = getEmailConfig(configService);

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.auth.user,
      pass: config.auth.pass,
    },
  });
};
