import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../../core/store/app.state';
import { selectUser } from '../../../../core/store/auth/auth.selectors';
import { User } from '../../../../core/models/user.model';
import { PageHeaderService } from '../../../../core/services/page-header.service';

// Shared Components
import { CardComponent } from '../../../../shared/components/card/card.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { TypographyComponent } from '../../../../shared/components/typography/typography.component';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';
import { DividerComponent } from '../../../../shared/components/divider/divider.component';
import { EmailPreviewComponent } from '../../../../shared/components/email-preview/email-preview.component';

interface EmailInvitationHistory {
  id: string;
  email: string;
  subject: string;
  message: string;
  sentAt: Date;
  status: 'sent' | 'pending' | 'failed';
}

@Component({
  selector: 'app-email-invitation-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    InputComponent,
    ButtonComponent,
    TypographyComponent,
    AlertComponent,
    BadgeComponent,
    IconButtonComponent,
    DividerComponent,
    EmailPreviewComponent
  ],
  template: `
    <div class="invitation-page">
      <!-- Left Panel - Form -->
      <app-card [shadow]="true" class="left-panel">
        <div class="panel-header">
          <div class="icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M22 6l-10 7L2 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="header-text">
            <h2 class="panel-title">Пригласи друга</h2>
            <p class="panel-subtitle">Отправь приглашение по Email</p>
          </div>
        </div>

        <!-- Alerts -->
        <app-alert
          *ngIf="successMessage"
          type="success"
          [title]="'Успешно'"
          [dismissible]="true"
          (dismissed)="successMessage = ''"
          class="alert-spacing">
          {{ successMessage }}
        </app-alert>

        <app-alert
          *ngIf="errorMessage"
          type="error"
          [title]="'Ошибка'"
          [dismissible]="true"
          (dismissed)="errorMessage = ''"
          class="alert-spacing">
          {{ errorMessage }}
        </app-alert>

        <form [formGroup]="invitationForm" (ngSubmit)="onSubmit()" class="form-content">
          <!-- Email Input -->
          <app-input
            id="email"
            label="Email адрес"
            type="email"
            placeholder="friend@example.com"
            formControlName="email"
            [errorMessage]="getErrorMessage('email')"
            [required]="true"
            prefix="✉️">
          </app-input>

          <!-- Name Input -->
          <app-input
            id="recipientName"
            label="Имя получателя"
            type="text"
            placeholder="Как зовут получателя?"
            formControlName="recipientName"
            hint="Необязательно"
            prefix="👤">
          </app-input>

          <!-- Subject Input -->
          <app-input
            id="subject"
            label="Тема письма"
            type="text"
            placeholder="Приглашение в Westwood"
            formControlName="subject"
            prefix="📋">
          </app-input>

          <!-- Message Textarea -->
          <div class="textarea-group">
            <div class="label-row">
              <app-typography variant="body2" [medium]="true">Текст письма</app-typography>
              <app-typography variant="caption" [muted]="true">
                {{ invitationForm.get('message')?.value?.length || 0 }}/1000
              </app-typography>
            </div>
            <textarea
              formControlName="message"
              class="message-textarea"
              rows="6"
              placeholder="Напишите персональное приглашение..."
              maxlength="1000">
            </textarea>
          </div>

          <app-divider [spaced]="true"></app-divider>

          <!-- Submit Button -->
          <app-button
            buttonType="primary"
            type="submit"
            [disabled]="invitationForm.invalid || isSending"
            [loading]="isSending"
            size="large"
            class="submit-btn">
            <span class="btn-content">
              <svg viewBox="0 0 24 24" fill="none" class="email-icon">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              {{ isSending ? 'Отправка...' : 'Отправить Email' }}
            </span>
          </app-button>
        </form>
      </app-card>

      <!-- Right Panel - Preview & History -->
      <div class="right-panel">
        <!-- Preview Section -->
        <div class="section-block">
          <div class="section-title">
            <svg viewBox="0 0 24 24" fill="none" class="title-icon">
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" stroke-width="1.5"/>
              <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            <h3 class="section-heading">Предпросмотр</h3>
          </div>
          <p class="section-description">Так будет выглядеть ваше письмо</p>

          <app-email-preview
            [recipientEmail]="invitationForm.get('email')?.value || 'email@example.com'"
            [message]="getPreviewMessage()"
            [activationLink]="'https://westwood.app/activate?token=xxx'"
            [buttonText]="'Activate Account'"
            [expirationDays]="7"
            [senderEmail]="'noreply@westwood.app'"
            class="preview-component">
          </app-email-preview>
        </div>

        <!-- History Section -->
        <div class="section-block history-block">
          <div class="section-title">
            <svg viewBox="0 0 24 24" fill="none" class="title-icon">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <h3 class="section-heading">История</h3>
            <app-badge 
              *ngIf="invitationHistory.length" 
              badgeType="secondary" 
              size="small"
              class="history-badge">
              {{ invitationHistory.length }}
            </app-badge>
          </div>
          <p class="section-description">Нажмите на контакт, чтобы отправить повторно</p>

          <div class="history-empty" *ngIf="invitationHistory.length === 0">
            <svg viewBox="0 0 24 24" fill="none" class="empty-icon">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M22 6l-10 7L2 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p class="empty-text">Вы ещё никому не отправляли письма</p>
          </div>

          <div class="history-list" *ngIf="invitationHistory.length > 0">
            <div 
              class="history-item" 
              *ngFor="let item of invitationHistory.slice(0, 6)"
              (click)="resendInvitation(item)">
              <div class="history-avatar">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M22 6l-10 7L2 6" stroke="currentColor" stroke-width="1.5"/>
                </svg>
              </div>
              <div class="history-info">
                <span class="history-email">{{ item.email }}</span>
                <span class="history-time">{{ formatDate(item.sentAt) }}</span>
              </div>
              <div class="history-actions">
                <app-badge 
                  [badgeType]="getStatusBadgeType(item.status)" 
                  size="small">
                  {{ getStatusLabel(item.status) }}
                </app-badge>
                <app-icon-button
                  icon="↻"
                  iconButtonType="ghost"
                  size="small"
                  tooltip="Отправить повторно">
                </app-icon-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      margin: -2rem;
    }

    .invitation-page {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      min-height: calc(100vh - 64px - 4rem);
      padding: 2rem;
      background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 50%, #f8fafc 100%);
    }

    /* Left Panel */
    .left-panel {
      display: flex;
      flex-direction: column;
      border-radius: 24px !important;
    }

    :host ::ng-deep .left-panel .card-body {
      display: flex;
      flex-direction: column;
      flex: 1;
      padding: 2rem !important;
    }

    .panel-header {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .icon-wrapper {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .icon-wrapper svg {
      width: 28px;
      height: 28px;
      color: white;
    }

    .header-text {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .panel-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .panel-subtitle {
      font-size: 0.9375rem;
      color: #64748b;
      margin: 0;
    }

    .alert-spacing {
      margin-bottom: 1.5rem;
    }

    /* Form */
    .form-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .textarea-group {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .message-textarea {
      flex: 1;
      width: 100%;
      min-height: 120px;
      padding: 0.875rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.9375rem;
      font-family: inherit;
      resize: none;
      transition: all 0.2s ease;
      background-color: #ffffff;
      color: #1a202c;
      line-height: 1.6;
    }

    .message-textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    .message-textarea::placeholder {
      color: #94a3b8;
    }

    /* Submit Button */
    .submit-btn {
      width: 100%;
    }

    :host ::ng-deep .submit-btn button {
      width: 100%;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
      border-radius: 12px !important;
      padding: 1rem 1.5rem !important;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
    }

    :host ::ng-deep .submit-btn button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.45);
    }

    .btn-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
    }

    .email-icon {
      width: 20px;
      height: 20px;
    }

    /* Right Panel */
    .right-panel {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .section-block {
      background: white;
      border-radius: 24px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .section-block:first-child {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      margin-bottom: 0.25rem;
    }

    .title-icon {
      width: 22px;
      height: 22px;
      color: #3b82f6;
    }

    .section-heading {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .section-description {
      font-size: 0.875rem;
      color: #9ca3af;
      margin: 0 0 1.25rem 0;
    }

    .history-badge {
      margin-left: auto;
    }

    .preview-component {
      flex: 1;
      display: block;
    }

    /* History */
    .history-block {
      flex-shrink: 0;
    }

    .history-empty {
      text-align: center;
      padding: 2.5rem 1rem;
    }

    .empty-icon {
      width: 56px;
      height: 56px;
      color: #d1d5db;
      margin: 0 auto 1rem;
      display: block;
    }

    .empty-text {
      font-size: 0.875rem;
      color: #9ca3af;
      margin: 0;
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .history-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .history-item:hover {
      background: #f1f5f9;
    }

    .history-avatar {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .history-avatar svg {
      width: 22px;
      height: 22px;
      color: #2563eb;
    }

    .history-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .history-email {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1f2937;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .history-time {
      font-size: 0.8125rem;
      color: #9ca3af;
    }

    .history-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .invitation-page {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .right-panel {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
      }
    }

    @media (max-width: 768px) {
      :host {
        margin: -1rem;
      }

      .invitation-page {
        padding: 1rem;
      }

      .right-panel {
        grid-template-columns: 1fr;
      }

      :host ::ng-deep .left-panel .card-body {
        padding: 1.5rem !important;
      }
    }
  `]
})
export class EmailInvitationPageComponent implements OnInit {
  user$: Observable<User | null>;
  invitationForm: FormGroup;
  
