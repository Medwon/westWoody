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
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';
import { InvitationFormComponent, MessageTemplate } from '../../../../shared/components/invitation-form/invitation-form.component';

interface InvitationHistory {
  id: string;
  phone: string;
  message: string;
  sentAt: Date;
  status: 'sent' | 'pending' | 'failed';
  templateId?: string;
  templateName?: string;
}

@Component({
  selector: 'app-invitation-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BadgeComponent,
    IconButtonComponent,
    InvitationFormComponent
  ],
  template: `
    <div class="invitation-page">
      <app-invitation-form
        [invitationType]="'whatsapp'"
        [form]="invitationForm"
        [title]="'Пригласи друга'"
        [subtitle]="'Отправь приглашение через WhatsApp'"
        [iconSvg]="whatsappIconSvg"
        [iconColor]="'#25D366'"
        [previewDescription]="'Так будет выглядеть ваше сообщение в WhatsApp'"
        [messageTemplates]="messageTemplates"
        [isSending]="isSending"
        [successMessage]="successMessage"
        [errorMessage]="errorMessage"
        (formSubmit)="onSubmit()"
        (templateSelected)="onTemplateSelected($event)"
        (templateCreated)="onTemplateCreated($event)"
        (templateUpdated)="onTemplateUpdated($event)"
        (templateDeleted)="onTemplateDeleted($event)">
      </app-invitation-form>

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
              <div class="history-meta">
                <span class="history-time">{{ formatDate(item.sentAt) }}</span>
                <span class="history-template" *ngIf="item.templateName">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                  {{ item.templateName }}
                </span>
              </div>
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
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      margin: -2rem;
    }

    .invitation-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      min-height: calc(100vh - 64px - 4rem);
      padding: 2rem;
      background: linear-gradient(180deg, #f0fdf4 0%, #f8fafc 50%, #f8fafc 100%);
    }

    /* History Section */
    .section-block {
      background: white;
      border-radius: 24px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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

    .history-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .history-time {
      font-size: 0.8125rem;
      color: #9ca3af;
    }

    .history-template {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: #25D366;
      background: #f0fdf4;
      padding: 0.25rem 0.5rem;
      border-radius: 8px;
      font-weight: 500;
    }

    .history-template svg {
      width: 12px;
      height: 12px;
      flex-shrink: 0;
    }

    .history-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      :host {
        margin: -1rem;
      }

      .invitation-page {
        padding: 1rem;
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
  messageTemplates: MessageTemplate[] = [];
  selectedTemplateId: string | null = null;

  whatsappIconSvg: string;

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
      message: [this.defaultMessage, [Validators.required]]
    });

    this.whatsappIconSvg = `
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="currentColor"/>
        <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="currentColor"/>
      </svg>
    `;

    this.loadHistory();
    this.loadTemplates();
  }

  ngOnInit(): void {
    this.pageHeaderService.setPageHeader('WhatsApp приглашения', [
      { label: 'Главная', route: '/home' },
      { label: 'Приглашения' },
      { label: 'WhatsApp' }
    ]);
  }

  onSubmit(): void {
    if (this.invitationForm.valid) {
      this.isSending = true;
      this.errorMessage = '';
      this.successMessage = '';

      const message = this.invitationForm.get('message')?.value || '';

      // Для WhatsApp нужно будет получать номер телефона из другого источника
      // Пока просто показываем сообщение об успехе
      setTimeout(() => {
        try {
          const selectedTemplate = this.selectedTemplateId 
            ? this.messageTemplates.find(t => t.id === this.selectedTemplateId)
            : null;
          
          const invitation: InvitationHistory = {
            id: Date.now().toString(),
            phone: '', // Будет заполнено из другого источника
            message: message,
            sentAt: new Date(),
            status: 'sent',
            templateId: selectedTemplate?.id,
            templateName: selectedTemplate?.name
          };
          
          this.invitationHistory.unshift(invitation);
          this.saveHistory();
          
          this.successMessage = 'Сообщение готово к отправке';
          this.invitationForm.patchValue({ message: this.defaultMessage });
          this.selectedTemplateId = null;
        } catch (error) {
          this.errorMessage = 'Произошла ошибка';
        }
        this.isSending = false;
      }, 600);
    }
  }

  onTemplateSelected(template: MessageTemplate): void {
    this.selectedTemplateId = template.id;
  }

  onTemplateCreated(template: MessageTemplate): void {
    this.messageTemplates.push(template);
    this.saveTemplates();
  }

  onTemplateUpdated(template: MessageTemplate): void {
    const index = this.messageTemplates.findIndex(t => t.id === template.id);
    if (index !== -1) {
      this.messageTemplates[index] = template;
      this.saveTemplates();
    }
  }

  onTemplateDeleted(templateId: string): void {
    this.messageTemplates = this.messageTemplates.filter(t => t.id !== templateId);
    this.saveTemplates();
  }

  formatPhone(phone: string): string {
    if (!phone) return 'Не указан';
    const cleaned = phone.replace(/[^\d]/g, '');
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

  private loadTemplates(): void {
    try {
      const saved = localStorage.getItem('whatsapp_message_templates');
      if (saved) {
        this.messageTemplates = JSON.parse(saved);
      } else {
        // Default template
        this.messageTemplates = [{
          id: '1',
          name: 'Приветственное сообщение',
          type: 'bonus_accrued',
          content: this.defaultMessage,
          createdAt: new Date()
        }];
        this.saveTemplates();
      }
    } catch (e) {
      this.messageTemplates = [];
    }
  }

  private saveTemplates(): void {
    try {
      localStorage.setItem('whatsapp_message_templates', JSON.stringify(this.messageTemplates));
    } catch (e) {
      console.error('Failed to save templates', e);
    }
  }
}
