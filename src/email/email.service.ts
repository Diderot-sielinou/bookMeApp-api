/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initTransporter();
    this.loadTemplates();
  }

  private initTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<number>('SMTP_PORT') === 465,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  private loadTemplates() {
    const templatesDir = path.join(__dirname, 'templates');

    // Create templates directory if it doesn't exist
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
      this.createDefaultTemplates(templatesDir);
    }

    // Load all templates
    const templateFiles = fs.readdirSync(templatesDir);
    for (const file of templateFiles) {
      if (file.endsWith('.hbs')) {
        const templateName = file.replace('.hbs', '');
        const templateContent = fs.readFileSync(path.join(templatesDir, file), 'utf-8');
        this.templates.set(templateName, handlebars.compile(templateContent));
      }
    }

    this.logger.log(`Loaded ${this.templates.size} email templates`);
  }

  private createDefaultTemplates(templatesDir: string) {
    const baseTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BookMe</h1>
    </div>
    <div class="content">
      {{{body}}}
    </div>
    <div class="footer">
      <p>© {{year}} BookMe. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>`;

    // Verification email
    const verificationTemplate = `
<h2>Bienvenue sur BookMe !</h2>
<p>Bonjour {{firstName}},</p>
<p>Merci de vous être inscrit sur BookMe. Pour activer votre compte, veuillez cliquer sur le bouton ci-dessous :</p>
<p style="text-align: center;">
  <a href="{{verificationUrl}}" class="button">Vérifier mon email</a>
</p>
<p>Ce lien expire dans 24 heures.</p>
<p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>`;

    // Password reset email
    const passwordResetTemplate = `
<h2>Réinitialisation de mot de passe</h2>
<p>Bonjour {{firstName}},</p>
<p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
<p style="text-align: center;">
  <a href="{{resetUrl}}" class="button">Réinitialiser mon mot de passe</a>
</p>
<p>Ce lien expire dans 1 heure.</p>
<p>Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email.</p>`;

    // Booking confirmation
    const bookingConfirmationTemplate = `
<h2>Confirmation de réservation</h2>
<p>Bonjour {{clientName}},</p>
<p>Votre réservation a été confirmée !</p>
<div style="background: white; padding: 15px; border-radius: 4px; margin: 15px 0;">
  <p><strong>Service :</strong> {{serviceName}}</p>
  <p><strong>Prestataire :</strong> {{prestataireName}}</p>
  <p><strong>Date :</strong> {{date}}</p>
  <p><strong>Heure :</strong> {{time}}</p>
  <p><strong>Prix :</strong> {{price}} €</p>
</div>
<p style="text-align: center;">
  <a href="{{appointmentUrl}}" class="button">Voir ma réservation</a>
</p>`;

    // Booking cancellation
    const bookingCancellationTemplate = `
<h2>Réservation annulée</h2>
<p>Bonjour {{recipientName}},</p>
<p>La réservation suivante a été annulée :</p>
<div style="background: white; padding: 15px; border-radius: 4px; margin: 15px 0;">
  <p><strong>Service :</strong> {{serviceName}}</p>
  <p><strong>Date :</strong> {{date}}</p>
  <p><strong>Heure :</strong> {{time}}</p>
  <p><strong>Annulé par :</strong> {{cancelledBy}}</p>
  {{#if reason}}
  <p><strong>Raison :</strong> {{reason}}</p>
  {{/if}}
</div>`;

    // Reminder
    const reminderTemplate = `
<h2>Rappel : Votre rendez-vous approche</h2>
<p>Bonjour {{clientName}},</p>
<p>Votre rendez-vous est prévu {{timeFrame}} :</p>
<div style="background: white; padding: 15px; border-radius: 4px; margin: 15px 0;">
  <p><strong>Service :</strong> {{serviceName}}</p>
  <p><strong>Prestataire :</strong> {{prestataireName}}</p>
  <p><strong>Date :</strong> {{date}}</p>
  <p><strong>Heure :</strong> {{time}}</p>
  <p><strong>Adresse :</strong> {{address}}</p>
</div>
<p style="text-align: center;">
  <a href="{{appointmentUrl}}" class="button">Voir ma réservation</a>
</p>`;

    // Review request
    const reviewRequestTemplate = `
<h2>Donnez votre avis</h2>
<p>Bonjour {{clientName}},</p>
<p>Comment s'est passé votre rendez-vous chez {{prestataireName}} ?</p>
<p>Votre avis aide les autres clients et permet aux prestataires de s'améliorer.</p>
<p style="text-align: center;">
  <a href="{{reviewUrl}}" class="button">Laisser un avis</a>
</p>`;

    // New booking notification
    const newBookingTemplate = `
<h2>Nouvelle réservation</h2>
<p>Bonjour {{prestataireName}},</p>
<p>Vous avez une nouvelle réservation !</p>
<div style="background: white; padding: 15px; border-radius: 4px; margin: 15px 0;">
  <p><strong>Client :</strong> {{clientName}}</p>
  <p><strong>Service :</strong> {{serviceName}}</p>
  <p><strong>Date :</strong> {{date}}</p>
  <p><strong>Heure :</strong> {{time}}</p>
</div>
<p style="text-align: center;">
  <a href="{{appointmentUrl}}" class="button">Voir la réservation</a>
</p>`;

    // Write templates
    fs.writeFileSync(path.join(templatesDir, 'base.hbs'), baseTemplate);
    fs.writeFileSync(path.join(templatesDir, 'verification.hbs'), verificationTemplate);
    fs.writeFileSync(path.join(templatesDir, 'password-reset.hbs'), passwordResetTemplate);
    fs.writeFileSync(
      path.join(templatesDir, 'booking-confirmation.hbs'),
      bookingConfirmationTemplate
    );
    fs.writeFileSync(
      path.join(templatesDir, 'booking-cancellation.hbs'),
      bookingCancellationTemplate
    );
    fs.writeFileSync(path.join(templatesDir, 'reminder.hbs'), reminderTemplate);
    fs.writeFileSync(path.join(templatesDir, 'review-request.hbs'), reviewRequestTemplate);
    fs.writeFileSync(path.join(templatesDir, 'new-booking.hbs'), newBookingTemplate);
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const template = this.templates.get(options.template);
      const baseTemplate = this.templates.get('base');

      if (!template) {
        throw new Error(`Template ${options.template} not found`);
      }

      // Render content template
      const body = template({
        ...options.context,
        year: new Date().getFullYear(),
      });

      // Wrap in base template if available
      const html = baseTemplate ? baseTemplate({ body, year: new Date().getFullYear() }) : body;

      await this.transporter.sendMail({
        from: `"BookMe" <${this.configService.get<string>('SMTP_FROM')}>`,
        to: options.to,
        subject: options.subject,
        html,
      });

      this.logger.log(`Email sent: ${options.template} to ${options.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
  }

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  @OnEvent('user.registered')
  async handleUserRegistered(payload: {
    user: { email: string };
    verificationToken: string;
    type: string;
  }) {
    this.logger.log(`New verificationToken registered: ${payload.verificationToken}`);
    const verificationUrl = `${this.configService.get('APP_URL')}/verify-email?token=${payload.verificationToken}`;

    await this.sendEmail({
      to: payload.user.email,
      subject: 'Bienvenue sur BookMe - Vérifiez votre email',
      template: 'verification',
      context: {
        firstName: 'Utilisateur',
        verificationUrl,
      },
    });
  }

  @OnEvent('user.password_reset_request')
  async handlePasswordResetRequest(payload: {
    user: { email: string; firstName?: string };
    resetToken: string;
  }) {
    const resetUrl = `${this.configService.get('APP_URL')}/reset-password?token=${payload.resetToken}`;

    await this.sendEmail({
      to: payload.user.email,
      subject: 'BookMe - Réinitialisation de mot de passe',
      template: 'password-reset',
      context: {
        firstName: payload.user.firstName || 'Utilisateur',
        resetUrl,
      },
    });
  }

  @OnEvent('appointment.created')
  async handleAppointmentCreated(payload: {
    appointment: {
      id: string;
      client: { user: { email: string }; firstName: string };
      prestataire: { businessName: string; user: { email: string } };
      service: { name: string };
      slot: { date: Date; startTime: string };
      priceAtBooking: number;
    };
  }) {
    const { appointment } = payload;
    const appUrl = this.configService.get('APP_URL');

    // Send confirmation to client
    await this.sendEmail({
      to: appointment.client.user.email,
      subject: 'BookMe - Confirmation de réservation',
      template: 'booking-confirmation',
      context: {
        clientName: appointment.client.firstName,
        serviceName: appointment.service.name,
        prestataireName: appointment.prestataire.businessName,
        date: new Date(appointment.slot.date).toLocaleDateString('fr-FR'),
        time: appointment.slot.startTime,
        price: appointment.priceAtBooking,
        appointmentUrl: `${appUrl}/appointments/${appointment.id}`,
      },
    });

    // Send notification to prestataire
    await this.sendEmail({
      to: appointment.prestataire.user.email,
      subject: 'BookMe - Nouvelle réservation',
      template: 'new-booking',
      context: {
        prestataireName: appointment.prestataire.businessName,
        clientName: appointment.client.firstName,
        serviceName: appointment.service.name,
        date: new Date(appointment.slot.date).toLocaleDateString('fr-FR'),
        time: appointment.slot.startTime,
        appointmentUrl: `${appUrl}/dashboard/appointments/${appointment.id}`,
      },
    });
  }

  @OnEvent('appointment.cancelled')
  async handleAppointmentCancelled(payload: {
    appointment: {
      id: string;
      client: { user: { email: string }; firstName: string };
      prestataire: { businessName: string; user: { email: string } };
      service: { name: string };
      slot: { date: Date; startTime: string };
      cancellationReason?: string;
    };
    cancelledBy: string;
    cancelledByRole: string;
  }) {
    const { appointment, cancelledByRole } = payload;

    // Notify the other party
    const recipient =
      cancelledByRole === 'client'
        ? {
            email: appointment.prestataire.user.email,
            name: appointment.prestataire.businessName,
          }
        : {
            email: appointment.client.user.email,
            name: appointment.client.firstName,
          };

    await this.sendEmail({
      to: recipient.email,
      subject: 'BookMe - Réservation annulée',
      template: 'booking-cancellation',
      context: {
        recipientName: recipient.name,
        serviceName: appointment.service.name,
        date: new Date(appointment.slot.date).toLocaleDateString('fr-FR'),
        time: appointment.slot.startTime,
        cancelledBy: cancelledByRole === 'client' ? 'le client' : 'le prestataire',
        reason: appointment.cancellationReason,
      },
    });
  }
}
