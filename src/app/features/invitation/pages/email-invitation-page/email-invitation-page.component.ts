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
import { MessageDetailsModalComponent, MessageDetails } from '../../../../shared/components/message-details-modal/message-details-modal.component';
import { PaginatedTableWrapperComponent } from '../../../../shared/components/paginated-table-wrapper/paginated-table-wrapper.component';

interface EmailInvitationHistory {
  id: string;
  email: string;
  subject: string;
  message: string;
  sentAt: Date;
  status: 'sent' | 'pending' | 'failed';
  templateId?: string;
  templateName?: string;
  templateType?: 'bonus_accrued' | 'bonus_expiration';
  type: 'email';
}

@Component({
  selector: 'app-email-invitation-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BadgeComponent,
    IconButtonComponent,
    InvitationFormComponent,
    MessageDetailsModalComponent,
    PaginatedTableWrapperComponent
  ],
  template: `
    <div class="invitation-page">
      <app-invitation-form
        [invitationType]="'email'"
        [form]="invitationForm"
        [title]="'Пригласи друга'"
        [subtitle]="'Отправь приглашение по Email'"
        [iconSvg]="emailIconSvg"
        [iconColor]="'#3b82f6'"
        [previewDescription]="'Так будет выглядеть ваше письмо'"
        [messageTemplates]="messageTemplates"
        [isSending]="isSending"
        [successMessage]="successMessage"
        [errorMessage]="errorMessage"
        [hideForm]="true"
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
        <p class="section-description">История отправленных сообщений</p>

        <div class="history-empty" *ngIf="invitationHistory.length === 0">
          <svg viewBox="0 0 24 24" fill="none" class="empty-icon">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M22 6l-10 7L2 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <p class="empty-text">Вы ещё никому не отправляли письма</p>
        </div>

        <app-paginated-table-wrapper
          *ngIf="invitationHistory.length > 0"
          [paginationEnabled]="true"
          [data]="invitationHistory"
          [defaultPageSize]="15"
          #paginatedTable>
          
          <div class="table-container">
            <table class="history-table">
              <thead>
                <tr>
                  <th>Получатель</th>
                  <th>Время отправки</th>
                  <th>Шаблон</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of paginatedTable.paginatedData">
                  <td>
                    <div class="recipient-cell">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M22 6l-10 7L2 6" stroke="currentColor" stroke-width="1.5"/>
                      </svg>
                      <span class="recipient-value">{{ item.email }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="time-value">{{ formatDate(item.sentAt) }}</span>
                  </td>
                  <td>
                    <span class="template-name" *ngIf="item.templateName">
                      {{ item.templateName }}
                    </span>
                    <span class="no-template" *ngIf="!item.templateName">—</span>
                  </td>
                  <td>
                    <app-badge 
                      [badgeType]="getStatusBadgeType(item.status)" 
                      size="small">
                      {{ getStatusLabel(item.status) }}
                    </app-badge>
                  </td>
                  <td>
                    <div class="actions-cell">
                      <app-icon-button
                        iconButtonType="ghost"
                        size="small"
                        tooltip="Просмотреть детали"
                        (onClick)="openMessageDetails(item)">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.5"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                      </app-icon-button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </app-paginated-table-wrapper>
      </div>

      <!-- Message Details Modal -->
      <app-message-details-modal
        [visible]="showMessageDetailsModal"
        [message]="selectedMessage"
        (visibleChange)="showMessageDetailsModal = $event">
      </app-message-details-modal>
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
      background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 50%, #f8fafc 100%);
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

    .table-container {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .history-table {
      width: 100%;
      border-collapse: collapse;
    }

    .history-table thead {
      background: #f8fafc;
    }

    .history-table th {
      padding: 1rem 1.5rem;
      text-align: left;
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
    }

    .history-table td {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .history-table tbody tr:hover {
      background: #f8fafc;
    }

    .history-table tbody tr:last-child td {
      border-bottom: none;
    }

    .recipient-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .recipient-cell svg {
      width: 20px;
      height: 20px;
      color: #3b82f6;
      flex-shrink: 0;
    }

    .recipient-value {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1f2937;
    }

    .time-value {
      font-size: 0.875rem;
      color: #64748b;
    }

    .template-type-badge {
      display: inline-block;
      padding: 0.375rem 0.75rem;
      background: #eff6ff;
      color: #3b82f6;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .template-name {
      font-size: 0.875rem;
      color: #475569;
      font-weight: 500;
    }

    .no-template {
      font-size: 0.875rem;
      color: #94a3b8;
      font-style: italic;
    }

    .actions-cell {
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
export class EmailInvitationPageComponent implements OnInit {
  user$: Observable<User | null>;
  invitationForm: FormGroup;
  
  isSending = false;
  successMessage = '';
  errorMessage = '';
  
  invitationHistory: EmailInvitationHistory[] = [];
  messageTemplates: MessageTemplate[] = [];
  selectedTemplateId: string | null = null;

  showMessageDetailsModal = false;
  selectedMessage: MessageDetails | null = null;

  emailIconSvg: string;

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
      subject: [this.defaultSubject],
      message: [this.defaultMessage, [Validators.required]]
    });

    this.emailIconSvg = `
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M22 6l-10 7L2 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    this.loadHistory();
    this.loadTemplates();
  }

  ngOnInit(): void {
    this.pageHeaderService.setPageHeader('Email коммуникация', [
      { label: 'Главная', route: '/home' },
      { label: 'Коммуникация' },
      { label: 'Email' }
    ]);
  }

  onSubmit(): void {
    if (this.invitationForm.valid) {
      this.isSending = true;
      this.errorMessage = '';
      this.successMessage = '';

      const subject = this.invitationForm.get('subject')?.value;
      const message = this.invitationForm.get('message')?.value || '';

      // Для Email нужно будет получать email адрес из другого источника
      // Пока просто показываем сообщение об успехе
      setTimeout(() => {
        try {
          const selectedTemplate = this.selectedTemplateId 
            ? this.messageTemplates.find(t => t.id === this.selectedTemplateId)
            : null;
          
          const invitation: EmailInvitationHistory = {
            id: Date.now().toString(),
            email: '', // Будет заполнено из другого источника
            subject: subject,
            message: message,
            sentAt: new Date(),
            status: 'sent',
            templateId: selectedTemplate?.id,
            templateName: selectedTemplate?.name,
            templateType: selectedTemplate?.type,
            type: 'email'
          };
          
          this.invitationHistory.unshift(invitation);
          this.saveHistory();
          
          this.successMessage = 'Письмо готово к отправке';
          this.invitationForm.patchValue({ 
            subject: this.defaultSubject,
            message: this.defaultMessage 
          });
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

  getTemplateTypeLabel(type: 'bonus_accrued' | 'bonus_expiration'): string {
    switch (type) {
      case 'bonus_accrued': return 'Начисление бонусов';
      case 'bonus_expiration': return 'Истечение бонусов';
      default: return type;
    }
  }

  openMessageDetails(item: EmailInvitationHistory): void {
    this.selectedMessage = {
      id: item.id,
      type: 'email',
      recipient: item.email,
      subject: item.subject,
      message: item.message,
      sentAt: item.sentAt,
      status: item.status,
      templateName: item.templateName
    };
    this.showMessageDetailsModal = true;
  }

  resendInvitation(item: EmailInvitationHistory, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.invitationForm.patchValue({
      subject: item.subject,
      message: item.message
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private loadHistory(): void {
    try {
      const saved = localStorage.getItem('email_invitation_history');
      if (saved) {
        const history = JSON.parse(saved);
        // Добавляем type для старых записей
        this.invitationHistory = history.map((item: any) => ({
          ...item,
          type: item.type || 'email'
        }));
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

  private loadTemplates(): void {
    try {
      const saved = localStorage.getItem('email_message_templates');
      if (saved) {
        this.messageTemplates = JSON.parse(saved);
      } else {
        // Default template
        this.messageTemplates = [{
          id: '1',
          name: 'Приветственное сообщение',
          type: 'bonus_accrued',
          subject: this.defaultSubject,
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
      localStorage.setItem('email_message_templates', JSON.stringify(this.messageTemplates));
    } catch (e) {
      console.error('Failed to save templates', e);
    }
  }
}
