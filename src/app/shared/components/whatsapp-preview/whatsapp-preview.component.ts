import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-whatsapp-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="phone-frame" [class.dark-frame]="darkFrame" [class.no-shadow]="noShadow">
      <div class="phone-notch"></div>
      <div class="phone-screen">
        <!-- WhatsApp Header -->
        <div class="wa-header">
          <div class="wa-back">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="wa-contact">
            <div class="wa-avatar">{{ getAvatarLetter() }}</div>
            <div class="wa-info">
              <span class="wa-name">{{ contactName || 'Получатель' }}</span>
              <span class="wa-status">{{ status }}</span>
            </div>
          </div>
          <div class="wa-actions">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
        
        <!-- Chat Area -->
        <div class="wa-chat">
          <div class="wa-date">{{ dateLabel }}</div>
          <div class="wa-bubble" [class.incoming]="!outgoing">
            <p>{{ message || 'Текст сообщения...' }}</p>
            <div class="wa-meta">
              <span class="wa-time">{{ time || getCurrentTime() }}</span>
              <svg *ngIf="outgoing && showCheckmarks" viewBox="0 0 24 24" fill="none" class="wa-check" [class.read]="isRead">
                <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg *ngIf="outgoing && showCheckmarks && delivered" viewBox="0 0 24 24" fill="none" class="wa-check wa-check-second" [class.read]="isRead">
                <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Input Bar -->
        <div class="wa-input-bar" *ngIf="showInputBar">
          <div class="wa-emoji">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="wa-input-field">Сообщение</div>
          <div class="wa-attach">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="wa-mic">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4m-4 0h8M12 1a3 3 0 00-3 3v6a3 3 0 006 0V4a3 3 0 00-3-3z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .phone-frame {
      background: #1f2937;
      border-radius: 32px;
      padding: 8px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      min-height: 400px;
    }

    .phone-frame.dark-frame {
      background: #0f172a;
    }

    .phone-frame.no-shadow {
      box-shadow: none;
    }

    .phone-notch {
      width: 120px;
      height: 24px;
      background: inherit;
      margin: 0 auto 8px;
      border-radius: 0 0 16px 16px;
    }

    .phone-screen {
      flex: 1;
      background: #e5ddd5;
      border-radius: 24px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* WhatsApp Header */
    .wa-header {
      background: #075e54;
      padding: 0.625rem 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .wa-back svg {
      width: 20px;
      height: 20px;
      color: white;
    }

    .wa-contact {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex: 1;
    }

    .wa-avatar {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .wa-info {
      display: flex;
      flex-direction: column;
    }

    .wa-name {
      color: white;
      font-weight: 500;
      font-size: 0.9375rem;
      line-height: 1.2;
    }

    .wa-status {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.75rem;
    }

    .wa-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .wa-actions svg {
      width: 20px;
      height: 20px;
      color: white;
    }

    /* Chat Area */
    .wa-chat {
      flex: 1;
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c5c5c5' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }

    .wa-date {
      text-align: center;
      font-size: 0.6875rem;
      color: #667781;
      background: rgba(255, 255, 255, 0.9);
      padding: 0.25rem 0.75rem;
      border-radius: 8px;
      margin: 0 auto 0.75rem;
      box-shadow: 0 1px 0.5px rgba(0, 0, 0, 0.1);
    }

    .wa-bubble {
      background: #dcf8c6;
      padding: 0.5rem 0.625rem;
      border-radius: 8px 8px 0 8px;
      max-width: 85%;
      margin-left: auto;
      box-shadow: 0 1px 0.5px rgba(0, 0, 0, 0.1);
      position: relative;
    }

    .wa-bubble.incoming {
      background: white;
      margin-left: 0;
      margin-right: auto;
      border-radius: 8px 8px 8px 0;
    }

    .wa-bubble p {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.4;
      color: #111b21;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .wa-meta {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.125rem;
      margin-top: 0.125rem;
    }

    .wa-time {
      font-size: 0.6875rem;
      color: #667781;
    }

    .wa-check {
      width: 16px;
      height: 16px;
      color: #667781;
      margin-left: -4px;
    }

    .wa-check.read {
      color: #53bdeb;
    }

    .wa-check-second {
      margin-left: -12px;
    }

    /* Input Bar */
    .wa-input-bar {
      background: #f0f2f5;
      padding: 0.5rem 0.625rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .wa-emoji, .wa-attach {
      color: #54656f;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .wa-emoji svg, .wa-attach svg {
      width: 24px;
      height: 24px;
    }

    .wa-input-field {
      flex: 1;
      background: white;
      padding: 0.5rem 0.875rem;
      border-radius: 8px;
      font-size: 0.875rem;
      color: #667781;
    }

    .wa-mic {
      width: 40px;
      height: 40px;
      background: #00a884;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .wa-mic svg {
      width: 20px;
      height: 20px;
      color: white;
    }
  `]
})
export class WhatsappPreviewComponent {
  /** Имя контакта */
  @Input() contactName: string = '';
  
  /** Первая буква для аватара (если не указана, берётся из contactName) */
  @Input() avatarLetter: string = '';
  
  /** Текст сообщения */
  @Input() message: string = '';
  
  /** Время сообщения (если не указано, берётся текущее) */
  @Input() time: string = '';
  
  /** Статус контакта */
  @Input() status: string = 'онлайн';
  
  /** Подпись даты */
  @Input() dateLabel: string = 'Сегодня';
  
  /** Исходящее сообщение (справа) или входящее (слева) */
  @Input() outgoing: boolean = true;
  
  /** Показывать галочки доставки */
  @Input() showCheckmarks: boolean = true;
  
  /** Сообщение доставлено (две галочки) */
  @Input() delivered: boolean = true;
  
  /** Сообщение прочитано (синие галочки) */
  @Input() isRead: boolean = true;
  
  /** Показывать панель ввода внизу */
  @Input() showInputBar: boolean = true;
  
  /** Тёмная рамка телефона */
  @Input() darkFrame: boolean = false;

  /** Убрать тень */
  @Input() noShadow: boolean = false;

  getAvatarLetter(): string {
    if (this.avatarLetter) return this.avatarLetter;
    if (this.contactName) return this.contactName[0].toUpperCase();
    return '?';
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
}

