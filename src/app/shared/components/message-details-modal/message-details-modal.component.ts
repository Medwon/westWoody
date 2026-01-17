import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';
import { BadgeComponent } from '../badge/badge.component';

export type MessageType = 'whatsapp' | 'email';

export interface MessageDetails {
  id: string;
  type: MessageType;
  recipient: string; // phone для WhatsApp, email для Email
  subject?: string; // только для Email
  message: string;
  sentAt: Date;
  status: 'sent' | 'pending' | 'failed';
  templateName?: string;
  initiatedByUsername?: string;
}

@Component({
  selector: 'app-message-details-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, BadgeComponent],
  template: `
    <app-modal
      [visible]="visible"
      [title]="getModalTitle()"
      [showCloseButton]="true"
      (visibleChange)="onClose()">
      <div class="message-details-content" *ngIf="message">
        <!-- Recipient Info -->
        <div class="detail-section">
          <div class="detail-label">Получатель</div>
          <div class="detail-value recipient-value">
            <div class="recipient-icon" [class.whatsapp]="message.type === 'whatsapp'" [class.email]="message.type === 'email'">
              <svg *ngIf="message.type === 'whatsapp'" viewBox="0 0 24 24" fill="none">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="currentColor"/>
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="currentColor"/>
              </svg>
              <svg *ngIf="message.type === 'email'" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M22 6l-10 7L2 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span>{{ message.recipient || 'Не указан' }}</span>
          </div>
        </div>

        <!-- Subject (only for Email) -->
        <div class="detail-section" *ngIf="message.type === 'email' && message.subject">
          <div class="detail-label">Тема письма</div>
          <div class="detail-value">{{ message.subject }}</div>
        </div>

        <!-- Sent Time -->
        <div class="detail-section">
          <div class="detail-label">Время отправки</div>
          <div class="detail-value">
            <div class="time-info">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span>{{ formatDateTime(message.sentAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Status -->
        <div class="detail-section">
          <div class="detail-label">Статус</div>
          <div class="detail-value">
            <app-badge 
              [badgeType]="getStatusBadgeType(message.status)" 
              size="medium">
              {{ getStatusLabel(message.status) }}
            </app-badge>
          </div>
        </div>

        <!-- Template (if used) -->
        <div class="detail-section" *ngIf="message.templateName">
          <div class="detail-label">Шаблон</div>
          <div class="detail-value">
            <span class="template-badge">{{ message.templateName }}</span>
          </div>
        </div>

        <!-- Initiated By -->
        <div class="detail-section" *ngIf="message.initiatedByUsername">
          <div class="detail-label">Отправил</div>
          <div class="detail-value">
            <div class="sender-info">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>{{ message.initiatedByUsername }}</span>
            </div>
          </div>
        </div>

        <!-- Message Content -->
        <div class="detail-section message-section">
          <div class="detail-label">Содержание сообщения</div>
          <div class="message-content">
            <pre class="message-text">{{ message.message }}</pre>
          </div>
        </div>
      </div>
    </app-modal>
  `,
  styles: [`
    .message-details-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 0.5rem 0;
    }

    .detail-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .detail-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-value {
      font-size: 0.9375rem;
      color: #1f2937;
      font-weight: 500;
    }

    .recipient-value {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .recipient-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .recipient-icon.whatsapp {
      background: linear-gradient(135deg, #dcfce7, #bbf7d0);
      color: #25D366;
    }

    .recipient-icon.email {
      background: linear-gradient(135deg, #dbeafe, #bfdbfe);
      color: #3b82f6;
    }

    .recipient-icon svg {
      width: 18px;
      height: 18px;
    }

    .time-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .time-info svg {
      width: 18px;
      height: 18px;
      color: #64748b;
    }

    .template-badge {
      display: inline-block;
      padding: 0.375rem 0.75rem;
      background: #f0fdf4;
      color: #16A34A;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .sender-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .sender-info svg {
      width: 18px;
      height: 18px;
      color: #64748b;
      flex-shrink: 0;
    }

    .message-section {
      margin-top: 0.5rem;
    }

    .message-content {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem;
      max-height: 400px;
      overflow-y: auto;
    }

    .message-text {
      margin: 0;
      font-size: 0.9375rem;
      line-height: 1.6;
      color: #1f2937;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: inherit;
    }

    /* Scrollbar styling */
    .message-content::-webkit-scrollbar {
      width: 6px;
    }

    .message-content::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 3px;
    }

    .message-content::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }

    .message-content::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `]
})
export class MessageDetailsModalComponent {
  @Input() visible = false;
  @Input() message: MessageDetails | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();

  getModalTitle(): string {
    if (!this.message) return 'Детали сообщения';
    return this.message.type === 'whatsapp' ? 'Детали WhatsApp сообщения' : 'Детали Email сообщения';
  }

  formatDateTime(date: Date): string {
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
    const timeStr = d.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return `${dateStr} в ${timeStr}`;
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

  onClose(): void {
    this.visibleChange.emit(false);
  }
}
