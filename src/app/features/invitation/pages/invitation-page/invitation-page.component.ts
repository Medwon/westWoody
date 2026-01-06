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
import { WhatsappPreviewComponent } from '../../../../shared/components/whatsapp-preview/whatsapp-preview.component';

interface InvitationHistory {
  id: string;
  phone: string;
  message: string;
  sentAt: Date;
  status: 'sent' | 'pending' | 'failed';
}

@Component({
  selector: 'app-invitation-page',
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
    WhatsappPreviewComponent
  ],
  template: `
    <div class="invitation-page">
        <!-- Left Panel - Form -->
      <app-card [shadow]="true" class="left-panel">
        <div class="panel-header">
          <div class="icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="currentColor"/>
              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="currentColor"/>
            </svg>
          </div>
          <div class="header-text">
            <h2 class="panel-title">Пригласи друга</h2>
            <p class="panel-subtitle">Отправь приглашение через WhatsApp</p>
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
          <!-- Phone Input -->
          <app-input
            id="phone"
            label="Номер телефона"
            type="tel"
            placeholder="+7 999 123 45 67"
            formControlName="phone"
            [errorMessage]="getErrorMessage('phone')"
            [required]="true"
            prefix="📞">
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

          <!-- Message Textarea -->
          <div class="textarea-group">
            <div class="label-row">
              <app-typography variant="body2" [medium]="true">Текст приглашения</app-typography>
              <app-typography variant="caption" [muted]="true">
                {{ invitationForm.get('message')?.value?.length || 0 }}/500
              </app-typography>
            </div>
            <textarea
              formControlName="message"
              class="message-textarea"
              rows="6"
              placeholder="Напишите персональное приглашение..."
              maxlength="500">
            </textarea>
          </div>

          <app-divider [spaced]="true"></app-divider>

          <!-- Submit Button -->
          <app-button
            buttonType="success"
            type="submit"
            [disabled]="invitationForm.invalid || isSending"
            [loading]="isSending"
            size="large"
            class="submit-btn">
            <span class="btn-content">
              <svg viewBox="0 0 24 24" fill="none" class="wa-icon">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="currentColor"/>
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="currentColor"/>
              </svg>
              {{ isSending ? 'Открываем WhatsApp...' : 'Отправить в WhatsApp' }}
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
          <p class="section-description">Так будет выглядеть ваше сообщение в WhatsApp</p>

          <app-whatsapp-preview
            [contactName]="getContactName()"
            [avatarLetter]="getAvatarLetter()"
            [message]="getPreviewMessage()"
            [showInputBar]="true"
            [noShadow]="true"
            class="preview-component">
          </app-whatsapp-preview>
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
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p class="empty-text">Вы ещё никого не приглашали</p>
          </div>

          <div class="history-list" *ngIf="invitationHistory.length > 0">
            <div 
              class="history-item" 
              *ngFor="let item of invitationHistory.slice(0, 6)"
              (click)="resendInvitation(item)">
              <div class="history-avatar">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="history-info">
                <span class="history-phone">{{ formatPhone(item.phone) }}</span>
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
      background: linear-gradient(180deg, #f0fdf4 0%, #f8fafc 50%, #f8fafc 100%);
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
      background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
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
      border-color: #25D366;
      box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.15);
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
      background: linear-gradient(135deg, #25D366 0%, #128C7E 100%) !important;
      border-radius: 12px !important;
      padding: 1rem 1.5rem !important;
      box-shadow: 0 4px 14px rgba(37, 211, 102, 0.35);
    }

    :host ::ng-deep .submit-btn button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(37, 211, 102, 0.45);
    }

    .btn-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
    }

    .wa-icon {
      width: 22px;
      height: 22px;
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
      color: #25D366;
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
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .history-avatar svg {
      width: 22px;
      height: 22px;
      color: #16a34a;
    }

    .history-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .history-phone {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1f2937;
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

      .history-list {
        grid-template-columns: 1fr;
      }

      :host ::ng-deep .left-panel .card-body {
        padding: 1.5rem !important;
      }
    }
  `]
})
export class InvitationPageComponent implements OnInit {
  user$: Observable<User | null>;
  invitationForm: FormGroup;
  