  isSending = false;
  successMessage = '';
  errorMessage = '';
  
  invitationHistory: EmailInvitationHistory[] = [];

  private pageHeaderService = inject(PageHeaderService);

  private defaultMessage = `Здравствуйте!

Приглашаю вас присоединиться к Westwood — это отличная платформа для развития вашего бизнеса.

Вы получите доступ к:
• Программе лояльности
• Эксклюзивным предложениям
• Персональным бонусам

Регистрируйтесь по ссылке: https://westwood.app/register

С уважением,
Команда Westwood`;

  private defaultSubject = 'Приглашение присоединиться к Westwood';

  constructor(
    private fb: FormBuilder,
    private store: Store<AppState>
  ) {
    this.user$ = this.store.select(selectUser);
    
    this.invitationForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      recipientName: [''],
      subject: [this.defaultSubject],
      message: [this.defaultMessage]
    });

    this.loadHistory();
  }

  ngOnInit(): void {
    this.pageHeaderService.setPageHeader('Email приглашения', [
      { label: 'Главная', route: '/home' },
      { label: 'Приглашения' },
      { label: 'Email' }
    ]);
  }

  getErrorMessage(controlName: string): string {
    const control = this.invitationForm.get(controlName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return 'Введите email адрес';
      }
      if (control.errors['email']) {
        return 'Некорректный формат email';
      }
    }
    return '';
  }

  getPreviewMessage(): string {
    const message = this.invitationForm.get('message')?.value || '';
    const recipientName = this.invitationForm.get('recipientName')?.value;
    
    if (recipientName && message.includes('Здравствуйте!')) {
      return message.replace('Здравствуйте!', `Здравствуйте, ${recipientName}!`);
    }
    return message || 'Текст письма...';
  }

  getAvatarLetter(): string {
    const name = this.invitationForm.get('recipientName')?.value;
    if (name) return name[0].toUpperCase();
    const email = this.invitationForm.get('email')?.value;
    if (email) return email[0].toUpperCase();
    return 'W';
  }

  onSubmit(): void {
    if (this.invitationForm.valid) {
      this.isSending = true;
      this.errorMessage = '';
      this.successMessage = '';

      const email = this.invitationForm.get('email')?.value;
      const subject = this.invitationForm.get('subject')?.value;
      const message = this.getPreviewMessage();

      // Создаём mailto ссылку
      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

      setTimeout(() => {
        try {
          window.location.href = mailtoUrl;
          
          const invitation: EmailInvitationHistory = {
            id: Date.now().toString(),
            email: email,
            subject: subject,
            message: message,
            sentAt: new Date(),
            status: 'sent'
          };
          
          this.invitationHistory.unshift(invitation);
          this.saveHistory();
          
          this.successMessage = 'Почтовый клиент открыт';
          this.invitationForm.patchValue({ email: '', recipientName: '' });
          this.invitationForm.get('email')?.markAsUntouched();
        } catch (error) {
          this.errorMessage = 'Не удалось открыть почтовый клиент';
        }
        this.isSending = false;
      }, 600);
    }
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  }

  getStatusBadgeType(status: string): 'success' | 'warning' | 'danger' {
    switch (status) {
      case 'sent': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      default: return 'success';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'sent': return 'Отправлено';
      case 'pending': return 'Ожидает';
      case 'failed': return 'Ошибка';
      default: return status;
    }
  }

  resendInvitation(item: EmailInvitationHistory): void {
    this.invitationForm.patchValue({
      email: item.email,
      subject: item.subject,
      message: item.message
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private loadHistory(): void {
    try {
      const saved = localStorage.getItem('email_invitation_history');
      if (saved) {
        this.invitationHistory = JSON.parse(saved);
      }
    } catch (e) {
      this.invitationHistory = [];
    }
  }

  private saveHistory(): void {
    try {
      const toSave = this.invitationHistory.slice(0, 50);
      localStorage.setItem('email_invitation_history', JSON.stringify(toSave));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  }
}

