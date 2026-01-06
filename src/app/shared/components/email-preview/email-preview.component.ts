import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-email-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="email-frame">
      <!-- Browser Chrome -->
      <div class="browser-header">
        <div class="browser-controls">
          <span class="control close"></span>
          <span class="control minimize"></span>
          <span class="control maximize"></span>
        </div>
        <div class="browser-tabs">
          <div class="tab active">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Приглашение в Westwood - WestWood Team</span>
          </div>
        </div>
      </div>

      <!-- Email Client -->
      <div class="email-client">
        <!-- Email Content -->
        <div class="email-content">
          <!-- Sender Info -->
          <div class="sender-section">
            <div class="sender-avatar">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="currentColor"/>
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="currentColor"/>
              </svg>
            </div>
            <div class="sender-details">
              <div class="sender-row">
                <span class="sender-name">{{ senderName }}</span>
                <span class="sender-email">&lt;{{ senderEmail }}&gt;</span>
              </div>
              <div class="recipient-row">
                <span class="to-label">кому:</span>
                <span class="to-value">мне</span>
                <svg viewBox="0 0 24 24" fill="none" class="dropdown-icon">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- Email Body - Westwood Template -->
          <div class="email-body-wrapper">
            <div class="email-template">
              <!-- Green Banner Header -->
              <div class="email-banner">
                <h1 class="banner-title">Welcome to Westwood!</h1>
              </div>

              <!-- Email Body Content -->
              <div class="email-body-content">
                <div class="intro-text">{{ message || 'You have been invited to join Westwood as a Manager. To get started, please activate your account by clicking the button below:' }}</div>

                <!-- CTA Button -->
                <div class="cta-container">
                  <a class="cta-button" [href]="activationLink">
                    {{ buttonText || 'Activate Account' }}
                  </a>
                </div>

                <!-- Alternative Link -->
                <p class="alt-text">Or copy and paste this link into your browser:</p>
                
                <div class="link-box">
                  <a class="activation-link" [href]="activationLink">
                    {{ activationLink || 'https://westwood.app/activate?token=...' }}
                  </a>
                </div>

                <!-- Important Notice -->
                <p class="notice">
                  <strong>Important:</strong> This activation link will expire in {{ expirationDays || 7 }} days. 
                  If you didn't request this invitation, please ignore this email.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .email-frame {
      background: #1f2937;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      min-height: 500px;
    }

    /* Browser Chrome */
    .browser-header {
      background: #374151;
      padding: 0.5rem 0.75rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .browser-controls {
      display: flex;
      gap: 0.5rem;
    }

    .control {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .control.close { background: #ef4444; }
    .control.minimize { background: #fbbf24; }
    .control.maximize { background: #22c55e; }

    .browser-tabs {
      flex: 1;
    }

    .tab {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #4b5563;
      padding: 0.375rem 0.75rem;
      border-radius: 6px 6px 0 0;
      font-size: 0.75rem;
      color: #e5e7eb;
      max-width: 280px;
    }

    .tab svg {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }

    .tab span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Email Client */
    .email-client {
      flex: 1;
      display: flex;
      background: #ffffff;
    }

    /* Email Content */
    .email-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }

    /* Sender Section */
    .sender-section {
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      background: #fff;
    }

    .sender-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .sender-avatar svg {
      width: 24px;
      height: 24px;
      color: white;
    }

    .sender-details {
      flex: 1;
      min-width: 0;
    }

    .sender-row {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      flex-wrap: wrap;
      margin-bottom: 0.25rem;
    }

    .sender-name {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1f2937;
    }

    .sender-email {
      font-size: 0.8125rem;
      color: #6b7280;
    }

    .recipient-row {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8125rem;
      color: #6b7280;
    }

    .to-label {
      color: #9ca3af;
    }

    .to-value {
      color: #6b7280;
    }

    .dropdown-icon {
      width: 14px;
      height: 14px;
      color: #9ca3af;
    }

    /* Email Body Wrapper */
    .email-body-wrapper {
      flex: 1;
      overflow-y: auto;
      background: #f5f5f5;
      padding: 0.5rem;
    }

    /* Email Template (Westwood Style) */
    .email-template {
      background: #f5f5f5;
      border-radius: 8px;
      overflow: hidden;
    }

    .email-banner {
      background: #4CAF50;
      padding: 1.75rem 1.5rem;
      text-align: center;
    }

    .banner-title {
      color: white;
      font-size: 1.375rem;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.02em;
    }

    .email-body-content {
      background: white;
      padding: 1.5rem 1.25rem;
    }

    .intro-text {
      font-size: 0.875rem;
      color: #333;
      line-height: 1.6;
      margin: 0 0 1.5rem;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .cta-container {
      text-align: center;
      margin: 1.5rem 0;
    }

    .cta-button {
      display: inline-block;
      background: #4CAF50;
      color: white;
      font-size: 0.875rem;
      font-weight: 600;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      text-decoration: none;
      transition: all 0.2s ease;
      box-shadow: 0 2px 6px rgba(76, 175, 80, 0.3);
    }

    .cta-button:hover {
      background: #43A047;
    }

    .alt-text {
      font-size: 0.875rem;
      color: #333;
      margin: 1.5rem 0 0.75rem;
    }

    .link-box {
      background: #E8F5E9;
      border-radius: 6px;
      padding: 0.75rem;
      margin-bottom: 1.25rem;
      word-break: break-all;
    }

    .activation-link {
      color: #1565C0;
      font-size: 0.8125rem;
      text-decoration: underline;
      line-height: 1.5;
    }

    .notice {
      font-size: 0.875rem;
      color: #333;
      line-height: 1.6;
      margin: 0;
    }

    .notice strong {
      color: #111;
    }

    `]
})
export class EmailPreviewComponent {
  /** Email получателя */
  @Input() recipientEmail: string = '';

  /** Текст письма */
  @Input() message: string = '';

  /** Ссылка для активации */
  @Input() activationLink: string = 'https://westwood.app/activate?token=...';

  /** Текст кнопки */
  @Input() buttonText: string = 'Activate Account';

  /** Срок действия ссылки (дней) */
  @Input() expirationDays: number = 7;

  /** Имя отправителя */
  @Input() senderName: string = 'Westwood Team';

  /** Email отправителя */
  @Input() senderEmail: string = 'noreply@westwood.app';
}