  isSending = false;
  successMessage = '';
  errorMessage = '';
  
  invitationHistory: InvitationHistory[] = [];

  private pageHeaderService = inject(PageHeaderService);

  private defaultMessage = `Привет! 👋

Приглашаю тебя присоединиться к Westwood — это отличная платформа для развития.

Регистрируйся по ссылке:
https://westwood.app/register`;

  constructor(
    private fb: FormBuilder,
    private store: Store<AppState>
  ) {
    this.user$ = this.store.select(selectUser);
    
    this.invitationForm = this.fb.group({
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s\-\(\)]{10,20}$/)]],
      recipientName: [''],
      message: [this.defaultMessage]
    });

    this.loadHistory();
  }

  ngOnInit(): void {
    this.pageHeaderService.setPageHeader('WhatsApp приглашения', [
      { label: 'Главная', route: '/home' },
      { label: 'Приглашения' },
      { label: 'WhatsApp' }
    ]);
  }

  getErrorMessage(controlName: string): string {
    const control = this.invitationForm.get(controlName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return 'Введите номер телефона';
      }
      if (control.errors['pattern']) {
        return 'Некорректный формат номера';
      }
    }
    return '';
  }

  getPreviewMessage(): string {
    const message = this.invitationForm.get('message')?.value || '';
    const recipientName = this.invitationForm.get('recipientName')?.value;
    
    if (recipientName && message.includes('Привет!')) {
      return message.replace('Привет!', `Привет, ${recipientName}!`);
    }
    return message || 'Текст сообщения...';
  }

  getAvatarLetter(): string {
    const name = this.invitationForm.get('recipientName')?.value;
    if (name) return name[0].toUpperCase();
    const phone = this.invitationForm.get('phone')?.value;
    if (phone) return phone.replace(/\D/g, '').slice(-1) || '?';
    return '?';
  }

  getContactName(): string {
    const name = this.invitationForm.get('recipientName')?.value;
    if (name) return name;
    const phone = this.invitationForm.get('phone')?.value;
    return phone || 'Получатель';
  }

  onSubmit(): void {
    if (this.invitationForm.valid) {
      this.isSending = true;
      this.errorMessage = '';
      this.successMessage = '';

      const phone = this.cleanPhoneNumber(this.invitationForm.get('phone')?.value);
      const message = this.getPreviewMessage();

      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

      setTimeout(() => {
        try {
          window.open(whatsappUrl, '_blank');
          
          const invitation: InvitationHistory = {
            id: Date.now().toString(),
            phone: this.invitationForm.get('phone')?.value,
            message: message,
            sentAt: new Date(),
            status: 'sent'
          };
          
          this.invitationHistory.unshift(invitation);
          this.saveHistory();
          
          this.successMessage = 'WhatsApp открыт в новой вкладке';
          this.invitationForm.patchValue({ phone: '', recipientName: '' });
          this.invitationForm.get('phone')?.markAsUntouched();
        } catch (error) {
          this.errorMessage = 'Не удалось открыть WhatsApp';
        }
        this.isSending = false;
      }, 600);
    }
  }

  cleanPhoneNumber(phone: string): string {
    return phone.replace(/[^\d]/g, '');
  }

  formatPhone(phone: string): string {
    const cleaned = this.cleanPhoneNumber(phone);
    if (cleaned.length === 11 && cleaned.startsWith('7')) {
      return `+7 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`;
    }
    return phone;
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

  getInitials(phone: string): string {
    const cleaned = this.cleanPhoneNumber(phone);
    return cleaned.slice(-2);
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

  resendInvitation(item: InvitationHistory): void {
    this.invitationForm.patchValue({
      phone: item.phone,
      message: item.message
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private loadHistory(): void {
    try {
      const saved = localStorage.getItem('invitation_history');
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
      localStorage.setItem('invitation_history', JSON.stringify(toSave));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  }
}
