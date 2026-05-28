import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter<
    SMTPTransport.SentMessageInfo,
    SMTPTransport.Options
  >;
  private readonly logger = new Logger(MailService.name);
  private readonly appUrl: string;
  private readonly mailFrom: string;
  private readonly emailVerificationExpiresHours: number;

  constructor(private readonly config: ConfigService) {
    const host = this.config.getOrThrow<string>('mail.host');
    const port = this.config.getOrThrow<number>('mail.port');
    const user = this.config.getOrThrow<string>('mail.user');
    const pass = this.config.getOrThrow<string>('mail.pass');

    this.appUrl = this.config.getOrThrow<string>('app.url');
    this.mailFrom = this.config.getOrThrow<string>('mail.from');
    this.emailVerificationExpiresHours = this.config.getOrThrow<number>(
      'app.emailVerificationExpiresHours',
    );

    const options: SMTPTransport.Options = {
      host,
      port,
      auth: {
        user,
        pass,
      },
    };

    this.transporter = nodemailer.createTransport(options);
  }
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const url = `${this.appUrl}/auth/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: this.mailFrom,
      to: email,
      subject: 'Подтвердите ваш email — Trello Clone',
      html: `
        <h2>Добро пожаловать!</h2>
        <p>Нажмите кнопку ниже чтобы подтвердить email:</p>
        <a href="${url}" style="
          background:#0052cc; color:white; padding:12px 24px;
          border-radius:4px; text-decoration:none; display:inline-block;
        ">Подтвердить email</a>
        <p>Или перейдите по ссылке: <a href="${url}">${url}</a></p>
        <p><small>Ссылка действительна ${this.emailVerificationExpiresHours} ч.</small></p>
      `,
    });

    this.logger.log(`Verification email sent to ${email}`);
  }
}
