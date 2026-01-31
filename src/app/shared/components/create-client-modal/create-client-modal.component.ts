import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { timeout, catchError, of } from 'rxjs';
import { ModalComponent } from '../modal/modal.component';
import { ButtonComponent } from '../button/button.component';
import { ClientsService, CreateClientRequest } from '../../../core/services/clients.service';
import { MessageTemplatesService } from '../../../core/services/message-templates.service';
import { MessagesService } from '../../../core/services/messages.service';
import { BonusTypesService } from '../../../core/services/bonus-types.service';
import { BonusTypeResponse } from '../../../core/models/bonus-type.model';
import { ToastService } from '../../../core/services/toast.service';
import { PhoneFormatPipe } from '../../pipes/phone-format.pipe';

interface CreatedClient {
  id: string;
  name: string;
  surname?: string;
  phone: string;
  balance: number;
  type: 'individual' | 'business';
}

type ModalStep = 'form' | 'notify';

@Component({
  selector: 'app-create-client-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    ButtonComponent,
    PhoneFormatPipe
  ],
  template: `
    <app-modal
      [visible]="visible"
      [title]="getModalTitle()"
      [showCloseButton]="true"
      (closed)="onClose()">
      
      <!-- Step 1: Client Form -->
      <div class="step-form" *ngIf="currentStep === 'form'">
        <!-- Welcome Bonus Hint -->
        <div class="bonus-hint-box" *ngIf="welcomeBonusAmount > 0">
          <svg viewBox="0 0 24 24" fill="none" class="bonus-icon">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
          </svg>
          <div class="bonus-text">
            <span class="bonus-label">Приветственный бонус</span>
            <span class="bonus-value">Клиент получит <strong>{{ welcomeBonusAmount }}</strong> бонусов после создания</span>
          </div>
        </div>

        <div class="form-group">
          <label class="input-label">Телефон <span class="required">*</span></label>
          <input
            type="tel"
            class="form-input"
            [(ngModel)]="clientPhone"
            placeholder="+7 (___) ___-__-__"
            (blur)="normalizePhone()">
          <div class="input-hint">Пример: +77001234567 или 87001234567</div>
        </div>

        <div class="form-group">
          <label class="input-label">{{ clientType === 'business' ? 'Название клиента' : 'Имя' }} <span class="required">*</span></label>
          <input
            type="text"
            class="form-input"
            [(ngModel)]="clientName"
            [placeholder]="clientType === 'business' ? 'ТОО «Клиент»' : 'Иван'">
        </div>

        <div class="form-group" *ngIf="clientType === 'individual'">
          <label class="input-label">Фамилия (необязательно)</label>
          <input
            type="text"
            class="form-input"
            [(ngModel)]="clientSurname"
            placeholder="Иванов">
        </div>

        <div class="form-group" *ngIf="clientType === 'individual'">
          <label class="input-label">Дата рождения (необязательно)</label>
          <input
            type="date"
            class="form-input"
            [(ngModel)]="clientBirthday">
        </div>

        <!-- Client Type Radio -->
        <div class="form-group">
          <label class="input-label">Тип клиента</label>
          <div class="radio-group">
            <label class="radio-label">
              <input
                type="radio"
                name="clientType"
                value="individual"
                [(ngModel)]="clientType"
                class="radio-input">
              <span class="radio-custom"></span>
              <span class="radio-text">Индивидуальный</span>
            </label>
            <label class="radio-label">
              <input
                type="radio"
                name="clientType"
                value="business"
                [(ngModel)]="clientType"
                class="radio-input">
              <span class="radio-custom"></span>
              <span class="radio-text">Бизнес</span>
            </label>
          </div>
        </div>

        <!-- Tags -->
        <div class="form-group">
          <label class="input-label">Тэги</label>
          <input
            type="text"
            class="form-input"
            [(ngModel)]="clientTags"
            placeholder="VIP, постоянный, новый..."
            (focus)="showTagsDropdown = true">
          <div class="input-hint">Введите тэги через запятую или выберите из списка</div>
          
          <!-- Tags Dropdown -->
          <div class="tags-dropdown" *ngIf="showTagsDropdown && availableTags.length > 0">
            <div class="tags-dropdown-header">
              <span>Популярные тэги</span>
              <button type="button" class="tags-dropdown-close" (click)="showTagsDropdown = false">×</button>
            </div>
            <div class="tags-dropdown-list">
              <button 
                type="button"
                class="tag-option" 
                *ngFor="let tag of availableTags"
                (click)="addTag(tag)"
                [class.selected]="isTagSelected(tag)">
                {{ tag }}
                <span class="tag-check" *ngIf="isTagSelected(tag)">✓</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Comment -->
        <div class="form-group">
          <label class="input-label">Комментарий (необязательно)</label>
          <textarea
            class="form-textarea"
            [(ngModel)]="clientComment"
            placeholder="Заметки о клиенте..."
            rows="3"></textarea>
        </div>

        <button class="submit-btn" (click)="createClient()" [disabled]="!clientPhone || !clientName || isLoading">
          {{ isLoading ? 'Создание...' : 'Создать клиента' }}
        </button>
      </div>

      <!-- Step 2: Notify -->
      <div class="step-notify" *ngIf="currentStep === 'notify'">
        <div class="success-banner">
          <svg viewBox="0 0 24 24" fill="none" class="success-icon">
            <circle cx="12" cy="12" r="10" fill="#16A34A"/>
            <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div class="success-text">
            <span class="success-title">Клиент создан!</span>
            <span class="success-subtitle">{{ createdClient?.name }} • {{ welcomeBonusAmount }} бонусов начислено</span>
          </div>
        </div>

        <div class="send-message-content">
          <!-- Selected Template -->
          <div class="template-section" *ngIf="selectedWelcomeTemplate">
            <label class="template-section-label">Шаблон приветственного сообщения</label>
            <div class="template-card-display">
              <div class="template-card-header">
                <div class="template-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                </div>
                <div class="template-info">
                  <h4 class="template-name-display">{{ selectedWelcomeTemplate.name }}</h4>
                  <span class="template-type-badge">Приветственный бонус</span>
                </div>
              </div>
              <div class="template-content-display">
                <p class="template-content-text">{{ selectedWelcomeTemplate.content }}</p>
              </div>
            </div>
          </div>

          <!-- Template Not Found -->
          <div class="template-not-found" *ngIf="!selectedWelcomeTemplate">
            <svg viewBox="0 0 24 24" fill="none" class="not-found-icon">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <div class="not-found-text">
              <span class="not-found-title">Шаблон не найден</span>
              <span class="not-found-subtitle">Создайте шаблон сообщения типа "WELCOME_BONUS" в настройках</span>
            </div>
          </div>

          <!-- Phone Number -->
          <div class="phone-section">
            <label class="phone-label">Номер телефона получателя</label>
            <div class="phone-display">
              <svg viewBox="0 0 24 24" fill="none" class="phone-icon">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              <span class="phone-number">{{ createdClient?.phone | phoneFormat }}</span>
            </div>
          </div>

          <!-- Message Content -->
          <div class="message-content-section" *ngIf="selectedWelcomeTemplate">
            <label class="message-content-label">Содержимое сообщения</label>
            <div class="message-content-box">
              <p class="message-text">{{ populatedMessageContent }}</p>
            </div>
          </div>
        </div>

        <div class="notify-actions">
          <app-button 
            *ngIf="selectedWelcomeTemplate"
            buttonType="primary"  
            size="large"
            class="send-message-btn"
            (click)="sendWelcomeMessage()" 
            [disabled]="isSendingMessage">
            <svg viewBox="0 0 24 24" fill="none" class="whatsapp-icon">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="currentColor"/>
              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="currentColor"/>
            </svg>
            {{ isSendingMessage ? 'Отправка...' : 'Отправить в WhatsApp' }}
          </app-button>
          
          <button class="skip-btn" (click)="skipAndFinish()">
            Пропустить и закрыть
          </button>
        </div>
      </div>
    </app-modal>
  `,
  styles: [`
    .input-label {
      display: block;
      font-size: 0.9rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 0.5rem;
    }

    .required {
      color: #dc2626;
    }

    /* Form */
    .form-group {
      margin-bottom: 1rem;
      position: relative;
    }

    .form-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 1rem;
      outline: none;
      transition: 0.2s;
    }

    .form-input:focus {
      border-color: #16A34A;
      box-shadow: 0 0 0 3px #dcfce7;
    }

    .form-input[type="date"] {
      font-family: inherit;
      color: #1f2937;
    }

    .input-hint {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 0.25rem;
    }

    /* Tags Dropdown */
    .tags-dropdown {
      margin-top: 8px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .tags-dropdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
    }

    .tags-dropdown-close {
      background: none;
      border: none;
      font-size: 1.25rem;
      color: #94a3b8;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }

    .tags-dropdown-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px;
      max-height: 150px;
      overflow-y: auto;
    }

    .tag-option {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      color: #15803d;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .tag-option:hover {
      background: #dcfce7;
      border-color: #86efac;
    }

    .tag-option.selected {
      background: #16A34A;
      border-color: #16A34A;
      color: white;
    }

    .tag-check {
      font-size: 0.7rem;
    }

    /* Textarea */
    .form-textarea {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 1rem;
      font-family: inherit;
      outline: none;
      transition: 0.2s;
      resize: vertical;
      min-height: 80px;
    }

    .form-textarea:focus {
      border-color: #16A34A;
      box-shadow: 0 0 0 3px #dcfce7;
    }

    /* Radio Group */
    .radio-group {
      display: flex;
      gap: 1.5rem;
    }

    .radio-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      color: #374151;
    }

    .radio-input {
      display: none;
    }

    .radio-custom {
      width: 20px;
      height: 20px;
      border: 2px solid #cbd5e1;
      border-radius: 50%;
      position: relative;
      transition: 0.2s;
    }

    .radio-custom::after {
      content: '';
      position: absolute;
      width: 10px;
      height: 10px;
      background: #16A34A;
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0);
      transition: 0.2s;
    }

    .radio-input:checked + .radio-custom {
      border-color: #16A34A;
    }

    .radio-input:checked + .radio-custom::after {
      transform: translate(-50%, -50%) scale(1);
    }

    .radio-text {
      font-weight: 500;
    }

    /* Bonus Hint Box */
    .bonus-hint-box {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 1rem;
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 1px solid #fcd34d;
      border-radius: 12px;
      margin: 0 0 1rem 0;
    }

    .bonus-icon {
      width: 32px;
      height: 32px;
      color: #d97706;
      flex-shrink: 0;
    }

    .bonus-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .bonus-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #92400e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .bonus-value {
      font-size: 0.9rem;
      color: #78350f;
    }

    .bonus-value strong {
      color: #d97706;
      font-weight: 700;
    }

    /* Submit Button */
    .submit-btn {
      width: 100%;
      background: #16A34A;
      color: white;
      padding: 14px;
      border: none;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      font-size: 1rem;
      transition: 0.2s;
    }

    .submit-btn:hover:not(:disabled) {
      background: #14532d;
    }

    .submit-btn:disabled {
      background: #94a3b8;
      cursor: not-allowed;
    }

    /* Success Banner */
    .success-banner {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      border: 1px solid #86efac;
      border-radius: 12px;
      margin-bottom: 1.5rem;
    }

    .success-icon {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
    }

    .success-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .success-title {
      font-size: 1rem;
      font-weight: 700;
      color: #15803d;
    }

    .success-subtitle {
      font-size: 0.85rem;
      color: #166534;
    }

    /* Send Message Content */
    .send-message-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .template-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .template-section-label, .phone-label, .message-content-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #475569;
    }

    .template-card-display {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
    }

    .template-card-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .template-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .template-icon svg {
      width: 20px;
      height: 20px;
      color: #16a34a;
    }

    .template-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .template-name-display {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .template-type-badge {
      font-size: 0.75rem;
      color: #64748b;
      background: #f1f5f9;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      display: inline-block;
      width: fit-content;
    }

    .template-content-display {
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .template-content-text {
      margin: 0;
      font-size: 0.9375rem;
      line-height: 1.6;
      color: #1f2937;
      white-space: pre-wrap;
    }

    .template-not-found {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 12px;
      margin-bottom: 1.5rem;
    }

    .not-found-icon {
      width: 40px;
      height: 40px;
      color: #d97706;
      flex-shrink: 0;
    }

    .not-found-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .not-found-title {
      font-size: 1rem;
      font-weight: 600;
      color: #92400e;
    }

    .not-found-subtitle {
      font-size: 0.875rem;
      color: #b45309;
    }

    .phone-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .phone-display {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
    }

    .phone-icon {
      width: 20px;
      height: 20px;
      color: #16A34A;
      flex-shrink: 0;
    }

    .phone-number {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
      font-family: 'Courier New', monospace;
    }

    .message-content-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .message-content-box {
      padding: 1.25rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      max-height: 200px;
      overflow-y: auto;
    }

    .message-text {
      margin: 0;
      font-size: 0.9375rem;
      line-height: 1.6;
      color: #1f2937;
      white-space: pre-wrap;
    }

    /* Notify Actions */
    .notify-actions {
      margin-top: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .send-message-btn {
      width: 100%;
    }

    .send-message-btn ::ng-deep button {
      width: 100% !important;
      justify-content: center;
    }

    .whatsapp-icon {
      width: 20px;
      height: 20px;
    }

    .skip-btn {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      font-size: 0.875rem;
      padding: 0.5rem;
      text-align: center;
      transition: color 0.2s;
    }

    .skip-btn:hover {
      color: #1f2937;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .step-notify {
      animation: slideDown 0.3s ease;
    }
  `]
})
export class CreateClientModalComponent implements OnChanges, OnDestroy {
  private clientsService = inject(ClientsService);
  private messageTemplatesService = inject(MessageTemplatesService);
  private messagesService = inject(MessagesService);
  private bonusTypesService = inject(BonusTypesService);
  private toastService = inject(ToastService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() clientCreated = new EventEmitter<CreatedClient>();

  currentStep: ModalStep = 'form';
  isLoading = false;
  isSendingMessage = false;

  // Form fields
  clientPhone = '';
  clientName = '';
  clientSurname = '';
  clientEmail = '';
  clientBirthday = '';
  clientType: 'individual' | 'business' = 'individual';
  clientTags = '';
  clientComment = '';
  showTagsDropdown = false;
  availableTags: string[] = [];

  // Welcome bonus
  welcomeBonusAmount = 0;

  // Created client data
  createdClient: CreatedClient | null = null;

  // Message
  selectedWelcomeTemplate: any = null;
  populatedMessageContent = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      this.toggleBodyScroll(changes['visible'].currentValue);
      if (changes['visible'].currentValue) {
        this.loadAvailableTags();
        this.loadWelcomeBonusConfig();
      }
    }
  }

  ngOnDestroy(): void {
    this.toggleBodyScroll(false);
  }

  private toggleBodyScroll(disable: boolean): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = disable ? 'hidden' : '';
    }
  }

  loadAvailableTags(): void {
    this.clientsService.getTags().subscribe({
      next: (tags) => {
        this.availableTags = Array.isArray(tags) ? tags : [];
      },
      error: (err) => {
        console.error('Error loading tags:', err);
        this.availableTags = [];
      }
    });
  }

  loadWelcomeBonusConfig(): void {
    this.bonusTypesService.getBonusTypesByFlow('create_client')
      .pipe(
        timeout(5000),
        catchError((err) => {
          console.warn('Error loading welcome bonus config:', err);
          return of(null as BonusTypeResponse | null);
        })
      )
      .subscribe({
        next: (bonusType) => {
          if (bonusType && bonusType.enabled && bonusType.bonusAmount !== null && bonusType.bonusAmount !== undefined) {
            this.welcomeBonusAmount = bonusType.bonusAmount;
          } else {
            this.welcomeBonusAmount = 0;
          }
        }
      });
  }

  getModalTitle(): string {
    switch (this.currentStep) {
      case 'form':
        return 'Новый клиент';
      case 'notify':
        return 'Уведомить клиента';
      default:
        return 'Новый клиент';
    }
  }

  onClose(): void {
    this.closeModal();
  }

  closeModal(): void {
    this.resetForm();
    this.visible = false;
    this.visibleChange.emit(false);
  }

  normalizePhone(): void {
    if (!this.clientPhone) return;
    
    // Remove spaces, dashes, parentheses
    let phone = this.clientPhone.trim().replace(/[\s\-\(\)]/g, '');
    
    // Handle different formats: 8xxx -> +7xxx, 7xxx -> +7xxx
    if (phone.startsWith('8') && phone.length >= 11) {
      phone = '+7' + phone.substring(1);
    } else if (phone.startsWith('7') && !phone.startsWith('+') && phone.length >= 11) {
      phone = '+' + phone;
    } else if (!phone.startsWith('+') && phone.length >= 10) {
      phone = '+' + phone;
    }
    
    this.clientPhone = phone;
  }

  createClient(): void {
    if (!this.clientPhone || !this.clientName) {
      this.toastService.error('Заполните обязательные поля');
      return;
    }

    // Normalize phone before creating
    this.normalizePhone();

    this.isLoading = true;

    // Parse tags
    const tags = this.clientTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    // Prepare name/surname
    let name = this.clientName;
    let surname = this.clientSurname;
    if (this.clientType === 'individual' && !surname) {
      const nameParts = this.clientName.trim().split(/\s+/);
      if (nameParts.length > 1) {
        name = nameParts[0];
        surname = nameParts.slice(1).join(' ');
      }
    }

    const createRequest: CreateClientRequest = {
      phone: this.clientPhone,
      name: name,
      surname: surname || undefined,
      dateOfBirth: this.clientBirthday || null,
      notes: this.clientComment || null,
      tags: tags.length > 0 ? tags : undefined,
      clientType: this.clientType === 'business' ? 'BUSINESS' : 'INDIVIDUAL',
      referrerId: null,
      email: this.clientEmail || null
    };

    this.clientsService.createClient(createRequest).subscribe({
      next: (created) => {
        // After creation, fetch client to get actual balance
        this.clientsService.getClientByPhone(this.clientPhone.trim()).subscribe({
          next: (response) => {
            this.createdClient = {
              id: response.clientId,
              name: response.name,
              surname: response.surname,
              phone: this.clientPhone.trim(),
              balance: response.currentBonusBalance || 0,
              type: response.clientType === 'BUSINESS' ? 'business' : 'individual'
            };
            
            // Update welcome bonus amount from actual balance
            if (this.createdClient.balance > 0) {
              this.welcomeBonusAmount = this.createdClient.balance;
            }

            this.isLoading = false;
            this.clientCreated.emit(this.createdClient);
            
            // Load template and go to notify step
            this.loadTemplateAndGoToNotify();
          },
          error: () => {
            // Fallback if fetch fails
            this.createdClient = {
              id: created.id,
              name: created.name,
              surname: created.surname,
              phone: this.clientPhone.trim(),
              balance: this.welcomeBonusAmount,
              type: created.clientType === 'BUSINESS' ? 'business' : 'individual'
            };
            this.isLoading = false;
            this.clientCreated.emit(this.createdClient);
            this.loadTemplateAndGoToNotify();
          }
        });
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка при создании клиента';
        this.toastService.error(errorMessage);
        this.isLoading = false;
      }
    });
  }

  loadTemplateAndGoToNotify(): void {
    if (!this.createdClient) return;

    this.isLoading = true;
    const templateType = 'WELCOME_BONUS';

    // Load template by type
    this.messageTemplatesService.getAllTemplates(templateType).subscribe({
      next: (templates) => {
        if (templates && templates.length > 0) {
          this.selectedWelcomeTemplate = templates[0];
          
          // Get populated message content
          this.messageTemplatesService.getPopulatedTemplate(
            templateType,
            this.createdClient!.id
          ).subscribe({
            next: (populated) => {
              this.populatedMessageContent = populated.populatedContent;
              this.isLoading = false;
              this.currentStep = 'notify';
            },
            error: (err) => {
              console.error('Error loading populated template:', err);
              this.populatedMessageContent = this.getDefaultMessage();
              this.isLoading = false;
              this.currentStep = 'notify';
            }
          });
        } else {
          // No template found
          this.selectedWelcomeTemplate = null;
          this.populatedMessageContent = '';
          this.isLoading = false;
          this.currentStep = 'notify';
        }
      },
      error: (err) => {
        console.error('Error loading template:', err);
        // No template found
        this.selectedWelcomeTemplate = null;
        this.populatedMessageContent = '';
        this.isLoading = false;
        this.currentStep = 'notify';
      }
    });
  }

  getDefaultMessage(): string {
    const clientName = this.createdClient?.name || 'Клиент';
    const bonus = this.welcomeBonusAmount;
    return `Добро пожаловать, ${clientName}! Вам начислено ${bonus} бонусов.`;
  }

  sendWelcomeMessage(): void {
    if (this.isSendingMessage || !this.createdClient) return;

    const phone = this.createdClient.phone;
    const message = this.populatedMessageContent || this.getDefaultMessage();

    if (!phone || !message) {
      this.toastService.error('Не указан номер телефона или сообщение');
      return;
    }

    this.isSendingMessage = true;

    // Send message via API to record it
    this.messagesService.sendMessage({
      clientId: this.createdClient.id,
      messageContent: message,
      channel: 'WHATSAPP'
    }).subscribe({
      next: () => {
        // Open WhatsApp Web
        this.openWhatsAppWeb(phone, message);
        this.toastService.success('Сообщение записано, открывается WhatsApp');
        this.isSendingMessage = false;
        this.closeModal();
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка при отправке сообщения';
        this.toastService.error(errorMessage);
        this.isSendingMessage = false;
      }
    });
  }

  private openWhatsAppWeb(phone: string, message: string): void {
    let cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    if (cleanPhone.startsWith('8')) {
      cleanPhone = '7' + cleanPhone.substring(1);
    }
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }

  skipAndFinish(): void {
    this.closeModal();
  }

  addTag(tag: string): void {
    const currentTags = this.clientTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    
    if (currentTags.includes(tag)) {
      const index = currentTags.indexOf(tag);
      currentTags.splice(index, 1);
    } else {
      currentTags.push(tag);
    }
    
    this.clientTags = currentTags.join(', ');
  }

  isTagSelected(tag: string): boolean {
    const currentTags = this.clientTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    return currentTags.includes(tag);
  }

  private resetForm(): void {
    this.currentStep = 'form';
    this.clientPhone = '';
    this.clientName = '';
    this.clientSurname = '';
    this.clientEmail = '';
    this.clientBirthday = '';
    this.clientType = 'individual';
    this.clientTags = '';
    this.clientComment = '';
    this.showTagsDropdown = false;
    this.createdClient = null;
    this.selectedWelcomeTemplate = null;
    this.populatedMessageContent = '';
    this.isSendingMessage = false;
    this.isLoading = false;
  }
}
