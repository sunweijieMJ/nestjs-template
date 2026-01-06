import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nContext } from 'nestjs-i18n';
import { MailData } from './interfaces/mail-data.interface';

import { MaybeType } from '../../common/types/maybe.type';
import { MailerService } from '../../integrations/mail/mailer.service';
import path from 'path';
import { AllConfigType } from '../../config/config.type';

interface SendTemplatedEmailOptions {
  to: string;
  templateName: string;
  titleKey: string;
  urlPath: string;
  urlParams: Record<string, string>;
  textKeys: string[];
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly templatesDir: string;
  private readonly appName: MaybeType<string>;
  private readonly frontendDomain: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    // Use __dirname to get the correct path in both dev and prod environments
    this.templatesDir = path.join(__dirname, 'mail-templates');
    this.appName = this.configService.get('app.name', { infer: true });
    this.frontendDomain = this.configService.getOrThrow('app.frontendDomain', { infer: true });
  }

  /**
   * Get the full path to a mail template
   */
  private getTemplatePath(templateName: string): string {
    return path.join(this.templatesDir, templateName);
  }

  /**
   * Build URL with search params
   */
  private buildUrl(urlPath: string, params: Record<string, string>): URL {
    const url = new URL(this.frontendDomain + urlPath);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return url;
  }

  /**
   * Send a templated email with common structure
   */
  private async sendTemplatedEmail(options: SendTemplatedEmailOptions): Promise<void> {
    const { to, templateName, titleKey, urlPath, urlParams, textKeys } = options;
    const i18n = I18nContext.current();

    const title = i18n?.t(`common.${titleKey}`);
    const texts: Record<string, MaybeType<string>> = {};

    textKeys.forEach((key, index) => {
      texts[`text${index + 1}`] = i18n?.t(key);
    });

    const url = this.buildUrl(urlPath, urlParams);

    await this.mailerService.sendMail({
      to,
      subject: title,
      text: `${url.toString()} ${title}`,
      templatePath: this.getTemplatePath(templateName),
      context: {
        title,
        url: url.toString(),
        actionTitle: title,
        app_name: this.appName,
        ...texts,
      },
    });
  }

  async userSignUp(mailData: MailData<{ hash: string }>): Promise<void> {
    this.logger.log(`Sending signup confirmation email to: ${mailData.to}`);

    await this.sendTemplatedEmail({
      to: mailData.to,
      templateName: 'activation.hbs',
      titleKey: 'confirmEmail',
      urlPath: '/confirm-email',
      urlParams: { hash: mailData.data.hash },
      textKeys: ['confirm-email.text1', 'confirm-email.text2', 'confirm-email.text3'],
    });
  }

  async forgotPassword(mailData: MailData<{ hash: string; tokenExpires: number }>): Promise<void> {
    this.logger.log(`Sending password reset email to: ${mailData.to}`);

    await this.sendTemplatedEmail({
      to: mailData.to,
      templateName: 'reset-password.hbs',
      titleKey: 'resetPassword',
      urlPath: '/password-change',
      urlParams: {
        hash: mailData.data.hash,
        expires: mailData.data.tokenExpires.toString(),
      },
      textKeys: ['reset-password.text1', 'reset-password.text2', 'reset-password.text3', 'reset-password.text4'],
    });
  }

  async confirmNewEmail(mailData: MailData<{ hash: string }>): Promise<void> {
    this.logger.log(`Sending new email confirmation to: ${mailData.to}`);

    await this.sendTemplatedEmail({
      to: mailData.to,
      templateName: 'confirm-new-email.hbs',
      titleKey: 'confirmEmail',
      urlPath: '/confirm-new-email',
      urlParams: { hash: mailData.data.hash },
      textKeys: ['confirm-new-email.text1', 'confirm-new-email.text2', 'confirm-new-email.text3'],
    });
  }
}
